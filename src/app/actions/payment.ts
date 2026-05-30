"use server";

import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

import { supabaseService } from "@/lib/supabase-service";
import { razorpay, ownerShare, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "@/lib/razorpay";
import { confirmPaymentOrder } from "@/lib/confirm-payment";
import { TIME_SLOTS } from "@/lib/data";
import { getTodayStr, toDateStr, isSlotPast } from "@/lib/utils";

type OrderResult =
  | { success: true; orderId: string; amount: number; keyId: string; code: string; customerName: string }
  | { success: false; error: string };

/**
 * Step 1 — create a Razorpay order for a booking, with the owner's payout
 * transfer attached (Route). No booking row is written yet; the intent is
 * stored in payment_orders and only becomes a booking once payment is captured.
 */
export async function createPaymentOrderAction(
  accessToken: string,
  venueId: number,
  rigIds: number[],
  slots: string[],
  bookingDate: string,
): Promise<OrderResult> {
  if (rigIds.length === 0 || slots.length === 0) {
    return { success: false, error: "No rigs or slots selected." };
  }

  // Authenticated customer. The customer session lives in the browser's
  // localStorage (not cookies), so the access token is passed explicitly and
  // verified here with the service-role client — the same pattern the invite
  // and onboarding actions use.
  const { data: { user }, error: authErr } = await supabaseService.auth.getUser(accessToken);
  if (authErr || !user) return { success: false, error: "Please sign in to book." };
  const userId = user.id;

  // ── Validate the booking request (mirrors createAppBookingAction) ──
  const now = new Date();
  const today = getTodayStr();
  if (bookingDate < today) return { success: false, error: "Cannot book for a past date." };

  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + 7);
  if (bookingDate > toDateStr(maxDate)) {
    return { success: false, error: "Cannot book more than 7 days in advance." };
  }

  for (const slot of slots) {
    if (!TIME_SLOTS.includes(slot)) return { success: false, error: "Invalid time slot selected." };
    if (isSlotPast(slot, bookingDate, now)) {
      return { success: false, error: "Cannot book a time slot that has already passed." };
    }
  }

  // Venue + owner payout account + price
  const { data: venue } = await supabaseService
    .from("venues")
    .select("price, owner_id")
    .eq("id", venueId)
    .single();
  if (!venue) return { success: false, error: "Venue not found." };

  // Owner payout account (Razorpay Route) — optional for now. If the venue's
  // owner has a linked account, the payment splits to them; if not, the order
  // is created without a transfer and the money lands in the platform's own
  // Razorpay account (plain Standard Checkout). Re-enabling the marketplace
  // split later needs no code change — just add the linked account.
  let ownerAccountId: string | null = null;
  if (venue.owner_id) {
    const { data: owner } = await supabaseService
      .from("profiles")
      .select("razorpay_account_id")
      .eq("id", venue.owner_id)
      .single();
    ownerAccountId = owner?.razorpay_account_id ?? null;
  }

  // Rigs belong to this venue
  const { data: venueRigs } = await supabaseService.from("rigs").select("id").eq("venue_id", venueId);
  if (!venueRigs) return { success: false, error: "Failed to verify rigs." };
  const venueRigIds = new Set(venueRigs.map((r) => r.id));
  for (const rigId of rigIds) {
    if (!venueRigIds.has(rigId)) {
      return { success: false, error: "Selected rig does not belong to this venue." };
    }
  }

  // No existing bookings for these rig×slot×date
  const { data: conflicts } = await supabaseService
    .from("bookings")
    .select("rig_id")
    .eq("booking_date", bookingDate)
    .in("rig_id", rigIds)
    .in("time_slot", slots);
  if (conflicts && conflicts.length > 0) {
    return { success: false, error: "Some slots were just booked. Please refresh and try again." };
  }

  // Rigs are available
  const { data: rigRows } = await supabaseService.from("rigs").select("id, status").in("id", rigIds);
  if (!rigRows) return { success: false, error: "Failed to verify rig availability." };
  if (rigRows.some((r) => r.status !== "available")) {
    return { success: false, error: "Some rigs are no longer available. Please refresh and try again." };
  }

  // Customer name for the eventual booking + checkout prefill
  let customerName = "Online User";
  const { data: profile } = await supabaseService
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  if (profile?.full_name) customerName = profile.full_name;

  // ── Amount + Razorpay order with owner transfer ──
  const amount = rigIds.length * slots.length * venue.price * 100; // paise
  const code = `APP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  let orderId: string;
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: code,
      payment_capture: true,
      // Route transfer only when the owner has a linked account.
      ...(ownerAccountId
        ? {
            transfers: [
              { account: ownerAccountId, amount: ownerShare(amount), currency: "INR" },
            ],
          }
        : {}),
      notes: { verification_code: code, venue_id: String(venueId) },
    });
    orderId = order.id;
  } catch (err) {
    console.error("Razorpay order create failed:", err);
    return { success: false, error: "Could not start payment. Please try again." };
  }

  // Persist the booking intent (idempotency anchor for verify + webhook)
  const { error: insertErr } = await supabaseService.from("payment_orders").insert({
    razorpay_order_id: orderId,
    user_id: userId,
    venue_id: venueId,
    rig_ids: rigIds,
    slots,
    booking_date: bookingDate,
    customer_name: customerName,
    amount,
    verification_code: code,
    status: "created",
  });
  if (insertErr) {
    console.error("payment_orders insert failed:", insertErr);
    return { success: false, error: "Could not start payment. Please try again." };
  }

  return { success: true, orderId, amount, keyId: RAZORPAY_KEY_ID, code, customerName };
}

/**
 * Step 2 — verify the Checkout signature and confirm the booking.
 * The webhook (payment.captured) is the authoritative backstop; this gives
 * the paying user an immediate result. Both funnel through confirmPaymentOrder,
 * which is idempotent.
 */
export async function verifyPaymentAction(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<{ success: boolean; error?: string; code?: string }> {
  const valid = validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    signature,
    RAZORPAY_KEY_SECRET,
  );
  if (!valid) return { success: false, error: "Payment verification failed." };

  return confirmPaymentOrder(orderId, paymentId);
}

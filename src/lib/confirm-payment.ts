import { supabaseService } from "@/lib/supabase-service";
import { razorpay } from "@/lib/razorpay";

/**
 * Turns a *captured* payment into booking rows exactly once.
 *
 * This is deliberately NOT a server action — it lives outside any "use server"
 * module so it can never be invoked directly from the client. It is reached
 * only after signature verification (the verify action) or webhook-signature
 * verification (the Razorpay webhook). Both callers are trusted server code.
 *
 * Idempotent: a single-writer claim (status created -> paid) lets the verify
 * action and the webhook race without producing a double insert.
 */
export async function confirmPaymentOrder(
  orderId: string,
  paymentId: string,
): Promise<{ success: boolean; error?: string; code?: string }> {
  const { data: order } = await supabaseService
    .from("payment_orders")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .single();

  if (!order) return { success: false, error: "Order not found." };
  if (order.status === "paid") return { success: true, code: order.verification_code };
  if (order.status === "failed") return { success: false, error: "This payment could not be completed." };

  // Atomically claim the order: only the writer that flips created -> paid
  // proceeds to insert the booking. The other caller (verify or webhook) gets
  // an empty result and returns the already-confirmed code idempotently.
  const { data: claimed } = await supabaseService
    .from("payment_orders")
    .update({ status: "paid", razorpay_payment_id: paymentId })
    .eq("razorpay_order_id", orderId)
    .eq("status", "created")
    .select("id");

  if (!claimed || claimed.length === 0) {
    return { success: true, code: order.verification_code };
  }

  // Create the booking rows (one per rig × slot), keyed to this payment.
  const checkInToken = crypto.randomUUID();
  const rows = (order.rig_ids as number[]).flatMap((rigId) =>
    (order.slots as string[]).map((slot) => ({
      rig_id: rigId,
      customer_name: order.customer_name ?? "Online User",
      time_slot: slot,
      booking_date: order.booking_date,
      verification_code: order.verification_code,
      source: "app" as const,
      check_in_token: checkInToken,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      ...(order.user_id ? { user_id: order.user_id } : {}),
    })),
  );

  const { error: insertErr } = await supabaseService.from("bookings").insert(rows);
  if (insertErr) {
    // The slot was taken between order creation and capture (unique constraint).
    // The customer was charged for a slot we can't honour — refund in full.
    if (insertErr.code === "23505") {
      try {
        await razorpay.payments.refund(paymentId, { amount: order.amount });
      } catch (refundErr) {
        console.error("Refund after booking conflict failed:", orderId, refundErr);
      }
      await supabaseService
        .from("payment_orders")
        .update({ status: "failed" })
        .eq("razorpay_order_id", orderId);
      return { success: false, error: "That slot was just taken — your payment has been refunded." };
    }
    console.error("Booking insert after payment failed:", orderId, insertErr);
    return { success: false, error: "Booking could not be saved. Please contact support." };
  }

  return { success: true, code: order.verification_code };
}

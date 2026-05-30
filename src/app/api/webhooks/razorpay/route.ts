import { NextRequest } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";

import { confirmPaymentOrder } from "@/lib/confirm-payment";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

/**
 * Razorpay webhook — the authoritative confirmation of a payment.
 * Verifies the signature against the RAW body, then turns a captured payment
 * into a booking via the same idempotent path the verify action uses, so a
 * dropped client (closed tab after paying) still gets its booking.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  let valid = false;
  try {
    valid = validateWebhookSignature(rawBody, signature, webhookSecret);
  } catch {
    valid = false;
  }
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const orderId: string | undefined = payment?.order_id;
    const paymentId: string | undefined = payment?.id;
    if (orderId && paymentId) {
      const result = await confirmPaymentOrder(orderId, paymentId);
      if (!result.success) {
        // Log but still 200 — retrying won't change a conflict/refund outcome.
        console.error("Webhook confirm failed:", orderId, result.error);
      }
    }
  }

  // Always acknowledge handled events so Razorpay stops retrying.
  return new Response("ok", { status: 200 });
}

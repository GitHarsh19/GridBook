import Razorpay from "razorpay";

/**
 * Server-only Razorpay client (Route-enabled account).
 * Never import this from a client component — it carries the key secret.
 */

const keyId = process.env.RAZORPAY_KEY_ID!;
const keySecret = process.env.RAZORPAY_KEY_SECRET!;

export const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

/** Key secret — used for signature verification in server actions / webhook. */
export const RAZORPAY_KEY_SECRET = keySecret;

/** Public key id — safe to hand to the browser for Checkout. */
export const RAZORPAY_KEY_ID = keyId;

/**
 * How much of a booking's total (in paise) is transferred to the venue owner.
 * v1: owner receives 100% — PitPass takes no commission yet.
 * To enable a cut later, change ONLY this function, e.g.:
 *   return Math.round(totalPaise * 0.90);   // 10% platform commission
 * Nothing else in the payment flow needs to change.
 */
export function ownerShare(totalPaise: number): number {
  return totalPaise;
}

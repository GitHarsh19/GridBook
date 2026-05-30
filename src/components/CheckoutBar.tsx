"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Loader2, AlertCircle, CalendarCheck } from "lucide-react";
import type { Rig } from "@/lib/data";
import { getBookedRigIdsForSlots } from "@/lib/data";
import { createPaymentOrderAction, verifyPaymentAction } from "@/app/actions/payment";
import { supabase } from "@/lib/supabase";
import { formatBookingDate } from "@/lib/utils";

/* ─── Razorpay Checkout (loaded on demand) ─────────────────────────── */

interface RazorpayHandlerResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id: string;
    prefill?: { name?: string; email?: string };
    theme?: { color?: string };
    handler: (response: RazorpayHandlerResponse) => void;
    modal?: { ondismiss?: () => void };
}

interface RazorpayFailureResponse {
    error?: { code?: string; description?: string; reason?: string };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
    interface Window {
        Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === "undefined") return resolve(false);
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = RAZORPAY_SCRIPT;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export function CheckoutBar({
    venueId,
    selectedRigs,
    selectedSlots,
    rigs,
    price,
    bookingDate,
    onBookingComplete,
    onConflict,
}: {
    venueId: number;
    selectedRigs: number[];
    selectedSlots: string[];
    rigs: Rig[];
    price: number;
    bookingDate: string;
    onBookingComplete: (code: string) => void;
    onConflict: () => void;
}) {
    const [payState, setPayState] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [verificationCode, setVerificationCode] = useState("");

    if (selectedRigs.length === 0) return null;

    const selectedNames = selectedRigs
        .map((id) => rigs.find((r) => r.id === id)?.name)
        .filter(Boolean)
        .join(", ");
    const slotCount = Math.max(selectedSlots.length, 1);
    const total = selectedRigs.length * price * slotCount;
    const hasSlots = selectedSlots.length > 0;

    const failWith = (msg: string, ms = 4000) => {
        setErrorMsg(msg);
        setPayState("error");
        setTimeout(() => setPayState("idle"), ms);
    };

    const handlePay = async () => {
        if (payState !== "idle") return;
        setPayState("loading");
        setErrorMsg("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                failWith("Please sign in to book slots.", 3000);
                return;
            }

            // Re-validate availability right before paying to catch race conditions
            const freshBooked = await getBookedRigIdsForSlots(venueId, selectedSlots, bookingDate);
            const conflicted = selectedRigs.filter((id) => freshBooked.has(id));
            if (conflicted.length > 0) {
                const conflictedNames = conflicted
                    .map((id) => rigs.find((r) => r.id === id)?.name)
                    .filter(Boolean)
                    .join(", ");
                onConflict();
                failWith(`${conflictedNames} just got booked. Please select a different rig.`);
                return;
            }

            // 1. Create the Razorpay order (booking is written only after payment).
            //    Pass the access token explicitly — the customer session lives in
            //    localStorage, so a cookie-based server session won't see it.
            const order = await createPaymentOrderAction(
                session.access_token, venueId, selectedRigs, selectedSlots, bookingDate,
            );
            if (!order.success) {
                onConflict();
                failWith(order.error);
                return;
            }

            // 2. Open Razorpay Checkout
            const ok = await loadRazorpay();
            if (!ok || !window.Razorpay) {
                failWith("Couldn't load the payment window. Check your connection and try again.");
                return;
            }

            const rzp = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: "INR",
                name: "PitPass",
                description: "Rig booking",
                order_id: order.orderId,
                prefill: { name: order.customerName, email: session.user.email ?? undefined },
                theme: { color: "#e23838" },
                handler: async (response) => {
                    // 3. Verify the signature server-side, then confirm the booking
                    setPayState("loading");
                    const result = await verifyPaymentAction(
                        response.razorpay_order_id,
                        response.razorpay_payment_id,
                        response.razorpay_signature,
                    );
                    if (result.success && result.code) {
                        setVerificationCode(result.code);
                        setPayState("done");
                        onBookingComplete(result.code);
                    } else {
                        onConflict();
                        failWith(result.error ?? "Payment verification failed.");
                    }
                },
                modal: {
                    // User closed the Razorpay modal without paying
                    ondismiss: () => setPayState("idle"),
                },
            });
            // Surface Razorpay's own failure reason (declined card, expired key, etc.)
            rzp.on("payment.failed", (resp) => {
                console.error("[checkout] payment.failed:", resp?.error);
                onConflict();
                failWith(resp?.error?.description ?? "Payment failed. Please try again.", 6000);
            });
            rzp.open();
        } catch (err) {
            console.error("[checkout] handlePay error:", err);
            failWith(err instanceof Error ? err.message : "Something went wrong. Please try again.", 6000);
        }
    };

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom font-outfit"
            style={{ background: "rgba(19,19,19,0.85)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
            role="status"
            aria-live="polite"
        >
            <div className="mx-auto flex max-w-[var(--max-width-container)] flex-col gap-4 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-sm text-on-surface-variant/60">
                        <span className="font-semibold text-on-surface">{selectedNames}</span>
                        {hasSlots && (
                            <span>
                                {" "}&middot; {slotCount} {slotCount === 1 ? "slot" : "slots"}
                                {" "}&middot; {formatBookingDate(bookingDate)}
                            </span>
                        )}
                    </div>
                    <div className="mt-1 font-black tracking-tight text-on-surface" style={{ fontSize: "1.5rem" }}>
                        ₹{total.toLocaleString("en-IN")}
                        {!hasSlots && (
                            <span className="ml-3 text-xs font-normal text-on-surface-variant/40">
                                Select a time slot to book
                            </span>
                        )}
                    </div>
                    {payState === "done" && verificationCode && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                            <span>Code: <span className="font-mono font-bold">{verificationCode}</span></span>
                            <Link
                                href={`/bookings/${verificationCode}`}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            >
                                <CalendarCheck className="h-3 w-3" />
                                View Confirmation
                            </Link>
                        </div>
                    )}
                    {payState === "error" && errorMsg && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-btn-red">
                            <AlertCircle className="h-3 w-3" />
                            {errorMsg}
                        </div>
                    )}
                </div>

                <button
                    disabled={!hasSlots || payState !== "idle"}
                    onClick={handlePay}
                    className={`flex w-full items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium tracking-[-0.03em] transition-all duration-300 sm:w-auto ${
                        payState === "done"
                            ? "bg-emerald-500 text-white"
                            : payState === "error"
                                ? "bg-btn-red/20 text-btn-red"
                                : hasSlots && payState === "idle"
                                    ? "cursor-pointer bg-btn-red text-white hover:bg-white hover:text-btn-red active:scale-[0.98]"
                                    : "cursor-not-allowed bg-surface-container text-on-surface-variant/30"
                    }`}
                >
                    {payState === "loading" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Booking…</>
                    ) : payState === "done" ? (
                        <><Check className="h-4 w-4" />Booking Confirmed!</>
                    ) : payState === "error" ? (
                        <><AlertCircle className="h-4 w-4" />Booking Failed</>
                    ) : (
                        <><ShoppingCart className="h-4 w-4" />{hasSlots ? "Pay to Lock Slots" : "Select time slots first"}</>
                    )}
                </button>
            </div>
        </div>
    );
}

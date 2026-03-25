"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Loader2, AlertCircle, CalendarCheck } from "lucide-react";
import type { Rig } from "@/lib/data";
import { createAppBooking } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { formatBookingDate } from "@/lib/utils";

export function CheckoutBar({
    venueId,
    selectedRigs,
    selectedSlots,
    rigs,
    price,
    bookingDate,
    onBookingComplete,
}: {
    venueId: number;
    selectedRigs: number[];
    selectedSlots: string[];
    rigs: Rig[];
    price: number;
    bookingDate: string;
    onBookingComplete: (code: string) => void;
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

    const handlePay = async () => {
        if (payState !== "idle") return;
        setPayState("loading");
        setErrorMsg("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setErrorMsg("Please sign in to book slots.");
                setPayState("error");
                setTimeout(() => setPayState("idle"), 3000);
                return;
            }

            let customerName = "Online User";
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", session.user.id)
                .single();
            if (profile?.full_name) customerName = profile.full_name;

            const result = await createAppBooking(
                venueId, selectedRigs, selectedSlots, bookingDate, customerName, session.user.id,
            );

            if (!result.success) {
                setErrorMsg(result.error ?? "Booking failed.");
                setPayState("error");
                setTimeout(() => setPayState("idle"), 3000);
                return;
            }

            setVerificationCode(result.verificationCode ?? "");
            setPayState("done");
            onBookingComplete(result.verificationCode ?? "");
        } catch {
            setErrorMsg("Something went wrong. Please try again.");
            setPayState("error");
            setTimeout(() => setPayState("idle"), 3000);
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
                        <><ShoppingCart className="h-4 w-4" />{hasSlots ? "Pay via UPI to Lock Slots" : "Select time slots first"}</>
                    )}
                </button>
            </div>
        </div>
    );
}

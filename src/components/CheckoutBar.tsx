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
            // Require login to book
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setErrorMsg("Please sign in to book slots.");
                setPayState("error");
                setTimeout(() => setPayState("idle"), 3000);
                return;
            }

            // Get customer name from profile
            let customerName = "Online User";
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", session.user.id)
                .single();
            if (profile?.full_name) {
                customerName = profile.full_name;
            }

            const result = await createAppBooking(
                venueId,
                selectedRigs,
                selectedSlots,
                bookingDate,
                customerName,
                session.user.id,
            );

            if (!result.success) {
                setErrorMsg(result.error ?? "Booking failed.");
                setPayState("error");
                setTimeout(() => setPayState("idle"), 3000);
                return;
            }

            setVerificationCode(result.verificationCode ?? "");
            setPayState("done");
            // Increased timeout to 5s so users have time to see code + click link
            setTimeout(() => {
                onBookingComplete(result.verificationCode ?? "");
                setPayState("idle");
            }, 5000);
        } catch {
            setErrorMsg("Something went wrong. Please try again.");
            setPayState("error");
            setTimeout(() => setPayState("idle"), 3000);
        }
    };

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm animate-in slide-in-from-bottom"
            role="status"
            aria-live="polite"
        >
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                    <div className="text-zinc-400">
                        <span className="font-medium text-white">{selectedNames}</span>
                        {hasSlots && (
                            <span className="text-zinc-500">
                                {" "}&middot; {slotCount} {slotCount === 1 ? "slot" : "slots"}
                                {" "}&middot; {formatBookingDate(bookingDate)}
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-white">
                        ₹{total.toLocaleString("en-IN")}
                        {!hasSlots && (
                            <span className="ml-2 text-xs font-normal text-zinc-500">
                                Select a time slot to book
                            </span>
                        )}
                    </div>
                    {payState === "done" && verificationCode && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                            <span>
                                Code: <span className="font-mono font-bold">{verificationCode}</span>
                            </span>
                            <Link
                                href="/bookings"
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
                            >
                                <CalendarCheck className="h-3 w-3" />
                                View Bookings
                            </Link>
                        </div>
                    )}
                    {payState === "error" && errorMsg && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {errorMsg}
                        </div>
                    )}
                </div>
                <button
                    disabled={!hasSlots || payState !== "idle"}
                    onClick={handlePay}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-all sm:w-auto ${
                        payState === "done"
                            ? "bg-emerald-500 text-black"
                            : payState === "error"
                                ? "bg-red-500/20 text-red-400"
                                : hasSlots && payState === "idle"
                                    ? "cursor-pointer bg-cyan-500 text-black hover:bg-cyan-400 active:scale-[0.98]"
                                    : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                    }`}
                >
                    {payState === "loading" ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Booking…
                        </>
                    ) : payState === "done" ? (
                        <>
                            <Check className="h-4 w-4" />
                            Booking Confirmed!
                        </>
                    ) : payState === "error" ? (
                        <>
                            <AlertCircle className="h-4 w-4" />
                            Booking Failed
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="h-4 w-4" />
                            {hasSlots ? "Pay via UPI to Lock Slots" : "Select time slots first"}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

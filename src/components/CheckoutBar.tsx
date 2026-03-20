"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2, AlertCircle } from "lucide-react";
import type { Rig } from "@/lib/data";
import { createAppBooking } from "@/lib/data";
import { supabase } from "@/lib/supabase";

function formatBookingDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (dateStr === today) return "Today";
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    if (dateStr === tomorrowStr) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

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
            );

            if (!result.success) {
                setErrorMsg(result.error ?? "Booking failed.");
                setPayState("error");
                setTimeout(() => setPayState("idle"), 3000);
                return;
            }

            setVerificationCode(result.verificationCode ?? "");
            setPayState("done");
            setTimeout(() => {
                onBookingComplete(result.verificationCode ?? "");
                setPayState("idle");
            }, 3000);
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
                        <div className="mt-1 text-xs text-emerald-400">
                            Verification Code: <span className="font-mono font-bold">{verificationCode}</span>
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

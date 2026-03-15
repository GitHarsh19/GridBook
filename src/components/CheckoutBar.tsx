import { ShoppingCart } from "lucide-react";
import type { Rig } from "@/lib/data";

export function CheckoutBar({
    selectedRigs,
    selectedSlots,
    rigs,
    price,
}: {
    selectedRigs: number[];
    selectedSlots: string[];
    rigs: Rig[];
    price: number;
}) {
    if (selectedRigs.length === 0) return null;

    const selectedNames = selectedRigs
        .map((id) => rigs.find((r) => r.id === id)?.name)
        .filter(Boolean)
        .join(", ");
    const slotCount = Math.max(selectedSlots.length, 1);
    const total = selectedRigs.length * price * slotCount;
    const hasSlots = selectedSlots.length > 0;

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
                </div>
                <button
                    disabled={!hasSlots}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-all sm:w-auto ${
                        hasSlots
                            ? "cursor-pointer bg-cyan-500 text-black hover:bg-cyan-400 active:scale-[0.98]"
                            : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                    }`}
                >
                    <ShoppingCart className="h-4 w-4" />
                    {hasSlots ? "Pay via UPI to Lock Slots" : "Select time slots first"}
                </button>
            </div>
        </div>
    );
}

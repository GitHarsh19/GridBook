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

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                    <div className="text-zinc-400">
                        Selected:{" "}
                        <span className="font-medium text-white">{selectedNames}</span>
                        {selectedSlots.length > 0 && (
                            <span className="text-zinc-500">
                                {" "}· {slotCount} {slotCount === 1 ? "slot" : "slots"}
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-white">
                        Total: ₹{total.toLocaleString("en-IN")}
                    </div>
                </div>
                <button className="w-full rounded-lg bg-cyan-500 px-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98] sm:w-auto">
                    Pay via UPI to Lock Slots
                </button>
            </div>
        </div>
    );
}

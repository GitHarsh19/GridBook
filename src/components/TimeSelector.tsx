"use client";

import { useRef } from "react";
import { Clock, X } from "lucide-react";
import { TIME_SLOTS } from "@/lib/data";

export function TimeSelector({
    selectedSlots,
    onToggle,
    onClear,
}: {
    selectedSlots: string[];
    onToggle: (slot: string) => void;
    onClear: () => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Clock className="h-4 w-4" />
                Select Time Slots
                {selectedSlots.length > 0 && (
                    <button
                        onClick={onClear}
                        className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                        <X className="h-3 w-3" />
                        Clear Selection
                    </button>
                )}
            </div>
            <div
                ref={scrollRef}
                className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 pr-4"
            >
                {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                        <button
                            key={slot}
                            onClick={() => onToggle(slot)}
                            className={`shrink-0 cursor-pointer rounded-md border px-4 py-2.5 text-sm font-medium transition-all ${isSelected
                                    ? "border-cyan-500 bg-cyan-500 text-black"
                                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white"
                                }`}
                        >
                            {slot}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

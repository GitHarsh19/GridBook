"use client";

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
    return (
        <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Clock className="h-4 w-4" />
                Select Time Slots
                {selectedSlots.length > 0 && (
                    <span className="ml-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                        {selectedSlots.length} selected
                    </span>
                )}
                {selectedSlots.length > 0 && (
                    <button
                        onClick={onClear}
                        className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Scroll container with fade edges */}
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-950 to-transparent" />
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 pr-8">
                    {TIME_SLOTS.map((slot) => {
                        const isSelected = selectedSlots.includes(slot);
                        return (
                            <button
                                key={slot}
                                onClick={() => onToggle(slot)}
                                aria-pressed={isSelected}
                                className={`shrink-0 cursor-pointer rounded-md border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                                    isSelected
                                        ? "border-cyan-500 bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white"
                                }`}
                            >
                                {slot}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

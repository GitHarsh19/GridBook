"use client";

import { Monitor, X } from "lucide-react";
import type { Rig } from "@/lib/data";

export function RigGrid({
    rigs,
    selectedRigs,
    onToggle,
    onClear,
    bookedRigIds,
}: {
    rigs: Rig[];
    selectedRigs: number[];
    onToggle: (id: number) => void;
    onClear: () => void;
    /** Rig IDs booked for the currently selected time slots (overrides flat status) */
    bookedRigIds?: Set<number>;
}) {
    return (
        <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Monitor className="h-4 w-4" />
                Select Rigs
                {selectedRigs.length > 0 && (
                    <span className="ml-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                        {selectedRigs.length} selected
                    </span>
                )}
            </div>

            {/* Legend */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded border border-zinc-700" />
                    Available
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-cyan-500" />
                    Selected
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-zinc-800" />
                    Booked
                </div>
                {selectedRigs.length > 0 && (
                    <button
                        onClick={onClear}
                        className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {rigs.map((rig) => {
                    const isSelected = selectedRigs.includes(rig.id);
                    // When time slots are selected, use per-slot booking data;
                    // otherwise fall back to the flat rig status
                    const isBooked = bookedRigIds
                        ? bookedRigIds.has(rig.id) || rig.status === "booked"
                        : rig.status === "booked";

                    return (
                        <button
                            key={rig.id}
                            disabled={isBooked}
                            onClick={() => onToggle(rig.id)}
                            aria-pressed={isSelected}
                            aria-label={`${rig.name} — ${rig.specs}${isBooked ? " (booked)" : ""}`}
                            className={`relative flex min-h-[90px] flex-col items-center justify-center rounded-lg border p-3 text-center transition-all duration-150 ${
                                isBooked
                                    ? "cursor-not-allowed border-zinc-800/50 bg-zinc-800/40 text-zinc-600"
                                    : isSelected
                                        ? "cursor-pointer border-cyan-500 bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 scale-[1.02]"
                                        : "cursor-pointer border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-cyan-500/50 hover:bg-zinc-800/80 hover:scale-[1.02]"
                            }`}
                        >
                            <Monitor
                                className={`mb-1.5 h-5 w-5 ${
                                    isBooked
                                        ? "text-zinc-700"
                                        : isSelected
                                            ? "text-black"
                                            : "text-zinc-500"
                                }`}
                            />
                            <span className="text-sm font-semibold">{rig.name}</span>
                            <span
                                className={`mt-0.5 text-[10px] leading-tight ${
                                    isBooked
                                        ? "text-zinc-700"
                                        : isSelected
                                            ? "text-black/70"
                                            : "text-zinc-500"
                                }`}
                            >
                                {rig.specs}
                            </span>
                            {isBooked && (
                                <div className="absolute right-1.5 top-1.5">
                                    <X className="h-3 w-3 text-zinc-700" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

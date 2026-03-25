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
    bookedRigIds?: Set<number>;
}) {
    return (
        <div>
            <div className="mb-4 flex items-center gap-3 font-outfit">
                <p className="text-sm font-semibold uppercase tracking-widest text-btn-red">
                    Select Rigs
                </p>
                {selectedRigs.length > 0 && (
                    <span className="rounded-full bg-btn-red/10 px-2.5 py-0.5 text-xs font-semibold text-btn-red">
                        {selectedRigs.length} selected
                    </span>
                )}
                {selectedRigs.length > 0 && (
                    <button
                        onClick={onClear}
                        className="ml-auto flex cursor-pointer items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant/60 transition-colors hover:bg-btn-red/10 hover:text-btn-red"
                    >
                        <X className="h-3 w-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="mb-5 flex flex-wrap items-center gap-4 font-outfit text-xs text-on-surface-variant/50">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-md bg-surface-container-high" />
                    Available
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-md bg-btn-red" />
                    Selected
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-md bg-surface-container-lowest" />
                    Booked
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {rigs.map((rig) => {
                    const isSelected = selectedRigs.includes(rig.id);
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
                            className={`relative flex min-h-[100px] flex-col items-center justify-center rounded-2xl p-4 font-outfit text-center transition-all duration-150 ${
                                isBooked
                                    ? "cursor-not-allowed bg-surface-container-lowest text-on-surface-variant/20"
                                    : isSelected
                                        ? "cursor-pointer bg-btn-red text-white scale-[1.02]"
                                        : "cursor-pointer bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                            style={isSelected ? { boxShadow: "0 4px 20px rgba(217,51,29,0.25)" } : {}}
                        >
                            <Monitor
                                className={`mb-2 h-5 w-5 ${
                                    isBooked
                                        ? "text-on-surface-variant/15"
                                        : isSelected
                                            ? "text-white/80"
                                            : "text-on-surface-variant/50"
                                }`}
                            />
                            <span className="text-sm font-bold">{rig.name}</span>
                            <span
                                className={`mt-0.5 text-[10px] leading-tight ${
                                    isBooked
                                        ? "text-on-surface-variant/15"
                                        : isSelected
                                            ? "text-white/60"
                                            : "text-on-surface-variant/40"
                                }`}
                            >
                                {rig.specs}
                            </span>
                            {isBooked && (
                                <div className="absolute right-2 top-2">
                                    <X className="h-3 w-3 text-on-surface-variant/20" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

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
    const availableCount = rigs.filter((rig) => {
        const isBooked = bookedRigIds
            ? bookedRigIds.has(rig.id) || rig.status !== "available"
            : rig.status !== "available";
        return !isBooked;
    }).length;

    return (
        <div>
            <div className="mb-4 flex items-center gap-3 font-outfit">
                <p className="text-sm font-semibold uppercase tracking-widest text-btn-red">
                    Select Rigs
                </p>
                <span className="rounded-full bg-on-surface-variant/5 px-2.5 py-0.5 text-xs font-medium text-on-surface-variant/50">
                    {availableCount} of {rigs.length} available
                </span>
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

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {rigs.map((rig) => {
                    const isSelected = selectedRigs.includes(rig.id);
                    const isBooked = bookedRigIds
                        ? bookedRigIds.has(rig.id) || rig.status !== "available"
                        : rig.status !== "available";
                    const isUnavailable = isBooked;

                    return (
                        <button
                            key={rig.id}
                            disabled={isUnavailable}
                            onClick={() => onToggle(rig.id)}
                            aria-pressed={isSelected}
                            aria-label={`${rig.name} — ${rig.specs}${isBooked ? " (booked)" : ""}`}
                            className={`relative flex min-h-[100px] flex-col items-center justify-center rounded-2xl p-4 font-outfit text-center transition-all duration-150 border ${
                                isUnavailable
                                    ? "cursor-not-allowed border-transparent bg-surface-container-lowest text-on-surface-variant/20"
                                    : isSelected
                                        ? "cursor-pointer border-btn-red bg-btn-red text-white scale-[1.02]"
                                        : "cursor-pointer border-on-surface-variant/10 bg-surface-container text-on-surface-variant hover:border-on-surface-variant/30 hover:bg-surface-container-high hover:text-on-surface hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                            style={isSelected ? { boxShadow: "0 4px 20px rgba(217,51,29,0.25)" } : {}}
                        >
                            {/* Booked tag — only shown on unavailable rigs */}
                            {isBooked && (
                                <span className="absolute left-2.5 top-2.5 rounded-md bg-on-surface-variant/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-on-surface-variant/25">
                                    Booked
                                </span>
                            )}

                            <Monitor
                                className={`mb-2 h-5 w-5 ${
                                    isUnavailable
                                        ? "text-on-surface-variant/15"
                                        : isSelected
                                            ? "text-white/80"
                                            : "text-on-surface-variant/50"
                                }`}
                            />
                            <span className="text-sm font-bold">{rig.name}</span>
                            <span
                                className={`mt-0.5 text-[10px] leading-tight ${
                                    isUnavailable
                                        ? "text-on-surface-variant/15"
                                        : isSelected
                                            ? "text-white/60"
                                            : "text-on-surface-variant/40"
                                }`}
                            >
                                {rig.specs}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

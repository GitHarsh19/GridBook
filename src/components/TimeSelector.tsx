"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { TIME_SLOTS } from "@/lib/data";

export function TimeSelector({
    selectedSlots,
    onToggle,
    onClear,
    disabledSlots,
}: {
    selectedSlots: string[];
    onToggle: (slot: string) => void;
    onClear: () => void;
    disabledSlots?: Set<string>;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollState();
        el.addEventListener("scroll", updateScrollState, { passive: true });
        return () => el.removeEventListener("scroll", updateScrollState);
    }, [updateScrollState]);

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
    };

    return (
        <div>
            {/* Header row */}
            <div className="mb-4 flex items-center gap-3 font-outfit">
                <p className="text-sm font-semibold uppercase tracking-widest text-btn-red">
                    Select Time Slots
                </p>
                {selectedSlots.length > 0 && (
                    <span className="rounded-full bg-btn-red/10 px-2.5 py-0.5 text-xs font-semibold text-btn-red">
                        {selectedSlots.length} selected
                    </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {selectedSlots.length > 0 && (
                        <button
                            onClick={onClear}
                            className="flex cursor-pointer items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant/60 transition-colors hover:bg-btn-red/10 hover:text-btn-red"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        aria-label="Scroll left"
                        className="flex h-7 w-9 items-center justify-center rounded-lg bg-surface-container transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-25 enabled:cursor-pointer enabled:text-on-surface-variant/60 enabled:hover:bg-white enabled:hover:text-surface enabled:active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        aria-label="Scroll right"
                        className="flex h-7 w-9 items-center justify-center rounded-lg bg-surface-container transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-25 enabled:cursor-pointer enabled:text-on-surface-variant/60 enabled:hover:bg-white enabled:hover:text-surface enabled:active:scale-95"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Scrollable slots */}
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent" />
                <div ref={scrollRef} className="hide-scrollbar flex gap-2.5 overflow-x-auto pb-2 pr-8">
                    {TIME_SLOTS.map((slot) => {
                        const isSelected = selectedSlots.includes(slot);
                        const isPast = disabledSlots?.has(slot) ?? false;
                        return (
                            <button
                                key={slot}
                                onClick={() => !isPast && onToggle(slot)}
                                disabled={isPast}
                                aria-pressed={isSelected}
                                className={`shrink-0 rounded-2xl px-4 py-2.5 font-outfit text-sm font-medium transition-all duration-150 ${
                                    isPast
                                        ? "cursor-not-allowed bg-surface-container/40 text-on-surface-variant/20 line-through"
                                        : isSelected
                                            ? "cursor-pointer bg-btn-red text-white active:scale-[0.97]"
                                            : "cursor-pointer bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-[0.97]"
                                }`}
                                style={isSelected ? { boxShadow: "0 4px 16px rgba(217,51,29,0.25)" } : {}}
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


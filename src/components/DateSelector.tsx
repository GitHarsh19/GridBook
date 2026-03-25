"use client";

import { CalendarDays } from "lucide-react";
import { getUpcomingDates, formatDateLabel, formatMonthYear } from "@/lib/utils";

export function DateSelector({
    selectedDate,
    onSelect,
}: {
    selectedDate: string;
    onSelect: (date: string) => void;
}) {
    const dates = getUpcomingDates(7);

    return (
        <div>
            <div className="mb-4 flex items-center gap-2 font-outfit">
                <p className="text-sm font-semibold uppercase tracking-widest text-btn-red">
                    Select Date
                </p>
                <span className="text-xs text-on-surface-variant/40">
                    {formatMonthYear(selectedDate)}
                </span>
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-surface to-transparent" />
                <div className="hide-scrollbar flex gap-2.5 overflow-x-auto pb-2 pr-10">
                    {dates.map((dateStr, i) => {
                        const isSelected = selectedDate === dateStr;
                        const { day, date } = formatDateLabel(dateStr, i);
                        return (
                            <button
                                key={dateStr}
                                onClick={() => onSelect(dateStr)}
                                aria-pressed={isSelected}
                                className={`flex shrink-0 cursor-pointer flex-col items-center rounded-2xl px-5 py-3 font-outfit text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
                                    isSelected
                                        ? "bg-btn-red text-white shadow-lg"
                                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                                }`}
                                style={isSelected ? { boxShadow: "0 4px 20px rgba(217,51,29,0.3)" } : {}}
                            >
                                <span className="text-[10px] uppercase tracking-wider opacity-70">{day}</span>
                                <span className="text-xl font-black leading-tight">{date}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

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
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                <CalendarDays className="h-4 w-4" />
                Select Date
                <span className="ml-1 text-xs text-zinc-600">
                    {formatMonthYear(selectedDate)}
                </span>
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-950 to-transparent" />
                <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 pr-8">
                    {dates.map((dateStr, i) => {
                        const isSelected = selectedDate === dateStr;
                        const { day, date } = formatDateLabel(dateStr, i);
                        return (
                            <button
                                key={dateStr}
                                onClick={() => onSelect(dateStr)}
                                aria-pressed={isSelected}
                                className={`flex shrink-0 cursor-pointer flex-col items-center rounded-md border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                                    isSelected
                                        ? "border-cyan-500 bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white"
                                }`}
                            >
                                <span className="text-[10px] uppercase tracking-wider opacity-70">
                                    {day}
                                </span>
                                <span className="text-lg font-bold leading-tight">
                                    {date}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

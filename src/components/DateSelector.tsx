"use client";

import { CalendarDays } from "lucide-react";

/**
 * Returns the next `count` days starting from today as YYYY-MM-DD strings.
 */
function getUpcomingDates(count: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        dates.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        );
    }
    return dates;
}

function formatDateLabel(dateStr: string, index: number): { day: string; date: string } {
    const d = new Date(dateStr + "T00:00:00");
    if (index === 0) return { day: "Today", date: String(d.getDate()) };
    if (index === 1) return { day: "Tomorrow", date: String(d.getDate()) };
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dateNum = String(d.getDate());
    return { day: dayName, date: dateNum };
}

function formatMonthYear(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

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

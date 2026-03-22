"use client";

import { useState, useMemo } from "react";
import { X, Loader2, AlertCircle, CalendarCheck } from "lucide-react";
import { TIME_SLOTS, modifyBooking } from "@/lib/data";
import { getUpcomingDates, formatDateLabel, formatMonthYear, parseSlotStartHour, getTodayStr } from "@/lib/utils";

interface ModifyBookingModalProps {
    verificationCode: string;
    userId: string;
    currentDate: string;
    currentSlots: string[];
    onClose: () => void;
    onSuccess: () => void;
}

export function ModifyBookingModal({
    verificationCode,
    userId,
    currentDate,
    currentSlots,
    onClose,
    onSuccess,
}: ModifyBookingModalProps) {
    const dates = useMemo(() => getUpcomingDates(7), []);
    const [selectedDate, setSelectedDate] = useState(
        dates.includes(currentDate) ? currentDate : dates[0],
    );
    const [selectedSlots, setSelectedSlots] = useState<string[]>(currentSlots);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const today = getTodayStr();
    const currentHour = new Date().getHours();

    const toggleSlot = (slot: string) => {
        setSelectedSlots((prev) =>
            prev.includes(slot)
                ? prev.filter((s) => s !== slot)
                : [...prev, slot],
        );
    };

    const isSlotPast = (slot: string) => {
        if (selectedDate !== today) return false;
        const h = parseSlotStartHour(slot);
        return h >= 0 && h < currentHour;
    };

    const hasChanges =
        selectedDate !== currentDate ||
        selectedSlots.length !== currentSlots.length ||
        selectedSlots.some((s) => !currentSlots.includes(s));

    const handleSave = async () => {
        if (selectedSlots.length === 0) {
            setError("Select at least one time slot.");
            return;
        }
        if (!hasChanges) {
            onClose();
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const result = await modifyBooking(verificationCode, userId, selectedDate, selectedSlots);
            if (!result.success) {
                setError(result.error ?? "Failed to modify booking.");
            } else {
                onSuccess();
            }
        } catch {
            setError("Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <h2 className="text-sm font-bold text-white">Modify Booking</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto p-4">
                    <p className="mb-1 text-xs text-zinc-500">
                        Booking <span className="font-mono font-bold text-cyan-400">{verificationCode}</span>
                    </p>

                    {/* Date selector */}
                    <div className="mb-4">
                        <label className="mb-2 block text-xs font-medium text-zinc-400">Date</label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {dates.map((date, i) => {
                                const label = formatDateLabel(date, i);
                                const isSelected = date === selectedDate;
                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex shrink-0 cursor-pointer flex-col items-center rounded-lg border px-3 py-2 text-xs transition-all ${
                                            isSelected
                                                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        <span className="font-medium">{label.day}</span>
                                        <span className="text-[10px] text-zinc-500">{label.date}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-600">{formatMonthYear(selectedDate)}</p>
                    </div>

                    {/* Slot selector */}
                    <div className="mb-4">
                        <label className="mb-2 block text-xs font-medium text-zinc-400">Time Slots</label>
                        <div className="grid grid-cols-2 gap-1.5">
                            {TIME_SLOTS.map((slot) => {
                                const past = isSlotPast(slot);
                                const isSelected = selectedSlots.includes(slot);
                                return (
                                    <button
                                        key={slot}
                                        disabled={past}
                                        onClick={() => toggleSlot(slot)}
                                        className={`rounded-md border px-2 py-2 text-[11px] font-medium transition-all ${
                                            past
                                                ? "cursor-not-allowed border-zinc-800 text-zinc-700"
                                                : isSelected
                                                    ? "cursor-pointer border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                                                    : "cursor-pointer border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        {slot}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-3 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 border-t border-zinc-800 px-4 py-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || selectedSlots.length === 0 || !hasChanges}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CalendarCheck className="h-4 w-4" />
                        )}
                        {saving ? "Saving\u2026" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

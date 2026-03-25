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
    verificationCode, userId, currentDate, currentSlots, onClose, onSuccess,
}: ModifyBookingModalProps) {
    const dates = useMemo(() => getUpcomingDates(7), []);
    const [selectedDate, setSelectedDate] = useState(dates.includes(currentDate) ? currentDate : dates[0]);
    const [selectedSlots, setSelectedSlots] = useState<string[]>(currentSlots);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const today = getTodayStr();
    const currentHour = new Date().getHours();

    const toggleSlot = (slot: string) => {
        setSelectedSlots((prev) => prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]);
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
        if (selectedSlots.length === 0) { setError("Select at least one time slot."); return; }
        if (!hasChanges) { onClose(); return; }
        setSaving(true);
        setError(null);
        try {
            const result = await modifyBooking(verificationCode, userId, selectedDate, selectedSlots);
            if (!result.success) { setError(result.error ?? "Failed to modify booking."); }
            else { onSuccess(); }
        } catch {
            setError("Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-outfit" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
            <div className="w-full max-w-md rounded-2xl bg-surface-container shadow-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                        <h2 className="text-sm font-bold text-on-surface">Modify Booking</h2>
                        <p className="mt-0.5 text-xs text-on-surface-variant/50">
                            <span className="font-mono font-bold text-primary">{verificationCode}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-xl p-2 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-6">
                    {/* Date selector */}
                    <div className="mb-6">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-btn-red">Date</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {dates.map((date, i) => {
                                const label = formatDateLabel(date, i);
                                const isSelected = date === selectedDate;
                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex shrink-0 cursor-pointer flex-col items-center rounded-2xl px-4 py-2.5 text-xs transition-all duration-150 active:scale-95 ${
                                            isSelected
                                                ? "bg-btn-red text-white"
                                                : "bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface"
                                        }`}
                                        style={isSelected ? { boxShadow: "0 4px 16px rgba(217,51,29,0.25)" } : {}}
                                    >
                                        <span className="font-semibold uppercase tracking-wider opacity-70">{label.day}</span>
                                        <span className="text-lg font-black leading-tight">{label.date}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-[10px] text-on-surface-variant/30">{formatMonthYear(selectedDate)}</p>
                    </div>

                    {/* Slot selector */}
                    <div className="mb-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-btn-red">Time Slots</p>
                        <div className="grid grid-cols-2 gap-2">
                            {TIME_SLOTS.map((slot) => {
                                const past = isSlotPast(slot);
                                const isSelected = selectedSlots.includes(slot);
                                return (
                                    <button
                                        key={slot}
                                        disabled={past}
                                        onClick={() => toggleSlot(slot)}
                                        className={`rounded-xl px-3 py-2.5 text-[11px] font-medium transition-all duration-150 ${
                                            past
                                                ? "cursor-not-allowed bg-surface-container-high/30 text-on-surface-variant/20"
                                                : isSelected
                                                    ? "cursor-pointer bg-btn-red text-white"
                                                    : "cursor-pointer bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface active:scale-95"
                                        }`}
                                        style={isSelected ? { boxShadow: "0 2px 12px rgba(217,51,29,0.2)" } : {}}
                                    >
                                        {slot}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-btn-red/[0.08] px-4 py-3 text-xs text-btn-red">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-full border border-on-surface bg-transparent py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || selectedSlots.length === 0 || !hasChanges}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

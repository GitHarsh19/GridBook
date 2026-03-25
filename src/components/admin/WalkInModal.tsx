"use client";

import { useState } from "react";
import {
    CalendarDays,
    Clock,
    Monitor,
    X,
} from "lucide-react";
import { type DashboardRig, type Booking, TIME_SLOTS } from "@/lib/data";
import { getUpcomingDates, parseSlotStartHour } from "@/lib/utils";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

export function WalkInModal({
    rig,
    initialDate,
    existingBookings,
    onConfirm,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    initialDate: string;
    existingBookings: Booking[];
    onConfirm: (slots: string[], date: string, customerName: string) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [customerName, setCustomerName] = useState("");
    const dates = getUpcomingDates(7);

    const rigDateBookings = existingBookings.filter(
        (b) => b.rig_id === rig.id && b.booking_date === selectedDate,
    );
    const bookedSlotMap = new Map<string, Booking>();
    for (const b of rigDateBookings) {
        bookedSlotMap.set(b.time_slot, b);
    }

    const now = new Date();
    const todayStr = dates[0];
    const currentHour = now.getHours();

    const toggleSlot = (slot: string) => {
        setSelectedSlots((prev) =>
            prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
        );
    };

    const handleDateChange = (d: string) => {
        setSelectedDate(d);
        setSelectedSlots([]);
    };

    const formatDateLabel = (dateStr: string, i: number) => {
        if (i === 0) return "Today";
        if (i === 1) return "Tmrw";
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    };

    const availableCount = TIME_SLOTS.filter((slot) => {
        if (bookedSlotMap.has(slot)) return false;
        if (selectedDate === todayStr && parseSlotStartHour(slot) <= currentHour) return false;
        return true;
    }).length;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 font-outfit"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl bg-surface-container p-6"
                style={ghostCard}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-on-surface">Book Walk-In</h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant/40">Block a rig for an in-person customer</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-xl p-2 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Rig info */}
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-surface-container-high px-4 py-3">
                    <Monitor className="h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                        <p className="text-sm font-semibold text-on-surface">{rig.name}</p>
                        <p className="text-[10px] text-on-surface-variant/40">{rig.specs}</p>
                    </div>
                </div>

                {/* Customer name */}
                <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                        Customer Name <span className="text-on-surface-variant/30 normal-case tracking-normal font-normal">(optional)</span>
                    </p>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Walk-In"
                        className="w-full rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container"
                    />
                </div>

                {/* Date picker */}
                <div className="mb-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-btn-red">
                        <CalendarDays className="h-3 w-3" />
                        Date
                    </p>
                    <div className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                        {dates.map((dateStr, i) => {
                            const isSelected = selectedDate === dateStr;
                            const dateBookingCount = existingBookings.filter(
                                (b) => b.rig_id === rig.id && b.booking_date === dateStr,
                            ).length;
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => handleDateChange(dateStr)}
                                    className={`relative shrink-0 cursor-pointer rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-150 active:scale-95 ${
                                        isSelected
                                            ? "bg-btn-red text-white"
                                            : "bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface"
                                    }`}
                                    style={isSelected ? { boxShadow: "0 4px 16px rgba(217,51,29,0.25)" } : {}}
                                >
                                    {formatDateLabel(dateStr, i)}
                                    {dateBookingCount > 0 && (
                                        <span className={`ml-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${
                                            isSelected ? "bg-white/20 text-white" : "bg-btn-red/20 text-btn-red"
                                        }`}>
                                            {dateBookingCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time slots */}
                <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            <Clock className="h-3 w-3" />
                            Time Slots
                            {selectedSlots.length > 0 && (
                                <span className="rounded-full bg-btn-red/10 px-1.5 py-0.5 text-[10px] text-btn-red normal-case tracking-normal font-medium">
                                    {selectedSlots.length} selected
                                </span>
                            )}
                        </p>
                        <span className="text-[10px] text-on-surface-variant/30">
                            {availableCount} available
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                        {TIME_SLOTS.map((slot) => {
                            const booking = bookedSlotMap.get(slot);
                            const isBooked = !!booking;
                            const isPast = selectedDate === todayStr && parseSlotStartHour(slot) <= currentHour;
                            const isDisabled = isBooked || isPast;
                            const isSelected = selectedSlots.includes(slot);

                            const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)\s*–\s*(\d{1,2}):00\s*(AM|PM)/i);
                            const shortLabel = match
                                ? `${match[1]}${match[2].toLowerCase()} – ${match[3]}${match[4].toLowerCase()}`
                                : slot;

                            return (
                                <button
                                    key={slot}
                                    disabled={isDisabled}
                                    onClick={() => toggleSlot(slot)}
                                    title={
                                        isBooked
                                            ? `${booking.customer_name} (${booking.source === "app" ? "App" : "Walk-In"}) ${booking.verification_code}`
                                            : isPast
                                                ? "Past"
                                                : "Available"
                                    }
                                    className={`relative rounded-xl px-2 py-2 text-[11px] font-medium transition-all ${
                                        isDisabled
                                            ? isBooked
                                                ? booking.source === "app"
                                                    ? "cursor-not-allowed bg-btn-red/5 text-btn-red/40"
                                                    : "cursor-not-allowed bg-amber-500/5 text-amber-400/40"
                                                : "cursor-not-allowed bg-surface-container-high/30 text-on-surface-variant/20"
                                            : isSelected
                                                ? "cursor-pointer bg-btn-red text-white"
                                                : "cursor-pointer bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface active:scale-95"
                                    }`}
                                    style={isSelected ? { boxShadow: "0 2px 12px rgba(217,51,29,0.2)" } : {}}
                                >
                                    {shortLabel}
                                    {isBooked && (
                                        <span className="mt-0.5 block truncate text-[8px] opacity-70">
                                            {booking.source === "app" ? "App" : "WLK"}: {booking.customer_name}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-3 text-[9px] text-on-surface-variant/30">
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-surface-container-high" />
                            Available
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-btn-red" />
                            Selected
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-btn-red/10" />
                            App Booked
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-amber-500/10" />
                            Walk-In
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-full border border-on-surface bg-transparent py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selectedSlots, selectedDate, customerName)}
                        disabled={loading || selectedSlots.length === 0}
                        className="flex-1 cursor-pointer rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? "Booking\u2026"
                            : `Book ${selectedSlots.length || ""} Slot${selectedSlots.length !== 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

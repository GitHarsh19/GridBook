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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        Book Walk-In
                    </h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-5 flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                    <Monitor className="h-5 w-5 text-amber-400" />
                    <div>
                        <p className="text-sm font-medium text-white">{rig.name}</p>
                        <p className="text-[10px] text-zinc-600">{rig.specs}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                        Customer Name <span className="text-zinc-700">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Walk-In"
                        className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50"
                    />
                </div>

                <div className="mb-4">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <CalendarDays className="h-3 w-3" />
                        Date
                    </label>
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
                                    className={`relative shrink-0 cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                                        isSelected
                                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                    }`}
                                >
                                    {formatDateLabel(dateStr, i)}
                                    {dateBookingCount > 0 && (
                                        <span className={`ml-1.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${
                                            isSelected ? "bg-amber-500/20 text-amber-300" : "bg-red-500/15 text-red-400"
                                        }`}>
                                            {dateBookingCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-5">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                            <Clock className="h-3 w-3" />
                            Time Slots
                            {selectedSlots.length > 0 && (
                                <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                                    {selectedSlots.length} selected
                                </span>
                            )}
                        </label>
                        <span className="text-[10px] text-zinc-600">
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
                                    className={`relative rounded-md border px-2 py-2 text-[11px] font-medium transition-all ${
                                        isDisabled
                                            ? isBooked
                                                ? booking.source === "app"
                                                    ? "cursor-not-allowed border-red-500/20 bg-red-500/5 text-red-400/60"
                                                    : "cursor-not-allowed border-amber-500/20 bg-amber-500/5 text-amber-400/60"
                                                : "cursor-not-allowed border-zinc-800/50 bg-zinc-900/30 text-zinc-700"
                                            : isSelected
                                                ? "cursor-pointer border-amber-500 bg-amber-500/15 text-amber-400"
                                                : "cursor-pointer border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-amber-500/40 hover:text-white"
                                    }`}
                                >
                                    {shortLabel}
                                    {isBooked && (
                                        <span className="block mt-0.5 text-[8px] truncate opacity-70">
                                            {booking.source === "app" ? "App" : "WLK"}: {booking.customer_name}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[9px] text-zinc-600">
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm border border-zinc-700 bg-zinc-800" />
                            Available
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm border border-amber-500 bg-amber-500/15" />
                            Selected
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm border border-red-500/20 bg-red-500/5" />
                            App Booked
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm border border-amber-500/20 bg-amber-500/5" />
                            Walk-In
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(selectedSlots, selectedDate, customerName)}
                        disabled={loading || selectedSlots.length === 0}
                        className="flex-1 cursor-pointer rounded-md bg-amber-500 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
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

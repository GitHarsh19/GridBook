"use client";

import { useState } from "react";
import {
    CalendarDays,
    Clock,
    Monitor,
    Trash2,
    X,
} from "lucide-react";
import { type DashboardRig, type Booking, TIME_SLOTS } from "@/lib/data";
import { getUpcomingDates, parseSlotStartHour, isSlotPast } from "@/lib/utils";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

export type SlotSelection = {
    slot: string;
    source: "app" | "walk_in";
    inUse: boolean;
};

export function WalkInModal({
    rig,
    initialDate,
    initialSlots,
    existingBookings,
    onConfirm,
    onCancelBooking,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    initialDate: string;
    initialSlots?: string[];
    existingBookings: Booking[];
    onConfirm: (slots: SlotSelection[], date: string, customerName: string) => void;
    onCancelBooking: (bookingId: number) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    // Map from slot string → selection info
    const [selectedSlots, setSelectedSlots] = useState<Map<string, SlotSelection>>(() => {
        const map = new Map<string, SlotSelection>();
        if (initialSlots) {
            for (const s of initialSlots) {
                map.set(s, { slot: s, source: "walk_in", inUse: false });
            }
        }
        return map;
    });
    const [customerName, setCustomerName] = useState("");
    const [pickerSlot, setPickerSlot] = useState<string | null>(null);
    const dates = getUpcomingDates(1); // Only today

    const rigDateBookings = existingBookings.filter(
        (b) => b.rig_id === rig.id && b.booking_date === selectedDate,
    );
    const bookedSlotMap = new Map<string, Booking>();
    for (const b of rigDateBookings) {
        bookedSlotMap.set(b.time_slot, b);
    }

    const now = new Date();
    const todayStr = dates[0];

    const handleDateChange = (d: string) => {
        setSelectedDate(d);
        setSelectedSlots(new Map());
        setPickerSlot(null);
    };

    const handleSlotClick = (slot: string) => {
        if (selectedSlots.has(slot)) {
            // Deselect
            setSelectedSlots((prev) => {
                const next = new Map(prev);
                next.delete(slot);
                return next;
            });
            setPickerSlot(null);
        } else {
            // Open picker
            setPickerSlot(pickerSlot === slot ? null : slot);
        }
    };

    const handlePickStatus = (slot: string, source: "app" | "walk_in", inUse: boolean) => {
        setSelectedSlots((prev) => {
            const next = new Map(prev);
            next.set(slot, { slot, source, inUse });
            return next;
        });
        setPickerSlot(null);
    };

    const formatDateLabel = (dateStr: string, i: number) => {
        if (i === 0) return "Today";
        if (i === 1) return "Tmrw";
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    };

    const availableCount = TIME_SLOTS.filter((slot) => {
        if (bookedSlotMap.has(slot)) return false;
        if (isSlotPast(slot, selectedDate, now)) return false;
        return true;
    }).length;

    const selectedCount = selectedSlots.size;

    // Status style helpers
    const getSelectedStyle = (sel: SlotSelection) => {
        if (sel.inUse) return { bg: "bg-sky-500", text: "text-white", shadow: "0 2px 12px rgba(14,165,233,0.25)", label: "In Use" };
        if (sel.source === "app") return { bg: "bg-btn-red", text: "text-white", shadow: "0 2px 12px rgba(217,51,29,0.2)", label: "App" };
        return { bg: "bg-amber-500", text: "text-white", shadow: "0 2px 12px rgba(245,158,11,0.25)", label: "WLK" };
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 font-outfit"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface-container p-6"
                style={ghostCard}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-on-surface">Book Slot</h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant/40">Select slots and assign a status</p>
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
                            {selectedCount > 0 && (
                                <span className="rounded-full bg-btn-red/10 px-1.5 py-0.5 text-[10px] text-btn-red normal-case tracking-normal font-medium">
                                    {selectedCount} selected
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
                            const isPast = isSlotPast(slot, selectedDate, now);
                            const isDisabled = isBooked || isPast;
                            const selection = selectedSlots.get(slot);
                            const isSelected = !!selection;
                            const isPickerOpen = pickerSlot === slot;

                            const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)\s*–\s*(\d{1,2}):00\s*(AM|PM)/i);
                            const shortLabel = match
                                ? `${match[1]}${match[2].toLowerCase()} – ${match[3]}${match[4].toLowerCase()}`
                                : slot;

                            const selStyle = isSelected ? getSelectedStyle(selection) : null;

                            return (
                                <div key={slot} className="relative">
                                    <button
                                        disabled={isDisabled}
                                        onClick={() => handleSlotClick(slot)}
                                        title={
                                            isBooked
                                                ? `${booking.customer_name} (${booking.source === "app" ? "App" : "Walk-In"}) ${booking.verification_code}`
                                                : isPast
                                                    ? "Past"
                                                    : isSelected
                                                        ? `${selStyle!.label} – click to deselect`
                                                        : "Available – click to set status"
                                        }
                                        className={`relative w-full rounded-xl px-2 py-2 text-[11px] font-medium transition-all h-[52px] flex flex-col items-center justify-center ${
                                            isDisabled
                                                ? isBooked
                                                    ? booking.source === "app"
                                                        ? "cursor-not-allowed bg-btn-red/5 text-btn-red/40"
                                                        : "cursor-not-allowed bg-amber-500/5 text-amber-400/40"
                                                    : "cursor-not-allowed bg-surface-container-high/30 text-on-surface-variant/20"
                                                : isSelected
                                                    ? `cursor-pointer ${selStyle!.bg} ${selStyle!.text}`
                                                    : isPickerOpen
                                                        ? "cursor-pointer bg-white/10 text-on-surface ring-1 ring-white/20"
                                                        : "cursor-pointer bg-surface-container-high text-on-surface-variant/60 hover:bg-surface-container-highest hover:text-on-surface active:scale-95"
                                        }`}
                                        style={isSelected ? { boxShadow: selStyle!.shadow } : {}}
                                    >
                                        {shortLabel}
                                        {isBooked && (
                                            <span className="mt-0.5 block truncate text-[8px] opacity-70">
                                                {booking.source === "app" ? "App" : "WLK"}: {booking.customer_name}
                                            </span>
                                        )}
                                        {isSelected && (
                                            <span className="mt-0.5 block text-[8px] opacity-80">
                                                {selStyle!.label}
                                            </span>
                                        )}
                                    </button>

                                    {/* Status picker popover */}
                                    {isPickerOpen && (() => {
                                        const slotStartHour = parseSlotStartHour(slot);
                                        const currentHour = now.getHours();
                                        const isCurrentTimeSlot = selectedDate === todayStr && slotStartHour === currentHour;

                                        const options = [
                                            { label: "App Booked", source: "app" as const, inUse: false, dot: "bg-btn-red", hover: "hover:bg-btn-red/20 hover:text-btn-red" },
                                            { label: "Walk-In", source: "walk_in" as const, inUse: false, dot: "bg-amber-400", hover: "hover:bg-amber-500/20 hover:text-amber-400" },
                                        ];

                                        return (
                                            <div
                                                className="absolute left-1/2 z-20 mt-1 -translate-x-1/2 rounded-xl bg-surface-container-high p-2 shadow-xl"
                                                style={{ border: "1px solid rgba(255,255,255,0.1)", minWidth: "130px" }}
                                            >
                                                <p className="mb-1.5 text-center text-[9px] font-semibold uppercase tracking-wider text-on-surface-variant/40">
                                                    Set as
                                                </p>
                                                {options.map(({ label, source, inUse, dot, hover }) => (
                                                    <button
                                                        key={label}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePickStatus(slot, source, inUse);
                                                        }}
                                                        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-on-surface-variant/60 transition-all ${hover}`}
                                                    >
                                                        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                                                        {label}
                                                    </button>
                                                ))}
                                                {isCurrentTimeSlot ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePickStatus(slot, "walk_in", true);
                                                        }}
                                                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium text-on-surface-variant/60 transition-all hover:bg-sky-500/20 hover:text-sky-400"
                                                    >
                                                        <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                                                        In Use
                                                    </button>
                                                ) : (
                                                    <div className="px-3 py-2 text-[10px] text-on-surface-variant/30 italic">
                                                        In Use — only for current slot
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
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
                            App Booked
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-amber-500" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-sky-500" />
                            In Use
                        </div>
                    </div>
                </div>

                {/* Existing bookings for this rig */}
                {rigDateBookings.length > 0 && (
                    <div className="mb-5">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                            Existing Bookings ({rigDateBookings.length})
                        </p>
                        <div className="max-h-[160px] space-y-2 overflow-y-auto pr-1">
                            {rigDateBookings.map((b) => (
                                <div
                                    key={b.id}
                                    className="flex items-center justify-between rounded-xl bg-surface-container-high/30 px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-on-surface truncate">
                                                {b.customer_name}
                                            </span>
                                            <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                                    b.source === "app"
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-amber-500/10 text-amber-400"
                                                }`}
                                            >
                                                {b.source === "app" ? "App" : "Walk-In"}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-[11px] text-on-surface-variant/50">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {b.time_slot}
                                            </span>
                                            <span className="font-mono text-primary/60">
                                                {b.verification_code}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onCancelBooking(b.id)}
                                        title="Cancel booking"
                                        className="ml-3 shrink-0 cursor-pointer rounded-lg p-2 text-on-surface-variant/30 transition-all hover:bg-btn-red/10 hover:text-btn-red"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-full border border-on-surface bg-transparent py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(Array.from(selectedSlots.values()), selectedDate, customerName)}
                        disabled={loading || selectedCount === 0}
                        className="flex-1 cursor-pointer rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading
                            ? "Booking\u2026"
                            : `Book ${selectedCount || ""} Slot${selectedCount !== 1 ? "s" : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

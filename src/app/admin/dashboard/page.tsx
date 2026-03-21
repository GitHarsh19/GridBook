"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Zap,
    CalendarCheck,
    CalendarDays,
    IndianRupee,
    Monitor,
    Wrench,
    X,
    Clock,
    AlertTriangle,
    LogOut,
    Users,
    Plus,
    Settings,
    MapPin,
    Pencil,
    ImageIcon,
    Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
    type DashboardRig,
    type Booking,
    type VenueOption,
    type RigStatus,
    TIME_SLOTS,
    getVenuesList,
    getDashboardRigs,
    getTodaysBookings,
    blockRigForWalkIn,
    releaseRig,
    releaseExpiredWalkIns,
    toggleOutOfOrder,
    addRig,
    updateRig,
    deleteRig,
    addVenue,
    updateVenue,
    deleteVenue,
} from "@/lib/data";

/* ─── Walk-In Modal ────────────────────────────────────────────────── */

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

function parseSlotStartHour(slot: string): number {
    const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
    if (!match) return -1;
    let h = parseInt(match[1], 10);
    const p = match[2].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    return h;
}

function WalkInModal({
    rig,
    initialDate,
    existingBookings,
    onConfirm,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    initialDate: string;
    /** All bookings across all dates for this rig (to show conflicts) */
    existingBookings: Booking[];
    onConfirm: (slots: string[], date: string, customerName: string) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [customerName, setCustomerName] = useState("");
    const dates = getUpcomingDates(7);

    // Bookings for this rig on the selected date
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

    // Count total available slots for this date
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

                {/* Rig info */}
                <div className="mb-5 flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                    <Monitor className="h-5 w-5 text-amber-400" />
                    <div>
                        <p className="text-sm font-medium text-white">{rig.name}</p>
                        <p className="text-[10px] text-zinc-600">{rig.specs}</p>
                    </div>
                </div>

                {/* Customer name */}
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

                {/* Date picker */}
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

                {/* Time slots grid */}
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

                            // Short label
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
                    {/* Legend */}
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

                {/* Actions */}
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

/* ─── Add Rig Modal ───────────────────────────────────────────────── */

function AddRigModal({
    onConfirm,
    onClose,
    loading,
}: {
    onConfirm: (name: string, specs: string, status: "available" | "out_of_order") => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const [specs, setSpecs] = useState("");
    const [status, setStatus] = useState<"available" | "out_of_order">("available");

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Add Rig</h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Rig Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rig 7"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Specs
                        </label>
                        <input
                            type="text"
                            value={specs}
                            onChange={(e) => setSpecs(e.target.value)}
                            placeholder='e.g. Fanatec DD Pro · Triple 27"'
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "available" | "out_of_order")}
                            className="w-full cursor-pointer rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                        >
                            <option value="available">Available</option>
                            <option value="out_of_order">Out of Order</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(name.trim(), specs.trim(), status)}
                        disabled={loading || !name.trim()}
                        className="flex-1 cursor-pointer rounded-md bg-cyan-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {loading ? "Adding\u2026" : "Add Rig"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Edit Rig Modal ──────────────────────────────────────────────── */

function EditRigModal({
    rig,
    onSave,
    onDelete,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    onSave: (name: string, specs: string) => void;
    onDelete: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState(rig.name);
    const [specs, setSpecs] = useState(rig.specs);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    if (confirmingDelete) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Delete Rig</h3>
                    </div>
                    <p className="mb-6 text-sm text-zinc-400">
                        Are you sure? This will remove{" "}
                        <span className="font-medium text-white">{rig.name}</span>{" "}
                        from the app entirely.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmingDelete(false)}
                            className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-md border border-red-800 bg-red-900/50 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900 disabled:opacity-50"
                        >
                            {loading ? "Deleting\u2026" : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Edit Rig</h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Rig Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Specs
                        </label>
                        <input
                            type="text"
                            value={specs}
                            onChange={(e) => setSpecs(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer rounded-md border border-red-800 bg-red-900/50 px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900"
                    >
                        Delete Rig
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(name.trim(), specs.trim())}
                            disabled={loading || !name.trim()}
                            className="cursor-pointer rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                        >
                            {loading ? "Saving\u2026" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Add Venue Modal ─────────────────────────────────────────────── */

function AddVenueModal({
    onConfirm,
    onClose,
    loading,
}: {
    onConfirm: (name: string, location: string, price: number, description: string, imageUrl: string) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                        <Building2 className="h-5 w-5 text-cyan-500" />
                        Add Venue
                    </h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Venue Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apex Racing Lounge"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Koramangala, Bengaluru"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Price per hour (₹)
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 500"
                            min={1}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description of your venue"
                            rows={2}
                            className={inputClass + " resize-none"}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                            <ImageIcon className="h-3 w-3" />
                            Image URL
                            <span className="text-zinc-600">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/venue.jpg"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            onConfirm(
                                name.trim(),
                                location.trim(),
                                Number(price) || 0,
                                description.trim(),
                                imageUrl.trim(),
                            )
                        }
                        disabled={loading || !name.trim() || !location.trim() || !price}
                        className="flex-1 cursor-pointer rounded-md bg-cyan-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {loading ? "Adding\u2026" : "Add Venue"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Edit Venue Modal ────────────────────────────────────────────── */

function EditVenueModal({
    venue,
    onSave,
    onDelete,
    onClose,
    loading,
}: {
    venue: VenueOption;
    onSave: (name: string, location: string, price: number, description: string, imageUrl: string) => void;
    onDelete: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState(venue.name);
    const [location, setLocation] = useState(venue.location);
    const [price, setPrice] = useState(String(venue.price));
    const [description, setDescription] = useState(venue.description);
    const [imageUrl, setImageUrl] = useState(venue.imageUrl ?? "");
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    if (confirmingDelete) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Delete Venue</h3>
                    </div>
                    <p className="mb-2 text-sm text-zinc-400">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-white">{venue.name}</span>?
                    </p>
                    <p className="mb-6 text-xs text-red-400/80">
                        This will permanently delete all rigs and bookings associated with this venue.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmingDelete(false)}
                            className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-md border border-red-800 bg-red-900/50 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900 disabled:opacity-50"
                        >
                            {loading ? "Deleting\u2026" : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                        <Building2 className="h-5 w-5 text-cyan-500" />
                        Edit Venue
                    </h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {venue.imageUrl && (
                    <div className="mb-4 overflow-hidden rounded-md">
                        <img
                            src={venue.imageUrl}
                            alt={venue.name}
                            className="h-32 w-full object-cover"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Venue Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Price per hour (₹)
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min={1}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className={inputClass + " resize-none"}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                            <ImageIcon className="h-3 w-3" />
                            Image URL
                            <span className="text-zinc-600">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/venue.jpg"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer rounded-md border border-red-800 bg-red-900/50 px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900"
                    >
                        Delete Venue
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() =>
                                onSave(
                                    name.trim(),
                                    location.trim(),
                                    Number(price) || 0,
                                    description.trim(),
                                    imageUrl.trim(),
                                )
                            }
                            disabled={loading || !name.trim() || !location.trim() || !price}
                            className="cursor-pointer rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                        >
                            {loading ? "Saving\u2026" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Status config ────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
    RigStatus,
    {
        border: string;
        bg: string;
        dot: string;
        label: string;
        labelColor: string;
        clickable: boolean;
    }
> = {
    available: {
        border: "border-emerald-500/50 hover:border-emerald-400",
        bg: "bg-zinc-900",
        dot: "bg-emerald-400",
        label: "Available",
        labelColor: "text-emerald-400",
        clickable: true,
    },
    booked: {
        border: "border-red-500/50",
        bg: "bg-zinc-900",
        dot: "bg-red-400",
        label: "App Booked",
        labelColor: "text-red-400",
        clickable: false,
    },
    blocked: {
        border: "border-amber-500/50 hover:border-amber-400",
        bg: "bg-amber-500/5",
        dot: "bg-amber-400",
        label: "Walk-In",
        labelColor: "text-amber-400",
        clickable: true,
    },
    out_of_order: {
        border: "border-zinc-800 hover:border-zinc-700",
        bg: "bg-zinc-900/50",
        dot: "bg-zinc-600",
        label: "Out of Order",
        labelColor: "text-zinc-600",
        clickable: true,
    },
};

/* ─── Main Dashboard ───────────────────────────────────────────────── */

export default function AdminDashboardPage() {
    const router = useRouter();
    const { logout } = useAuth();
    const [venues, setVenues] = useState<VenueOption[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
    const [rigs, setRigs] = useState<DashboardRig[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [walkInTarget, setWalkInTarget] = useState<DashboardRig | null>(null);
    const [showAddRig, setShowAddRig] = useState(false);
    const [editTarget, setEditTarget] = useState<DashboardRig | null>(null);
    const [showAddVenue, setShowAddVenue] = useState(false);
    const [editVenueTarget, setEditVenueTarget] = useState<VenueOption | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Admin date/time slot selector state
    const initDate = (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    })();
    const [adminDate, setAdminDate] = useState<string>(initDate);
    const [adminSlot, setAdminSlot] = useState<string | null>(null);

    const loadVenues = useCallback(async () => {
        try {
            const data = await getVenuesList();
            setVenues(data);
            return data;
        } catch (err) {
            console.error("Admin: Failed to load venues:", err);
            setError("Failed to load venues.");
            setTimeout(() => setError(null), 4000);
            return [];
        }
    }, []);

    // Load venues (owned by this admin)
    useEffect(() => {
        loadVenues().then((data) => {
            if (data.length > 0) {
                setSelectedVenueId(data[0].id);
            }
        });
    }, [loadVenues]);

    // Load rigs + bookings for selected venue, auto-releasing expired walk-ins first
    const loadData = useCallback(async () => {
        if (!selectedVenueId) return;
        try {
            // Release any walk-in blocks whose duration has expired
            await releaseExpiredWalkIns();
            const [rigData, bookingData] = await Promise.all([
                getDashboardRigs(selectedVenueId),
                getTodaysBookings(selectedVenueId),
            ]);
            setRigs(rigData);
            setBookings(bookingData);
        } catch {
            setError("Failed to load data. Retrying\u2026");
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    }, [selectedVenueId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Real-time subscription + polling fallback
    useEffect(() => {
        if (!selectedVenueId) return;

        const channel = supabase
            .channel(`admin-dashboard-${selectedVenueId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "rigs",
                    filter: `venue_id=eq.${selectedVenueId}`,
                },
                () => loadData(),
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "bookings" },
                () => loadData(),
            )
            .subscribe();

        const interval = setInterval(loadData, 30_000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedVenueId, loadData]);

    // ── Actions ──

    const handleRigClick = async (rig: DashboardRig) => {
        const effective = getEffectiveStatus(rig);
        if (effective === "booked") {
            return;
        } else if (effective === "available") {
            setWalkInTarget(rig);
        } else if (rig.status === "blocked") {
            if (window.confirm(`Release ${rig.name} back to available?`)) {
                try {
                    await releaseRig(rig.id);
                } catch (err) {
                    console.error("Release rig failed:", err);
                    setError("Failed to release rig.");
                    setTimeout(() => setError(null), 4000);
                }
                loadData();
            }
        } else if (rig.status === "out_of_order") {
            if (window.confirm(`Restore ${rig.name} to available?`)) {
                try {
                    await toggleOutOfOrder(rig.id);
                } catch (err) {
                    console.error("Toggle OOO failed:", err);
                    setError("Failed to update rig status.");
                    setTimeout(() => setError(null), 4000);
                }
                loadData();
            }
        }
    };

    const handleBlockWalkIn = async (slots: string[], date: string, customerName: string) => {
        if (!walkInTarget) return;
        setActionLoading(true);
        try {
            const result = await blockRigForWalkIn(walkInTarget.id, slots, date, customerName);
            if (!result.success) {
                setError(
                    result.error ||
                        "Slot just secured online. Select another rig.",
                );
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Block walk-in failed:", err);
            setError("Failed to block rig. Please try again.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setWalkInTarget(null);
            loadData();
        }
    };

    const handleToggleOOO = async (rigId: number) => {
        try {
            await toggleOutOfOrder(rigId);
        } catch (err) {
            console.error("Toggle OOO failed:", err);
            setError("Failed to update rig status.");
            setTimeout(() => setError(null), 4000);
        }
        loadData();
    };

    const handleLogout = () => {
        router.push("/");
        logout("admin");
    };

    const handleAddRig = async (name: string, specs: string, status: "available" | "out_of_order") => {
        if (!selectedVenueId) return;
        setActionLoading(true);
        try {
            const result = await addRig(selectedVenueId, name, specs, status);
            if (!result.success) {
                setError(result.error || "Failed to add rig.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Unauthorized or failed to add rig.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setShowAddRig(false);
            loadData();
        }
    };

    const handleEditRig = async (name: string, specs: string) => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const result = await updateRig(editTarget.id, name, specs);
            if (!result.success) {
                setError(result.error || "Failed to update rig.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Unauthorized or failed to update rig.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditTarget(null);
            loadData();
        }
    };

    const handleDeleteRig = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const result = await deleteRig(editTarget.id);
            if (!result.success) {
                setError(result.error || "Failed to delete rig.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Unauthorized or failed to delete rig.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditTarget(null);
            loadData();
        }
    };

    const handleAddVenue = async (name: string, location: string, price: number, description: string, imageUrl: string) => {
        setActionLoading(true);
        try {
            const result = await addVenue(name, location, price, description, imageUrl || undefined);
            if (!result.success) {
                setError(result.error || "Failed to add venue.");
                setTimeout(() => setError(null), 4000);
            } else {
                const updated = await loadVenues();
                if (result.venueId) setSelectedVenueId(result.venueId);
                else if (updated.length > 0) setSelectedVenueId(updated[updated.length - 1].id);
            }
        } catch {
            setError("Unauthorized or failed to add venue.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setShowAddVenue(false);
        }
    };

    const handleEditVenue = async (name: string, location: string, price: number, description: string, imageUrl: string) => {
        if (!editVenueTarget) return;
        setActionLoading(true);
        try {
            const result = await updateVenue(editVenueTarget.id, name, location, price, description, imageUrl || null);
            if (!result.success) {
                setError(result.error || "Failed to update venue.");
                setTimeout(() => setError(null), 4000);
            } else {
                await loadVenues();
            }
        } catch {
            setError("Unauthorized or failed to update venue.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditVenueTarget(null);
        }
    };

    const handleDeleteVenue = async () => {
        if (!editVenueTarget) return;
        setActionLoading(true);
        try {
            const result = await deleteVenue(editVenueTarget.id);
            if (!result.success) {
                setError(result.error || "Failed to delete venue.");
                setTimeout(() => setError(null), 4000);
            } else {
                const updated = await loadVenues();
                if (updated.length > 0) {
                    setSelectedVenueId(updated[0].id);
                } else {
                    setSelectedVenueId(null);
                    setRigs([]);
                    setBookings([]);
                }
            }
        } catch {
            setError("Unauthorized or failed to delete venue.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditVenueTarget(null);
        }
    };

    // ── Render ──

    const selectedVenue = venues.find((v) => v.id === selectedVenueId);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const venuePrice = selectedVenue?.price ?? 500;

    // Bookings filtered for the admin-selected date
    const dateBookings = bookings.filter((b) => b.booking_date === adminDate);
    const dateAppBookings = dateBookings.filter((b) => b.source === "app");

    // Build a lookup: rigId → Set of booked slot strings for the selected date
    const rigSlotMap = new Map<number, Set<string>>();
    for (const b of dateBookings) {
        if (!rigSlotMap.has(b.rig_id)) rigSlotMap.set(b.rig_id, new Set());
        rigSlotMap.get(b.rig_id)!.add(b.time_slot);
    }

    // Rigs booked for the admin-selected slot (or current time if no slot selected)
    const activelyBookedRigIds = new Set(
        dateBookings
            .filter((b) => {
                if (adminSlot) return b.time_slot === adminSlot;
                // No slot selected + viewing today → use current time
                if (adminDate !== todayStr) return false;
                const currentHour = now.getHours();
                const match = b.time_slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
                if (!match) return false;
                let slotStart = parseInt(match[1], 10);
                const period = match[2].toUpperCase();
                if (period === "PM" && slotStart !== 12) slotStart += 12;
                if (period === "AM" && slotStart === 12) slotStart = 0;
                return currentHour >= slotStart && currentHour < slotStart + 1;
            })
            .map((b) => b.rig_id),
    );

    // Compute effective rig status: overlay bookings onto DB status
    const getEffectiveStatus = (rig: DashboardRig): RigStatus => {
        if (rig.status === "out_of_order") return "out_of_order";
        // For walk-in blocks, only show on today
        if (rig.status === "blocked" && adminDate === todayStr) return "blocked";
        if (activelyBookedRigIds.has(rig.id)) return "booked";
        if (rig.status === "blocked" && adminDate !== todayStr) return "available";
        return rig.status;
    };

    // Helper: generate upcoming dates for the admin date picker
    const adminDates = (() => {
        const dates: string[] = [];
        const base = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            dates.push(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
            );
        }
        return dates;
    })();

    const formatAdminDate = (dateStr: string, i: number) => {
        if (i === 0) return { day: "Today", date: new Date(dateStr + "T00:00:00").getDate() };
        if (i === 1) return { day: "Tmrw", date: new Date(dateStr + "T00:00:00").getDate() };
        const d = new Date(dateStr + "T00:00:00");
        return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), date: d.getDate() };
    };

    // Helper: parse slot start hour for timeline
    const parseSlotHour = (slot: string): number => {
        const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
        if (!match) return -1;
        let h = parseInt(match[1], 10);
        const p = match[2].toUpperCase();
        if (p === "PM" && h !== 12) h += 12;
        if (p === "AM" && h === 12) h = 0;
        return h;
    };

    // Short time label for timeline cells
    const shortSlotLabel = (slot: string): string => {
        const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
        if (!match) return slot;
        return `${match[1]}${match[2].toLowerCase()}`;
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-cyan-500" />
                        <span className="text-lg font-bold tracking-tight text-white">
                            Grid<span className="text-cyan-500">Book</span>
                        </span>
                        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                            Admin
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {venues.length > 0 && (
                            <>
                                <select
                                    value={selectedVenueId ?? ""}
                                    onChange={(e) => {
                                        setSelectedVenueId(Number(e.target.value));
                                        setLoading(true);
                                    }}
                                    className="cursor-pointer max-w-[160px] truncate rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
                                >
                                    {venues.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => selectedVenue && setEditVenueTarget(selectedVenue)}
                                    title="Edit venue"
                                    className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-400"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setShowAddVenue(true)}
                            title="Add venue"
                            className="flex cursor-pointer items-center gap-1 rounded-md bg-cyan-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Venue</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-4 py-6">
                {/* ── Error toast ── */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── No venues empty state ── */}
                {!loading && venues.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Building2 className="mb-4 h-12 w-12 text-zinc-700" />
                        <h2 className="text-lg font-bold text-white">No Venues Yet</h2>
                        <p className="mt-1 mb-6 text-sm text-zinc-500">
                            Create your first venue to start managing rigs and bookings.
                        </p>
                        <button
                            onClick={() => setShowAddVenue(true)}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-500"
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Venue
                        </button>
                    </div>
                )}

                {/* ── Metrics ribbon ── */}
                {selectedVenueId && (<><div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            {adminDate === todayStr ? "Today\u2019s" : (() => {
                                const d = new Date(adminDate + "T00:00:00");
                                return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                            })()} App Bookings
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {dateAppBookings.length}
                        </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <IndianRupee className="h-3.5 w-3.5" />
                            Estimated Revenue
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">
                            ₹
                            {(
                                dateAppBookings.length * venuePrice
                            ).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* ── Date & Time Selector ── */}
                <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    {/* Date picker row */}
                    <div className="mb-4">
                        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Date
                        </div>
                        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                            {adminDates.map((dateStr, i) => {
                                const isSelected = adminDate === dateStr;
                                const { day, date } = formatAdminDate(dateStr, i);
                                const hasBookings = bookings.some((b) => b.booking_date === dateStr);
                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => { setAdminDate(dateStr); setAdminSlot(null); }}
                                        className={`relative flex shrink-0 cursor-pointer flex-col items-center rounded-md border px-3.5 py-2 text-xs font-medium transition-all ${
                                            isSelected
                                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                                                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        <span className="text-[10px] uppercase tracking-wider opacity-70">{day}</span>
                                        <span className="text-base font-bold leading-tight">{date}</span>
                                        {hasBookings && (
                                            <span className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-cyan-400" : "bg-zinc-500"}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time slot row */}
                    <div>
                        <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                <Clock className="h-3.5 w-3.5" />
                                Time Slot
                                {adminSlot && (
                                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400">
                                        {adminSlot}
                                    </span>
                                )}
                            </div>
                            {adminSlot && (
                                <button
                                    onClick={() => setAdminSlot(null)}
                                    className="flex cursor-pointer items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
                                >
                                    <X className="h-3 w-3" />
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                            {TIME_SLOTS.map((slot) => {
                                const isSelected = adminSlot === slot;
                                const slotHour = parseSlotHour(slot);
                                const isPast = adminDate === todayStr && slotHour <= now.getHours();
                                const isCurrent = adminDate === todayStr && slotHour === now.getHours();
                                // Count bookings for this slot on this date
                                const slotBookingCount = dateBookings.filter((b) => b.time_slot === slot).length;
                                return (
                                    <button
                                        key={slot}
                                        onClick={() => setAdminSlot(isSelected ? null : slot)}
                                        className={`relative shrink-0 cursor-pointer rounded-md border px-3 py-2 text-[11px] font-medium transition-all ${
                                            isSelected
                                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                                                : isPast
                                                    ? "border-zinc-800/50 bg-zinc-900/30 text-zinc-600"
                                                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        {isCurrent && (
                                            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase text-emerald-400">
                                                now
                                            </span>
                                        )}
                                        {shortSlotLabel(slot)}
                                        {slotBookingCount > 0 && (
                                            <span className={`ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                                                isSelected
                                                    ? "bg-cyan-500/20 text-cyan-300"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}>
                                                {slotBookingCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Live Floor Grid ── */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                                <Monitor className="h-4 w-4" />
                                Live Floor
                                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            </h2>
                            <button
                                onClick={() => setShowAddRig(true)}
                                className="flex cursor-pointer items-center gap-1 rounded-md bg-cyan-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Rig
                            </button>
                        </div>
                        {/* Desktop legend */}
                        <div className="hidden items-center gap-4 text-xs text-zinc-500 sm:flex">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                Available
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                App Booked
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                Walk-In
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                                Out of Order
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[130px] animate-pulse rounded-lg border border-zinc-800 bg-zinc-800/40"
                                />
                            ))}
                        </div>
                    ) : rigs.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                            <p className="text-sm text-zinc-500">
                                No rigs found for this venue
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {rigs.map((rig) => {
                                const effectiveStatus = getEffectiveStatus(rig);
                                const cfg = STATUS_CONFIG[effectiveStatus];
                                // Find booking for this rig matching the selected slot
                                const booking = adminSlot
                                    ? dateBookings.find((b) => b.rig_id === rig.id && b.time_slot === adminSlot)
                                    : dateBookings.find((b) => b.rig_id === rig.id);

                                return (
                                    <div
                                        key={rig.id}
                                        onClick={() => handleRigClick(rig)}
                                        role={cfg.clickable ? "button" : undefined}
                                        tabIndex={cfg.clickable ? 0 : undefined}
                                        onKeyDown={(e) => {
                                            if (cfg.clickable && (e.key === "Enter" || e.key === " ")) {
                                                handleRigClick(rig);
                                            }
                                        }}
                                        className={`group relative flex min-h-[130px] flex-col items-center justify-center rounded-lg border p-4 text-center transition-all ${cfg.border} ${cfg.bg} ${cfg.clickable ? "cursor-pointer" : "cursor-default"}`}
                                    >
                                        {/* Edit + OOO icons (top-right) */}
                                        <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditTarget(rig);
                                                }}
                                                title="Edit rig"
                                                className="rounded p-1 text-zinc-700 transition-all hover:bg-zinc-800 hover:text-zinc-400"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </button>
                                            {(effectiveStatus === "available" ||
                                                effectiveStatus ===
                                                    "out_of_order") && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleOOO(rig.id);
                                                    }}
                                                    title={
                                                        rig.status ===
                                                        "out_of_order"
                                                            ? "Restore"
                                                            : "Mark Out of Order"
                                                    }
                                                    className="rounded p-1 text-zinc-700 transition-all hover:bg-zinc-800 hover:text-zinc-400"
                                                >
                                                    <Wrench className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Status dot */}
                                        <div
                                            className={`mb-2 h-3 w-3 rounded-full ${cfg.dot} ${effectiveStatus === "available" ? "animate-pulse" : ""}`}
                                        />

                                        {/* Rig name */}
                                        <span
                                            className={`text-sm font-semibold ${effectiveStatus === "out_of_order" ? "text-zinc-600" : "text-white"}`}
                                        >
                                            {rig.name}
                                        </span>

                                        {/* Status label */}
                                        <span
                                            className={`mt-0.5 text-[10px] font-medium ${cfg.labelColor}`}
                                        >
                                            {cfg.label}
                                        </span>

                                        {/* Booking info */}
                                        {booking &&
                                            effectiveStatus !== "available" && (
                                                <span className="mt-1 max-w-full truncate px-2 text-[10px] text-zinc-500">
                                                    {booking.customer_name}
                                                    {booking.time_slot &&
                                                        ` \u00b7 ${booking.time_slot}`}
                                                </span>
                                            )}

                                        {/* Specs */}
                                        <span
                                            className={`mt-1 text-[9px] ${effectiveStatus === "out_of_order" ? "text-zinc-700" : "text-zinc-600"}`}
                                        >
                                            {rig.specs}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Mobile legend */}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500 sm:hidden">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-amber-400" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-zinc-600" />
                            OOO
                        </div>
                    </div>
                </div>

                {/* ── Slot Timeline Heatmap ── */}
                {rigs.length > 0 && (
                <div className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <Clock className="h-4 w-4" />
                        Slot Overview
                        <span className="text-xs text-zinc-600">
                            &middot; {adminDate === todayStr ? "Today" : (() => {
                                const d = new Date(adminDate + "T00:00:00");
                                return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                            })()}
                        </span>
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-zinc-800">
                        <table className="w-full min-w-[640px] text-[10px]">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left text-xs font-medium text-zinc-500">
                                        Rig
                                    </th>
                                    {TIME_SLOTS.map((slot) => {
                                        const h = parseSlotHour(slot);
                                        const isCurrent = adminDate === todayStr && h === now.getHours();
                                        return (
                                            <th
                                                key={slot}
                                                onClick={() => setAdminSlot(adminSlot === slot ? null : slot)}
                                                className={`cursor-pointer px-1 py-2 text-center font-medium transition-colors ${
                                                    adminSlot === slot
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : isCurrent
                                                            ? "text-emerald-400"
                                                            : "text-zinc-600 hover:text-zinc-400"
                                                }`}
                                            >
                                                {shortSlotLabel(slot)}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {rigs.map((rig) => {
                                    const rigBookedSlots = rigSlotMap.get(rig.id);
                                    return (
                                        <tr key={rig.id} className="border-b border-zinc-800/50 last:border-0">
                                            <td className="sticky left-0 z-10 bg-zinc-950 px-3 py-1.5 font-medium text-zinc-300">
                                                {rig.name}
                                            </td>
                                            {TIME_SLOTS.map((slot) => {
                                                const booking = rigBookedSlots?.has(slot)
                                                    ? dateBookings.find((b) => b.rig_id === rig.id && b.time_slot === slot)
                                                    : null;
                                                const isOOO = rig.status === "out_of_order";
                                                const h = parseSlotHour(slot);
                                                const isPast = adminDate === todayStr && h < now.getHours();
                                                const isCurrent = adminDate === todayStr && h === now.getHours();

                                                let cellBg = "";
                                                let cellText = "";
                                                let tooltip = "Available";

                                                if (isOOO) {
                                                    cellBg = "bg-zinc-800/30";
                                                    cellText = "text-zinc-700";
                                                    tooltip = "Out of Order";
                                                } else if (booking) {
                                                    if (booking.source === "app") {
                                                        cellBg = "bg-red-500/15";
                                                        cellText = "text-red-400";
                                                    } else {
                                                        cellBg = "bg-amber-500/15";
                                                        cellText = "text-amber-400";
                                                    }
                                                    tooltip = `${booking.customer_name} (${booking.source === "app" ? "App" : "Walk-In"}) ${booking.verification_code}`;
                                                } else if (isPast) {
                                                    cellBg = "bg-zinc-900/30";
                                                    cellText = "text-zinc-800";
                                                    tooltip = "Past";
                                                }

                                                return (
                                                    <td
                                                        key={slot}
                                                        title={tooltip}
                                                        onClick={() => setAdminSlot(adminSlot === slot ? null : slot)}
                                                        className={`cursor-pointer px-1 py-1.5 text-center transition-all ${cellBg} ${
                                                            adminSlot === slot ? "ring-1 ring-inset ring-cyan-500/30" : ""
                                                        } ${isCurrent && !booking ? "ring-1 ring-inset ring-emerald-500/20" : ""}`}
                                                    >
                                                        {isOOO ? (
                                                            <span className={cellText}>&mdash;</span>
                                                        ) : booking ? (
                                                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                                                                booking.source === "app" ? "bg-red-400" : "bg-amber-400"
                                                            }`} title={tooltip} />
                                                        ) : isPast ? (
                                                            <span className="text-zinc-800">&middot;</span>
                                                        ) : (
                                                            <span className="text-zinc-700">&middot;</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Timeline legend */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                            App Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-700">&middot;</span>
                            Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-700">&mdash;</span>
                            Out of Order
                        </div>
                    </div>
                </div>
                )}

                {/* ── Bookings Schedule Ledger ── */}
                <div>
                    {(() => {
                        const ledgerBookings = adminSlot
                            ? dateBookings.filter((b) => b.time_slot === adminSlot)
                            : dateBookings;
                        const ledgerLabel = adminDate === todayStr ? "Today" : (() => {
                            const d = new Date(adminDate + "T00:00:00");
                            return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                        })();
                        return (<>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <Users className="h-4 w-4" />
                        {ledgerLabel}{adminSlot ? ` \u00b7 ${adminSlot}` : ""} Bookings
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                            {ledgerBookings.length}
                        </span>
                    </h2>

                    {ledgerBookings.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                            <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
                            <p className="text-sm text-zinc-500">
                                No bookings {adminSlot ? "for this slot" : "for this date"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-zinc-800">
                            {/* Desktop table */}
                            <div className="hidden sm:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Date
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Time
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Rig
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Customer
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Code
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Source
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerBookings.map((b) => (
                                            <tr
                                                key={b.id}
                                                className="border-b border-zinc-800/50 last:border-0"
                                            >
                                                <td className="px-4 py-3 text-zinc-400 text-xs">
                                                    {b.booking_date === todayStr ? "Today" : (() => {
                                                        const d = new Date(b.booking_date + "T00:00:00");
                                                        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-zinc-600" />
                                                        {b.time_slot}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {b.rig_name}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-400">
                                                    {b.customer_name}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-cyan-500">
                                                    {b.verification_code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                            b.source === "app"
                                                                ? "bg-cyan-500/10 text-cyan-400"
                                                                : "bg-amber-500/10 text-amber-400"
                                                        }`}
                                                    >
                                                        {b.source === "app"
                                                            ? "App"
                                                            : "Walk-In"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-zinc-800/50 sm:hidden">
                                {ledgerBookings.map((b) => (
                                    <div key={b.id} className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-white">
                                                {b.rig_name}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                    b.source === "app"
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : "bg-amber-500/10 text-amber-400"
                                                }`}
                                            >
                                                {b.source === "app"
                                                    ? "App"
                                                    : "Walk-In"}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {b.time_slot}
                                            </span>
                                            <span>{b.customer_name}</span>
                                            <span className="font-mono text-cyan-500/70">
                                                {b.verification_code}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </>);
                    })()}
                </div>
                </>)}
            </main>

            {/* ── Walk-In Modal ── */}
            {walkInTarget && (
                <WalkInModal
                    rig={walkInTarget}
                    initialDate={adminDate}
                    existingBookings={bookings}
                    onConfirm={handleBlockWalkIn}
                    onClose={() => setWalkInTarget(null)}
                    loading={actionLoading}
                />
            )}

            {/* ── Add Rig Modal ── */}
            {showAddRig && (
                <AddRigModal
                    onConfirm={handleAddRig}
                    onClose={() => setShowAddRig(false)}
                    loading={actionLoading}
                />
            )}

            {/* ── Edit Rig Modal ── */}
            {editTarget && (
                <EditRigModal
                    rig={editTarget}
                    onSave={handleEditRig}
                    onDelete={handleDeleteRig}
                    onClose={() => setEditTarget(null)}
                    loading={actionLoading}
                />
            )}

            {/* ── Add Venue Modal ── */}
            {showAddVenue && (
                <AddVenueModal
                    onConfirm={handleAddVenue}
                    onClose={() => setShowAddVenue(false)}
                    loading={actionLoading}
                />
            )}

            {/* ── Edit Venue Modal ── */}
            {editVenueTarget && (
                <EditVenueModal
                    venue={editVenueTarget}
                    onSave={handleEditVenue}
                    onDelete={handleDeleteVenue}
                    onClose={() => setEditVenueTarget(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

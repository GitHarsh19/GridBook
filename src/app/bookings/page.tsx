"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    CalendarCheck,
    Clock,
    MapPin,
    Monitor,
    AlertCircle,
    Loader2,
    X,
    ArrowLeft,
    CalendarX,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { getCustomerBookings, cancelBooking, type CustomerBooking } from "@/lib/data";
import { getTodayStr, formatBookingDate } from "@/lib/utils";

interface BookingGroup {
    verificationCode: string;
    venueName: string;
    venueLocation: string;
    bookingDate: string;
    customerName: string;
    source: "app" | "walk_in";
    slots: { time_slot: string; rig_name: string; id: number }[];
}

function groupBookings(bookings: CustomerBooking[]): BookingGroup[] {
    const map = new Map<string, BookingGroup>();
    for (const b of bookings) {
        const key = b.verification_code;
        if (!map.has(key)) {
            map.set(key, {
                verificationCode: b.verification_code,
                venueName: b.venue_name,
                venueLocation: b.venue_location,
                bookingDate: b.booking_date,
                customerName: b.customer_name,
                source: b.source,
                slots: [],
            });
        }
        map.get(key)!.slots.push({
            time_slot: b.time_slot,
            rig_name: b.rig_name,
            id: b.id,
        });
    }
    return Array.from(map.values());
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<CustomerBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

    const loadBookings = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Please sign in to view your bookings.");
                setIsLoading(false);
                return;
            }
            const data = await getCustomerBookings(session.user.id);
            setBookings(data);
            setError(null);
        } catch {
            setError("Failed to load bookings.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const handleCancel = async (verificationCode: string) => {
        if (!window.confirm("Cancel this booking? This action cannot be undone.")) return;
        setCancelling(verificationCode);
        setCancelError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const result = await cancelBooking(verificationCode, session.user.id);
            if (!result.success) {
                setCancelError(result.error ?? "Failed to cancel.");
                setTimeout(() => setCancelError(null), 4000);
            } else {
                await loadBookings();
            }
        } catch {
            setCancelError("Something went wrong.");
            setTimeout(() => setCancelError(null), 4000);
        } finally {
            setCancelling(null);
        }
    };

    const today = getTodayStr();
    const grouped = groupBookings(bookings);
    const upcoming = grouped.filter((g) => g.bookingDate >= today);
    const past = grouped.filter((g) => g.bookingDate < today);
    const displayed = tab === "upcoming" ? upcoming : past;

    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-6">
                <Link
                    href="/explore"
                    className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to venues
                </Link>

                <div className="mb-6">
                    <h1 className="text-xl font-bold text-white sm:text-2xl">My Bookings</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        View and manage your sim racing sessions
                    </p>
                </div>

                {/* Tab bar */}
                <div className="mb-6 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
                    <button
                        onClick={() => setTab("upcoming")}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                            tab === "upcoming"
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        Upcoming
                        {upcoming.length > 0 && (
                            <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs">
                                {upcoming.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab("past")}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                            tab === "past"
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        Past
                        {past.length > 0 && (
                            <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                                {past.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Cancel error */}
                {cancelError && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {cancelError}
                    </div>
                )}

                {/* Loading */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="mb-3 h-8 w-8 animate-spin text-zinc-600" />
                        <p className="text-sm text-zinc-500">Loading your bookings…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="mb-3 h-10 w-10 text-red-500/50" />
                        <p className="text-sm text-zinc-400">{error}</p>
                        <button
                            onClick={loadBookings}
                            className="mt-4 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Retry
                        </button>
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <CalendarX className="mb-3 h-10 w-10 text-zinc-700" />
                        <p className="text-sm font-medium text-zinc-400">
                            {tab === "upcoming"
                                ? "No upcoming bookings"
                                : "No past bookings"}
                        </p>
                        {tab === "upcoming" && (
                            <Link
                                href="/explore"
                                className="mt-4 rounded-md bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500"
                            >
                                Explore Venues
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayed.map((group) => {
                            const isPast = group.bookingDate < today;
                            const isCancelling = cancelling === group.verificationCode;
                            const uniqueRigs = [...new Set(group.slots.map((s) => s.rig_name))];
                            const uniqueSlots = [...new Set(group.slots.map((s) => s.time_slot))];

                            return (
                                <div
                                    key={group.verificationCode}
                                    className={`overflow-hidden rounded-lg border ${
                                        isPast
                                            ? "border-zinc-800/50 bg-zinc-900/50"
                                            : "border-zinc-800 bg-zinc-900"
                                    }`}
                                >
                                    <div className="p-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className={`text-sm font-bold ${isPast ? "text-zinc-500" : "text-white"}`}>
                                                    {group.venueName}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                                                    <MapPin className="h-3 w-3" />
                                                    {group.venueLocation}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                                    group.source === "app"
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : "bg-amber-500/10 text-amber-400"
                                                }`}>
                                                    {group.source === "app" ? "App" : "Walk-In"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                                            <span className={`flex items-center gap-1.5 ${isPast ? "text-zinc-600" : "text-zinc-400"}`}>
                                                <CalendarCheck className="h-3.5 w-3.5" />
                                                {formatBookingDate(group.bookingDate)}
                                            </span>
                                            <span className={`flex items-center gap-1.5 ${isPast ? "text-zinc-600" : "text-zinc-400"}`}>
                                                <Clock className="h-3.5 w-3.5" />
                                                {uniqueSlots.length} {uniqueSlots.length === 1 ? "slot" : "slots"}
                                            </span>
                                            <span className={`flex items-center gap-1.5 ${isPast ? "text-zinc-600" : "text-zinc-400"}`}>
                                                <Monitor className="h-3.5 w-3.5" />
                                                {uniqueRigs.join(", ")}
                                            </span>
                                        </div>

                                        {/* Time slots */}
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {uniqueSlots.map((slot) => (
                                                <span
                                                    key={slot}
                                                    className={`rounded-md border px-2 py-1 text-[10px] font-medium ${
                                                        isPast
                                                            ? "border-zinc-800/50 text-zinc-600"
                                                            : "border-zinc-700 bg-zinc-800 text-zinc-300"
                                                    }`}
                                                >
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Verification code + cancel */}
                                        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                                            <div className={`font-mono text-sm font-bold ${isPast ? "text-zinc-600" : "text-cyan-500"}`}>
                                                {group.verificationCode}
                                            </div>
                                            {!isPast && group.source === "app" && (
                                                <button
                                                    onClick={() => handleCancel(group.verificationCode)}
                                                    disabled={isCancelling}
                                                    className="flex cursor-pointer items-center gap-1 rounded-md border border-red-800/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                                                >
                                                    {isCancelling ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                    {isCancelling ? "Cancelling…" : "Cancel"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

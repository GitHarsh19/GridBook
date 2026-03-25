"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    CalendarCheck, Clock, MapPin, Monitor, AlertCircle,
    Loader2, X, ArrowLeft, CalendarX, ExternalLink, Pencil,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ModifyBookingModal } from "@/components/ModifyBookingModal";
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
        map.get(key)!.slots.push({ time_slot: b.time_slot, rig_name: b.rig_name, id: b.id });
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
    const [modifyTarget, setModifyTarget] = useState<BookingGroup | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const loadBookings = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setError("Please sign in to view your bookings."); setIsLoading(false); return; }
            setUserId(session.user.id);
            const data = await getCustomerBookings(session.user.id);
            setBookings(data);
            setError(null);
        } catch {
            setError("Failed to load bookings.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadBookings(); }, [loadBookings]);

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
        <div className="min-h-screen bg-surface font-outfit text-on-surface-variant antialiased">
            <Navbar />
            <main className="mx-auto max-w-[var(--max-width-container)] px-8 py-10">

                {/* Back */}
                <Link href="/explore" className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-variant/60 transition-colors hover:text-on-surface">
                    <ArrowLeft className="h-4 w-4" />
                    Back to venues
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-btn-red">Your Sessions</p>
                    <h1 className="font-extrabold leading-none tracking-[-0.04em] text-white" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                        My Bookings
                    </h1>
                    <p className="mt-3 text-sm text-on-surface font-medium">
                        View and manage your sim racing sessions
                    </p>
                </div>

                {/* Tab bar */}
                <div className="mb-8 flex gap-1 rounded-2xl bg-surface-container p-1" style={{ maxWidth: 320 }}>
                    {(["upcoming", "past"] as const).map((t) => {
                        const count = t === "upcoming" ? upcoming.length : past.length;
                        return (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
                                    tab === t
                                        ? "bg-btn-red text-white shadow-sm"
                                        : "text-on-surface-variant/60 hover:text-on-surface"
                                }`}
                            >
                                {t}
                                {count > 0 && (
                                    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                        tab === t ? "bg-white/20 text-white" : "bg-surface-container-high text-on-surface-variant/60"
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Cancel error */}
                {cancelError && (
                    <div className="mb-6 flex items-center gap-2 rounded-2xl bg-btn-red/[0.08] px-5 py-3 text-sm text-btn-red">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {cancelError}
                    </div>
                )}

                {/* Loading */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-28">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-on-surface-variant/30" />
                        <p className="text-sm text-on-surface-variant/50">Loading your bookings…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <AlertCircle className="mb-4 h-12 w-12 text-btn-red/30" />
                        <p className="text-sm text-on-surface">{error}</p>
                        <button
                            onClick={loadBookings}
                            className="mt-6 rounded-full bg-surface-container px-6 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                        >
                            Retry
                        </button>
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <CalendarX className="mb-4 h-12 w-12 text-surface-container-highest" />
                        <p className="text-base font-semibold text-on-surface">
                            {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
                        </p>
                        {tab === "upcoming" && (
                            <Link
                                href="/explore"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-btn-red px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98]"
                            >
                                Explore Venues
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 max-w-2xl">
                        {displayed.map((group) => {
                            const isPast = group.bookingDate < today;
                            const isCancelling = cancelling === group.verificationCode;
                            const uniqueRigs = [...new Set(group.slots.map((s) => s.rig_name))];
                            const uniqueSlots = [...new Set(group.slots.map((s) => s.time_slot))];

                            return (
                                <div
                                    key={group.verificationCode}
                                    className={`overflow-hidden rounded-2xl transition-colors ${isPast ? "bg-surface-container/50" : "bg-surface-container"}`}
                                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={`text-base font-bold tracking-tight ${isPast ? "text-on-surface-variant/40" : "text-on-surface"}`}>
                                                    {group.venueName}
                                                </h3>
                                                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-on-surface-variant/50">
                                                    <MapPin className="h-3 w-3 text-btn-red/50" />
                                                    {group.venueLocation}
                                                </div>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                group.source === "app"
                                                    ? "bg-btn-red/10 text-btn-red"
                                                    : "bg-secondary/10 text-secondary"
                                            }`}>
                                                {group.source === "app" ? "App" : "Walk-In"}
                                            </span>
                                        </div>

                                        {/* Details row */}
                                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-on-surface-variant/50">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarCheck className="h-3.5 w-3.5" />
                                                {formatBookingDate(group.bookingDate)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                {uniqueSlots.length} {uniqueSlots.length === 1 ? "slot" : "slots"}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Monitor className="h-3.5 w-3.5" />
                                                {uniqueRigs.join(", ")}
                                            </span>
                                        </div>

                                        {/* Time slot chips */}
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {uniqueSlots.map((slot) => (
                                                <span
                                                    key={slot}
                                                    className={`rounded-lg px-2.5 py-1 text-[10px] font-medium ${
                                                        isPast
                                                            ? "bg-surface-container-high/50 text-on-surface-variant/25"
                                                            : "bg-surface-container-high text-on-surface-variant/70"
                                                    }`}
                                                >
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-5 flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono text-sm font-bold tracking-wider ${isPast ? "text-on-surface-variant/30" : "text-primary"}`}>
                                                    {group.verificationCode}
                                                </span>
                                                {!isPast && (
                                                    <Link
                                                        href={`/bookings/${group.verificationCode}`}
                                                        className="flex items-center gap-1 text-[10px] text-on-surface-variant/40 transition-colors hover:text-on-surface-variant"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Details
                                                    </Link>
                                                )}
                                            </div>
                                            {!isPast && group.source === "app" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setModifyTarget(group)}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface-variant/70 transition-colors hover:bg-surface-container-highest hover:text-on-surface"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                        Modify
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(group.verificationCode)}
                                                        disabled={isCancelling}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-btn-red/10 px-3 py-1.5 text-xs font-medium text-btn-red transition-colors hover:bg-btn-red/20 disabled:opacity-50"
                                                    >
                                                        {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                                        {isCancelling ? "Cancelling…" : "Cancel"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {modifyTarget && userId && (
                <ModifyBookingModal
                    verificationCode={modifyTarget.verificationCode}
                    userId={userId}
                    currentDate={modifyTarget.bookingDate}
                    currentSlots={[...new Set(modifyTarget.slots.map((s) => s.time_slot))]}
                    onClose={() => setModifyTarget(null)}
                    onSuccess={() => { setModifyTarget(null); loadBookings(); }}
                />
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, CalendarCheck, Clock, MapPin, Monitor, Gamepad2, Glasses,
    Loader2, AlertCircle, CalendarPlus, Copy, Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TicketQR } from "@/components/TicketQR";
import { supabase } from "@/lib/supabase";
import { getCustomerBookings, type CustomerBooking, type RigType } from "@/lib/data";

const RIG_TYPE_LABEL: Record<RigType, string> = { pc: "PC", playstation: "PlayStation", xbox: "Xbox", vr: "VR" };
const RIG_TYPE_COLOR: Record<RigType, string> = { pc: "text-orange-400", playstation: "text-blue-400", xbox: "text-green-400", vr: "text-purple-400" };

function RigTypeIcon({ type, className }: { type: RigType; className?: string }) {
    if (type === "pc") return <Monitor className={className} />;
    if (type === "vr") return <Glasses className={className} />;
    return <Gamepad2 className={className} />;
}
import { formatBookingDate } from "@/lib/utils";

interface BookingGroup {
    verificationCode: string;
    checkInToken: string | null;
    venueName: string;
    venueLocation: string;
    bookingDate: string;
    customerName: string;
    source: "app" | "walk_in";
    slots: { time_slot: string; rig_name: string; rig_type: RigType; id: number }[];
}

function groupByCode(bookings: CustomerBooking[], code: string): BookingGroup | null {
    const matching = bookings.filter((b) => b.verification_code === code);
    if (matching.length === 0) return null;
    const first = matching[0];
    return {
        verificationCode: first.verification_code,
        checkInToken: first.check_in_token,
        venueName: first.venue_name,
        venueLocation: first.venue_location,
        bookingDate: first.booking_date,
        customerName: first.customer_name,
        source: first.source,
        slots: matching.map((b) => ({ time_slot: b.time_slot, rig_name: b.rig_name, rig_type: b.rig_type, id: b.id })),
    };
}

function generateICS(group: BookingGroup): string {
    const uniqueSlots = [...new Set(group.slots.map((s) => s.time_slot))];
    const uniqueRigs = [...new Set(group.slots.map((s) => s.rig_name))];
    const hours = uniqueSlots.map((slot) => {
        const startMatch = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
        const endMatch = slot.match(/–\s*(\d{1,2}):00\s*(AM|PM)/i);
        let startH = 0, endH = 0;
        if (startMatch) { startH = parseInt(startMatch[1], 10); if (startMatch[2].toUpperCase() === "PM" && startH !== 12) startH += 12; if (startMatch[2].toUpperCase() === "AM" && startH === 12) startH = 0; }
        if (endMatch) { endH = parseInt(endMatch[1], 10); if (endMatch[2].toUpperCase() === "PM" && endH !== 12) endH += 12; if (endMatch[2].toUpperCase() === "AM" && endH === 12) endH = 0; }
        return { startH, endH };
    });
    const minStart = Math.min(...hours.map((h) => h.startH));
    const maxEnd = Math.max(...hours.map((h) => h.endH));
    const dateStr = group.bookingDate.replace(/-/g, "");
    const now = new Date();
    return [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PitPass//Booking//EN",
        "BEGIN:VEVENT",
        `DTSTART:${dateStr}T${String(minStart).padStart(2, "0")}0000`,
        `DTEND:${dateStr}T${String(maxEnd).padStart(2, "0")}0000`,
        `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `UID:${group.verificationCode}@pitpass`,
        `SUMMARY:Sim Racing @ ${group.venueName}`,
        `DESCRIPTION:Booking Code: ${group.verificationCode}\\nRigs: ${uniqueRigs.join(", ")}\\nSlots: ${uniqueSlots.join(", ")}`,
        `LOCATION:${group.venueLocation}`,
        "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
}

export default function BookingConfirmationPage() {
    const params = useParams();
    const code = (params?.code as string) ?? "";
    const [group, setGroup] = useState<BookingGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const loadBooking = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setError("Please sign in to view this booking."); setIsLoading(false); return; }
            const bookings = await getCustomerBookings(session.user.id);
            const found = groupByCode(bookings, code);
            if (!found) { setError("Booking not found. It may have been cancelled."); setIsLoading(false); return; }
            setGroup(found);
        } catch {
            setError("Failed to load booking details.");
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    useEffect(() => { if (code) loadBooking(); }, [code, loadBooking]);

    const handleAddToCalendar = () => {
        if (!group) return;
        const blob = new Blob([generateICS(group)], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `pitpass-${group.verificationCode}.ics`; a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyCode = async () => {
        if (!group) return;
        await navigator.clipboard.writeText(group.verificationCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    return (
        <div className="min-h-screen bg-surface font-outfit text-on-surface-variant antialiased">
            <Navbar />
            <main className="mx-auto max-w-lg px-8 py-10">
                <Link href="/bookings" className="mb-8 inline-flex items-center gap-2 text-sm text-on-surface-variant/60 transition-colors hover:text-on-surface">
                    <ArrowLeft className="h-4 w-4" />
                    All Bookings
                </Link>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-28">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-on-surface-variant/30" />
                        <p className="text-sm text-on-surface-variant/50">Loading booking…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <AlertCircle className="mb-4 h-12 w-12 text-btn-red/30" />
                        <p className="text-sm text-on-surface">{error}</p>
                        <Link href="/bookings" className="mt-6 rounded-full bg-surface-container px-6 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
                            View All Bookings
                        </Link>
                    </div>
                ) : group ? (
                    <div className="space-y-5">
                        {/* Success header */}
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                                <CalendarCheck className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h1 className="text-2xl font-black tracking-[-0.03em] text-on-surface">Booking Confirmed</h1>
                            <p className="mt-2 text-sm text-on-surface-variant/60">
                                Show the QR code at the venue to check in
                            </p>
                        </div>

                        {/* QR Code card */}
                        <TicketQR checkInToken={group.checkInToken} />
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-xl font-bold tracking-wider text-primary">
                                {group.verificationCode}
                            </span>
                            <button
                                onClick={handleCopyCode}
                                className="rounded-lg p-1.5 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                                title="Copy code"
                            >
                                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Booking details */}
                        <div className="rounded-2xl bg-surface-container p-5" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-btn-red">Booking Details</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="h-4 w-4 shrink-0 text-btn-red/50" />
                                    <div>
                                        <div className="font-semibold text-on-surface">{group.venueName}</div>
                                        <div className="text-xs text-on-surface-variant/50">{group.venueLocation}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-on-surface-variant/60">
                                    <CalendarCheck className="h-4 w-4 shrink-0 text-on-surface-variant/30" />
                                    <span>{formatBookingDate(group.bookingDate)}</span>
                                    <span className="text-on-surface-variant/30">({group.bookingDate})</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-on-surface-variant/60">
                                    <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/30" />
                                    <div className="flex flex-wrap gap-2">
                                        {[...new Map(group.slots.map((s) => [s.rig_name, s.rig_type])).entries()].map(([name, type]) => (
                                            <span key={name} className="inline-flex items-center gap-1.5">
                                                <RigTypeIcon type={type} className={`h-3.5 w-3.5 ${RIG_TYPE_COLOR[type]}`} />
                                                <span>{name}</span>
                                                <span className={`text-[10px] font-semibold ${RIG_TYPE_COLOR[type]}`}>{RIG_TYPE_LABEL[type]}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-on-surface-variant/60">
                                    <Clock className="h-4 w-4 shrink-0 text-on-surface-variant/30" />
                                    <span>{[...new Set(group.slots.map((s) => s.time_slot))].length} {[...new Set(group.slots.map((s) => s.time_slot))].length === 1 ? "slot" : "slots"}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {[...new Set(group.slots.map((s) => s.time_slot))].map((slot) => (
                                    <span key={slot} className="rounded-lg bg-surface-container-high px-2.5 py-1 text-[10px] font-medium text-on-surface-variant/60">
                                        {slot}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddToCalendar}
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-on-surface bg-transparent py-3 text-sm font-medium text-on-surface-variant transition-all duration-300 hover:border-white hover:bg-surface-container hover:text-on-surface active:scale-[0.98]"
                            >
                                <CalendarPlus className="h-4 w-4" />
                                Add to Calendar
                            </button>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

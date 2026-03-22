"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import {
    ArrowLeft,
    CalendarCheck,
    Clock,
    MapPin,
    Monitor,
    Loader2,
    AlertCircle,
    Download,
    CalendarPlus,
    Copy,
    Check,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { getCustomerBookings, type CustomerBooking } from "@/lib/data";
import { formatBookingDate } from "@/lib/utils";

interface BookingGroup {
    verificationCode: string;
    venueName: string;
    venueLocation: string;
    bookingDate: string;
    customerName: string;
    source: "app" | "walk_in";
    slots: { time_slot: string; rig_name: string; id: number }[];
}

function groupByCode(bookings: CustomerBooking[], code: string): BookingGroup | null {
    const matching = bookings.filter((b) => b.verification_code === code);
    if (matching.length === 0) return null;
    const first = matching[0];
    return {
        verificationCode: first.verification_code,
        venueName: first.venue_name,
        venueLocation: first.venue_location,
        bookingDate: first.booking_date,
        customerName: first.customer_name,
        source: first.source,
        slots: matching.map((b) => ({
            time_slot: b.time_slot,
            rig_name: b.rig_name,
            id: b.id,
        })),
    };
}

function generateICS(group: BookingGroup): string {
    const uniqueSlots = [...new Set(group.slots.map((s) => s.time_slot))];
    const uniqueRigs = [...new Set(group.slots.map((s) => s.rig_name))];

    // Parse first slot start and last slot end for the event time range
    const hours = uniqueSlots.map((slot) => {
        const startMatch = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
        const endMatch = slot.match(/–\s*(\d{1,2}):00\s*(AM|PM)/i);
        let startH = 0, endH = 0;
        if (startMatch) {
            startH = parseInt(startMatch[1], 10);
            const p = startMatch[2].toUpperCase();
            if (p === "PM" && startH !== 12) startH += 12;
            if (p === "AM" && startH === 12) startH = 0;
        }
        if (endMatch) {
            endH = parseInt(endMatch[1], 10);
            const p = endMatch[2].toUpperCase();
            if (p === "PM" && endH !== 12) endH += 12;
            if (p === "AM" && endH === 12) endH = 0;
        }
        return { startH, endH };
    });

    const minStart = Math.min(...hours.map((h) => h.startH));
    const maxEnd = Math.max(...hours.map((h) => h.endH));

    const dateStr = group.bookingDate.replace(/-/g, "");
    const dtStart = `${dateStr}T${String(minStart).padStart(2, "0")}0000`;
    const dtEnd = `${dateStr}T${String(maxEnd).padStart(2, "0")}0000`;

    const now = new Date();
    const dtstamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GridBook//Booking//EN",
        "BEGIN:VEVENT",
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `DTSTAMP:${dtstamp}`,
        `UID:${group.verificationCode}@gridbook`,
        `SUMMARY:Sim Racing @ ${group.venueName}`,
        `DESCRIPTION:Booking Code: ${group.verificationCode}\\nRigs: ${uniqueRigs.join(", ")}\\nSlots: ${uniqueSlots.join(", ")}`,
        `LOCATION:${group.venueLocation}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
}

export default function BookingConfirmationPage() {
    const params = useParams();
    const code = (params?.code as string) ?? "";

    const [group, setGroup] = useState<BookingGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const loadBooking = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Please sign in to view this booking.");
                setIsLoading(false);
                return;
            }
            const bookings = await getCustomerBookings(session.user.id);
            const found = groupByCode(bookings, code);
            if (!found) {
                setError("Booking not found. It may have been cancelled.");
                setIsLoading(false);
                return;
            }
            setGroup(found);

            // Generate QR code
            const qr = await QRCode.toDataURL(found.verificationCode, {
                width: 200,
                margin: 2,
                color: { dark: "#06b6d4", light: "#09090b" },
            });
            setQrDataUrl(qr);
        } catch {
            setError("Failed to load booking details.");
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    useEffect(() => {
        if (code) loadBooking();
    }, [code, loadBooking]);

    const handleAddToCalendar = () => {
        if (!group) return;
        const ics = generateICS(group);
        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gridbook-${group.verificationCode}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyCode = async () => {
        if (!group) return;
        await navigator.clipboard.writeText(group.verificationCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        if (!qrDataUrl || !group) return;
        const a = document.createElement("a");
        a.href = qrDataUrl;
        a.download = `qr-${group.verificationCode}.png`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar />
            <main className="mx-auto max-w-lg px-4 py-6">
                <Link
                    href="/bookings"
                    className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    All Bookings
                </Link>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="mb-3 h-8 w-8 animate-spin text-zinc-600" />
                        <p className="text-sm text-zinc-500">Loading booking…</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertCircle className="mb-3 h-10 w-10 text-red-500/50" />
                        <p className="text-sm text-zinc-400">{error}</p>
                        <Link
                            href="/bookings"
                            className="mt-4 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            View All Bookings
                        </Link>
                    </div>
                ) : group ? (
                    <div className="space-y-6">
                        {/* Success header */}
                        <div className="text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                                <CalendarCheck className="h-7 w-7 text-emerald-400" />
                            </div>
                            <h1 className="text-xl font-bold text-white">Booking Confirmed</h1>
                            <p className="mt-1 text-sm text-zinc-500">
                                Show the QR code at the venue to check in
                            </p>
                        </div>

                        {/* QR Code card */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                            <div className="flex flex-col items-center gap-4">
                                {qrDataUrl && (
                                    <img
                                        src={qrDataUrl}
                                        alt={`QR code for ${group.verificationCode}`}
                                        className="h-48 w-48 rounded-lg"
                                    />
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xl font-bold text-cyan-400">
                                        {group.verificationCode}
                                    </span>
                                    <button
                                        onClick={handleCopyCode}
                                        className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                                        title="Copy code"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-emerald-400" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Booking details */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <h2 className="mb-3 text-sm font-bold text-white">Booking Details</h2>
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <MapPin className="h-4 w-4 shrink-0 text-zinc-600" />
                                    <div>
                                        <div className="text-white">{group.venueName}</div>
                                        <div className="text-xs text-zinc-500">{group.venueLocation}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <CalendarCheck className="h-4 w-4 shrink-0 text-zinc-600" />
                                    <span>{formatBookingDate(group.bookingDate)}</span>
                                    <span className="text-zinc-600">({group.bookingDate})</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Monitor className="h-4 w-4 shrink-0 text-zinc-600" />
                                    <span>{[...new Set(group.slots.map((s) => s.rig_name))].join(", ")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Clock className="h-4 w-4 shrink-0 text-zinc-600" />
                                    <span>
                                        {[...new Set(group.slots.map((s) => s.time_slot))].length}{" "}
                                        {[...new Set(group.slots.map((s) => s.time_slot))].length === 1 ? "slot" : "slots"}
                                    </span>
                                </div>
                            </div>

                            {/* Time slots */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {[...new Set(group.slots.map((s) => s.time_slot))].map((slot) => (
                                    <span
                                        key={slot}
                                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300"
                                    >
                                        {slot}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleAddToCalendar}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                            >
                                <CalendarPlus className="h-4 w-4" />
                                Add to Calendar
                            </button>
                            <button
                                onClick={handleDownloadQR}
                                disabled={!qrDataUrl}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                Save QR Code
                            </button>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

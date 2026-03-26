"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { DateSelector } from "@/components/DateSelector";
import { TimeSelector } from "@/components/TimeSelector";
import { RigGrid } from "@/components/RigGrid";
import { CheckoutBar } from "@/components/CheckoutBar";
import { type Venue, TIME_SLOTS, getBookedRigIdsForSlots, getVenueById, releaseExpiredWalkIns } from "@/lib/data";
import { getTodayStr, parseSlotStartHour } from "@/lib/utils";

export default function BookingClient({ venue: initialVenue }: { venue: Venue }) {
    const router = useRouter();
    const [venue, setVenue] = useState<Venue>(initialVenue);
    const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
    const [selectedRigs, setSelectedRigs] = useState<number[]>([]);
    const [bookedRigIds, setBookedRigIds] = useState<Set<number>>(new Set());
    const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

    useEffect(() => {
        const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
        return () => clearInterval(timer);
    }, []);

    const disabledSlots = useMemo(() => {
        const todayStr = getTodayStr();
        if (selectedDate !== todayStr) return new Set<string>();
        const past = new Set<string>();
        for (const slot of TIME_SLOTS) {
            if (parseSlotStartHour(slot) < currentHour) past.add(slot);
        }
        return past;
    }, [selectedDate, currentHour]);

    useEffect(() => {
        releaseExpiredWalkIns().catch(() => {});
        const interval = setInterval(() => releaseExpiredWalkIns().catch(() => {}), 30_000);
        return () => clearInterval(interval);
    }, []);

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSelectedTimeSlots([]);
        setSelectedRigs([]);
        setBookedRigIds(new Set());
    };

    useEffect(() => {
        if (disabledSlots.size === 0) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTimeSlots((prev) => {
            const filtered = prev.filter((s) => !disabledSlots.has(s));
            return filtered.length !== prev.length ? filtered : prev;
        });
    }, [disabledSlots]);

    useEffect(() => {
        if (selectedTimeSlots.length === 0) {
            setBookedRigIds(new Set()); // eslint-disable-line react-hooks/set-state-in-effect
            return;
        }
        let cancelled = false;
        getBookedRigIdsForSlots(venue.id, selectedTimeSlots, selectedDate).then((ids) => {
            if (!cancelled) setBookedRigIds(ids);
        });
        return () => { cancelled = true; };
    }, [venue.id, selectedTimeSlots, selectedDate]);

    useEffect(() => {
        const availableIds = new Set(venue.rigs.filter((r) => r.status === "available").map((r) => r.id));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedRigs((prev) => prev.filter((id) => availableIds.has(id) && !bookedRigIds.has(id)));
    }, [venue.rigs, bookedRigIds]);

    const toggleTimeSlot = (slot: string) => {
        setSelectedTimeSlots((prev) =>
            prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
        );
    };

    const toggleRig = (rigId: number) => {
        setSelectedRigs((prev) =>
            prev.includes(rigId) ? prev.filter((id) => id !== rigId) : [...prev, rigId]
        );
    };

    const handleBookingComplete = async (code: string) => {
        router.push(`/bookings/${code}`);
        setSelectedRigs([]);
        setSelectedTimeSlots([]);
        try {
            const updated = await getVenueById(venue.id);
            if (updated) setVenue(updated);
        } catch { /* silently fail */ }
    };

    return (
        <div className={`min-h-screen bg-surface font-outfit text-on-surface-variant antialiased ${selectedRigs.length > 0 ? "pb-36" : ""}`}>
            <Navbar floating />
            <main className="mx-auto max-w-[var(--max-width-container)] px-8 pt-28 pb-10">

                {/* Back link */}
                <Link
                    href="/explore"
                    className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-variant/60 transition-colors hover:text-on-surface"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to venues
                </Link>

                {/* Venue hero card */}
                <div className="mb-10 overflow-hidden rounded-2xl bg-surface-container" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    {venue.imageUrl && (
                        <div className="relative h-64 w-full overflow-hidden">
                            <img
                                src={venue.imageUrl}
                                alt={venue.name}
                                className="h-full w-full object-cover"
                            />
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: "linear-gradient(to top, rgba(31,31,31,0.95) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.05) 100%)" }}
                            />
                            {/* Availability badge on image */}
                            <div className="absolute bottom-4 left-3 sm:left-6">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-semibold ${
                                        venue.availableRigs > 0
                                            ? "bg-emerald-500/15 text-emerald-300"
                                            : "bg-red-500/15 text-red-300"
                                    }`}
                                    style={{ backdropFilter: "blur(8px)" }}
                                >
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${venue.availableRigs > 0 ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                                    {venue.availableRigs} of {venue.totalRigs} rigs available
                                </span>
                            </div>
                            {/* Price badge on image */}
                            <div
                                className="absolute bottom-4 right-3 sm:right-6 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-primary"
                                style={{ background: "rgba(19,19,19,0.75)", backdropFilter: "blur(12px)" }}
                            >
                                ₹{venue.price}<span className="text-[10px] sm:text-xs font-normal text-on-surface-variant/60">/hr per rig</span>
                            </div>
                        </div>
                    )}
                    <div className="px-6 py-5">
                        <h1 className="text-2xl font-black tracking-[-0.03em] text-on-surface">{venue.name}</h1>
                        <div className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-variant/70">
                            <MapPin className="h-3.5 w-3.5 text-btn-red" />
                            {venue.location}
                        </div>
                        {venue.description && (
                            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant/60">{venue.description}</p>
                        )}
                    </div>
                </div>

                {/* Date selector */}
                <div className="mb-8">
                    <DateSelector selectedDate={selectedDate} onSelect={handleDateChange} />
                </div>

                {/* Time selector */}
                <div className="mb-8">
                    <TimeSelector
                        selectedSlots={selectedTimeSlots}
                        onToggle={toggleTimeSlot}
                        onClear={() => setSelectedTimeSlots([])}
                        disabledSlots={disabledSlots}
                    />
                </div>

                {/* Rig grid */}
                <RigGrid
                    rigs={venue.rigs}
                    selectedRigs={selectedRigs}
                    onToggle={toggleRig}
                    onClear={() => setSelectedRigs([])}
                    bookedRigIds={selectedTimeSlots.length > 0 ? bookedRigIds : undefined}
                />
            </main>

            <CheckoutBar
                venueId={venue.id}
                selectedRigs={selectedRigs}
                selectedSlots={selectedTimeSlots}
                rigs={venue.rigs}
                price={venue.price}
                bookingDate={selectedDate}
                onBookingComplete={handleBookingComplete}
            />
        </div>
    );
}

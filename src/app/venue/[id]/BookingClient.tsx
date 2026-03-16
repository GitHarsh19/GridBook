"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { TimeSelector } from "@/components/TimeSelector";
import { RigGrid } from "@/components/RigGrid";
import { CheckoutBar } from "@/components/CheckoutBar";
import type { Venue } from "@/lib/data";

export default function BookingClient({ venue }: { venue: Venue }) {
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
    const [selectedRigs, setSelectedRigs] = useState<number[]>([]);

    // Auto-deselect rigs that become unavailable (e.g. booked/blocked by admin)
    useEffect(() => {
        const availableIds = new Set(
            venue.rigs.filter((r) => r.status === "available").map((r) => r.id)
        );
        setSelectedRigs((prev) => prev.filter((id) => availableIds.has(id)));
    }, [venue.rigs]);

    const toggleTimeSlot = (slot: string) => {
        setSelectedTimeSlots((prev) =>
            prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
        );
    };

    const toggleRig = (rigId: number) => {
        setSelectedRigs((prev) =>
            prev.includes(rigId)
                ? prev.filter((id) => id !== rigId)
                : [...prev, rigId]
        );
    };

    return (
        <div
            className={`min-h-screen bg-zinc-950 ${selectedRigs.length > 0 ? "pb-36" : ""}`}
        >
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-6">
                {/* Back + Header */}
                <Link
                    href="/explore"
                    className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to venues
                </Link>

                <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <h2 className="text-lg font-bold text-white">{venue.name}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <MapPin className="h-3 w-3" />
                        {venue.location}
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">{venue.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                        <span className="font-medium text-white">
                            ₹{venue.price}
                            <span className="text-zinc-500">/hr per rig</span>
                        </span>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${venue.availableRigs > 0
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                                }`}
                        >
                            <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${venue.availableRigs > 0 ? "bg-emerald-400" : "bg-red-400"
                                    }`}
                            />
                            {venue.availableRigs} of {venue.totalRigs} Available
                        </span>
                    </div>
                </div>

                {/* Time selector */}
                <div className="mb-6">
                    <TimeSelector
                        selectedSlots={selectedTimeSlots}
                        onToggle={toggleTimeSlot}
                        onClear={() => setSelectedTimeSlots([])}
                    />
                </div>

                {/* Rig grid */}
                <RigGrid
                    rigs={venue.rigs}
                    selectedRigs={selectedRigs}
                    onToggle={toggleRig}
                    onClear={() => setSelectedRigs([])}
                />
            </main>

            {/* Checkout bar */}
            <CheckoutBar
                selectedRigs={selectedRigs}
                selectedSlots={selectedTimeSlots}
                rigs={venue.rigs}
                price={venue.price}
            />
        </div>
    );
}

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useRealtimeVenue } from "@/lib/hooks/useRealtimeVenues";
import BookingClient from "./BookingClient";

function VenueBookingSkeleton() {
    return (
        <div className="min-h-screen bg-surface font-outfit">
            <Navbar />
            <main className="mx-auto max-w-[var(--max-width-container)] px-8 py-10">
                <div className="mb-6 h-3 w-24 animate-pulse rounded-full bg-surface-container-high" />
                <div className="mb-8 animate-pulse overflow-hidden rounded-2xl bg-surface-container">
                    <div className="h-64 w-full bg-surface-container-high" />
                    <div className="p-6 space-y-3">
                        <div className="h-5 w-48 rounded-full bg-surface-container-high" />
                        <div className="h-3 w-32 rounded-full bg-surface-container-high/70" />
                        <div className="h-3 w-full rounded-full bg-surface-container-high/50" />
                        <div className="flex gap-3 pt-1">
                            <div className="h-5 w-20 rounded-full bg-surface-container-high" />
                            <div className="h-5 w-28 rounded-full bg-surface-container-high/60" />
                        </div>
                    </div>
                </div>
                <div className="mb-6">
                    <div className="mb-3 h-3 w-24 rounded-full bg-surface-container-high" />
                    <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-surface-container" />
                        ))}
                    </div>
                </div>
                <div>
                    <div className="mb-3 h-3 w-20 rounded-full bg-surface-container-high" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function VenueBookingContent() {
    const { id } = useParams<{ id: string }>();
    const numId = Number(id);
    const { venue, error: loadError } = useRealtimeVenue(!id || isNaN(numId) ? 0 : numId);
    const error = !!loadError;

    if (venue === undefined && !error) return <VenueBookingSkeleton />;

    if (error || !venue) {
        return (
            <div className="min-h-screen bg-surface font-outfit">
                <Navbar />
                <main className="mx-auto max-w-[var(--max-width-container)] px-8 py-28 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-surface-container-highest" />
                    <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                        {error ? "Something went wrong" : "Venue not found"}
                    </h1>
                    <p className="mt-3 text-sm text-on-surface-variant/60">
                        {error
                            ? "We couldn\u2019t load this venue. Please try again."
                            : "This venue may have been removed or the link is incorrect."}
                    </p>
                    <Link
                        href="/explore"
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-btn-red px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to venues
                    </Link>
                </main>
            </div>
        );
    }

    return <BookingClient venue={venue} />;
}

export default function VenueBookingPage() {
    return <VenueBookingContent />;
}

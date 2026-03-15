"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getVenueById, type Venue } from "@/lib/data";
import BookingClient from "./BookingClient";

function VenueBookingSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-6">
                <div className="mb-4 h-4 w-28 animate-pulse rounded bg-zinc-800" />
                <div className="mb-6 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="h-5 w-48 rounded bg-zinc-800" />
                    <div className="mt-2 h-3 w-32 rounded bg-zinc-800/60" />
                    <div className="mt-3 h-3 w-full rounded bg-zinc-800/40" />
                    <div className="mt-4 flex gap-3">
                        <div className="h-5 w-20 rounded bg-zinc-800" />
                        <div className="h-5 w-28 rounded-full bg-zinc-800/60" />
                    </div>
                </div>
                <div className="mb-6">
                    <div className="mb-3 h-4 w-32 rounded bg-zinc-800" />
                    <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-10 w-36 shrink-0 animate-pulse rounded-md bg-zinc-800/60" />
                        ))}
                    </div>
                </div>
                <div>
                    <div className="mb-3 h-4 w-24 rounded bg-zinc-800" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[90px] animate-pulse rounded-lg bg-zinc-800/40" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function VenueBookingPage() {
    const { id } = useParams<{ id: string }>();
    const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
    const [error, setError] = useState(false);

    useEffect(() => {
        const numId = Number(id);
        if (!id || isNaN(numId)) {
            setVenue(null);
            return;
        }
        getVenueById(numId)
            .then(setVenue)
            .catch(() => setError(true));
    }, [id]);

    if (venue === undefined && !error) {
        return <VenueBookingSkeleton />;
    }

    if (error || !venue) {
        return (
            <div className="min-h-screen bg-zinc-950">
                <Navbar />
                <main className="mx-auto max-w-5xl px-4 py-16 text-center">
                    <AlertCircle className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                    <h1 className="text-xl font-bold text-white">
                        {error ? "Something went wrong" : "Venue not found"}
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        {error
                            ? "We couldn\u2019t load this venue. Please try again."
                            : "This venue may have been removed or the link is incorrect."}
                    </p>
                    <Link
                        href="/explore"
                        className="mt-6 inline-flex items-center gap-1.5 text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
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

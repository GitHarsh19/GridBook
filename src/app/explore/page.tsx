"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VenueCard } from "@/components/VenueCard";
import { useRealtimeVenues } from "@/lib/hooks/useRealtimeVenues";
import { useAuth } from "@/lib/auth";

function VenueCardSkeleton() {
    return (
        <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="h-36 rounded-t-lg bg-zinc-800/60" />
            <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-zinc-800/60" />
                <div className="flex items-center justify-between pt-1">
                    <div className="h-4 w-16 rounded bg-zinc-800" />
                    <div className="h-5 w-28 rounded-full bg-zinc-800/60" />
                </div>
            </div>
        </div>
    );
}

export default function ExplorePage() {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const { venues, isLoading, error, refetch } = useRealtimeVenues();

    // Redirect admin users away from explore page
    useEffect(() => {
        if (isAdmin) {
            router.replace("/admin/dashboard");
        }
    }, [isAdmin, router]);

    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-white sm:text-2xl">
                        Nearby Venues
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        {isLoading
                            ? "Finding venues near you\u2026"
                            : `${venues.length} venues in Bengaluru`}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                        {error}
                        <button
                            onClick={refetch}
                            className="ml-4 shrink-0 rounded-md border border-red-500/30 px-3 py-1 text-xs font-medium transition-colors hover:bg-red-500/10"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <VenueCardSkeleton key={i} />
                          ))
                        : venues.map((venue) => (
                              <VenueCard key={venue.id} venue={venue} />
                          ))}
                </div>

                {!isLoading && !error && venues.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <SearchX className="mb-3 h-10 w-10 text-zinc-700" />
                        <p className="text-sm font-medium text-zinc-400">
                            No venues found nearby
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                            Check back later or try a different location.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

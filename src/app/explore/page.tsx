"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchX, Search, X } from "lucide-react";
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
    const [searchQuery, setSearchQuery] = useState("");

    // Redirect admin users away from explore page
    useEffect(() => {
        if (isAdmin) {
            router.replace("/admin/dashboard");
        }
    }, [isAdmin, router]);

    const filteredVenues = useMemo(() => {
        if (!searchQuery.trim()) return venues;
        const q = searchQuery.toLowerCase();
        return venues.filter(
            (v) =>
                v.name.toLowerCase().includes(q) ||
                v.location.toLowerCase().includes(q),
        );
    }, [venues, searchQuery]);

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

                {/* Search bar */}
                {!isLoading && venues.length > 0 && (
                    <div className="relative mb-6">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search venues by name or location\u2026"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-cyan-500/50"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 transition-colors hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

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
                        : filteredVenues.map((venue) => (
                              <VenueCard key={venue.id} venue={venue} />
                          ))}
                </div>

                {/* No results from search */}
                {!isLoading && !error && searchQuery && filteredVenues.length === 0 && venues.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <SearchX className="mb-3 h-10 w-10 text-zinc-700" />
                        <p className="text-sm font-medium text-zinc-400">
                            No venues matching &ldquo;{searchQuery}&rdquo;
                        </p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-3 text-sm text-cyan-500 transition-colors hover:text-cyan-400"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* No venues at all */}
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

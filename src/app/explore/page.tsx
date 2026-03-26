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
        <div className="animate-pulse rounded-2xl bg-surface-container">
            <div className="h-52 rounded-2xl bg-surface-container-high" />
            <div className="px-5 py-4 space-y-3">
                <div className="h-4 w-3/4 rounded-lg bg-surface-container-high" />
                <div className="h-3 w-1/2 rounded-lg bg-surface-container-high/70" />
            </div>
        </div>
    );
}

export default function ExplorePage() {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const { venues, isLoading, error, refetch } = useRealtimeVenues();
    const [searchQuery, setSearchQuery] = useState("");

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
        <div className="min-h-screen bg-surface font-outfit text-on-surface-variant overflow-x-hidden antialiased">
            <Navbar floating />

            <main className="mx-auto max-w-[var(--max-width-container)] px-4 sm:px-8 pt-28 pb-14">

                {/* Page header */}
                <div className="mb-10">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-btn-red">
                        Bengaluru
                    </p>
                    <h1
                        className="font-extrabold leading-none tracking-[-0.04em] text-white"
                        style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
                    >
                        Find your arena.
                    </h1>
                    <p className="mt-3 text-base text-on-surface font-medium max-w-lg">
                        {isLoading
                            ? "Scanning nearby venues\u2026"
                            : `${venues.length} premium sim racing venues ready to book`}
                    </p>
                </div>

                {/* Search bar */}
                {!isLoading && venues.length > 0 && (
                    <div className="relative mb-10 max-w-lg">
                        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by venue or location\u2026"
                            className="w-full rounded-full border border-on-surface bg-transparent py-3.5 pl-12 pr-12 font-outfit text-[0.9rem] text-white outline-none transition-colors duration-300 ease-in-out placeholder:text-white/40 focus:border-primary-container"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-white/40 transition-colors hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="mb-8 flex items-center justify-between rounded-2xl bg-btn-red/[0.08] px-5 py-4 text-sm text-btn-red">
                        {error}
                        <button
                            onClick={refetch}
                            className="ml-4 shrink-0 rounded-xl bg-btn-red/15 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-btn-red/25"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Venue grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                              <VenueCardSkeleton key={i} />
                          ))
                        : filteredVenues.map((venue) => (
                              <VenueCard key={venue.id} venue={venue} />
                          ))}
                </div>

                {/* No results from search */}
                {!isLoading && !error && searchQuery && filteredVenues.length === 0 && venues.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <SearchX className="mb-4 h-12 w-12 text-surface-container-highest" />
                        <p className="text-base font-semibold text-on-surface">
                            No venues matching &ldquo;{searchQuery}&rdquo;
                        </p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-4 rounded-full bg-btn-red/10 px-5 py-2 text-sm font-medium text-btn-red transition-colors hover:bg-btn-red/20"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* No venues at all */}
                {!isLoading && !error && venues.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <SearchX className="mb-4 h-12 w-12 text-surface-container-highest" />
                        <p className="text-base font-semibold text-on-surface">
                            No venues found nearby
                        </p>
                        <p className="mt-2 text-sm text-on-surface-variant/50">
                            Check back later or try a different location.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

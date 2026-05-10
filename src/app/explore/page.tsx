"use client";

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { SearchX, Search, X, LayoutGrid, Map, Gamepad2, Zap, IndianRupee, ArrowUpDown, MapPin, TrendingDown, TrendingUp, Monitor } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VenueCard } from "@/components/VenueCard";
import { useRealtimeVenues } from "@/lib/hooks/useRealtimeVenues";
import { useAuth } from "@/lib/auth";
import { resolveCoords } from "@/lib/venueCoords";
import type { Venue } from "@/lib/data";

const VenueMap = lazy(() =>
    import("@/components/VenueMap").then((m) => ({ default: m.VenueMap }))
);

/* ── Sort options ── */
type SortOption = "default" | "distance" | "price_low" | "price_high" | "available" | "seats";

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof ArrowUpDown }[] = [
    { value: "default", label: "Default", icon: ArrowUpDown },
    { value: "distance", label: "Distance", icon: MapPin },
    { value: "price_low", label: "Price ↑", icon: TrendingDown },
    { value: "price_high", label: "Price ↓", icon: TrendingUp },
    { value: "available", label: "Available", icon: Zap },
    { value: "seats", label: "Seats", icon: Monitor },
];

/* ── Haversine distance (km) ── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDistanceLabel(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
}

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

function MapSkeleton() {
    return (
        <div className="w-full rounded-2xl bg-surface-container border border-white/10 animate-pulse flex items-center justify-center" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
            <div className="flex flex-col items-center gap-3">
                <Map className="h-10 w-10 text-surface-container-highest" />
                <p className="font-outfit text-sm text-on-surface-variant/50">Loading map…</p>
            </div>
        </div>
    );
}

type ViewMode = "list" | "map";

export default function ExplorePage() {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const { venues, isLoading, error, refetch } = useRealtimeVenues();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [flyToVenueFn, setFlyToVenueFn] = useState<((id: string) => void) | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>("default");
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [fetchingLocation, setFetchingLocation] = useState(false);

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

    /* Stats derived from venues */
    const totalVenues = filteredVenues.length;
    const totalAvailableRigs = filteredVenues.reduce((sum, v) => sum + v.availableRigs, 0);
    const totalRigs = filteredVenues.reduce((sum, v) => sum + v.totalRigs, 0);
    const prices = filteredVenues.map((v) => v.price).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    /* ── Sorted venues ── */
    const sortedVenues = useMemo(() => {
        const list = [...filteredVenues];
        switch (sortBy) {
            case "price_low":
                return list.sort((a, b) => a.price - b.price);
            case "price_high":
                return list.sort((a, b) => b.price - a.price);
            case "available":
                return list.sort((a, b) => b.availableRigs - a.availableRigs);
            case "seats":
                return list.sort((a, b) => b.totalRigs - a.totalRigs);
            case "distance":
                if (!userLocation) return list;
                return list.sort((a, b) => {
                    const ca = resolveCoords(a);
                    const cb = resolveCoords(b);
                    const da = ca ? haversineKm(userLocation[0], userLocation[1], ca[0], ca[1]) : Infinity;
                    const db = cb ? haversineKm(userLocation[0], userLocation[1], cb[0], cb[1]) : Infinity;
                    return da - db;
                });
            default:
                return list;
        }
    }, [filteredVenues, sortBy, userLocation]);

    /* ── Get distance for a venue (for display) ── */
    const getVenueDistance = useCallback((venue: Venue): string | null => {
        if (!userLocation) return null;
        const coords = resolveCoords(venue);
        if (!coords) return null;
        const km = haversineKm(userLocation[0], userLocation[1], coords[0], coords[1]);
        return getDistanceLabel(km);
    }, [userLocation]);

    /* ── Request geolocation when sorting by distance ── */
    const handleSortChange = useCallback((option: SortOption) => {
        setSortBy(option);
        if (option === "distance" && !userLocation && navigator.geolocation) {
            setFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                    setFetchingLocation(false);
                },
                () => setFetchingLocation(false),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, [userLocation]);

    /* Callback from VenueMap to expose flyToVenue */
    const handleFlyToReady = useCallback((fn: (id: string) => void) => {
        setFlyToVenueFn(() => fn);
    }, []);

    const handleVenueCardClick = useCallback((venueId: number) => {
        if (flyToVenueFn) {
            flyToVenueFn(String(venueId));
        }
    }, [flyToVenueFn]);

    /* Current time for sidebar */
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

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

                {/* Search bar + view toggle */}
                {!isLoading && venues.length > 0 && (
                    <div className="mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-lg w-full">
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

                        {/* View toggle */}
                        <div className="flex rounded-xl border border-white/10 bg-surface-container-low p-1 shrink-0">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                                    viewMode === "list"
                                        ? "bg-btn-red text-white shadow-md"
                                        : "text-on-surface-variant/60 hover:text-white"
                                }`}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span className="hidden sm:inline">List</span>
                            </button>
                            <button
                                onClick={() => setViewMode("map")}
                                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                                    viewMode === "map"
                                        ? "bg-btn-red text-white shadow-md"
                                        : "text-on-surface-variant/60 hover:text-white"
                                }`}
                                title="Map view"
                            >
                                <Map className="h-4 w-4" />
                                <span className="hidden sm:inline">Map</span>
                            </button>
                        </div>
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

                {/* List view */}
                {viewMode === "list" && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                  <VenueCardSkeleton key={i} />
                              ))
                            : filteredVenues.map((venue) => (
                                  <VenueCard key={venue.id} venue={venue} />
                              ))}
                    </div>
                )}

                {/* ══════════════════════════════════════
                   Map Dashboard View
                   ══════════════════════════════════════ */}
                {viewMode === "map" && !isLoading && (
                    <div className="map-dashboard">
                        {/* ── Stats Row ── */}
                        <div className="map-dashboard-stats">
                            {/* Total Venues */}
                            <div className="map-stat-card">
                                <span className="map-stat-label">Total Venues</span>
                                <span className="map-stat-value">{totalVenues}</span>
                                <div className="map-stat-indicator">
                                    <span className="map-stat-dot green" />
                                    <span className="map-stat-indicator-text">
                                        {totalVenues} online
                                    </span>
                                </div>
                            </div>

                            {/* Available Rigs */}
                            <div className="map-stat-card">
                                <div className="flex items-center justify-between">
                                    <span className="map-stat-label">Rigs Available</span>
                                    <Gamepad2 className="h-4 w-4 text-white/20" />
                                </div>
                                <span className="map-stat-value">
                                    {totalAvailableRigs}
                                    <span className="text-base font-medium text-white/30 ml-1">/ {totalRigs}</span>
                                </span>
                                <div className="map-stat-indicator">
                                    <span className={`map-stat-dot ${totalAvailableRigs > 0 ? "green" : "red"}`} />
                                    <span className="map-stat-indicator-text">
                                        {totalAvailableRigs > 0 ? "rigs open now" : "all booked"}
                                    </span>
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="map-stat-card">
                                <div className="flex items-center justify-between">
                                    <span className="map-stat-label">Price Range</span>
                                    <IndianRupee className="h-4 w-4 text-white/20" />
                                </div>
                                <span className="map-stat-value">
                                    ₹{minPrice}
                                    <span className="text-base font-medium text-white/30"> – ₹{maxPrice}</span>
                                </span>
                                <span className="map-stat-sub">per hour</span>
                            </div>
                        </div>

                        {/* ── Map Panel ── */}
                        <div className="map-dashboard-map">
                            <Suspense fallback={<MapSkeleton />}>
                                <VenueMap
                                    venues={filteredVenues}
                                    onFlyToReady={handleFlyToReady}
                                />
                            </Suspense>
                        </div>

                        {/* ── Venue Sidebar ── */}
                        <div className="map-dashboard-sidebar">
                            <div className="map-sidebar-header">
                                <span className="map-sidebar-title">Nearby Venues</span>
                                <span className="map-sidebar-count">{sortedVenues.length} found</span>
                            </div>

                            {/* ── Sort Filter Pills ── */}
                            <div className="map-sort-bar">
                                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => handleSortChange(value)}
                                        className={`map-sort-pill ${sortBy === value ? "active" : ""}`}
                                        title={`Sort by ${label}`}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {label}
                                        {value === "distance" && fetchingLocation && sortBy === "distance" && (
                                            <span className="map-sort-loading" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="map-sidebar-list">
                                {sortedVenues.map((venue) => {
                                    const hasAvailable = venue.availableRigs > 0;
                                    const distance = getVenueDistance(venue);
                                    return (
                                        <div
                                            key={venue.id}
                                            className="map-venue-card"
                                            onClick={() => handleVenueCardClick(venue.id)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className={`map-venue-icon ${hasAvailable ? "available" : "full"}`}>
                                                🎮
                                            </div>
                                            <div className="map-venue-info">
                                                <div className="map-venue-name">{venue.name}</div>
                                                <div className="map-venue-location">
                                                    <span className={`map-venue-status-dot ${hasAvailable ? "available" : "full"}`} />
                                                    {venue.location} • {hasAvailable ? (
                                                        <span className="text-[#86efac]">Online</span>
                                                    ) : (
                                                        <span className="text-[#fca5a5]">Full</span>
                                                    )}
                                                </div>
                                                <div className="map-venue-meta">
                                                    <span className="map-venue-meta-item rigs">
                                                        <Zap className="h-3 w-3" />
                                                        {venue.availableRigs}/{venue.totalRigs} rigs
                                                    </span>
                                                    <span className="map-venue-meta-item price">
                                                        ₹{venue.price}/hr
                                                    </span>
                                                    {distance && (
                                                        <span className="map-venue-meta-item distance">
                                                            <MapPin className="h-3 w-3" />
                                                            {distance}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="map-venue-time">{timeStr}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

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

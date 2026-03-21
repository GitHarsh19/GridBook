"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Zap,
    CalendarCheck,
    CalendarDays,
    IndianRupee,
    Monitor,
    Wrench,
    X,
    Clock,
    AlertTriangle,
    LogOut,
    Users,
    Plus,
    Settings,
    Pencil,
    Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
    type DashboardRig,
    type Booking,
    type VenueOption,
    type RigStatus,
    TIME_SLOTS,
    getVenuesList,
    getDashboardRigs,
    getTodaysBookings,
    blockRigForWalkIn,
    releaseRig,
    releaseExpiredWalkIns,
    toggleOutOfOrder,
    addRig,
    updateRig,
    deleteRig,
    addVenue,
    updateVenue,
    deleteVenue,
} from "@/lib/data";
import { getTodayStr, getUpcomingDates, parseSlotStartHour, shortSlotLabel } from "@/lib/utils";
import {
    WalkInModal,
    AddRigModal,
    EditRigModal,
    AddVenueModal,
    EditVenueModal,
    STATUS_CONFIG,
} from "@/components/admin";

/* ─── Main Dashboard ───────────────────────────────────────────────── */

export default function AdminDashboardPage() {
    const router = useRouter();
    const { logout } = useAuth();
    const [venues, setVenues] = useState<VenueOption[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
    const [rigs, setRigs] = useState<DashboardRig[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [walkInTarget, setWalkInTarget] = useState<DashboardRig | null>(null);
    const [showAddRig, setShowAddRig] = useState(false);
    const [editTarget, setEditTarget] = useState<DashboardRig | null>(null);
    const [showAddVenue, setShowAddVenue] = useState(false);
    const [editVenueTarget, setEditVenueTarget] = useState<VenueOption | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Admin date/time slot selector state
    const [adminDate, setAdminDate] = useState<string>(getTodayStr);
    const [adminSlot, setAdminSlot] = useState<string | null>(null);

    const loadVenues = useCallback(async () => {
        try {
            const data = await getVenuesList();
            setVenues(data);
            return data;
        } catch (err) {
            console.error("Admin: Failed to load venues:", err);
            setError("Failed to load venues.");
            setTimeout(() => setError(null), 4000);
            return [];
        }
    }, []);

    // Load venues (owned by this admin)
    useEffect(() => {
        loadVenues().then((data) => {
            if (data.length > 0) {
                setSelectedVenueId(data[0].id);
            }
        });
    }, [loadVenues]);

    // Load rigs + bookings for selected venue, auto-releasing expired walk-ins first
    const loadData = useCallback(async () => {
        if (!selectedVenueId) return;
        try {
            await releaseExpiredWalkIns();
            const [rigData, bookingData] = await Promise.all([
                getDashboardRigs(selectedVenueId),
                getTodaysBookings(selectedVenueId),
            ]);
            setRigs(rigData);
            setBookings(bookingData);
        } catch {
            setError("Failed to load data. Retrying\u2026");
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    }, [selectedVenueId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Real-time subscription + polling fallback
    useEffect(() => {
        if (!selectedVenueId) return;

        const channel = supabase
            .channel(`admin-dashboard-${selectedVenueId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "rigs",
                    filter: `venue_id=eq.${selectedVenueId}`,
                },
                () => loadData(),
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "bookings" },
                () => loadData(),
            )
            .subscribe();

        const interval = setInterval(loadData, 30_000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [selectedVenueId, loadData]);

    // ── Actions ──

    const handleRigClick = async (rig: DashboardRig) => {
        const effective = getEffectiveStatus(rig);
        if (effective === "booked") {
            return;
        } else if (effective === "available") {
            setWalkInTarget(rig);
        } else if (rig.status === "blocked") {
            if (window.confirm(`Release ${rig.name} back to available?`)) {
                try {
                    await releaseRig(rig.id);
                } catch (err) {
                    console.error("Release rig failed:", err);
                    setError("Failed to release rig.");
                    setTimeout(() => setError(null), 4000);
                }
                loadData();
            }
        } else if (rig.status === "out_of_order") {
            if (window.confirm(`Restore ${rig.name} to available?`)) {
                try {
                    await toggleOutOfOrder(rig.id);
                } catch (err) {
                    console.error("Toggle OOO failed:", err);
                    setError("Failed to update rig status.");
                    setTimeout(() => setError(null), 4000);
                }
                loadData();
            }
        }
    };

    const handleBlockWalkIn = async (slots: string[], date: string, customerName: string) => {
        if (!walkInTarget) return;
        setActionLoading(true);
        try {
            const result = await blockRigForWalkIn(walkInTarget.id, slots, date, customerName);
            if (!result.success) {
                setError(
                    result.error ||
                        "Slot just secured online. Select another rig.",
                );
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Block walk-in failed:", err);
            setError("Failed to block rig. Please try again.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setWalkInTarget(null);
            loadData();
        }
    };

    const handleToggleOOO = async (rigId: number) => {
        try {
            await toggleOutOfOrder(rigId);
        } catch (err) {
            console.error("Toggle OOO failed:", err);
            setError("Failed to update rig status.");
            setTimeout(() => setError(null), 4000);
        }
        loadData();
    };

    const handleLogout = () => {
        router.push("/");
        logout("admin");
    };

    const handleAddRig = async (name: string, specs: string, status: "available" | "out_of_order") => {
        if (!selectedVenueId) return;
        setActionLoading(true);
        try {
            const result = await addRig(selectedVenueId, name, specs, status);
            if (!result.success) {
                setError(result.error || "Failed to add rig.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Unauthorized or failed to add rig.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setShowAddRig(false);
            loadData();
        }
    };

    const handleEditRig = async (name: string, specs: string) => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const result = await updateRig(editTarget.id, name, specs);
            if (!result.success) {
                setError(result.error || "Failed to update rig.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Unauthorized or failed to update rig.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditTarget(null);
            loadData();
        }
    };

    const handleDeleteRig = async () => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const result = await deleteRig(editTarget.id);
            if (!result.success) {
                setError(result.error || "Failed to delete rig.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Unauthorized or failed to delete rig.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditTarget(null);
            loadData();
        }
    };

    const handleAddVenue = async (name: string, location: string, price: number, description: string, imageUrl: string) => {
        setActionLoading(true);
        try {
            const result = await addVenue(name, location, price, description, imageUrl || undefined);
            if (!result.success) {
                setError(result.error || "Failed to add venue.");
                setTimeout(() => setError(null), 4000);
            } else {
                const updated = await loadVenues();
                if (result.venueId) setSelectedVenueId(result.venueId);
                else if (updated.length > 0) setSelectedVenueId(updated[updated.length - 1].id);
            }
        } catch {
            setError("Unauthorized or failed to add venue.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setShowAddVenue(false);
        }
    };

    const handleEditVenue = async (name: string, location: string, price: number, description: string, imageUrl: string) => {
        if (!editVenueTarget) return;
        setActionLoading(true);
        try {
            const result = await updateVenue(editVenueTarget.id, name, location, price, description, imageUrl || null);
            if (!result.success) {
                setError(result.error || "Failed to update venue.");
                setTimeout(() => setError(null), 4000);
            } else {
                await loadVenues();
            }
        } catch {
            setError("Unauthorized or failed to update venue.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditVenueTarget(null);
        }
    };

    const handleDeleteVenue = async () => {
        if (!editVenueTarget) return;
        setActionLoading(true);
        try {
            const result = await deleteVenue(editVenueTarget.id);
            if (!result.success) {
                setError(result.error || "Failed to delete venue.");
                setTimeout(() => setError(null), 4000);
            } else {
                const updated = await loadVenues();
                if (updated.length > 0) {
                    setSelectedVenueId(updated[0].id);
                } else {
                    setSelectedVenueId(null);
                    setRigs([]);
                    setBookings([]);
                }
            }
        } catch {
            setError("Unauthorized or failed to delete venue.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
            setEditVenueTarget(null);
        }
    };

    // ── Render helpers ──

    const selectedVenue = venues.find((v) => v.id === selectedVenueId);
    const now = new Date();
    const todayStr = getTodayStr();
    const venuePrice = selectedVenue?.price ?? 500;

    // Bookings filtered for the admin-selected date
    const dateBookings = bookings.filter((b) => b.booking_date === adminDate);
    const dateAppBookings = dateBookings.filter((b) => b.source === "app");

    // Build a lookup: rigId → Set of booked slot strings for the selected date
    const rigSlotMap = new Map<number, Set<string>>();
    for (const b of dateBookings) {
        if (!rigSlotMap.has(b.rig_id)) rigSlotMap.set(b.rig_id, new Set());
        rigSlotMap.get(b.rig_id)!.add(b.time_slot);
    }

    // Rigs booked for the admin-selected slot (or current time if no slot selected)
    const activelyBookedRigIds = new Set(
        dateBookings
            .filter((b) => {
                if (adminSlot) return b.time_slot === adminSlot;
                if (adminDate !== todayStr) return false;
                const currentHour = now.getHours();
                const slotStart = parseSlotStartHour(b.time_slot);
                if (slotStart < 0) return false;
                return currentHour >= slotStart && currentHour < slotStart + 1;
            })
            .map((b) => b.rig_id),
    );

    // Compute effective rig status: overlay bookings onto DB status
    const getEffectiveStatus = (rig: DashboardRig): RigStatus => {
        if (rig.status === "out_of_order") return "out_of_order";
        if (rig.status === "blocked" && adminDate === todayStr) return "blocked";
        if (activelyBookedRigIds.has(rig.id)) return "booked";
        if (rig.status === "blocked" && adminDate !== todayStr) return "available";
        return rig.status;
    };

    // Upcoming dates for the admin date picker
    const adminDates = getUpcomingDates(7);

    const formatAdminDate = (dateStr: string, i: number) => {
        if (i === 0) return { day: "Today", date: new Date(dateStr + "T00:00:00").getDate() };
        if (i === 1) return { day: "Tmrw", date: new Date(dateStr + "T00:00:00").getDate() };
        const d = new Date(dateStr + "T00:00:00");
        return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), date: d.getDate() };
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-cyan-500" />
                        <span className="text-lg font-bold tracking-tight text-white">
                            Grid<span className="text-cyan-500">Book</span>
                        </span>
                        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                            Admin
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {venues.length > 0 && (
                            <>
                                <select
                                    value={selectedVenueId ?? ""}
                                    onChange={(e) => {
                                        setSelectedVenueId(Number(e.target.value));
                                        setLoading(true);
                                    }}
                                    className="cursor-pointer max-w-[160px] truncate rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
                                >
                                    {venues.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => selectedVenue && setEditVenueTarget(selectedVenue)}
                                    title="Edit venue"
                                    className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-cyan-500/50 hover:text-cyan-400"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setShowAddVenue(true)}
                            title="Add venue"
                            className="flex cursor-pointer items-center gap-1 rounded-md bg-cyan-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Venue</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-4 py-6">
                {/* ── Error toast ── */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── No venues empty state ── */}
                {!loading && venues.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Building2 className="mb-4 h-12 w-12 text-zinc-700" />
                        <h2 className="text-lg font-bold text-white">No Venues Yet</h2>
                        <p className="mt-1 mb-6 text-sm text-zinc-500">
                            Create your first venue to start managing rigs and bookings.
                        </p>
                        <button
                            onClick={() => setShowAddVenue(true)}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-500"
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Venue
                        </button>
                    </div>
                )}

                {/* ── Metrics ribbon ── */}
                {selectedVenueId && (<><div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            {adminDate === todayStr ? "Today\u2019s" : (() => {
                                const d = new Date(adminDate + "T00:00:00");
                                return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                            })()} App Bookings
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {dateAppBookings.length}
                        </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <IndianRupee className="h-3.5 w-3.5" />
                            Estimated Revenue
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">
                            ₹
                            {(
                                dateAppBookings.length * venuePrice
                            ).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* ── Date & Time Selector ── */}
                <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    {/* Date picker row */}
                    <div className="mb-4">
                        <div className="mb-2.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Date
                        </div>
                        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                            {adminDates.map((dateStr, i) => {
                                const isSelected = adminDate === dateStr;
                                const { day, date } = formatAdminDate(dateStr, i);
                                const hasBookings = bookings.some((b) => b.booking_date === dateStr);
                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => { setAdminDate(dateStr); setAdminSlot(null); }}
                                        className={`relative flex shrink-0 cursor-pointer flex-col items-center rounded-md border px-3.5 py-2 text-xs font-medium transition-all ${
                                            isSelected
                                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                                                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        <span className="text-[10px] uppercase tracking-wider opacity-70">{day}</span>
                                        <span className="text-base font-bold leading-tight">{date}</span>
                                        {hasBookings && (
                                            <span className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-cyan-400" : "bg-zinc-500"}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time slot row */}
                    <div>
                        <div className="mb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                <Clock className="h-3.5 w-3.5" />
                                Time Slot
                                {adminSlot && (
                                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-400">
                                        {adminSlot}
                                    </span>
                                )}
                            </div>
                            {adminSlot && (
                                <button
                                    onClick={() => setAdminSlot(null)}
                                    className="flex cursor-pointer items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
                                >
                                    <X className="h-3 w-3" />
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="hide-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                            {TIME_SLOTS.map((slot) => {
                                const isSelected = adminSlot === slot;
                                const slotHour = parseSlotStartHour(slot);
                                const isPast = adminDate === todayStr && slotHour <= now.getHours();
                                const isCurrent = adminDate === todayStr && slotHour === now.getHours();
                                const slotBookingCount = dateBookings.filter((b) => b.time_slot === slot).length;
                                return (
                                    <button
                                        key={slot}
                                        onClick={() => setAdminSlot(isSelected ? null : slot)}
                                        className={`relative shrink-0 cursor-pointer rounded-md border px-3 py-2 text-[11px] font-medium transition-all ${
                                            isSelected
                                                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                                                : isPast
                                                    ? "border-zinc-800/50 bg-zinc-900/30 text-zinc-600"
                                                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                                        }`}
                                    >
                                        {isCurrent && (
                                            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase text-emerald-400">
                                                now
                                            </span>
                                        )}
                                        {shortSlotLabel(slot)}
                                        {slotBookingCount > 0 && (
                                            <span className={`ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                                                isSelected
                                                    ? "bg-cyan-500/20 text-cyan-300"
                                                    : "bg-red-500/20 text-red-400"
                                            }`}>
                                                {slotBookingCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Live Floor Grid ── */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                                <Monitor className="h-4 w-4" />
                                Live Floor
                                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            </h2>
                            <button
                                onClick={() => setShowAddRig(true)}
                                className="flex cursor-pointer items-center gap-1 rounded-md bg-cyan-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-cyan-500"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Rig
                            </button>
                        </div>
                        {/* Desktop legend */}
                        <div className="hidden items-center gap-4 text-xs text-zinc-500 sm:flex">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                Available
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                App Booked
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                Walk-In
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                                Out of Order
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[130px] animate-pulse rounded-lg border border-zinc-800 bg-zinc-800/40"
                                />
                            ))}
                        </div>
                    ) : rigs.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                            <p className="text-sm text-zinc-500">
                                No rigs found for this venue
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {rigs.map((rig) => {
                                const effectiveStatus = getEffectiveStatus(rig);
                                const cfg = STATUS_CONFIG[effectiveStatus];
                                const booking = adminSlot
                                    ? dateBookings.find((b) => b.rig_id === rig.id && b.time_slot === adminSlot)
                                    : dateBookings.find((b) => b.rig_id === rig.id);

                                return (
                                    <div
                                        key={rig.id}
                                        onClick={() => handleRigClick(rig)}
                                        role={cfg.clickable ? "button" : undefined}
                                        tabIndex={cfg.clickable ? 0 : undefined}
                                        onKeyDown={(e) => {
                                            if (cfg.clickable && (e.key === "Enter" || e.key === " ")) {
                                                handleRigClick(rig);
                                            }
                                        }}
                                        className={`group relative flex min-h-[130px] flex-col items-center justify-center rounded-lg border p-4 text-center transition-all ${cfg.border} ${cfg.bg} ${cfg.clickable ? "cursor-pointer" : "cursor-default"}`}
                                    >
                                        {/* Edit + OOO icons (top-right) */}
                                        <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditTarget(rig);
                                                }}
                                                title="Edit rig"
                                                className="rounded p-1 text-zinc-700 transition-all hover:bg-zinc-800 hover:text-zinc-400"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </button>
                                            {(effectiveStatus === "available" ||
                                                effectiveStatus ===
                                                    "out_of_order") && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleOOO(rig.id);
                                                    }}
                                                    title={
                                                        rig.status ===
                                                        "out_of_order"
                                                            ? "Restore"
                                                            : "Mark Out of Order"
                                                    }
                                                    className="rounded p-1 text-zinc-700 transition-all hover:bg-zinc-800 hover:text-zinc-400"
                                                >
                                                    <Wrench className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Status dot */}
                                        <div
                                            className={`mb-2 h-3 w-3 rounded-full ${cfg.dot} ${effectiveStatus === "available" ? "animate-pulse" : ""}`}
                                        />

                                        {/* Rig name */}
                                        <span
                                            className={`text-sm font-semibold ${effectiveStatus === "out_of_order" ? "text-zinc-600" : "text-white"}`}
                                        >
                                            {rig.name}
                                        </span>

                                        {/* Status label */}
                                        <span
                                            className={`mt-0.5 text-[10px] font-medium ${cfg.labelColor}`}
                                        >
                                            {cfg.label}
                                        </span>

                                        {/* Booking info */}
                                        {booking &&
                                            effectiveStatus !== "available" && (
                                                <span className="mt-1 max-w-full truncate px-2 text-[10px] text-zinc-500">
                                                    {booking.customer_name}
                                                    {booking.time_slot &&
                                                        ` \u00b7 ${booking.time_slot}`}
                                                </span>
                                            )}

                                        {/* Specs */}
                                        <span
                                            className={`mt-1 text-[9px] ${effectiveStatus === "out_of_order" ? "text-zinc-700" : "text-zinc-600"}`}
                                        >
                                            {rig.specs}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Mobile legend */}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500 sm:hidden">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-amber-400" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-zinc-600" />
                            OOO
                        </div>
                    </div>
                </div>

                {/* ── Slot Timeline Heatmap ── */}
                {rigs.length > 0 && (
                <div className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <Clock className="h-4 w-4" />
                        Slot Overview
                        <span className="text-xs text-zinc-600">
                            &middot; {adminDate === todayStr ? "Today" : (() => {
                                const d = new Date(adminDate + "T00:00:00");
                                return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                            })()}
                        </span>
                    </h2>
                    <div className="overflow-x-auto rounded-lg border border-zinc-800">
                        <table className="w-full min-w-[640px] text-[10px]">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="sticky left-0 z-10 bg-zinc-900 px-3 py-2 text-left text-xs font-medium text-zinc-500">
                                        Rig
                                    </th>
                                    {TIME_SLOTS.map((slot) => {
                                        const h = parseSlotStartHour(slot);
                                        const isCurrent = adminDate === todayStr && h === now.getHours();
                                        return (
                                            <th
                                                key={slot}
                                                onClick={() => setAdminSlot(adminSlot === slot ? null : slot)}
                                                className={`cursor-pointer px-1 py-2 text-center font-medium transition-colors ${
                                                    adminSlot === slot
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : isCurrent
                                                            ? "text-emerald-400"
                                                            : "text-zinc-600 hover:text-zinc-400"
                                                }`}
                                            >
                                                {shortSlotLabel(slot)}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {rigs.map((rig) => {
                                    const rigBookedSlots = rigSlotMap.get(rig.id);
                                    return (
                                        <tr key={rig.id} className="border-b border-zinc-800/50 last:border-0">
                                            <td className="sticky left-0 z-10 bg-zinc-950 px-3 py-1.5 font-medium text-zinc-300">
                                                {rig.name}
                                            </td>
                                            {TIME_SLOTS.map((slot) => {
                                                const booking = rigBookedSlots?.has(slot)
                                                    ? dateBookings.find((b) => b.rig_id === rig.id && b.time_slot === slot)
                                                    : null;
                                                const isOOO = rig.status === "out_of_order";
                                                const h = parseSlotStartHour(slot);
                                                const isPast = adminDate === todayStr && h < now.getHours();
                                                const isCurrent = adminDate === todayStr && h === now.getHours();

                                                let cellBg = "";
                                                let cellText = "";
                                                let tooltip = "Available";

                                                if (isOOO) {
                                                    cellBg = "bg-zinc-800/30";
                                                    cellText = "text-zinc-700";
                                                    tooltip = "Out of Order";
                                                } else if (booking) {
                                                    if (booking.source === "app") {
                                                        cellBg = "bg-red-500/15";
                                                        cellText = "text-red-400";
                                                    } else {
                                                        cellBg = "bg-amber-500/15";
                                                        cellText = "text-amber-400";
                                                    }
                                                    tooltip = `${booking.customer_name} (${booking.source === "app" ? "App" : "Walk-In"}) ${booking.verification_code}`;
                                                } else if (isPast) {
                                                    cellBg = "bg-zinc-900/30";
                                                    cellText = "text-zinc-800";
                                                    tooltip = "Past";
                                                }

                                                return (
                                                    <td
                                                        key={slot}
                                                        title={tooltip}
                                                        onClick={() => setAdminSlot(adminSlot === slot ? null : slot)}
                                                        className={`cursor-pointer px-1 py-1.5 text-center transition-all ${cellBg} ${
                                                            adminSlot === slot ? "ring-1 ring-inset ring-cyan-500/30" : ""
                                                        } ${isCurrent && !booking ? "ring-1 ring-inset ring-emerald-500/20" : ""}`}
                                                    >
                                                        {isOOO ? (
                                                            <span className={cellText}>&mdash;</span>
                                                        ) : booking ? (
                                                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                                                                booking.source === "app" ? "bg-red-400" : "bg-amber-400"
                                                            }`} title={tooltip} />
                                                        ) : isPast ? (
                                                            <span className="text-zinc-800">&middot;</span>
                                                        ) : (
                                                            <span className="text-zinc-700">&middot;</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Timeline legend */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                            App Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-700">&middot;</span>
                            Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-700">&mdash;</span>
                            Out of Order
                        </div>
                    </div>
                </div>
                )}

                {/* ── Bookings Schedule Ledger ── */}
                <div>
                    {(() => {
                        const ledgerBookings = adminSlot
                            ? dateBookings.filter((b) => b.time_slot === adminSlot)
                            : dateBookings;
                        const ledgerLabel = adminDate === todayStr ? "Today" : (() => {
                            const d = new Date(adminDate + "T00:00:00");
                            return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                        })();
                        return (<>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <Users className="h-4 w-4" />
                        {ledgerLabel}{adminSlot ? ` \u00b7 ${adminSlot}` : ""} Bookings
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                            {ledgerBookings.length}
                        </span>
                    </h2>

                    {ledgerBookings.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                            <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
                            <p className="text-sm text-zinc-500">
                                No bookings {adminSlot ? "for this slot" : "for this date"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-zinc-800">
                            {/* Desktop table */}
                            <div className="hidden sm:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Date
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Time
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Rig
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Customer
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Code
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                                                Source
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerBookings.map((b) => (
                                            <tr
                                                key={b.id}
                                                className="border-b border-zinc-800/50 last:border-0"
                                            >
                                                <td className="px-4 py-3 text-zinc-400 text-xs">
                                                    {b.booking_date === todayStr ? "Today" : (() => {
                                                        const d = new Date(b.booking_date + "T00:00:00");
                                                        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-zinc-600" />
                                                        {b.time_slot}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {b.rig_name}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-400">
                                                    {b.customer_name}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-cyan-500">
                                                    {b.verification_code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                            b.source === "app"
                                                                ? "bg-cyan-500/10 text-cyan-400"
                                                                : "bg-amber-500/10 text-amber-400"
                                                        }`}
                                                    >
                                                        {b.source === "app"
                                                            ? "App"
                                                            : "Walk-In"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-zinc-800/50 sm:hidden">
                                {ledgerBookings.map((b) => (
                                    <div key={b.id} className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-white">
                                                {b.rig_name}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                    b.source === "app"
                                                        ? "bg-cyan-500/10 text-cyan-400"
                                                        : "bg-amber-500/10 text-amber-400"
                                                }`}
                                            >
                                                {b.source === "app"
                                                    ? "App"
                                                    : "Walk-In"}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {b.time_slot}
                                            </span>
                                            <span>{b.customer_name}</span>
                                            <span className="font-mono text-cyan-500/70">
                                                {b.verification_code}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </>);
                    })()}
                </div>
                </>)}
            </main>

            {/* ── Modals ── */}
            {walkInTarget && (
                <WalkInModal
                    rig={walkInTarget}
                    initialDate={adminDate}
                    existingBookings={bookings}
                    onConfirm={handleBlockWalkIn}
                    onClose={() => setWalkInTarget(null)}
                    loading={actionLoading}
                />
            )}

            {showAddRig && (
                <AddRigModal
                    onConfirm={handleAddRig}
                    onClose={() => setShowAddRig(false)}
                    loading={actionLoading}
                />
            )}

            {editTarget && (
                <EditRigModal
                    rig={editTarget}
                    onSave={handleEditRig}
                    onDelete={handleDeleteRig}
                    onClose={() => setEditTarget(null)}
                    loading={actionLoading}
                />
            )}

            {showAddVenue && (
                <AddVenueModal
                    onConfirm={handleAddVenue}
                    onClose={() => setShowAddVenue(false)}
                    loading={actionLoading}
                />
            )}

            {editVenueTarget && (
                <EditVenueModal
                    venue={editVenueTarget}
                    onSave={handleEditVenue}
                    onDelete={handleDeleteVenue}
                    onClose={() => setEditVenueTarget(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

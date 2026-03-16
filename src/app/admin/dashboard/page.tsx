"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Zap,
    CalendarCheck,
    IndianRupee,
    Monitor,
    Wrench,
    X,
    Clock,
    AlertTriangle,
    LogOut,
    Users,
    Eye,
    EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
    type DashboardRig,
    type Booking,
    type VenueOption,
    type RigStatus,
    getVenuesList,
    getDashboardRigs,
    getTodaysBookings,
    blockRigForWalkIn,
    releaseRig,
    toggleOutOfOrder,
} from "@/lib/data";

/* ─── Walk-In Modal ────────────────────────────────────────────────── */

function WalkInModal({
    rig,
    onConfirm,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    onConfirm: (duration: number) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [duration, setDuration] = useState(1);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        Block for Walk-In
                    </h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <p className="mb-1 text-sm text-zinc-400">
                    Block{" "}
                    <span className="font-medium text-white">{rig.name}</span>{" "}
                    for a walk-in customer.
                </p>
                <p className="mb-5 text-xs text-zinc-600">{rig.specs}</p>

                <p className="mb-2 text-xs font-medium text-zinc-500">
                    Duration
                </p>
                <div className="mb-6 flex gap-2">
                    {[1, 2, 3].map((hrs) => (
                        <button
                            key={hrs}
                            onClick={() => setDuration(hrs)}
                            className={`flex-1 cursor-pointer rounded-md border py-2.5 text-sm font-medium transition-all ${
                                duration === hrs
                                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                            }`}
                        >
                            {hrs} hr{hrs > 1 ? "s" : ""}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(duration)}
                        disabled={loading}
                        className="flex-1 cursor-pointer rounded-md bg-amber-500 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
                    >
                        {loading ? "Blocking\u2026" : "Block Rig"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Status config ────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
    RigStatus,
    {
        border: string;
        bg: string;
        dot: string;
        label: string;
        labelColor: string;
        clickable: boolean;
    }
> = {
    available: {
        border: "border-emerald-500/50 hover:border-emerald-400",
        bg: "bg-zinc-900",
        dot: "bg-emerald-400",
        label: "Available",
        labelColor: "text-emerald-400",
        clickable: true,
    },
    booked: {
        border: "border-red-500/50",
        bg: "bg-zinc-900",
        dot: "bg-red-400",
        label: "App Booked",
        labelColor: "text-red-400",
        clickable: false,
    },
    blocked: {
        border: "border-amber-500/50 hover:border-amber-400",
        bg: "bg-amber-500/5",
        dot: "bg-amber-400",
        label: "Walk-In",
        labelColor: "text-amber-400",
        clickable: true,
    },
    out_of_order: {
        border: "border-zinc-800 hover:border-zinc-700",
        bg: "bg-zinc-900/50",
        dot: "bg-zinc-600",
        label: "Out of Order",
        labelColor: "text-zinc-600",
        clickable: true,
    },
};

/* ─── Inline Admin Login ───────────────────────────────────────────── */

function AdminLoginInline({ onSuccess }: { onSuccess: () => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [messageRendered, setMessageRendered] = useState(true);
    const [messageExpanded, setMessageExpanded] = useState(false);

    useEffect(() => {
        const expandTimer = setTimeout(() => setMessageExpanded(true), 16);
        const contractTimer = setTimeout(() => setMessageExpanded(false), 1200);
        const removeTimer = setTimeout(() => setMessageRendered(false), 1600);
        return () => { clearTimeout(expandTimer); clearTimeout(contractTimer); clearTimeout(removeTimer); };
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (username === "venue" && password === "password") {
            localStorage.setItem("gridbook_admin", "true");
            onSuccess();
        } else {
            setError("Invalid credentials. Use venue / password");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-cyan-500" />
                    <span className="text-2xl font-bold tracking-tight text-white">
                        Grid<span className="text-cyan-500">Book</span>
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                        Admin
                    </span>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                    {messageRendered && (
                        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${messageExpanded ? "max-h-10 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}>
                            <p className="text-center text-sm text-red-400">Sign in to continue</p>
                        </div>
                    )}
                    <h2 className="mb-6 text-center text-sm font-medium text-zinc-400">
                        Venue Admin Login
                    </h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                placeholder="Enter username"
                                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    placeholder="Enter password"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
                        <button
                            type="submit"
                            className="w-full cursor-pointer rounded-md bg-cyan-500 py-2.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98]"
                        >
                            Login
                        </button>
                    </form>
                    <p className="mt-4 text-center text-xs text-zinc-600">venue / password</p>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Dashboard ───────────────────────────────────────────────── */

export default function AdminDashboardPage() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [venues, setVenues] = useState<VenueOption[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
    const [rigs, setRigs] = useState<DashboardRig[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [walkInTarget, setWalkInTarget] = useState<DashboardRig | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth guard — check localStorage for admin flag
    useEffect(() => {
        const adminFlag = localStorage.getItem("gridbook_admin");
        if (adminFlag === "true") {
            setIsAdmin(true);
        }
        setAuthChecked(true);
    }, []);

    // Load venues
    useEffect(() => {
        if (!isAdmin) return;
        getVenuesList().then((data) => {
            if (data.length > 0) {
                setVenues(data);
                setSelectedVenueId(data[0].id);
            }
        });
    }, [isAdmin]);

    // Load rigs + bookings for selected venue
    const loadData = useCallback(async () => {
        if (!selectedVenueId) return;
        try {
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

    const handleRigClick = (rig: DashboardRig) => {
        if (rig.status === "available") {
            setWalkInTarget(rig);
        } else if (rig.status === "blocked") {
            if (window.confirm(`Release ${rig.name} back to available?`)) {
                releaseRig(rig.id).then(() => loadData());
            }
        } else if (rig.status === "out_of_order") {
            if (window.confirm(`Restore ${rig.name} to available?`)) {
                toggleOutOfOrder(rig.id).then(() => loadData());
            }
        }
    };

    const handleBlockWalkIn = async (duration: number) => {
        if (!walkInTarget) return;
        setActionLoading(true);
        const result = await blockRigForWalkIn(walkInTarget.id, duration);
        setActionLoading(false);

        if (!result.success) {
            setError(
                result.error ||
                    "Slot just secured online. Select another rig.",
            );
            setTimeout(() => setError(null), 4000);
        }
        setWalkInTarget(null);
        loadData();
    };

    const handleToggleOOO = async (rigId: number) => {
        await toggleOutOfOrder(rigId);
        loadData();
    };

    const handleLogout = () => {
        localStorage.removeItem("gridbook_admin");
        router.push("/");
    };

    // ── Render ──

    if (!authChecked) {
        return <div className="min-h-screen bg-zinc-950" />;
    }

    if (!isAdmin) {
        return <AdminLoginInline onSuccess={() => setIsAdmin(true)} />;
    }

    const selectedVenue = venues.find((v) => v.id === selectedVenueId);
    const appBookings = bookings.filter((b) => b.source === "app");
    const venuePrice = selectedVenue?.price ?? 500;

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

                    <div className="flex items-center gap-3">
                        <select
                            value={selectedVenueId ?? ""}
                            onChange={(e) => {
                                setSelectedVenueId(Number(e.target.value));
                                setLoading(true);
                            }}
                            className="cursor-pointer max-w-[180px] truncate rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
                        >
                            {venues.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleLogout}
                            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Log Out</span>
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

                {/* ── Metrics ribbon ── */}
                <div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Today&apos;s App Bookings
                        </div>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {appBookings.length}
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
                                appBookings.length * venuePrice
                            ).toLocaleString("en-IN")}
                        </p>
                    </div>
                </div>

                {/* ── Live Floor Grid ── */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                            <Monitor className="h-4 w-4" />
                            Live Floor
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        </h2>
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
                                const cfg = STATUS_CONFIG[rig.status];
                                const booking = bookings.find(
                                    (b) => b.rig_id === rig.id,
                                );

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
                                        {/* OOO toggle (wrench) */}
                                        {(rig.status === "available" ||
                                            rig.status ===
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
                                                className="absolute right-2 top-2 rounded p-1 text-zinc-700 opacity-0 transition-all hover:bg-zinc-800 hover:text-zinc-400 group-hover:opacity-100"
                                            >
                                                <Wrench className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        {/* Status dot */}
                                        <div
                                            className={`mb-2 h-3 w-3 rounded-full ${cfg.dot} ${rig.status === "available" ? "animate-pulse" : ""}`}
                                        />

                                        {/* Rig name */}
                                        <span
                                            className={`text-sm font-semibold ${rig.status === "out_of_order" ? "text-zinc-600" : "text-white"}`}
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
                                            rig.status !== "available" && (
                                                <span className="mt-1 max-w-full truncate px-2 text-[10px] text-zinc-500">
                                                    {booking.customer_name}
                                                    {booking.time_slot &&
                                                        ` \u00b7 ${booking.time_slot}`}
                                                </span>
                                            )}

                                        {/* Specs */}
                                        <span
                                            className={`mt-1 text-[9px] ${rig.status === "out_of_order" ? "text-zinc-700" : "text-zinc-600"}`}
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

                {/* ── Today's Schedule Ledger ── */}
                <div>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <Users className="h-4 w-4" />
                        Today&apos;s Schedule
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                            {bookings.length}
                        </span>
                    </h2>

                    {bookings.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                            <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
                            <p className="text-sm text-zinc-500">
                                No bookings today
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
                                        {bookings.map((b) => (
                                            <tr
                                                key={b.id}
                                                className="border-b border-zinc-800/50 last:border-0"
                                            >
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
                                {bookings.map((b) => (
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
                                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
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
                </div>
            </main>

            {/* ── Walk-In Modal ── */}
            {walkInTarget && (
                <WalkInModal
                    rig={walkInTarget}
                    onConfirm={handleBlockWalkIn}
                    onClose={() => setWalkInTarget(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

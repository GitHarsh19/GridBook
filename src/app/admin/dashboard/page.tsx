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
    Plus,
    Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
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
    releaseExpiredWalkIns,
    toggleOutOfOrder,
    addRig,
    updateRig,
    deleteRig,
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

/* ─── Add Rig Modal ───────────────────────────────────────────────── */

function AddRigModal({
    onConfirm,
    onClose,
    loading,
}: {
    onConfirm: (name: string, specs: string, status: "available" | "out_of_order") => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const [specs, setSpecs] = useState("");
    const [status, setStatus] = useState<"available" | "out_of_order">("available");

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Add Rig</h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Rig Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rig 7"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Specs
                        </label>
                        <input
                            type="text"
                            value={specs}
                            onChange={(e) => setSpecs(e.target.value)}
                            placeholder='e.g. Fanatec DD Pro · Triple 27"'
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "available" | "out_of_order")}
                            className="w-full cursor-pointer rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                        >
                            <option value="available">Available</option>
                            <option value="out_of_order">Out of Order</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(name.trim(), specs.trim(), status)}
                        disabled={loading || !name.trim()}
                        className="flex-1 cursor-pointer rounded-md bg-cyan-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {loading ? "Adding\u2026" : "Add Rig"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Edit Rig Modal ──────────────────────────────────────────────── */

function EditRigModal({
    rig,
    onSave,
    onDelete,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    onSave: (name: string, specs: string) => void;
    onDelete: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState(rig.name);
    const [specs, setSpecs] = useState(rig.specs);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    if (confirmingDelete) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Delete Rig</h3>
                    </div>
                    <p className="mb-6 text-sm text-zinc-400">
                        Are you sure? This will remove{" "}
                        <span className="font-medium text-white">{rig.name}</span>{" "}
                        from the app entirely.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmingDelete(false)}
                            className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-md border border-red-800 bg-red-900/50 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900 disabled:opacity-50"
                        >
                            {loading ? "Deleting\u2026" : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Edit Rig</h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Rig Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Specs
                        </label>
                        <input
                            type="text"
                            value={specs}
                            onChange={(e) => setSpecs(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer rounded-md border border-red-800 bg-red-900/50 px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900"
                    >
                        Delete Rig
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(name.trim(), specs.trim())}
                            disabled={loading || !name.trim()}
                            className="cursor-pointer rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                        >
                            {loading ? "Saving\u2026" : "Save"}
                        </button>
                    </div>
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
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load venues
    useEffect(() => {
        getVenuesList()
            .then((data) => {
                if (data.length > 0) {
                    setVenues(data);
                    setSelectedVenueId(data[0].id);
                }
            })
            .catch((err) => {
                console.error("Admin: Failed to load venues:", err);
                setError("Failed to load venues. Check console for details.");
            });
    }, []);

    // Load rigs + bookings for selected venue, auto-releasing expired walk-ins first
    const loadData = useCallback(async () => {
        if (!selectedVenueId) return;
        try {
            // Release any walk-in blocks whose duration has expired
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
        if (rig.status === "available") {
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

    const handleBlockWalkIn = async (duration: number) => {
        if (!walkInTarget) return;
        setActionLoading(true);
        try {
            const result = await blockRigForWalkIn(walkInTarget.id, duration);
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

    const handleLogout = async () => {
        await logout("admin");
        router.push("/");
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

    // ── Render ──

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
                                                    className="rounded p-1 text-zinc-700 transition-all hover:bg-zinc-800 hover:text-zinc-400"
                                                >
                                                    <Wrench className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

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

            {/* ── Add Rig Modal ── */}
            {showAddRig && (
                <AddRigModal
                    onConfirm={handleAddRig}
                    onClose={() => setShowAddRig(false)}
                    loading={actionLoading}
                />
            )}

            {/* ── Edit Rig Modal ── */}
            {editTarget && (
                <EditRigModal
                    rig={editTarget}
                    onSave={handleEditRig}
                    onDelete={handleDeleteRig}
                    onClose={() => setEditTarget(null)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
}

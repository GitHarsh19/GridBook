"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    CalendarCheck,
    IndianRupee,
    Monitor,
    Gamepad2,
    Glasses,
    Wrench,

    Clock,
    AlertTriangle,
    LogOut,
    Users,
    Plus,
    Settings,
    Pencil,
    Building2,
    ScanLine,
    ShieldCheck,
} from "lucide-react";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const SUPER_ADMIN_EMAIL = "harshitagarwalsmt@gmail.com";
import {
    type DashboardRig,
    type Booking,
    type VenueOption,
    type RigStatus,
    type RigType,
    TIME_SLOTS,
    getVenuesList,
    getDashboardRigs,
    getTodaysBookings,
    releaseExpiredWalkIns,
    toggleOutOfOrder,
    adminCancelBooking,
    adminBookSlot,
    addRig,
    updateRig,
    deleteRig,
    addVenue,
    updateVenue,
    deleteVenue,
} from "@/lib/data";
import { getTodayStr, parseSlotStartHour, shortSlotLabel, isSlotPast } from "@/lib/utils";
import { ScannerModal } from "./ScannerModal";
import {
    WalkInModal,
    AddRigModal,
    EditRigModal,
    AddVenueModal,
    EditVenueModal,
    STATUS_CONFIG,
} from "@/components/admin";

const RIG_TYPE_LABEL: Record<RigType, string> = { pc: "PC", playstation: "PlayStation", xbox: "Xbox", vr: "VR" };
const RIG_TYPE_COLOR: Record<RigType, string> = { pc: "text-orange-400", playstation: "text-blue-400", xbox: "text-green-400", vr: "text-purple-400" };

function RigTypeIcon({ type, className }: { type: RigType; className?: string }) {
    if (type === "pc") return <Monitor className={className} />;
    if (type === "vr") return <Glasses className={className} />;
    return <Gamepad2 className={className} />;
}

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
    const [showScanner, setShowScanner] = useState(false);
    const [preSelectedSlots, setPreSelectedSlots] = useState<string[]>([]);
    const [slotOverviewDate, setSlotOverviewDate] = useState<string>(getTodayStr);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        supabaseAdmin.auth.getUser().then(({ data }) => {
            if (data.user?.email === SUPER_ADMIN_EMAIL) setIsSuperAdmin(true);
        });
    }, []);


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

    const handleRigClick = (rig: DashboardRig) => {
        setPreSelectedSlots([]);
        setWalkInTarget(rig);
    };


    const handleBlockWalkIn = async (
        slots: { slot: string; source: "app" | "walk_in"; inUse: boolean }[],
        date: string,
        customerName: string,
    ) => {
        if (!walkInTarget) return;
        setActionLoading(true);
        try {
            for (const { slot, source, inUse } of slots) {
                const result = await adminBookSlot(
                    walkInTarget.id,
                    slot,
                    date,
                    source,
                    inUse,
                    customerName || undefined,
                );
                if (!result.success) {
                    setError(result.error || "Slot just secured online. Select another rig.");
                    setTimeout(() => setError(null), 4000);
                    break;
                }
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

    const handleCancelBookingFromModal = async (bookingId: number) => {
        setActionLoading(true);
        try {
            const result = await adminCancelBooking(bookingId);
            if (!result.success) {
                setError(result.error || "Failed to cancel booking.");
                setTimeout(() => setError(null), 4000);
            }
        } catch {
            setError("Failed to cancel booking.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
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

    const handleAddRig = async (name: string, specs: string, status: "available" | "out_of_order", type: import("@/lib/data").RigType = "pc") => {
        if (!selectedVenueId) return;
        setActionLoading(true);
        try {
            const result = await addRig(selectedVenueId, name, specs, status, type);
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

    const handleEditRig = async (name: string, specs: string, status?: import("@/lib/data").RigStatus, type?: import("@/lib/data").RigType) => {
        if (!editTarget) return;
        setActionLoading(true);
        try {
            const result = await updateRig(editTarget.id, name, specs, status, type);
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

    // Bookings filtered for today
    const dateBookings = bookings.filter((b) => b.booking_date === todayStr);
    const dateAppBookings = dateBookings.filter((b) => b.source === "app");

    // Slot overview: bookings filtered for today
    const slotOverviewBookings = bookings.filter((b) => b.booking_date === todayStr);
    const slotRigSlotMap = new Map<number, Set<string>>();
    for (const b of slotOverviewBookings) {
        if (!slotRigSlotMap.has(b.rig_id)) slotRigSlotMap.set(b.rig_id, new Set());
        slotRigSlotMap.get(b.rig_id)!.add(b.time_slot);
    }

    // Rigs booked in the current hour
    const activelyBookedRigIds = new Set(
        dateBookings
            .filter((b) => {
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
        if (rig.status === "in_use") return "in_use";
        if (rig.status === "blocked") return "blocked";
        if (activelyBookedRigIds.has(rig.id)) return "booked";
        return rig.status;
    };

    const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

    return (
        <div className="min-h-screen bg-surface font-outfit antialiased">
            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none pt-4">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="pointer-events-auto flex items-center justify-between rounded-full px-6 py-3.5 transition-all duration-300" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Link href="/" className="flex flex-col items-start justify-center">
                            <span className="text-[1.5rem] font-black tracking-[-0.04em] text-on-surface leading-none">
                                PitPass
                            </span>
                            <span className="mt-0.5 rounded-full bg-btn-red/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-btn-red">
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
                                        className="cursor-pointer max-w-[160px] truncate rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 outline-none focus:border-white/20"
                                    >
                                        {venues.map((v) => (
                                            <option key={v.id} value={v.id} className="bg-surface-container">
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => selectedVenue && setEditVenueTarget(selectedVenue)}
                                        title="Edit venue"
                                        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-5 py-2 text-sm font-medium tracking-[-0.03em] text-white/70 transition-all hover:bg-white hover:text-[#131313] active:scale-[0.98]"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowAddVenue(true)}
                                title="Add venue"
                                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-5 py-2 text-sm font-medium tracking-[-0.03em] text-white/70 transition-all hover:bg-white hover:text-[#131313] active:scale-[0.98]"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Venue</span>
                            </button>
                            {isSuperAdmin && (
                                <Link
                                    href="/admin/invite"
                                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2 text-sm font-medium tracking-[-0.03em] text-white/70 transition-all hover:bg-white hover:text-[#131313] active:scale-[0.98]"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Admins</span>
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-btn-red px-5 py-2 text-sm font-medium tracking-[-0.03em] text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98]"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-4 pt-28 pb-6">
                {/* ── Error toast ── */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-btn-red/[0.08] px-4 py-3 text-sm text-btn-red">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── No venues empty state ── */}
                {!loading && venues.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Building2 className="mb-4 h-12 w-12 text-on-surface-variant/20" />
                        <h2 className="text-lg font-bold text-on-surface">No Venues Yet</h2>
                        <p className="mt-1 mb-6 text-sm text-on-surface-variant/50">
                            Create your first venue to start managing rigs and bookings.
                        </p>
                        <button
                            onClick={() => setShowAddVenue(true)}
                            className="flex cursor-pointer items-center gap-2 rounded-full bg-btn-red px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98]"
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Venue
                        </button>
                    </div>
                )}

                {/* ── Metrics ribbon ── */}
                {selectedVenueId && (<><div className="mb-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-surface-container p-5" style={ghostCard}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Today&apos;s Bookings
                        </p>
                        <p className="text-3xl font-black tracking-tight text-on-surface">
                            {dateBookings.length}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                            <CalendarCheck className="h-3 w-3" /> {dateAppBookings.length} App &middot; {dateBookings.length - dateAppBookings.length} Walk-In
                        </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container p-5" style={ghostCard}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Est. Revenue
                        </p>
                        <p className="text-3xl font-black tracking-tight text-on-surface">
                            ₹{(dateBookings.length * venuePrice).toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant/40">
                            <IndianRupee className="h-3 w-3" /> ₹{venuePrice}/slot
                        </p>
                    </div>
                </div>


                {/* ── Live Floor Grid ── */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                                <Monitor className="h-3.5 w-3.5" />
                                Live Floor
                                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            </p>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="flex cursor-pointer items-center gap-1 rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white transition-all duration-300 hover:bg-white hover:text-sky-600 active:scale-[0.98]"
                            >
                                <ScanLine className="h-3.5 w-3.5" />
                                Scan QR
                            </button>
                            <button
                                onClick={() => setShowAddRig(true)}
                                className="flex cursor-pointer items-center gap-1 rounded-full bg-btn-red px-3 py-1 text-xs font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98]"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Rig
                            </button>
                        </div>
                        {/* Desktop legend */}
                        <div className="hidden items-center gap-4 text-xs text-on-surface-variant/40 sm:flex">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                Available
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-btn-red" />
                                App Booked
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-amber-400" />
                                Walk-In
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-sky-400" />
                                In Use
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-on-surface-variant/20" />
                                Out of Order
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-[130px] animate-pulse rounded-2xl bg-surface-container"
                                    style={ghostCard}
                                />
                            ))}
                        </div>
                    ) : rigs.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container p-8 text-center" style={ghostCard}>
                            <p className="text-sm text-on-surface-variant/40">
                                No rigs found for this venue
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {rigs.map((rig) => {
                                const effectiveStatus = getEffectiveStatus(rig);
                                const cfg = STATUS_CONFIG[effectiveStatus];
                                const booking = dateBookings.find((b) => b.rig_id === rig.id);

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
                                        className={`group relative flex min-h-[130px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-200 ${cfg.border} ${cfg.bg} ${cfg.clickable ? "cursor-pointer" : "cursor-default"}`}
                                    >
                                        {/* Edit + OOO icons (top-right) */}
                                        <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-all group-hover:opacity-100">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditTarget(rig);
                                                }}
                                                title="Edit rig"
                                                className="rounded-lg p-1 text-on-surface-variant/30 transition-all hover:bg-surface-container-high hover:text-on-surface-variant"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </button>
                                            {(effectiveStatus === "available" ||
                                                effectiveStatus === "out_of_order") && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleOOO(rig.id);
                                                    }}
                                                    title={
                                                        rig.status === "out_of_order"
                                                            ? "Restore"
                                                            : "Mark Out of Order"
                                                    }
                                                    className="rounded-lg p-1 text-on-surface-variant/30 transition-all hover:bg-surface-container-high hover:text-on-surface-variant"
                                                >
                                                    <Wrench className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Platform icon + type */}
                                        <RigTypeIcon
                                            type={rig.type}
                                            className={`mb-1 h-4 w-4 ${effectiveStatus === "out_of_order" ? "text-on-surface-variant/20" : RIG_TYPE_COLOR[rig.type]}`}
                                        />
                                        <span className={`mb-1 text-[9px] font-semibold ${effectiveStatus === "out_of_order" ? "text-on-surface-variant/20" : RIG_TYPE_COLOR[rig.type]}`}>
                                            {RIG_TYPE_LABEL[rig.type]}
                                        </span>

                                        {/* Status dot */}
                                        <div
                                            className={`mb-2 h-2.5 w-2.5 rounded-full ${cfg.dot} ${effectiveStatus === "available" ? "animate-pulse" : ""}`}
                                        />

                                        {/* Rig name */}
                                        <span
                                            className={`text-sm font-bold ${effectiveStatus === "out_of_order" ? "text-on-surface-variant/30" : "text-on-surface"}`}
                                        >
                                            {rig.name}
                                        </span>

                                        {/* Status label */}
                                        <span className={`mt-0.5 text-[10px] font-medium ${cfg.labelColor}`}>
                                            {cfg.label}
                                        </span>

                                        {/* Booking info */}
                                        {booking && effectiveStatus !== "available" && (
                                            <span className="mt-1 max-w-full truncate px-2 text-[10px] text-on-surface-variant/40">
                                                {booking.customer_name}
                                                {booking.time_slot && ` \u00b7 ${booking.time_slot}`}
                                            </span>
                                        )}

                                        {/* Specs */}
                                        <span className={`mt-1 text-[9px] ${effectiveStatus === "out_of_order" ? "text-on-surface-variant/20" : "text-on-surface-variant/30"}`}>
                                            {rig.specs}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Mobile legend */}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-on-surface-variant/40 sm:hidden">
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-btn-red" />
                            Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-amber-400" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-on-surface-variant/20" />
                            OOO
                        </div>
                    </div>
                </div>

                {/* ── Slot Timeline Heatmap ── */}
                {rigs.length > 0 && (
                <div className="mb-8">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            <Clock className="h-3.5 w-3.5" />
                            Slot Overview
                            <span className="text-[10px] font-normal normal-case tracking-normal text-on-surface-variant/40">
                                &middot; {slotOverviewDate === todayStr ? "Today" : (() => {
                                    const d = new Date(slotOverviewDate + "T00:00:00");
                                    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                                })()}
                            </span>
                        </p>
                        <input
                            type="date"
                            value={slotOverviewDate}
                            onChange={(e) => setSlotOverviewDate(e.target.value)}
                            className="rounded-lg border border-white/10 bg-surface-container-high px-3 py-1.5 text-[11px] text-on-surface-variant/70 outline-none transition-colors focus:border-btn-red/50 [color-scheme:dark]"
                        />
                    </div>
                    <div className="overflow-x-auto rounded-2xl bg-surface-container" style={ghostCard}>
                        <table className="w-full min-w-[640px] text-[10px]">
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    <th className="sticky left-0 z-10 bg-surface-container px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                        Rig
                                    </th>
                                    {TIME_SLOTS.map((slot) => {
                                        const h = parseSlotStartHour(slot);
                                        const isCurrent = slotOverviewDate === todayStr && h === now.getHours();
                                        return (
                                            <th
                                                key={slot}
                                                className={`px-1 py-2.5 text-center font-medium transition-colors ${
                                                    isCurrent
                                                        ? "text-emerald-400"
                                                        : "text-on-surface-variant/30"
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
                                    const rigBookedSlots = slotRigSlotMap.get(rig.id);
                                    return (
                                        <tr key={rig.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="last:border-0">
                                            <td className="sticky left-0 z-10 bg-surface-container px-3 py-1.5 font-medium text-on-surface-variant/70">
                                                {rig.name}
                                            </td>
                                            {TIME_SLOTS.map((slot) => {
                                                const booking = rigBookedSlots?.has(slot)
                                                    ? slotOverviewBookings.find((b) => b.rig_id === rig.id && b.time_slot === slot)
                                                    : null;
                                                const isOOO = rig.status === "out_of_order";
                                                const h = parseSlotStartHour(slot);
                                                const isPast = isSlotPast(slot, slotOverviewDate, now);
                                                const isCurrent = slotOverviewDate === todayStr && h === now.getHours();

                                                let cellBg = "";
                                                let cellText = "";
                                                let tooltip = "Available";

                                                if (isOOO) {
                                                    cellBg = "bg-surface-container-high/30";
                                                    cellText = "text-on-surface-variant/20";
                                                    tooltip = "Out of Order";
                                                } else if (booking) {
                                                    if (booking.source === "app") {
                                                        cellBg = "bg-btn-red/10";
                                                        cellText = "text-btn-red";
                                                    } else {
                                                        cellBg = "bg-amber-500/10";
                                                        cellText = "text-amber-400";
                                                    }
                                                    tooltip = `${booking.customer_name} (${booking.source === "app" ? "App" : "Walk-In"}) ${booking.verification_code}`;
                                                } else if (isPast) {
                                                    cellBg = "bg-surface-container-high/20";
                                                    cellText = "text-on-surface-variant/10";
                                                    tooltip = "Past";
                                                }

                                                const isClickable = !isOOO && !booking && !isPast;

                                                return (
                                                    <td
                                                        key={slot}
                                                        title={tooltip}
                                                        onClick={() => {
                                                            if (isClickable) {
                                                                setPreSelectedSlots([slot]);
                                                                setWalkInTarget(rig);
                                                            }
                                                        }}
                                                        className={`px-1 py-1.5 text-center transition-all ${cellBg} ${isCurrent && !booking ? "ring-1 ring-inset ring-emerald-500/20" : ""} ${isClickable ? "cursor-pointer hover:bg-white/[0.04]" : ""}`}
                                                    >
                                                        {isOOO ? (
                                                            <span className={cellText}>&mdash;</span>
                                                        ) : booking ? (
                                                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                                                                booking.source === "app" ? "bg-btn-red" : "bg-amber-400"
                                                            }`} title={tooltip} />
                                                        ) : isPast ? (
                                                            <span className="text-on-surface-variant/10">&middot;</span>
                                                        ) : (
                                                            <span className="text-on-surface-variant/20">&middot;</span>
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
                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[10px] text-on-surface-variant/30">
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-btn-red" />
                            App Booked
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                            Walk-In
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-on-surface-variant/20">&middot;</span>
                            Available
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-on-surface-variant/20">&mdash;</span>
                            Out of Order
                        </div>
                    </div>
                </div>
                )}

                {/* ── Bookings Schedule Ledger ── */}
                <div>
                    {(() => {
                        const ledgerBookings = dateBookings;
                        return (<>
                    <div className="mb-4 flex items-center gap-3">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            <Users className="h-3.5 w-3.5" />
                            Today&apos;s Bookings
                        </p>
                        <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[10px] font-semibold text-on-surface-variant/50">
                            {ledgerBookings.length}
                        </span>
                    </div>

                    {ledgerBookings.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container p-8 text-center" style={ghostCard}>
                            <CalendarCheck className="mx-auto mb-2 h-6 w-6 text-on-surface-variant/20" />
                            <p className="text-sm text-on-surface-variant/40">
                                No bookings for today
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-surface-container" style={ghostCard}>
                            {/* Desktop table */}
                            <div className="hidden sm:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                            <th className="bg-surface-container-high/30 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                                Date
                                            </th>
                                            <th className="bg-surface-container-high/30 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                                Time
                                            </th>
                                            <th className="bg-surface-container-high/30 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                                Rig
                                            </th>
                                            <th className="bg-surface-container-high/30 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                                Customer
                                            </th>
                                            <th className="bg-surface-container-high/30 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                                Code
                                            </th>
                                            <th className="bg-surface-container-high/30 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                                Source
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerBookings.map((b) => (
                                            <tr
                                                key={b.id}
                                                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                                className="last:border-0"
                                            >
                                                <td className="px-4 py-3 text-xs text-on-surface-variant/50">
                                                    {b.booking_date === todayStr ? "Today" : (() => {
                                                        const d = new Date(b.booking_date + "T00:00:00");
                                                        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-on-surface-variant/70">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3 text-on-surface-variant/30" />
                                                        {b.time_slot}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-on-surface">
                                                    {b.rig_name}
                                                </td>
                                                <td className="px-4 py-3 text-on-surface-variant/60">
                                                    {b.customer_name}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-primary">
                                                    {b.verification_code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                                            b.source === "app"
                                                                ? "bg-primary/10 text-primary"
                                                                : "bg-amber-500/10 text-amber-400"
                                                        }`}
                                                    >
                                                        {b.source === "app" ? "App" : "Walk-In"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y sm:hidden" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                {ledgerBookings.map((b) => (
                                    <div key={b.id} className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-on-surface">
                                                {b.rig_name}
                                            </span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                                    b.source === "app"
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-amber-500/10 text-amber-400"
                                                }`}
                                            >
                                                {b.source === "app" ? "App" : "Walk-In"}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant/50">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {b.time_slot}
                                            </span>
                                            <span>{b.customer_name}</span>
                                            <span className="font-mono text-primary/70">
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
            {showScanner && (
                <ScannerModal
                    onClose={() => setShowScanner(false)}
                    onCheckIn={loadData}
                />
            )}

            {walkInTarget && (
                <WalkInModal
                    rig={walkInTarget}
                    initialDate={todayStr}
                    initialSlots={preSelectedSlots.length > 0 ? preSelectedSlots : undefined}
                    existingBookings={bookings}
                    onConfirm={handleBlockWalkIn}
                    onCancelBooking={handleCancelBookingFromModal}
                    onClose={() => { setWalkInTarget(null); setPreSelectedSlots([]); }}
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

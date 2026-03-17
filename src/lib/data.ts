import { supabase, supabaseAdmin } from "./supabase";

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface Rig {
    id: number;
    name: string;
    status: "available" | "booked";
    specs: string;
}

export interface Venue {
    id: number;
    name: string;
    location: string;
    price: number;
    availableRigs: number;
    totalRigs: number;
    description: string;
    rigs: Rig[];
}

/* ─── Dashboard types ──────────────────────────────────────────────── */

export type RigStatus = "available" | "booked" | "blocked" | "out_of_order";

export interface DashboardRig {
    id: number;
    name: string;
    status: RigStatus;
    specs: string;
}

export interface Booking {
    id: number;
    rig_id: number;
    rig_name: string;
    customer_name: string;
    time_slot: string;
    verification_code: string;
    source: "app" | "walk_in";
}

export interface VenueOption {
    id: number;
    name: string;
    location: string;
    price: number;
}

/* ─── Constants ─────────────────────────────────────────────────────── */

export const TIME_SLOTS = [
    "10:00 AM – 11:00 AM",
    "11:00 AM – 12:00 PM",
    "12:00 PM – 1:00 PM",
    "1:00 PM – 2:00 PM",
    "2:00 PM – 3:00 PM",
    "3:00 PM – 4:00 PM",
    "4:00 PM – 5:00 PM",
    "5:00 PM – 6:00 PM",
    "6:00 PM – 7:00 PM",
    "7:00 PM – 8:00 PM",
    "8:00 PM – 9:00 PM",
    "9:00 PM – 10:00 PM",
];

/* ─── Supabase row types ────────────────────────────────────────────── */

interface DbVenue {
    id: number;
    name: string;
    location: string;
    price: number;
    description: string;
}

interface DbRig {
    id: number;
    venue_id: number;
    name: string;
    status: RigStatus;
    specs: string;
}

/* ─── Data-fetching helpers ─────────────────────────────────────────── */

/**
 * Fetch all venues with computed rig counts.
 */
export async function getVenues(): Promise<Venue[]> {
    const { data: venues, error: vErr } = await supabase
        .from("venues")
        .select("*")
        .order("id");

    if (vErr || !venues) {
        throw new Error(vErr?.message ?? "Failed to fetch venues");
    }

    const { data: rigs, error: rErr } = await supabase
        .from("rigs")
        .select("*")
        .order("id");

    if (rErr || !rigs) {
        throw new Error(rErr?.message ?? "Failed to fetch rigs");
    }

    return (venues as DbVenue[]).map((v) => {
        const venueRigs = (rigs as DbRig[]).filter((r) => r.venue_id === v.id);
        return {
            id: v.id,
            name: v.name,
            location: v.location,
            price: v.price,
            description: v.description,
            totalRigs: venueRigs.length,
            availableRigs: venueRigs.filter((r) => r.status === "available").length,
            rigs: venueRigs.map((r) => ({
                id: r.id,
                name: r.name,
                status: r.status === "available" ? "available" as const : "booked" as const,
                specs: r.specs,
            })),
        };
    });
}

/**
 * Fetch a single venue by ID with its rigs.
 */
export async function getVenueById(id: number): Promise<Venue | null> {
    const { data: venue, error: vErr } = await supabase
        .from("venues")
        .select("*")
        .eq("id", id)
        .single();

    if (vErr || !venue) {
        throw new Error(vErr?.message ?? "Failed to fetch venue");
    }

    const { data: rigs, error: rErr } = await supabase
        .from("rigs")
        .select("*")
        .eq("venue_id", id)
        .order("id");

    if (rErr || !rigs) {
        throw new Error(rErr?.message ?? "Failed to fetch rigs");
    }

    const v = venue as DbVenue;
    const venueRigs = rigs as DbRig[];

    return {
        id: v.id,
        name: v.name,
        location: v.location,
        price: v.price,
        description: v.description,
        totalRigs: venueRigs.length,
        availableRigs: venueRigs.filter((r) => r.status === "available").length,
        rigs: venueRigs.map((r) => ({
            id: r.id,
            name: r.name,
            status: r.status === "available" ? "available" as const : "booked" as const,
            specs: r.specs,
        })),
    };
}

/* ─── Dashboard data functions ─────────────────────────────────────── */

export async function getVenuesList(): Promise<VenueOption[]> {
    const { data, error } = await supabase
        .from("venues")
        .select("id, name, location, price")
        .order("id");
    if (error || !data) throw new Error(error?.message ?? "Failed to fetch venues list");
    return data as VenueOption[];
}

export async function getDashboardRigs(venueId: number): Promise<DashboardRig[]> {
    const { data, error } = await supabase
        .from("rigs")
        .select("id, name, status, specs")
        .eq("venue_id", venueId)
        .order("id");
    if (error || !data) throw new Error(error?.message ?? "Failed to fetch rigs");
    return data as DashboardRig[];
}

export async function getTodaysBookings(venueId: number): Promise<Booking[]> {
    // Use local date (matches what the venue sees on their wall clock)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const { data: rigRows } = await supabase
        .from("rigs")
        .select("id, name")
        .eq("venue_id", venueId);
    if (!rigRows || rigRows.length === 0) return [];

    const { data: rows, error } = await supabase
        .from("bookings")
        .select("id, rig_id, customer_name, time_slot, verification_code, source")
        .eq("booking_date", today)
        .in("rig_id", rigRows.map((r) => r.id))
        .order("time_slot");
    if (error || !rows) return [];

    return rows.map((b) => ({
        ...b,
        rig_name: rigRows.find((r) => r.id === b.rig_id)?.name ?? `Rig ${b.rig_id}`,
    })) as Booking[];
}

/**
 * Block an available rig for a walk-in customer.
 * Uses optimistic concurrency — only succeeds if the rig is still available.
 */
export async function blockRigForWalkIn(
    rigId: number,
    durationHours: number,
): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase
        .from("rigs")
        .update({ status: "blocked" })
        .eq("id", rigId)
        .eq("status", "available")
        .select();

    if (error || !data || data.length === 0) {
        return { success: false, error: "Slot just secured online. Select another rig." };
    }

    const now = new Date();
    const startHour = now.getHours();
    const endHour = startHour + durationHours;
    const timeSlot = `${fmtHour(startHour)} – ${fmtHour(endHour)}`;
    const code = `WLK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const { error: insertError } = await supabase.from("bookings").insert({
        rig_id: rigId,
        customer_name: "Walk-In",
        time_slot: timeSlot,
        booking_date: today,
        verification_code: code,
        source: "walk_in",
    });

    if (insertError) {
        // Rig was blocked but booking record failed — revert rig status
        await supabase.from("rigs").update({ status: "available" }).eq("id", rigId);
        return { success: false, error: "Failed to create booking record." };
    }

    return { success: true };
}

export async function releaseRig(rigId: number): Promise<{ success: boolean }> {
    const { error } = await supabase
        .from("rigs")
        .update({ status: "available" })
        .eq("id", rigId)
        .eq("status", "blocked");
    if (error) return { success: false };

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await supabase
        .from("bookings")
        .delete()
        .eq("rig_id", rigId)
        .eq("source", "walk_in")
        .eq("booking_date", today);

    return { success: true };
}

export async function toggleOutOfOrder(rigId: number): Promise<{ success: boolean }> {
    const { data: rig } = await supabase
        .from("rigs")
        .select("status")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false };

    if (rig.status !== "available" && rig.status !== "out_of_order") {
        return { success: false };
    }

    const newStatus = rig.status === "out_of_order" ? "available" : "out_of_order";
    const { error } = await supabase
        .from("rigs")
        .update({ status: newStatus })
        .eq("id", rigId);
    if (error) return { success: false };
    return { success: true };
}

function fmtHour(hour: number): string {
    const h = ((hour % 24) + 24) % 24;
    const period = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${period}`;
}

/* ─── Admin-only rig management ───────────────────────────────────── */

async function requireAdminSession(): Promise<void> {
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (!session) throw new Error("Unauthorized: admin session required.");
}

export async function addRig(
    venueId: number,
    name: string,
    specs: string,
    status: "available" | "out_of_order",
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    const { data: existing } = await supabase
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId)
        .ilike("name", name)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "A rig with this name already exists in this venue." };
    }

    const { error } = await supabase
        .from("rigs")
        .insert({ venue_id: venueId, name, specs, status });

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function updateRig(
    rigId: number,
    name: string,
    specs: string,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    const { data: rig } = await supabase
        .from("rigs")
        .select("venue_id")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false, error: "Rig not found." };

    const { data: existing } = await supabase
        .from("rigs")
        .select("id")
        .eq("venue_id", rig.venue_id)
        .ilike("name", name)
        .neq("id", rigId)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "A rig with this name already exists in this venue." };
    }

    const { error } = await supabase
        .from("rigs")
        .update({ name, specs })
        .eq("id", rigId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteRig(
    rigId: number,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    const { error } = await supabase
        .from("rigs")
        .delete()
        .eq("id", rigId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

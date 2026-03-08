import { supabase } from "./supabase";

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
    status: "available" | "booked";
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
        console.error("Failed to fetch venues:", vErr);
        return [];
    }

    const { data: rigs, error: rErr } = await supabase
        .from("rigs")
        .select("*")
        .order("id");

    if (rErr || !rigs) {
        console.error("Failed to fetch rigs:", rErr);
        return [];
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
                status: r.status,
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
        console.error("Failed to fetch venue:", vErr);
        return null;
    }

    const { data: rigs, error: rErr } = await supabase
        .from("rigs")
        .select("*")
        .eq("venue_id", id)
        .order("id");

    if (rErr || !rigs) {
        console.error("Failed to fetch rigs:", rErr);
        return null;
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
            status: r.status,
            specs: r.specs,
        })),
    };
}

import { supabase, supabaseAdmin } from "./supabase";
import { getTodayStr, toDateStr, parseSlotStartHour, parseSlotEndHour, isSlotPast } from "./utils";

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface Rig {
    id: number;
    name: string;
    status: RigStatus;
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
    imageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    rigs: Rig[];
}

/* ─── Dashboard types ──────────────────────────────────────────────── */

export type RigStatus = "available" | "booked" | "blocked" | "out_of_order" | "in_use";

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
    booking_date: string;
    verification_code: string;
    source: "app" | "walk_in";
}

export interface VenueOption {
    id: number;
    name: string;
    location: string;
    price: number;
    description: string;
    imageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    ownerId: string | null;
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
    owner_id: string | null;
    image_url: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface DbRig {
    id: number;
    venue_id: number;
    name: string;
    status: RigStatus;
    specs: string;
}

interface DbVenueWithCounts extends DbVenue {
    total_rigs: number;
    available_rigs: number;
    latitude: number | null;
    longitude: number | null;
}

/* ─── Data-fetching helpers ─────────────────────────────────────────── */

/**
 * Fetch all venues with aggregate rig counts.
 * Uses the venue_with_counts Postgres view for efficient server-side counting.
 * Falls back to client-side counting if the view doesn't exist yet.
 */
export async function getVenues(): Promise<Venue[]> {
    // Try the aggregate view first (faster, single query)
    const { data: viewData, error: viewErr } = await supabase
        .from("venue_with_counts")
        .select("*")
        .order("id");

    if (!viewErr && viewData) {
        return viewData.map((v: DbVenueWithCounts) => ({
            id: v.id,
            name: v.name,
            location: v.location,
            price: v.price,
            description: v.description,
            imageUrl: v.image_url ?? null,
            latitude: v.latitude ?? null,
            longitude: v.longitude ?? null,
            totalRigs: v.total_rigs,
            availableRigs: v.available_rigs,
            rigs: [], // Explore page doesn't need individual rigs
        }));
    }

    // Fallback: client-side counting (if migration not yet applied)
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
            imageUrl: v.image_url ?? null,
            latitude: v.latitude ?? null,
            longitude: v.longitude ?? null,
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
        imageUrl: v.image_url ?? null,
        latitude: v.latitude ?? null,
        longitude: v.longitude ?? null,
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

/* ─── Customer booking helpers ─────────────────────────────────────── */

/**
 * Fetch rig IDs that are booked for any of the given time slots today.
 * Used on the booking page so the RigGrid can show per-slot availability.
 */
export async function getBookedRigIdsForSlots(
    venueId: number,
    slots: string[],
    bookingDate?: string,
): Promise<Set<number>> {
    if (slots.length === 0) return new Set();

    const today = bookingDate ?? getTodayStr();

    // Get rig IDs for this venue
    const { data: rigRows } = await supabase
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId);
    if (!rigRows || rigRows.length === 0) return new Set();

    const rigIds = rigRows.map((r) => r.id);

    // Get bookings that overlap with any of the selected slots
    const { data: bookings } = await supabase
        .from("bookings")
        .select("rig_id, time_slot")
        .eq("booking_date", today)
        .in("rig_id", rigIds)
        .in("time_slot", slots);

    if (!bookings) return new Set();
    return new Set(bookings.map((b) => b.rig_id));
}

/**
 * Create booking records for a customer (app booking).
 * Inserts one record per rig × time-slot combination.
 * Uses optimistic concurrency to prevent double-booking.
 */
export async function createAppBooking(
    venueId: number,
    rigIds: number[],
    slots: string[],
    bookingDate: string,
    customerName: string,
    userId?: string,
): Promise<{ success: boolean; error?: string; verificationCode?: string }> {
    if (rigIds.length === 0 || slots.length === 0) {
        return { success: false, error: "No rigs or slots selected." };
    }

    // Validate booking date is not in the past
    const now = new Date();
    const today = getTodayStr();
    if (bookingDate < today) {
        return { success: false, error: "Cannot book for a past date." };
    }

    // Validate booking date is within 7-day window
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateStr = toDateStr(maxDate);
    if (bookingDate > maxDateStr) {
        return { success: false, error: "Cannot book more than 7 days in advance." };
    }

    // Validate time slots are not past the buffer cutoff (for today)
    for (const slot of slots) {
        if (isSlotPast(slot, bookingDate, now)) {
            return { success: false, error: "Cannot book a time slot that has already passed." };
        }
    }

    // Validate all slots are recognized
    for (const slot of slots) {
        if (!TIME_SLOTS.includes(slot)) {
            return { success: false, error: "Invalid time slot selected." };
        }
    }

    // Validate rigs belong to this venue
    const { data: venueRigs } = await supabase
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId);
    if (!venueRigs) {
        return { success: false, error: "Failed to verify rigs." };
    }
    const venueRigIds = new Set(venueRigs.map((r) => r.id));
    for (const rigId of rigIds) {
        if (!venueRigIds.has(rigId)) {
            return { success: false, error: "Selected rig does not belong to this venue." };
        }
    }

    // Check for existing bookings that would conflict
    const { data: conflicts } = await supabase
        .from("bookings")
        .select("rig_id, time_slot")
        .eq("booking_date", bookingDate)
        .in("rig_id", rigIds)
        .in("time_slot", slots);

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Some slots were just booked. Please refresh and try again." };
    }

    // Also check rig status (out_of_order / blocked)
    const { data: rigRows } = await supabase
        .from("rigs")
        .select("id, status")
        .in("id", rigIds);

    if (!rigRows) {
        return { success: false, error: "Failed to verify rig availability." };
    }

    const unavailable = rigRows.filter((r) => r.status !== "available");
    if (unavailable.length > 0) {
        return { success: false, error: "Some rigs are no longer available. Please refresh and try again." };
    }

    const code = `APP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const checkInToken = crypto.randomUUID();

    // Build booking rows: one per rig × slot
    const rows = rigIds.flatMap((rigId) =>
        slots.map((slot) => ({
            rig_id: rigId,
            customer_name: customerName,
            time_slot: slot,
            booking_date: bookingDate,
            verification_code: code,
            source: "app" as const,
            check_in_token: checkInToken,
            ...(userId ? { user_id: userId } : {}),
        })),
    );

    const { error: insertError } = await supabase.from("bookings").insert(rows);

    if (insertError) {
        if (insertError.code === "23505") {
            return { success: false, error: "Some slots were just booked by another user. Please refresh and try again." };
        }
        return { success: false, error: "Booking failed. Please try again." };
    }

    return { success: true, verificationCode: code };
}

/* ─── Dashboard data functions ─────────────────────────────────────── */

export async function getVenuesList(): Promise<VenueOption[]> {
    const adminId = await requireAdminSession();

    const { data, error } = await supabaseAdmin
        .from("venues")
        .select("id, name, location, price, description, image_url, owner_id")
        .eq("owner_id", adminId)
        .order("id");
    if (error || !data) throw new Error(error?.message ?? "Failed to fetch venues list");
    return (data as DbVenue[]).map((v) => ({
        id: v.id,
        name: v.name,
        location: v.location,
        price: v.price,
        description: v.description ?? "",
        imageUrl: v.image_url ?? null,
        ownerId: v.owner_id ?? null,
    }));
}

export async function getDashboardRigs(venueId: number): Promise<DashboardRig[]> {
    const { data, error } = await supabaseAdmin
        .from("rigs")
        .select("id, name, status, specs")
        .eq("venue_id", venueId)
        .order("id");
    if (error || !data) throw new Error(error?.message ?? "Failed to fetch rigs");
    return data as DashboardRig[];
}

export async function getTodaysBookings(venueId: number): Promise<Booking[]> {
    // Use local date (matches what the venue sees on their wall clock)
    const today = getTodayStr();

    const { data: rigRows } = await supabase
        .from("rigs")
        .select("id, name")
        .eq("venue_id", venueId);
    if (!rigRows || rigRows.length === 0) return [];

    // Fetch today's bookings + future app bookings (customers can book up to 7 days ahead)
    const { data: rows, error } = await supabase
        .from("bookings")
        .select("id, rig_id, customer_name, time_slot, booking_date, verification_code, source")
        .gte("booking_date", today)
        .in("rig_id", rigRows.map((r) => r.id))
        .order("booking_date")
        .order("time_slot");
    if (error || !rows) return [];

    return rows.map((b) => ({
        ...b,
        rig_name: rigRows.find((r) => r.id === b.rig_id)?.name ?? `Rig ${b.rig_id}`,
    })) as Booking[];
}

/**
 * Block an available rig for a walk-in customer (admin only).
 * Accepts specific time slots and date. Checks for conflicts with existing bookings.
 * Only changes rig DB status to "blocked" if booking includes the current live slot today.
 */
export async function blockRigForWalkIn(
    rigId: number,
    slots: string[],
    bookingDate: string,
    customerName?: string,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    if (slots.length === 0) {
        return { success: false, error: "No time slots selected." };
    }

    // Validate slots
    for (const slot of slots) {
        if (!TIME_SLOTS.includes(slot)) {
            return { success: false, error: "Invalid time slot." };
        }
    }

    // Check rig is available or already blocked (not out_of_order or booked)
    const { data: rig } = await supabaseAdmin
        .from("rigs")
        .select("status")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false, error: "Rig not found." };
    if (rig.status === "out_of_order") {
        return { success: false, error: "Rig is out of order." };
    }

    // Check for conflicting bookings on the selected date + slots
    const { data: conflicts } = await supabaseAdmin
        .from("bookings")
        .select("rig_id, time_slot")
        .eq("rig_id", rigId)
        .eq("booking_date", bookingDate)
        .in("time_slot", slots);

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Some slots are already booked. Please refresh." };
    }

    const code = `WLK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const name = customerName?.trim() || "Walk-In";

    // Compute blocked_until from the last slot's end hour
    const lastSlotEndHours = slots.map((slot) => {
        const match = slot.match(/–\s*(\d{1,2}):00\s*(AM|PM)/i);
        if (!match) return 0;
        let h = parseInt(match[1], 10);
        const p = match[2].toUpperCase();
        if (p === "PM" && h !== 12) h += 12;
        if (p === "AM" && h === 12) h = 0;
        return h;
    });
    const maxEndHour = Math.max(...lastSlotEndHours);
    const blockedDate = new Date(bookingDate + "T00:00:00");
    blockedDate.setHours(maxEndHour, 0, 0, 0);
    const blockedUntil = blockedDate.toISOString();

    // Insert booking records for each slot
    const rows = slots.map((slot) => ({
        rig_id: rigId,
        customer_name: name,
        time_slot: slot,
        booking_date: bookingDate,
        verification_code: code,
        source: "walk_in" as const,
        blocked_until: blockedUntil,
    }));

    const { error: insertError } = await supabaseAdmin.from("bookings").insert(rows);
    if (insertError) {
        if (insertError.code === "23505") {
            return { success: false, error: "Some slots were just booked by another user. Please refresh and try again." };
        }
        return { success: false, error: "Failed to create booking records." };
    }

    // Only update rig status to "blocked" if booking covers the current live hour today
    const now = new Date();
    const today = getTodayStr();
    if (bookingDate === today) {
        const currentHour = now.getHours();
        const coversNow = slots.some((slot) => {
            const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
            if (!match) return false;
            let h = parseInt(match[1], 10);
            const p = match[2].toUpperCase();
            if (p === "PM" && h !== 12) h += 12;
            if (p === "AM" && h === 12) h = 0;
            return currentHour >= h && currentHour < h + 1;
        });
        if (coversNow && rig.status === "available") {
            await supabaseAdmin
                .from("rigs")
                .update({ status: "blocked" })
                .eq("id", rigId)
                .eq("status", "available");
        }
    }

    return { success: true };
}

export async function releaseRig(rigId: number): Promise<{ success: boolean }> {
    await requireAdminSession();

    const { error } = await supabaseAdmin
        .from("rigs")
        .update({ status: "available" })
        .eq("id", rigId)
        .eq("status", "blocked");
    if (error) return { success: false };

    await supabaseAdmin
        .from("bookings")
        .delete()
        .eq("rig_id", rigId)
        .eq("source", "walk_in");

    return { success: true };
}

/**
 * Check in a rig — set its status to "in_use" (admin only).
 * Works for both app-booked and walk-in blocked rigs.
 * Only allows check-in if the current time falls within a booked slot for this rig today.
 */
export async function checkInRig(
    rigId: number,
    bookingId?: number,
    timeSlot?: string,
    bookingDate?: string,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    const { data: rig } = await supabaseAdmin
        .from("rigs")
        .select("status")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false, error: "Rig not found." };
    if (rig.status !== "available" && rig.status !== "blocked" && rig.status !== "booked") {
        return { success: false, error: "Rig cannot be checked in from its current status." };
    }

    // Verify there is a booking for this rig right now
    const today = getTodayStr();
    const { data: bookings } = await supabaseAdmin
        .from("bookings")
        .select("id, time_slot")
        .eq("rig_id", rigId)
        .eq("booking_date", bookingDate ?? today);

    if (!bookings || bookings.length === 0) {
        return { success: false, error: "No booking found for this rig today." };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const matchingBooking = bookings.find((b) => {
        const match = b.time_slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
        if (!match) return false;
        let slotHour = parseInt(match[1], 10);
        const period = match[2].toUpperCase();
        if (period === "PM" && slotHour !== 12) slotHour += 12;
        if (period === "AM" && slotHour === 12) slotHour = 0;
        return currentHour === slotHour;
    });

    if (!matchingBooking) {
        return { success: false, error: "Check-in is only allowed during the booked time slot." };
    }

    // Update rig status to "in_use"
    const { error } = await supabaseAdmin
        .from("rigs")
        .update({ status: "in_use" })
        .eq("id", rigId);
    if (error) return { success: false, error: "Failed to update rig status." };

    // Compute blocked_until (end of the time slot) for auto-release
    const slot = timeSlot ?? matchingBooking.time_slot;
    const targetId = bookingId ?? matchingBooking.id;
    const endHour = parseSlotEndHour(slot);

    if (endHour >= 0) {
        const blockedDate = new Date((bookingDate ?? today) + "T00:00:00");
        blockedDate.setHours(endHour, 0, 0, 0);
        const blockedUntil = blockedDate.toISOString();
        await supabaseAdmin
            .from("bookings")
            .update({ status: "checked_in", blocked_until: blockedUntil })
            .eq("id", targetId);
    } else {
        // Fallback: mark checked_in without blocked_until so rig isn't silently stuck
        console.warn(`checkInRig: could not parse end hour from slot "${slot}"`);
        await supabaseAdmin
            .from("bookings")
            .update({ status: "checked_in" })
            .eq("id", targetId);
    }

    return { success: true };
}

/**
 * Admin-only: book a single slot for a rig with a chosen source/status.
 * source "app" → App Booked, "walk_in" → Walk-In.
 * If markInUse is true the rig is also set to "in_use".
 */
export async function adminBookSlot(
    rigId: number,
    slot: string,
    bookingDate: string,
    source: "app" | "walk_in",
    markInUse: boolean = false,
    customerName?: string,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    if (!TIME_SLOTS.includes(slot)) {
        return { success: false, error: "Invalid time slot." };
    }

    const { data: rig } = await supabaseAdmin
        .from("rigs")
        .select("status")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false, error: "Rig not found." };
    if (rig.status === "out_of_order") {
        return { success: false, error: "Rig is out of order." };
    }

    // Check for conflict
    const { data: conflicts } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("rig_id", rigId)
        .eq("booking_date", bookingDate)
        .eq("time_slot", slot);
    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Slot is already booked." };
    }

    const prefix = source === "app" ? "APP" : "WLK";
    const code = `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const name = customerName?.trim() || (source === "app" ? "App Booking" : "Walk-In");

    // Compute blocked_until from slot end hour
    const endMatch = slot.match(/–\s*(\d{1,2}):00\s*(AM|PM)/i);
    let endHour = 0;
    if (endMatch) {
        endHour = parseInt(endMatch[1], 10);
        const p = endMatch[2].toUpperCase();
        if (p === "PM" && endHour !== 12) endHour += 12;
        if (p === "AM" && endHour === 12) endHour = 0;
    }
    const blockedDate = new Date(bookingDate + "T00:00:00");
    blockedDate.setHours(endHour, 0, 0, 0);

    const { error: insertError } = await supabaseAdmin.from("bookings").insert({
        rig_id: rigId,
        customer_name: name,
        time_slot: slot,
        booking_date: bookingDate,
        verification_code: code,
        source,
        blocked_until: blockedDate.toISOString(),
    });
    if (insertError) {
        if (insertError.code === "23505") {
            return { success: false, error: "Slot was just booked. Please refresh." };
        }
        return { success: false, error: "Failed to create booking." };
    }

    // Update rig status if needed
    if (markInUse) {
        await supabaseAdmin.from("rigs").update({ status: "in_use" }).eq("id", rigId);
    } else {
        const today = getTodayStr();
        if (bookingDate === today) {
            const currentHour = new Date().getHours();
            const startHour = parseSlotStartHour(slot);
            if (currentHour >= startHour && currentHour < startHour + 1 && rig.status === "available") {
                const newStatus = source === "walk_in" ? "blocked" : "booked";
                await supabaseAdmin.from("rigs").update({ status: newStatus }).eq("id", rigId);
            }
        }
    }

    return { success: true };
}

/**
 * Admin-only: cancel a booking by its ID. Deletes the booking row
 * and resets the rig status if needed.
 */
export async function adminCancelBooking(bookingId: number): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    // Fetch booking details before deleting (needed for rig status reset)
    const { data: booking } = await supabaseAdmin
        .from("bookings")
        .select("rig_id, source, time_slot, booking_date")
        .eq("id", bookingId)
        .single();

    if (!booking) return { success: false, error: "Booking not found." };

    const { error } = await supabaseAdmin
        .from("bookings")
        .delete()
        .eq("id", bookingId);

    if (error) return { success: false, error: "Failed to cancel booking." };

    // Reset rig status if the rig is currently in_use or blocked
    const { data: rig } = await supabaseAdmin
        .from("rigs")
        .select("status")
        .eq("id", booking.rig_id)
        .single();

    if (rig && rig.status === "in_use") {
        // Only reset if no other checked-in bookings remain for this rig
        const { data: otherCheckedIn } = await supabaseAdmin
            .from("bookings")
            .select("id")
            .eq("rig_id", booking.rig_id)
            .eq("status", "checked_in")
            .limit(1);

        if (!otherCheckedIn || otherCheckedIn.length === 0) {
            await supabaseAdmin
                .from("rigs")
                .update({ status: "available" })
                .eq("id", booking.rig_id)
                .eq("status", "in_use");
        }
    } else if (rig && rig.status === "blocked" && booking.source === "walk_in") {
        // Only reset if no other walk-in bookings cover the current hour
        const today = getTodayStr();
        if (booking.booking_date === today) {
            const currentHour = new Date().getHours();
            const { data: remainingWalkIns } = await supabaseAdmin
                .from("bookings")
                .select("id, time_slot")
                .eq("rig_id", booking.rig_id)
                .eq("booking_date", today)
                .eq("source", "walk_in");

            const anyCoversNow = remainingWalkIns?.some((b) => {
                const startHour = parseSlotStartHour(b.time_slot);
                return startHour >= 0 && currentHour >= startHour && currentHour < startHour + 1;
            });

            if (!anyCoversNow) {
                await supabaseAdmin
                    .from("rigs")
                    .update({ status: "available" })
                    .eq("id", booking.rig_id)
                    .eq("status", "blocked");
            }
        }
    }

    return { success: true };
}

/**
 * Release all walk-in blocked rigs whose blocked_until has passed.
 * Uses a Postgres security-definer function so it works from any context
 * (admin or customer) without needing admin RLS permissions.
 * Run supabase/migration_auto_release_fn.sql first.
 */
export async function releaseExpiredWalkIns(): Promise<number> {
    const { data, error } = await supabase.rpc("release_expired_walkins");
    if (error) {
        console.warn("releaseExpiredWalkIns RPC failed:", error.message);
        return 0;
    }
    return (data as number) ?? 0;
}

export async function toggleOutOfOrder(rigId: number): Promise<{ success: boolean }> {
    await requireAdminSession();

    const { data: rig } = await supabaseAdmin
        .from("rigs")
        .select("status")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false };

    if (rig.status !== "available" && rig.status !== "out_of_order") {
        return { success: false };
    }

    const newStatus = rig.status === "out_of_order" ? "available" : "out_of_order";
    const { error } = await supabaseAdmin
        .from("rigs")
        .update({ status: newStatus })
        .eq("id", rigId);
    if (error) return { success: false };
    return { success: true };
}


/* ─── Admin-only rig management ───────────────────────────────────── */

/**
 * Verify the current supabaseAdmin session belongs to an admin user.
 * Checks the profiles table for role === 'admin', not just session existence.
 */
async function requireAdminSession(): Promise<string> {
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (!session) throw new Error("Unauthorized: admin session required.");

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        throw new Error("Forbidden: user is not an admin.");
    }

    return session.user.id;
}

export async function addRig(
    venueId: number,
    name: string,
    specs: string,
    status: "available" | "out_of_order",
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    const { data: existing } = await supabaseAdmin
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId)
        .ilike("name", name)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "A rig with this name already exists in this venue." };
    }

    const { error } = await supabaseAdmin
        .from("rigs")
        .insert({ venue_id: venueId, name, specs, status });

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function updateRig(
    rigId: number,
    name: string,
    specs: string,
    status?: RigStatus,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    const { data: rig } = await supabaseAdmin
        .from("rigs")
        .select("venue_id")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false, error: "Rig not found." };

    const { data: existing } = await supabaseAdmin
        .from("rigs")
        .select("id")
        .eq("venue_id", rig.venue_id)
        .ilike("name", name)
        .neq("id", rigId)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "A rig with this name already exists in this venue." };
    }

    const updatePayload: { name: string; specs: string; status?: RigStatus } = { name, specs };
    if (status) updatePayload.status = status;

    const { error } = await supabaseAdmin
        .from("rigs")
        .update(updatePayload)
        .eq("id", rigId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteRig(
    rigId: number,
): Promise<{ success: boolean; error?: string }> {
    await requireAdminSession();

    // Delete associated bookings first (in case cascade isn't configured)
    await supabaseAdmin
        .from("bookings")
        .delete()
        .eq("rig_id", rigId);

    const { error } = await supabaseAdmin
        .from("rigs")
        .delete()
        .eq("id", rigId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/* ─── Admin-only venue management ──────────────────────────────── */

export async function addVenue(
    name: string,
    location: string,
    price: number,
    description: string,
    imageUrl?: string,
): Promise<{ success: boolean; error?: string; venueId?: number }> {
    const adminId = await requireAdminSession();

    if (!name.trim()) return { success: false, error: "Venue name is required." };
    if (price <= 0) return { success: false, error: "Price must be greater than 0." };

    const { data: existing } = await supabaseAdmin
        .from("venues")
        .select("id")
        .ilike("name", name.trim())
        .eq("owner_id", adminId)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "You already have a venue with this name." };
    }

    const { data, error } = await supabaseAdmin
        .from("venues")
        .insert({
            name: name.trim(),
            location: location.trim(),
            price,
            description: description.trim(),
            image_url: imageUrl?.trim() || null,
            owner_id: adminId,
        })
        .select("id")
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, venueId: data.id };
}

export async function updateVenue(
    venueId: number,
    name: string,
    location: string,
    price: number,
    description: string,
    imageUrl?: string | null,
): Promise<{ success: boolean; error?: string }> {
    const adminId = await requireAdminSession();

    if (!name.trim()) return { success: false, error: "Venue name is required." };
    if (price <= 0) return { success: false, error: "Price must be greater than 0." };

    // Verify ownership
    const { data: venue } = await supabaseAdmin
        .from("venues")
        .select("owner_id")
        .eq("id", venueId)
        .single();
    if (!venue) return { success: false, error: "Venue not found." };
    if (venue.owner_id !== adminId) return { success: false, error: "You do not own this venue." };

    // Check duplicate name
    const { data: existing } = await supabaseAdmin
        .from("venues")
        .select("id")
        .ilike("name", name.trim())
        .eq("owner_id", adminId)
        .neq("id", venueId)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "You already have a venue with this name." };
    }

    const { error } = await supabaseAdmin
        .from("venues")
        .update({
            name: name.trim(),
            location: location.trim(),
            price,
            description: description.trim(),
            image_url: imageUrl?.trim() || null,
        })
        .eq("id", venueId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function deleteVenue(
    venueId: number,
): Promise<{ success: boolean; error?: string }> {
    const adminId = await requireAdminSession();

    // Verify ownership
    const { data: venue } = await supabaseAdmin
        .from("venues")
        .select("owner_id")
        .eq("id", venueId)
        .single();
    if (!venue) return { success: false, error: "Venue not found." };
    if (venue.owner_id !== adminId) return { success: false, error: "You do not own this venue." };

    // Cascade-delete rigs and their bookings (defensive, mirrors deleteRig pattern)
    const { data: rigRows } = await supabaseAdmin
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId);

    if (rigRows && rigRows.length > 0) {
        const rigIds = rigRows.map((r) => r.id);
        await supabaseAdmin
            .from("bookings")
            .delete()
            .in("rig_id", rigIds);
        await supabaseAdmin
            .from("rigs")
            .delete()
            .eq("venue_id", venueId);
    }

    const { error } = await supabaseAdmin
        .from("venues")
        .delete()
        .eq("id", venueId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/* ─── Customer booking history ─────────────────────────────────────── */

export interface CustomerBooking {
    id: number;
    rig_id: number;
    rig_name: string;
    venue_name: string;
    venue_location: string;
    customer_name: string;
    time_slot: string;
    booking_date: string;
    verification_code: string;
    check_in_token: string | null;
    source: "app" | "walk_in";
}

/**
 * Fetch all bookings for the current customer (by user_id).
 * Groups by verification_code so multi-slot bookings appear together.
 */
export async function getCustomerBookings(userId: string): Promise<CustomerBooking[]> {
    const { data, error } = await supabase
        .from("bookings")
        .select(`
            id,
            rig_id,
            customer_name,
            time_slot,
            booking_date,
            verification_code,
            check_in_token,
            source,
            rigs!inner(name, venue_id, venues!inner(name, location))
        `)
        .eq("user_id", userId)
        .order("booking_date", { ascending: false })
        .order("time_slot");

    if (error || !data) {
        // Fallback: if the join fails (e.g. user_id column not yet added),
        // return empty instead of crashing
        console.warn("getCustomerBookings failed:", error?.message);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
        id: row.id,
        rig_id: row.rig_id,
        rig_name: row.rigs?.name ?? `Rig ${row.rig_id}`,
        venue_name: row.rigs?.venues?.name ?? "Unknown Venue",
        venue_location: row.rigs?.venues?.location ?? "",
        customer_name: row.customer_name,
        time_slot: row.time_slot,
        booking_date: row.booking_date,
        verification_code: row.verification_code,
        check_in_token: row.check_in_token ?? null,
        source: row.source,
    }));
}

/**
 * Cancel a customer's booking by verification code.
 * Deletes all booking rows matching the code for the given user.
 * Only allows cancellation of future app bookings.
 */
export async function cancelBooking(
    verificationCode: string,
    userId: string,
): Promise<{ success: boolean; error?: string }> {
    const today = getTodayStr();

    // First verify the booking belongs to this user and is cancellable
    const { data: rows } = await supabase
        .from("bookings")
        .select("id, booking_date, source")
        .eq("verification_code", verificationCode)
        .eq("user_id", userId);

    if (!rows || rows.length === 0) {
        return { success: false, error: "Booking not found." };
    }

    const firstRow = rows[0];
    if (firstRow.source !== "app") {
        return { success: false, error: "Walk-in bookings cannot be cancelled online." };
    }
    if (firstRow.booking_date < today) {
        return { success: false, error: "Cannot cancel past bookings." };
    }

    const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("verification_code", verificationCode)
        .eq("user_id", userId);

    if (error) {
        return { success: false, error: "Failed to cancel booking." };
    }
    return { success: true };
}

/**
 * Modify a customer's booking — change date and/or time slots.
 * Atomically deletes old rows and inserts new ones with the same verification code.
 */
export async function modifyBooking(
    verificationCode: string,
    userId: string,
    newDate: string,
    newSlots: string[],
): Promise<{ success: boolean; error?: string }> {
    const today = getTodayStr();

    if (newSlots.length === 0) {
        return { success: false, error: "No time slots selected." };
    }
    if (newDate < today) {
        return { success: false, error: "Cannot book for a past date." };
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    if (newDate > toDateStr(maxDate)) {
        return { success: false, error: "Cannot book more than 7 days in advance." };
    }

    for (const slot of newSlots) {
        if (!TIME_SLOTS.includes(slot)) {
            return { success: false, error: "Invalid time slot selected." };
        }
    }

    // Validate time slots are not past the buffer cutoff (for today)
    for (const slot of newSlots) {
        if (isSlotPast(slot, newDate)) {
            return { success: false, error: "Cannot book a time slot that has already passed." };
        }
    }

    // Fetch existing booking rows
    const { data: existing } = await supabase
        .from("bookings")
        .select("id, rig_id, customer_name, booking_date, source, user_id")
        .eq("verification_code", verificationCode)
        .eq("user_id", userId);

    if (!existing || existing.length === 0) {
        return { success: false, error: "Booking not found." };
    }

    if (existing[0].source !== "app") {
        return { success: false, error: "Walk-in bookings cannot be modified online." };
    }
    if (existing[0].booking_date < today) {
        return { success: false, error: "Cannot modify past bookings." };
    }

    // Get the unique rig IDs from the existing booking
    const rigIds = [...new Set(existing.map((r) => r.rig_id))];
    const customerName = existing[0].customer_name;

    // Check for conflicts on the new date/slots (excluding current booking)
    // This is a fast-path optimization; the RPC handles conflicts atomically.
    const { data: conflicts } = await supabase
        .from("bookings")
        .select("rig_id, time_slot")
        .eq("booking_date", newDate)
        .in("rig_id", rigIds)
        .in("time_slot", newSlots)
        .neq("verification_code", verificationCode);

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Some slots are already booked. Please try different slots." };
    }

    // Atomic modify via RPC (delete + insert in a single transaction)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("modify_booking", {
        p_verification_code: verificationCode,
        p_user_id: userId,
        p_new_date: newDate,
        p_new_slots: newSlots,
        p_rig_ids: rigIds,
        p_customer_name: customerName,
    });

    if (rpcError) {
        return { success: false, error: "Failed to modify booking." };
    }

    const rpcData = rpcResult as { success: boolean; error?: string };
    if (!rpcData.success) {
        return { success: false, error: rpcData.error ?? "Failed to modify booking." };
    }

    return { success: true };
}

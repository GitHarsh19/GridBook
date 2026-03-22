"use server";

import { createServerSupabaseAdmin } from "@/lib/supabase-server";
import { getTodayStr } from "@/lib/utils";
import { TIME_SLOTS } from "@/lib/data";

/**
 * Verify the current admin session. Returns the admin user ID.
 */
async function requireAdmin(): Promise<{ supabase: Awaited<ReturnType<typeof createServerSupabaseAdmin>>; adminId: string }> {
    const supabase = await createServerSupabaseAdmin();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized: admin session required.");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        throw new Error("Forbidden: user is not an admin.");
    }

    return { supabase, adminId: session.user.id };
}

/* ─── Walk-In Management ───────────────────────────────────────────── */

export async function blockRigForWalkInAction(
    rigId: number,
    slots: string[],
    bookingDate: string,
    customerName?: string,
): Promise<{ success: boolean; error?: string }> {
    const { supabase } = await requireAdmin();

    if (slots.length === 0) return { success: false, error: "No time slots selected." };

    for (const slot of slots) {
        if (!TIME_SLOTS.includes(slot)) return { success: false, error: "Invalid time slot." };
    }

    const { data: rig } = await supabase
        .from("rigs")
        .select("status")
        .eq("id", rigId)
        .single();
    if (!rig) return { success: false, error: "Rig not found." };
    if (rig.status === "out_of_order") return { success: false, error: "Rig is out of order." };

    const { data: conflicts } = await supabase
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

    const rows = slots.map((slot) => ({
        rig_id: rigId,
        customer_name: name,
        time_slot: slot,
        booking_date: bookingDate,
        verification_code: code,
        source: "walk_in" as const,
        blocked_until: blockedUntil,
    }));

    const { error: insertError } = await supabase.from("bookings").insert(rows);
    if (insertError) return { success: false, error: "Failed to create booking records." };

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
            await supabase
                .from("rigs")
                .update({ status: "blocked" })
                .eq("id", rigId)
                .eq("status", "available");
        }
    }

    return { success: true };
}

export async function releaseRigAction(
    rigId: number,
): Promise<{ success: boolean }> {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
        .from("rigs")
        .update({ status: "available" })
        .eq("id", rigId)
        .eq("status", "blocked");
    if (error) return { success: false };

    await supabase
        .from("bookings")
        .delete()
        .eq("rig_id", rigId)
        .eq("source", "walk_in");

    return { success: true };
}

export async function toggleOutOfOrderAction(
    rigId: number,
): Promise<{ success: boolean }> {
    const { supabase } = await requireAdmin();

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

/* ─── Rig Management ───────────────────────────────────────────────── */

export async function addRigAction(
    venueId: number,
    name: string,
    specs: string,
    status: "available" | "out_of_order",
): Promise<{ success: boolean; error?: string }> {
    const { supabase } = await requireAdmin();

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

export async function updateRigAction(
    rigId: number,
    name: string,
    specs: string,
): Promise<{ success: boolean; error?: string }> {
    const { supabase } = await requireAdmin();

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

export async function deleteRigAction(
    rigId: number,
): Promise<{ success: boolean; error?: string }> {
    const { supabase } = await requireAdmin();

    await supabase.from("bookings").delete().eq("rig_id", rigId);
    const { error } = await supabase.from("rigs").delete().eq("id", rigId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

/* ─── Venue Management ─────────────────────────────────────────────── */

export async function addVenueAction(
    name: string,
    location: string,
    price: number,
    description: string,
    imageUrl?: string,
): Promise<{ success: boolean; error?: string; venueId?: number }> {
    const { supabase, adminId } = await requireAdmin();

    if (!name.trim()) return { success: false, error: "Venue name is required." };
    if (price <= 0) return { success: false, error: "Price must be greater than 0." };

    const { data: existing } = await supabase
        .from("venues")
        .select("id")
        .ilike("name", name.trim())
        .eq("owner_id", adminId)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "You already have a venue with this name." };
    }

    const { data, error } = await supabase
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

export async function updateVenueAction(
    venueId: number,
    name: string,
    location: string,
    price: number,
    description: string,
    imageUrl?: string | null,
): Promise<{ success: boolean; error?: string }> {
    const { supabase, adminId } = await requireAdmin();

    if (!name.trim()) return { success: false, error: "Venue name is required." };
    if (price <= 0) return { success: false, error: "Price must be greater than 0." };

    const { data: venue } = await supabase
        .from("venues")
        .select("owner_id")
        .eq("id", venueId)
        .single();
    if (!venue) return { success: false, error: "Venue not found." };
    if (venue.owner_id !== adminId) return { success: false, error: "You do not own this venue." };

    const { data: existing } = await supabase
        .from("venues")
        .select("id")
        .ilike("name", name.trim())
        .eq("owner_id", adminId)
        .neq("id", venueId)
        .limit(1);
    if (existing && existing.length > 0) {
        return { success: false, error: "You already have a venue with this name." };
    }

    const { error } = await supabase
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

export async function deleteVenueAction(
    venueId: number,
): Promise<{ success: boolean; error?: string }> {
    const { supabase, adminId } = await requireAdmin();

    const { data: venue } = await supabase
        .from("venues")
        .select("owner_id")
        .eq("id", venueId)
        .single();
    if (!venue) return { success: false, error: "Venue not found." };
    if (venue.owner_id !== adminId) return { success: false, error: "You do not own this venue." };

    // Cascade-delete rigs and their bookings (defensive, mirrors deleteRigAction pattern)
    const { data: rigRows } = await supabase
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId);

    if (rigRows && rigRows.length > 0) {
        const rigIds = rigRows.map((r) => r.id);
        await supabase
            .from("bookings")
            .delete()
            .in("rig_id", rigIds);
        await supabase
            .from("rigs")
            .delete()
            .eq("venue_id", venueId);
    }

    const { error } = await supabase
        .from("venues")
        .delete()
        .eq("id", venueId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

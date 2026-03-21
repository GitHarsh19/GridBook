"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { getTodayStr, toDateStr } from "@/lib/utils";
import { TIME_SLOTS } from "@/lib/data";

/**
 * Server Action: Create an app booking.
 * Gets user from server-side session — no need to pass userId from client.
 */
export async function createAppBookingAction(
    venueId: number,
    rigIds: number[],
    slots: string[],
    bookingDate: string,
): Promise<{ success: boolean; error?: string; verificationCode?: string }> {
    if (rigIds.length === 0 || slots.length === 0) {
        return { success: false, error: "No rigs or slots selected." };
    }

    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return { success: false, error: "Please sign in to book." };
    }

    const userId = session.user.id;

    // Get customer name from profile
    let customerName = "Online User";
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();
    if (profile?.full_name) {
        customerName = profile.full_name;
    }

    const now = new Date();
    const today = getTodayStr();

    // Validate booking date
    if (bookingDate < today) {
        return { success: false, error: "Cannot book for a past date." };
    }

    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 7);
    if (bookingDate > toDateStr(maxDate)) {
        return { success: false, error: "Cannot book more than 7 days in advance." };
    }

    // Validate time slots are not in the past (for today)
    if (bookingDate === today) {
        const currentHour = now.getHours();
        for (const slot of slots) {
            const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
            if (!match) return { success: false, error: "Invalid time slot format." };
            let slotHour = parseInt(match[1], 10);
            const period = match[2].toUpperCase();
            if (period === "PM" && slotHour !== 12) slotHour += 12;
            if (period === "AM" && slotHour === 12) slotHour = 0;
            if (slotHour <= currentHour) {
                return { success: false, error: "Cannot book a time slot that has already passed." };
            }
        }
    }

    // Validate slots
    for (const slot of slots) {
        if (!TIME_SLOTS.includes(slot)) {
            return { success: false, error: "Invalid time slot selected." };
        }
    }

    // Validate rigs belong to venue
    const { data: venueRigs } = await supabase
        .from("rigs")
        .select("id")
        .eq("venue_id", venueId);
    if (!venueRigs) return { success: false, error: "Failed to verify rigs." };
    const venueRigIds = new Set(venueRigs.map((r) => r.id));
    for (const rigId of rigIds) {
        if (!venueRigIds.has(rigId)) {
            return { success: false, error: "Selected rig does not belong to this venue." };
        }
    }

    // Check conflicts
    const { data: conflicts } = await supabase
        .from("bookings")
        .select("rig_id, time_slot")
        .eq("booking_date", bookingDate)
        .in("rig_id", rigIds)
        .in("time_slot", slots);

    if (conflicts && conflicts.length > 0) {
        return { success: false, error: "Some slots were just booked. Please refresh and try again." };
    }

    // Check rig status
    const { data: rigRows } = await supabase
        .from("rigs")
        .select("id, status")
        .in("id", rigIds);
    if (!rigRows) return { success: false, error: "Failed to verify rig availability." };
    const unavailable = rigRows.filter((r) => r.status !== "available");
    if (unavailable.length > 0) {
        return { success: false, error: "Some rigs are no longer available. Please refresh and try again." };
    }

    const code = `APP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const rows = rigIds.flatMap((rigId) =>
        slots.map((slot) => ({
            rig_id: rigId,
            customer_name: customerName,
            time_slot: slot,
            booking_date: bookingDate,
            verification_code: code,
            source: "app" as const,
            user_id: userId,
        })),
    );

    const { error: insertError } = await supabase.from("bookings").insert(rows);
    if (insertError) {
        return { success: false, error: "Booking failed. Please try again." };
    }

    return { success: true, verificationCode: code };
}

/**
 * Server Action: Cancel a customer booking.
 */
export async function cancelBookingAction(
    verificationCode: string,
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return { success: false, error: "Please sign in." };
    }

    const today = getTodayStr();
    const userId = session.user.id;

    const { data: rows } = await supabase
        .from("bookings")
        .select("id, booking_date, source")
        .eq("verification_code", verificationCode)
        .eq("user_id", userId);

    if (!rows || rows.length === 0) {
        return { success: false, error: "Booking not found." };
    }

    if (rows[0].source !== "app") {
        return { success: false, error: "Walk-in bookings cannot be cancelled online." };
    }
    if (rows[0].booking_date < today) {
        return { success: false, error: "Cannot cancel past bookings." };
    }

    const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("verification_code", verificationCode)
        .eq("user_id", userId);

    if (error) return { success: false, error: "Failed to cancel booking." };
    return { success: true };
}

/**
 * Server Action: Get customer's bookings.
 */
export async function getCustomerBookingsAction() {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
        .from("bookings")
        .select(`
            id,
            rig_id,
            customer_name,
            time_slot,
            booking_date,
            verification_code,
            source,
            rigs!inner(name, venue_id, venues!inner(name, location))
        `)
        .eq("user_id", session.user.id)
        .order("booking_date", { ascending: false })
        .order("time_slot");

    if (error || !data) return [];

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
        source: row.source,
    }));
}

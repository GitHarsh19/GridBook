/**
 * Shared date/time formatting utilities for GridBook.
 * Centralizes helpers previously duplicated across components.
 */

/* ─── Date helpers ─────────────────────────────────────────────────── */

/** Today as YYYY-MM-DD in local time. */
export function getTodayStr(): string {
    const now = new Date();
    return toDateStr(now);
}

/** Format any Date to YYYY-MM-DD. */
export function toDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Returns the next `count` days starting from today as YYYY-MM-DD strings. */
export function getUpcomingDates(count: number): string[] {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        dates.push(toDateStr(d));
    }
    return dates;
}

/* ─── Time-slot helpers ────────────────────────────────────────────── */

/**
 * Parse the start hour from a time slot string like "2:00 PM – 3:00 PM".
 * Returns the hour in 24h format (0–23), or -1 on parse failure.
 */
export function parseSlotStartHour(slot: string): number {
    const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
    if (!match) return -1;
    let hour = parseInt(match[1], 10);
    const period = match[2].toUpperCase();
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour;
}

/**
 * Parse the end hour from a time slot string like "2:00 PM – 3:00 PM".
 * Handles en-dash, hyphen, and em-dash separators.
 * Returns the hour in 24h format (0–23), or -1 on parse failure.
 */
export function parseSlotEndHour(slot: string): number {
    const match = slot.match(/[–\-—]\s*(\d{1,2}):00\s*(AM|PM)/i);
    if (match) {
        let hour = parseInt(match[1], 10);
        const period = match[2].toUpperCase();
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
        return hour;
    }
    // Fallback: all slots are 1-hour, so end = start + 1
    const startHour = parseSlotStartHour(slot);
    if (startHour >= 0) return startHour + 1;
    return -1;
}

/**
 * Whether a slot is past the booking cutoff for today.
 * A slot is considered past once we are more than BUFFER_MINUTES into it.
 * For non-today dates the slot is never past.
 * @param slot       Time-slot string like "2:00 PM – 3:00 PM"
 * @param dateStr    The date being viewed (YYYY-MM-DD)
 * @param now        Current Date (defaults to new Date())
 */
const SLOT_BUFFER_MINUTES = 5;

export function isSlotPast(slot: string, dateStr: string, now: Date = new Date()): boolean {
    if (dateStr !== getTodayStr()) return false;
    const startHour = parseSlotStartHour(slot);
    if (startHour < 0) return false;
    const cutoff = startHour * 60 + SLOT_BUFFER_MINUTES; // e.g. 17:05 for 5 PM slot
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= cutoff;
}

/** Compact time label: "2:00 PM – 3:00 PM" → "2pm" */
export function shortSlotLabel(slot: string): string {
    const match = slot.match(/^(\d{1,2}):00\s*(AM|PM)/i);
    if (!match) return slot;
    return `${match[1]}${match[2].toLowerCase()}`;
}

/** Format hour (24h) as "2:00 PM". */
export function fmtHour(hour: number): string {
    const h = ((hour % 24) + 24) % 24;
    const period = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:00 ${period}`;
}

/* ─── Display formatters ───────────────────────────────────────────── */

/** Label for the DateSelector: "Today", "Tomorrow", or weekday abbreviation + date. */
export function formatDateLabel(dateStr: string, index: number): { day: string; date: string } {
    const d = new Date(dateStr + "T00:00:00");
    if (index === 0) return { day: "Today", date: String(d.getDate()) };
    if (index === 1) return { day: "Tomorrow", date: String(d.getDate()) };
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dateNum = String(d.getDate());
    return { day: dayName, date: dateNum };
}

/** Month + year string, e.g. "Mar 2026". */
export function formatMonthYear(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** Booking-friendly date: "Today", "Tomorrow", or "Mon, 5 Mar". */
export function formatBookingDate(dateStr: string): string {
    const today = getTodayStr();
    if (dateStr === today) return "Today";
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (dateStr === toDateStr(tomorrow)) return "Tomorrow";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

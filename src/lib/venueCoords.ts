import type { Venue } from "@/lib/data";

/* ── Fallback coordinates for known Bengaluru areas ── */
const LOCATION_FALLBACKS: Record<string, [number, number]> = {
    "hsr layout": [12.9116, 77.6474],
    "hsr": [12.9116, 77.6474],
    "koramangala": [12.9352, 77.6245],
    "indiranagar": [12.9716, 77.6412],
    "whitefield": [12.9698, 77.7500],
    "jayanagar": [12.9250, 77.5938],
    "jp nagar": [12.9063, 77.5857],
    "marathahalli": [12.9591, 77.6974],
    "electronic city": [12.8399, 77.6770],
    "mg road": [12.9756, 77.6068],
    "btm layout": [12.9166, 77.6101],
    "hebbal": [13.0358, 77.5970],
    "yelahanka": [13.1007, 77.5963],
    "banashankari": [12.9255, 77.5468],
    "rajajinagar": [12.9900, 77.5525],
    "malleswaram": [13.0035, 77.5649],
    "bengaluru": [12.9716, 77.5946],
    "bangalore": [12.9716, 77.5946],
};

export function resolveCoords(venue: Venue): [number, number] | null {
    if (venue.latitude != null && venue.longitude != null) {
        return [venue.latitude, venue.longitude];
    }
    const loc = venue.location.toLowerCase().trim();
    if (LOCATION_FALLBACKS[loc]) return LOCATION_FALLBACKS[loc];
    for (const [key, coords] of Object.entries(LOCATION_FALLBACKS)) {
        if (loc.includes(key) || key.includes(loc)) return coords;
    }
    return null;
}

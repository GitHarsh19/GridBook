"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue } from "@/lib/data";
import { useAuth } from "@/lib/auth";

/* ── Bengaluru center fallback ── */
const DEFAULT_CENTER: L.LatLngTuple = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

/* ── Custom marker SVGs ── */
function markerSvg(available: boolean): string {
    const fill = available ? "#22c55e" : "#ef4444";
    const glow = available ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.25)";
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <filter id="g"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${glow}" flood-opacity="1"/></filter>
      <path filter="url(#g)" d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 28 18 28s18-15.4 18-28C36 8.06 27.94 0 18 0z" fill="#1f1f1f" stroke="${fill}" stroke-width="2"/>
      <circle cx="18" cy="17" r="7" fill="${fill}"/>
    </svg>`;
}

function userLocationSvg(): string {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.5)" stroke-width="1"/>
      <circle cx="12" cy="12" r="5" fill="#3b82f6"/>
    </svg>`;
}

function createIcon(available: boolean): L.DivIcon {
    return L.divIcon({
        html: markerSvg(available),
        className: "venue-marker",
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -42],
    });
}

const userIcon = L.divIcon({
    html: userLocationSvg(),
    className: "user-location-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

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

function resolveCoords(venue: Venue): [number, number] | null {
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

interface VenueMapProps {
    venues: Venue[];
}

export function VenueMap({ venues }: VenueMapProps) {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const [locating, setLocating] = useState(false);

    /* ── Initialize map ── */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false,
            attributionControl: false,
        });

        // Dark CartoDB tiles
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 19,
                subdomains: "abcd",
            }
        ).addTo(map);

        // Zoom control bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Attribution bottom-left
        L.control
            .attribution({ position: "bottomleft" })
            .addAttribution(
                '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            )
            .addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    /* ── Update markers when venues change ── */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const bounds: L.LatLngTuple[] = [];

        venues.forEach((venue) => {
            const coords = resolveCoords(venue);
            if (!coords) return;

            const [lat, lng] = coords;
            const hasAvailable = venue.availableRigs > 0;

            const marker = L.marker([lat, lng], {
                icon: createIcon(hasAvailable),
            }).addTo(map);

            bounds.push([lat, lng]);

            const popupContent = `
                <div class="venue-popup">
                    <h3 class="venue-popup-name">${venue.name}</h3>
                    <p class="venue-popup-location">${venue.location}</p>
                    <div class="venue-popup-stats">
                        <span class="venue-popup-rigs ${hasAvailable ? "available" : "full"}">
                            <span class="venue-popup-dot"></span>
                            ${hasAvailable ? `${venue.availableRigs} Available` : "Fully Booked"}
                        </span>
                        <span class="venue-popup-price">₹${venue.price}/hr</span>
                    </div>
                    <button class="venue-popup-btn" data-venue-id="${venue.id}">
                        Book Now →
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent, {
                className: "venue-map-popup",
                maxWidth: 260,
                minWidth: 200,
            });

            markersRef.current.push(marker);
        });

        // Fit bounds if we have venues
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [venues]);

    /* ── Handle popup "Book Now" clicks ── */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const handlePopupClick = (e: Event) => {
            const target = e.target as HTMLElement;
            const btn = target.closest("[data-venue-id]") as HTMLElement | null;
            if (!btn) return;
            const venueId = btn.dataset.venueId;
            if (venueId) {
                if (isLoggedIn) {
                    router.push(`/venue/${venueId}`);
                } else {
                    router.push(
                        `/login?redirect=${encodeURIComponent(`/venue/${venueId}`)}`
                    );
                }
            }
        };

        const container = map.getContainer();
        container.addEventListener("click", handlePopupClick);
        return () => container.removeEventListener("click", handlePopupClick);
    }, [isLoggedIn, router]);

    /* ── Locate user ── */
    const locateUser = useCallback(() => {
        const map = mapRef.current;
        if (!map || !navigator.geolocation) return;

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                map.flyTo([latitude, longitude], 14, { duration: 1.2 });

                if (userMarkerRef.current) {
                    userMarkerRef.current.setLatLng([latitude, longitude]);
                } else {
                    userMarkerRef.current = L.marker([latitude, longitude], {
                        icon: userIcon,
                        zIndexOffset: 1000,
                    })
                        .addTo(map)
                        .bindPopup(
                            '<div class="venue-popup"><p class="venue-popup-location">You are here</p></div>',
                            { className: "venue-map-popup" }
                        );
                }
                setLocating(false);
            },
            () => {
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10">
            <div
                ref={containerRef}
                className="w-full"
                style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
            />

            {/* Locate me button */}
            <button
                onClick={locateUser}
                disabled={locating}
                className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-xl bg-surface-container-high/90 backdrop-blur-sm px-4 py-2.5 font-outfit text-sm font-medium text-white border border-white/10 transition-all duration-200 hover:bg-surface-container-highest hover:border-white/20 active:scale-[0.97] disabled:opacity-50"
                title="Find my location"
            >
                <Crosshair
                    className={`h-4 w-4 ${locating ? "animate-spin" : ""}`}
                />
                {locating ? "Locating…" : "Locate Me"}
            </button>

            {/* No mappable venues */}
            {venues.filter((v) => resolveCoords(v) !== null).length === 0 && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-2xl">
                    <p className="font-outfit text-sm text-on-surface-variant/60">
                        No venues with map location available
                    </p>
                </div>
            )}
        </div>
    );
}

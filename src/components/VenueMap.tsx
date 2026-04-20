"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, AlertCircle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue } from "@/lib/data";
import { useAuth } from "@/lib/auth";

/* ── Bengaluru center fallback ── */
const DEFAULT_CENTER: L.LatLngTuple = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

/* ── GTA-style blip icon builder ── */
function createBlipIcon(color: string, symbol: string): L.DivIcon {
    return L.divIcon({
        html: `
            <div class="gta-blip" style="--blip-color: ${color}">
                <div class="gta-blip-ping"></div>
                <div class="gta-blip-core">
                    <span class="gta-blip-symbol">${symbol}</span>
                </div>
            </div>
        `,
        className: "gta-blip-marker",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
    });
}

const BLIP_AVAILABLE = createBlipIcon("#4ade80", "🎮");
const BLIP_FULL = createBlipIcon("#f87171", "🎮");

/* ── User location blip ── */
function userLocationSvg(): string {
    return `
    <div class="gta-blip" style="--blip-color: #60a5fa">
        <div class="gta-blip-ping"></div>
        <div class="gta-blip-core">
            <span class="gta-blip-symbol" style="font-size: 12px">▲</span>
        </div>
    </div>`;
}

let _userIcon: L.DivIcon | null = null;

function getUserIcon(): L.DivIcon {
    if (!_userIcon) {
        _userIcon = L.divIcon({
            html: userLocationSvg(),
            className: "gta-blip-marker",
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        });
    }
    return _userIcon;
}

/* ── Google Maps direction URL builder ── */
function getDirectionsUrl(lat: number, lng: number, venueName: string): string {
    const destination = `${lat},${lng}`;
    const label = encodeURIComponent(venueName);
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving&dir_action=navigate&query=${label}`;
}

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

/* ── Reverse geocode area name from coordinates ── */
const AREA_NAMES: Record<string, [number, number, number]> = {
    // [lat, lng, radiusKm]
    "INDIRANAGAR": [12.9716, 77.6412, 2],
    "KORAMANGALA": [12.9352, 77.6245, 2],
    "HSR LAYOUT": [12.9116, 77.6474, 2],
    "WHITEFIELD": [12.9698, 77.7500, 3],
    "JAYANAGAR": [12.9250, 77.5938, 2],
    "JP NAGAR": [12.9063, 77.5857, 2],
    "MARATHAHALLI": [12.9591, 77.6974, 2],
    "ELECTRONIC CITY": [12.8399, 77.6770, 3],
    "MG ROAD": [12.9756, 77.6068, 1.5],
    "BTM LAYOUT": [12.9166, 77.6101, 2],
    "HEBBAL": [13.0358, 77.5970, 2],
    "MALLESWARAM": [13.0035, 77.5649, 2],
    "RAJAJINAGAR": [12.9900, 77.5525, 2],
    "BANASHANKARI": [12.9255, 77.5468, 2],
    "BENGALURU": [12.9716, 77.5946, 20],
};

function getAreaName(lat: number, lng: number): string {
    let closest = "BENGALURU";
    let closestDist = Infinity;
    for (const [name, [aLat, aLng, radius]] of Object.entries(AREA_NAMES)) {
        if (name === "BENGALURU") continue;
        const dist = Math.sqrt((lat - aLat) ** 2 + (lng - aLng) ** 2) * 111;
        if (dist < radius && dist < closestDist) {
            closest = name;
            closestDist = dist;
        }
    }
    return closest;
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
    const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
    const userMarkerRef = useRef<L.Marker | null>(null);
    const userAccuracyRef = useRef<L.Circle | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [areaName, setAreaName] = useState("BENGALURU");
    const [showLegend, setShowLegend] = useState(true);

    /* ── Initialize map ── */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false,
            attributionControl: false,
            zoomAnimation: true,
            markerZoomAnimation: true,
        });

        /* GTA-style dark tiles (CartoDB Dark Matter — no API key needed) */
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 19,
                subdomains: "abcd",
                updateWhenZooming: false,
                updateWhenIdle: true,
                keepBuffer: 4,
            }
        ).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        /* Track area name on move */
        const updateArea = () => {
            const c = map.getCenter();
            setAreaName(getAreaName(c.lat, c.lng));
        };
        map.on("moveend", updateArea);
        updateArea();

        mapRef.current = map;

        return () => {
            map.off("moveend", updateArea);
            map.remove();
            mapRef.current = null;
        };
    }, []);

    /* ── Update markers when venues change ── */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        markerMapRef.current.clear();

        const bounds: L.LatLngTuple[] = [];

        venues.forEach((venue) => {
            const coords = resolveCoords(venue);
            if (!coords) return;

            const [lat, lng] = coords;
            const hasAvailable = venue.availableRigs > 0;
            const directionsUrl = getDirectionsUrl(lat, lng, venue.name);

            const marker = L.marker([lat, lng], {
                icon: hasAvailable ? BLIP_AVAILABLE : BLIP_FULL,
            }).addTo(map);

            bounds.push([lat, lng]);

            const popupContent = `
                <div class="gta-popup">
                    <div class="gta-popup-header">
                        <div class="gta-popup-icon">🎮</div>
                        <div>
                            <h3 class="gta-popup-name">${venue.name}</h3>
                            <p class="gta-popup-location">${venue.location}</p>
                        </div>
                    </div>
                    <div class="gta-popup-divider"></div>
                    <div class="gta-popup-stats">
                        <span class="gta-popup-rigs ${hasAvailable ? "available" : "full"}">
                            <span class="gta-popup-dot"></span>
                            ${hasAvailable ? `${venue.availableRigs} Rigs Open` : "Fully Booked"}
                        </span>
                        <span class="gta-popup-price">₹${venue.price}/hr</span>
                    </div>
                    <div class="gta-popup-actions">
                        <button class="gta-popup-btn gta-popup-btn-book" data-venue-id="${venue.id}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            BOOK NOW
                        </button>
                        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="gta-popup-btn gta-popup-btn-dir">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 11l19-9-9 19-2-8z"/>
                            </svg>
                            NAV
                        </a>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                className: "gta-map-popup",
                maxWidth: 280,
                minWidth: 220,
                autoPan: true,
                autoPanPadding: L.point(40, 40),
                closeOnClick: true,
            });

            markersRef.current.push(marker);
            markerMapRef.current.set(String(venue.id), marker);
        });

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
        if (!map) return;

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setTimeout(() => setLocationError(null), 4000);
            return;
        }

        setLocating(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                map.flyTo([latitude, longitude], 15, { duration: 1.5 });

                // Accuracy circle — GTA style faint ring
                if (userAccuracyRef.current) {
                    userAccuracyRef.current.setLatLng([latitude, longitude]);
                    userAccuracyRef.current.setRadius(accuracy);
                } else {
                    userAccuracyRef.current = L.circle([latitude, longitude], {
                        radius: Math.min(accuracy, 500),
                        color: "#60a5fa",
                        fillColor: "#60a5fa",
                        fillOpacity: 0.06,
                        weight: 1,
                        opacity: 0.2,
                        dashArray: "4 6",
                    }).addTo(map);
                }

                // User marker
                if (userMarkerRef.current) {
                    userMarkerRef.current.setLatLng([latitude, longitude]);
                } else {
                    userMarkerRef.current = L.marker([latitude, longitude], {
                        icon: getUserIcon(),
                        zIndexOffset: 1000,
                    })
                        .addTo(map)
                        .bindPopup(
                            '<div class="gta-popup"><p class="gta-popup-location" style="margin:0;color:#60a5fa;font-weight:700;text-transform:uppercase;letter-spacing:0.1em">▲ You are here</p></div>',
                            { className: "gta-map-popup" }
                        );
                }
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                let msg = "Unable to get your location";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        msg = "Location access denied. Please enable it in browser settings.";
                        break;
                    case err.POSITION_UNAVAILABLE:
                        msg = "Location unavailable. Try again in a moment.";
                        break;
                    case err.TIMEOUT:
                        msg = "Location request timed out. Please try again.";
                        break;
                }
                setLocationError(msg);
                setTimeout(() => setLocationError(null), 5000);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000,
            }
        );
    }, []);

    /* ── Fly to venue from legend ── */
    const flyToVenue = useCallback((venueId: string) => {
        const map = mapRef.current;
        const marker = markerMapRef.current.get(venueId);
        if (!map || !marker) return;
        const latlng = marker.getLatLng();
        map.flyTo(latlng, 15, { duration: 1 });
        setTimeout(() => marker.openPopup(), 600);
    }, []);

    /* ── Mappable venues for legend ── */
    const mappableVenues = venues.filter((v) => resolveCoords(v) !== null);

    return (
        <div className="gta-map-wrapper">
            {/* Map container — filter applied via CSS to tile images only */}
            <div
                ref={containerRef}
                className="w-full h-full"
            />

            {/* Vignette overlay — dark edges like GTA */}
            <div className="gta-vignette" />

            {/* Scanlines subtle effect */}
            <div className="gta-scanlines" />

            {/* GTA-style area name — bottom left */}
            <div className="gta-area-label">
                <span className="gta-area-name">{areaName}</span>
            </div>

            {/* GTA-style legend panel — right side */}
            {showLegend && mappableVenues.length > 0 && (
                <div className="gta-legend">
                    <button
                        className="gta-legend-close"
                        onClick={() => setShowLegend(false)}
                        title="Hide legend"
                    >
                        ✕
                    </button>
                    {mappableVenues.map((v) => (
                        <div
                            key={v.id}
                            className="gta-legend-item"
                            onClick={() => flyToVenue(String(v.id))}
                            role="button"
                            tabIndex={0}
                            title={`Fly to ${v.name}`}
                        >
                            <span className="gta-legend-text">{v.name}</span>
                            <span className={`gta-legend-blip ${v.availableRigs > 0 ? "available" : "full"}`}>
                                🎮
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Show legend button when hidden */}
            {!showLegend && (
                <button
                    className="gta-legend-toggle"
                    onClick={() => setShowLegend(true)}
                    title="Show legend"
                >
                    ☰
                </button>
            )}

            {/* Locate me — GTA HUD style */}
            <button
                onClick={locateUser}
                disabled={locating}
                className="gta-locate-btn"
                title="Find my location"
            >
                <Crosshair
                    className={`h-4 w-4 ${locating ? "animate-spin" : ""}`}
                />
                {locating ? "LOCATING…" : "LOCATE ME"}
            </button>

            {/* Location error toast */}
            {locationError && (
                <div className="gta-error-toast">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {locationError}
                </div>
            )}

            {/* No mappable venues */}
            {mappableVenues.length === 0 && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <p className="font-outfit text-sm text-white/60 uppercase tracking-widest">
                        No venues with map location available
                    </p>
                </div>
            )}
        </div>
    );
}

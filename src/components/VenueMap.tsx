"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, AlertCircle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { resolveCoords } from "@/lib/venueCoords";

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

interface VenueMapProps {
    venues: Venue[];
    /** Called once when the flyToVenue function is ready, so the parent can trigger it */
    onFlyToReady?: (flyTo: (venueId: string) => void) => void;
}

export function VenueMap({ venues, onFlyToReady }: VenueMapProps) {
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

        /* GTA-style dark tiles — try multiple providers for reliability */
        const tileLayer = L.tileLayer(
            "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 19,
                updateWhenZooming: false,
                updateWhenIdle: true,
                keepBuffer: 4,
            }
        ).addTo(map);

        tileLayer.on("tileerror", () => {
            tileLayer.setUrl(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            );
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

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

    /* ── Fly to venue (exposed to parent) ── */
    const flyToVenue = useCallback((venueId: string) => {
        const map = mapRef.current;
        const marker = markerMapRef.current.get(venueId);
        if (!map || !marker) return;
        const latlng = marker.getLatLng();
        map.flyTo(latlng, 15, { duration: 1 });
        setTimeout(() => marker.openPopup(), 600);
    }, []);

    /* ── Expose flyToVenue to parent via callback ── */
    useEffect(() => {
        if (onFlyToReady) {
            onFlyToReady(flyToVenue);
        }
    }, [flyToVenue, onFlyToReady]);

    /* ── Mappable venues for empty state ── */
    const mappableVenues = venues.filter((v) => resolveCoords(v) !== null);

    return (
        <div className="gta-map-wrapper">
            {/* Map container */}
            <div
                ref={containerRef}
                className="w-full h-full"
            />

            {/* Edge fade overlay — map dissolves into page background */}
            <div className="gta-map-fade" />

            {/* Vignette overlay — tuned to page bg */}
            <div className="gta-vignette" />

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

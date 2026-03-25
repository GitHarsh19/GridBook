"use client";

import { useRouter } from "next/navigation";
import { MapPin, Monitor } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Venue } from "@/lib/data";

export function VenueCard({ venue }: { venue: Venue }) {
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    const handleClick = () => {
        if (isLoggedIn) {
            router.push(`/venue/${venue.id}`);
        } else {
            router.push(`/login?redirect=${encodeURIComponent(`/venue/${venue.id}`)}`);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="group block w-full cursor-pointer rounded-2xl bg-surface-container text-left font-outfit transition-all duration-300 hover:bg-surface-container-high hover:-translate-y-1 active:scale-[0.99] focus:outline-none"
        >
            {/* Venue image */}
            <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low">
                {venue.imageUrl ? (
                    <img
                        src={venue.imageUrl}
                        alt={venue.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <Monitor className="h-12 w-12 text-surface-container-highest transition-colors group-hover:text-on-surface-variant/20" />
                )}

                {/* Gradient overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.04) 100%)",
                    }}
                />

                {/* Price badge — glassmorphic, top-right */}
                <div
                    className="absolute top-3 right-3 rounded-xl px-3 py-1 text-sm font-bold text-primary"
                    style={{
                        background: "rgba(19,19,19,0.72)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                    }}
                >
                    ₹{venue.price}
                    <span className="text-xs font-normal text-on-surface-variant/60">/hr</span>
                </div>

                {/* Availability badge — bottom-left */}
                <div className="absolute bottom-3 left-3">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            venue.availableRigs > 0
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                        }`}
                        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
                    >
                        <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                                venue.availableRigs > 0
                                    ? "bg-emerald-400 animate-pulse"
                                    : "bg-red-400"
                            }`}
                        />
                        {venue.availableRigs > 0
                            ? `${venue.availableRigs} Available`
                            : "Fully Booked"}
                    </span>
                </div>
            </div>

            {/* Card content */}
            <div className="px-5 py-4">
                <h3 className="text-base font-bold tracking-tight text-on-surface transition-colors duration-200 group-hover:text-primary">
                    {venue.name}
                </h3>

                <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-on-surface-variant/70">
                        <MapPin className="h-3 w-3 text-btn-red" />
                        {venue.location}
                    </div>
                    <span className="text-xs text-on-surface-variant/40">
                        {venue.totalRigs} rigs
                    </span>
                </div>
            </div>
        </button>
    );
}

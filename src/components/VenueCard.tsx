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
            className="group block w-full cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        >
            {/* Image placeholder */}
            <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-t-lg bg-zinc-800/60">
                <Monitor className="h-10 w-10 text-zinc-600 transition-colors duration-200 group-hover:text-zinc-500" />
                {/* Price badge */}
                <div className="absolute bottom-2 right-2 rounded-md bg-zinc-950/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    ₹{venue.price}<span className="text-zinc-400">/hr</span>
                </div>
            </div>

            <div className="p-4">
                {/* Venue name */}
                <h3 className="text-base font-semibold text-white transition-colors duration-200 group-hover:text-cyan-400">
                    {venue.name}
                </h3>

                {/* Location */}
                <div className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    {venue.location}
                </div>

                {/* Availability + rig count */}
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                        {venue.totalRigs} total rigs
                    </span>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            venue.availableRigs > 0
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                        }`}
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
        </button>
    );
}

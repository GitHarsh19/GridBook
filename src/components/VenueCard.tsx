import Link from "next/link";
import { MapPin, Monitor } from "lucide-react";
import type { Venue } from "@/lib/data";

export function VenueCard({ venue }: { venue: Venue }) {
    return (
        <Link
            href={`/venue/${venue.id}`}
            className="group block w-full rounded-lg border border-zinc-800 bg-zinc-900 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        >
            {/* Image placeholder */}
            <div className="flex h-36 items-center justify-center rounded-t-lg bg-zinc-800/60">
                <Monitor className="h-10 w-10 text-zinc-600" />
            </div>

            <div className="p-4">
                {/* Venue name */}
                <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {venue.name}
                </h3>

                {/* Location */}
                <div className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
                    <MapPin className="h-3 w-3" />
                    {venue.location}
                </div>

                {/* Price + availability */}
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                        ₹{venue.price}
                        <span className="text-zinc-500">/hr</span>
                    </span>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${venue.availableRigs > 0
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                    >
                        <span
                            className={`inline-block h-1.5 w-1.5 rounded-full ${venue.availableRigs > 0 ? "bg-emerald-400" : "bg-red-400"
                                }`}
                        />
                        {venue.availableRigs > 0
                            ? `${venue.availableRigs} Rigs Available`
                            : "Fully Booked"}
                    </span>
                </div>
            </div>
        </Link>
    );
}

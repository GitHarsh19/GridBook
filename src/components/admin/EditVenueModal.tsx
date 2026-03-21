"use client";

import { useState } from "react";
import { AlertTriangle, Building2, ImageIcon, X } from "lucide-react";
import type { VenueOption } from "@/lib/data";

export function EditVenueModal({
    venue,
    onSave,
    onDelete,
    onClose,
    loading,
}: {
    venue: VenueOption;
    onSave: (name: string, location: string, price: number, description: string, imageUrl: string) => void;
    onDelete: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState(venue.name);
    const [location, setLocation] = useState(venue.location);
    const [price, setPrice] = useState(String(venue.price));
    const [description, setDescription] = useState(venue.description);
    const [imageUrl, setImageUrl] = useState(venue.imageUrl ?? "");
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    if (confirmingDelete) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-bold text-white">Delete Venue</h3>
                    </div>
                    <p className="mb-2 text-sm text-zinc-400">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-white">{venue.name}</span>?
                    </p>
                    <p className="mb-6 text-xs text-red-400/80">
                        This will permanently delete all rigs and bookings associated with this venue.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmingDelete(false)}
                            className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-md border border-red-800 bg-red-900/50 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900 disabled:opacity-50"
                        >
                            {loading ? "Deleting\u2026" : "Yes, Delete"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                        <Building2 className="h-5 w-5 text-cyan-500" />
                        Edit Venue
                    </h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {venue.imageUrl && (
                    <div className="mb-4 overflow-hidden rounded-md">
                        <img
                            src={venue.imageUrl}
                            alt={venue.name}
                            className="h-32 w-full object-cover"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Venue Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Price per hour (₹)
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min={1}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className={inputClass + " resize-none"}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                            <ImageIcon className="h-3 w-3" />
                            Image URL
                            <span className="text-zinc-600">(optional)</span>
                        </label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/venue.jpg"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer rounded-md border border-red-800 bg-red-900/50 px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900"
                    >
                        Delete Venue
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() =>
                                onSave(
                                    name.trim(),
                                    location.trim(),
                                    Number(price) || 0,
                                    description.trim(),
                                    imageUrl.trim(),
                                )
                            }
                            disabled={loading || !name.trim() || !location.trim() || !price}
                            className="cursor-pointer rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                        >
                            {loading ? "Saving\u2026" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

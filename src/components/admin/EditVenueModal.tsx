"use client";

import { useState } from "react";
import { AlertTriangle, Building2, ImageIcon, X } from "lucide-react";
import type { VenueOption } from "@/lib/data";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container";

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

    if (confirmingDelete) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center px-4 font-outfit"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
                onClick={onClose}
            >
                <div
                    className="w-full max-w-sm rounded-2xl bg-surface-container p-6"
                    style={ghostCard}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-btn-red" />
                        <h3 className="text-sm font-bold text-on-surface">Delete Venue</h3>
                    </div>
                    <p className="mb-2 text-sm text-on-surface-variant/60">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-on-surface">{venue.name}</span>?
                    </p>
                    <p className="mb-6 text-xs text-btn-red/70">
                        This will permanently delete all rigs and bookings associated with this venue.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setConfirmingDelete(false)}
                            className="flex-1 cursor-pointer rounded-full border border-on-surface bg-transparent py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={loading}
                            className="flex-1 cursor-pointer rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="fixed inset-0 z-50 flex items-center justify-center px-4 font-outfit"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-surface-container p-6"
                style={ghostCard}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                            <Building2 className="h-4 w-4 text-btn-red" />
                            Edit Venue
                        </h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant/40">{venue.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-xl p-2 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {venue.imageUrl && (
                    <div className="mb-4 overflow-hidden rounded-2xl">
                        <img
                            src={venue.imageUrl}
                            alt={venue.name}
                            className="h-32 w-full object-cover"
                        />
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Venue Name
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Location
                        </p>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Price per hour (₹)
                        </p>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min={1}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Description
                        </p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full rounded-2xl border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container resize-none"
                        />
                    </div>
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            <ImageIcon className="h-3 w-3" />
                            Image URL
                            <span className="text-on-surface-variant/30 normal-case tracking-normal font-normal">(optional)</span>
                        </p>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/venue.jpg"
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-2">
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer rounded-full bg-btn-red/10 px-4 py-2.5 text-sm font-medium text-btn-red transition-all duration-300 hover:bg-btn-red hover:text-white active:scale-[0.98]"
                    >
                        Delete
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-full border border-on-surface bg-transparent px-4 py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
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
                            className="cursor-pointer rounded-full bg-btn-red px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving\u2026" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

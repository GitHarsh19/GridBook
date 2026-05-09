"use client";

import { useState } from "react";
import { Building2, ImageIcon, X } from "lucide-react";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container";

export function AddVenueModal({
    onConfirm,
    onClose,
    loading,
}: {
    onConfirm: (name: string, location: string, price: number, description: string, imageUrl: string) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");

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
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
                            <Building2 className="h-4 w-4 text-btn-red" />
                            Add Venue
                        </h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant/40">Create a new gaming cafe venue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-xl p-2 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Venue Name
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apex Racing Lounge"
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
                            placeholder="e.g. Koramangala, Bengaluru"
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
                            placeholder="e.g. 500"
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
                            placeholder="Short description of your venue"
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

                <div className="mt-6 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-full border border-on-surface bg-transparent py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            onConfirm(
                                name.trim(),
                                location.trim(),
                                Number(price) || 0,
                                description.trim(),
                                imageUrl.trim(),
                            )
                        }
                        disabled={loading || !name.trim() || !location.trim() || !price}
                        className="flex-1 cursor-pointer rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? "Adding\u2026" : "Add Venue"}
                    </button>
                </div>
            </div>
        </div>
    );
}

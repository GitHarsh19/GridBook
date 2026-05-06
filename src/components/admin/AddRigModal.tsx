"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { RigType } from "@/lib/data";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container";

export function AddRigModal({
    onConfirm,
    onClose,
    loading,
}: {
    onConfirm: (name: string, specs: string, status: "available" | "out_of_order", type: RigType) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const [specs, setSpecs] = useState("");
    const [status, setStatus] = useState<"available" | "out_of_order">("available");
    const [rigType, setRigType] = useState<RigType>("pc");

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
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-on-surface">Add Rig</h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant/40">Add a new simulator to this venue</p>
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
                            Rig Name
                        </p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rig 7"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Specs
                        </p>
                        <input
                            type="text"
                            value={specs}
                            onChange={(e) => setSpecs(e.target.value)}
                            placeholder='e.g. Fanatec DD Pro · Triple 27"'
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Status
                        </p>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "available" | "out_of_order")}
                            className="w-full cursor-pointer rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary-container"
                        >
                            <option value="available" className="bg-surface-container">Available</option>
                            <option value="out_of_order" className="bg-surface-container">Out of Order</option>
                        </select>
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Platform
                        </p>
                        <select
                            value={rigType}
                            onChange={(e) => setRigType(e.target.value as RigType)}
                            className="w-full cursor-pointer rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary-container"
                        >
                            <option value="pc" className="bg-surface-container">PC</option>
                            <option value="playstation" className="bg-surface-container">PlayStation</option>
                            <option value="xbox" className="bg-surface-container">Xbox</option>
                            <option value="vr" className="bg-surface-container">VR</option>
                        </select>
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
                        onClick={() => onConfirm(name.trim(), specs.trim(), status, rigType)}
                        disabled={loading || !name.trim()}
                        className="flex-1 cursor-pointer rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? "Adding\u2026" : "Add Rig"}
                    </button>
                </div>
            </div>
        </div>
    );
}

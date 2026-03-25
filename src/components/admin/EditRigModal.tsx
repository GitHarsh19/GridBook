"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { DashboardRig } from "@/lib/data";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container";

export function EditRigModal({
    rig,
    onSave,
    onDelete,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    onSave: (name: string, specs: string) => void;
    onDelete: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState(rig.name);
    const [specs, setSpecs] = useState(rig.specs);
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
                        <h3 className="text-sm font-bold text-on-surface">Delete Rig</h3>
                    </div>
                    <p className="mb-6 text-sm text-on-surface-variant/60">
                        Are you sure? This will remove{" "}
                        <span className="font-semibold text-on-surface">{rig.name}</span>{" "}
                        from the app entirely.
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
                className="w-full max-w-sm rounded-2xl bg-surface-container p-6"
                style={ghostCard}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-on-surface">Edit Rig</h3>
                        <p className="mt-0.5 text-xs text-on-surface-variant/40">{rig.name}</p>
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
                            onClick={() => onSave(name.trim(), specs.trim())}
                            disabled={loading || !name.trim()}
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

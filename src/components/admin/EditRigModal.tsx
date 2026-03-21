"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { DashboardRig } from "@/lib/data";

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
                        <h3 className="text-lg font-bold text-white">Delete Rig</h3>
                    </div>
                    <p className="mb-6 text-sm text-zinc-400">
                        Are you sure? This will remove{" "}
                        <span className="font-medium text-white">{rig.name}</span>{" "}
                        from the app entirely.
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
                className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Edit Rig</h3>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-zinc-500 transition-colors hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Rig Name
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
                            Specs
                        </label>
                        <input
                            type="text"
                            value={specs}
                            onChange={(e) => setSpecs(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => setConfirmingDelete(true)}
                        className="cursor-pointer rounded-md border border-red-800 bg-red-900/50 px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-900"
                    >
                        Delete Rig
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onSave(name.trim(), specs.trim())}
                            disabled={loading || !name.trim()}
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

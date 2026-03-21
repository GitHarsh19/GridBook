"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function AddRigModal({
    onConfirm,
    onClose,
    loading,
}: {
    onConfirm: (name: string, specs: string, status: "available" | "out_of_order") => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState("");
    const [specs, setSpecs] = useState("");
    const [status, setStatus] = useState<"available" | "out_of_order">("available");

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

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
                    <h3 className="text-lg font-bold text-white">Add Rig</h3>
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
                            placeholder="e.g. Rig 7"
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
                            placeholder='e.g. Fanatec DD Pro · Triple 27"'
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as "available" | "out_of_order")}
                            className="w-full cursor-pointer rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                        >
                            <option value="available">Available</option>
                            <option value="out_of_order">Out of Order</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-md border border-zinc-700 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(name.trim(), specs.trim(), status)}
                        disabled={loading || !name.trim()}
                        className="flex-1 cursor-pointer rounded-md bg-cyan-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {loading ? "Adding\u2026" : "Add Rig"}
                    </button>
                </div>
            </div>
        </div>
    );
}

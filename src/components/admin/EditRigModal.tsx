"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import type { DashboardRig, RigStatus, RigType } from "@/lib/data";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none transition-colors focus:border-primary-container";

const STATUS_OPTIONS: { value: RigStatus; label: string; dot: string; active: string; inactive: string }[] = [
    { value: "available", label: "Available", dot: "bg-emerald-400", active: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
    { value: "booked", label: "App Booked", dot: "bg-btn-red", active: "bg-btn-red/10 border-btn-red/40 text-btn-red", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
    { value: "blocked", label: "Walk-In", dot: "bg-amber-400", active: "bg-amber-500/10 border-amber-500/40 text-amber-400", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
    { value: "in_use", label: "In Use", dot: "bg-sky-400", active: "bg-sky-500/10 border-sky-500/40 text-sky-400", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
    { value: "out_of_order", label: "Out of Order", dot: "bg-on-surface-variant/30", active: "bg-surface-container-high border-white/20 text-on-surface-variant/60", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
];

export function EditRigModal({
    rig,
    onSave,
    onDelete,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    onSave: (name: string, specs: string, status?: RigStatus, type?: RigType) => void;
    onDelete: () => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [name, setName] = useState(rig.name);
    const [specs, setSpecs] = useState(rig.specs);
    const [status, setStatus] = useState<RigStatus>(rig.status);
    const [rigType, setRigType] = useState<RigType>(rig.type ?? "pc");
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
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-btn-red">
                            Status
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {STATUS_OPTIONS.map(({ value, label, dot, active, inactive }) => {
                                const isCurrent = status === value;
                                return (
                                    <button
                                        key={value}
                                        onClick={() => setStatus(value)}
                                        className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all duration-150 active:scale-[0.97] ${isCurrent ? active : inactive}`}
                                    >
                                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                                        {label}
                                        {isCurrent && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
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
                            onClick={() => onSave(name.trim(), specs.trim(), status, rigType)}
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

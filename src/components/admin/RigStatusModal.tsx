"use client";

import { useState } from "react";
import {
    X,
    Monitor,
    Clock,
    UserCheck,
    LogOut as LogOutIcon,
    Unlock,
    Trash2,
    Loader2,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import type { DashboardRig, Booking, RigStatus } from "@/lib/data";
import { getTodayStr, parseSlotStartHour } from "@/lib/utils";
import { STATUS_CONFIG } from "./StatusConfig";

const ghostCard = { border: "1px solid rgba(255,255,255,0.08)" };

export interface RigStatusAction {
    type: "check_in" | "end_session" | "release" | "cancel_booking" | "set_status";
    bookingId?: number;
    status?: "available" | "booked" | "blocked";
}

export function RigStatusModal({
    rig,
    effectiveStatus,
    bookings,
    adminDate,
    onAction,
    onClose,
    loading,
}: {
    rig: DashboardRig;
    effectiveStatus: RigStatus;
    bookings: Booking[];
    adminDate: string;
    onAction: (action: RigStatusAction) => void;
    onClose: () => void;
    loading: boolean;
}) {
    const [confirmAction, setConfirmAction] = useState<RigStatusAction | null>(null);
    const cfg = STATUS_CONFIG[effectiveStatus];

    const rigBookings = bookings.filter((b) => b.rig_id === rig.id);

    // Check if check-in is allowed: must be today and current hour must match a booked slot
    const isToday = adminDate === getTodayStr();
    const currentHour = new Date().getHours();
    const canCheckIn = isToday && rigBookings.some((b) => {
        const slotHour = parseSlotStartHour(b.time_slot);
        return slotHour >= 0 && currentHour === slotHour;
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 font-outfit"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-surface-container"
                style={ghostCard}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Monitor className="h-4.5 w-4.5 text-btn-red" />
                        <div>
                            <h3 className="text-sm font-bold text-on-surface">{rig.name}</h3>
                            <p className="mt-0.5 text-[10px] text-on-surface-variant/40">{rig.specs}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold ${cfg.labelColor} ${cfg.bg} border ${cfg.border.split(" ")[0]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-xl p-1.5 text-on-surface-variant/40 transition-colors hover:bg-surface-container-high hover:text-on-surface"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Confirm delete overlay */}
                {confirmAction && (
                    <div className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-btn-red" />
                            <h3 className="text-sm font-bold text-on-surface">
                                {confirmAction.type === "cancel_booking" ? "Cancel Booking" : confirmAction.type === "set_status" ? "Change Status" : "Confirm Action"}
                            </h3>
                        </div>
                        <p className="mb-6 text-sm text-on-surface-variant/60">
                            {confirmAction.type === "cancel_booking"
                                ? "This will permanently cancel this booking. The customer will lose their slot."
                                : confirmAction.type === "set_status"
                                    ? `Set ${rig.name} to "${confirmAction.status === "available" ? "Available" : confirmAction.status === "booked" ? "App Booked" : "Walk-In"}"? This updates live for all customers.`
                                    : confirmAction.type === "end_session"
                                        ? `End the current session and mark ${rig.name} as available?`
                                        : confirmAction.type === "release"
                                            ? `Release ${rig.name} and remove the walk-in booking?`
                                            : `Check in and mark ${rig.name} as In Use?`}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmAction(null)}
                                disabled={loading}
                                className="flex-1 cursor-pointer rounded-full border border-on-surface bg-transparent py-2.5 text-sm text-on-surface-variant transition-all duration-200 hover:border-white hover:text-on-surface active:scale-[0.98]"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={() => onAction(confirmAction)}
                                disabled={loading}
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-btn-red py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {loading ? "Processing..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Main content */}
                {!confirmAction && (
                    <div className="p-6">
                        {/* Manual Status Override */}
                        <div className="mb-5">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                Set Status
                            </p>
                            <div className="flex gap-2">
                                {(
                                    [
                                        { status: "available" as const, label: "Available", dot: "bg-emerald-400", active: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
                                        { status: "booked" as const, label: "App Booked", dot: "bg-btn-red", active: "bg-btn-red/10 border-btn-red/40 text-btn-red", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
                                        { status: "blocked" as const, label: "Walk-In", dot: "bg-amber-400", active: "bg-amber-500/10 border-amber-500/40 text-amber-400", inactive: "border-white/[0.08] text-on-surface-variant/40 hover:border-white/20 hover:text-on-surface-variant/70" },
                                    ] as const
                                ).map(({ status, label, dot, active, inactive }) => {
                                    const isCurrent = effectiveStatus === status;
                                    return (
                                        <button
                                            key={status}
                                            disabled={isCurrent || loading}
                                            onClick={() => setConfirmAction({ type: "set_status", status })}
                                            className={`relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-default ${isCurrent ? active : inactive}`}
                                        >
                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                                            {label}
                                            {isCurrent && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status Actions */}
                        <div className="mb-5">
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                Actions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(effectiveStatus === "booked" || effectiveStatus === "blocked") && (
                                    <div className="flex flex-col gap-1.5">
                                        <button
                                            onClick={() => setConfirmAction({ type: "check_in" })}
                                            disabled={!canCheckIn}
                                            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                                                canCheckIn
                                                    ? "cursor-pointer bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white"
                                                    : "cursor-not-allowed bg-surface-container-high/30 text-on-surface-variant/20"
                                            }`}
                                        >
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Mark as In Use
                                        </button>
                                        {!canCheckIn && (
                                            <p className="pl-1 text-[10px] text-on-surface-variant/30">
                                                {!isToday
                                                    ? "Check-in is only available on the booking day"
                                                    : "Check-in opens when the booked slot begins"}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {effectiveStatus === "blocked" && (
                                    <button
                                        onClick={() => setConfirmAction({ type: "release" })}
                                        className="flex cursor-pointer items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-all duration-200 hover:bg-emerald-500 hover:text-white active:scale-[0.98]"
                                    >
                                        <Unlock className="h-3.5 w-3.5" />
                                        Release Rig
                                    </button>
                                )}
                                {effectiveStatus === "in_use" && (
                                    <button
                                        onClick={() => setConfirmAction({ type: "end_session" })}
                                        className="flex cursor-pointer items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-all duration-200 hover:bg-emerald-500 hover:text-white active:scale-[0.98]"
                                    >
                                        <LogOutIcon className="h-3.5 w-3.5" />
                                        End Session
                                    </button>
                                )}
                                {effectiveStatus === "available" && (
                                    <p className="text-sm text-on-surface-variant/40">
                                        This rig is available. No status actions needed.
                                    </p>
                                )}
                                {effectiveStatus === "out_of_order" && (
                                    <p className="text-sm text-on-surface-variant/40">
                                        Use the wrench icon on the rig tile to restore this rig.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bookings for this rig */}
                        <div>
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
                                Bookings ({rigBookings.length})
                            </p>
                            {rigBookings.length === 0 ? (
                                <div className="rounded-xl bg-surface-container-high/30 p-4 text-center">
                                    <p className="text-xs text-on-surface-variant/30">No bookings for this rig</p>
                                </div>
                            ) : (
                                <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                                    {rigBookings.map((b) => (
                                        <div
                                            key={b.id}
                                            className="flex items-center justify-between rounded-xl bg-surface-container-high/30 px-4 py-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-on-surface truncate">
                                                        {b.customer_name}
                                                    </span>
                                                    <span
                                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                                            b.source === "app"
                                                                ? "bg-primary/10 text-primary"
                                                                : "bg-amber-500/10 text-amber-400"
                                                        }`}
                                                    >
                                                        {b.source === "app" ? "App" : "Walk-In"}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-3 text-[11px] text-on-surface-variant/50">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {b.time_slot}
                                                    </span>
                                                    <span className="font-mono text-primary/60">
                                                        {b.verification_code}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setConfirmAction({
                                                        type: "cancel_booking",
                                                        bookingId: b.id,
                                                    })
                                                }
                                                title="Cancel booking"
                                                className="ml-3 shrink-0 cursor-pointer rounded-lg p-2 text-on-surface-variant/30 transition-all hover:bg-btn-red/10 hover:text-btn-red"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

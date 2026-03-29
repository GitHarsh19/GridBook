import type { RigStatus } from "@/lib/data";

export const STATUS_CONFIG: Record<
    RigStatus,
    {
        border: string;
        bg: string;
        dot: string;
        label: string;
        labelColor: string;
        clickable: boolean;
    }
> = {
    available: {
        border: "border-emerald-500/30 hover:border-emerald-400/60",
        bg: "bg-surface-container",
        dot: "bg-emerald-400",
        label: "Available",
        labelColor: "text-emerald-400",
        clickable: true,
    },
    booked: {
        border: "border-btn-red/20 hover:border-btn-red/40",
        bg: "bg-surface-container",
        dot: "bg-btn-red",
        label: "App Booked",
        labelColor: "text-btn-red",
        clickable: true,
    },
    blocked: {
        border: "border-amber-500/30 hover:border-amber-400/60",
        bg: "bg-amber-500/5",
        dot: "bg-amber-400",
        label: "Walk-In",
        labelColor: "text-amber-400",
        clickable: true,
    },
    out_of_order: {
        border: "border-white/[0.06] hover:border-white/10",
        bg: "bg-surface-container-high/40",
        dot: "bg-on-surface-variant/20",
        label: "Out of Order",
        labelColor: "text-on-surface-variant/30",
        clickable: true,
    },
    in_use: {
        border: "border-sky-500/30 hover:border-sky-400/60",
        bg: "bg-sky-500/5",
        dot: "bg-sky-400",
        label: "In Use",
        labelColor: "text-sky-400",
        clickable: true,
    },
};

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
        border: "border-emerald-500/50 hover:border-emerald-400",
        bg: "bg-zinc-900",
        dot: "bg-emerald-400",
        label: "Available",
        labelColor: "text-emerald-400",
        clickable: true,
    },
    booked: {
        border: "border-red-500/50",
        bg: "bg-zinc-900",
        dot: "bg-red-400",
        label: "App Booked",
        labelColor: "text-red-400",
        clickable: false,
    },
    blocked: {
        border: "border-amber-500/50 hover:border-amber-400",
        bg: "bg-amber-500/5",
        dot: "bg-amber-400",
        label: "Walk-In",
        labelColor: "text-amber-400",
        clickable: true,
    },
    out_of_order: {
        border: "border-zinc-800 hover:border-zinc-700",
        bg: "bg-zinc-900/50",
        dot: "bg-zinc-600",
        label: "Out of Order",
        labelColor: "text-zinc-600",
        clickable: true,
    },
};

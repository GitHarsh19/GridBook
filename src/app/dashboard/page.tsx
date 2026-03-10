"use client";

import { useRouter } from "next/navigation";
import {
    Zap,
    LogOut,
    CalendarCheck,
    IndianRupee,
    Monitor,
    X,
} from "lucide-react";

/* ─── Mock Data ─────────────────────────────────────────────────────── */

const METRICS = [
    { label: "Today's Bookings", value: "12", icon: CalendarCheck },
    { label: "Estimated Revenue", value: "₹7,200", icon: IndianRupee },
];

interface RigStatus {
    id: number;
    name: string;
    status: "available" | "booked";
    endsAt?: string;
}

const RIGS: RigStatus[] = [
    { id: 1, name: "Rig 1", status: "available" },
    { id: 2, name: "Rig 2", status: "booked", endsAt: "8:00 PM" },
    { id: 3, name: "Rig 3", status: "available" },
    { id: 4, name: "Rig 4", status: "booked", endsAt: "7:30 PM" },
    { id: 5, name: "Rig 5", status: "available" },
    { id: 6, name: "Rig 6", status: "booked", endsAt: "9:00 PM" },
];

/* ─── Dashboard Page ────────────────────────────────────────────────── */

export default function DashboardPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Admin Navbar */}
            <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-cyan-500" />
                        <span className="text-lg font-bold tracking-tight text-white">
                            Grid<span className="text-cyan-500">Book</span>
                            <span className="ml-2 text-xs font-normal text-zinc-500">
                                Admin Portal
                            </span>
                        </span>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Log Out
                    </button>
                </div>
            </nav>

            <main className="mx-auto max-w-5xl px-4 py-6">
                {/* Hero Metrics */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2">
                    {METRICS.map((metric) => (
                        <div
                            key={metric.label}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
                        >
                            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
                                <metric.icon className="h-4 w-4 text-cyan-500" />
                                {metric.label}
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {metric.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Floor Plan */}
                <div>
                    <h2 className="mb-4 text-lg font-bold text-white">
                        Live Rig Status
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {RIGS.map((rig) => {
                            const isAvailable = rig.status === "available";

                            return (
                                <div
                                    key={rig.id}
                                    className={`rounded-lg border p-4 ${isAvailable
                                            ? "border-green-500/50 bg-zinc-900"
                                            : "border-zinc-800/50 bg-zinc-900/60"
                                        }`}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Monitor
                                                className={`h-5 w-5 ${isAvailable ? "text-green-400" : "text-zinc-600"
                                                    }`}
                                            />
                                            <span
                                                className={`text-sm font-semibold ${isAvailable ? "text-white" : "text-zinc-500"
                                                    }`}
                                            >
                                                {rig.name}
                                            </span>
                                        </div>
                                        {!isAvailable && (
                                            <X className="h-3.5 w-3.5 text-zinc-700" />
                                        )}
                                    </div>

                                    {isAvailable ? (
                                        <>
                                            <p className="mb-3 text-sm text-green-400">
                                                🟢 Available
                                            </p>
                                            <button className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-cyan-500/50 hover:text-white">
                                                Block for Walk-in
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-sm text-zinc-600">
                                            🔴 Booked (Ends at {rig.endsAt})
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}

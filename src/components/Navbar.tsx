"use client";

import { MapPin, ChevronDown, Zap } from "lucide-react";

export function Navbar({
    onLocationClick,
}: {
    onLocationClick?: () => void;
}) {
    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-cyan-500" />
                    <span className="text-lg font-bold tracking-tight text-white">
                        Grid<span className="text-cyan-500">Book</span>
                    </span>
                </div>

                {/* Location selector */}
                <button
                    onClick={onLocationClick}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                    <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                    Bengaluru
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                </button>
            </div>
        </nav>
    );
}

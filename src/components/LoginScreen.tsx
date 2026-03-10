"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Role = "customer" | "admin";

export function LoginScreen() {
    const router = useRouter();
    const { setLoggedIn } = useAuth();
    const [activeRole, setActiveRole] = useState<Role>("customer");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        if (activeRole === "customer" && username === "gamer" && password === "password") {
            setLoggedIn(true, "customer");
            router.push("/explore");
            return;
        }

        if (activeRole === "admin" && username === "venue" && password === "password") {
            setLoggedIn(true, "admin");
            router.push("/dashboard");
            return;
        }

        setError(
            activeRole === "customer"
                ? "Use gamer / password to test"
                : "Use venue / password to test"
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-cyan-500" />
                    <span className="text-2xl font-bold tracking-tight text-white">
                        Grid<span className="text-cyan-500">Book</span>
                    </span>
                </div>

                {/* Auth Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                    {/* Role Toggle */}
                    <div className="mb-6 flex rounded-md border border-zinc-800 bg-zinc-950 p-1">
                        <button
                            onClick={() => { setActiveRole("customer"); setError(""); }}
                            className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-all ${activeRole === "customer"
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            Customer
                        </button>
                        <button
                            onClick={() => { setActiveRole("admin"); setError(""); }}
                            className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-all ${activeRole === "admin"
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            Venue Admin
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter username"
                                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter password"
                                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm font-medium text-red-400">{error}</p>
                        )}

                        {/* Login Button */}
                        <button
                            onClick={handleLogin}
                            className="w-full rounded-md bg-cyan-500 py-2.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98]"
                        >
                            Login
                        </button>
                    </div>

                    {/* Hint */}
                    <p className="mt-4 text-center text-xs text-zinc-600">
                        {activeRole === "customer"
                            ? "gamer / password"
                            : "venue / password"}
                    </p>
                </div>
            </div>
        </div>
    );
}

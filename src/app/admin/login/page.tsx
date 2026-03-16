"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff } from "lucide-react";

function AdminLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const showMessage = searchParams.get("message") === "sign_in";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [messageRendered, setMessageRendered] = useState(showMessage);
    const [messageExpanded, setMessageExpanded] = useState(false);

    useEffect(() => {
        if (!showMessage) return;
        const expandTimer = setTimeout(() => setMessageExpanded(true), 16);
        const contractTimer = setTimeout(() => setMessageExpanded(false), 1200);
        const removeTimer = setTimeout(() => setMessageRendered(false), 1600);
        return () => { clearTimeout(expandTimer); clearTimeout(contractTimer); clearTimeout(removeTimer); };
    }, [showMessage]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (username === "venue" && password === "password") {
            localStorage.setItem("gridbook_admin", "true");
            router.push("/admin/dashboard");
        } else {
            setError("Invalid credentials. Use venue / password");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <Link href="/" className="mb-8 flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-cyan-500" />
                    <span className="text-2xl font-bold tracking-tight text-white">
                        Grid<span className="text-cyan-500">Book</span>
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                        Admin
                    </span>
                </Link>

                {/* Login Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                    {/* Sign-in message */}
                    {messageRendered && (
                        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${messageExpanded ? "max-h-10 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}>
                            <p className="text-center text-sm text-red-400">Sign in to continue</p>
                        </div>
                    )}

                    <h2 className="mb-6 text-center text-sm font-medium text-zinc-400">
                        Venue Admin Login
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                                placeholder="Enter username"
                                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    placeholder="Enter password"
                                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm font-medium text-red-400">{error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full cursor-pointer rounded-md bg-cyan-500 py-2.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98]"
                        >
                            Login
                        </button>
                    </form>

                    {/* Hint */}
                    <p className="mt-4 text-center text-xs text-zinc-600">
                        venue / password
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense>
            <AdminLoginForm />
        </Suspense>
    );
}

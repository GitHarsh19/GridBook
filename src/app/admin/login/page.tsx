"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperAdminEmail } from "@/lib/superAdmin";
import { useRateLimit } from "@/lib/hooks/useRateLimit";

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3.5 font-outfit text-[0.9rem] text-white placeholder:text-white/40 outline-none transition-colors duration-300 ease-in-out focus:border-primary-container";

function AdminLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setLoggedIn } = useAuth();
    const showMessage = searchParams.get("message") === "sign_in";
    const showCustomerMsg = searchParams.get("message") === "not_admin";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [messageRendered, setMessageRendered] = useState(showMessage);
    const [messageExpanded, setMessageExpanded] = useState(false);
    const [customerMsgRendered, setCustomerMsgRendered] = useState(showCustomerMsg);
    const [customerMsgExpanded, setCustomerMsgExpanded] = useState(false);
    const { blocked, cooldownSeconds, recordAttempt } = useRateLimit();

    const triggerCustomerMsg = () => {
        setCustomerMsgRendered(true);
        setTimeout(() => setCustomerMsgExpanded(true), 16);
        setTimeout(() => setCustomerMsgExpanded(false), 1200);
        setTimeout(() => setCustomerMsgRendered(false), 1600);
    };

    useEffect(() => {
        if (!showCustomerMsg) return;
        const expandTimer = setTimeout(() => setCustomerMsgExpanded(true), 16);
        const contractTimer = setTimeout(() => setCustomerMsgExpanded(false), 1200);
        const removeTimer = setTimeout(() => setCustomerMsgRendered(false), 1600);
        return () => { clearTimeout(expandTimer); clearTimeout(contractTimer); clearTimeout(removeTimer); };
    }, [showCustomerMsg]);

    useEffect(() => {
        if (!showMessage) return;
        const expandTimer = setTimeout(() => setMessageExpanded(true), 16);
        const contractTimer = setTimeout(() => setMessageExpanded(false), 1200);
        const removeTimer = setTimeout(() => setMessageRendered(false), 1600);
        return () => { clearTimeout(expandTimer); clearTimeout(contractTimer); clearTimeout(removeTimer); };
    }, [showMessage]);


    const handleSupabaseLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blocked) return;
        setError(""); setLoading(true); recordAttempt();
        const { data, error: authError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (authError) { setLoading(false); setError(authError.message); return; }
        if (data.user) {
            const superAdmin = isSuperAdminEmail(data.user.email);
            const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", data.user.id).single();
            if (!superAdmin && (!profile || profile.role !== "admin")) {
                await supabaseAdmin.auth.signOut();
                setLoading(false);
                triggerCustomerMsg();
                return;
            }
            setLoggedIn(true, "admin");
            setLoading(false);
            router.push(superAdmin ? "/admin/invite" : "/admin/dashboard");
            return;
        }
        setLoading(false);
        router.push("/admin/dashboard");
    };

    const handleGoogleLogin = async () => {
        setError("");
        const { error: oauthError } = await supabaseAdmin.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/admin/dashboard")}&role=admin` },
        });
        if (oauthError) setError(oauthError.message);
    };


    return (
        <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 overflow-x-hidden antialiased">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <Link href="/" className="mb-3 flex flex-col items-center justify-center">
                    <span className="text-[2rem] font-black tracking-[-0.04em] text-on-surface">
                        PitPass
                    </span>
                    <span className="mt-1 rounded-full bg-btn-red/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-btn-red">
                        Admin
                    </span>
                </Link>

                {/* Card */}
                <div className="mt-8 rounded-2xl bg-surface-container p-8" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                    {/* Sign-in message */}
                    {messageRendered && (
                        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${messageExpanded ? "max-h-10 opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"}`}>
                            <p className="text-center text-sm text-btn-red">Sign in to continue</p>
                        </div>
                    )}

                    {/* Customer account message */}
                    {customerMsgRendered && (
                        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${customerMsgExpanded ? "max-h-10 opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"}`}>
                            <p className="text-center text-sm text-btn-red">Not registered as admin</p>
                        </div>
                    )}

                    <h2 className="mb-8 text-center text-[0.85rem] font-medium uppercase tracking-widest text-on-surface-variant/60">
                        Venue Admin Login
                    </h2>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 rounded-2xl bg-btn-red/[0.08] px-5 py-3 text-sm text-btn-red">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSupabaseLogin} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                            placeholder="Email"
                            className={inputClass}
                        />

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                placeholder="Password"
                                className={`${inputClass} pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition-colors hover:text-white"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || blocked}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-btn-red py-3.5 text-sm font-medium tracking-[-0.03em] text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {blocked ? `Too many attempts — retry in ${cooldownSeconds}s` : loading ? "Signing in\u2026" : "Login"}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-1">
                            <div className="h-px flex-1 bg-on-surface/10" />
                            <span className="text-xs text-on-surface-variant/40">or</span>
                            <div className="h-px flex-1 bg-on-surface/10" />
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-on-surface bg-transparent py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-white hover:bg-surface-container-high active:scale-[0.98]"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign in with Google
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-on-surface-variant/50">
                        Admin accounts are invite-only.{" "}
                        <a href="mailto:harshitagarwalsmt@gmail.com" className="text-btn-red hover:underline">
                            Contact the platform owner
                        </a>{" "}
                        for access.
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (formData: LoginFormData) => {
        setServerError("");

        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (error) {
            setServerError(error.message);
            return;
        }

        router.push("/explore");
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/explore")}&role=customer`,
            },
        });
        if (error) setServerError(error.message);
    };

    const inputClass =
        "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <Link href="/" className="mb-8 flex items-center justify-center gap-2">
                    <Zap className="h-6 w-6 text-cyan-500" />
                    <span className="text-2xl font-bold tracking-tight text-white">
                        Grid<span className="text-cyan-500">Book</span>
                    </span>
                </Link>

                {/* Card */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                    <h2 className="mb-6 text-center text-sm font-medium text-zinc-400">
                        Customer Login
                    </h2>

                    {/* Server Error */}
                    {serverError && (
                        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-500">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className={inputClass}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    className={`${inputClass} pr-10`}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-300"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-500 py-2.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Signing in\u2026" : "Log In"}
                        </button>

                        {/* Divider + Google */}
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-zinc-800" />
                            <span className="text-xs text-zinc-600">or</span>
                            <div className="h-px flex-1 bg-zinc-800" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-white transition-all hover:border-zinc-600 hover:bg-zinc-700 active:scale-[0.98]"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Sign in with Google
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="mt-4 text-center text-xs text-zinc-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-cyan-500 transition-colors hover:text-cyan-400"
                        >
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

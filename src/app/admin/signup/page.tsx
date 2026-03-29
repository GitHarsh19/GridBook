"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

const signUpSchema = z
    .object({
        name: z.string().min(1, "Name is required").max(100, "Name must be under 100 characters")
            .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
        email: z.string().min(1, "Email is required").email("Enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be under 72 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type SignUpFormData = z.infer<typeof signUpSchema>;

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3.5 font-outfit text-[0.9rem] text-white placeholder:text-white/40 outline-none transition-colors duration-300 ease-in-out focus:border-primary-container";

const ghostCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)" };

const Logo = () => (
    <Link href="/" className="mb-3 flex flex-col items-center justify-center">
        <span className="text-[2rem] font-black tracking-[-0.04em] text-on-surface">
            PitPass
        </span>
        <span className="mt-1 rounded-full bg-btn-red/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-btn-red">
            Admin
        </span>
    </Link>
);

const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function AdminSignUpPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (formData: SignUpFormData) => {
        setServerError("");
        const { data, error } = await supabaseAdmin.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: { full_name: formData.name },
                emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/admin/dashboard")}&role=admin`,
            },
        });
        if (error) { setServerError(error.message); return; }
        if (data.session && data.user) {
            await supabaseAdmin.from("profiles").update({ role: "admin", full_name: formData.name }).eq("id", data.user.id);
            router.push("/admin/dashboard");
        } else {
            setSignUpSuccess(true);
        }
    };

    const handleGoogleSignUp = async () => {
        setServerError("");
        const { error } = await supabaseAdmin.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/admin/dashboard")}&role=admin` },
        });
        if (error) setServerError(error.message);
    };

    if (signUpSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 antialiased">
                <div className="w-full max-w-sm">
                    <Logo />
                    <div className="mt-8 rounded-2xl bg-surface-container p-8 text-center" style={ghostCard}>
                        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
                        <h2 className="mb-2 text-lg font-bold tracking-tight text-on-surface">Check your email</h2>
                        <p className="mb-6 text-sm text-on-surface-variant/70">
                            We&apos;ve sent a confirmation link to your email. Click it to activate your account, then log in.
                        </p>
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center justify-center rounded-full bg-btn-red px-6 py-3 text-sm font-medium tracking-[-0.03em] text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98]"
                        >
                            Go to Admin Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 overflow-x-hidden antialiased">
            <div className="w-full max-w-sm">
                <Logo />

                <div className="mt-8 rounded-2xl bg-surface-container p-8" style={ghostCard}>
                    <h2 className="mb-8 text-center text-[0.85rem] font-medium uppercase tracking-widest text-on-surface-variant/60">
                        Create Admin Account
                    </h2>

                    {serverError && (
                        <div className="mb-6 rounded-2xl bg-btn-red/[0.08] px-5 py-3 text-sm text-btn-red">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <div>
                            <input type="text" placeholder="Full name" className={inputClass} {...register("name")} />
                            {errors.name && <p className="mt-2 pl-5 text-xs text-btn-red">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <input type="email" placeholder="Email" className={inputClass} {...register("email")} />
                            {errors.email && <p className="mt-2 pl-5 text-xs text-btn-red">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className={`${inputClass} pr-12`}
                                    {...register("password")}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition-colors hover:text-white">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-2 pl-5 text-xs text-btn-red">{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Confirm password"
                                    className={`${inputClass} pr-12`}
                                    {...register("confirmPassword")}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition-colors hover:text-white">
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-2 pl-5 text-xs text-btn-red">{errors.confirmPassword.message}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-btn-red py-3.5 text-sm font-medium tracking-[-0.03em] text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Creating account\u2026" : "Sign Up"}
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
                            onClick={handleGoogleSignUp}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-on-surface bg-transparent py-3.5 text-sm font-medium text-white transition-all duration-300 hover:border-white hover:bg-surface-container-high active:scale-[0.98]"
                        >
                            <GoogleIcon />
                            Sign up with Google
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-on-surface-variant/50">
                        Already have an account?{" "}
                        <Link href="/admin/login" className="text-on-surface transition-colors hover:text-primary">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

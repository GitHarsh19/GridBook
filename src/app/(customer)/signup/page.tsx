"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const signUpSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (formData: SignUpFormData) => {
        setServerError("");

        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: { full_name: formData.name },
            },
        });

        if (error) {
            setServerError(error.message);
            return;
        }

        router.push("/explore");
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
                        Create your account
                    </h2>

                    {/* Server Error */}
                    {serverError && (
                        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-500">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Name
                            </label>
                            <input
                                type="text"
                                placeholder="Your name"
                                className={inputClass}
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                            )}
                        </div>

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

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    className={`${inputClass} pr-10`}
                                    {...register("confirmPassword")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-500 transition-colors hover:text-zinc-300"
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-cyan-500 py-2.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Creating account\u2026" : "Sign Up"}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="mt-4 text-center text-xs text-zinc-500">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-cyan-500 transition-colors hover:text-cyan-400"
                        >
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

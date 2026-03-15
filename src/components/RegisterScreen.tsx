"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const clearError = () => setError("");

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // MVP: just show success and redirect to login
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister();
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

        {/* Register Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-6 text-center text-lg font-bold text-white">
            Create Account
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                onKeyDown={handleKeyDown}
                placeholder="Enter your name"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
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
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                onKeyDown={handleKeyDown}
                placeholder="Min 6 characters"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                onKeyDown={handleKeyDown}
                placeholder="Re-enter password"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-medium text-red-400">{error}</p>
            )}

            {/* Success */}
            {success && (
              <p className="text-sm font-medium text-emerald-400">
                Account created! Redirecting to login...
              </p>
            )}

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={success}
              className="w-full cursor-pointer rounded-md bg-cyan-500 py-2.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-50"
            >
              Register
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {/* Google Sign-Up */}
            <button
              onClick={handleGoogleSignUp}
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
              Sign up with Google
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-4 text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-500 transition-colors hover:text-cyan-400"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { addVenue } from "@/lib/data";

const inputClass =
  "w-full rounded-full border border-on-surface bg-transparent px-5 py-3.5 font-outfit text-[0.9rem] text-white placeholder:text-white/40 outline-none transition-colors duration-300 ease-in-out focus:border-primary-container";

type Phase = "verifying" | "ready" | "invalid";

function AdminSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLoggedIn } = useAuth();
  const checked = useRef(false);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [email, setEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [venueName, setVenueName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Establish the admin session from the invite token in the URL.
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    (async () => {
      // Implicit flow: #access_token=... in the URL hash (invite links use this)
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get("error")) {
          setPhase("invalid");
          return;
        }
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabaseAdmin.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }

      // PKCE flow: ?code=... in the query string
      const code = searchParams.get("code");
      if (code) {
        const { error: exErr } = await supabaseAdmin.auth.exchangeCodeForSession(code);
        if (exErr) {
          setPhase("invalid");
          return;
        }
      }

      const { data: { session } } = await supabaseAdmin.auth.getSession();
      if (!session) {
        setPhase("invalid");
        return;
      }

      setEmail(session.user.email ?? "");
      setPhase("ready");
    })();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Please enter your name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!venueName.trim()) return setError("Venue name is required.");
    if (!location.trim()) return setError("Venue location is required.");
    if (!(Number(price) > 0)) return setError("Price per hour must be greater than 0.");

    setSubmitting(true);

    // 1. Set password + name on the auth user
    const { error: updErr } = await supabaseAdmin.auth.updateUser({
      password,
      data: { full_name: fullName.trim() },
    });
    if (updErr) {
      setSubmitting(false);
      return setError(updErr.message);
    }

    // 2. Mirror the name into the profiles row
    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (session) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", session.user.id);
    }

    // 3. Create their first venue (owner_id is set server-side from the session)
    const result = await addVenue(
      venueName.trim(),
      location.trim(),
      Number(price),
      description.trim(),
      imageUrl.trim() || undefined,
    );
    if (!result.success) {
      setSubmitting(false);
      return setError(result.error || "Failed to create venue.");
    }

    setLoggedIn(true, "admin");
    router.push("/admin/dashboard");
  };

  if (phase === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-btn-red" />
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 antialiased">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-lg font-bold text-on-surface">Invite link invalid or expired</h2>
          <p className="mt-2 text-sm text-on-surface-variant/60">
            Ask the platform owner to send you a new invite.
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-block rounded-full bg-btn-red px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white hover:text-btn-red"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 py-12 overflow-x-hidden antialiased">
      <div className="w-full max-w-md">
        <div className="mb-3 flex flex-col items-center justify-center">
          <span className="text-[2rem] font-black tracking-[-0.04em] text-on-surface">PitPass</span>
          <span className="mt-1 rounded-full bg-btn-red/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-btn-red">
            Admin Setup
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-surface-container p-8" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-center text-lg font-bold text-on-surface">Set up your account</h2>
          {email && (
            <p className="mt-1 mb-6 text-center text-sm text-on-surface-variant/50">{email}</p>
          )}

          {error && (
            <div className="mb-6 rounded-2xl bg-btn-red/[0.08] px-5 py-3 text-sm text-btn-red">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account */}
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(""); }}
              placeholder="Your full name"
              className={inputClass}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Create a password"
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
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              placeholder="Confirm password"
              className={inputClass}
            />

            {/* Venue */}
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant/50">
              <Building2 className="h-3.5 w-3.5 text-btn-red" />
              Your first venue
            </div>
            <input
              type="text"
              value={venueName}
              onChange={(e) => { setVenueName(e.target.value); setError(""); }}
              placeholder="Venue name"
              className={inputClass}
            />
            <input
              type="text"
              value={location}
              onChange={(e) => { setLocation(e.target.value); setError(""); }}
              placeholder="Location (e.g. Koramangala, Bengaluru)"
              className={inputClass}
            />
            <input
              type="number"
              value={price}
              min={1}
              onChange={(e) => { setPrice(e.target.value); setError(""); }}
              placeholder="Price per hour (₹)"
              className={inputClass}
            />
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(""); }}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full rounded-2xl border border-on-surface bg-transparent px-5 py-3.5 font-outfit text-[0.9rem] text-white placeholder:text-white/40 outline-none transition-colors focus:border-primary-container resize-none"
            />
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setError(""); }}
              placeholder="Image URL (optional)"
              className={inputClass}
            />

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-btn-red py-3.5 text-sm font-medium tracking-[-0.03em] text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Setting up…" : "Complete setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminSetupPage() {
  return (
    <Suspense>
      <AdminSetupForm />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/explore";
  const requiredRole = searchParams.get("role"); // "admin" if coming from admin tab
  const { isLoggedIn } = useAuth();
  const checked = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || checked.current) return;
    checked.current = true;

    // If admin role required, verify profile before redirecting
    if (requiredRole === "admin") {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/dashboard");
        } else {
          await supabase.auth.signOut();
          router.push("/login");
        }
      })();
      return;
    }

    router.push(redirectTo);
  }, [isLoggedIn, router, redirectTo, requiredRole]);

  useEffect(() => {
    // Fallback: if auth never resolves, redirect after 5s
    const timeout = setTimeout(() => router.push("/login"), 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <p className="text-sm text-zinc-400">Logging you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}

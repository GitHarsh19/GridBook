"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/explore";
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // onAuthStateChange (in AuthProvider) handles the hash exchange.
    // We only need to redirect once the auth state resolves.
    if (isLoggedIn) {
      router.push(redirectTo);
      return;
    }

    // Fallback: if auth never resolves (e.g. user navigated here directly),
    // redirect after 5s so they don't get stuck.
    const timeout = setTimeout(() => router.push("/login"), 5000);
    return () => clearTimeout(timeout);
  }, [isLoggedIn, router, redirectTo]);

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

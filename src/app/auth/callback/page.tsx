"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/explore";
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push(redirectTo);
      } else {
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);
      }
    });
  }, [router, redirectTo]);

  useEffect(() => {
    if (isLoggedIn) {
      router.push(redirectTo);
    }
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

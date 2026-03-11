"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // Once the auth state listener in AuthProvider picks up the session,
  // redirect to explore
  useEffect(() => {
    // Also try to detect session directly
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/explore");
      } else {
        // Give it a moment for the auth state change to fire
        setTimeout(() => {
          router.push("/explore");
        }, 1000);
      }
    });
  }, [router]);

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/explore");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <p className="text-sm text-zinc-400">Logging you in...</p>
    </div>
  );
}

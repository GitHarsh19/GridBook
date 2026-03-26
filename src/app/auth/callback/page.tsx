"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/explore";
  const requiredRole = searchParams.get("role"); // "admin" if coming from admin tab
  const { setLoggedIn } = useAuth();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    (async () => {
      // Pick the correct client — only IT gets the session
      const client = requiredRole === "admin" ? supabaseAdmin : supabase;

      // PKCE flow: ?code=xxx in query string
      const code = searchParams.get("code");
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          router.push(requiredRole === "admin" ? "/admin/login" : "/login");
          return;
        }
      }

      // Implicit flow: #access_token=xxx in URL hash
      if (!code && typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          await client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }

      // Verify session was established
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        router.push(requiredRole === "admin" ? "/admin/login" : "/login");
        return;
      }

      if (requiredRole === "admin") {
        // Verify user is already an admin — do NOT auto-promote
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!profile || profile.role !== "admin") {
          // Not an admin — sign out the admin client and redirect
          await supabaseAdmin.auth.signOut();
          router.push("/admin/login?message=not_admin");
          return;
        }

        setLoggedIn(true, "admin");
        router.push("/admin/dashboard");
      } else {
        setLoggedIn(true, "customer");
        router.push(redirectTo);
      }
    })();
  }, [router, redirectTo, requiredRole, setLoggedIn, searchParams]);

  return <div className="min-h-screen bg-zinc-950" />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}

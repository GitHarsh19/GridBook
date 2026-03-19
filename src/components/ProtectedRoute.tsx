"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: "customer" | "admin";
}) {
  const { isLoggedIn, isAdmin, isLoading, isLoggingOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasAccess =
    requiredRole === "admin" ? isAdmin : isLoggedIn;

  useEffect(() => {
    // Don't redirect while loading or during logout (caller handles navigation)
    if (isLoading || hasAccess || isLoggingOut) return;

    if (requiredRole === "admin") {
      router.push("/admin/login?message=sign_in");
    } else {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}&message=sign_in`);
    }
  }, [isLoading, hasAccess, isLoggingOut, requiredRole, router, pathname]);

  if (isLoading || isLoggingOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          {isLoggingOut && (
            <p className="text-sm text-zinc-400">Signing out…</p>
          )}
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <>{children}</>;
}

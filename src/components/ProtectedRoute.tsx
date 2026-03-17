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
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasAccess =
    requiredRole === "admin" ? isAdmin : isLoggedIn;

  useEffect(() => {
    if (isLoading || hasAccess) return;

    if (requiredRole === "admin") {
      router.push("/admin/login?message=sign_in");
    } else {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, hasAccess, requiredRole, router, pathname]);

  if (isLoading || !hasAccess) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <>{children}</>;
}

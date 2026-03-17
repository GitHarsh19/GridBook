"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
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
      router.push(`/login?redirect=${encodeURIComponent(pathname)}&message=sign_in`);
    }
  }, [isLoading, hasAccess, requiredRole, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!hasAccess) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <>{children}</>;
}

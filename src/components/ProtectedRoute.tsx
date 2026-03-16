"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "@/components/LoginScreen";
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

  const hasAccess =
    requiredRole === "admin" ? isAdmin : isLoggedIn;

  useEffect(() => {
    if (!isLoading && !hasAccess && requiredRole === "admin") {
      router.push("/admin/login?message=sign_in");
    }
  }, [isLoading, hasAccess, requiredRole, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  if (!hasAccess) {
    if (requiredRole === "admin") {
      return <div className="min-h-screen bg-zinc-950" />;
    }
    return <Suspense><LoginScreen message="Sign in to continue" /></Suspense>;
  }

  return <>{children}</>;
}

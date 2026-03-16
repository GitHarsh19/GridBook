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
  const { isLoggedIn, isLoading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn && requiredRole && role !== requiredRole) {
      router.push("/login");
    }
  }, [isLoggedIn, isLoading, role, requiredRole, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  if (!isLoggedIn) {
    return <Suspense><LoginScreen message="Sign in to continue" /></Suspense>;
  }

  if (requiredRole && role !== requiredRole) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <>{children}</>;
}

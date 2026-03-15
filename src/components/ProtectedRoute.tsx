"use client";

import { useEffect } from "react";
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
      router.push("/");
    }
  }, [isLoggedIn, isLoading, role, requiredRole, router]);

  // While session is being resolved, show blank dark screen — no flash
  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  // Not logged in — show login screen inline with a prompt
  if (!isLoggedIn) {
    return <LoginScreen message="Sign in to continue" />;
  }

  // Logged in but wrong role — redirect handled by useEffect above
  if (requiredRole && role !== requiredRole) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <>{children}</>;
}

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
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-center pt-40">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-500" />
            <span className="text-xs text-zinc-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Suspense><LoginScreen message="Sign in to continue" /></Suspense>;
  }

  if (requiredRole && role !== requiredRole) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  return <>{children}</>;
}

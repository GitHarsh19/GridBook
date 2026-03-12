"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

/**
 * Wraps a page to redirect to login if user is not authenticated.
 * Always renders children — only redirects after confirming not logged in.
 * This prevents the disappearing content flash on page refresh.
 */
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
    // Only redirect AFTER loading is done and user is confirmed NOT logged in
    if (!isLoading && !isLoggedIn) {
      router.push("/");
    }
    if (!isLoading && isLoggedIn && requiredRole && role !== requiredRole) {
      router.push("/");
    }
  }, [isLoggedIn, isLoading, role, requiredRole, router]);

  // Always render children — show content immediately on page load.
  // If user is not logged in, the useEffect redirect handles it.
  return <>{children}</>;
}

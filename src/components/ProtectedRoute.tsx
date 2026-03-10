"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

/**
 * Wraps a page to redirect to login if user is not authenticated.
 * Optionally checks for a specific role.
 */
export function ProtectedRoute({
    children,
    requiredRole,
}: {
    children: ReactNode;
    requiredRole?: "customer" | "admin";
}) {
    const { isLoggedIn, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push("/");
            return;
        }
        if (requiredRole && role !== requiredRole) {
            router.push("/");
        }
    }, [isLoggedIn, role, requiredRole, router]);

    if (!isLoggedIn) return null;
    if (requiredRole && role !== requiredRole) return null;

    return <>{children}</>;
}

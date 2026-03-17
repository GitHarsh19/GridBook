"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
}

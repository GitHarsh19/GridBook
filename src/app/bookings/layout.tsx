"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ReactNode } from "react";

export default function BookingsLayout({ children }: { children: ReactNode }) {
    return <ProtectedRoute requiredRole="customer">{children}</ProtectedRoute>;
}

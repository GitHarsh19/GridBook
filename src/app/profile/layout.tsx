"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return <ProtectedRoute requiredRole="customer">{children}</ProtectedRoute>;
}

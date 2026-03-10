"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ReactNode } from "react";

export default function ExploreLayout({ children }: { children: ReactNode }) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}

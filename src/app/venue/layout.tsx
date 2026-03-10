"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ReactNode } from "react";

export default function VenueLayout({ children }: { children: ReactNode }) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}

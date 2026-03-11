"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * /venue (no ID) — redirect to explore.
 * If not logged in, the layout's ProtectedRoute handles the redirect to login.
 */
export default function VenuePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/explore");
  }, [router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 antialiased">
      <p className="text-sm text-on-surface-variant/60">
        Admin accounts are created by invitation only. Redirecting to login…
      </p>
    </div>
  );
}

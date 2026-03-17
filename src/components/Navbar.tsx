"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, ChevronDown, Zap, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout("customer");
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-500" />
          <span className="text-lg font-bold tracking-tight text-white">
            Grid<span className="text-cyan-500">Book</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location selector */}
          <button
            aria-label="Select location"
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white sm:px-3"
          >
            <MapPin className="h-3.5 w-3.5 text-cyan-500" />
            <span className="hidden sm:inline">Bengaluru</span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          </button>

          {/* Explore link (when on venue detail) */}
          {pathname?.startsWith("/venue/") && (
            <Link
              href="/explore"
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white sm:px-3"
            >
              Explore
            </Link>
          )}

          {/* Auth action */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400 sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white sm:px-3"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

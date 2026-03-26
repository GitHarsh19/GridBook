"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, ChevronDown, LogOut, LogIn, CalendarCheck, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Navbar({ floating = false }: { floating?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    logout("customer");
    router.push("/explore");
  };

  const loginHref =
    pathname && pathname !== "/"
      ? `/login?redirect=${encodeURIComponent(pathname)}`
      : "/login";

  const navLinks = (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar">
      {/* Location selector */}
      <button
        aria-label="Select location"
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
          floating
            ? "text-white/70 hover:bg-white hover:text-[#131313]"
            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
        }`}
      >
        <MapPin className="h-3.5 w-3.5 text-btn-red" />
        <span className="hidden sm:inline">Bengaluru</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
      </button>

      {/* Explore link (when on venue detail or bookings) */}
      {(pathname?.startsWith("/venue/") || pathname === "/bookings" || pathname === "/profile") && (
        <Link
          href="/explore"
          className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            floating
              ? "text-white/70 hover:bg-white hover:text-[#131313]"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
          }`}
        >
          Explore
        </Link>
      )}

      {/* My Bookings link */}
      {isLoggedIn && pathname !== "/bookings" && !pathname?.startsWith("/bookings/") && (
        <Link
          href="/bookings"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            floating
              ? "text-white/70 hover:bg-white hover:text-[#131313]"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
          }`}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bookings</span>
        </Link>
      )}

      {/* Profile link */}
      {isLoggedIn && pathname !== "/profile" && (
        <Link
          href="/profile"
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            floating
              ? "text-white/70 hover:bg-white hover:text-[#131313]"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
          }`}
        >
          <UserCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      )}

      {/* Auth action */}
      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="flex items-center gap-1.5 rounded-full bg-btn-red px-5 py-2 text-sm font-medium tracking-[-0.03em] text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      ) : (
        <Link
          href={loginHref}
          className="flex items-center gap-1.5 rounded-full bg-btn-red px-5 py-2 text-sm font-medium tracking-[-0.03em] text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98]"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign In</span>
        </Link>
      )}
    </div>
  );

  if (floating) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none pt-4 font-outfit">
        <div className="mx-auto max-w-[var(--max-width-container)] px-8">
        <div className="pointer-events-auto flex items-center justify-between rounded-full px-6 py-3.5 transition-all duration-300" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/" className="flex items-center">
            <span className="text-[1.5rem] font-black tracking-[-0.04em] text-on-surface">
              PitPass
            </span>
          </Link>
          {navLinks}
        </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-2xl font-outfit"
      style={{ background: "rgba(19,19,19,0.72)" }}
    >
      <div className="mx-auto flex max-w-[var(--max-width-container)] items-center justify-between px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-[1.5rem] font-black tracking-[-0.04em] text-on-surface">
            PitPass
          </span>
        </Link>
        {navLinks}
      </div>
    </nav>
  );
}

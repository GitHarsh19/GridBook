"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowRight, ChevronDown, User, KeyRound } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Navbar */}
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-cyan-500" />
            <span className="text-lg font-bold tracking-tight text-white">
              Grid<span className="text-cyan-500">Book</span>
            </span>
          </div>

          {/* Sign In Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-800 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Sign In
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/30">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/explore");
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <User className="h-4 w-4 text-cyan-500" />
                  I&apos;m a Customer
                </button>
                <div className="mx-3 h-px bg-zinc-800" />
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/admin/login");
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <KeyRound className="h-4 w-4 text-amber-500" />
                  Venue Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Center content */}
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-3">
            <Zap className="h-8 w-8 text-cyan-500" />
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Grid<span className="text-cyan-500">Book</span>
            </h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-zinc-400">
            Real-time availability and booking for sim racing and gaming venues.
          </p>
          <Link
            href="/explore"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98]"
          >
            Explore Venues & Book
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-zinc-600">
            No sign-up required to browse venues
          </p>
        </div>
      </main>
    </div>
  );
}

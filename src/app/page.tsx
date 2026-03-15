import Link from "next/link";
import { Zap, ArrowRight, Shield } from "lucide-react";

export default function LandingPage() {
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
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <Shield className="h-3.5 w-3.5" />
            Login / Admin
          </Link>
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

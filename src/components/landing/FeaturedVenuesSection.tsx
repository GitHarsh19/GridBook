"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MapPin, Monitor } from "lucide-react";
import type { Venue } from "@/lib/data";

export function FeaturedVenuesSection({ venues }: { venues: Venue[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-slide-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    const els = sectionRef.current?.querySelectorAll(".reveal");
    els?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="venues"
      className="relative py-24 md:py-36"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="reveal mb-16">
          <h2 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Featured Venues
            <span className="section-number">(04)</span>
          </h2>
        </div>

        {/* Venue grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {venues.map((venue, i) => (
            <Link
              key={venue.id}
              href={`/venue/${venue.id}`}
              className={`reveal delay-${(i + 1) * 200} venue-card-link group block overflow-hidden rounded-xl border border-border bg-surface`}
            >
              {/* Image area */}
              <div className="relative flex h-48 items-center justify-center bg-surface-dark overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                <Monitor className="h-12 w-12 text-muted/40 transition-transform duration-300 group-hover:scale-110" />
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors duration-300">
                  {venue.name}
                </h3>

                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  {venue.location}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">
                    ₹{venue.price}
                    <span className="text-muted font-normal">/hr</span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      venue.availableRigs > 0
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        venue.availableRigs > 0
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />
                    {venue.availableRigs > 0
                      ? `${venue.availableRigs} Rigs Available`
                      : "Fully Booked"}
                  </span>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

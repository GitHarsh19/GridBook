"use client";

import { useEffect, useRef } from "react";
import { Zap } from "lucide-react";

export function CTAFooter() {
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
      { threshold: 0.2 }
    );

    const els = sectionRef.current?.querySelectorAll(".reveal");
    els?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative">
      {/* CTA Block */}
      <div className="bg-foreground py-24 md:py-36">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="reveal text-4xl font-bold tracking-tight text-background md:text-6xl lg:text-7xl">
            Ready to Race?
          </h2>
          <p className="reveal delay-200 mx-auto mt-6 max-w-lg text-base text-background/60 leading-relaxed">
            Find the perfect rig, pick your slot, and experience sim racing 
            like never before. Your next podium awaits.
          </p>
          <div className="reveal delay-400 mt-10">
            <a
              href="#venues"
              className="inline-flex items-center gap-3 rounded-full bg-background px-8 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:bg-accent hover:text-white hover:shadow-lg hover:shadow-accent/25 active:scale-[0.97]"
            >
              Book Your Session
              <span className="text-lg">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Grid<span className="text-accent">Book</span>
              <span className="ml-1 text-xs text-muted font-normal">®</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8 text-sm text-muted">
            <a
              href="#hero"
              className="transition-colors hover:text-foreground"
            >
              Home
            </a>
            <a
              href="#about"
              className="transition-colors hover:text-foreground"
            >
              About
            </a>
            <a
              href="#services"
              className="transition-colors hover:text-foreground"
            >
              Services
            </a>
            <a
              href="#venues"
              className="transition-colors hover:text-foreground"
            >
              Venues
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} GridBook. All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  );
}

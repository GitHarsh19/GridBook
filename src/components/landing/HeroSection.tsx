"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function HeroSection() {
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
      { threshold: 0.1 }
    );

    const els = sectionRef.current?.querySelectorAll(".reveal");
    els?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen grid-lines overflow-hidden"
    >
      {/* Decorative dashed arc */}
      <div
        className="decorative-arc"
        style={{
          width: "500px",
          height: "500px",
          top: "10%",
          left: "45%",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Left column — Text */}
          <div>
            <h1
              className="reveal text-6xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl"
              style={{ fontStyle: "italic" }}
            >
              Race
              <br />
              Ready.
            </h1>

            <p className="reveal delay-200 mt-8 max-w-md text-base leading-relaxed text-muted">
              Book premium sim racing rigs at top gaming venues near you. 
              Pick your rig, choose your time, and hit the track — all in 
              one seamless experience.
            </p>

            <div className="reveal delay-400 mt-10 flex flex-col gap-4 sm:flex-row">
              <a href="#venues" className="btn-arrow text-foreground">
                book now
              </a>
              <a href="#about" className="btn-arrow text-muted">
                discover
              </a>
            </div>
          </div>

          {/* Right column — Empty for balance (image below) */}
          <div className="reveal delay-300 hidden md:block" />
        </div>
      </div>

      {/* Full-width hero image */}
      <div className="reveal delay-500 relative mx-6 overflow-hidden rounded-2xl md:mx-auto md:max-w-6xl">
        <div className="relative aspect-[21/9] w-full">
          <Image
            src="/hero-racing.png"
            alt="Premium sim racing setup with multiple cockpits in a gaming lounge"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>

        {/* Social proof badge */}
        <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-full bg-white/90 px-5 py-2.5 shadow-lg backdrop-blur-sm">
          <div className="flex -space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500" />
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Trusted by 500+ racers
          </span>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-24" />
    </section>
  );
}

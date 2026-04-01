"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              entry.target.classList.contains("reveal-left")
                ? "animate-slide-left"
                : entry.target.classList.contains("reveal-right")
                ? "animate-slide-right"
                : "animate-fade-slide-up"
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const els = sectionRef.current?.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right"
    );
    els?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-24 md:py-36 grid-lines"
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="reveal mb-16">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            About Us
            <span className="section-number">(01)</span>
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Image */}
          <div className="reveal-left img-hover-zoom overflow-hidden rounded-xl">
            <div className="relative aspect-[4/5]">
              <Image
                src="/about-racing.png"
                alt="Close-up of hands gripping a sim racing steering wheel"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="reveal-right">
            <h3 className="text-lg font-semibold text-foreground">
              GridBook
            </h3>
            <p className="text-sm text-muted">
              Your Gateway to Sim Racing
            </p>

            <p className="mt-6 text-base leading-relaxed text-muted">
              GridBook connects sim racing enthusiasts with the best gaming 
              venues in the city. Whether you&apos;re a weekend warrior or a 
              competitive esports racer, we make it effortless to discover 
              premium rigs, book your preferred time slots, and experience 
              the thrill of professional-grade simulators.
            </p>

            <p className="mt-4 text-base leading-relaxed text-muted">
              From Fanatec Direct Drive setups to immersive VR cockpits, 
              every rig on our platform is handpicked for quality. We partner 
              with top gaming cafés across Bengaluru to bring you the ultimate 
              sim racing experience — no equipment needed, just your race craft.
            </p>

            <div className="mt-8 flex gap-8">
              <div>
                <div className="text-2xl font-bold text-foreground">4+</div>
                <div className="text-sm text-muted">Venues</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">20+</div>
                <div className="text-sm text-muted">Premium Rigs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">12h</div>
                <div className="text-sm text-muted">Daily Slots</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

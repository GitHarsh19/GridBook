"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface StatItemProps {
  value: string;
  suffix: string;
  label: string;
  delay: number;
}

function StatItem({ value, suffix, label, delay }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const target = parseInt(value);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  const animateCount = useCallback(() => {
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
  }, [target]);

  useEffect(() => {
    if (isVisible) {
      animateCount();
    }
  }, [isVisible, animateCount]);

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-5"
      }`}
    >
      <div className="stat-value text-foreground">
        {isVisible ? count : 0}
        <span className="text-accent">{suffix}</span>
      </div>
      <p className="mt-3 text-sm text-muted font-medium">{label}</p>
    </div>
  );
}

export function StatsSection() {
  return (
    <section id="stats" className="relative py-24 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Personalized Racing
            <span className="section-number">(03)</span>
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <StatItem value="92" suffix="%" label="Racers rebook within a week" delay={0} />
          <StatItem value="500" suffix="+" label="Sessions booked & counting" delay={200} />
          <StatItem value="4" suffix="x" label="More immersive than home setups" delay={400} />
        </div>

        {/* Divider line */}
        <div className="mx-auto mt-16 h-px w-32 bg-border" />
      </div>
    </section>
  );
}

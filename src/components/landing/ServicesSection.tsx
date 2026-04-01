"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const services = [
  {
    title: "Venue Discovery",
    subtitle: "Find Your Arena",
    description:
      "Browse premium gaming cafés and sim racing lounges near you. Each venue is vetted for quality, comfort, and top-tier equipment.",
    image: "/venue-interior.png",
  },
  {
    title: "Premium Rigs",
    subtitle: "Feel Every Turn",
    description:
      "From Fanatec Direct Drive to Logitech G Pro and full VR cockpits — choose the setup that matches your racing style.",
    image: "/about-racing.png",
  },
  {
    title: "Instant Booking",
    subtitle: "Seamless & Fast",
    description:
      "Select your time slots, pick your rigs, and lock in your session instantly. Pay via UPI and you're race-ready.",
    image: "/hero-racing.png",
  },
];

export function ServicesSection() {
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
      id="services"
      className="relative py-24 md:py-36"
    >
      {/* Decorative arc */}
      <div
        className="decorative-arc"
        style={{
          width: "600px",
          height: "600px",
          top: "20%",
          left: "30%",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="reveal mb-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            What We Offer
            <span className="section-number">(02)</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted leading-relaxed">
            Sim racing isn&apos;t just a hobby — it&apos;s an experience. 
            Every session is designed to immerse you in the world of 
            competitive motorsport.
          </p>
        </div>

        {/* Service items */}
        <div className="mt-16 space-y-0">
          {services.map((service, i) => (
            <div
              key={service.title}
              className={`reveal delay-${(i + 1) * 200} service-item group flex flex-col gap-8 py-10 md:flex-row md:items-center ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image */}
              <div className="img-hover-zoom w-full overflow-hidden rounded-xl md:w-2/5">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 md:px-8">
                <p className="text-sm font-medium text-accent uppercase tracking-wider">
                  {service.subtitle}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                  {service.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

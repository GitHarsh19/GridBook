"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Static data ── */

const heroColumns = [
  [
    "https://images.unsplash.com/photo-1511882150382-421056c89033?w=420&q=80", // gaming controller
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=420&q=80",   // game controller
    "https://images.unsplash.com/photo-1616161560417-66d4db5892ec?w=420&q=80", // RGB gaming keyboard
  ],
  [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=420&q=80",   // esports arena
    "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=420&q=80", // gaming setup
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=420&q=80", // gaming room
  ],
  [
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=420&q=80", // gaming lounge
    "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=420&q=80", // person gaming
    "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=420&q=80", // gaming desk
  ],
  [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=420&q=80",   // gaming PC
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=420&q=80", // gaming laptop
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=420&q=80", // keyboards
  ],
  [
    "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=420&q=80",   // gaming chair
    "https://images.unsplash.com/photo-1586182987320-4f376d39d787?w=420&q=80", // RGB gaming
    "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=420&q=80", // gaming setup
  ],
  [
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=420&q=80", // gaming console
    "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=420&q=80", // gaming setup
    "https://images.unsplash.com/photo-1627163439134-7a8c47e08208?w=420&q=80", // gaming monitor
  ],
  [
    "https://images.unsplash.com/photo-1576633587382-13ddf37b1fc1?w=420&q=80", // gaming chair setup
    "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=420&q=80", // keyboard
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=420&q=80", // sim racing wheel
  ],
];

const aboutCards = [
  {
    variant: "bg-white",
    titleColor: "text-black",
    textColor: "text-black/80",
    title: "Discover",
    text: "Find premium sim racing venues, gaming cafes, and esports facilities near you — all in one place, curated for serious drivers.",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&q=80",
  },
  {
    variant: "bg-btn-red",
    titleColor: "text-white",
    textColor: "text-white/80",
    title: "Race",
    text: "Book a rig in seconds, join open sessions, and compete on world-class setups alongside a community of passionate sim racers.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
  },
  {
    variant: "bg-surface-container-low",
    titleColor: "text-white",
    textColor: "text-white/80",
    title: "Experience",
    text: "From walk-in gaming slots to full-motion sim rigs and VR pods — every venue on PitPass is vetted for premium quality.",
    image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80",
  },
];

const venues = [
  {
    name: "Apex Arena",
    tags: ["Sim Racing", "Premium"],
    description:
      "Full-motion Fanatec DD rigs with triple-screen setups and VR pods \u2014 the ultimate sim racing experience in downtown. Premium memberships and walk-in sessions available.",
    image:
      "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
  },
  {
    name: "Grid House",
    tags: ["Racing Lounge"],
    description:
      "Casual and competitive sim racing lounge with Logitech G Pro and Thrustmaster rigs \u2014 open late nights, walk-ins welcome.",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  },
  {
    name: "Pit Lane Club",
    tags: ["VR Esports"],
    description:
      "Esports-grade facility featuring motion platforms, direct-drive wheels, and dedicated VR racing booths for competitive sessions.",
    image:
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&q=80",
  },
  {
    name: "Turbo Bay",
    tags: ["Gaming Cafe"],
    description:
      "Gaming cafe meets racing hub \u2014 grab a drink, pick a rig, and race your friends on any track from F1 to rally cross.",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
  },
  {
    name: "DRS Zone",
    tags: ["Premium Events"],
    description:
      "Private sim racing suites for corporate events, birthday parties, and league nights \u2014 bookable by the hour or full venue.",
    image:
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
  },
  {
    name: "Chicane HQ",
    tags: ["Academy"],
    description:
      "Sim racing academy with coaching sessions, telemetry analysis, and pro-grade equipment \u2014 from beginner to competitive driver.",
    image:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
  },
];

/* ── Arrow SVG reused in nav & footer ── */
function ArrowSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 17 17" fill="none">
      <path
        d="M16.5977 16.1992H14.5977V3.61328L2.55469 15.6562L1.14062 14.2422L13.1836 2.19922H0.597656V0.199219H16.5977V16.1992Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LandingPage() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeVenue, setActiveVenueRaw] = useState(0);
  const [prevVenue, setPrevVenue] = useState<number | null>(null);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const footerLogoRef = useRef<HTMLDivElement>(null);
  const animLock = useRef(false);

  const totalVenues = venues.length;

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (animLock.current) return;
      animLock.current = true;
      const next = ((activeVenue + dir) % totalVenues + totalVenues) % totalVenues;
      setPrevVenue(activeVenue);
      setAnimDir(dir === 1 ? "left" : "right");
      setActiveVenueRaw(next);
      setTimeout(() => {
        setPrevVenue(null);
        setAnimDir(null);
        animLock.current = false;
      }, 720);
    },
    [activeVenue, totalVenues]
  );

  const jumpTo = useCallback(
    (index: number) => {
      if (animLock.current || index === activeVenue) return;
      animLock.current = true;
      const cw = ((index - activeVenue) + totalVenues) % totalVenues;
      const dir = cw <= totalVenues / 2 ? "left" : "right";
      setPrevVenue(activeVenue);
      setAnimDir(dir);
      setActiveVenueRaw(index);
      setTimeout(() => {
        setPrevVenue(null);
        setAnimDir(null);
        animLock.current = false;
      }, 720);
    },
    [activeVenue, totalVenues]
  );

  const next1 = (activeVenue + 1) % totalVenues;
  const next2 = (activeVenue + 2) % totalVenues;

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isDropdownOpen]);

  /* Intersection observer for fade-up animations */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Footer logo color at page bottom */
  useEffect(() => {
    function onScroll() {
      if (!footerLogoRef.current) return;
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 5;
      footerLogoRef.current.classList.toggle("in-view", atBottom);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="font-outfit bg-surface text-on-surface-variant overflow-x-hidden antialiased">
      {/* ═══════ Glass Navigation ═══════ */}
      <nav
        ref={navRef}
        className={`nav-wrapper fixed top-0 left-0 right-0 z-[100] p-4 px-4 sm:px-8 pointer-events-none ${isDropdownOpen ? "nav-open" : ""}`}
      >
        <div className="nav-pill pointer-events-auto max-w-container-lg mx-auto flex items-center justify-between bg-white/5 backdrop-blur-[10px] rounded-full pl-6 pr-4 py-4 transition-all duration-300 ease-in-out">
          <a
            href="#"
            className="nav-logo font-outfit text-[1.75rem] font-bold text-white tracking-[-0.03em]"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            PitPass
          </a>
          <div className="nav-cta relative">
            <button
              className="btn-signin inline-flex items-center gap-2 px-[23px] h-9 bg-btn-red text-white border border-btn-red rounded-full font-outfit text-sm font-medium tracking-[-0.03em] cursor-pointer transition-[0.15s] hover:bg-white hover:text-btn-red hover:border-white active:scale-[0.98]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>Sign In</span>
              <span
                className={`btn-arrow-rotate w-3.5 h-3.5 flex items-center justify-center transition-transform duration-300 ease-in-out`}
              >
                <ArrowSvg />
              </span>
            </button>

            {/* Sign-in dropdown */}
            <div className="signin-dropdown absolute right-0 mt-3 w-fit bg-white/[0.06] backdrop-blur-[20px] rounded-2xl p-1.5 opacity-0 invisible -translate-y-2 transition-all duration-200 ease-in-out pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            href="/login"
            className="flex items-center gap-3 py-2.5 px-3.5 font-outfit text-[0.8rem] font-medium rounded-xl transition-all duration-200 ease-in-out text-on-surface hover:bg-white/[0.06] no-underline"
          >
            <svg className="w-4 h-4 shrink-0 text-btn-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Customer
          </Link>
          <Link
            href="/admin/login"
            className="flex items-center gap-3 py-2.5 px-3.5 font-outfit text-[0.8rem] font-medium rounded-xl transition-all duration-200 ease-in-out text-on-surface-variant/60 hover:bg-white/[0.06] hover:text-on-surface no-underline"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Venue Admin
          </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════ Hero — Tilted Image Grid ═══════ */}
      <section className="hero relative overflow-hidden min-h-screen grid items-center justify-items-center bg-surface">
        {/* Tilted image columns */}
        <div
          className="hero-imgcols absolute inset-0 flex gap-[15px] justify-center origin-center"
          style={{ transform: "rotate(20deg) scale(1.4)" }}
        >
          {heroColumns.map((col, ci) => (
            <div
              key={ci}
              className="hero-imgcols-col flex flex-col gap-[15px] shrink-0 w-[220px]"
            >
              {/* Duplicate images for seamless infinite scroll */}
              {[...col, ...col].map((img, ii) => (
                <img
                  key={ii}
                  src={img}
                  className={`w-full rounded-xl block object-cover ${ii % 3 === 1 ? "h-[220px]" : "h-[280px]"}`}
                  alt=""
                />
              ))}
            </div>
          ))}
        </div>

        {/* Dark overlay */}
        <div className="hero-overlay absolute inset-0 z-[1]" />

        {/* Hero text */}
        <div className="hero-content fade-up relative z-[2] text-center max-w-[800px] px-8">
          <h1
            className="font-outfit font-extrabold leading-[1.02] tracking-[-0.04em] text-white mb-6"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
          >
            Book the Best Sim Racing Rigs in Your City
          </h1>
          <p className="font-outfit text-[1.15rem] leading-[1.7] text-on-surface max-w-[560px] mx-auto mb-10">
            Discover premium gaming venues, reserve a rig in minutes, and race
            on world-class setups near you.
          </p>
          <div className="hero-buttons flex gap-4 flex-wrap justify-center">
            <a
              href="#portfolio"
              className="btn-arrow-icon inline-flex items-center gap-2 px-[23px] h-9 rounded-full font-outfit text-sm font-medium tracking-[-0.03em] transition-[0.15s] border border-transparent cursor-pointer bg-btn-red text-white border-btn-red hover:bg-white hover:text-btn-red hover:border-white active:scale-[0.98]"
            >
              Find a Venue
            </a>
            <a
              href="#about"
              className="inline-flex items-center gap-2 px-[23px] h-9 rounded-full font-outfit text-sm font-medium tracking-[-0.03em] transition-[0.15s] border cursor-pointer bg-transparent text-on-surface-variant border-white/15 hover:bg-white hover:text-[#131313] hover:border-white active:scale-[0.98]"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ About — Cards ═══════ */}
      <section className="py-24 bg-black" id="about">
        <div className="max-w-container mx-auto px-5 sm:px-10">
          <div className="fade-up flex flex-col items-center text-center gap-5 mb-12">
            <span className="font-outfit text-[0.95rem] font-medium text-white tracking-[-0.03em] py-2 px-4 border border-white rounded-full">
              Why PitPass
            </span>
            <h2
              className="font-outfit font-medium text-white leading-none tracking-[-0.03em]"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
            >
              Built for Drivers
            </h2>
          </div>

          <div className="flex gap-10 justify-center max-lg:flex-wrap max-md:flex-col max-md:items-center">
            {aboutCards.map((card) => (
              <div
                key={card.title}
                className={`about-card fade-up rounded-[15px] overflow-hidden flex flex-col relative w-full max-w-[280px] h-[380px] shrink-0 transition-transform duration-[0.4s] ease-in-out ${card.variant}`}
                style={{
                  boxShadow: "inset 0 0 0 1px #131313",
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="about-card-media absolute -inset-px overflow-hidden opacity-0 transition-opacity duration-500 ease-in-out z-[1] rounded-[16px]">
                  <img
                    src={card.image}
                    className="w-full h-full object-cover block"
                    alt=""
                  />
                </div>
                <div className="about-card-inner p-[22px] pt-[40%] flex flex-col justify-between gap-6 flex-1 relative z-[2]">
                  <div
                    className={`card-title font-outfit text-2xl font-medium tracking-[-0.02em] ${card.titleColor}`}
                  >
                    {card.title}
                  </div>
                  <div
                    className={`card-text font-outfit text-sm leading-normal ${card.textColor}`}
                  >
                    {card.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Gaming Venues ═══════ */}
      <section
        className="venues-section overflow-hidden bg-black px-8 py-24"
        id="portfolio"
      >
        <div className="max-w-container-lg mx-auto p-0">
          <div className="fade-up flex justify-between items-end mb-10 flex-wrap gap-5">
            <div>
              <span className="font-outfit text-[0.95rem] font-medium text-white tracking-[-0.03em] py-2 px-4 border border-white rounded-full">
                Venues
              </span>
              <h2 className="font-outfit font-semibold text-white tracking-[-0.03em] mt-3" style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)" }}>
                Gaming Venues
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                className="w-14 h-10 rounded-lg border border-white/20 bg-transparent text-white cursor-pointer flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-white hover:border-white hover:text-black"
                onClick={() => navigate(-1)}
                aria-label="Previous"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                className="w-14 h-10 rounded-lg border border-white/20 bg-transparent text-white cursor-pointer flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-white hover:border-white hover:text-black"
                onClick={() => navigate(1)}
                aria-label="Next"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sliding venue cards */}
          <div className="relative h-[400px] overflow-hidden max-md:h-[340px]">
            {/* Exit layer — current cards slide out */}
            {prevVenue !== null && (
              <div
                key={`cards-exit-${prevVenue}`}
                className={`venues-slide-layer venues-slide-${animDir === "left" ? "exit-left" : "exit-right"}`}
              >
                {venues.map((venue, i) => {
                  const n1 = (prevVenue + 1) % totalVenues;
                  const n2 = (prevVenue + 2) % totalVenues;
                  let sc = "";
                  if (i === prevVenue) sc = "venue-card--active";
                  else if (i === n1) sc = "venue-card--next1";
                  else if (i === n2) sc = "venue-card--next2";
                  return (
                    <div key={venue.name} className={`venue-card rounded-[15px] overflow-hidden relative border border-white/25 ${sc}`}>
                      <div className="venue-card-media absolute inset-0 opacity-0">
                        <img src={venue.image} className="w-full h-full object-cover" alt={venue.name} />
                      </div>
                      <div className="venue-card-inner relative z-[2] p-6 w-full h-full flex flex-col justify-between">
                        <div className="venue-card-header flex justify-between items-start gap-3">
                          <div className="venue-card-title font-outfit text-2xl font-bold text-white tracking-[-0.02em]">{venue.name}</div>
                          <div className="venue-card-tags hidden gap-2">
                            {venue.tags.map((tag) => (
                              <span key={tag} className="text-[0.7rem] py-[5px] px-3.5 whitespace-nowrap font-outfit font-medium text-white tracking-[-0.03em] border border-white/15 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="venue-card-bottom hidden">
                          <p className="font-outfit text-[0.85rem] leading-[1.65] text-white max-w-[420px]">{venue.description}</p>
                          <Link href="/explore" className="venue-card-action inline-flex items-center gap-1.5 font-outfit text-[0.8rem] font-semibold text-white mt-4 transition-[gap] duration-300 ease-in-out hover:gap-2.5 no-underline">View Venue</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enter layer — new cards slide in */}
            <div
              key={`cards-enter-${activeVenue}`}
              className={`venues-slide-layer ${prevVenue !== null ? `venues-slide-${animDir === "left" ? "enter-right" : "enter-left"}` : ""}`}
            >
              {venues.map((venue, i) => {
                let sc = "";
                if (i === activeVenue) sc = "venue-card--active";
                else if (i === next1) sc = "venue-card--next1";
                else if (i === next2) sc = "venue-card--next2";
                return (
                  <div
                    key={venue.name}
                    className={`venue-card rounded-[15px] overflow-hidden relative border border-white/25 cursor-pointer ${sc}`}
                    onClick={() => jumpTo(i)}
                  >
                    <div className="venue-card-media absolute inset-0 opacity-0">
                      <img src={venue.image} className="w-full h-full object-cover" alt={venue.name} />
                    </div>
                    <div className="venue-card-inner relative z-[2] p-6 w-full h-full flex flex-col justify-between">
                      <div className="venue-card-header flex justify-between items-start gap-3">
                        <div className="venue-card-title font-outfit text-2xl font-bold text-white tracking-[-0.02em]">{venue.name}</div>
                        <div className="venue-card-tags hidden gap-2">
                          {venue.tags.map((tag) => (
                            <span key={tag} className="text-[0.7rem] py-[5px] px-3.5 whitespace-nowrap font-outfit font-medium text-white tracking-[-0.03em] border border-white/15 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="venue-card-bottom hidden">
                        <p className="font-outfit text-[0.85rem] leading-[1.65] text-white max-w-[420px]">{venue.description}</p>
                        <Link href="/explore" className="venue-card-action inline-flex items-center gap-1.5 font-outfit text-[0.8rem] font-semibold text-white mt-4 transition-[gap] duration-300 ease-in-out hover:gap-2.5 no-underline">View Venue</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════ Footer ═══════ */}
      <footer className="bg-black pt-28 pb-4">
        <div className="max-w-container-lg mx-auto px-8">
          <div className="grid grid-cols-6 gap-x-3 gap-y-0 max-md:grid-cols-2 max-md:gap-x-4 max-md:gap-y-8 max-[480px]:grid-cols-1">
            {/* Newsletter */}
            <div className="col-span-2 max-md:col-span-full">
              <div className="font-outfit text-xl font-medium text-white mb-6">
                Get the Latest Moves
              </div>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mb-3">
                  <input
                    type="email"
                    placeholder="Enter Email"
                    className="w-full py-3.5 px-5 bg-transparent border border-on-surface rounded-full text-white font-outfit text-[0.9rem] outline-none transition-colors duration-300 ease-in-out placeholder:text-white/40 focus:border-primary-container"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-btn-red border-none text-white font-outfit text-sm font-medium cursor-pointer py-3 px-6 rounded-full transition-all duration-300 ease-in-out hover:bg-white hover:text-black"
                  >
                    <span>Subscribe</span>
                    <ArrowSvg />
                  </button>
                </div>
              </form>
            </div>

            {/* Socials */}
            <div className="col-start-4 col-span-2 max-md:col-span-1 max-md:col-start-auto max-[480px]:col-span-full">
              <div className="font-outfit text-xl font-medium text-white mb-6">
                Socials
              </div>
              <ul className="footer-nav-list list-none p-0 m-0">
                <li className="mb-3">
                  <a
                    href="#"
                    className="font-outfit text-[1.1rem] text-on-surface no-underline relative inline-block"
                  >
                    X
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="#"
                    className="font-outfit text-[1.1rem] text-on-surface no-underline relative inline-block"
                  >
                    Instagram
                  </a>
                </li>
                <li className="mb-3">
                  <a
                    href="#"
                    className="font-outfit text-[1.1rem] text-on-surface no-underline relative inline-block"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>

            {/* Large Logo */}
            <div
              ref={footerLogoRef}
              className="footer-logo-large col-span-full pt-16 pb-4 max-w-container-lg"
              style={{ width: "calc(100% + 4rem)", marginLeft: "-2rem" }}
            >
              <span
                className="footer-logo-text block font-outfit font-black tracking-[-0.04em] leading-none text-white whitespace-nowrap w-full transition-colors duration-[0.8s] ease-in-out"
                style={{ fontSize: "clamp(5rem, 12vw, 12rem)" }}
              >
                PitPass
              </span>
            </div>

            {/* Copyright */}
            <div className="col-span-full font-outfit text-[0.8rem] text-on-surface ml-0 sm:ml-[-2rem]">
              &copy;{new Date().getFullYear()} All Rights Reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

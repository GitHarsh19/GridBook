"use client";

import { useState, useRef } from "react";
import {
  MapPin,
  ChevronDown,
  ArrowLeft,
  Clock,
  Zap,
  Monitor,
  X,
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────────── */

interface Venue {
  id: number;
  name: string;
  location: string;
  price: number;
  availableRigs: number;
  totalRigs: number;
  description: string;
  rigs: Rig[];
}

interface Rig {
  id: number;
  name: string;
  status: "available" | "booked";
  specs: string;
}

const TIME_SLOTS = [
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "1:00 PM – 2:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
  "6:00 PM – 7:00 PM",
  "7:00 PM – 8:00 PM",
  "8:00 PM – 9:00 PM",
  "9:00 PM – 10:00 PM",
];

const VENUES: Venue[] = [
  {
    id: 1,
    name: "Apex Racing Lounge",
    location: "HSR Layout",
    price: 500,
    availableRigs: 3,
    totalRigs: 8,
    description: "Premium sim racing experience with Fanatec DD setups and triple-screen immersion.",
    rigs: [
      { id: 1, name: "Rig 1", status: "available", specs: "Fanatec DD Pro · Triple 27\"" },
      { id: 2, name: "Rig 2", status: "booked", specs: "Fanatec DD Pro · Triple 27\"" },
      { id: 3, name: "Rig 3", status: "available", specs: "Fanatec CSL DD · Ultrawide 34\"" },
      { id: 4, name: "Rig 4", status: "available", specs: "Fanatec CSL DD · Ultrawide 34\"" },
      { id: 5, name: "Rig 5", status: "booked", specs: "Logitech G Pro · Single 32\"" },
      { id: 6, name: "Rig 6", status: "booked", specs: "Logitech G Pro · Single 32\"" },
      { id: 7, name: "Rig 7", status: "available", specs: "Thrustmaster T300 · VR Headset" },
      { id: 8, name: "Rig 8", status: "booked", specs: "Thrustmaster T300 · VR Headset" },
    ],
  },
  {
    id: 2,
    name: "Clutch Gaming Arena",
    location: "Koramangala",
    price: 600,
    availableRigs: 5,
    totalRigs: 6,
    description: "High-end gaming café with professional-grade sim rigs and VR setups.",
    rigs: [
      { id: 1, name: "Rig 1", status: "available", specs: "Fanatec DD1 · Triple 32\"" },
      { id: 2, name: "Rig 2", status: "available", specs: "Fanatec DD1 · Triple 32\"" },
      { id: 3, name: "Rig 3", status: "available", specs: "Fanatec CSL DD · Ultrawide 34\"" },
      { id: 4, name: "Rig 4", status: "booked", specs: "Logitech G923 · Single 27\"" },
      { id: 5, name: "Rig 5", status: "available", specs: "Logitech G923 · Single 27\"" },
      { id: 6, name: "Rig 6", status: "available", specs: "Thrustmaster T-GT II · VR" },
    ],
  },
  {
    id: 3,
    name: "Pole Position Hub",
    location: "Indiranagar",
    price: 450,
    availableRigs: 2,
    totalRigs: 6,
    description: "Neighbourhood sim racing spot with solid mid-range setups and AC gaming.",
    rigs: [
      { id: 1, name: "Rig 1", status: "available", specs: "Logitech G Pro · Triple 24\"" },
      { id: 2, name: "Rig 2", status: "booked", specs: "Logitech G Pro · Triple 24\"" },
      { id: 3, name: "Rig 3", status: "booked", specs: "Logitech G923 · Single 27\"" },
      { id: 4, name: "Rig 4", status: "booked", specs: "Logitech G923 · Single 27\"" },
      { id: 5, name: "Rig 5", status: "available", specs: "Thrustmaster T300 · Ultrawide" },
      { id: 6, name: "Rig 6", status: "booked", specs: "Thrustmaster T300 · Ultrawide" },
    ],
  },
  {
    id: 4,
    name: "DRS Zone Lounge",
    location: "Whitefield",
    price: 550,
    availableRigs: 4,
    totalRigs: 7,
    description: "Modern racing lounge with motion rigs and competitive league nights.",
    rigs: [
      { id: 1, name: "Rig 1", status: "available", specs: "Fanatec DD Pro · Motion Rig" },
      { id: 2, name: "Rig 2", status: "available", specs: "Fanatec DD Pro · Motion Rig" },
      { id: 3, name: "Rig 3", status: "booked", specs: "Fanatec CSL DD · Triple 27\"" },
      { id: 4, name: "Rig 4", status: "available", specs: "Fanatec CSL DD · Triple 27\"" },
      { id: 5, name: "Rig 5", status: "booked", specs: "Logitech G Pro · Single 32\"" },
      { id: 6, name: "Rig 6", status: "available", specs: "Logitech G Pro · Single 32\"" },
      { id: 7, name: "Rig 7", status: "booked", specs: "Thrustmaster T818 · VR Headset" },
    ],
  },
];

/* ─── Components ───────────────────────────────────────────────────── */

function Navbar({
  onLocationClick,
}: {
  onLocationClick?: () => void;
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-500" />
          <span className="text-lg font-bold tracking-tight text-white">
            Grid<span className="text-cyan-500">Book</span>
          </span>
        </div>

        {/* Location selector */}
        <button
          onClick={onLocationClick}
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <MapPin className="h-3.5 w-3.5 text-cyan-500" />
          Bengaluru
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        </button>
      </div>
    </nav>
  );
}

function VenueCard({
  venue,
  onClick,
}: {
  venue: Venue;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-0 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/80 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
    >
      {/* Image placeholder */}
      <div className="flex h-36 items-center justify-center rounded-t-lg bg-zinc-800/60">
        <Monitor className="h-10 w-10 text-zinc-600" />
      </div>

      <div className="p-4">
        {/* Venue name */}
        <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {venue.name}
        </h3>

        {/* Location */}
        <div className="mt-1 flex items-center gap-1 text-sm text-zinc-400">
          <MapPin className="h-3 w-3" />
          {venue.location}
        </div>

        {/* Price + availability */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            ₹{venue.price}
            <span className="text-zinc-500">/hr</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${venue.availableRigs > 0
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
              }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${venue.availableRigs > 0 ? "bg-emerald-400" : "bg-red-400"
                }`}
            />
            {venue.availableRigs > 0
              ? `${venue.availableRigs} Rigs Available`
              : "Fully Booked"}
          </span>
        </div>
      </div>
    </button>
  );
}

function TimeSelector({
  selectedSlots,
  onToggle,
  onClear,
}: {
  selectedSlots: string[];
  onToggle: (slot: string) => void;
  onClear: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Clock className="h-4 w-4" />
        Select Time Slots
        {selectedSlots.length > 0 && (
          <button
            onClick={onClear}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <X className="h-3 w-3" />
            Clear Selection
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-2 overflow-x-auto pb-2 pr-4"
      >
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlots.includes(slot);
          return (
            <button
              key={slot}
              onClick={() => onToggle(slot)}
              className={`shrink-0 cursor-pointer rounded-md border px-4 py-2.5 text-sm font-medium transition-all ${isSelected
                ? "border-cyan-500 bg-cyan-500 text-black"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RigGrid({
  rigs,
  selectedRigs,
  onToggle,
  onClear,
}: {
  rigs: Rig[];
  selectedRigs: number[];
  onToggle: (id: number) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Monitor className="h-4 w-4" />
        Select Rigs
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-zinc-700" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-cyan-500" />
          Selected
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-zinc-800" />
          Booked
        </div>
        {selectedRigs.length > 0 && (
          <button
            onClick={onClear}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <X className="h-3 w-3" />
            Clear Selection
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {rigs.map((rig) => {
          const isSelected = selectedRigs.includes(rig.id);
          const isBooked = rig.status === "booked";

          return (
            <button
              key={rig.id}
              disabled={isBooked}
              onClick={() => onToggle(rig.id)}
              className={`relative flex min-h-[90px] flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${isBooked
                ? "cursor-not-allowed border-zinc-800/50 bg-zinc-800/40 text-zinc-600"
                : isSelected
                  ? "cursor-pointer border-cyan-500 bg-cyan-500 text-black shadow-lg shadow-cyan-500/10"
                  : "cursor-pointer border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-cyan-500/50 hover:bg-zinc-800/80"
                }`}
            >
              <Monitor
                className={`mb-1.5 h-5 w-5 ${isBooked
                  ? "text-zinc-700"
                  : isSelected
                    ? "text-black"
                    : "text-zinc-500"
                  }`}
              />
              <span className="text-sm font-semibold">{rig.name}</span>
              <span
                className={`mt-0.5 text-[10px] leading-tight ${isBooked
                  ? "text-zinc-700"
                  : isSelected
                    ? "text-black/70"
                    : "text-zinc-500"
                  }`}
              >
                {rig.specs}
              </span>
              {isBooked && (
                <div className="absolute right-1.5 top-1.5">
                  <X className="h-3 w-3 text-zinc-700" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckoutBar({
  selectedRigs,
  selectedSlots,
  rigs,
  price,
}: {
  selectedRigs: number[];
  selectedSlots: string[];
  rigs: Rig[];
  price: number;
}) {
  if (selectedRigs.length === 0) return null;

  const selectedNames = selectedRigs
    .map((id) => rigs.find((r) => r.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const slotCount = Math.max(selectedSlots.length, 1);
  const total = selectedRigs.length * price * slotCount;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <div className="text-zinc-400">
            Selected:{" "}
            <span className="font-medium text-white">{selectedNames}</span>
            {selectedSlots.length > 0 && (
              <span className="text-zinc-500">
                {" "}· {slotCount} {slotCount === 1 ? "slot" : "slots"}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-lg font-bold text-white">
            Total: ₹{total.toLocaleString("en-IN")}
          </div>
        </div>
        <button className="w-full rounded-lg bg-cyan-500 px-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-cyan-400 active:scale-[0.98] sm:w-auto">
          Pay via UPI to Lock Slots
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */

type View = "discovery" | "booking";

export default function HomePage() {
  const [view, setView] = useState<View>("discovery");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedRigs, setSelectedRigs] = useState<number[]>([]);

  const openVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setSelectedRigs([]);
    setSelectedTimeSlots([]);
    setView("booking");
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setView("discovery");
    setSelectedVenue(null);
    setSelectedRigs([]);
    setSelectedTimeSlots([]);
  };

  const toggleTimeSlot = (slot: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  const toggleRig = (rigId: number) => {
    setSelectedRigs((prev) =>
      prev.includes(rigId)
        ? prev.filter((id) => id !== rigId)
        : [...prev, rigId]
    );
  };

  /* ── Discovery View ─── */
  if (view === "discovery") {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Nearby Venues
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {VENUES.length} venues in Bengaluru
            </p>
          </div>

          {/* Venue grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {VENUES.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onClick={() => openVenue(venue)}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* ── Booking View ─── */
  if (view === "booking" && selectedVenue) {
    return (
      <div className={`min-h-screen bg-zinc-950 ${selectedRigs.length > 0 ? "pb-36" : ""}`}>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6">
          {/* Back + Header */}
          <button
            onClick={goBack}
            className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to venues
          </button>

          <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="text-lg font-bold text-white">
              {selectedVenue.name}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
              <MapPin className="h-3 w-3" />
              {selectedVenue.location}
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {selectedVenue.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="font-medium text-white">
                ₹{selectedVenue.price}
                <span className="text-zinc-500">/hr per rig</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedVenue.availableRigs > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
                  }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${selectedVenue.availableRigs > 0
                    ? "bg-emerald-400"
                    : "bg-red-400"
                    }`}
                />
                {selectedVenue.availableRigs} of {selectedVenue.totalRigs} Available
              </span>
            </div>
          </div>

          {/* Time selector */}
          <div className="mb-6">
            <TimeSelector
              selectedSlots={selectedTimeSlots}
              onToggle={toggleTimeSlot}
              onClear={() => setSelectedTimeSlots([])}
            />
          </div>

          {/* Rig grid */}
          <RigGrid
            rigs={selectedVenue.rigs}
            selectedRigs={selectedRigs}
            onToggle={toggleRig}
            onClear={() => setSelectedRigs([])}
          />
        </main>

        {/* Checkout bar */}
        <CheckoutBar
          selectedRigs={selectedRigs}
          selectedSlots={selectedTimeSlots}
          rigs={selectedVenue.rigs}
          price={selectedVenue.price}
        />
      </div>
    );
  }

  return null;
}

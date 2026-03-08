import { Navbar } from "@/components/Navbar";
import { VenueCard } from "@/components/VenueCard";
import { VENUES } from "@/lib/data";

export default function HomePage() {
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
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </main>
    </div>
  );
}

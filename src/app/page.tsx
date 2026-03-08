import { Navbar } from "@/components/Navbar";
import { VenueCard } from "@/components/VenueCard";
import { getVenues } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const venues = await getVenues();

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
            {venues.length} venues in Bengaluru
          </p>
        </div>

        {/* Venue grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getVenueById } from "@/lib/data";
import BookingClient from "./BookingClient";

export const dynamic = "force-dynamic";

export default async function VenueBookingPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const venue = await getVenueById(Number(id));

    if (!venue) {
        return (
            <div className="min-h-screen bg-zinc-950">
                <Navbar />
                <main className="mx-auto max-w-5xl px-4 py-16 text-center">
                    <h1 className="text-xl font-bold text-white">Venue not found</h1>
                    <Link
                        href="/explore"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-cyan-500 hover:text-cyan-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to venues
                    </Link>
                </main>
            </div>
        );
    }

    return <BookingClient venue={venue} />;
}

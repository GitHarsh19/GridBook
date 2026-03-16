"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getVenues, getVenueById, type Venue } from "@/lib/data";

const POLL_INTERVAL = 45_000;

/**
 * Real-time venue list for the explore page.
 * Subscribes to all rig changes + 45s polling fallback.
 */
export function useRealtimeVenues() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadVenues = useCallback(async () => {
        try {
            const data = await getVenues();
            setVenues(data);
            setError(null);
        } catch {
            setError("Failed to load venues. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadVenues();

        const channel = supabase
            .channel("customer-explore-rigs")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "rigs" },
                () => loadVenues(),
            )
            .subscribe();

        const interval = setInterval(loadVenues, POLL_INTERVAL);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [loadVenues]);

    return { venues, isLoading, error, refetch: loadVenues };
}

/**
 * Real-time single venue for the booking page.
 * Subscribes to rig changes scoped by venue_id + 45s polling fallback.
 */
export function useRealtimeVenue(id: number) {
    const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadVenue = useCallback(async () => {
        if (!id || isNaN(id)) {
            setVenue(null);
            setIsLoading(false);
            return;
        }
        try {
            const data = await getVenueById(id);
            setVenue(data);
            setError(null);
        } catch {
            setError("Failed to load venue.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadVenue();

        const channel = supabase
            .channel(`customer-venue-${id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "rigs",
                    filter: `venue_id=eq.${id}`,
                },
                () => loadVenue(),
            )
            .subscribe();

        const interval = setInterval(loadVenue, POLL_INTERVAL);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [id, loadVenue]);

    return { venue, isLoading, error };
}

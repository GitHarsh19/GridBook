"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getVenues, getVenueById, type Venue } from "@/lib/data";

const POLL_INTERVAL = 10_000;

/**
 * Real-time venue list for the explore page.
 * Subscribes to all rig changes; polling fallback activates only when
 * the real-time channel is not connected.
 */
export function useRealtimeVenues() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const realtimeConnected = useRef(false);

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

    const startPolling = useCallback(() => {
        if (intervalRef.current) return; // already polling
        intervalRef.current = setInterval(loadVenues, POLL_INTERVAL);
    }, [loadVenues]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "venues" },
                () => loadVenues(),
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    realtimeConnected.current = true;
                    stopPolling();
                } else {
                    realtimeConnected.current = false;
                    startPolling();
                }
            });

        // Start polling initially until real-time connects
        startPolling();

        return () => {
            supabase.removeChannel(channel);
            stopPolling();
        };
    }, [loadVenues, startPolling, stopPolling]);

    return { venues, isLoading, error, refetch: loadVenues };
}

/**
 * Real-time single venue for the booking page.
 * Subscribes to rig changes scoped by venue_id; polling fallback activates
 * only when the real-time channel is not connected.
 */
export function useRealtimeVenue(id: number) {
    const [venue, setVenue] = useState<Venue | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const realtimeConnected = useRef(false);

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

    const startPolling = useCallback(() => {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(loadVenue, POLL_INTERVAL);
    }, [loadVenue]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

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
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    realtimeConnected.current = true;
                    stopPolling();
                } else {
                    realtimeConnected.current = false;
                    startPolling();
                }
            });

        // Start polling initially until real-time connects
        startPolling();

        return () => {
            supabase.removeChannel(channel);
            stopPolling();
        };
    }, [id, loadVenue, startPolling, stopPolling]);

    return { venue, isLoading, error };
}

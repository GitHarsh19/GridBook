"use client";

import { useState, useCallback, useRef } from "react";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;     // 1 minute window
const COOLDOWN_MS = 30_000;   // 30 second lockout

/**
 * Client-side rate limiter for auth forms.
 * Blocks further attempts after MAX_ATTEMPTS within WINDOW_MS,
 * then enforces a COOLDOWN_MS lockout.
 */
export function useRateLimit() {
    const attempts = useRef<number[]>([]);
    const [blocked, setBlocked] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const recordAttempt = useCallback(() => {
        const now = Date.now();
        // Prune attempts outside the window
        attempts.current = attempts.current.filter((t) => now - t < WINDOW_MS);
        attempts.current.push(now);

        if (attempts.current.length >= MAX_ATTEMPTS) {
            setBlocked(true);
            let remaining = COOLDOWN_MS / 1000;
            setCooldownSeconds(remaining);

            timerRef.current = setInterval(() => {
                remaining -= 1;
                setCooldownSeconds(remaining);
                if (remaining <= 0) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    setBlocked(false);
                    setCooldownSeconds(0);
                    attempts.current = [];
                }
            }, 1000);
        }
    }, []);

    return { blocked, cooldownSeconds, recordAttempt };
}

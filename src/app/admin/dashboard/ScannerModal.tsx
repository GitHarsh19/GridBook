"use client";

import { useState, useRef, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
    X,
    Camera,
    CameraOff,
    AlertTriangle,
    Loader2,
    UserCheck,
    Clock,
    Monitor,
    CalendarDays,
    ShieldCheck,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { checkInRig } from "@/lib/data";
import { toast } from "sonner";

/* ─── UUID v4 validation ──────────────────────────────────────────── */

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
    return UUID_RE.test(value.trim());
}

/* ─── Scanned booking details ─────────────────────────────────────── */

interface ScannedBooking {
    id: number;
    rig_id: number;
    rig_name: string;
    customer_name: string;
    time_slot: string;
    booking_date: string;
    verification_code: string;
    token: string;
}

/* ─── Props ───────────────────────────────────────────────────────── */

interface ScannerModalProps {
    onClose: () => void;
    onCheckIn: () => void;
}

export function ScannerModal({ onClose, onCheckIn }: ScannerModalProps) {
    const [paused, setPaused] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scannedBooking, setScannedBooking] =
        useState<ScannedBooking | null>(null);
    const lastScannedRef = useRef<string | null>(null);

    /* ── Resume scanner (back to scanning state) ── */
    const resume = useCallback(() => {
        setPaused(false);
        setProcessing(false);
        setScannedBooking(null);
        lastScannedRef.current = null;
    }, []);

    /* ── Step 1: Scan → fetch & validate → show details ── */
    const handleScan = useCallback(
        async (detectedCodes: { rawValue: string }[]) => {
            if (paused || processing) return;

            const raw = detectedCodes?.[0]?.rawValue?.trim();
            if (!raw) return;

            if (raw === lastScannedRef.current) return;
            lastScannedRef.current = raw;

            setPaused(true);
            setProcessing(true);

            /* ── Edge Case 2: Invalid QR format ── */
            if (!isValidUUID(raw)) {
                toast.error(
                    "Invalid QR format. This is not a GridBook ticket.",
                );
                resume();
                return;
            }

            try {
                const { data: booking, error: fetchError } =
                    await supabaseAdmin
                        .from("bookings")
                        .select(
                            "id, rig_id, status, customer_name, time_slot, booking_date, verification_code, rigs(name)",
                        )
                        .eq("check_in_token", raw)
                        .maybeSingle();

                if (fetchError) throw fetchError;

                if (!booking) {
                    toast.error("No booking found for this QR code.");
                    resume();
                    return;
                }

                /* ── Edge Case 3: Already checked in ── */
                if (booking.status === "checked_in") {
                    toast.warning(
                        "Ticket already scanned! Customer is already checked in.",
                    );
                    resume();
                    return;
                }

                /* ── Edge Case 4: Cancelled booking ── */
                if (booking.status === "cancelled") {
                    toast.error(
                        "Booking is cancelled. Do not grant access.",
                    );
                    resume();
                    return;
                }

                /* ── Show details for admin review ── */
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rigs = booking.rigs as any;
                setScannedBooking({
                    id: booking.id,
                    rig_id: booking.rig_id,
                    rig_name: rigs?.name ?? `Rig ${booking.rig_id}`,
                    customer_name: booking.customer_name,
                    time_slot: booking.time_slot,
                    booking_date: booking.booking_date,
                    verification_code: booking.verification_code,
                    token: raw,
                });
                setProcessing(false);
            } catch {
                /* ── Edge Case 5: Network failure ── */
                toast.error("Connection error. Please try scanning again.");
                resume();
            }
        },
        [paused, processing, resume],
    );

    /* ── Step 2: Admin confirms → update DB ── */
    const handleConfirmCheckIn = useCallback(async () => {
        if (!scannedBooking) return;
        setConfirming(true);

        try {
            // Use checkInRig which validates the time slot, updates rig to "in_use",
            // and sets booking status + blocked_until for auto-release
            const result = await checkInRig(
                scannedBooking.rig_id,
                scannedBooking.id,
                scannedBooking.time_slot,
                scannedBooking.booking_date,
            );
            if (!result.success) {
                toast.error(result.error || "Check-in failed.");
                setConfirming(false);
                return;
            }

            toast.success(
                `${scannedBooking.customer_name} checked in — ${scannedBooking.rig_name}`,
            );
            onCheckIn();
            onClose();
        } catch {
            toast.error("Connection error. Please try scanning again.");
            setConfirming(false);
        }
    }, [scannedBooking, onCheckIn, onClose]);

    /* ── Edge Case 1: Camera hardware / permission errors ── */
    const handleError = useCallback((error: unknown) => {
        const err = error as Error;
        const name = err?.name ?? "";
        if (name === "NotAllowedError" || name === "NotFoundError") {
            setCameraError(
                "Camera access denied. Please enable permissions in your browser settings.",
            );
        } else {
            setCameraError(
                "Camera access denied. Please enable permissions in your browser settings.",
            );
        }
    }, []);

    /* ── Format booking date for display ── */
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <Camera className="h-4.5 w-4.5 text-btn-red" />
                        <h2 className="text-sm font-bold tracking-tight text-white">
                            {scannedBooking
                                ? "Verify Customer Identity"
                                : "Scan Check-In QR"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {scannedBooking ? (
                    /* ── Step 2: Booking details for admin review ── */
                    <div className="p-5">
                        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                            <div className="mb-4 flex items-center gap-2.5">
                                <ShieldCheck className="h-5 w-5 text-amber-400" />
                                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                                    Verify before check-in
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                                            Customer Name
                                        </p>
                                        <p className="text-base font-bold text-white">
                                            {scannedBooking.customer_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                                            Rig
                                        </p>
                                        <p className="text-sm font-semibold text-white">
                                            {scannedBooking.rig_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                                            Date
                                        </p>
                                        <p className="text-sm text-zinc-300">
                                            {formatDate(
                                                scannedBooking.booking_date,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                                            Time Slot
                                        </p>
                                        <p className="text-sm text-zinc-300">
                                            {scannedBooking.time_slot}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-lg bg-zinc-900 px-3 py-2">
                                <p className="font-mono text-xs text-primary">
                                    {scannedBooking.verification_code}
                                </p>
                            </div>
                        </div>

                        <p className="mb-4 text-center text-[11px] text-zinc-500">
                            Ask the customer for a photo ID to confirm their
                            identity before checking in.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={resume}
                                disabled={confirming}
                                className="flex-1 cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={handleConfirmCheckIn}
                                disabled={confirming}
                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50"
                            >
                                {confirming ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UserCheck className="h-4 w-4" />
                                )}
                                {confirming ? "Checking in…" : "Confirm Check-In"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Step 1: Camera scanner ── */
                    <>
                        <div className="relative aspect-square w-full bg-black">
                            {cameraError ? (
                                <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                                    <CameraOff className="h-10 w-10 text-zinc-600" />
                                    <p className="text-sm text-zinc-400">
                                        {cameraError}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Scanner
                                        onScan={handleScan}
                                        onError={handleError}
                                        paused={paused}
                                        formats={["qr_code"]}
                                        components={{
                                            finder: true,
                                        }}
                                        styles={{
                                            container: {
                                                width: "100%",
                                                height: "100%",
                                            },
                                            video: {
                                                objectFit: "cover",
                                            },
                                        }}
                                    />

                                    {processing && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 animate-spin text-btn-red" />
                                                <p className="text-sm font-medium text-zinc-300">
                                                    Verifying ticket…
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2 border-t border-zinc-800 px-5 py-3">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                            <p className="text-[11px] text-zinc-500">
                                Point the camera at the customer&apos;s QR code
                                to check them in.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

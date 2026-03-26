"use client";

import { QRCodeSVG } from "qrcode.react";
import { AlertCircle } from "lucide-react";

interface TicketQRProps {
    checkInToken: string | null | undefined;
}

export function TicketQR({ checkInToken }: TicketQRProps) {
    if (!checkInToken) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
                <AlertCircle className="h-8 w-8 text-amber-400" />
                <p className="text-sm font-medium text-zinc-300">
                    Ticket processing. Please refresh.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="rounded-xl bg-white p-4">
                <QRCodeSVG
                    value={checkInToken}
                    size={200}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                />
            </div>
            <p className="text-xs text-zinc-500">
                Present this QR code to the venue staff.
            </p>
        </div>
    );
}

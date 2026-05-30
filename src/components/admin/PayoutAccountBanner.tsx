"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Wallet } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { getMyPayoutAccountAction, saveRazorpayAccountAction } from "@/app/actions/onboarding";

/**
 * Prompts a venue owner to connect their Razorpay payout account so customers
 * can pay them. Renders a slim confirmation once connected. Self-contained:
 * fetches and saves via the onboarding server actions.
 */
export function PayoutAccountBanner() {
    const [accountId, setAccountId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const getToken = async () => {
        const { data } = await supabaseAdmin.auth.getSession();
        return data.session?.access_token || "";
    };

    useEffect(() => {
        (async () => {
            const token = await getToken();
            if (!token) return setLoading(false);
            const result = await getMyPayoutAccountAction(token);
            setAccountId(result.accountId);
            setLoading(false);
        })();
    }, []);

    const handleSave = async () => {
        setError("");
        setSaving(true);
        const token = await getToken();
        const result = await saveRazorpayAccountAction(token, input);
        setSaving(false);
        if (result.success) {
            setAccountId(input.trim());
            setInput("");
        } else {
            setError(result.error ?? "Could not save.");
        }
    };

    if (loading) return null;

    if (accountId) {
        return (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-500/[0.08] px-4 py-2.5 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Payouts connected
                <span className="font-mono text-xs text-emerald-400/70">{accountId}</span>
            </div>
        );
    }

    return (
        <div className="mb-4 rounded-2xl bg-surface-container p-4" style={{ border: "1px solid rgba(226,56,56,0.25)" }}>
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                <Wallet className="h-4 w-4 text-btn-red" />
                Connect your payout account
            </div>
            <p className="mt-1 text-xs text-on-surface-variant/60">
                Add your Razorpay linked-account id (acc_…) so payouts go directly to you. Until then, online payments collect in the platform account.
            </p>
            {error && <p className="mt-2 text-xs text-btn-red">{error}</p>}
            <div className="mt-3 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(""); }}
                    placeholder="acc_XXXXXXXXXXXX"
                    className="w-full rounded-full border border-on-surface bg-transparent px-4 py-2 font-mono text-xs text-white placeholder:text-white/30 outline-none focus:border-primary-container"
                />
                <button
                    onClick={handleSave}
                    disabled={saving || !input.trim()}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-btn-red px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-60"
                >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Save
                </button>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Loader2,
    Check,
    AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Name update state
    const [nameInput, setNameInput] = useState("");
    const [nameSaving, setNameSaving] = useState(false);
    const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Password update state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            setEmail(session.user.email ?? "");

            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", session.user.id)
                .single();

            const name = profile?.full_name ?? "";
            setFullName(name);
            setNameInput(name);
        } catch {
            // ignored
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleNameSave = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed) {
            setNameMsg({ type: "error", text: "Name cannot be empty." });
            setTimeout(() => setNameMsg(null), 3000);
            return;
        }
        if (trimmed === fullName) return;

        setNameSaving(true);
        setNameMsg(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from("profiles")
                .update({ full_name: trimmed })
                .eq("id", session.user.id);

            if (error) {
                setNameMsg({ type: "error", text: "Failed to update name." });
            } else {
                setFullName(trimmed);
                setNameMsg({ type: "success", text: "Name updated." });
            }
            setTimeout(() => setNameMsg(null), 3000);
        } catch {
            setNameMsg({ type: "error", text: "Something went wrong." });
            setTimeout(() => setNameMsg(null), 3000);
        } finally {
            setNameSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setPwMsg(null);

        if (newPassword.length < 6) {
            setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
            setTimeout(() => setPwMsg(null), 4000);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: "error", text: "Passwords do not match." });
            setTimeout(() => setPwMsg(null), 4000);
            return;
        }

        setPwSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setPwMsg({ type: "error", text: error.message });
            } else {
                setPwMsg({ type: "success", text: "Password updated successfully." });
                setNewPassword("");
                setConfirmPassword("");
            }
            setTimeout(() => setPwMsg(null), 4000);
        } catch {
            setPwMsg({ type: "error", text: "Something went wrong." });
            setTimeout(() => setPwMsg(null), 4000);
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            <Navbar />
            <main className="mx-auto max-w-lg px-4 py-6">
                <Link
                    href="/explore"
                    className="mb-6 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to venues
                </Link>

                <h1 className="mb-6 text-xl font-bold text-white">My Profile</h1>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Email (read-only) */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
                                <Mail className="h-4 w-4" />
                                Email
                            </label>
                            <div className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                                {email || "No email"}
                            </div>
                            <p className="mt-1.5 text-xs text-zinc-600">
                                Email cannot be changed here.
                            </p>
                        </div>

                        {/* Full name */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
                                <User className="h-4 w-4" />
                                Full Name
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
                                    placeholder="Your name"
                                />
                                <button
                                    onClick={handleNameSave}
                                    disabled={nameSaving || nameInput.trim() === fullName}
                                    className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {nameSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    Save
                                </button>
                            </div>
                            {nameMsg && (
                                <p className={`mt-2 flex items-center gap-1 text-xs ${nameMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                                    {nameMsg.type === "success" ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <AlertCircle className="h-3 w-3" />
                                    )}
                                    {nameMsg.text}
                                </p>
                            )}
                        </div>

                        {/* Change password */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                                <Lock className="h-4 w-4" />
                                Change Password
                            </label>
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
                                    placeholder="New password"
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-500/50"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={pwSaving || !newPassword}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {pwSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Lock className="h-4 w-4" />
                                    )}
                                    Update Password
                                </button>
                            </div>
                            {pwMsg && (
                                <p className={`mt-2 flex items-center gap-1 text-xs ${pwMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                                    {pwMsg.type === "success" ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <AlertCircle className="h-3 w-3" />
                                    )}
                                    {pwMsg.text}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

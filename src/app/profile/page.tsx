"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const inputClass =
    "w-full rounded-full border border-on-surface bg-transparent px-5 py-3.5 font-outfit text-[0.9rem] text-white placeholder:text-white/40 outline-none transition-colors duration-300 ease-in-out focus:border-primary-container";

const ghostCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)" };

export default function ProfilePage() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [nameInput, setNameInput] = useState("");
    const [nameSaving, setNameSaving] = useState(false);
    const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
                .from("profiles").select("full_name").eq("id", session.user.id).single();
            const name = profile?.full_name ?? "";
            setFullName(name);
            setNameInput(name);
        } catch { /* ignored */ } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleNameSave = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed) { setNameMsg({ type: "error", text: "Name cannot be empty." }); setTimeout(() => setNameMsg(null), 3000); return; }
        if (trimmed === fullName) return;
        setNameSaving(true); setNameMsg(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("id", session.user.id);
            if (error) { setNameMsg({ type: "error", text: "Failed to update name." }); }
            else { setFullName(trimmed); setNameMsg({ type: "success", text: "Name updated." }); }
            setTimeout(() => setNameMsg(null), 3000);
        } catch {
            setNameMsg({ type: "error", text: "Something went wrong." });
            setTimeout(() => setNameMsg(null), 3000);
        } finally { setNameSaving(false); }
    };

    const handlePasswordChange = async () => {
        setPwMsg(null);
        if (newPassword.length < 6) { setPwMsg({ type: "error", text: "Password must be at least 6 characters." }); setTimeout(() => setPwMsg(null), 4000); return; }
        if (newPassword !== confirmPassword) { setPwMsg({ type: "error", text: "Passwords do not match." }); setTimeout(() => setPwMsg(null), 4000); return; }
        setPwSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) { setPwMsg({ type: "error", text: error.message }); }
            else { setPwMsg({ type: "success", text: "Password updated successfully." }); setNewPassword(""); setConfirmPassword(""); }
            setTimeout(() => setPwMsg(null), 4000);
        } catch {
            setPwMsg({ type: "error", text: "Something went wrong." });
            setTimeout(() => setPwMsg(null), 4000);
        } finally { setPwSaving(false); }
    };

    return (
        <div className="min-h-screen bg-surface font-outfit text-on-surface-variant antialiased">
            <Navbar floating />
            <main className="mx-auto max-w-lg px-8 pt-28 pb-10">

                {/* Back */}
                <Link href="/explore" className="mb-8 inline-flex items-center gap-2 text-sm text-on-surface-variant/60 transition-colors hover:text-on-surface">
                    <ArrowLeft className="h-4 w-4" />
                    Back to venues
                </Link>

                {/* Header */}
                <div className="mb-10">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-btn-red">Account</p>
                    <h1 className="font-extrabold leading-none tracking-[-0.04em] text-white" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)" }}>
                        My Profile
                    </h1>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant/30" />
                    </div>
                ) : (
                    <div className="space-y-5">

                        {/* Email (read-only) */}
                        <div className="rounded-2xl bg-surface-container p-6" style={ghostCard}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-btn-red">Email</p>
                            <div className="rounded-full border border-on-surface/30 bg-transparent px-5 py-3.5 text-[0.9rem] text-on-surface-variant/50">
                                {email || "No email"}
                            </div>
                            <p className="mt-3 pl-5 text-xs text-on-surface-variant/30">
                                Email cannot be changed here.
                            </p>
                        </div>

                        {/* Full name */}
                        <div className="rounded-2xl bg-surface-container p-6" style={ghostCard}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-btn-red">Full Name</p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                                    className={inputClass}
                                    placeholder="Your name"
                                />
                                <button
                                    onClick={handleNameSave}
                                    disabled={nameSaving || nameInput.trim() === fullName}
                                    className="shrink-0 flex items-center gap-1.5 rounded-full bg-btn-red px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Save
                                </button>
                            </div>
                            {nameMsg && (
                                <p className={`mt-3 pl-5 flex items-center gap-1.5 text-xs ${nameMsg.type === "success" ? "text-emerald-400" : "text-btn-red"}`}>
                                    {nameMsg.type === "success" ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                    {nameMsg.text}
                                </p>
                            )}
                        </div>

                        {/* Change password */}
                        <div className="rounded-2xl bg-surface-container p-6" style={ghostCard}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-btn-red">Change Password</p>
                            <div className="space-y-3">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="New password"
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={pwSaving || !newPassword}
                                    className="flex w-full items-center justify-center gap-2 rounded-full bg-btn-red py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    {pwSaving ? "Updating…" : "Update Password"}
                                </button>
                            </div>
                            {pwMsg && (
                                <p className={`mt-3 pl-5 flex items-center gap-1.5 text-xs ${pwMsg.type === "success" ? "text-emerald-400" : "text-btn-red"}`}>
                                    {pwMsg.type === "success" ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
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

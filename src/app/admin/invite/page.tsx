"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Trash2, CheckCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isSuperAdminEmail } from "@/lib/superAdmin";
import { inviteAdminAction, listAdminsAction, removeAdminAction } from "@/app/actions/invite";

const inputClass =
  "w-full rounded-full border border-on-surface bg-transparent px-5 py-3.5 font-outfit text-[0.9rem] text-white placeholder:text-white/40 outline-none transition-colors duration-300 ease-in-out focus:border-primary-container";

const ghostCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.08)" };

interface Admin {
  id: string;
  email: string;
  full_name: string | null;
}

export default function InviteAdminPage() {
  const router = useRouter();
  const { isAdmin, logout } = useAuth();

  const handleLogout = () => {
    router.push("/admin/login");
    logout("admin");
  };
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const getToken = async () => {
    const { data } = await supabaseAdmin.auth.getSession();
    return data.session?.access_token || "";
  };

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login?message=sign_in");
      return;
    }
    // This page is super-admin only — venue admins go back to their dashboard.
    (async () => {
      const { data } = await supabaseAdmin.auth.getUser();
      if (!isSuperAdminEmail(data.user?.email)) {
        router.replace("/admin/dashboard");
        return;
      }
      setCheckingAccess(false);
      loadAdmins();
    })();
  }, [isAdmin, router]);

  const loadAdmins = async () => {
    setAdminsLoading(true);
    const token = await getToken();
    const result = await listAdminsAction(token);
    if (result.error) setError(result.error);
    else setAdmins(result.admins);
    setAdminsLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const token = await getToken();
    const result = await inviteAdminAction(token, email, window.location.origin);
    setLoading(false);

    if (result.success) {
      setSuccess(
        result.promoted
          ? `${email} already had an account and was granted admin access.`
          : `Invite email sent to ${email}.`,
      );
      setEmail("");
      loadAdmins();
    } else {
      setError(result.error || "Failed to send invite.");
    }
  };

  const handleRemove = async (userId: string) => {
    setError("");
    setSuccess("");
    setRemoving(userId);

    const token = await getToken();
    const result = await removeAdminAction(token, userId);
    setRemoving(null);

    if (result.success) {
      setSuccess("Admin access removed.");
      loadAdmins();
    } else {
      setError(result.error || "Failed to remove admin.");
    }
  };

  if (!isAdmin || checkingAccess) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface font-outfit px-4 py-12 antialiased">
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Manage Admins
          </h1>
          <button
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-btn-red px-4 py-2 text-sm font-medium tracking-[-0.03em] text-white transition-all hover:bg-white hover:text-btn-red active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        <p className="mb-8 text-sm text-on-surface-variant/60">
          Invite venue owners by email. They&apos;ll receive a link to set up their account.
        </p>

        {/* Invite form */}
        <div className="rounded-2xl bg-surface-container p-6" style={ghostCard}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant/50">
            Send Invite
          </h2>

          {error && (
            <div className="mb-4 rounded-xl bg-btn-red/[0.08] px-4 py-2.5 text-sm text-btn-red">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/[0.08] px-4 py-2.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="admin@example.com"
              className={inputClass}
              required
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-btn-red px-5 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white hover:text-btn-red active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Invite
            </button>
          </form>
        </div>

        {/* Admin list */}
        <div className="mt-6 rounded-2xl bg-surface-container p-6" style={ghostCard}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant/50">
            Current Admins
          </h2>

          {adminsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-on-surface-variant/40" />
            </div>
          ) : admins.length === 0 ? (
            <p className="py-4 text-center text-sm text-on-surface-variant/40">
              No admins yet. Send your first invite above.
            </p>
          ) : (
            <ul className="space-y-3">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between rounded-xl bg-surface-container-high/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {admin.full_name || "—"}
                    </p>
                    <p className="text-xs text-on-surface-variant/60">{admin.email}</p>
                  </div>
                  {isSuperAdminEmail(admin.email) ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/60">
                      Super admin
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRemove(admin.id)}
                      disabled={removing === admin.id}
                      className="cursor-pointer rounded-full p-2 text-on-surface-variant/40 transition-colors hover:bg-btn-red/10 hover:text-btn-red disabled:opacity-40"
                      title="Remove admin access"
                    >
                      {removing === admin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

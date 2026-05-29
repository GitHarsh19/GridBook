"use server";

import { supabaseService } from "@/lib/supabase-service";

const SUPER_ADMIN_EMAIL = "harshitagarwalsmt@gmail.com";

async function requireSuperAdmin(accessToken: string) {
  const { data: { user }, error } = await supabaseService.auth.getUser(accessToken);
  if (error || !user) throw new Error("Unauthorized");
  if (user.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Forbidden: only the super admin can invite admins.");
  }
  return user;
}

export async function inviteAdminAction(
  accessToken: string,
  email: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin(accessToken);

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Invalid email address." };
  }

  const { data: existing } = await supabaseService
    .from("profiles")
    .select("id, role")
    .eq("email", trimmed)
    .single();

  if (existing?.role === "admin") {
    return { success: false, error: "This user is already an admin." };
  }

  if (existing) {
    const { error } = await supabaseService
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const { error } = await supabaseService.auth.admin.inviteUserByEmail(trimmed, {
    data: { role: "admin" },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listAdminsAction(accessToken: string): Promise<{
  admins: { id: string; email: string; full_name: string | null }[];
  error?: string;
}> {
  await requireSuperAdmin(accessToken);

  const { data, error } = await supabaseService
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  if (error) return { admins: [], error: error.message };
  return { admins: data || [] };
}

export async function removeAdminAction(
  accessToken: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSuperAdmin(accessToken);

  const { data: profile } = await supabaseService
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile) return { success: false, error: "User not found." };
  if (profile.email === SUPER_ADMIN_EMAIL) {
    return { success: false, error: "Cannot remove the super admin." };
  }

  const { error } = await supabaseService
    .from("profiles")
    .update({ role: "customer" })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

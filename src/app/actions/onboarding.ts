"use server";

import { supabaseService } from "@/lib/supabase-service";

/**
 * Owner payout onboarding (v1, minimal).
 * Stores the venue owner's Razorpay *linked account* id (acc_...) on their
 * profile. In test mode you create the linked account from the Razorpay
 * dashboard and paste its id here; full programmatic KYC onboarding
 * (accounts.create + stakeholder + documents) is a later branch.
 *
 * Auth follows the same pattern as the invite actions: the admin's access
 * token is verified server-side with the service-role client.
 */

async function requireAdmin(accessToken: string) {
  const { data: { user }, error } = await supabaseService.auth.getUser(accessToken);
  if (error || !user) throw new Error("Unauthorized");

  const { data: profile } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden: admins only.");

  return user;
}

export async function saveRazorpayAccountAction(
  accessToken: string,
  accountId: string,
): Promise<{ success: boolean; error?: string }> {
  let user;
  try {
    user = await requireAdmin(accessToken);
  } catch {
    return { success: false, error: "Not authorized." };
  }

  const trimmed = accountId.trim();
  if (!/^acc_[A-Za-z0-9]+$/.test(trimmed)) {
    return { success: false, error: "Enter a valid Razorpay account id (starts with 'acc_')." };
  }

  const { error } = await supabaseService
    .from("profiles")
    .update({ razorpay_account_id: trimmed })
    .eq("id", user.id);
  if (error) return { success: false, error: error.message };

  return { success: true };
}

export async function getMyPayoutAccountAction(
  accessToken: string,
): Promise<{ accountId: string | null; error?: string }> {
  let user;
  try {
    user = await requireAdmin(accessToken);
  } catch {
    return { accountId: null, error: "Not authorized." };
  }

  const { data } = await supabaseService
    .from("profiles")
    .select("razorpay_account_id")
    .eq("id", user.id)
    .single();

  return { accountId: data?.razorpay_account_id ?? null };
}

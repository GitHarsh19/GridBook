/**
 * Super-admin allowlist — the single source of truth for who is a super admin.
 *
 * Super-admin status is derived ONLY from this list, checked against the
 * authenticated user's verified email. It is never stored as a grantable role,
 * so it cannot be self-assigned via signup, signin, or any DB write — the only
 * way to add a super admin is to edit this list and redeploy.
 */
export const SUPER_ADMIN_EMAILS = [
  "harshitagarwalsmt@gmail.com",
  "ankitcitama12@gmail.com",
] as const;

/** Case-insensitive, null-safe check for super-admin membership. */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(
    email.trim().toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number],
  );
}

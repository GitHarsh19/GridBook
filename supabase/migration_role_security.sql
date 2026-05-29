-- ============================================================
-- PitPass — Role assignment hardening
-- Closes two privilege-escalation holes:
--   1. Signup could self-assign a role via client metadata.
--   2. Any signed-in user could rewrite their own profile.role via RLS.
-- After this, the ONLY way to get a role above 'customer' is through
-- server-side code using the service-role key (invites, super-admin tools).
-- Run in the Supabase SQL Editor AFTER profiles.sql.
-- ============================================================

-- 1. The new-user trigger ignores any client-supplied role.
--    Every public signup is created as 'customer'; elevation happens
--    explicitly in server actions via the service-role client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    'customer'
  );
  return new;
end;
$$;

-- 2. Lock the role column from client writes.
--    Users may still edit their own full_name (RLS already scopes this to
--    their own row), but can no longer change role. service_role retains
--    full UPDATE and is unaffected by these grants.
revoke update on public.profiles from authenticated, anon;
grant  update (full_name) on public.profiles to authenticated;

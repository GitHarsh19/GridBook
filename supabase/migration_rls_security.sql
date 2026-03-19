-- ============================================================
-- GridBook — RLS Security Hardening
-- Replaces the permissive MVP policies with role-based checks.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Helper function: returns true if the current user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ============================================================
-- 2. RIGS — public read, admin-only mutations
-- ============================================================

-- Drop old permissive policies
drop policy if exists "Allow update rigs" on rigs;
drop policy if exists "Allow insert rigs" on rigs;
drop policy if exists "Allow delete rigs" on rigs;

-- New admin-only policies
create policy "Admin insert rigs"
  on rigs for insert
  with check (public.is_admin());

create policy "Admin update rigs"
  on rigs for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin delete rigs"
  on rigs for delete
  using (public.is_admin());

-- ============================================================
-- 3. BOOKINGS — authenticated insert, admin-only delete
-- ============================================================

-- Drop old permissive policies
drop policy if exists "Allow insert bookings" on bookings;
drop policy if exists "Allow delete bookings" on bookings;

-- Any authenticated user can create a booking (customers + admins)
create policy "Authenticated insert bookings"
  on bookings for insert
  with check (auth.uid() is not null);

-- Only admins can delete bookings (walk-in release, cleanup)
create policy "Admin delete bookings"
  on bookings for delete
  using (public.is_admin());

-- ============================================================
-- 4. VENUES — keep public read, restrict mutations to admin
-- ============================================================

-- Add admin-only mutation policies (venues had no insert/update/delete policies)
create policy "Admin insert venues"
  on venues for insert
  with check (public.is_admin());

create policy "Admin update venues"
  on venues for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin delete venues"
  on venues for delete
  using (public.is_admin());

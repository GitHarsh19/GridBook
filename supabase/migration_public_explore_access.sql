-- ============================================================
-- Migration: Ensure public (anon) read access for the explore page
-- The /explore page and map view should be accessible without login.
-- Booking a venue still requires authentication (enforced in UI + RLS on bookings).
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Venues: ensure public read policy exists (drop + recreate to be idempotent)
drop policy if exists "Public read venues" on venues;
create policy "Public read venues"
  on venues for select
  using (true);

-- Rigs: ensure public read policy exists
drop policy if exists "Public read rigs" on rigs;
create policy "Public read rigs"
  on rigs for select
  using (true);

-- Bookings: ensure public read policy exists (needed for availability checks)
drop policy if exists "Allow read bookings" on bookings;
create policy "Allow read bookings"
  on bookings for select
  using (true);

-- venue_with_counts view: re-grant anon + authenticated access
-- (CREATE OR REPLACE VIEW resets grants in some Postgres versions)
grant select on venue_with_counts to anon, authenticated;

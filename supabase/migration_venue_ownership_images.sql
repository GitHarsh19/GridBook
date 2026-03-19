-- ============================================================
-- GridBook — Venue Ownership & Images
-- Adds owner_id (links venues to admin profiles) and image_url.
-- Updates RLS policies to enforce ownership on mutations.
-- Run this in Supabase SQL Editor AFTER migration_rls_security.sql.
-- ============================================================

-- 1. Add columns to venues table
alter table venues add column if not exists owner_id uuid references profiles(id) on delete set null;
alter table venues add column if not exists image_url text default null;

-- 2. Add venues table to real-time publication
alter publication supabase_realtime add table venues;

-- 3. Drop old venue mutation policies (from migration_rls_security.sql)
drop policy if exists "Admin insert venues" on venues;
drop policy if exists "Admin update venues" on venues;
drop policy if exists "Admin delete venues" on venues;

-- 4. Recreate with ownership checks
--    INSERT: any admin can create; owner_id is set in application code
create policy "Admin insert venues"
  on venues for insert
  with check (public.is_admin());

--    UPDATE: admins can only update venues they own
create policy "Admin update venues"
  on venues for update
  using (public.is_admin() and owner_id = auth.uid())
  with check (public.is_admin() and owner_id = auth.uid());

--    DELETE: admins can only delete venues they own
create policy "Admin delete venues"
  on venues for delete
  using (public.is_admin() and owner_id = auth.uid());

-- NOTE: Existing seed venues have owner_id = NULL and will remain
-- visible to customers but will NOT appear in any admin's dashboard.
-- Rigs/bookings cascade-delete when a venue is deleted (existing FK constraints).

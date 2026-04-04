-- ============================================================
-- GridBook — Check-in & Auto-Release Fixes
-- 1. Add 'in_use' to rigs status constraint
-- 2. Add status column to bookings
-- 3. Add UPDATE RLS policy on bookings for admins
-- 4. Extend auto-release to also free "in_use" rigs
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Update rigs status check constraint to include 'in_use'
ALTER TABLE rigs DROP CONSTRAINT IF EXISTS rigs_status_check;
ALTER TABLE rigs ADD CONSTRAINT rigs_status_check
  CHECK (status IN ('available', 'booked', 'blocked', 'out_of_order', 'in_use'));

-- 2. Add status column to bookings (for tracking check-in state)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';

-- 3. Allow admins to update bookings (e.g. set status to 'checked_in')
DROP POLICY IF EXISTS "Admin update bookings" ON bookings;
CREATE POLICY "Admin update bookings"
  ON bookings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Extend auto-release function to also release "in_use" rigs
--    whose blocked_until has passed (i.e. session time slot ended).
CREATE OR REPLACE FUNCTION public.release_expired_walkins()
RETURNS integer AS $$
DECLARE
  released integer;
BEGIN
  -- Reset rigs whose walk-in block has expired
  UPDATE rigs SET status = 'available'
  WHERE status = 'blocked'
  AND id IN (
    SELECT DISTINCT rig_id FROM bookings
    WHERE source = 'walk_in'
      AND blocked_until IS NOT NULL
      AND blocked_until <= now()
  );

  -- Also release "in_use" rigs whose session has expired
  UPDATE rigs SET status = 'available'
  WHERE status = 'in_use'
  AND id IN (
    SELECT DISTINCT rig_id FROM bookings
    WHERE status = 'checked_in'
      AND blocked_until IS NOT NULL
      AND blocked_until <= now()
  );

  -- Delete expired walk-in bookings and count them
  WITH deleted AS (
    DELETE FROM bookings
    WHERE source = 'walk_in'
      AND blocked_until IS NOT NULL
      AND blocked_until <= now()
    RETURNING id
  )
  SELECT count(*) INTO released FROM deleted;

  RETURN released;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GridBook — Auto-release migration
-- Adds blocked_until column to bookings so walk-in blocks
-- can be automatically released when they expire.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Add nullable blocked_until column (only used for walk_in bookings)
alter table bookings add column if not exists blocked_until timestamptz;

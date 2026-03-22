-- Migration: Add unique constraint to prevent double-booking
-- This ensures no two bookings can exist for the same rig + time slot + date.

-- Step 1: Clean up any existing duplicate bookings (keep the earliest one)
DELETE FROM bookings a USING bookings b
WHERE a.id > b.id
  AND a.rig_id = b.rig_id
  AND a.time_slot = b.time_slot
  AND a.booking_date = b.booking_date;

-- Step 2: Add the unique constraint
ALTER TABLE bookings
  ADD CONSTRAINT uq_booking_rig_slot_date
  UNIQUE (rig_id, time_slot, booking_date);

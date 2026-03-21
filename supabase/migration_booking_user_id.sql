-- Migration: Add user_id to bookings table for customer booking history.
-- Allows customers to query their own bookings via RLS.

-- Add user_id column (nullable for backward compatibility with existing bookings)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- RLS policy: customers can read their own bookings
CREATE POLICY "Users can read own bookings"
    ON bookings FOR SELECT
    USING (auth.uid() = user_id);

-- RLS policy: customers can cancel (delete) their own future bookings
CREATE POLICY "Users can cancel own future bookings"
    ON bookings FOR DELETE
    USING (
        auth.uid() = user_id
        AND booking_date >= CURRENT_DATE
        AND source = 'app'
    );

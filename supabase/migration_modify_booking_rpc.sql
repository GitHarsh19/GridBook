-- Migration: Atomic modify-booking RPC function
-- Performs delete + insert in a single transaction so the original booking
-- is never lost if the insert fails (e.g. conflict, network error).
-- Relies on the uq_booking_rig_slot_date unique constraint for conflict detection.

CREATE OR REPLACE FUNCTION public.modify_booking(
  p_verification_code text,
  p_user_id uuid,
  p_new_date date,
  p_new_slots text[],
  p_rig_ids bigint[],
  p_customer_name text
)
RETURNS jsonb AS $$
DECLARE
  deleted_count integer;
  inserted_count integer;
BEGIN
  -- Delete old booking rows (within the same transaction)
  DELETE FROM bookings
  WHERE verification_code = p_verification_code
    AND user_id = p_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found.');
  END IF;

  -- Insert new rows (one per rig x slot)
  INSERT INTO bookings (rig_id, customer_name, time_slot, booking_date, verification_code, source, user_id)
  SELECT r.rig_id, p_customer_name, s.slot, p_new_date, p_verification_code, 'app', p_user_id
  FROM unnest(p_rig_ids) AS r(rig_id)
  CROSS JOIN unnest(p_new_slots) AS s(slot);

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'Insert produced zero rows';
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  -- Conflict with another booking — transaction rolls back automatically
  RETURN jsonb_build_object('success', false, 'error', 'Some slots are already booked. Please try different slots.');
WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Failed to modify booking.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

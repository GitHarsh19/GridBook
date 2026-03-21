-- ============================================================
-- GridBook — Auto-Release Expired Walk-Ins (Database Function)
-- Runs as security definer so it can be called from any client
-- (admin or customer) without needing admin-level RLS.
-- Run this in Supabase SQL Editor.
-- ============================================================

create or replace function public.release_expired_walkins()
returns integer as $$
declare
  released integer;
begin
  -- Reset rigs whose walk-in block has expired
  update rigs set status = 'available'
  where status = 'blocked'
  and id in (
    select distinct rig_id from bookings
    where source = 'walk_in'
      and blocked_until is not null
      and blocked_until <= now()
  );

  -- Delete expired walk-in bookings and count them
  with deleted as (
    delete from bookings
    where source = 'walk_in'
      and blocked_until is not null
      and blocked_until <= now()
    returning id
  )
  select count(*) into released from deleted;

  return released;
end;
$$ language plpgsql security definer;

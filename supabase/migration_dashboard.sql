-- ============================================================
-- GridBook — Dashboard migration
-- Run this in Supabase SQL Editor if you already have the
-- venues + rigs tables from the original seed.sql
-- ============================================================

-- 1. Expand rig status to support walk-in blocking and out-of-order
alter table rigs drop constraint if exists rigs_status_check;
alter table rigs add constraint rigs_status_check
  check (status in ('available', 'booked', 'blocked', 'out_of_order'));

-- 2. Bookings table
create table if not exists bookings (
  id                bigint generated always as identity primary key,
  rig_id            bigint       not null references rigs(id) on delete cascade,
  customer_name     text         not null default 'Online User',
  time_slot         text         not null,
  booking_date      date         not null default current_date,
  verification_code text         not null,
  source            text         not null default 'app'
                      check (source in ('app', 'walk_in')),
  created_at        timestamptz  not null default now()
);

-- 3. Enable real-time on both tables
alter publication supabase_realtime add table rigs;
alter publication supabase_realtime add table bookings;

-- 4. RLS policies (allow anon key to manage rigs + bookings for MVP)
alter table rigs enable row level security;
alter table bookings enable row level security;
alter table venues enable row level security;

-- Venues: public read
create policy "Public read venues" on venues for select using (true);

-- Profiles: users can read their own profile (for role lookup)
do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'profiles') then
    execute 'alter table profiles enable row level security';
    execute 'create policy "Users read own profile" on profiles for select using (auth.uid() = id)';
  end if;
end $$;

-- Rigs: public read + dashboard can manage
create policy "Public read rigs" on rigs for select using (true);
create policy "Allow update rigs" on rigs for update using (true) with check (true);
create policy "Allow insert rigs" on rigs for insert with check (true);
create policy "Allow delete rigs" on rigs for delete using (true);

-- Bookings: full access for MVP
create policy "Allow read bookings" on bookings for select using (true);
create policy "Allow insert bookings" on bookings for insert with check (true);
create policy "Allow delete bookings" on bookings for delete using (true);

-- 5. Seed sample bookings for today (dynamically picks rigs from the first venue)
insert into bookings (rig_id, customer_name, time_slot, booking_date, verification_code, source)
select r.id, b.customer_name, b.time_slot, current_date, b.verification_code, 'app'
from (
  select id, row_number() over (order by id) as rn
  from rigs
  where venue_id = (select id from venues order by id limit 1)
) r
join (
  values (2, 'Rahul M',  '2:00 PM – 3:00 PM', 'VRF-4821'),
         (4, 'Priya S',  '3:00 PM – 4:00 PM', 'VRF-9103'),
         (5, 'Arjun K',  '5:00 PM – 6:00 PM', 'VRF-7240'),
         (6, 'Sneha R',  '4:00 PM – 5:00 PM', 'VRF-1567')
) as b(rn, customer_name, time_slot, verification_code) on r.rn = b.rn;

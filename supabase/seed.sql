-- ============================================================
-- GridBook — Supabase schema + seed data
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Venues table
create table if not exists venues (
  id          bigint generated always as identity primary key,
  name        text    not null,
  location    text    not null,
  price       int     not null,
  description text    not null default ''
);

-- 2. Rigs table
create table if not exists rigs (
  id        bigint generated always as identity primary key,
  venue_id  bigint not null references venues(id) on delete cascade,
  name      text   not null,
  status    text   not null default 'available' check (status in ('available', 'booked')),
  specs     text   not null default ''
);

-- ============================================================
-- Seed data
-- ============================================================

-- Apex Racing Lounge (HSR Layout)
insert into venues (name, location, price, description) values
  ('Apex Racing Lounge', 'HSR Layout', 500, 'Premium sim racing experience with Fanatec DD setups and triple-screen immersion.');

insert into rigs (venue_id, name, status, specs) values
  (1, 'Rig 1', 'available', 'Fanatec DD Pro · Triple 27"'),
  (1, 'Rig 2', 'booked',    'Fanatec DD Pro · Triple 27"'),
  (1, 'Rig 3', 'available', 'Fanatec CSL DD · Ultrawide 34"'),
  (1, 'Rig 4', 'available', 'Fanatec CSL DD · Ultrawide 34"'),
  (1, 'Rig 5', 'booked',    'Logitech G Pro · Single 32"'),
  (1, 'Rig 6', 'booked',    'Logitech G Pro · Single 32"'),
  (1, 'Rig 7', 'available', 'Thrustmaster T300 · VR Headset'),
  (1, 'Rig 8', 'booked',    'Thrustmaster T300 · VR Headset');

-- Clutch Gaming Arena (Koramangala)
insert into venues (name, location, price, description) values
  ('Clutch Gaming Arena', 'Koramangala', 600, 'High-end gaming café with professional-grade sim rigs and VR setups.');

insert into rigs (venue_id, name, status, specs) values
  (2, 'Rig 1', 'available', 'Fanatec DD1 · Triple 32"'),
  (2, 'Rig 2', 'available', 'Fanatec DD1 · Triple 32"'),
  (2, 'Rig 3', 'available', 'Fanatec CSL DD · Ultrawide 34"'),
  (2, 'Rig 4', 'booked',    'Logitech G923 · Single 27"'),
  (2, 'Rig 5', 'available', 'Logitech G923 · Single 27"'),
  (2, 'Rig 6', 'available', 'Thrustmaster T-GT II · VR');

-- Pole Position Hub (Indiranagar)
insert into venues (name, location, price, description) values
  ('Pole Position Hub', 'Indiranagar', 450, 'Neighbourhood sim racing spot with solid mid-range setups and AC gaming.');

insert into rigs (venue_id, name, status, specs) values
  (3, 'Rig 1', 'available', 'Logitech G Pro · Triple 24"'),
  (3, 'Rig 2', 'booked',    'Logitech G Pro · Triple 24"'),
  (3, 'Rig 3', 'booked',    'Logitech G923 · Single 27"'),
  (3, 'Rig 4', 'booked',    'Logitech G923 · Single 27"'),
  (3, 'Rig 5', 'available', 'Thrustmaster T300 · Ultrawide'),
  (3, 'Rig 6', 'booked',    'Thrustmaster T300 · Ultrawide');

-- DRS Zone Lounge (Whitefield)
insert into venues (name, location, price, description) values
  ('DRS Zone Lounge', 'Whitefield', 550, 'Modern racing lounge with motion rigs and competitive league nights.');

insert into rigs (venue_id, name, status, specs) values
  (4, 'Rig 1', 'available', 'Fanatec DD Pro · Motion Rig'),
  (4, 'Rig 2', 'available', 'Fanatec DD Pro · Motion Rig'),
  (4, 'Rig 3', 'booked',    'Fanatec CSL DD · Triple 27"'),
  (4, 'Rig 4', 'available', 'Fanatec CSL DD · Triple 27"'),
  (4, 'Rig 5', 'booked',    'Logitech G Pro · Single 32"'),
  (4, 'Rig 6', 'available', 'Logitech G Pro · Single 32"'),
  (4, 'Rig 7', 'booked',    'Thrustmaster T818 · VR Headset');

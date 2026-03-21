-- ============================================================
-- GridBook — Demo Admin Account Setup
-- Creates a demo admin user for testing purposes.
-- Run this ONCE in Supabase SQL Editor.
-- ============================================================

-- IMPORTANT: You must FIRST create the user in Supabase Dashboard:
--   Authentication > Users > Add user
--   Email:    demo@gridbook.admin
--   Password: DemoAdmin@123
--   Check "Auto Confirm User"
--
-- After creating the user, run this to promote them to admin:

update profiles
set role = 'admin', full_name = 'Demo Admin'
where email = 'demo@gridbook.admin';

-- Optionally, seed a venue owned by the demo admin so the dashboard isn't empty:
-- (Uncomment if you want demo data)

-- insert into venues (name, location, price, description, owner_id)
-- select 'Demo Gaming Cafe', 'MG Road, Bangalore', 120, 'A demo venue for testing the admin dashboard.', id
-- from profiles where email = 'demo@gridbook.admin'
-- on conflict do nothing;

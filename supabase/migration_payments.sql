-- ============================================================
-- PitPass — Payments (Razorpay Route) schema
-- Online card + UPI bookings, split-paid to each venue owner.
-- Run this in Supabase SQL Editor AFTER migration_venue_ownership_images.sql.
-- ============================================================

-- 1. Owner payout account
--    One Razorpay *linked account* (acc_...) per owner — a single bank
--    account can back multiple venues. Resolved at order time via
--    venues.owner_id -> profiles.razorpay_account_id.
alter table profiles add column if not exists razorpay_account_id text default null;

-- 2. Booking <-> payment traceability
--    Walk-in (admin/cash) bookings leave these NULL.
alter table bookings add column if not exists razorpay_order_id text default null;
alter table bookings add column if not exists razorpay_payment_id text default null;

-- 3. payment_orders — the booking *intent* captured before checkout.
--    A booking does not exist until payment is captured; this row holds
--    everything needed to create it, and is the idempotency anchor shared
--    by the verify server action and the webhook.
create table if not exists payment_orders (
  id                  uuid primary key default gen_random_uuid(),
  razorpay_order_id   text unique not null,
  razorpay_payment_id text default null,
  user_id             uuid references profiles(id) on delete set null,
  venue_id            bigint references venues(id) on delete cascade,
  rig_ids             bigint[] not null,
  slots               text[] not null,
  booking_date        date not null,
  customer_name       text,
  amount              integer not null,                 -- total charged, in paise
  verification_code   text not null,                    -- the APP-XXXX code reused on the booking
  status              text not null default 'created'   -- created | paid | failed
                        check (status in ('created', 'paid', 'failed')),
  created_at          timestamptz default now()
);

create index if not exists idx_payment_orders_order_id on payment_orders (razorpay_order_id);

-- 4. RLS: payment_orders is touched ONLY by the service-role key (server
--    actions + webhook). Enable RLS and add no policies -> denies anon/auth
--    entirely, while the service-role key bypasses RLS.
alter table payment_orders enable row level security;

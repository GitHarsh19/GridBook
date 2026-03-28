# GridBook

**Discover and book sim racing rigs at gaming venues near you.**

GridBook is a booking platform for sim racing enthusiasts to find nearby venues, browse available rigs, select time slots, and reserve their sessions. It also includes a full venue admin dashboard for managing rigs, walk-ins, and bookings in real time — with QR-code-based check-in for seamless customer verification.

## Features

### Customer
- **Landing Page** — Clean, centered CTA to explore venues or sign in
- **Venue Discovery** — Browse gaming cafes and sim racing lounges with real-time rig availability
- **Rig Selection** — View rig specs (Fanatec DD, Logitech G Pro, VR setups, etc.) and pick your preferred setup
- **Date & Time Slot Booking** — Select a date (up to 7 days ahead) and multiple 1-hour slots from 10 AM to 10 PM
- **Instant Pricing** — Total cost calculated in real-time based on rigs × slots
- **Booking Details Page** — View full booking summary at `/bookings/[code]` with slot breakdown
- **QR Ticket** — Each booking includes a unique QR check-in token displayed as a scannable code
- **Calendar Export** — Add booking to calendar via `.ics` download
- **Modify Booking** — Change date or time slots on an existing booking via modal
- **Profile Page** — Update display name and change password from `/profile`
- **Auth** — Demo login, Google OAuth, and Supabase email/password
- **Protected Routes** — Auth-gated pages with role-based access control
- **Session Persistence** — Sessions survive page refresh via Supabase Auth
- **Responsive Design** — Dark-themed UI optimized for both mobile and desktop

### Venue Admin Dashboard
- **Live Rig Grid** — Real-time status of all rigs (available, booked, blocked, out of order)
- **QR Code Scanner** — Scan customer QR tickets to verify and check in bookings instantly
- **Walk-In Blocking** — Block rigs for walk-in customers with 1/2/3 hr duration
- **Bookings Ledger** — Today's bookings with customer names, time slots, and verification codes
- **Out of Order Toggle** — Mark rigs as out of order and back to available
- **Add / Edit Venues & Rigs** — Create new venues and rigs or update existing ones from the dashboard
- **Real-Time Updates** — Supabase real-time subscriptions + 30s polling fallback
- **Multi-Venue Support** — Venue selector dropdown for managing multiple locations
- **Supabase Auth** — Admin login via email/password with role verification from profiles table

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL, Auth, Real-time) |
| QR Generation | qrcode.react |
| QR Scanning | @yudiel/react-qr-scanner |
| Forms | react-hook-form + zod |
| Toasts | Sonner |
| Icons | Lucide React |
| Font | Geist |

## Getting Started

> **Internal project** — contact the team for environment credentials and setup instructions.

### Quick Start

```bash
git clone https://github.com/GitHarsh19/GridBook.git
cd GridBook
npm install
# Add the .env.local file (get credentials from the team)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Login |
|------|-------|
| Customer | `gamer` / `password` (demo) |
| Venue Admin | `admin` / `password` (Supabase auth) |

### Database Setup

Run the SQL files in the Supabase SQL Editor in this order:

1. `supabase/seed.sql` — Base schema (venues, rigs)
2. `supabase/profiles.sql` — Profiles table with role management and auto-create trigger
3. `supabase/migration_dashboard.sql` — Bookings table, RLS policies, expanded rig statuses
4. `supabase/migration_booking_user_id.sql` — Links bookings to user IDs
5. `supabase/migration_booking_unique_constraint.sql` — Prevents duplicate slot bookings
6. `supabase/migration_rls_security.sql` — Row-level security hardening
7. `supabase/migration_venue_ownership_images.sql` — Venue ownership + image support
8. `supabase/migration_venue_rig_counts.sql` — Cached rig count columns
9. `supabase/migration_modify_booking_rpc.sql` — RPC for atomic booking modification
10. `supabase/migration_auto_release.sql` — Auto-release expired bookings
11. `supabase/migration_auto_release_fn.sql` — Cron function for auto-release
12. `supabase/setup_demo_admin.sql` — Demo admin account setup

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with role-based sign in |
| `/login` | Public | Customer login |
| `/admin/login` | Public | Admin login |
| `/admin/signup` | Public | Admin registration |
| `/auth/callback` | Public | OAuth callback handler |
| `/explore` | Customer | Venue discovery feed |
| `/venue/[id]` | Customer | Rig selection & booking |
| `/bookings/[code]` | Customer | Booking details, QR ticket, calendar export |
| `/profile` | Customer | Edit name and change password |
| `/admin/dashboard` | Admin | Live rig status, QR scanner, bookings & metrics |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (/)
│   ├── layout.tsx                  # Root layout + AuthProvider
│   ├── explore/
│   │   ├── page.tsx                # Venue discovery feed
│   │   └── layout.tsx              # Auth-protected layout
│   ├── (customer)/
│   │   ├── login/page.tsx          # Customer login
│   │   └── signup/page.tsx         # Customer registration
│   ├── admin/
│   │   ├── login/page.tsx          # Admin login
│   │   ├── signup/page.tsx         # Admin registration
│   │   └── dashboard/
│   │       ├── page.tsx            # Admin dashboard
│   │       └── ScannerModal.tsx    # QR code check-in scanner
│   ├── auth/callback/
│   │   └── page.tsx                # OAuth callback handler
│   ├── bookings/[code]/
│   │   ├── page.tsx                # Booking details + QR ticket
│   │   └── layout.tsx              # Auth-gated layout
│   ├── profile/
│   │   ├── page.tsx                # Customer profile editor
│   │   └── layout.tsx              # Auth-gated layout
│   ├── venue/[id]/
│   │   ├── page.tsx                # Venue detail page
│   │   ├── layout.tsx              # Auth-gated layout
│   │   └── BookingClient.tsx       # Booking UI (client component)
│   └── actions/
│       ├── admin.ts                # Admin server actions
│       └── booking.ts              # Booking server actions
├── components/
│   ├── Navbar.tsx                  # Global navigation bar
│   ├── VenueCard.tsx               # Venue listing card
│   ├── TicketQR.tsx                # QR code ticket display
│   ├── DateSelector.tsx            # Date picker (7-day window)
│   ├── TimeSelector.tsx            # Time slot picker
│   ├── RigGrid.tsx                 # Rig selection grid
│   ├── CheckoutBar.tsx             # Booking checkout summary
│   ├── ModifyBookingModal.tsx      # Edit date/slots on existing booking
│   ├── ProtectedRoute.tsx          # Auth gate wrapper
│   └── admin/
│       ├── AddRigModal.tsx         # Create a new rig
│       ├── EditRigModal.tsx        # Edit an existing rig
│       ├── AddVenueModal.tsx       # Create a new venue
│       ├── EditVenueModal.tsx      # Edit an existing venue
│       ├── WalkInModal.tsx         # Block rig for walk-in
│       └── StatusConfig.ts         # Rig status display config
└── lib/
    ├── auth.tsx                    # Auth context + Supabase session bridge
    ├── data.ts                     # Types + Supabase queries
    ├── utils.ts                    # Date/time formatting helpers
    ├── supabase.ts                 # Supabase client (customer + admin)
    ├── supabase-server.ts          # Supabase SSR client
    └── hooks/
        ├── useRealtimeVenues.ts    # Real-time venue subscriptions
        └── useRateLimit.ts         # Client-side rate limiting
supabase/
├── seed.sql                        # Venues + rigs seed data
├── profiles.sql                    # User profiles table + trigger
├── migration_dashboard.sql         # Bookings, RLS, expanded rig statuses
├── migration_booking_user_id.sql   # User ID linkage for bookings
├── migration_booking_unique_constraint.sql
├── migration_rls_security.sql      # RLS hardening
├── migration_venue_ownership_images.sql
├── migration_venue_rig_counts.sql
├── migration_modify_booking_rpc.sql
├── migration_auto_release.sql
├── migration_auto_release_fn.sql
└── setup_demo_admin.sql
```

## License

Copyright 2026 GridBook. All rights reserved. See [LICENSE](LICENSE) for details.

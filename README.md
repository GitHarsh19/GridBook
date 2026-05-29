# PitPass

**Discover and book gaming rigs at cafes near you.**

PitPass is a booking platform for gamers to find nearby gaming cafes, browse available rigs (PC, PlayStation, Xbox, racing rigs, and VR devices), select time slots, and reserve their sessions. It also includes a full venue admin dashboard for managing rigs, walk-ins, and bookings in real time.

> **Repo / package name:** `gridbook-app` — the consumer-facing brand is **PitPass**.

## Features

### Customer
- **Landing Page** — Animated hero with tilted image grid, venue showcase carousel, and about section
- **Venue Discovery** — Browse gaming cafes with real-time rig availability across PC, PlayStation, Xbox, racing rigs, and VR devices (list + map view)
- **Interactive Map** — GTA 5-styled Leaflet map with venue blips, distance sorting, geolocation, and dashboard stats
- **Rig & Date Selection** — Pick a date, choose rigs by platform (PC, PlayStation, Xbox, VR) with specs, and select multiple 1-hour time slots
- **Instant Pricing** — Total cost calculated in real-time based on rigs × slots
- **Booking Management** — `/bookings` page with upcoming/past tabs, cancel, and modify booking
- **Booking Detail / QR Ticket** — `/bookings/[code]` page with a scannable QR check-in ticket
- **Profile** — View/edit full name and change password
- **Auth** — Google OAuth and Supabase email/password
- **Protected Routes** — Auth-gated pages with role-based access control
- **Session Persistence** — Sessions survive page refresh via Supabase Auth
- **Responsive Design** — Dark-themed UI optimised for both mobile and desktop

### Venue Admin Dashboard
- **Live Rig Grid** — Real-time status of all rigs (available, booked, blocked, out of order)
- **Walk-In Blocking** — Block rigs for walk-in customers with 1/2/3 hr duration
- **Bookings Ledger** — Today's bookings with customer names, time slots, and verification codes
- **Out of Order Toggle** — Mark rigs as out of order and back to available
- **QR Scanner** — Scan customer check-in QR codes to verify bookings in real time
- **Rig Management** — Add, edit, and delete rigs per venue with platform type selection (PC, PlayStation, Xbox, VR)
- **Venue Management** — Add, edit, and delete venues; multi-venue selector dropdown
- **Admin Booking** — Manually create or cancel bookings from the dashboard
- **Real-Time Updates** — Supabase real-time subscriptions + 30s polling fallback
- **Supabase Auth** — Admin login via email/password with role verification from profiles table
- **Super Admin (Invite-Only)** — Super admins (a hardcoded email allowlist) invite venue admins by email and manage/remove them via `/admin/invite`; they're routed there on login and cannot open the venue dashboard
- **Invited Admin Onboarding** — Invited venue admins land on `/admin/setup` to set their password, name, and first venue before reaching the dashboard
- **Role Security** — Roles are locked server-side: signups are always `customer`, the `role` column is writable only by the service-role key, and elevation happens only through invite server actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL, Auth, Real-time) |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Toasts | Sonner |
| Maps | Leaflet + Stadia Maps (GTA 5-styled dark tiles) |
| QR | qrcode / qrcode.react / @yudiel/react-qr-scanner |
| Font | Geist + Outfit |

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

### Access

| Role | How to get access |
|------|-------------------|
| Customer | Google OAuth or Supabase email/password signup |
| Venue Admin | Invite-only — a super admin sends an invite via `/admin/invite`; the invitee sets up their account + first venue at `/admin/setup` |
| Super Admin | Hardcoded email allowlist in `src/lib/superAdmin.ts` (changing it requires a redeploy) |

### Database Setup

Run the SQL files in the Supabase SQL Editor in this order:

1. `supabase/seed.sql` — Base schema (venues, rigs)
2. `supabase/profiles.sql` — Profiles table with role management and auto-create trigger
3. `supabase/setup_demo_admin.sql` — (Legacy) Demo admin account — no longer needed
4. `supabase/migration_dashboard.sql` — Bookings table, RLS policies, expanded rig statuses
5. `supabase/migration_rig_type.sql` — Rig platform type column (pc/playstation/xbox/vr)
6. `supabase/migration_booking_user_id.sql` — Booking user ID column
7. `supabase/migration_booking_unique_constraint.sql` — Unique booking constraint
8. `supabase/migration_modify_booking_rpc.sql` — Modify booking RPC function
9. `supabase/migration_checkin_fixes.sql` — Check-in flow fixes
10. `supabase/migration_auto_release.sql` — Auto-release expired bookings
11. `supabase/migration_auto_release_fn.sql` — Auto-release function
12. `supabase/migration_rls_security.sql` — Row-level security policies
13. `supabase/migration_public_explore_access.sql` — Public access for explore page
14. `supabase/migration_venue_coordinates.sql` — Venue coordinate data for map
15. `supabase/migration_venue_ownership_images.sql` — Venue ownership and images
16. `supabase/migration_venue_rig_counts.sql` — Venue rig count aggregates
17. `supabase/migration_role_security.sql` — Hardens role assignment (signups always `customer`; `role` column locked to the service-role key)

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with venue showcase |
| `/login` | Public | Customer login |
| `/signup` | Public | Customer registration |
| `/admin/login` | Public | Admin login |
| `/admin/signup` | Public | Redirects to login (invite-only) |
| `/admin/setup` | Invited Admin | Accept invite — set password, name & first venue |
| `/admin/invite` | Super Admin | Manage admin invites & list (super admins only) |
| `/auth/callback` | Public | OAuth callback handler |
| `/explore` | Customer | Venue discovery (list + map view) |
| `/venue/[id]` | Customer | Rig selection & booking |
| `/bookings` | Customer | My bookings (upcoming / past) |
| `/bookings/[code]` | Customer | Booking detail + QR check-in ticket |
| `/profile` | Customer | Edit name, change password |
| `/admin/dashboard` | Venue Admin | Live rig status, bookings, QR scanner & management (super admins are redirected to `/admin/invite`) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing page (/)
│   ├── layout.tsx                      # Root layout + AuthProvider
│   ├── actions/
│   │   ├── booking.ts                  # Server actions — create/modify/cancel bookings
│   │   ├── admin.ts                    # Server actions — admin booking & rig ops
│   │   └── invite.ts                   # Server actions — super admin invite system
│   ├── explore/
│   │   └── page.tsx                    # Venue discovery (list + map view with sort/filter)
│   ├── (customer)/
│   │   ├── login/page.tsx              # Customer login
│   │   └── signup/page.tsx             # Customer registration
│   ├── admin/
│   │   ├── login/page.tsx              # Admin login
│   │   ├── signup/page.tsx             # Redirect to login (invite-only)
│   │   ├── setup/page.tsx              # Invited admin onboarding (password + first venue)
│   │   ├── invite/page.tsx             # Super admin — manage admin invites
│   │   └── dashboard/
│   │       ├── page.tsx                # Admin dashboard
│   │       ├── layout.tsx              # Admin auth guard
│   │       └── ScannerModal.tsx        # QR check-in scanner
│   ├── auth/callback/page.tsx          # OAuth callback handler
│   ├── bookings/
│   │   ├── page.tsx                    # My bookings list
│   │   ├── layout.tsx                  # Auth-protected layout
│   │   └── [code]/page.tsx             # Booking detail + QR ticket
│   ├── profile/
│   │   ├── page.tsx                    # Profile (name, password)
│   │   └── layout.tsx                  # Auth-protected layout
│   └── venue/
│       ├── page.tsx                    # Redirects to /explore
│       ├── layout.tsx                  # Auth-gated layout
│       └── [id]/
│           ├── page.tsx                # Venue detail page
│           └── BookingClient.tsx       # Booking UI (client component)
├── components/
│   ├── Navbar.tsx                      # Global navigation bar
│   ├── VenueCard.tsx                   # Venue listing card
│   ├── ProtectedRoute.tsx              # Auth gate wrapper
│   ├── TimeSelector.tsx                # Time slot picker
│   ├── DateSelector.tsx                # Date picker for bookings
│   ├── RigGrid.tsx                     # Rig selection grid
│   ├── CheckoutBar.tsx                 # Booking checkout summary
│   ├── ModifyBookingModal.tsx          # Modify existing booking modal
│   ├── TicketQR.tsx                    # QR code ticket display
│   ├── VenueMap.tsx                    # Interactive Leaflet map (GTA 5-styled)
│   └── admin/
│       ├── index.ts                    # Admin component barrel export
│       ├── WalkInModal.tsx             # Block rig for walk-in
│       ├── RigStatusModal.tsx          # Change rig status
│       ├── AddRigModal.tsx             # Add new rig
│       ├── EditRigModal.tsx            # Edit existing rig
│       ├── AddVenueModal.tsx           # Add new venue
│       ├── EditVenueModal.tsx          # Edit existing venue
│       └── StatusConfig.ts             # Rig status colour/label config
└── lib/
    ├── auth.tsx                        # Auth context + Supabase session bridge
    ├── data.ts                         # Types + Supabase queries
    ├── supabase.ts                     # Supabase client (browser)
    ├── supabase-server.ts              # Supabase client (server / SSR)
    ├── supabase-service.ts             # Supabase service-role client (server-only, bypasses RLS)
    ├── superAdmin.ts                   # Super-admin email allowlist (single source of truth)
    ├── utils.ts                        # Shared utility functions
    ├── venueCoords.ts                  # Venue coordinate data for map
    └── hooks/
        ├── useRealtimeVenues.ts        # Real-time venue subscriptions
        └── useRateLimit.ts             # Client-side rate limiting hook
supabase/
├── seed.sql                            # Venues + rigs seed data
├── profiles.sql                        # User profiles table + trigger
├── setup_demo_admin.sql                # Demo admin account setup
├── migration_dashboard.sql             # Bookings, RLS, expanded rig statuses
├── migration_rig_type.sql              # Rig platform type column (pc/playstation/xbox/vr)
├── migration_booking_user_id.sql       # Booking user ID column
├── migration_booking_unique_constraint.sql # Unique booking constraint
├── migration_modify_booking_rpc.sql    # Modify booking RPC function
├── migration_checkin_fixes.sql         # Check-in flow fixes
├── migration_auto_release.sql          # Auto-release expired bookings
├── migration_auto_release_fn.sql       # Auto-release function
├── migration_rls_security.sql          # Row-level security policies
├── migration_public_explore_access.sql # Public access for explore page
├── migration_venue_coordinates.sql     # Venue coordinate data for map
├── migration_venue_ownership_images.sql # Venue ownership and images
├── migration_venue_rig_counts.sql      # Venue rig count aggregates
└── migration_role_security.sql         # Role assignment hardening (trigger + role column lock)
docs/
├── admin-manual-controls.md            # Admin manual controls documentation
├── gridbook-article.md                 # PitPass article / overview
├── live-rigs-and-slots.md              # Live rigs and slots documentation
└── qr-checkin.md                       # QR check-in flow documentation
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_STADIA_API_KEY` | Stadia Maps API key (free on localhost, required in production) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only, bypasses RLS — never expose to client) |

## License

Copyright 2026 PitPass. All rights reserved. See [LICENSE](LICENSE) for details.

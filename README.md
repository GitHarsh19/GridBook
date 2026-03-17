# GridBook

**Discover and book sim racing rigs at gaming venues near you.**

GridBook is a booking platform for sim racing enthusiasts to find nearby venues, browse available rigs, select time slots, and reserve their sessions. It also includes a full venue admin dashboard for managing rigs, walk-ins, and bookings in real time.

## Features

### Customer
- **Landing Page** — Clean, centered CTA to explore venues or sign in
- **Venue Discovery** — Browse gaming cafes and sim racing lounges with real-time rig availability
- **Rig Selection** — View rig specs (Fanatec DD, Logitech G Pro, VR setups, etc.) and pick your preferred setup
- **Time Slot Booking** — Select multiple 1-hour slots from 10 AM to 10 PM
- **Instant Pricing** — Total cost calculated in real-time based on rigs x slots
- **Auth** — Demo login, Google OAuth, and Supabase email/password
- **Protected Routes** — Auth-gated pages with role-based access control
- **Session Persistence** — Sessions survive page refresh via Supabase Auth
- **Responsive Design** — Dark-themed UI optimized for both mobile and desktop

### Venue Admin Dashboard
- **Live Rig Grid** — Real-time status of all rigs (available, booked, blocked, out of order)
- **Walk-In Blocking** — Block rigs for walk-in customers with 1/2/3 hr duration
- **Bookings Ledger** — Today's bookings with customer names, time slots, and verification codes
- **Out of Order Toggle** — Mark rigs as out of order and back to available
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
| `/admin/dashboard` | Admin | Live rig status, bookings & metrics |

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
│   │   └── dashboard/page.tsx      # Admin dashboard
│   ├── auth/callback/
│   │   └── page.tsx                # OAuth callback handler
│   └── venue/[id]/
│       ├── page.tsx                # Venue detail page
│       ├── layout.tsx              # Auth-gated layout
│       └── BookingClient.tsx       # Booking UI (client component)
├── components/
│   ├── Navbar.tsx                  # Global navigation bar
│   ├── VenueCard.tsx               # Venue listing card
│   ├── LoginScreen.tsx             # Login form (customer + admin tabs)
│   ├── RegisterScreen.tsx          # Registration form
│   ├── ProtectedRoute.tsx          # Auth gate wrapper
│   ├── TimeSelector.tsx            # Time slot picker
│   ├── RigGrid.tsx                 # Rig selection grid
│   └── CheckoutBar.tsx             # Booking checkout summary
└── lib/
    ├── auth.tsx                    # Auth context + Supabase session bridge
    ├── data.ts                     # Types + Supabase queries
    ├── hooks/useRealtimeVenues.ts  # Real-time venue subscriptions
    └── supabase.ts                 # Supabase client (customer + admin)
supabase/
├── seed.sql                        # Venues + rigs seed data
├── profiles.sql                    # User profiles table + trigger
└── migration_dashboard.sql         # Bookings, RLS, expanded rig statuses
```

## License

Copyright 2026 GridBook. All rights reserved. See [LICENSE](LICENSE) for details.

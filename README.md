# ⚡ GridBook

**Discover and book sim racing rigs at gaming venues near you.**

GridBook is a booking platform for sim racing enthusiasts to find nearby venues, browse available rigs, select time slots, and reserve their sessions — all in one sleek, mobile-friendly interface.

## Features

- 🔐 **Google OAuth** — Sign in with Google via Supabase Auth
- 🔑 **Role-Based Login** — Separate flows for Customers and Venue Admins
- 🏎️ **Venue Discovery** — Browse gaming cafés and sim racing lounges with real-time rig availability
- 🎮 **Rig Selection** — View rig specs (Fanatec DD, Logitech G Pro, VR setups, etc.) and pick your preferred setup
- 🕐 **Time Slot Booking** — Select multiple 1-hour slots from 10 AM to 10 PM
- 💰 **Instant Pricing** — See total cost calculated in real-time based on rigs × slots
- 📊 **Admin Dashboard** — Live rig status, today's bookings, and estimated revenue at a glance
- 🛡️ **Protected Routes** — Auth-gated pages with role-based access control
- 🔄 **Session Persistence** — Sessions survive page refresh via Supabase Auth
- 📱 **Responsive Design** — Dark-themed UI optimized for both mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
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

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Login screen with role toggle + Google OAuth |
| `/register` | Public | Account registration |
| `/auth/callback` | Public | OAuth callback handler |
| `/explore` | Customer | Venue discovery feed |
| `/venue/[id]` | Customer | Rig selection & booking |
| `/dashboard` | Admin | Live rig status & metrics |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Login page (/)
│   ├── layout.tsx                  # Root layout + AuthProvider
│   ├── auth/callback/
│   │   └── page.tsx                # OAuth callback handler
│   ├── explore/
│   │   ├── page.tsx                # Venue discovery feed
│   │   └── layout.tsx              # Auth-protected layout
│   ├── register/
│   │   └── page.tsx                # Registration page
│   ├── venue/[id]/
│   │   ├── page.tsx                # Venue data fetching
│   │   ├── BookingClient.tsx       # Booking UI (client component)
│   │   └── layout.tsx              # Auth-protected layout
│   └── dashboard/
│       ├── page.tsx                # Admin portal
│       └── layout.tsx              # Admin-only layout
├── components/
│   ├── LoginScreen.tsx             # Auth card + Google OAuth button
│   ├── RegisterScreen.tsx          # Registration + Google sign-up
│   ├── Navbar.tsx                  # Top nav with logout
│   ├── ProtectedRoute.tsx          # Route guard with loading state
│   ├── VenueCard.tsx               # Venue listing card
│   ├── TimeSelector.tsx            # Horizontal time slot picker
│   ├── RigGrid.tsx                 # Rig selection grid
│   └── CheckoutBar.tsx             # Sticky checkout summary
└── lib/
    ├── auth.tsx                    # Auth context + Supabase session bridge
    ├── data.ts                     # Types + Supabase queries
    └── supabase.ts                 # Supabase client config
supabase/
├── seed.sql                        # Venues + rigs seed data
├── rls_policies.sql                # Row-level security policies
└── profiles.sql                    # User profiles table + trigger
```

## License

Copyright © 2026 GridBook. All rights reserved. See [LICENSE](LICENSE) for details.

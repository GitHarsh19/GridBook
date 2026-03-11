# ⚡ GridBook

**Discover and book sim racing rigs at gaming venues near you.**

GridBook is a booking platform for sim racing enthusiasts to find nearby venues, browse available rigs, select time slots, and reserve their sessions — all in one sleek, mobile-friendly interface.

## Features

- 🔐 **Role-Based Login** — Separate flows for Customers and Venue Admins
- 🏎️ **Venue Discovery** — Browse gaming cafés and sim racing lounges with real-time rig availability
- 🎮 **Rig Selection** — View rig specs (Fanatec DD, Logitech G Pro, VR setups, etc.) and pick your preferred setup
- 🕐 **Time Slot Booking** — Select multiple 1-hour slots from 10 AM to 10 PM
- 💰 **Instant Pricing** — See total cost calculated in real-time based on rigs × slots
- 📊 **Admin Dashboard** — Live rig status, today's bookings, and estimated revenue at a glance
- 🛡️ **Protected Routes** — Auth-gated pages with role-based access control
- 📱 **Responsive Design** — Dark-themed UI optimized for both mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
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
| `/` | Public | Login screen with role toggle |
| `/explore` | Customer | Venue discovery feed |
| `/venue/[id]` | Customer | Rig selection & booking |
| `/dashboard` | Admin | Live rig status & metrics |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Login page (/)
│   ├── layout.tsx                  # Root layout + AuthProvider
│   ├── explore/
│   │   ├── page.tsx                # Venue discovery feed
│   │   └── layout.tsx              # Auth-protected layout
│   ├── venue/[id]/
│   │   ├── page.tsx                # Venue data fetching
│   │   ├── BookingClient.tsx       # Booking UI (client component)
│   │   └── layout.tsx              # Auth-protected layout
│   └── dashboard/
│       ├── page.tsx                # Admin portal
│       └── layout.tsx              # Admin-only layout
├── components/
│   ├── LoginScreen.tsx             # Auth card with role toggle
│   ├── Navbar.tsx                  # Top nav with logout
│   ├── ProtectedRoute.tsx          # Route guard component
│   ├── VenueCard.tsx               # Venue listing card
│   ├── TimeSelector.tsx            # Horizontal time slot picker
│   ├── RigGrid.tsx                 # Rig selection grid
│   └── CheckoutBar.tsx             # Sticky checkout summary
└── lib/
    ├── auth.tsx                    # Auth context (useState-based)
    ├── data.ts                     # Types + Supabase queries
    └── supabase.ts                 # Supabase client
```

## License

Copyright © 2026 GridBook. All rights reserved. See [LICENSE](LICENSE) for details.

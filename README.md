# ⚡ GridBook

**Discover and book sim racing rigs at gaming venues near you.**

GridBook is a booking platform for sim racing enthusiasts to find nearby venues, browse available rigs, select time slots, and reserve their sessions — all in one sleek, mobile-friendly interface.

## Features

- 🏎️ **Venue Discovery** — Browse gaming cafés and sim racing lounges with real-time rig availability
- 🎮 **Rig Selection** — View rig specs (Fanatec DD, Logitech G Pro, VR setups, etc.) and pick your preferred setup
- 🕐 **Time Slot Booking** — Select multiple 1-hour slots from 10 AM to 10 PM
- 💰 **Instant Pricing** — See total cost calculated in real-time based on rigs × slots
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

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Discovery page (/)
│   └── venue/[id]/
│       ├── page.tsx                # Venue data fetching
│       └── BookingClient.tsx       # Booking UI (client component)
├── components/
│   ├── Navbar.tsx
│   ├── VenueCard.tsx
│   ├── TimeSelector.tsx
│   ├── RigGrid.tsx
│   └── CheckoutBar.tsx
└── lib/
    ├── data.ts                     # Types + Supabase queries
    └── supabase.ts                 # Supabase client
```

## License

Copyright © 2026 GridBook. All rights reserved. See [LICENSE](LICENSE) for details.

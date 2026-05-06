# CLAUDE.md

## Behavior Guidelines

### 1. Think Before Coding
- **Never assume silently** — if a request is ambiguous, stop and ask before writing any code
- **Surface tradeoffs** — if multiple approaches exist, briefly present them and ask which to use
- **Push back when warranted** — if a simpler solution exists, say so before implementing the complex one
- **Name your confusion** — if something in the codebase is unclear, say what's unclear rather than guessing

### 2. Simplicity First
- Write the minimum code that solves the problem — nothing speculative
- No abstractions for single-use code
- No "future-proofing" or "flexibility" that wasn't asked for
- If 50 lines can do what 200 lines do, write 50
- **The test:** Would a senior engineer call this overcomplicated? If yes, simplify

### 3. Surgical Changes
- Touch only what the task requires — don't "improve" adjacent code
- Don't refactor, reformat, or rename things that aren't broken
- Match the existing code style, even if you'd do it differently
- If you spot unrelated dead code, mention it — don't delete it
- Every changed line should trace directly to the user's request

### 4. Goal-Driven Execution
- For multi-step tasks, state a brief plan before starting and confirm it
- Transform tasks into verifiable goals where possible:
  - "Fix the bug" → "Write a test that reproduces it, then make it pass"
  - "Add validation" → "Write tests for invalid inputs, then make them pass"
- State success criteria explicitly so progress can be verified

---

## Project Context

**PitPass** (`gridbook-app`) — a booking platform for sim racing rigs at gaming venues. Customers discover venues, select rigs (PC, PlayStation, Xbox, VR), pick dates, and book time slots. Venue admins manage rigs, walk-ins, bookings, and check-ins via a real-time dashboard.

### Stack
- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Frontend:** React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Toasts:** Sonner
- **QR:** qrcode / qrcode.react / @yudiel/react-qr-scanner

### Project Structure
```
src/
├── app/
│   ├── page.tsx                        # Landing page (/)
│   ├── layout.tsx                      # Root layout + AuthProvider
│   ├── actions/
│   │   ├── booking.ts                  # Server actions — create/modify/cancel bookings
│   │   └── admin.ts                    # Server actions — admin booking & rig ops
│   ├── explore/                        # Venue discovery (auth-protected)
│   ├── (customer)/                     # Login + signup pages
│   ├── admin/dashboard/
│   │   ├── page.tsx                    # Admin dashboard
│   │   ├── layout.tsx                  # Admin auth guard
│   │   └── ScannerModal.tsx            # QR check-in scanner
│   ├── auth/callback/                  # OAuth callback handler
│   ├── bookings/
│   │   ├── page.tsx                    # My bookings (upcoming/past, cancel, modify)
│   │   └── [code]/page.tsx             # Booking detail + QR ticket
│   ├── profile/page.tsx                # Edit name, change password
│   └── venue/[id]/                     # Venue detail + booking UI
├── components/
│   ├── admin/                          # Admin-specific modals (Walk-in, Add/Edit Rig & Venue, Status)
│   ├── DateSelector.tsx                # Date picker for bookings
│   ├── ModifyBookingModal.tsx          # Modify existing booking
│   ├── TicketQR.tsx                    # QR code ticket display
│   └── ...                            # Navbar, VenueCard, RigGrid, TimeSelector, CheckoutBar, ProtectedRoute
└── lib/
    ├── auth.tsx                        # Auth context + Supabase session bridge
    ├── data.ts                         # Types + Supabase queries
    ├── supabase.ts                     # Supabase client (browser)
    ├── supabase-server.ts              # Supabase client (server / SSR)
    ├── utils.ts                        # Shared utility functions
    └── hooks/
        ├── useRealtimeVenues.ts        # Real-time venue subscriptions
        └── useRateLimit.ts             # Client-side rate limiting
supabase/
├── seed.sql                            # Venues + rigs seed data
├── profiles.sql                        # User profiles table + trigger
├── migration_dashboard.sql             # Bookings, RLS, expanded rig statuses
└── migration_rig_type.sql              # Rig platform type column (pc/playstation/xbox/vr)
```

### Conventions
- Use **TypeScript** everywhere — no `any` unless absolutely necessary
- Prefer **server components** by default; use `"use client"` only when needed
- Keep components small and focused — one responsibility per component
- Use **named exports** for components, not default exports (except pages)
- Auth is managed via `lib/auth.tsx` context — don't bypass it
- Supabase queries live in `lib/data.ts` — keep data fetching centralized there
- Mutations from pages use Next.js Server Actions in `app/actions/` — not inline client fetches
- Use `lib/supabase-server.ts` for server-side Supabase access; `lib/supabase.ts` for client-side
- Real-time updates use Supabase subscriptions + 30s polling fallback (see `useRealtimeVenues`)
- Role-based access: `customer` vs `admin` roles stored in Supabase `profiles` table
- Admin components live in `components/admin/` and are barrel-exported via `admin/index.ts`
- Rigs have a `type` field (`pc`, `playstation`, `xbox`, `vr`) — shown with platform-specific icons and colors throughout the UI

### Key Rules
- Always handle loading and error states in UI components
- Never hardcode secrets — use environment variables via `.env.local`
- Don't add new dependencies without asking first
- Validate all form inputs with Zod schemas before processing

### Commands
```bash
npm run dev       # Start development server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## How to Work With Me

- **When in doubt, ask** — a quick clarifying question saves a bad implementation
- **Short plan first** — for any task touching 3+ files, outline the plan before coding
- **One thing at a time** — complete and verify each step before moving to the next

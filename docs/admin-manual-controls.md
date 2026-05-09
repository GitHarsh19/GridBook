# Part 3 — Manual Admin Controls for Ease of Operability

## Overview

PitPass gives venue owners a full set of manual controls so they are never dependent on customers taking the right steps or the system doing everything automatically. Every real-world situation a venue faces — a walk-in who didn't book online, a rig that suddenly breaks, a customer who needs to be removed from a slot, a new simulator being added to the floor — can be handled directly from the admin dashboard without touching a database or calling support.

All controls are in one place: the admin dashboard. Each action goes directly to the database and propagates live to every customer screen watching that venue.

---

## 1. Walk-In Booking

The most common manual action at any gaming cafe is handling a customer who just walks through the door without a prior booking. Rather than turning them away or managing them off-system in a notebook, admins can book them directly.

Tapping any rig on the dashboard opens the **Walk-In Modal**. The admin selects a customer name (optional), picks the time slots, and for each slot chooses how to label it: Walk-In (standard), App Booked (if entering a booking made via a different channel), or In Use (if the customer is sitting down right now during the current hour).

The system only shows today as a date option here — walk-ins are always immediate. Slots that are already booked or in the past are greyed out and unclickable, so the admin cannot accidentally double-book.

```mermaid
flowchart TD
    A["Admin taps rig on dashboard"] --> B["Walk-In Modal opens"]
    B --> C["Admin enters customer name\n(optional)"]
    C --> D["Admin selects time slots"]
    D --> E["For each slot, picks status:\nWalk-In / App Booked / In Use"]
    E --> F["Confirm"]
    F --> G["Booking rows inserted into DB"]
    G --> H["Rig status updates live\non all screens"]
```

---

## 2. Manual Rig Status Override

Sometimes a rig's status needs to be changed immediately without going through a full booking flow. A customer cancelled verbally, a rig freed up early, or an admin made an error — the **Rig Status Modal** lets them correct it in two taps.

From the modal, the admin can set any rig to:

- **Available** — rig is free, visible to customers as bookable
- **App Booked** — marks it as taken by an online booking
- **Walk-In** — marks it as taken by a walk-in customer

Each change asks for a confirmation before writing to the database, because a status change is immediately visible to every customer browsing the venue. This prevents accidental taps from incorrectly flipping a rig's state.

```mermaid
flowchart TD
    A["Admin opens Rig Status Modal"] --> B["Sees current status highlighted"]
    B --> C["Taps new status button"]
    C --> D["Confirmation dialog:\n'This updates live for all customers'"]
    D -->|Confirm| E["DB write: rigs.status updated"]
    D -->|Cancel| B
    E --> F["Realtime push to all\ncustomer screens"]
```

---

## 3. Mark as In Use (Manual Check-In)

When a customer is physically sitting down at a rig — whether they booked via the app or walked in — the admin can manually mark that rig as **In Use** from the Rig Status Modal, without scanning a QR code.

This button only activates when:

1. The date is today
2. The current hour matches the start of a booked slot for that rig

If those conditions are not met, the button is greyed out with an explanation — either "Check-in opens when the booked slot begins" or "Check-in is only available on the booking day." This prevents staff from accidentally marking a rig in use for the wrong slot.

```mermaid
flowchart TD
    A["Admin opens Rig Status Modal"] --> B{Is today's date?}
    B -->|No| C["Mark as In Use — disabled\nOnly available on booking day"]
    B -->|Yes| D{Current hour = booked slot start?}
    D -->|No| E["Mark as In Use — disabled\nOpens when slot begins"]
    D -->|Yes| F["Mark as In Use — active"]
    F --> G["Admin taps button"]
    G --> H["Confirmation dialog"]
    H -->|Confirm| I["Rig → in_use\nBooking → checked_in\nblocked_until = slot end"]
    I --> J["Live update across all screens"]
```

---

## 4. End Session

When a customer finishes early or the admin needs to free up a rig that is currently **In Use**, the **End Session** button appears in the Rig Status Modal. One tap (plus a confirmation) sets the rig back to `available` and frees the slot for the next customer — immediately visible across the dashboard and on any customer browsing that venue.

This is the manual version of the auto-release that normally happens when `blocked_until` passes. It is used when the admin needs to act before the timer expires — for example if a session runs short.

```mermaid
flowchart TD
    A["Rig status is in_use"] --> B["Admin opens Rig Status Modal"]
    B --> C["Taps End Session"]
    C --> D["Confirmation dialog"]
    D -->|Confirm| E["Rig → available"]
    E --> F["Slot freed for next customer"]
    F --> G["Realtime push — customers\nsee rig as available instantly"]
```

---

## 5. Release Walk-In

If a walk-in slot was reserved but the customer didn't show up, or the admin needs to undo a walk-in booking, the **Release Rig** button removes the walk-in booking entirely and resets the rig to `available`.

This is distinct from End Session — Release is specifically for rigs in the `blocked` (walk-in) state, and it deletes the booking rather than just marking it complete.

```mermaid
flowchart TD
    A["Rig status is blocked (walk-in)"] --> B["Admin opens Rig Status Modal"]
    B --> C["Taps Release Rig"]
    C --> D["Confirmation dialog"]
    D -->|Confirm| E["Walk-in booking removed from DB"]
    E --> F["Rig → available"]
    F --> G["Live update propagates\nto all open screens"]
```

---

## 6. Cancel a Booking

From either the Walk-In Modal or the Rig Status Modal, admins can cancel any individual booking directly — no need to contact the customer or process it elsewhere. Each booking row in the modal has a trash icon. Tapping it shows a confirmation, then permanently removes that booking record.

This works for both app-sourced and walk-in bookings, and takes effect immediately. The slot it occupied becomes available again for new bookings.

```mermaid
flowchart TD
    A["Admin opens Walk-In or Rig Status Modal"] --> B["Sees list of existing bookings"]
    B --> C["Taps trash icon on a booking"]
    C --> D["Confirmation:\n'Customer will lose their slot'"]
    D -->|Confirm| E["Booking deleted from DB"]
    E --> F["Slot now available\nfor new bookings"]
    F --> G["Realtime update to\ncustomer screens"]
```

---

## 7. Toggle Out of Order

The wrench icon on any rig tile on the main dashboard toggles it between `available` and `out_of_order`. This is a quick one-tap action designed for when a rig breaks mid-session and needs to be pulled from service immediately.

When `out_of_order`, the rig is hidden from customers as a bookable option. The admin can restore it with another tap of the same icon. There is no confirmation dialog for this — it is intentionally fast because a broken rig needs to be taken offline without delay.

```mermaid
flowchart TD
    A["Rig breaks or needs maintenance"] --> B["Admin taps wrench icon\non rig tile"]
    B --> C{Current rig status?}
    C -->|available| D["Rig → out_of_order"]
    C -->|out_of_order| E["Rig → available"]
    D --> F["Customers can no longer\nbook or see it as available"]
    E --> G["Rig restored, visible\nand bookable again"]
    F --> H["Live across all screens"]
    G --> H
```

---

## 8. Add / Edit / Delete a Rig

Venue owners can manage their full rig inventory from the dashboard without any backend access. The **Add Rig** button opens a form to create a new simulator with a name, specs (hardware description), and initial status. The **Edit** (pencil) icon on any rig lets them rename it, update specs, change status, or delete it entirely.

Deleting a rig is a hard delete with a confirmation — it removes the rig and cascades to all associated bookings. The system warns the admin before proceeding.

```mermaid
flowchart TD
    A["Admin taps Add Rig"] --> B["Form: name, specs, status"]
    B --> C["Confirm"]
    C --> D["New rig inserted into DB"]
    D --> E["Appears on dashboard\nand customer venue page instantly"]

    F["Admin taps pencil icon on rig"] --> G["Edit Rig Modal"]
    G --> H["Change name / specs / status"]
    H --> I["Save"]
    I --> J["DB updated, live push"]

    G --> K["Taps Delete"]
    K --> L["Confirmation: removes rig\nand all its bookings"]
    L -->|Confirm| M["Rig and bookings\ndeleted from DB"]
```

---

## 9. Add / Edit / Delete a Venue

Admins who manage multiple locations can add, edit, or remove entire venues from the dashboard. The **Add Venue** form collects name, location, pricing, description, image URL, and map coordinates (latitude/longitude for the map view on the Explore page).

Editing updates any of those fields. Deleting a venue cascades — it removes all rigs and their bookings associated with that venue, so admins are shown a clear warning before confirming.

```mermaid
flowchart TD
    A["Admin taps Add Venue"] --> B["Form: name, location, price,\ndescription, image, coordinates"]
    B --> C["Confirm"]
    C --> D["Venue inserted into DB"]
    D --> E["Appears on Explore page\nfor customers"]

    F["Admin selects venue\nand taps Edit"] --> G["Edit Venue Modal"]
    G --> H["Update any field"]
    H --> I["Save — DB updated live"]

    G --> J["Taps Delete"]
    J --> K["Warning: deletes venue +\nall rigs + all bookings"]
    K -->|Confirm| L["Full cascade delete from DB"]
```

---

## Summary — What the Admin Can Control Manually

```mermaid
flowchart LR
    Admin["Venue Admin"] --> WI["Walk-In Booking\nBook any slot for a\nnon-app customer"]
    Admin --> SO["Status Override\nSet rig to Available /\nApp Booked / Walk-In"]
    Admin --> MU["Mark In Use\nManual check-in\nduring active slot"]
    Admin --> ES["End Session\nFree rig early\nbefore timer expires"]
    Admin --> RR["Release Rig\nUndo a walk-in\nbooking"]
    Admin --> CB["Cancel Booking\nRemove any booking\nfrom any rig"]
    Admin --> OO["Out of Order\nTake rig offline\ninstantly"]
    Admin --> AR["Add / Edit / Delete\nRigs and Venues"]

    WI --> DB[(Supabase DB)]
    SO --> DB
    MU --> DB
    ES --> DB
    RR --> DB
    CB --> DB
    OO --> DB
    AR --> DB
    DB --> Live["Live update to\nall open screens"]
```

Every one of these actions writes directly to the database and propagates via Supabase Realtime to every open customer screen within seconds. Admins are never working in a local view that conflicts with what customers see — the dashboard and the customer app are always looking at the same live data.

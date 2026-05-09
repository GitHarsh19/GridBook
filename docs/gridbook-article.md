# From a Missed Gaming Session to a Product: How I Thought Through GridBook

---

## 1. The Discovery Moment

This didn't start with a business plan. It started with showing up to a gaming cafe with three friends on a Saturday evening — and leaving 40 minutes later without playing a single game.

The venue was packed. There was no waitlist, no way to check availability online, nothing. The guy at the counter was fielding phone calls, managing walk-ins, and trying to keep track of which rigs were free — all from memory and a notebook. One of my friends had actually come to this same place the week before and walked out after waiting 30 minutes with no update.

I looked around and noticed something: this wasn't a one-off bad day. This was the default experience. Customers had no visibility into availability before showing up. Operators had no tools beyond a phone and a notebook.

That's when I stopped thinking like a customer and started thinking like a PM.

---

## 2. Defining the Problem Space

Before jumping to solutions, I tried to structure what I'd actually observed.

**Two distinct user segments emerged:**
- **Customers** — ranging from dedicated gamers who care about rig specs and platform type, to casual groups who just want a fun evening out
- **Venue operators** — small business owners running 4-10 rigs, juggling walk-ins, phone reservations, and equipment issues simultaneously

I framed it using Jobs To Be Done:
- **Customer JTBD:** *"When I want to game with friends, help me know if there's a slot available before I leave home."*
- **Operator JTBD:** *"When my venue is busy, help me manage demand without being on the phone all day."*

The real insight was distinguishing root cause from symptom. The problem wasn't "venues are fully booked." The problem was the **complete absence of a discovery and reservation layer** in the gaming cafe industry. Customers couldn't plan. Operators couldn't forecast. Everyone was operating blind.

---

## 3. Market Observation — Why Hasn't This Been Solved?

This question mattered to me. If the problem was real, why was no one solving it?

I looked at comparable verticals. Salons have Booksy. Restaurants have Dineout. Coworking spaces have dedicated platforms. All of these industries went through a digitisation wave — but gaming cafes in India hadn't.

The reasons became clear pretty quickly. Most gaming cafes are informal, owner-operated setups. They're running on thin margins. The operators aren't looking for enterprise SaaS — they need something that fits into how they already work, not something that asks them to change everything.

The gap wasn't demand. People were showing up in droves. The gap was that **no one had built the right abstraction** for this specific vertical — something lightweight enough for a small operator but structured enough to actually solve the availability problem.

---

## 4. Prioritising What to Build First

This is where I had to be disciplined. The temptation was to build everything — reviews, payments, loyalty programs, analytics. But none of that matters if the core booking loop doesn't work.

**The core loop I committed to:** Discover a venue, see what's available, pick a rig, pick a time slot, book it.

That's it. That's the MVP.

But within that simplicity, a few decisions were non-negotiable:

**Walk-in blocking for admins.** Gaming cafes are still heavily walk-in driven. If I built a booking tool that ignored walk-ins, operators would have double-bookings within the first hour. So I made walk-in blocking a first-class feature — an admin can mark a rig as occupied by a walk-in, and the system respects that just like an app booking. This wasn't a nice-to-have. Without it, the tool would be unusable in the real world.

**Real-time availability updates.** If a customer sees a slot as available, books it, and then finds out it was taken 30 seconds ago — you've broken the core promise. I implemented real-time Supabase subscriptions backed by a 30-second polling fallback. Stale data wasn't an option.

**Deliberate omissions:** No reviews, no payment processing, no loyalty points. Not because they don't matter, but because the core value had to prove itself first. A booking platform that can't reliably book is worthless regardless of how many features surround it.

---

## 5. User Flows & Key Product Decisions

I designed two parallel experiences — one for customers, one for operators — because a two-sided product fails if either side doesn't work.

### Customer Flow

**Venue discovery with live availability signals.** The explore page shows venues with real-time rig counts — "4 of 6 rigs available" — so customers can make decisions before committing to a trip. This single data point eliminates the biggest pain point: showing up to a full venue.

**Rig selection with specs.** This was a deliberate choice. Gamers care about what they're sitting in — the platform (PC, PlayStation, Xbox, racing rig, VR), the hardware specs, the screen setup. A generic "book something" interface wouldn't work for this audience. Showing platform type and specs builds confidence and reduces post-booking disappointment.

**Time slots with instant pricing.** Twelve one-hour slots from 10 AM to 10 PM, with the price visible upfront. No surprises, no hidden fees. Transparency before commitment reduces drop-off — if someone has to wonder "how much will this cost?", you've already lost them.

### Operator Flow

**Live rig grid as the primary dashboard view.** Operators don't have time to read reports. They need to glance at a screen and know instantly: which rigs are booked, which are free, which have walk-ins, which are broken. The dashboard is a visual grid — each rig is a card with a colour-coded status. Available, booked, in use, blocked by walk-in, or out of order. One look, full picture.

**Walk-in blocking as a first-class action.** Not buried in a menu. Not an afterthought. It's a primary action on the dashboard because it reflects how these venues actually operate today. I designed *with* existing operator behaviour instead of fighting against it.

**Out of order toggle.** Simple but critical. If a rig's wheel is broken and it still shows as available online, the first customer who books it and shows up to a broken setup will never trust the platform again. One toggle, and the rig drops out of the available pool. Trust is maintained.

**QR code check-in.** Each booking generates a unique QR code. When a customer arrives, the operator scans it with the dashboard's built-in scanner. The booking is verified, the rig status flips to "in use," and there's a clear audit trail. No more "I booked online" arguments with no way to verify.

---

## 6. What I'd Measure if This Were Live

Building the product is one thing. Knowing if it's working is another. Here's how I'd think about success:

- **Activation rate:** What percentage of signups complete their first booking? If people are signing up but not booking, the funnel has a problem.
- **Operator daily active usage:** Are admins logging into the dashboard every day? If the tool isn't part of their daily routine, it's not solving their problem.
- **Slot utilisation rate:** Are venues filling more slots with GridBook than they were before? This is the ultimate proof of value.
- **Booking funnel drop-off:** Where exactly do users abandon? After selecting a venue? After seeing time slots? At checkout? Each drop-off point tells a different story.

**North Star Metric: Confirmed bookings per venue per week.** This single number captures both sides of the marketplace — customers are finding value (they're booking) and operators are finding value (their slots are filling up).

---

## 7. What I'd Build Next

If the core loop proves itself, here's how I'd expand — prioritised by user impact and operator value, not by what's technically exciting:

1. **Waitlist feature.** If a venue is fully booked, let customers join a waitlist and get notified on cancellation. This captures demand that currently just walks away.

2. **Venue ratings and reviews.** Post-session reviews build trust for new customers and give operators feedback. But this only matters once there's enough booking volume to generate meaningful reviews — hence why it's not in the MVP.

3. **Payment integration.** Prepayment reduces no-shows and increases operator confidence in the platform. But it also adds friction to the booking flow, so it needs to be introduced carefully.

4. **Operator analytics.** Peak hours, most popular rigs, revenue trends, no-show rates. Once operators depend on the platform daily, giving them data to optimise their business becomes a natural extension.

5. **Multi-venue management.** For operators who run more than one location, a unified dashboard. This is the scaling play — but only relevant once single-venue adoption is strong.

---

## 8. What Building This Taught Me About Product

The best problem discovery happens in the field, not in a brief. I didn't set out to do user research — I went to play a racing game with friends. But paying attention to what was happening around me turned a frustrating evening into a product idea worth building.

Operator workflows matter as much as customer delight. It's easy to obsess over the customer experience and forget that someone has to run the other side. A booking platform that customers love but operators can't use is a platform that dies. The walk-in blocking feature, the rig status toggles, the QR check-in — these aren't glamorous, but they're what make the tool actually usable in a real venue.

Constraints sharpen decisions. Knowing I was building an MVP forced me to ask one question repeatedly: *"What is the one thing that must work?"* Every feature that didn't directly answer that question got cut. That discipline is harder than it sounds — and more valuable than most of the code I wrote.

GridBook isn't just a project. It's proof that product thinking starts before the first line of code — and that the best products come from paying attention to problems that are right in front of you.

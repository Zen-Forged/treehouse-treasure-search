# Treehouse Finds — App Functionality Overview

> **Last updated:** April 26, 2026
> **Live at:** app.kentuckytreehouse.com
> **Status:** Pre-beta · feature-complete for V1 · invite-ready

---

## What it is

Treehouse Finds is a calm, story-driven discovery app for vintage, antique, and thrift finds across Kentucky and Southern Indiana. It connects three audiences: **shoppers** browsing finds before making the trip, **vendors** posting their inventory without running a full e-commerce stack, and **mall operators** receiving organic foot traffic through their vendors' content.

The product is built around a single promise — **Embrace the Search. Treasure the Find. Share the Story.** — and is designed to feel like a journal, not a marketplace. There are no prices in the feed, no checkout, no urgency — just a quiet, beautiful path from "I saw this" to "I'm going there."

---

## How the audiences come together

| Role | Front door | Account needed |
|---|---|---|
| Shopper | `/` Discovery Feed | No — frictionless browse |
| Vendor | `/login` (6-digit OTP) | Yes — passwordless sign-in |
| Mall operator | (organic; no UI yet) | Indirect — benefits from vendor activity |
| Admin / platform | `/admin/login` (PIN) | Yes — PIN-gated |

---

## What Shoppers can do

- **Browse a paper-masonry feed** of finds across all participating malls — no prices in the feed by design, so the focus stays on the object and the story
- **Filter by mall** via a tactile bottom-sheet selector
- **View any find in full-bleed detail** — full-screen photo, AI-generated story-style caption, vendor name, booth location, mall address with one-tap directions to Apple Maps
- **Pinch-zoom photos** in a full-screen lightbox for close inspection of textures, signatures, and condition
- **Save finds to a personal Find Map** — saved finds gather as a journal itinerary with a cartographic spine, mall pins, and booth markers
- **See saved-but-sold finds** preserved in the Find Map even after they sell — the find may be gone, but the memory of saving it isn't
- **Browse mall profiles** — every find from a single mall, plus directions
- **Browse vendor booth pages** — every find from a single vendor's booth, presented as their personal shelf
- **Read relative timestamps** ("2h ago", "yesterday") below every find
- **Share any find with a friend** via the device's native share

## What Vendors can do

- **Sign in passwordlessly** with a 6-digit OTP code emailed to them — no password to lose, no account creation friction
- **Apply to join remotely** via the public vendor request form, including a booth-proof photo as verification
- **Get approved with a single tap** by admin — receives a branded approval email with sign-in instructions
- **Manage a personal "My Shelf"** showing every find they've posted, organized as Window View (visitor preview) + Shelf View (vendor working surface)
- **Add a Find with three taps** — take/upload item photo → optionally photograph the inventory tag → publish
- **Auto-fill title and price** by photographing the booth's inventory tag — a Claude Sonnet 4.6 vision model reads the printed/handwritten tag and prefills the post
- **Generate a story-driven caption** automatically — Claude writes Treehouse-tone copy about each find that the vendor can edit before publishing
- **Edit, delete, or mark as sold** any of their existing finds
- **Share their booth** via a single share button on the masthead — generates an invite-style email with their finds
- **Upload a hero banner image** to give their booth its own visual identity
- **Own multiple booths under one account** — vendors with booths in different malls or different sections see a booth picker and can switch active booth in one tap

## What Admin / platform owners can do

- **Sign in via PIN** at a dedicated admin entry point
- **Review pending vendor requests** with applicant info, mall, booth number, and verification photo
- **Approve or reject requests** with one tap — approval automatically creates the vendor record, links the auth user, and fires a branded approval email
- **Diagnose collisions inline** — when a request conflicts with an existing booth or vendor, the admin sees a structured diagnosis (slug collision, booth claim collision, name mismatch) and a path to resolution
- **Moderate posts** — view all posts platform-wide, hide or delete inappropriate content
- **Upload featured hero banners** for the Home feed and Find Map — graceful collapse when no banner is set, so the surfaces never break
- **View live event analytics** — every interaction (find viewed, post created, vendor signed in) is captured in a queryable events table; the Events tab shows the latest activity
- **Receive automatic email notifications** — vendor request receipts and approval emails fire via Resend without any manual sending
- **Toggle malls active or inactive** — a mall operator can be hidden from the selector without deleting the data
- **Share any vendor's booth** with the same share affordance vendors use (admin override for outreach)

---

## Under the hood

Treehouse Finds runs on a modern, low-maintenance stack:

- **Hosted on Vercel** with a custom domain at `app.kentuckytreehouse.com`
- **Built with Next.js 14** for fast, mobile-first page loads
- **Data on Supabase Postgres** with row-level security on all sensitive tables
- **AI by Anthropic** — Claude Sonnet 4.6 (caption + tag extraction) and Claude Opus 4.7 (advanced vision tasks)
- **Email via Resend** with a branded sender (`hello@kentuckytreehouse.com`)
- **Real-time error monitoring** via Sentry — both client-side and server-side errors are captured silently with personal data scrubbed, alerting the team within seconds of a real bug
- **Mobile-PWA-ready** — installable to the iPhone home screen, full-screen experience
- **iOS-safe storage** — wrapped local storage with session-storage and in-memory fallbacks for privacy-hardened browsers

---

## What's next (Horizon 1)

The Beta+ roadmap sequences 15 epic-level items across three horizons. Horizon 1 — the next sprint cluster — includes:

- **Feed content seeding** — 10–15 real posts across 2–3 vendors to take the app off "demo" footing
- **First beta vendor invitations** — gated on one quiet week of monitoring after content lands
- **"Claim this booth" flow** — let pre-existing vendors claim a booth that's already in the system
- **Guest profiles + saved-find persistence** — bookmarks survive device loss
- **Analytics dashboard** — the events being captured today get a richer admin view

---

## In one line

A calm, story-driven local discovery app for Kentucky and Southern Indiana antique malls — pre-beta, feature-complete, invite-ready as soon as content seeds.

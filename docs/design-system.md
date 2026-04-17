# Treehouse — Design System
> Version: 0.1 (scaffold) | Created: 2026-04-17 session 11 | Owned by: Design agent
> This document is the canonical source of truth for the Treehouse visual and interaction system.
> Any multi-screen UI work must scope against this document before code is written.

---

## Purpose

This document exists to prevent the cross-screen drift that has accumulated across the first ten sessions of this project. Specifically:

- Three parallel visual themes live in the codebase (warm parchment, dark forest, light-cream hybrid)
- Three different words for "sold" appear in different surfaces ("Found a home", "Sold", "Unavailable")
- At least four distinct button treatments exist across screens
- The `lib/tokens.ts` file is the stated source of truth but several pages still inline their own local `C` color object instead of importing it
- No canonical component library for cards, headers, or location displays — each page reimplements

This document fixes that by naming the system explicitly, then holding every new change accountable to it.

---

## Status: scaffold, not yet authoritative

This file is **scaffolded but not yet populated with full design direction.** Session 11 activated the Design agent and put the structure in place. The Design agent's first real pass — which will fill in the unresolved sections below — happens in a dedicated upcoming session alongside the first design direction for the Booth page and related surfaces.

**Until that pass happens, the commitments in this doc are limited to:** what's explicitly documented in `lib/tokens.ts`, the Brand Rules table in `docs/DECISION_GATE.md`, and the behavior-backed commitments called out below. Everything else is currently ambiguous and will be resolved by the Design agent.

---

## The brand metaphor

Treehouse should feel like:
- A well-bound field notebook
- A small-batch shop's curated display
- A thoughtful museum audio guide
- A magazine feature on a local artisan

Treehouse should **not** feel like:
- An e-commerce marketplace (Etsy, eBay, Facebook Marketplace)
- A SaaS dashboard
- A generic AI app
- A project management tool
- A social network feed

When in doubt about any specific design decision, the tiebreaker is: *which of the above does this choice push us toward?*

---

## Currently committed (behavior-backed)

These are the parts of the system where the code already enforces a decision and the Design agent treats them as committed unless explicitly revised.

### Color tokens (source: `lib/tokens.ts`)

| Token | Value | Role |
|---|---|---|
| `bg` | `#f5f2eb` | Primary background (warm parchment) |
| `surface` | `#edeae1` | Card and elevated surface background |
| `surfaceDeep` | `#e4e0d6` | Inset or recessed surface |
| `emptyTile` | `#dedad2` | Empty-state placeholder tile |
| `border` | `rgba(26,24,16,0.09)` | Default hairline border |
| `borderLight` | `rgba(26,24,16,0.05)` | Softer subdivider border |
| `textPrimary` | `#1c1a14` | Headings and primary body text |
| `textMid` | `#4a4840` | Secondary body text |
| `textMuted` | `#8a8476` | Meta labels, subdued copy |
| `textFaint` | `#b4ae9e` | Disabled or ghost text |
| `green` | `#1e4d2b` | Brand accent, CTAs, active states |
| `greenLight` | `rgba(30,77,43,0.08)` | Green surface tint |
| `greenSolid` | `rgba(30,77,43,0.90)` | Filled green button |
| `greenBorder` | `rgba(30,77,43,0.20)` | Green-tinted border |
| `red` | `#8b2020` | Destructive actions only |
| `redBg` | `rgba(139,32,32,0.07)` | Destructive surface tint |
| `redBorder` | `rgba(139,32,32,0.18)` | Destructive border |
| `header` | `rgba(245,242,235,0.96)` | Sticky/floating header fill (with blur) |
| `bannerFrom` / `bannerTo` | `#1e3d24` / `#2d5435` | Cinematic green banner gradient |
| `tag` / `tagBorder` | `#faf8f2` / `#ccc6b4` | BoothBox legacy pill (review for consolidation) |

**Rule:** Pages must `import { colors } from "@/lib/tokens"` instead of defining a local `C` object. Several pages (`app/login/page.tsx`, `app/post/page.tsx`, `app/post/preview/page.tsx`, `app/setup/page.tsx`, `app/vendor/[slug]/page.tsx`) currently violate this. A cleanup pass will bring them into compliance as part of the Booth-page redesign work or a dedicated pass.

### Radius scale (source: `lib/tokens.ts`)

| Token | Value |
|---|---|
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 20 |
| `pill` | 999 |

### Spacing scale (source: `lib/tokens.ts`)

| Token | Value | Use |
|---|---|---|
| `pagePad` | 16 | Outer page padding |
| `cardPad` | 14 | Inner card padding |
| `sectionGap` | 24 | Space between major sections |
| `contentGap` | 16 | Space between related content blocks |
| `tileGap` | 10 | Gap in grids |

**Status:** Underused. Most pages inline magic numbers (`16, 14, 12, 24, 22, 18`). Normalizing to the scale is a candidate cleanup pass.

### Typography commitments (source: Brand Rules in DECISION_GATE.md)

- **Georgia, serif** for titles, captions, emotional moments
- **system-ui / system sans** for UI labels, meta text, data
- Italic Georgia for pull-quote-style captions
- Monospace for booth numbers, prices, and data fields only

**Tension:** Georgia is currently overused — body copy, UI labels, empty-state text all use it across most pages. This makes headers feel dated because serifs end up doing utilitarian work. Recommendation for Design agent's first pass: establish a clear usage rule (e.g. Georgia for titles + captions only, system sans for everything else including body). Pending decision.

### Terminology commitments

- **"Found a home"** is the only word for sold items. Never "Sold" or "Unavailable."
  - Currently violated on `/mall/[slug]` ("Sold") and `/vendor/[slug]` ("Unavailable"). These are orphan routes being retired, but the terminology commitment is system-wide.
- **"Booth"** for vendor physical locations
- **"Find"** for a single item
- **"Shelf"** for a vendor's collection of finds
- **"Treehouse Spot"** for a mall (per the feed dropdown label — may revise)

### Motion commitments

- Entry animations: `initial={{ opacity: 0, y: 8–16 }} animate={{ opacity: 1, y: 0 }}`
- Ease: `[0.25, 0.46, 0.45, 0.94] as const` or `[0.25, 0.1, 0.25, 1]`
- Stagger: `Math.min(index * 0.04, 0.28)` for grid items
- Tap feedback: `whileTap={{ scale: 0.97–0.985 }}` or a spring-based scale on grid tiles
- **Never** mix a centering transform with Framer Motion's `y` animation on the same element — use a wrapper div for centering (see DECISION_GATE Tech Rules for the recurring Framer Motion gotcha)

### Interaction commitments

- Mobile-first, max-width 430px for every page
- Bottom nav is fixed, `backdropFilter: blur(24px)`, respects `safe-area-inset-bottom`
- Tap targets minimum 44×44px (per iOS HIG); Approve button on `/admin` was recently sized to this minimum
- `safeStorage` wrapper for all client localStorage access (Safari ITP resilience)

---

## Unresolved — pending Design agent's first pass

These are the sections that need direction before the next cross-screen UI work begins. Each is called out by David or surfaced in session 11's UX conversation as an active source of drift.

### Booth page direction

**Context:** `/shelf/[slug]` (public) and `/my-shelf` (owner) are two states of the same conceptual surface. This is the single most important page for vendor pride — the page they'll text to friends. Currently reads as inventory, not showcase.

**To decide:**
- Editorial 2-column layout (possibly with occasional full-width hero items) vs. current 3-column square grid
- Curator's statement treatment — where does the vendor bio live visually? How prominent?
- Tab system (On Display / Found a home) vs. woven treatment where found items live in-flow with gray treatment
- Share affordance placement and visual weight
- Location treatment — the single-line "Booth 369 · America's Antique Mall, Louisville" statement vs. the current separated pill-and-card pattern

### Find Detail page direction

**Context:** The find page is working but has three specific issues called out in session 11.

**To decide:**
- Integrated location line: booth + mall + directions as one visual statement (kill the left-booth-pill / right-map-link split)
- Title / availability / caption hierarchy: currently equal weight, needs a dominant title with subordinate availability and magazine-pull-quote caption
- "Explore the Booth" CTA: needs visual weight appropriate to being the primary bridge from Find → Booth. Possibly a vendor avatar or color swatch incorporated

### Feed header and mall selector direction

**Context:** The feed is the front door. Two specific issues.

**To decide:**
- Sign-in affordance placement — move out of the title row (current) into a quiet profile icon top-right, or to the footer CTA area, or behind a menu
- Mall selector — replace the native `<select>` with a bottom-sheet pattern. This becomes a reusable component for the whole product (future mall filtering on Find Map, vendor mall assignment in `/post`, etc.)

### Find Map emotional redesign

**Context:** Concept is right (trip itinerary), execution reads as project management.

**To decide:**
- Drop "First stop / Last stop" labels or keep
- Timeline spine treatment — current clean vertical line vs. a more earthy dotted-path or subtle meander
- Multi-stop directions link at the bottom of each stop (Apple Maps and Google Maps both support multi-waypoint URLs)
- Opening copy line — current is data-flavored, should feel more like "a Saturday morning plan"

### Header pattern system

**Context:** Every page currently uses the same sticky blur + logo + Georgia title header. No spatial hierarchy between contexts.

**To decide:**
- Three header modes: **cinematic** (transparent over hero image, for Booth hero / Find Detail), **standard** (sticky blur with title + nav, for Feed / Find Map / admin), **minimal** (just back button + title, for form-style pages like `/vendor-request` or `/post`)
- Decide which current pages map to which mode and document the pattern

### Button system

**Context:** At least four distinct button treatments live in the codebase inline. Needs consolidation.

**To decide:**
- **Primary** — filled green, white text, for single-primary-action contexts (Save to Shelf, Approve, Request access)
- **Secondary** — ghost green on green-light bg with green border, for bridges between contexts (Explore the Booth, View Booth, Discover more finds)
- **Tertiary / text** — underlined green link for inline links within prose
- **Destructive** — red variant, only for delete/cancel-with-consequence
- Padding, radius, min-height, font specs for each
- Then a cleanup pass to migrate every inline button to the system

### Card pattern system

**Context:** At least three card treatments across the app — Booth Finder card, Find Map booth stop card, admin request card. They share visual DNA but drift in detail.

**To decide:**
- Canonical card pattern: padding, border, radius, shadow, internal typography stack
- Variants: plain card, card with thumbnail-left, card with right-aligned metric, card with CTA-at-bottom

### Location statement pattern

**Context:** The single-line "Booth 369 · America's Antique Mall · Louisville" integrated statement is the fix for the find-detail location issue — and it's a pattern that should exist everywhere a find or vendor references a physical location.

**To decide:**
- Single component with props for booth, mall, city, with optional directions link
- Typography treatment consistent with the rest of the system (which is itself pending)
- Behavior: tap booth pill to open vendor shelf, tap mall name to open maps — or unified single-tap opens maps

---

## How this document gets maintained

1. **Before any multi-screen UI work:** Design agent reviews this doc, flags any unresolved sections that bear on the work, and drafts updates if new patterns are being introduced
2. **David reviews** the proposed design spec before Dev writes code
3. **Once approved,** Dev executes against the documented spec
4. **Any drift discovered during Dev work** comes back to this doc before shipping — either by updating the doc to match reality, or by correcting the code to match the doc, with the choice deliberate
5. **At session close,** Docs agent verifies no UI shipped without a corresponding doc update; flags drift in the close summary

---

## Related documents

| File | Purpose |
|---|---|
| `lib/tokens.ts` | Implemented color, radius, spacing tokens (the code-level source of truth) |
| `docs/DECISION_GATE.md` | Brand Rules, Tech Rules, Agent Roster (the operating constitution) |
| `docs/onboarding-journey.md` | Sister canonical spec for vendor onboarding flows — same authority pattern |
| `CONTEXT.md` | Full architecture reference; contains a legacy design-system section that will migrate into this doc over time |
| `.claude/MASTER_PROMPT.md` | Session-open protocol — includes Design agent standup |

---
> This document is the canonical source of truth for the Treehouse design system.
> It is maintained by the Design agent and reviewed by David at each design-adjacent session.
> Last updated: 2026-04-17 (session 11 — scaffold; first direction pass pending)

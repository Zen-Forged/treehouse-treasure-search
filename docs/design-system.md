# Treehouse — Design System
> Version: 0.2 | Last updated: 2026-04-17 session 12 | Owned by: Design agent
> This document is the canonical source of truth for the Treehouse visual and interaction system.
> Any multi-screen UI work must scope against this document before code is written.

---

## Purpose

This document exists to prevent the cross-screen drift that accumulated across sessions 1–10. It names the system explicitly and holds every new change accountable to it. When it disagrees with the code, the code is the thing that changes — unless the disagreement surfaces a better direction, in which case the doc updates first, then code.

---

## Status

**v0.2 — first full direction pass complete.** Cross-cutting patterns and four priority screens are committed. A handful of decisions are deliberately deferred and labeled `PENDING` with a clear owner. Implementation (Dev agent) can proceed against v0.2 for Booth page, Find Detail polish, Feed header, and Find Map.

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

**Audience note (committed v0.2):** Many of our vendors are 50+ and value pages that feel familiar and calm, not visually novel. When the choice is between "premium editorial magazine" and "comfortable, legible, familiar" — pick familiar, and let premium come from restraint and materiality, not from unusual layouts.

---

## Cross-cutting primitives

### Color tokens (source: `lib/tokens.ts` — unchanged from v0.1)

All color tokens stay as implemented in `lib/tokens.ts`. Pages must `import { colors } from "@/lib/tokens"` — no local `C` objects. Cleanup pass tracked as a follow-on.

### Typography rule — COMMITTED v0.2

Three faces, each with an explicit job. Georgia is reserved for emotional beats. System-ui carries the chrome.

| Use | Face | Why |
|---|---|---|
| Hero vendor names, find titles on detail pages, curator's statements, pull-quote captions, empty-state headlines | **Georgia** | The soul. Rare by design — earns its weight through restraint. |
| Eyebrow labels, meta text, tab labels, button labels, body copy, form labels, UI chrome, addresses (non-numeric) | **system-ui** (`-apple-system, "Segoe UI", Roboto, sans-serif`) | The voice. Calm, modern, legible at small sizes. Does 90% of the typography load. |
| Booth numbers, dates, timestamps, prices (if shown), any data that benefits from precision | **system-ui monospace** (`ui-monospace, SFMono-Regular, Menlo, monospace`) | Data affordance — signals factual, precise content. |
| Italic pull-quote captions on Find Detail and the curator's statement on Booth | **Georgia italic** | The emotional beat. One per screen maximum. |

**Committed sizes:**

| Role | Size | Face | Weight | Notes |
|---|---|---|---|---|
| Display | 30px | Georgia | 500 | Hero vendor name |
| Title | 22–28px | Georgia | 500–700 | Find detail title, page titles |
| Subtitle | 15–17px | Georgia italic | 400 | Pull-quotes, curator statements |
| Body | 14px | system-ui | 400 | Card body copy, descriptions |
| Meta | 12–13px | system-ui | 500 | Location statements, status, timestamps |
| Eyebrow | 10–11px | system-ui | 600 uppercase | Section labels, tab labels, 1.4–1.6px tracking |
| Data | 13px | mono | 500–600 | Booth numbers |

**Cleanup follow-on:** every page has inline Georgia at 9/10/11/12/13px doing chrome work (booth pills, eyebrow labels, empty-state copy). Migration to system-ui happens in a dedicated cleanup pass, not the Booth-redesign sprint.

### Header pattern system — COMMITTED v0.2

Three modes. Every screen maps to exactly one.

| Mode | Look | Used for |
|---|---|---|
| **A — Cinematic** | No sticky bar. Navigation floats as frosted circles over the hero image. Title lives over or directly beneath the image. | Booth page (both states), Find Detail |
| **B — Editorial** | Sticky `colors.header` bg, `backdrop-filter: blur(24px)`, logo + "Treehouse Finds" wordmark left, context action right. Page title in content area, not in the bar. | Feed, Find Map, `/flagged`, `/admin` |
| **C — Minimal** | Transparent bg, `1px solid colors.border` bottom, no blur. Back button left, title center, no right action (or very subtle). | `/post`, `/post/preview`, `/vendor-request`, `/setup`, `/login` |

### Button system — COMMITTED v0.2

Four variants. Every inline button in the codebase migrates to one of these.

| Variant | Style | When | Examples |
|---|---|---|---|
| **Primary** | Filled `colors.green`, white text, 14px system-ui 600, 44px min-height, `radius.md`, 16px horizontal padding | Single primary action per screen, max one | "Request booth access", "Approve", "Publish" |
| **Secondary** | `colors.greenLight` bg, `colors.green` text, `1px solid colors.greenBorder`, same dims as Primary | Context bridges, navigational actions | "Explore the Booth", "Explore the full mall", "Open in Maps" |
| **Ghost** | Transparent, `colors.textMid`, `1px solid colors.border`, same dims | Quiet alternatives, cancels, dismissals | "Cancel", "Back to feed" |
| **Link** | No bg, no border, `colors.green`, system-ui 500, inline-height | Inline with prose or tertiary actions | "Keep exploring →", "Directions →", "Edit your story" |

**Destructive:** Ghost variant with `colors.red` text and `colors.redBorder`. Only for delete / cancel-with-consequence. Never Primary.

**Tap feedback:** all variants `whileTap={{ scale: 0.97 }}` except Link.

### Card pattern system — COMMITTED v0.2

One canonical card. Four composition variants.

**Canonical base:**
- `background: colors.surface`
- `border: 1px solid colors.border`
- `border-radius: radius.md` (12)
- `padding: spacing.cardPad` (14–16)
- No shadow. The border does the lift.

**Variants:**
1. **Plain** — base only. Admin list items, simple cards.
2. **Thumbnail** — small square image left, content right, 12px gap.
3. **Metric** — content left, right-aligned number/action. Admin approval card.
4. **CTA** — base + full-width button at bottom inside the padding. Find Detail location card, Booth page location card, Find Map stop cards.

### Location statement pattern — COMMITTED v0.2

Canonical form:
```
⌂  Booth 369 · America's Antique Mall · Louisville
   1555 Hurstbourne Pkwy      Directions →
```

- Leading icon: `MapPin` 14px, `colors.textMuted`
- Line 1: `Booth {N}` (mono 13px `colors.textPrimary` 600) · `{Mall name}` (system-ui 13px `colors.textPrimary` 500) · `{City}` (system-ui 13px `colors.textMuted` 400)
- Line 2 (optional, full form only): address (system-ui 12px `colors.textMuted`) + trailing "Directions →" Link button, right-aligned on same line

**Compact variant** — just the row-1 data line, white or light color on dark backgrounds. Used on hero banners over images.

**Component name:** `<LocationStatement>` in `components/LocationStatement.tsx`. Spec committed by Design agent; Dev implements during Booth page redesign.

### Motion commitments (unchanged from v0.1)

- Entry: `initial={{ opacity: 0, y: 8–16 }} animate={{ opacity: 1, y: 0 }}`
- Ease: `[0.25, 0.46, 0.45, 0.94] as const` or `[0.25, 0.1, 0.25, 1]`
- Grid stagger: `Math.min(index * 0.04, 0.28)`
- Tap feedback: `whileTap={{ scale: 0.97 }}` or spring-based scale on grid tiles
- **Never** mix a centering transform with Framer Motion's `y` animation — use a wrapper div for centering (see DECISION_GATE Tech Rules for the recurring gotcha)

### Interaction commitments (unchanged from v0.1)

- Mobile-first, max-width 430px
- Bottom nav `backdrop-filter: blur(24px)`, respects `safe-area-inset-bottom`
- Tap targets minimum 44×44
- `safeStorage` wrapper for all client localStorage

### Terminology commitments — COMMITTED v0.2

| Concept | Word | Forbidden alternatives |
|---|---|---|
| Sold item | "Found a home" (caption) / "Found homes" (plural, tab label) | "Sold", "Unavailable", "Found" alone |
| Vendor's physical location | "Booth" | "Shop", "Stall" |
| Single item | "Find" | "Listing", "Item", "Product" |
| Vendor's collection | "Shelf" | "Inventory", "Store" |
| Mall | "Mall" everywhere in UI | "Treehouse Spot" — retired from the product entirely |
| Available item | "On Display" (tab label) | "Available" is an internal data term only |
| Vendor (user-facing) | "Curator" where emotional ("A curated shelf from", "Curator Sign In"); "Vendor" where transactional (admin screens) | Mixing within one screen |

---

## Screen-specific direction

### Booth page — COMMITTED v0.2

Two states of the same surface: `/shelf/[slug]` (public) and `/my-shelf` (owner).

**Layout:**
- Header Mode A (cinematic, hero-driven)
- **3-column grid, 1:1 square tiles** (preserved from current implementation — matches the future 9-item free-tier limit and the familiar vendor mental model)
- 10px gap between tiles (`spacing.tileGap`)
- **No titles or meta rendered on or below tiles** — tiles are pure image. Tap through for the story. Keeps the page visually calm and respects the older-vendor audience's preference for predictable, familiar layouts.
- All photos are portrait-sourced and rendered in the square tile via `object-fit: cover` — no aspect ratio variance at launch

**Hero (both states):**
- Dark gradient overlay (unchanged from current)
- Eyebrow "A curated shelf from" (system-ui 10px 600 uppercase, 1.6px tracking, white 58% alpha)
- Vendor display name (Georgia 30px 500, white)
- Location Statement compact variant (white text, 13px mixed mono + system-ui)
- Top-right: Send icon share button (frosted dark circle, unchanged behavior)
- Top-left owner-only: edit-banner pencil button (frosted dark circle)

**Curator's statement:**
- Directly below hero, ~22px top padding
- Italic Georgia 16px, line-height 1.7, `colors.textMid`, centered, max 3 lines visible with expander
- Empty state: public hides the block entirely; owner shows ghost italic prompt ("Add your story so visitors know who's behind the booth") with a Link-variant "Edit your story" underneath

**Tabs:**
- Existing `TabSwitcher` component, re-labeled "On Display" / "Found homes"
- Counts in mono 11px muted
- Default tab: On Display
- Visual weight: Found homes is visibly secondary (lighter label weight when inactive)

**Grid (On Display):**
- Owner: first tile is "Add" — same 1:1 square as other tiles, `colors.emptyTile` bg, 1.5px dashed `colors.greenBorder`, centered stacked `ImagePlus` icon + "Add" eyebrow in green
- Public: no Add tile; grid starts at first find
- All other tiles: 1:1 square, `object-fit: cover` on the find's hero image, `border-radius: 10px`

**Grid (Found homes):**
- Same 1:1 square tiles at 0.5 opacity + grayscale filter
- Small "Found a home" italic Georgia 10px caption appears inside the bottom-left of each tile on a subtle dark gradient overlay — this is the one exception to the "no text on tiles" rule, because sold status needs to read immediately
- Empty state: `PiLeaf` icon + italic Georgia "Nothing found a home yet — your shelf is wide open"

**Location card at bottom:**
- CTA card variant
- Full-form Location Statement (icon + row 1 + row 2 + Directions Link)
- Secondary button below: "Explore the full mall" with small vendor-hue swatch on left
- Routes to the future mall page (MVP: static link to the mall's maps URL; dedicated mall profile is a Sprint 6+ feature)

**Owner-only vs public differences:**

| Element | Public | Owner |
|---|---|---|
| Header left icon | Back arrow | "My Booth" title with logo |
| Hero edit-banner button | Hidden | Present (top-left) |
| Hero share button | Present | Present |
| Curator's statement | Read-only, hidden if empty | Read-only, shows ghost state if empty; "Edit your story" link always below |
| Add tile | Hidden | First tile in On Display grid |
| Tile tap-hold contextual menu | N/A | Stub (future polish — mark as found a home, delete, edit) |
| Bottom nav | Home · Your Finds (explorer mode) | Home · My Booth (curator mode) |

### Find Detail — COMMITTED v0.2

Header Mode A. Three specific fixes, no rebuild.

1. **Hierarchy fix — dominant title, pull-quote caption, quiet availability**
   - Title: 28px Georgia 700, letter-spacing -0.4px
   - Caption: 17px Georgia italic, line-height 1.75, max-width 32ch
   - Availability: moves to a small floating pill bottom-left of the hero image (pulsing green dot + "Available" or muted + "Found a home"), out of the content flow

2. **Location: single Location Statement replaces split card**
   - Retire the current booth-pill-left / address-link-right layout
   - Use the full-form `<LocationStatement>` inside a CTA card variant

3. **"Explore the Booth" gets weight**
   - Full-width Secondary button inside the location CTA card
   - Label: `"Explore {vendor.display_name}'s shelf →"`
   - Small 12×12 vendor-hue swatch (from `vendorHueBg()`) to the left of the label — visual thread to the Booth page hero

**Order:** hero image (with floating availability pill) → title → italic caption → description (if any) → divider → shelf scroll → location CTA card → owner-only delete at bottom

### Feed header + mall bottom sheet — COMMITTED v0.2

**Header:** Mode B (editorial). Logo + "Treehouse Finds" wordmark left. Quiet user-circle icon top-right (32×32 ghost circle).

**Sign-in affordance:**
- User-circle icon opens a bottom sheet
- Signed-out state: two buttons — "Curator Sign In" (Primary) / "Request booth access" (Secondary) — plus copy "Not a vendor? Keep browsing — Treehouse is for everyone."
- Signed-in state: "My Booth" / "Sign out" / admin link if applicable

**Mall selector:**
- Retire the native `<select>`
- New `<MallSheet>` component — bottom sheet with search input + scrollable list of malls
- Each row: mall name + city + "{N} finds" count, check on the right when selected
- Top row: "All Malls" default
- **This becomes the canonical bottom-sheet pattern** — reused on Find Map filter, `/post` mall selector, `/vendor-request` mall selector

### Find Map emotional redesign — COMMITTED v0.2

Header Mode B.

**Opening:** italic Georgia 18px pull-quote, rotates by context. Starter set:
- "A Saturday made of stops."
- "Your next field trip."
- "Three stops, one afternoon." (when N=3)

**Spine:** dotted vertical line (2px dashed, `colors.green` at 0.30 alpha). At each stop, small filled `PiLeaf` icon (12px). Between stops, mono 11px muted annotation: `~ 8 min drive`.

**Stop cards:** canonical CTA card variant. Eyebrow "3 finds here" in system-ui 10px uppercase. Mall name Georgia 17px. Full-form Location Statement with address + per-stop "Directions →" Link.

**Bottom CTA:** Secondary button full-width "Open all {N} stops in Maps →" building a multi-waypoint Apple Maps URL (Google Maps URL fallback — see implementation notes when Dev picks this up).

**Empty state:** italic Georgia pull-quote "Your next Saturday starts with a single find." + Primary button "Browse the feed →"

---

## Remaining `PENDING` — deferred to future Design passes

| Item | Owner | Trigger for the pass |
|---|---|---|
| Featured-tile rhythm in Booth grid (aspect ratio breaks, hero finds) | Design agent | Trigger: tiered pricing introduction, bookmark-driven promotion, OR enough post-launch vendor photo data to see natural patterns |
| 2-column editorial grid exploration | Design agent | Trigger: post-launch feedback from vendors and shoppers suggests 3-column feels crowded |
| Portrait-aspect variety (3:4 tiles) | Design agent | Trigger: vendor photo intake moves beyond MVP square-crop pipeline |
| Mall page (`/mall/[slug]`) visual direction | Design agent | Trigger: mall-page redesign is prioritized (currently orphan route awaiting retirement or rebuild) |
| Vendor directory / cross-vendor discovery | Design agent | Trigger: discovery-of-other-vendors feature is scoped (Sprint 6+) |
| Onboarding screens pattern pass (`/vendor-request`, `/setup`, `/login`) | Design agent | Trigger: Sprint 5 "Curator Sign In" rename — bundle visual pass with copy pass |
| `/admin` page visual pass | Design agent | Trigger: T4b admin surface consolidation |
| Dark mode for ecosystem | Design agent | Not yet prioritized; reseller layer is dark but that's a separate aesthetic |
| Cleanup pass: inline Georgia → system-ui on chrome; inline `C` objects → `colors` import; magic-number spacing → spacing tokens | Dev agent + Design agent review | Trigger: dedicated cleanup session after Booth redesign ships |

---

## How this document gets maintained

1. **Before any multi-screen UI work:** Design agent reviews this doc, flags any `PENDING` sections that bear on the work, and drafts updates if new patterns are being introduced
2. **David reviews** the proposed design spec before Dev writes code
3. **Once approved,** Dev executes against the documented spec
4. **Drift discovered during Dev work** comes back to this doc before shipping — doc updates to match, or code corrects to match doc, with the choice deliberate
5. **At session close,** Docs agent verifies no UI shipped without a corresponding doc update

---

## Related documents

| File | Purpose |
|---|---|
| `lib/tokens.ts` | Implemented color, radius, spacing tokens (code-level source of truth) |
| `docs/DECISION_GATE.md` | Brand Rules, Tech Rules, Agent Roster |
| `docs/onboarding-journey.md` | Sister canonical spec for onboarding flows |
| `CONTEXT.md` | Architecture reference; legacy design-system section to migrate here over time |
| `.claude/MASTER_PROMPT.md` | Session-open protocol — includes Design agent standup |

---
> This document is the canonical source of truth for the Treehouse design system.
> It is maintained by the Design agent and reviewed by David at each design-adjacent session.
> Last updated: 2026-04-17 (session 12 — first full direction pass; Booth / Find Detail / Feed / Find Map committed)

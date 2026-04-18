# Treehouse — Design System
> Version: 1.1 | Last updated: 2026-04-18 session 16 | Owned by: Design agent
> This document is the canonical source of truth for the Treehouse visual and interaction system.
> Any multi-screen UI work must scope against this document before code is written.

---

## Purpose

This document holds the Treehouse design language in one place so every screen speaks the same voice. It replaces the v0.2 "canonical primitive" vocabulary (`<LocationStatement>`, `<BoothLocationCTA>`, four-button system) that was committed in session 12 and shipped on the Booth page in session 14. Session 15 found the real direction through an extended mockup exploration on Find Detail — this doc now encodes that direction as v1.0 and flags session 14's Booth page code for a second pass against the new language.

---

## Status

**v1.1 — legibility + restraint pass.** v1.0 direction held up on first real-device test. Refinements in this version: (a) typography bumped 1–2px across small type to serve the 50+ demographic committed in the audience note — IM Fell retained everywhere, no face changes; (b) eyebrow labels retire uppercase+letter-spacing and move to Title Case / sentence case — the tracked-uppercase treatment read as SaaS dashboard chrome, not journal voice; (c) post-it relocated from top-left (collision risk with photo subject, legibility loss against dark backgrounds) to bottom-left (pairs with status pill as a single ground-line of placed objects, groups location signals together); (d) photographs and shelf thumbnails gain a subtle 6px corner radius to read as *tipped-in specimen* rather than raw file; (e) X glyph in the cartographic block anchors to the vendor-name baseline, not the shelf link below it. Booth page (shipped session 14) still needs a v1.1 second pass. Feed, Find Map, and remaining screens scope against this doc before code.

---

## The tagline

**Embrace the Search. Treasure the Find. Share the Story.**

This is the backbone of Kentucky Treehouse. It is the anchor every design decision returns to. When a proposed pattern is questioned, the tiebreaker is *which of these three does it serve, and does it serve it honestly?*

- **Embrace the Search** — discovery is part of the value, not friction to be removed. No filters pretending to save time. No algorithm picking for you. The app respects the hunt.
- **Treasure the Find** — the object matters. Photograph it with weight, describe it with care, name the price honestly. Don't hide it behind card chrome.
- **Share the Story** — finds accumulate. They become a personal path, a journey, a treasure hunt. The system supports this by design, not by feature.

### The operating voice

- **Presence over pressure.** No countdowns, no urgency, no "only N left."
- **Story over speed.** The page should reward slow reading, not scan-and-move.
- **Rooted in reality, yet elevated for perspective.** The app is a threshold to the physical world, not a replacement for it. Every digital gesture points back at a real booth, a real mall, a real object.

---

## The brand metaphor — refined v1.0

Treehouse should feel like:
- A field journal kept by someone who loves the hunt
- A well-bound notebook where finds are tipped in like specimens
- A small printed chapbook — restrained, confident, warm
- A personal map of where the good things are

Treehouse should **not** feel like:
- An e-commerce marketplace (Etsy, eBay, Facebook Marketplace)
- A SaaS dashboard
- A generic AI app
- A social network feed
- A skeuomorphic costume drama (brass rivets, leather textures everywhere, tape on every photo)

The key refinement from v0.2: **the journal metaphor is the target, but restraint is the discipline.** The field journal aesthetic fails when it becomes decorative — when every chrome element is restyled as period material. It succeeds when the metaphor lives in a few load-bearing gestures (paper, type, quoted reflections, placed objects) and everything else steps back.

**Audience note (unchanged from v0.2):** Many of our vendors are 50+ and value pages that feel familiar and calm, not visually novel. When the choice is between "premium editorial magazine" and "comfortable, legible, familiar" — pick familiar, and let premium come from restraint and materiality, not from unusual layouts.

---

## The cartographic vocabulary — COMMITTED v1.0

The most important language commitment in v1.0 and the one that structures every location decision across the app.

> **The mall is a pin on the map. The booth is an X on the spot.**

Two glyphs, one visual pair:

- **Pin glyph** — an outlined teardrop with a filled dot inside, the conventional map-pin silhouette. Represents the mall (the broader, zoom-out location).
- **Compass-X glyph** — two crossed lines at 45°, no frame. Represents the booth (the exact spot inside the mall).
- **Connecting tick** — a thin vertical line runs from just beneath the pin to just above the X, centered on the glyph column. Binds them into a single cartographic mark that reads as *zoom*: that place → this spot within it.

The pair is reusable wherever location is named: Find Detail, Booth page, Feed, Find Map. It becomes the app's cartographic grammar.

**What retires with this commitment:**
- The v0.2 `<LocationStatement>` component (`components/LocationStatement.tsx`) — its icon + mono + separator grammar reads as data display, not as place-naming. Deprecated. Session 14 Booth page usages get replaced during the Booth v1.0 pass.
- The `<BoothLocationCTA>` component (`components/BoothLocationCTA.tsx`) — its CTA-card-with-swatch treatment reads as marketplace chrome. Deprecated.
- Mono type for booth numbers — retired. Booth numbers are set in **IM Fell English**, which reads as *address* rather than *record*.
- The word "Directions" as explicit link copy — retired. Tapping the address opens maps, per platform convention. A dotted underline signals the affordance.

---

## The material vocabulary — COMMITTED v1.0

One skeuomorphic signature per find, used sparingly and with intent.

### The booth post-it

A small cream-yellow note (`#faf3dc`) placed on the **bottom-left** edge of the find's photograph (updated v1.1 — v1.0 placed it top-left but that position created collision risk with the photo's subject and legibility loss against dark photo backgrounds):
- Slight rotation (`-3deg`) so it reads as *placed*, not aligned
- Soft drop shadow beneath (`0 4px 8px rgba(42,26,10,0.20)`)
- Hairline border via `0 0 0 0.5px rgba(42,26,10,0.08)` to separate it from the photo
- Overlaps the photo's bottom edge slightly so the note appears tucked against the lower frame
- **Dimensions: 92×84px** (updated v1.1 from 78×72 — the booth numeral should anchor the note; smaller dimensions made it float as a label rather than land as an object)
- Contents: eyebrow label "Booth" in IM Fell English italic 12px Title Case in muted ink, then the booth number in IM Fell English **36px** at primary ink (`#2a1a0a`), both centered within the note. The numeral is intentionally large — it is the visual anchor of the note and therefore of the photograph's location claim.

The post-it is the *someone was here and placed this* gesture. It reads immediately as "this find is at this booth" without needing a pill, a badge, or a card to contain the information. It's the one skeuomorphic element on the page. Pairing it with the status pill on the same bottom edge of the photograph creates a single grounded line of placed objects rather than two competing focal points.

### The status pill

A simple rounded pill marker for find status:
- `1.5px solid rgba(42,26,10,0.72)` border — darker ink for real contrast
- `border-radius: 999px`
- `background: rgba(247,239,217,0.88)` (updated v1.1 from 0.55 — stronger opacity serves legibility against photo backgrounds without losing the blur integration)
- Label in IM Fell English italic 13px Title Case at near-primary ink (`#1c1208`) — updated v1.1 (was 11px uppercase tracked 0.14em; Title Case fits the editorial voice and the size bump serves the 50+ audience)
- **No rotation.** The post-it carries the *placed* feeling. The pill is a clarity marker — a straightforward label of state.
- Position: bottom-right of the photograph, paired with the post-it on the opposite corner of the same edge

States:
- `On Display` — default, at rest (Title Case per v1.1 casing commitment)
- `Found a Home` — sold state, visual treatment deferred (design decision parked session 15, likely a muted red-brown border + fainter ink; revisit when designing the sold state)

### Pill as a linking primitive (v1.1)

When a booth number needs to appear *outside* the post-it — specifically on the vendor line of the cartographic block — it is set in the same status-pill treatment (same border, same background, same IM Fell italic 13px Title Case). This visually ties the booth number to its "On Display" twin on the photograph even though they sit in different parts of the page. The user reads *On Display* on the photograph and *Booth 123456* on the vendor line as a matched pair.

The pill treatment is reserved for these two roles only — status labels on photographs and booth-number markers in body chrome. It does not generalize into a button or tag primitive.

### Design discipline

Two material objects on any single photograph is the maximum. The post-it and pill together do two distinct jobs (placement vs. state); adding a third object (paperclip, stamp, tape) is decoration. The instinct to add more material cues should be caught before it ships.

---

## Cross-cutting primitives

### Paper as surface

The page background is warm parchment (`#f1ead8`). There are **no cards, borders, or rounded halos around content blocks.** The paper *is* the container. Section divisions happen through whitespace, hairline rules, and ornamental marks — never through card chrome.

Optional paper-grain texture via radial gradients at low opacity. Subtle. The grain should read as "this is paper" on second glance, not as "look at the paper texture" on first.

### Color tokens (`lib/tokens.ts` — largely unchanged, additions noted)

The existing palette in `lib/tokens.ts` stays valid. Pages continue to `import { colors } from "@/lib/tokens"` — no local `C` objects.

**Additions / refinements for v1.0** (to be added to `lib/tokens.ts` in the Booth v1.0 sprint):
- `paperCream` `#f1ead8` — page background (currently `bg`, rename for clarity)
- `postit` `#faf3dc` — the post-it note surface
- `inkPrimary` `#2a1a0a` — primary ink (warmer/deeper than current `textPrimary`)
- `inkMid` `#4a3520` — mid ink for quoted captions
- `inkMuted` `#7a6244` — muted ink for secondary copy
- `inkFaint` `rgba(42,26,10,0.28)` — hairline rules, dotted underlines
- `priceInk` `#6a4a30` — softened ink for price beside titles

### Photograph surface (v1.1)

Photographs on Find Detail, and thumbnails in the "more from this shelf…" strip, have a **6px corner radius**. Reads as tipped-in specimen rather than raw file. The radius is small enough to preserve the photograph as the dominant object — large radii would tip it into polaroid / card chrome territory, which the paper-as-surface rule forbids. Single constant: `imageRadius: 6`.

Existing status/red tokens retained. Green (`#1e4d2b`) retained as the ecosystem brand accent but used more sparingly — it shows up as the dotted green spine on Find Map and as incidental accents, not as the default button fill.

### Typography system — COMMITTED v1.0

Three faces, each with an explicit role. The v0.2 instinct to do 90% of typography in system-ui is **reversed** — system-ui is now the *precision* face, not the default.

| Use | Face | Role |
|---|---|---|
| Page masthead ("Treehouse *Finds*") | **IM Fell English** 15px regular, italic on "Finds" | The global anchor — the journal announcing itself. |
| Titles, booth numbers, vendor names, mall names, eyebrow labels, status pill labels | **IM Fell English** | The editorial voice. Carries the bulk of the chrome. |
| Quoted captions, "Visit the shelf →", "more from this shelf…" | **IM Fell English italic** | The reflective voice. |
| Margin notes, journey notes (Feed, Find Map) | **Caveat** 500/600 | The human presence. Used **sparingly — 1 per screen maximum**. Represents the hand-written moment, not the decorative gesture. |
| Address lines, any data that must be scannable and precise (timestamps, dimensions, technical labels) | **system-ui** (`-apple-system, "Segoe UI", Roboto, sans-serif`) | The precision voice. |
| **Mono** | — | **Retired.** Booth numbers are set in IM Fell English. Timestamps and other precise data use system-ui. No mono anywhere in the ecosystem layer. |

**Committed sizes (v1.1 — legibility pass on device feedback):**

| Role | Size | Face | Notes |
|---|---|---|---|
| Page title / find title | 32px | IM Fell English 400, -0.005em tracking, line-height 1.18 | Paired with price after em-dash in `priceInk`. v1.0 was 30px — bumped for legibility |
| Quoted caption | 19px | IM Fell English italic, line-height 1.65, **centered** | Always in typographic quotation marks (“ ”) at 26px in muted ink. v1.0 was 17px |
| Section head (mall name, vendor name) | 18px | IM Fell English 400, line-height 1.3 | v1.0 was 16–17px |
| Address / precise data | 14px | system-ui 400, line-height 1.55, muted ink, dotted underline when tappable | v1.0 was 13px. system-ui is the precision voice — its familiar shapes make small sizes readable |
| "Visit the shelf →" | 14px | **system-ui 400**, dotted underline, muted ink | Updated v1.1 — was IM Fell italic 14px. Matches the address line exactly (same face, same weight, same size, same color, same underline style). Pairing them as indistinguishable chrome is the point |
| "More from this shelf…" | **15px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — was 13px; bumped to section-announcement floor. Trailing ellipsis always |
| Status pill label | 13px | IM Fell English italic, **Title Case**, near-primary ink | Updated v1.1 — was 11px uppercase tracked 0.14em |
| Booth pill label (on vendor line) | 13px | IM Fell English italic, Title Case, near-primary ink | New v1.1 — matches status pill treatment to visually link "On Display" and "Booth 123456" |
| Post-it "Booth" eyebrow | **12px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — 1px bump for legibility floor |
| Post-it booth number | **36px** | IM Fell English 400, -0.01em tracking | Updated v1.1 — was 28px. The numeral is the visual anchor of the note and fills the space with authority |
| Shelf thumbnail label | 13px | IM Fell English italic, mid ink | v1.0 was 11px |
| Masthead | 16px | IM Fell English 400 with italic "Finds" | v1.0 was 15px — matches address size, still clearly secondary to title |
| Manage section eyebrow | **15px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — matches "More from this shelf…" at section-announcement floor |

**Georgia retires from the ecosystem layer.** All serif type is IM Fell English. This is deliberate — IM Fell has a stronger editorial personality and consistently anchors the journal metaphor. Georgia was a general-purpose serif; IM Fell is *this product's* serif.

### Ornamental marks

Two small ornaments are committed. Both in IM Fell English so they feel typographic rather than decorative.

- **Diamond** `◆` at 10px, 42% ink opacity — used between hairline rules as a section divider. Replaces the cross (`✚`) which carried religious baggage. Replaces horizontal card borders. This is the divider for the product.
- **Ellipsis** `…` — used at the end of continuation labels ("more from this shelf…") to invite the next thing rather than announce the current thing.

### Header pattern system — v1.0

Three modes carried over from v0.2, with the masthead treatment now unifying modes A and B.

| Mode | Look | Used for |
|---|---|---|
| **A — Cinematic** | Three-column grid header: back arrow left, centered masthead wordmark, save + share icons right. Hero image sits just beneath. | Find Detail, Booth page (public and owner) |
| **B — Editorial** | Same three-column masthead layout. Context actions (search, filter, menu) replace the save + share cluster on the right depending on page. | Feed, Find Map, `/flagged`, `/admin` |
| **C — Minimal** | Back arrow + page title only. No masthead. Used for onboarding and focused forms where the journal voice would crowd the task. | `/post`, `/post/preview`, `/vendor-request`, `/setup`, `/login` |

The masthead wordmark is the **global anchor**. It appears centered in the header on every Mode A and Mode B page and uses IM Fell English at 15px with italic "Finds." This is the single most reused element in the app.

### Icon treatment

Header and chrome icons sit inside small faded circles (`rgba(42,26,10,0.06)` background, 28–32px diameter) so they read as *marks* rather than *buttons*. Stroke-only icons at 14–15px sized within. No filled/outlined button backgrounds on chrome actions.

---

## Screen-specific direction

### Find Detail — COMMITTED v1.1 (updated session 16 on-device pass)

**Order top-to-bottom:**
1. **Masthead row** — back arrow (left), "Treehouse *Finds*" wordmark (centered, 16px), save + share icons (right)
2. **Photograph** — 4:5 aspect, full-width within 22px horizontal padding, **6px corner radius**
   - **Post-it** anchored **bottom-left**, overlapping the photo's bottom edge (updated v1.1 from top-left)
   - **Status pill** anchored bottom-right (Title Case, 13px)
3. **Title + price** — IM Fell English 32px at primary ink, em-dash, price in `priceInk`
4. **Quoted caption** — IM Fell English italic 19px, centered, in typographic quotes
5. **Diamond divider** — hairline rules flanking a small `◆`
6. **Cartographic block** — pin glyph anchored to mall name baseline + mall name + dotted-underline address line in system-ui; connecting tick; X glyph **anchored to the vendor name baseline** (updated v1.1 — previously drifted to the "Visit the shelf" line below); vendor name + **booth pill (Booth 123456)** on the vendor line as a linked twin to the "On Display" pill on the photograph; "Visit the shelf →" in **system-ui 500** with dotted underline
7. **"More from this shelf…"** section — eyebrow in Title Case (no uppercase tracking), **horizontal scroll strip inset to match the 22px page margin** — first thumbnail aligns with the photograph's left edge above it, not the screen edge. Thumbnails get **6px corner radius** to match the hero photograph.
8. Bottom padding + bottom nav

**What retires on Find Detail:**
- The split booth-pill (left) / mall-address (right) row from current production
- The centered oval "Explore the Booth" button
- The Georgia caption style
- The pulsing green dot status indicator
- The inline description paragraph beneath the caption (description data retires from Find Detail entirely — the quoted caption is the description now; dimensions/condition/specs are fields on the post/edit flow but not surfaced here)
- **Uppercase + letter-spacing on labels** (v1.1 — retired per the new Title Case commitment)
- **Top-left post-it position** (v1.1 — retired for collision and legibility)
- **Full-bleed-left shelf strip** (v1.1 — strip now insets to the 22px page margin like the photograph)

**What's new in v1.1:**
- Post-it at bottom-left pairing with status pill on the same photo edge
- 6px corner radius on the hero photograph and shelf thumbnails
- Pill styling replicated on the booth-number marker on the vendor line (visual twin to the status pill)
- X glyph anchored to the vendor name, not the shelf link
- "Visit the shelf →" in system-ui 500 (ties to address line as a shared functional-chrome voice)
- All labels Title Case, no uppercase tracking
- Shelf strip insets to 22px (first thumbnail aligns with the photograph)

### Booth page — NEEDS SECOND PASS

Session 14 shipped the v0.2 Booth page using `<LocationStatement>` and `<BoothLocationCTA>`. Those components are now deprecated. The Booth page needs a v1.0 pass that:

- Applies the cartographic pin + X block to the Booth location surface (replacing `<BoothLocationCTA>`)
- Retires the mono booth number in favor of IM Fell English
- Switches from Georgia to IM Fell English throughout
- Applies the masthead wordmark treatment to the hero
- Decides whether the 3-column grid stays (likely yes — it matches the familiar mental model for older vendors) or shifts to a more editorial 2-column polaroid arrangement (flagged `PENDING` pending vendor feedback)
- Revisits the Curator's Statement block (still deferred per session 14 — David's call, revisit post-beta)

Tracked as a Design sprint for after Find Detail ships.

### Feed header + mall bottom sheet — scope against v1.0 before code

**Header:** Mode B with the unified masthead. Left: search/menu icon. Center: "Treehouse *Finds*" wordmark. Right: user-circle icon.

**Sign-in affordance and mall selector:** unchanged from v0.2 direction — bottom sheet for sign-in, `<MallSheet>` bottom sheet for mall selection. Both get re-specced against v1.0 typography and material vocabulary before implementation. The `<MallSheet>` remains the canonical bottom-sheet pattern for `/post`, `/vendor-request`, and Find Map filter.

### Find Map — scope against v1.0 before code

Emotional redesign still committed. Uses:
- One margin note in Caveat as the opening pull ("A Saturday made of stops")
- The cartographic pin glyph for each stop
- "~ 8 min drive" between stops in system-ui (precision data)
- "Open all N stops in Maps →" as the bottom action in IM Fell English italic

Full spec drafted before Dev writes code.

---

## Pattern retirement log

Patterns removed from the system in v1.0 that shipped in v0.2:

| Retired | Replaced by | Why |
|---|---|---|
| `<LocationStatement>` component | Cartographic pin + X block | Data-display grammar; read as record not place |
| `<BoothLocationCTA>` component | Inline cartographic block | Marketplace CTA chrome; eroded the journal voice |
| Four-button system (Primary/Secondary/Ghost/Link) | IM Fell English italic links with dotted underlines | Button chrome tips Treehouse toward generic app aesthetic |
| Georgia as the primary serif | IM Fell English | Georgia is general-purpose; IM Fell is *this product's* voice |
| Mono for booth numbers and data | IM Fell English (booth) / system-ui (precise data) | Mono signaled *record*; this product names *places* |
| Pulsing green status dot | Straight status pill | Tech/IoT feel; pill with typographic label fits the voice |
| Card pattern system (Plain/Thumbnail/Metric/CTA) | Paper as surface, whitespace + hairline ornaments | Card halos are dashboard grammar; paper is notebook grammar |
| "Directions" as explicit link word | Dotted underline on the address alone | Platform convention; less chrome |

---

## Copy commitments — COMMITTED v1.0

| Rule | Reason |
|---|---|
| Captions always in typographic quotation marks (“ ”) | They're reflections, not specs. Whether AI-generated or human-edited, they represent someone's voice writing about how an object feels. |
| Captions read as *how it feels*, never *what it's made of* | Material, age, dimensions, condition go in structured fields (not shown on Find Detail). The caption is emotional, not technical. |
| Prices named honestly — "$35" after the title, not hidden | *Treasure the Find* means naming the object's price in the open. Setting it in slightly softer ink keeps the title the subject while the price is a quiet fact alongside. |
| No "might pair with," "related items," "you may also like" | Marketplace language. Treehouse does not run a recommendation engine. "More from this shelf…" is the only adjacency, and it names the vendor — not the category. |
| No urgency copy ("Only 1 left," "Sold quickly," countdown timers, flash-sale language) | Presence over pressure. |
| Continuations use ellipsis ("More from this shelf…"), not dashes | Invites the next thing rather than announcing the current thing. Story-shaped. |
| Never narrate the metaphor | The design does the work. "Turn back to the booth" was rejected as overwriting because it told the user what the journal was. "Visit the shelf →" is the right voice — rooted, quiet, functional. |
| **Title Case, not uppercase, for all label copy** (v1.1) | Uppercase + letter-spacing on labels read as SaaS dashboard chrome on real screens — the tracking pulled them away from the editorial voice and toward status-badge territory. "On Display", "Booth", "Manage", "More from this shelf…" all set in Title Case (or sentence case where a trailing ellipsis is present) in IM Fell English italic. No `text-transform: uppercase`, no `letter-spacing` greater than `normal`. The only exception is the masthead wordmark, which is set as written and needs no tracking. |

---

## Accessibility commitments — COMMITTED v1.1

Synthesized from WCAG 2.1/2.2, Apple HIG, Material Design 3, and Nielsen Norman Group research, calibrated for Treehouse's 35–65 demographic:

### Minimum font-size floor

| Text role | Floor | Notes |
|---|---|---|
| Primary reading content (captions, titles, descriptions) | **16px** | Body-adjacent copy the user is meant to read slowly |
| Section-announcement labels ("More from this shelf…", "Manage") | **15px** | Strong role — announces a new region of content |
| Secondary labels meant to be read (address, pill labels, booth eyebrows, Visit the shelf link) | **13–14px** | Read at a glance, not sustained reading |
| Decorative / non-essential chrome | **12px floor** | Reserved for marks the user doesn't need to read — currently unused on Find Detail |
| **Absolute floor, any use** | **12px** | Nothing below this size, anywhere |

Material Design 3 allows 11px for decorative metadata; we deliberately push one notch higher because our audience skews older than average consumer mobile. This is a **floor, not a default** — sizes should drift larger when legibility matters and restraint isn't served by going small.

### Contrast

- `inkPrimary` (`#2a1a0a`) on `paperCream` (`#f1ead8`) — contrast ratio 11.8:1 (WCAG AAA)
- `inkMid` (`#4a3520`) on `paperCream` — 8.6:1 (WCAG AAA)
- `inkMuted` (`#7a6244`) on `paperCream` — 4.8:1 (WCAG AA for body text, AAA for large text)
- `inkFaint` (`rgba(42,26,10,0.28)`) reserved for hairline rules and dotted underline strokes — never for reading copy
- All tappable underlines use `inkFaint` for the stroke color and are paired with a readable ink color for the text itself (address in `inkMuted`, not `inkFaint`)

### Tap targets

44×44px minimum (Apple HIG), achieved via padding where the visual element is smaller. This was already committed in v0.2; v1.1 reaffirms.

### Dynamic type

`maximumScale: 1, userScalable: false` is currently set in `app/layout.tsx` viewport metadata. This is the one accessibility commitment we're *not* honoring — it prevents users from pinch-to-zoom. **Flagged for Sprint 5 resolution**: remove the scale lock, verify layout doesn't break at 200% text zoom, commit to Dynamic Type support. Until then, the size floor above is a stand-in.

---

## Motion commitments (unchanged from v0.2)

- Entry: `initial={{ opacity: 0, y: 8–16 }} animate={{ opacity: 1, y: 0 }}`
- Ease: `[0.25, 0.46, 0.45, 0.94] as const` or `[0.25, 0.1, 0.25, 1]`
- Grid stagger: `Math.min(index * 0.04, 0.28)`
- Tap feedback: `whileTap={{ scale: 0.97 }}` for links and marks, spring-based scale on grid tiles
- **Never** mix a centering transform with Framer Motion's `y` animation — use a wrapper div for centering (see DECISION_GATE Tech Rules for the recurring gotcha)

---

## Interaction commitments (unchanged from v0.2)

- Mobile-first, max-width 430px
- Bottom nav `backdrop-filter: blur(24px)`, respects `safe-area-inset-bottom`
- Tap targets minimum 44×44 (links that are smaller visually use padding to meet this)
- `safeStorage` wrapper for all client localStorage

---

## Terminology commitments (carried from v0.2, unchanged)

| Concept | Word | Forbidden alternatives |
|---|---|---|
| Sold item | "Found a home" | "Sold", "Unavailable" |
| Vendor's physical location | "Booth" | "Shop", "Stall" |
| Single item | "Find" | "Listing", "Item", "Product" |
| Vendor's collection | "Shelf" | "Inventory", "Store" |
| Mall | "Mall" everywhere in UI | "Treehouse Spot" retired |
| Available item | "On Display" | "Available" is internal data only |
| Vendor (user-facing) | "Curator" where emotional; "Vendor" where transactional | No mixing within one screen |

---

## Remaining `PENDING` — v1.0

| Item | Trigger for the pass |
|---|---|
| Sold state visual treatment (status pill color + type when a find is "found a home") | When Booth v1.0 pass ships — both the grid sold tile and the Find Detail pill need a coordinated sold treatment |
| Booth page v1.0 second pass | Next Design sprint after Find Detail code ships |
| Feed + Find Map v1.0 pass | After Booth page v1.0 lands |
| Onboarding screens (`/vendor-request`, `/setup`, `/login`) v1.0 pass | Sprint 5 — bundle with "Curator Sign In" rename |
| `/admin` visual pass | T4b admin surface consolidation |
| Dark mode | Not prioritized |
| Featured-tile rhythm in Booth grid | Trigger: tiered pricing OR enough post-launch vendor photo data to see natural patterns |
| Portrait-aspect variety (3:4 tiles) | Trigger: vendor photo intake moves beyond MVP square-crop pipeline |
| Vendor directory / cross-vendor discovery | Sprint 6+ |
| Token additions to `lib/tokens.ts` | Bundle with Booth v1.0 sprint |
| Cleanup pass: inline Georgia → IM Fell English on chrome; inline `C` objects → `colors` import; magic-number spacing → spacing tokens | Dedicated cleanup session after Find Detail + Booth v1.0 both ship |

---

## How this document gets maintained

1. **Before any multi-screen UI work:** Design agent reviews this doc, flags any `PENDING` sections that bear on the work, and drafts updates if new patterns are being introduced.
2. **David reviews** the proposed design spec before Dev writes code.
3. **Once approved,** Dev executes against the documented spec.
4. **Drift discovered during Dev work** comes back to this doc before shipping — doc updates to match, or code corrects to match doc, with the choice deliberate.
5. **At session close,** Docs agent verifies no UI shipped without a corresponding doc update.

---

## Related documents

| File | Purpose |
|---|---|
| `lib/tokens.ts` | Implemented color, radius, spacing tokens (code-level source of truth). v1.0 additions bundled with Booth v1.0 sprint. |
| `docs/DECISION_GATE.md` | Brand Rules, Tech Rules, Agent Roster. The tagline lives here as a core anchor. |
| `docs/onboarding-journey.md` | Sister canonical spec for onboarding flows |
| `CONTEXT.md` | Architecture reference |
| `.claude/MASTER_PROMPT.md` | Session-open protocol — includes Design agent standup |

---
> This document is the canonical source of truth for the Treehouse design system.
> It is maintained by the Design agent and reviewed by David at each design-adjacent session.
> Last updated: 2026-04-18 (session 16 — v1.1 legibility + restraint pass based on on-device feedback from first v1.0 Find Detail build; size bump, Title Case commitment, post-it relocation + anchor sizing, image corner radius, pill-as-linking-primitive, shelf strip alignment fix, accessibility font-size floor committed)

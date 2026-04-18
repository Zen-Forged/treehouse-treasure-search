# Treehouse — Design System
> Version: 1.1g | Last updated: 2026-04-18 session 17 | Owned by: Design agent
> This document is the canonical source of truth for the Treehouse visual and interaction system.
> Any multi-screen UI work must scope against this document before code is written.

---

## Purpose

This document holds the Treehouse design language in one place so every screen speaks the same voice. It replaces the v0.2 "canonical primitive" vocabulary (`<LocationStatement>`, `<BoothLocationCTA>`, four-button system) that was committed in session 12 and shipped on the Booth page in session 14. Session 15 found the real direction through an extended mockup exploration on Find Detail — this doc now encodes that direction as v1.0 and flags session 14's Booth page code for a second pass against the new language.

---

## Status

**v1.1 — legibility + restraint pass.** v1.0 direction held up on first real-device test. Refinements in this version: (a) typography bumped 1–2px across small type to serve the 50+ demographic committed in the audience note — IM Fell retained everywhere, no face changes; (b) eyebrow labels retire uppercase+letter-spacing and move to Title Case / sentence case — the tracked-uppercase treatment read as SaaS dashboard chrome, not journal voice; (c) post-it relocated from top-left to bottom-right, sized up to anchor the note, warmed brighter, rotated `+3deg`, and carries a small push pin at top-center as a restrained second detail; (d) paper background tuned warmer/browner (`#f1ead8` → `#e8ddc7`) to shed the yellow cast — `inkMuted` darkened to `#6b5538` to maintain WCAG AA on the new surface; (e) photographs and shelf thumbnails gain a subtle 6px corner radius **and a 1px `inkHairline` border** to separate warm-toned images from the paper; (f) X glyph in the cartographic block anchors to the vendor-name baseline; (g) **status pill retired** — "On Display" is redundant on a browse page where every visible find is available, and the sold state is already carried by the photograph's grayscale treatment; (h) vendor row becomes `[name] → Explore [Booth NNN →]` with "Explore" matching the mall address voice (system-ui 400 dotted-underline) and the booth pill as the shelf-link tap target; (i) BottomNav chrome patched to the new paper tone with a stronger top hairline — full chrome rework still scoped for Booth v1.1. Booth page (shipped session 14) still needs a v1.1 second pass. Feed, Find Map, and remaining screens scope against this doc before code.

**v1.1e — on-device polish pass (session 17).** Narrow, surgical refinements from a live iPhone pass against v1.1d. No new primitives; several existing primitives adjusted: (a) **app-wide background aligned to `paperCream`** (`#e8ddc7`) — `app/layout.tsx` `<body>` inline style and `app/globals.css` `@layer base body` rule both updated from the legacy `#f0ede6`; the old warm parchment was still bleeding through on routes that hadn't yet inlined the v1.1 palette; (b) **masthead wordmark set as a single Title Case style — italic on "Finds" retired, size 16 → 18px, letter-spacing tightened to `-0.005em`** — IM Fell English ships only at 400 weight (no 700), so "heavier presence" is achieved through size + un-italicized tracking rather than a bolder face; (c) **save + share relocated off the masthead onto the photograph's top-right corner as frosted `paperCream` translucent bubbles with `backdrop-filter: blur(8px)`** — consolidates interactive chrome near the image itself, matches the convention most users recognize from other photo-first interfaces; (d) **icon bubble default size 34 → 38px**, back-arrow and on-image icons 17–18px for consistent weight; (e) **vendor row label updated to "Explore booth →"** (trailing arrow moves into the label) with the **shelf-link pill slimmed to a pure numeric badge** — "Booth" word and arrow both removed from inside the pill; the label now carries the verb + direction, the pill carries the number; pill numeral bumped 13 → 16px IM Fell (non-italic), horizontal padding tightened to `2px 9px`; (f) **X glyph vertical alignment recalibrated** — `paddingTop: 5 → 3` to sit on vendor-name ascender rather than riding low. These changes are all internal polish; no doc-level primitives added or retired.

**v1.1f — same-session second polish pass (session 17).** Three refinements from immediate on-device follow-up to v1.1e: (a) **frosted icon-bubble background is now state-independent** — when the save heart is active, only the glyph color/fill flips to green; the bubble itself stays `rgba(232,221,199,0.78)` paperCream. Rationale: the v1.1e active-state bg (`rgba(30,77,43,0.22)` green tint) blended into warm and dark photos, losing the bubble as a mark and losing the state signal simultaneously. Holding a stable creme bubble and letting the glyph carry the state is the clearer read. (b) **Post-it inset from the screen edge** — `right: -12 → 4`. The overhang was kissing the viewport edge on narrow phones; pulling the note fully inside the 22px page margin reads as *placed on the photograph* rather than *sliding off the page*. (c) **Post-it rotation bumped `+3 → +6deg`** — still well under the threshold where the text becomes unreadable in a glance (roughly 8–10° on a rectangular note), but noticeably more casual. Anything approaching 35–45° would read as *fallen*, not *placed*, and would crowd the stacked eyebrow. **+6° is the new committed rotation** for the booth post-it. (d) **Post-it eyebrow stacks: "Booth" / "Location"** on two lines, same 14px IM Fell italic muted ink, line-height `1.1` so the two words read as one label. "Booth" alone was lightweight for what the pin points at; "Booth Location" names the gesture honestly (this marks *where*, not *what*). Post-it `minHeight: 84 → 92` to accommodate the two-line eyebrow without pressing on the 36px numeral below.

**v1.1g — Find Map redesign (session 17).** Full redesign of `/flagged` (the page the app calls "Find Map") against v1.1 language. Three doc-level commitments land with this redesign: (a) **glyph hierarchy locked** — pin = mall, X = booth. These two cartographic glyphs do not swap, substitute, or appear interchangeably across the product. The pin shows up once per page at the mall anchor; the X shows up once per booth/stop. This rule propagates to Booth page redesign, Feed, and any future screen that names location. (b) **Find Map spec committed** — masthead (Mode A) → "Find Map" subheader (IM Fell 30px) → intro voice (IM Fell italic 15px, one paragraph) → pin + mall anchor + dotted-underline address → diamond divider → per-stop itinerary (X glyph on spine + hairline tick, `Booth [NNN pill]` row linking to `/shelf/[slug]`, vendor italic, saved-count, 2-up grid or 3+ horizontal scroll) → diamond divider + closer line ("End of the map. Not the end of the search.") No bottom action link; BottomNav handles exit navigation. (c) **Find tile pattern committed for any page that lists saved finds** — 4:5 photo (6px radius + 1px inkHairline border) with frosted paperCream heart top-right (tap to unsave), IM Fell italic title 13px mid-ink, price in system-ui 13px priceInk (or "Found a home" italic muted for sold). Entries that were in the v1.0 doc but overridden: no Caveat margin-note on Find Map (tried in mockup, read as voice-adjacent chrome when the intro copy did the same job honestly); no between-stop drive-time data (all saved finds are at one mall in production, revisit when multi-mall ships); no bottom "Open all N stops in Maps →" action (adds a navigation layer BottomNav already handles). The v0.2 `/flagged` page is fully retired — dark-gradient booth pills, mono booth numbers, "BOOTH" uppercase tracking, Georgia serif, card chrome on find rows, green "View Booth" CTA, `EndOfPath` component, and "First/Next/Last stop" ordinal labels all retired.

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

**Glyph hierarchy — COMMITTED v1.1g:** The pin-to-mall and X-to-booth bindings are *locked*. The pin never represents a booth; the X never represents a mall. They do not swap, substitute, or appear interchangeably anywhere in the product. On any page that shows both a mall and its booths, the pin appears *once* (mall anchor, page-level) and the X appears *once per booth stop* (inline, content-level). This glyph-concept binding is what lets the cartographic language actually mean something: readers who learn the pair on one page immediately parse it on every other.

**What retires with this commitment:**
- The v0.2 `<LocationStatement>` component (`components/LocationStatement.tsx`) — its icon + mono + separator grammar reads as data display, not as place-naming. Deprecated. Session 14 Booth page usages get replaced during the Booth v1.0 pass.
- The `<BoothLocationCTA>` component (`components/BoothLocationCTA.tsx`) — its CTA-card-with-swatch treatment reads as marketplace chrome. Deprecated.
- Mono type for booth numbers — retired. Booth numbers are set in **IM Fell English**, which reads as *address* rather than *record*.
- The word "Directions" as explicit link copy — retired. Tapping the address opens maps, per platform convention. A dotted underline signals the affordance.

---

## The material vocabulary — COMMITTED v1.0

One skeuomorphic signature per find, used sparingly and with intent.

### The booth post-it

A small cream note placed on the **bottom-right** edge of the find's photograph, overhanging the lower frame. Moved to bottom-right in v1.1d after the status pill was retired, opening up that corner — the post-it replaces it as the single grounded object on the photograph:
- Color `#fffaea` — a near-white cream that reads as a distinct object against the warmer paper background
- Rotation `+6deg` (updated v1.1f from `+3deg`) so it reads as *placed*, not aligned, without approaching the angle where text becomes unreadable in a glance or the note reads as *fallen* rather than *placed*
- Drop shadow `0 6px 14px rgba(42,26,10,0.28)` beneath
- Hairline edge via `0 0 0 0.5px rgba(42,26,10,0.16)` (visible paper-to-paper edge)
- **Inset from the screen edge by 4px** (updated v1.1f from a `-12px` overhang off the right edge) — sits fully inside the 22px page margin; reads as *placed on the photograph* rather than *sliding off the page*
- Overlaps the photo's bottom-right corner slightly so the note appears tucked against the lower frame
- Dimensions: 92px wide, 92px minHeight (updated v1.1f from 84px minHeight to accommodate the stacked eyebrow)
- **Push pin** at top-center: an 8px circle in deep warm ink (`rgba(42,26,10,0.72)`) with a 2px inner ring one shade lighter (`rgba(42,26,10,0.55)`) to suggest minimal depth. No metallic highlight, no shine. Small drop shadow `0 1px 2px rgba(42,26,10,0.35)` to lift it slightly. Positioned so its center sits on the top edge of the note, about 40% of the way down the pin's diameter (i.e. the pin reads as *going through* the note)
- Contents: eyebrow label **"Booth" / "Location"** stacked on two lines (updated v1.1f from "Booth" alone) in IM Fell English italic 14px Title Case muted ink with `line-height: 1.1` so the two words read as one label, then the booth number in IM Fell English 36px at primary ink (`#2a1a0a`), all centered within the note. The numeral is intentionally large — it is the visual anchor of the note and therefore of the photograph's location claim

The post-it is the *someone was here and pinned this* gesture. It reads immediately as "this find is at this booth" without needing a pill, a badge, or a card to contain the information. The pin is a second detail *on the post-it itself*, not a third object on the photograph — it answers the implicit question "how is this note attached?" and sells the placed verb more than rotation alone. The three material dials (brighter surface, stronger shadow, visible hairline edge) together create paper-on-paper separation.

**Eyebrow rationale (v1.1f):** "Booth" alone was lightweight for what the pin actually points at — the location of this find within the mall. "Booth Location" names the gesture honestly: the note marks *where*, not *what*. Stacking the two words keeps the note's horizontal footprint unchanged and lets the numeral below remain the visual anchor.

**Rotation rationale (v1.1f):** The committed range for the post-it is `+3` to `+8 degrees`. Below +3° the rotation is invisible; above ~+10° the text becomes harder to parse at a glance and the note starts reading as *fallen* rather than *placed*. `+6°` is the committed default — visibly more casual than `+3°` without compromising the stacked eyebrow's legibility.

**Pin restraint:** single pin only, top-center placement, matte ink colors, no highlight or shine. If a future design impulse suggests adding a second pin, a drawing pin head, a clip, or decorative shadow, the answer is no — that tips the metaphor into costume.

### The status pill — RETIRED v1.1d

The v1.1 status pill ("On Display" / "Found a Home" in the bottom-right of the photograph) is retired. Reasoning: on Find Detail, every visible find is by definition browseable, so "On Display" is redundant chrome pretending to be information. The sold state is already carried by the photograph's grayscale + reduced opacity treatment — adding a label on top of that is belt-and-suspenders. Removing the pill also opens up the bottom-right corner of the photograph for the post-it's new home.

The pill *treatment* survives as a primitive, but only in one role (the shelf-link pill below). The word "pill" in this doc now refers to that single role.

### The shelf-link pill (v1.1e — pure numeric badge)

A rounded pill used on the vendor line of the cartographic block. Paired inline with an "Explore booth →" label (system-ui 400 dotted-underline); the **label carries the verb and the tap-affordance arrow**, while the **pill carries only the number**. The label and pill are wrapped in a single `Link` so the whole row is the tap target.

- `1.5px solid rgba(42,26,10,0.72)` border
- `border-radius: 999px`
- `background: rgba(247,239,217,0.88)` with `backdrop-filter: blur(4px)`
- Contents: booth number only — no "Booth" word, no arrow
- Numeral in IM Fell English 16px (non-italic) at near-primary ink (`#1c1208`)
- Horizontal padding `2px 9px` — tight enough to read as a number-token rather than a stub of a button
- No rotation

The pill treatment is reserved for this single role only. It does not generalize into a button, tag, filter, or status primitive.

**What retired from this primitive in v1.1e:** the "Booth" prefix word inside the pill (moved into the label), the trailing arrow inside the pill (moved into the label), the italic style on the numeral (retired — non-italic reads more like a number than a word), and the earlier 13px size (bumped to 16px for legibility at the new tighter padding).

### Design discipline

Two material objects on any single photograph is the maximum. The post-it and pill together do two distinct jobs (placement vs. state); adding a third object (paperclip, stamp, tape) is decoration. The instinct to add more material cues should be caught before it ships.

---

## Cross-cutting primitives

### Paper as surface

The page background is warm parchment (`#e8ddc7` — `paperCream`). There are **no cards, borders, or rounded halos around content blocks.** The paper *is* the container. Section divisions happen through whitespace, hairline rules, and ornamental marks — never through card chrome.

The background is committed **globally** — `app/layout.tsx` `<body>` and `app/globals.css` `@layer base body` both set `#e8ddc7` (updated v1.1e from the legacy `#f0ede6`). Any page that sets its own background must match this value or inherit. Routes that still show a lighter parchment are running pre-v1.1 palette and need an update.

Optional paper-grain texture via radial gradients at low opacity. Subtle. The grain should read as "this is paper" on second glance, not as "look at the paper texture" on first.

### Color tokens (`lib/tokens.ts` — largely unchanged, additions noted)

The existing palette in `lib/tokens.ts` stays valid for legacy pages. v1.1 pages inline the palette below until the Booth v1.1 sprint promotes it to `lib/tokens.ts`. Pages continue to `import { colors } from "@/lib/tokens"` for legacy tokens — no local `C` objects.

**v1.1 palette** (to be added to `lib/tokens.ts` in the Booth v1.1 sprint):
- `paperCream` `#e8ddc7` — page background (updated v1.1 from `#f1ead8` — warmer/browner to shed the yellow cast; reads as aged paper rather than fresh cream)
- `postit` `#fffaea` — post-it note surface (updated v1.1 from `#faf3dc` — brighter to separate from the browner paper)
- `inkPrimary` `#2a1a0a` — primary ink (warmer/deeper than legacy `textPrimary`)
- `inkMid` `#4a3520` — mid ink for quoted captions
- `inkMuted` `#6b5538` — muted ink for secondary copy (updated v1.1 from `#7a6244` — darkened to maintain WCAG AA against the new paper; retains the muted character at the new contrast level)
- `inkFaint` `rgba(42,26,10,0.28)` — hairline rules, dotted underlines
- `priceInk` `#6a4a30` — softened ink for price beside titles

### Photograph surface (v1.1d)

Photographs on Find Detail, and thumbnails in the "more from this shelf…" strip, have a **6px corner radius** and a **1px solid `inkHairline` border** (`rgba(42,26,10,0.18)`). The radius reads as tipped-in specimen rather than raw file. The border provides a critical separation line when photo subjects have warm/cream tones that otherwise blur into the paper background — this is a feature, not a workaround: the paper-tone-respecting photography is exactly what the brand wants from vendors, and the hairline edge is what makes that photography hold the page without visual chaos. Single constant: `imageRadius: 6`, `imageBorder: 1px solid rgba(42,26,10,0.18)`.

Existing status/red tokens retained. Green (`#1e4d2b`) retained as the ecosystem brand accent but used more sparingly — it shows up as the dotted green spine on Find Map and as incidental accents, not as the default button fill.

### Typography system — COMMITTED v1.0

Three faces, each with an explicit role. The v0.2 instinct to do 90% of typography in system-ui is **reversed** — system-ui is now the *precision* face, not the default.

| Use | Face | Role |
|---|---|---|
| Page masthead ("Treehouse Finds") | **IM Fell English** 18px, Title Case single style, `-0.005em` tracking | The global anchor — the journal announcing itself. Italic on "Finds" retired v1.1e; single style reads as more present without a bolder face (IM Fell ships 400 only). |
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
| "Visit the shelf →" (standalone text link) | — | **Retired v1.1** | The shelf-link pill on the vendor line now carries this role |
| Shelf-link pill numeral (on vendor line) | **16px** | IM Fell English 400 (non-italic), near-primary ink, no leading word, no trailing arrow | Updated v1.1e — was 13px italic with "Booth NNN →". The label carries the verb and arrow now; the pill is just the number. Non-italic reads as number-token rather than word. |
| "Explore booth →" label (v1.1e) | 14px | system-ui 400, muted ink, dotted underline (matches mall address voice), trailing arrow inline | Updated v1.1e — was "Explore" alone with the arrow living inside the pill. Consolidating the verb + direction in the label makes the row read as tappable at a glance and leaves the pill free to read as a pure numeric token. |
| "More from this shelf…" | **15px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — was 13px; bumped to section-announcement floor. Trailing ellipsis always |
| Status pill label | — | **Retired v1.1d** | "On Display" was redundant on a browse page; sold state is carried by the photograph's grayscale treatment |
| Booth pill label (on vendor line) | 13px | IM Fell English italic, Title Case, near-primary ink | Now called the *shelf-link pill*; only surviving pill role |
| Post-it "Booth" eyebrow | **14px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — was 12px but still reading as undersized against the 36px numeral; 14px gives the eyebrow real label weight without competing with the numeral |
| Post-it booth number | **36px** | IM Fell English 400, -0.01em tracking | Updated v1.1 — was 28px. The numeral is the visual anchor of the note and fills the space with authority |
| Shelf thumbnail label | 13px | IM Fell English italic, mid ink | v1.0 was 11px |
| Masthead | **18px** | IM Fell English 400 Title Case single style, `-0.005em` tracking | Updated v1.1e — was 16px with italic on "Finds"; italic retired, size bumped for presence without loading a heavier face |
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

The masthead wordmark is the **global anchor**. It appears centered in the header on every Mode A and Mode B page and uses IM Fell English at **18px in a single Title Case style** (no italic on "Finds"), with `-0.005em` tracking (updated v1.1e). This is the single most reused element in the app.

### Icon treatment

Header and chrome icons sit inside small circles so they read as *marks* rather than *buttons*. Two variants committed:

- **Paper variant** (default chrome, used on masthead back button and manage actions): `rgba(42,26,10,0.06)` background, **38px diameter** (updated v1.1e from 34), stroke-only icon at 17–18px. No border, no shadow. The faded circle reads as a soft mark on the paper.
- **Frosted variant** (used on the photograph's top-right for save + share — v1.1e): `rgba(232,221,199,0.78)` translucent paperCream background with `backdrop-filter: blur(8px)`, `0.5px solid rgba(42,26,10,0.12)` hairline edge, **38px diameter**, stroke-only icon at 17px. The frosted treatment reads as a floating mark over any photograph — warm tones, cool tones, light, dark — without a heavy colored bubble. **Active/saved state (v1.1f): the bubble background stays constant at the paperCream translucent value; only the glyph color/fill flips to carry the state.** (Earlier v1.1e attempt flipped the bg to a green tint, which blended into warm/dark photos and lost the bubble as a mark. Holding a stable creme bubble and letting the glyph carry the state is the clearer read.)

**Save + share location (v1.1e):** on Find Detail, save and share live in the top-right corner of the photograph (12px inset from the top-right), in the frosted variant, with 8px gap between them. The masthead right-slot on Find Detail is intentionally empty. Rationale: consolidating the interactive chrome near the image itself matches the convention most photo-first interfaces use; the slight cost to the photograph's calm is offset by the post-it's opposite-corner placement keeping the image balanced, and by removing two icons' worth of weight from the masthead so the wordmark can grow to 18px without crowding.

---

## Screen-specific direction

### Find Detail — COMMITTED v1.1f (updated session 17 on-device polish pass)

**Order top-to-bottom:**
1. **Masthead row** — back arrow (left, 38px bubble), **"Treehouse Finds" wordmark (centered, 18px, Title Case single style)**, right slot empty
2. **Photograph** — 4:5 aspect, full-width within 22px horizontal padding, **6px corner radius, 1px `inkHairline` border** (new v1.1d)
   - **Save + share** (v1.1e) in the top-right corner of the photograph as frosted paperCream bubbles, 12px inset, 8px gap
   - **Post-it** anchored **bottom-right**, inset 4px from the photo's right edge (v1.1f), overlapping the photo's bottom-right corner, rotated `+6deg` (v1.1f), eyebrow reads "Booth Location" stacked on two lines
   - **Push pin** at top-center of the post-it (matte ink, no shine)
3. **Title + price** — IM Fell English 32px at primary ink, em-dash, price in `priceInk`
4. **Quoted caption** — IM Fell English italic 19px, centered, in typographic quotes
5. **Diamond divider** — hairline rules flanking a small `◆`
6. **Cartographic block** — pin glyph anchored to mall name baseline + mall name + dotted-underline address line in system-ui; connecting tick; X glyph anchored to the vendor-name baseline (v1.1e `paddingTop: 3` recalibration); vendor name on its own line; **"Explore booth →" label (system-ui 400 dotted-underline, trailing arrow inline) + shelf-link pill (just the booth number, IM Fell 16px non-italic) inline on the line below vendor name** (updated v1.1e — the label now carries verb + direction; the pill is a pure numeric badge; entire row is a single `Link`)
7. **"More from this shelf…"** section — eyebrow in Title Case (no uppercase tracking), horizontal scroll strip inset to 22px page margin, thumbnails at 6px corner radius
8. Bottom padding + bottom nav

**What retires on Find Detail:**
- The split booth-pill (left) / mall-address (right) row from current production
- The centered oval "Explore the Booth" button
- The Georgia caption style
- The pulsing green dot status indicator
- The inline description paragraph beneath the caption (description data retires from Find Detail entirely — the quoted caption is the description now; dimensions/condition/specs are fields on the post/edit flow but not surfaced here)
- **Uppercase + letter-spacing on labels** (v1.1 — retired per the new Title Case commitment)
- **Top-left post-it position** (v1.1 — retired for collision and legibility)
- **Bottom-left post-it position** (v1.1d — retired after status pill removed opened the right corner; single grounded object works better than two)
- **Full-bleed-left shelf strip** (v1.1 — strip now insets to the 22px page margin like the photograph)
- **Standalone "Visit the shelf →" text link** (v1.1 — retired; the shelf-link pill below the vendor name does this job with less chrome)
- **Status pill on photograph** (v1.1d — retired; "On Display" is redundant on a browse page where every visible find is available, and the sold state is carried by the photograph's grayscale treatment)
- **Save + share in the masthead** (v1.1e — relocated to the photograph's top-right corner; the masthead's right slot is now intentionally empty)
- **Italic "Finds" in the masthead wordmark** (v1.1e — retired; single Title Case style at 18px reads as more present without loading a bolder face)
- **"Booth" word and trailing arrow inside the shelf-link pill** (v1.1e — both relocated; the label now reads "Explore booth →" and the pill is a pure numeric badge)

**What's new in v1.1:**
- Warmer/browner paper background and darker `inkMuted` to hold WCAG AA on the new surface
- Post-it at bottom-right (v1.1d), sized 92×84, rotated `+3deg`, numeral 36px, eyebrow 14px Title Case, warmer `#fffaea` cream with stronger shadow + visible hairline edge, **push pin at top-center** for placed-verb reinforcement
- Shelf-link pill on vendor line — reads "Booth NNN →" and navigates to `/shelf/[slug]`. Now the sole pill role after status pill retirement
- **"Explore" label** (system-ui 400 dotted-underline) inline with the pill, matching mall address voice — serves the 50+ audience by naming the verb
- 6px corner radius **+ 1px `inkHairline` border** on hero photograph and shelf thumbnails (v1.1d — border is the separation for warm-toned images)
- X glyph anchored to vendor name baseline
- All labels Title Case, no uppercase tracking
- Shelf strip first thumbnail explicitly anchored at 22px page margin
- BottomNav background tinted to paperCream translucent, top border strengthened to `inkHairline` weight — minimal patch pending full chrome rework in Booth v1.1 sprint

### BottomNav — v1.1d minimal patch

The shared `components/BottomNav.tsx` is used by every page and still carries the legacy warm-white palette from v0.2. Full chrome rework is scoped for the Booth v1.1 sprint. For now, two one-line changes land in session 16 so the nav does not visually contradict the new paper:

- Background: `rgba(232,221,199,0.96)` (paperCream at 96% opacity with `backdrop-filter: blur(24px)`) — matches the new `paperCream` on the body
- Top border: `1px solid rgba(42,26,10,0.18)` (`inkHairline`) — strong enough to visually distinguish the nav from the page above it without becoming chrome; the border is essential because the nav-and-page are now nearly the same tone

Green accent (`#1e4d2b`) and muted ink (`#8a8476` legacy) retained for now — these get re-examined in the Booth v1.1 sprint.

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

### Find Map — COMMITTED v1.1g (session 17 redesign)

The page at route `/flagged` is called "Find Map" in the UI. The route name stays for backwards compatibility; the product name is Find Map everywhere users see it.

**Purpose:** a saved-finds itinerary grouped by booth. The user visits this page to plan a Saturday trip to a mall. Each stop shows the booth, the vendor, and the specific finds they've saved there.

**Order top-to-bottom:**
1. **Masthead row** (Mode A) — back arrow (left, 38px) + "Treehouse Finds" wordmark (centered, 18px Title Case) + empty right slot
2. **"Find Map" subheader** — IM Fell 30px primary ink, establishes the page identity
3. **Intro voice** — "Your saved finds are mapped below. Each one is waiting in its place, ready when you are." IM Fell italic 15px muted, one paragraph, line-height 1.65. Orients the user and names the emotional premise (the finds are *waiting*, not *listed*)
4. **Mall anchor** — pin glyph (22px) + mall name (IM Fell 22px primary) on one row; dotted-underline address (system-ui 14px muted) on the next row, indented to align with the mall name. The pin appears *only here on this page*
5. **Diamond divider** — `◆` flanked by hairline rules
6. **Per-stop itinerary** — a vertical spine with X glyphs at each stop and hairline ticks between them. Content per stop:
   - Booth row — `Booth` label (system-ui 14px muted) + numeric pill (IM Fell 16px non-italic, `2px 9px` padding, v1.1f shelf-link pill spec). Entire row wraps a Link to `/shelf/[slug]`; the row is the tap target
   - Vendor name — IM Fell italic 18px mid-ink
   - Saved count — "N saved finds" (system-ui 12.5px muted)
   - Finds container — **2-up grid** when a stop has 1 or 2 finds; **horizontal scroll** when a stop has 3+ finds (fixed 42vw / 170px max tile width, 10px gap, scroll-snap-start). The switch is by count, not by user preference; the unsave re-flow from scroll → grid is a natural reward as finds are removed
   - Each find is a *find tile* (see primitive below)
7. **Closer** — diamond-rule divider, then "End of the map. Not the end of the search." (IM Fell 16px mid-ink, line-height 1.4, no link). BottomNav handles navigation away

**Find tile primitive (committed v1.1g, reusable on any saved-finds surface):**
- 4:5 photograph with 6px corner radius and 1px `inkHairline` border (matches Find Detail hero + shelf thumbnails)
- Frosted `paperCream` translucent heart bubble top-right, 30×30px, `backdrop-filter: blur(8px)`, 0.5px inkHairline edge — exact Find Detail chrome
- Heart is always filled green on this page (Find Map is by definition the saved-finds list; bubble never shows an unsaved state here). Tap unsaves the find and removes it from local state
- Title — IM Fell italic 13px mid-ink, max 2 lines with ellipsis
- Price — system-ui 13px `priceInk` (`#6a4a30`), `-0.005em` tracking (matches Find Detail price treatment)
- Sold state — photo gets 50% grayscale + 62% opacity filter; price replaces with "Found a home" in IM Fell italic 12.5px muted
- Tile wraps a Link to `/find/[id]`; the heart button stops propagation so tapping it doesn't navigate

**Empty state:** "Nothing saved yet" (IM Fell 24px primary) + "Tap the heart on any find to save it here. Your trip comes together as you go." (IM Fell italic 15px muted, max-width 280px). No CTA link; BottomNav "Home" returns to the feed.

**Behavior preserved from v0.2 (do not retire):**
- localStorage bookmark scanning via `BOOKMARK_PREFIX` in `lib/utils.ts`
- Stale bookmark pruning — posts deleted from Supabase get their localStorage keys cleaned up on next page load
- Grouping by vendor, sorted by booth number (numeric-aware `localeCompare`)
- Within a group: available finds first, sold finds last
- Focus event refresh — visiting a find and returning rehydrates the page so unsave actions elsewhere sync back
- Unsave gesture wiring
- `BottomNav flaggedCount` passthrough
- Skeleton loader during initial fetch

**What retired from v0.2:**
- Page title "My Finds" → now "Find Map" (matches the BottomNav label that was already correct)
- Georgia serif throughout
- Mono type for booth numbers → IM Fell English (per v1.0 commitment)
- Uppercase `BOOTH` tracked label → Title Case `Booth` label (per v1.1 commitment)
- Dark-gradient booth pill → v1.1f shelf-link pill (numeric-only paperCream pill)
- Card chrome on find rows (borders, shadows, rounded halos) → paper-as-surface, no card
- Green "View Booth" CTA button → the `Booth [NNN pill]` row is the tap target to `/shelf/[slug]`
- `EndOfPath` component — closer now does the closing work with voice, not with a lone marker
- `stopLabel()` helper returning "First stop / Next stop / Last stop" — the page's vertical order is the order; ordinal labels were redundant chrome
- `allFound` group-level sort priority (groups with all sold items used to drop to the bottom of the page) — sold finds still render with grayscale at their natural position within a group; the group stays in booth-number order so the itinerary isn't reshuffled by sold state
- "All found a home" dimmed group-header styling — no longer needed now that groups don't re-sort
- Dark-gradient disabled pill variant — retired with the group-level `allFound` logic

**What was in the v1.0 doc but overridden in v1.1g with rationale:**
- **Caveat margin-note as the page opener** — tried in mockup, read as voice-adjacent chrome when the intro copy did the same orienting job honestly. Caveat is reserved for *genuine* handwritten moments; using it as a decorative opener on this page would have diluted the "one margin note per screen maximum" rule. Retired for Find Map
- **"~ 8 min drive" between stops in system-ui** — all saved finds are at one mall in production, so there is no between-stop drive. Revisit when multi-mall ships
- **"Open all N stops in Maps →" as the bottom IM Fell italic action** — dropped for simplicity. BottomNav handles exit navigation; adding another navigation layer at the page bottom fights the page's intent (plan the trip, then leave) and crowds the closer's emotional beat

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
| Italic on "Finds" in the masthead wordmark (v1.1e) | IM Fell English Title Case single style at 18px, `-0.005em` tracking | IM Fell ships 400 only — single-style + slight size bump reads as more present without a bolder face; italic on "Finds" was two styles competing for a line that only needs to announce one thing |
| "Booth" word and trailing arrow inside the shelf-link pill (v1.1e) | "Explore booth →" label carries verb + direction; pill carries only the number | Separating verb from token lets the pill read as a clean numeric badge and lets the label carry the tap-affordance signal closer to the address voice it sits next to |
| Save + share in the masthead right slot (v1.1e) | Save + share as frosted bubbles in the photograph's top-right corner | Consolidates interactive chrome near the image itself, freeing masthead weight for the wordmark and matching the convention most photo-first interfaces use |

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

### Contrast (recalculated v1.1 against new paper `#e8ddc7`)

- `inkPrimary` (`#2a1a0a`) on `paperCream` (`#e8ddc7`) — ~10.1:1 (WCAG AAA)
- `inkMid` (`#4a3520`) on `paperCream` — ~7.4:1 (WCAG AAA)
- `inkMuted` (`#6b5538`) on `paperCream` — ~5.1:1 (WCAG AA for body text at all sizes, AAA for large text). `inkMuted` was darkened from `#7a6244` to clear AA at 14px address/link sizes on the new paper — the old muted ink would have dropped to ~4.2:1 and failed AA for small text
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
> Last updated: 2026-04-18 (session 16 — v1.1d pass: status pill retired, post-it moved bottom-right with push pin, photo 1px hairline border, "Explore" label next to shelf-link pill, BottomNav tinted to paperCream; all based on on-device feedback)

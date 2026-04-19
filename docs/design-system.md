# Treehouse — Design System
> Version: 1.1j | Last updated: 2026-04-18 session 22A | Owned by: Design agent
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

**v1.1h — Booth page redesign (session 18).** Full redesign of `/my-shelf` and `/shelf/[slug]` against v1.1 language. This is the session-15 Booth deferral finally resolved; `<LocationStatement>` and `<BoothLocationCTA>` (v0.2 components shipped session 14) are retired, Georgia is retired from the ecosystem, and the page adopts three doc-level commitments:

(a) **Booth is the hero — inverted IA from Find Map.** The mockup-first exploration surfaced that the Booth page's subject is *this specific booth*, not *this mall* — copying Find Map's mall-as-title grammar would be wrong. The inversion: the banner becomes a pure photograph; the **booth post-it primitive** (same one Find Detail uses, bottom-right, +6° rotation, push pin, "Booth Location" stacked eyebrow + 36px numeral) pins to the banner; the vendor display name becomes the IM Fell 32px page title below the banner; the mall + address demotes to a small pin-prefixed block (pin glyph 18px + mall name IM Fell 18px + dotted-underline address system-ui 14px). The **post-it primitive is now cross-page** — Find Detail's photograph and Booth's banner both carry it, which makes it the app's canonical *this is a booth* mark regardless of what surface it attaches to.

(b) **Tabs change meaning: Window View + Shelf View.** The v0.2 "On Display / Found homes" availability tabs are retired. Replaced with two ways of looking at the *same available inventory*: **Window View** is the 3-col 4:5 portrait grid (the "window pane" gestalt — glance through the booth's window, see nine things); **Shelf View** is a horizontal scroll of the same items at larger tile size (~52vw / 210px max, ~55% larger visible area than Find Map's find tiles). Sold items come off the page entirely; the "Found homes" tab retires. `FoundTile` stays in `ShelfGrid.tsx` with a retention comment — a future vendor story surface (post-beta) will want it. Window View default on mount. Toggle is a text-only link pair (IM Fell italic 16px, hairline under the active one, "·" between) — no pill chrome, no icons. **AddFindTile (owner only) is the top-left cell in Window View**, never in Shelf View; adding is a vendor gesture that belongs with the window-pane composition, not with the scroll-walk.

(c) **`ExploreBanner` retires, closer adopts Find Map pattern.** The session-14 green-gradient "Discover more finds" CTA card contradicted paper-as-surface and spoke marketplace voice. Replaced with the Find Map closer pattern: diamond divider + quiet IM Fell italic line ("The shelf ends here. More booths await you."), centered, no link. BottomNav's Home carries the navigation.

What the v2 mockup overrode from v1: **vendor name relocates off the banner onto the title block** (v1 kept it on the banner — a mall-as-hero residue from copy-pasting Find Map's grammar); **cartographic block collapses to pin+mall+address** (v1 had the full pin+tick+X+booth-pill block — redundant once the post-it carries the booth above); **Shelf View tiles bump 42vw/170px → 52vw/210px** with 22px left padding on the first tile (v1 had tiles flush to the screen edge, which read as *falling off the page* rather than *a shelf beginning*).

**v1.1j — on-device QA polish pass (session 22A).** Six surgical refinements from David's live iPhone walk of v1.1i + v1.1i-polish. No new primitives added; two primitives retire, two primitives gain a font-family change, and three per-screen compositions sharpen. (a) **Diamond ornament (`◆`) retires from every divider in the product.** The v1.0 commitment — *section divisions via whitespace, hairline rules, and the diamond ornament* — held up in docs but didn't hold up on device: the diamond read as noise, breaking horizontal flow rather than punctuating it. Replaced by a full-width hairline rule (`1px solid v1.inkHairline`) with no center ornament. Surfaces affected: Feed (×3 uses), Find Map (×2, including the new closer — see (e)), Find Detail (×1 between caption and cartographic block, ×1 in Manage block), MallSheet (×1), Booth pages (×2 including BoothCloser). The `<DiamondDivider>` primitive in `components/BoothPage.tsx` keeps its name for export stability but renders a plain hairline. Pattern retirement log entry added. (b) **Booth numbers switch to `FONT_SYS` (system-ui) globally — the "1 vs I" disambiguation rule.** IM Fell English's single-serif `1` reads as a capital-I on small inline pills; `FONT_SYS` at the same size + weight resolves the ambiguity cleanly. Scope: `<BoothPill>` in `components/BoothPage.tsx` equivalent (Find Map), the `<Pill>` primitive on Find Detail's vendor row, and the 36px post-it numeral on both Find Detail and the Booth page banner. Per the *precise data* rule in the typography commitments — booth numbers are precise data, not editorial — this is the correct assignment; what kept them in IM Fell was a visual-rhyme-with-wordmark motivation that didn't survive the "is this a 1 or an I?" test. Post-it eyebrow stays IM Fell italic (it's editorial voice); only the numeral moves. Font stack on `FONT_SYS` already includes `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu…` which all have disambiguated 1s. Slight negative letter-spacing (`-0.01em` on the 36px numeral, `-0.005em` on the pill) holds compactness. (c) **`/my-shelf` Window View renders a 3×3 = 9-cell placeholder grid for the owner when inventory is sparse.** Real posts fill the window from top-left; empty cells render as dashed-border `<PlaceholderTile>` primitives that visually complete the nine-pane composition. This makes the window-pane metaphor self-evident to the vendor — *these are the nine panels you're filling* — and makes an empty booth legible rather than punishing-looking. **Owner-only**; public shelf (`/shelf/[slug]`) does NOT render placeholders (visitors reading empty panels as stock imagery on an empty storefront is the wrong read). `<WindowView>` gains a `showPlaceholders?: boolean` prop; `/my-shelf` passes `true`, `/shelf/[slug]` omits it. Placeholder tile is 4:5 aspect, dashed 1px `v1.inkFaint` border, transparent background, no content inside — aligns with `AddFindTile` voice without the action affordance. (d) **`<AddFindTile>` joins Shelf View for the owner.** Reverses the session-18 commitment (*AddFindTile is never in Shelf View*). Rationale for the reversal: Window View's 9-cell placeholder treatment now says *this page is about filling nine spots*; if Shelf View doesn't mirror the add affordance, the two views disagree about what the page IS for the owner. AddFindTile becomes the first tile in Shelf View (`marginLeft: 22` defensive alignment), same 52vw/210px max as the other Shelf tiles. `<ShelfView>` gains a `showAddTile?: boolean` prop; `/my-shelf` passes `true`, `/shelf/[slug]` omits it. (e) **Find Map closer closes the loop.** The v1.1g spine ended in open air after the last X — on device this read as *trailing off*, not as *the trip ends here*. v1.1j adds a terminal hairline dropping from the last X down to an **18px filled circle** (`v1.inkPrimary`) that sits below the spine at the same column position. The circle visually caps the path; the closer copy ("End of the map. Not the end of the search.") moves directly below the circle, centered, in the booth-label font (`FONT_SYS`, 15px, `v1.inkMid`). The diamond-flanked divider above the closer retires in favor of a simple hairline (consistent with (a)). Intro voice line ("Your saved finds are mapped below — each one is waiting in its place, ready when you are.") bumps 15px → 16px IM Fell italic for the 50+ legibility floor. (f) **Home masthead left-slot logo enlarges.** The v0.2 24px × 0.72-opacity logo read as placeholder-quiet against the pinned chrome on device; with the rest of the masthead gaining weight via the sticky + hairline pattern, the logo needed to match. Bumped 24px → 34px, opacity 0.72 → 0.92, no bubble (it's a brand mark, not an action). Sits in a 38px slot so it occupies the same visual weight as the back-button bubble on pages that have one. Pattern retirement log entries: diamond ornament as divider punctuation, IM Fell for booth numerals on inline/pill contexts.

**v1.1i — Feed redesign + MallSheet primitive + sold retires from shopper discovery (session 20).** Three linked commitments land with this pass, resolving the last major v0.2 surface in the ecosystem layer:

(a) **Feed adopts paper masonry + feed hero.** The front door retains its v0.2 tree-masonry gestalt (2-column, varied tile heights, 50% dynamic right-column offset) because the branching composition deepens the treehouse metaphor in a way the uniform 4:5 grid from Find Map / Booth does not. The masonry retiles on paper (6px radius + 1px inkHairline border on each tile — the committed photograph primitive) with no titles and no prices — the photograph IS the find on this page, and the price reveal is part of the narrative arc when the user taps through. This is the one committed case where the Feed deliberately diverges from the single 4:5 Find tile primitive used on every other photograph surface; the rationale is documented below in the Feed screen-specific direction. The header is a new **feed hero block on paper** (Header 2 treatment from the v1.1h v1 mockup exploration) — masthead wordmark + IM Fell italic eyebrow ("Finds from across" or "Finds from") + IM Fell 26px mall/geography name as the tappable selector + dotted-underline address line (when a specific mall is selected) or subtle geo subtitle (when All is selected). No gradient, no CTA. The mall name is the tap target; tapping opens the `<MallSheet>` bottom sheet.

(b) **`<MallSheet>` bottom sheet committed as the canonical mall selector.** Replaces the v0.2 inline `ChevronDown` dropdown on the feed. Paper surface, no card chrome, 20px top corner radius, draggable handle, IM Fell header + italic subhead + diamond divider + mall rows. Each mall row uses the **pin glyph** (locked cartographic vocabulary — pin = mall) with mall name in IM Fell 18px and city in system-ui 13px muted; find-count on the right in system-ui italic muted. The **All malls row** is special: no pin glyph (it isn't a place — it's a filter choice), italic IM Fell 19px label alone with a find-count on the right. Active row (whether a specific mall or All) carries a 1px hairline underline on its label text in inkPrimary, matching the Booth page's ViewToggle active treatment. This is the first cross-cutting use of the text-link-with-hairline-underline active-state pattern beyond Booth. The `<MallSheet>` primitive lands as a dedicated component and is reusable by `/post` and `/vendor-request` in a future sprint.

(c) **Sold retires from shopper discovery surfaces (MVP).** "Found a home" as a visible label and the grayscale+opacity treatment on sold photographs retire from the feed and Find Map for the MVP window. Sold data still exists in Supabase and still appears on the Booth pages (public shelf + My Shelf) because the vendor's story/credibility benefits from showing what's moved. The **terminology commitment itself stays** — "Found a home" remains the committed word for the sold state when it does surface — but the shopper-facing discovery paths now show only available finds. Find Detail gets a new **sold landing state (3B)**: if a shopper deep-links or bookmark-taps through to a find that has since sold, the page replaces the normal layout entirely with a quiet "This find / found a home." full-page closer in IM Fell 30px, a one-sentence italic muted explanation, a diamond divider, and two italic dotted-underline IM Fell links ("Visit [vendor]'s shelf →" and "Back to Treehouse Finds"). No photograph, no post-it, no price — the page is *end-of-path*, matching the Find Map closer voice ("End of the map. Not the end of the search."). This is a full-page treatment, not a toast overlay; the rationale is that dimming-but-still-there creates "is this page real or not?" ambiguity that honest end-of-path language avoids. Find Map keeps the bookmark key when a saved find sells, so the user's saved list never silently changes behind them — the 3B page IS the closure, reached by the same tap that would have shown the find.

The 3A alternative (photograph visible one last time with a quiet toast + redirect offer) was explored and is tracked as a post-MVP design direction pending real sold-find data; the interaction questions it raises (auto-redirect timing, saved-state memory, do we show other vendor finds beneath, does the post-it change) are not worth solving before we have on-device behavioral signal.

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

**Glyph substitution note (v1.1h):** On the Booth page the X does *not* appear in the mall-anchor area — the booth post-it on the banner already names the booth with its 36px numeral, making an inline X redundant and violating the "X appears once per booth stop" rule. The post-it *is* the booth stop on that page. This is the first committed case of the post-it acting as a *substitute for the X* when the booth is the page's subject. On Find Detail, the X still appears inline (vendor row) because the Find Detail post-it names the booth *for this specific photograph*, not for the whole page. The rule generalizes: **post-it names the booth when the photograph is the subject; X names the booth when the photograph is a stop along a list**.

**What retires with this commitment:**
- The v0.2 `<LocationStatement>` component (`components/LocationStatement.tsx`) — its icon + mono + separator grammar reads as data display, not as place-naming. Retired v1.1h; file deleted with the Booth redesign.
- The `<BoothLocationCTA>` component (`components/BoothLocationCTA.tsx`) — its CTA-card-with-swatch treatment reads as marketplace chrome. Retired v1.1h; file deleted with the Booth redesign.
- Mono type for booth numbers — retired. Booth numbers are set in **IM Fell English**, which reads as *address* rather than *record*.
- The word "Directions" as explicit link copy — retired. Tapping the address opens maps, per platform convention. A dotted underline signals the affordance.

---

## The material vocabulary — COMMITTED v1.0

One skeuomorphic signature per find, used sparingly and with intent.

### The booth post-it

A small cream note placed on the **bottom-right** edge of a photograph, overhanging the lower frame. Moved to bottom-right in v1.1d after the status pill was retired, opening up that corner — the post-it replaces it as the single grounded object on the photograph.

**Cross-page primitive (v1.1h):** the post-it now attaches to two distinct photograph types:
- **Find Detail's 4:5 object photograph** — post-it names the booth where this specific find can be located
- **Booth page's 16px-radius banner image** — post-it names the booth *as the page's subject*, and acts as a substitute for an inline X in the mall-anchor block below (the post-it already carries the X glyph's meaning for this page)

In both cases the post-it is identical in every dimension, rotation, shadow, and typography — that identity is what makes it read as *the same material gesture*, regardless of which photograph it's attached to. The only difference is visual scale relative to the underlying photograph.

Post-it spec:
- Color `#fffaea` — a near-white cream that reads as a distinct object against the warmer paper background
- Rotation `+6deg` (updated v1.1f from `+3deg`) so it reads as *placed*, not aligned, without approaching the angle where text becomes unreadable in a glance or the note reads as *fallen* rather than *placed*
- Drop shadow `0 6px 14px rgba(42,26,10,0.28)` beneath (Find Detail) / `0 6px 14px rgba(42,26,10,0.32)` (Booth banner, slightly heavier because the banner has more visual weight above it)
- Hairline edge via `0 0 0 0.5px rgba(42,26,10,0.16)` (visible paper-to-paper edge)
- **Inset from the screen edge by 4px** on Find Detail / **14px from the banner's right edge** on Booth (v1.1h — Booth banner is within 10px page padding instead of 22px, so the post-it sits further in proportionally)
- Overlaps the photograph's bottom-right corner slightly so the note appears tucked against the lower frame. Overhang amount: Find Detail `-14px bottom`, Booth banner `-16px bottom`
- Dimensions: **92px wide, 92px minHeight** on Find Detail; **96px wide, 96px minHeight** on Booth banner (v1.1h — slightly larger to hold its weight against the banner's 260px minHeight). Both hold the same 14px eyebrow + 36px numeral composition; only the note's outer dimensions change
- **Push pin** at top-center: an 8px circle in deep warm ink (`rgba(42,26,10,0.72)`) with a 2px inner ring one shade lighter (`rgba(42,26,10,0.55)`) to suggest minimal depth. No metallic highlight, no shine. Small drop shadow `0 1px 2px rgba(42,26,10,0.35)` to lift it slightly. Positioned so its center sits on the top edge of the note, about 40% of the way down the pin's diameter (i.e. the pin reads as *going through* the note)
- Contents: eyebrow label **"Booth" / "Location"** stacked on two lines (updated v1.1f from "Booth" alone) in IM Fell English italic 14px Title Case muted ink with `line-height: 1.1` so the two words read as one label, then the booth number in IM Fell English 36px at primary ink (`#2a1a0a`), all centered within the note. The numeral is intentionally large — it is the visual anchor of the note and therefore of the photograph's location claim

The post-it is the *someone was here and pinned this* gesture. It reads immediately as "this find is at this booth" (or on Booth page, "this booth lives here") without needing a pill, a badge, or a card to contain the information. The pin is a second detail *on the post-it itself*, not a third object on the photograph — it answers the implicit question "how is this note attached?" and sells the placed verb more than rotation alone. The three material dials (brighter surface, stronger shadow, visible hairline edge) together create paper-on-paper separation.

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

**Where the shelf-link pill does NOT appear (v1.1h):** on the Booth page. The Booth page doesn't name the booth via a pill-sized badge — the post-it on the banner is the booth marker, and duplicating the booth number in a pill below the title would double up. The shelf-link pill primitive is reserved for surfaces *pointing at* a booth (Find Detail, Find Map) rather than *living at* one (Booth page).

### Design discipline

Two material objects on any single photograph is the maximum. The post-it and pill together do two distinct jobs (placement vs. state); adding a third object (paperclip, stamp, tape) is decoration. The instinct to add more material cues should be caught before it ships.

---

## Cross-cutting primitives

### Paper as surface

The page background is warm parchment (`#e8ddc7` — `paperCream`). There are **no cards, borders, or rounded halos around content blocks.** The paper *is* the container. Section divisions happen through whitespace, hairline rules, and ornamental marks — never through card chrome.

The background is committed **globally** — `app/layout.tsx` `<body>` and `app/globals.css` `@layer base body` both set `#e8ddc7` (updated v1.1e from the legacy `#f0ede6`). Any page that sets its own background must match this value or inherit. Routes that still show a lighter parchment are running pre-v1.1 palette and need an update.

Optional paper-grain texture via radial gradients at low opacity. Subtle. The grain should read as "this is paper" on second glance, not as "look at the paper texture" on first.

### Color tokens (`lib/tokens.ts` — additions land with Booth v1.1h sprint)

The existing palette in `lib/tokens.ts` stays valid for legacy pages. v1.1 pages inline the palette below until `lib/tokens.ts` is consolidated at the end of the Booth v1.1h sprint (after the page renders correctly against inline tokens — safer ordering than editing tokens mid-build).

**v1.1 palette** (to be added to `lib/tokens.ts` in the Booth v1.1h sprint, final step):
- `paperCream` `#e8ddc7` — page background (updated v1.1 from `#f1ead8` — warmer/browner to shed the yellow cast; reads as aged paper rather than fresh cream)
- `postit` `#fffaea` — post-it note surface (updated v1.1 from `#faf3dc` — brighter to separate from the browner paper)
- `inkPrimary` `#2a1a0a` — primary ink (warmer/deeper than legacy `textPrimary`)
- `inkMid` `#4a3520` — mid ink for quoted captions
- `inkMuted` `#6b5538` — muted ink for secondary copy (updated v1.1 from `#7a6244` — darkened to maintain WCAG AA against the new paper; retains the muted character at the new contrast level)
- `inkFaint` `rgba(42,26,10,0.28)` — hairline rules, dotted underlines
- `priceInk` `#6a4a30` — softened ink for price beside titles

### Photograph surface (v1.1d)

Photographs on Find Detail, thumbnails in the "more from this shelf…" strip, Find Map find tiles, and Booth page Window View + Shelf View tiles (v1.1h) all share the same treatment: **6px corner radius** and **1px solid `inkHairline` border** (`rgba(42,26,10,0.18)`). The radius reads as tipped-in specimen rather than raw file. The border provides a critical separation line when photo subjects have warm/cream tones that otherwise blur into the paper background — this is a feature, not a workaround: the paper-tone-respecting photography is exactly what the brand wants from vendors, and the hairline edge is what makes that photography hold the page without visual chaos. Single constant: `imageRadius: 6`, `imageBorder: 1px solid rgba(42,26,10,0.18)`.

**Banner surface (v1.1h — Booth page):** the vendor banner on `/my-shelf` and `/shelf/[slug]` is a wider-aspect photograph (fills within 10px horizontal page padding, ~260px min height) set at **16px corner radius** with no hairline border — the banner is already held by the paperCream page margin on all four sides and by the post-it at its bottom-right. The larger radius is the lone exception from the 6px rule, justified by the banner's unique role as the page's wide-aspect hero and its much larger surface area (where a 6px radius would read as almost square).

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
| Page title / find title | 32px | IM Fell English 400, -0.005em tracking, line-height 1.18 | Paired with price after em-dash in `priceInk`. v1.0 was 30px — bumped for legibility. Used on Find Detail (find title) and Booth page (vendor name, v1.1h) |
| Quoted caption | 19px | IM Fell English italic, line-height 1.65, **centered** | Always in typographic quotation marks (“ ”) at 26px in muted ink. v1.0 was 17px |
| Section head (mall name, vendor name, Find Map "Find Map" subheader) | 18px (section) / 22px (Find Map mall) / 30px (Find Map subheader) | IM Fell English 400, line-height 1.2–1.3 | v1.0 was 16–17px |
| Address / precise data | 14px | system-ui 400, line-height 1.55, muted ink, dotted underline when tappable | v1.0 was 13px. system-ui is the precision voice — its familiar shapes make small sizes readable |
| "Visit the shelf →" (standalone text link) | — | **Retired v1.1** | The shelf-link pill on the vendor line now carries this role |
| Shelf-link pill numeral (on vendor line) | **16px** | IM Fell English 400 (non-italic), near-primary ink, no leading word, no trailing arrow | Updated v1.1e — was 13px italic with "Booth NNN →". The label carries the verb and arrow now; the pill is just the number. Non-italic reads as number-token rather than word. |
| "Explore booth →" label (v1.1e) | 14px | system-ui 400, muted ink, dotted underline (matches mall address voice), trailing arrow inline | Updated v1.1e — was "Explore" alone with the arrow living inside the pill. Consolidating the verb + direction in the label makes the row read as tappable at a glance and leaves the pill free to read as a pure numeric token. |
| "More from this shelf…" | **15px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — was 13px; bumped to section-announcement floor. Trailing ellipsis always |
| Status pill label | — | **Retired v1.1d** | "On Display" was redundant on a browse page; sold state is carried by the photograph's grayscale treatment |
| Booth pill label (on vendor line) | 16px | IM Fell English 400 non-italic, near-primary ink | Now called the *shelf-link pill*; only surviving pill role |
| Post-it "Booth" eyebrow | **14px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — was 12px but still reading as undersized against the 36px numeral; 14px gives the eyebrow real label weight without competing with the numeral |
| Post-it booth number | **36px** | IM Fell English 400, -0.01em tracking | Updated v1.1 — was 28px. The numeral is the visual anchor of the note and fills the space with authority |
| Shelf thumbnail label (Find Detail "more from this shelf…", Booth Window View tiles) | 13px | IM Fell English italic, mid ink, line-height 1.35, 2-line clamp | v1.0 was 11px |
| Shelf View tile label (Booth v1.1h) | 14px | IM Fell English italic, mid ink, line-height 1.35, 2-line clamp | Bumped 1px from Window View tiles because the 52vw/210px tile has more horizontal room and more stage presence — the label should match the tile's weight |
| Shelf View tile price (Booth v1.1h) | 13px | system-ui, `priceInk`, `-0.005em` tracking | Bumped 1px from Window View tile price (12px) to match the title bump |
| Masthead | **18px** | IM Fell English 400 Title Case single style, `-0.005em` tracking | Updated v1.1e — was 16px with italic on "Finds"; italic retired, size bumped for presence without loading a heavier face |
| Manage section eyebrow | **15px** | IM Fell English italic, Title Case, no letter-spacing, muted ink | Updated v1.1 — matches "More from this shelf…" at section-announcement floor |
| Booth page title eyebrow "a curated shelf from" (v1.1h) | 13px | IM Fell English italic, muted ink, line-height 1.3 | Sits directly above the 32px vendor name. This is the *one* eyebrow allowed on this page; no trailing eyebrow elsewhere |
| View toggle links "Window View · Shelf View" (v1.1h) | 16px | IM Fell English italic, muted ink (active: primary ink, 1px hairline underline), "·" separator at inkFaint | Text-only toggle — no pill chrome, no icons |

**Georgia retires from the ecosystem layer.** All serif type is IM Fell English. This is deliberate — IM Fell has a stronger editorial personality and consistently anchors the journal metaphor. Georgia was a general-purpose serif; IM Fell is *this product's* serif. (v1.1h: Georgia finally leaves the Booth page with this sprint — the last major surface where it was still living.)

### Ornamental marks

Two small ornaments are committed. Both in IM Fell English so they feel typographic rather than decorative.

- **Diamond** `◆` at 10–11px, 42% ink opacity — used between hairline rules as a section divider. Replaces the cross (`✚`) which carried religious baggage. Replaces horizontal card borders. This is the divider for the product.
- **Ellipsis** `…` — used at the end of continuation labels ("more from this shelf…") to invite the next thing rather than announce the current thing.

### Header pattern system — v1.0

Three modes carried over from v0.2, with the masthead treatment now unifying modes A and B.

| Mode | Look | Used for |
|---|---|---|
| **A — Cinematic** | Three-column grid header: back arrow left, centered masthead wordmark, save + share icons right. Hero image sits just beneath. | Find Detail, Booth page (public and owner) |
| **B — Editorial** | Same three-column masthead layout. Context actions (search, filter, menu) replace the save + share cluster on the right depending on page. | Feed, Find Map, `/flagged`, `/admin` |
| **C — Minimal** | Back arrow + page title only. No masthead. Used for onboarding and focused forms where the journal voice would crowd the task. | `/post`, `/post/preview`, `/vendor-request`, `/setup`, `/login` |

The masthead wordmark is the **global anchor**. It appears centered in the header on every Mode A and Mode B page and uses IM Fell English at **18px in a single Title Case style** (no italic on "Finds"), with `-0.005em` tracking (updated v1.1e). This is the single most reused element in the app.

**Masthead row on Booth page (v1.1h):** the Booth page's masthead is a centered wordmark only — no back arrow (owner reaches `/my-shelf` via BottomNav, not a back gesture), no right slot icons (share moved to the banner top-right as a frosted bubble). Public shelf (`/shelf/[slug]`) keeps the back arrow in the left slot since visitors typically arrive from a Find Detail deep link.

### Icon treatment

Header and chrome icons sit inside small circles so they read as *marks* rather than *buttons*. Two variants committed:

- **Paper variant** (default chrome, used on masthead back button and manage actions): `rgba(42,26,10,0.06)` background, **38px diameter** (updated v1.1e from 34), stroke-only icon at 17–18px. No border, no shadow. The faded circle reads as a soft mark on the paper.
- **Frosted variant** (used on the photograph's top-right for save + share — v1.1e; also used on Booth banner's top-right for share — v1.1h): `rgba(232,221,199,0.78)` translucent paperCream background with `backdrop-filter: blur(8px)`, `0.5px solid rgba(42,26,10,0.12)` hairline edge, **38px diameter**, stroke-only icon at 17px. The frosted treatment reads as a floating mark over any photograph — warm tones, cool tones, light, dark — without a heavy colored bubble. **Active/saved state (v1.1f): the bubble background stays constant at the paperCream translucent value; only the glyph color/fill flips to carry the state.** (Earlier v1.1e attempt flipped the bg to a green tint, which blended into warm/dark photos and lost the bubble as a mark. Holding a stable creme bubble and letting the glyph carry the state is the clearer read.)

**Save + share location (v1.1e):** on Find Detail, save and share live in the top-right corner of the photograph (12px inset from the top-right), in the frosted variant, with 8px gap between them. The masthead right-slot on Find Detail is intentionally empty. Rationale: consolidating the interactive chrome near the image itself matches the convention most photo-first interfaces use; the slight cost to the photograph's calm is offset by the post-it's opposite-corner placement keeping the image balanced, and by removing two icons' worth of weight from the masthead so the wordmark can grow to 18px without crowding.

**Share location (v1.1h — Booth banner):** same frosted variant, top-right of the banner, 12px inset. The Booth banner's top-left holds the **dark-translucent edit-banner button** (owner only — `rgba(20,18,12,0.52)` with `backdrop-filter: blur(8px)`, matte pencil icon). The two buttons' contrasting treatments (dark edit / frosted share) signal their different roles honestly: edit is a vendor-only destructive-ish action, share is a browseable everyone-action.

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

### Booth page — COMMITTED v1.1h (session 18)

Applies to both `/my-shelf` (owner) and `/shelf/[slug]` (public). Identical layout; two owner-only affordances (banner edit button + AddFindTile in Window View).

**Order top-to-bottom:**
1. **Masthead row** (Mode A) — **centered "Treehouse Finds" wordmark** (18px, Title Case single style). Owner: no back arrow, empty right slot. Public: back arrow in left slot (visitor typically lands here via a Find Detail deep link), empty right slot. Share is on the banner, not the masthead.
2. **Vendor hero banner** — the vendor's chosen photograph at ~260px minimum height, full width within 10px page padding, **16px corner radius, no hairline border** (the banner's role as the page's wide-aspect hero is why it uses the one exception to the 6px photograph radius rule)
   - **Edit banner** (owner only) in the top-left corner as a dark-translucent bubble (`rgba(20,18,12,0.52)` with blur, 34px, white pencil icon). Dark treatment contrasts with the frosted share bubble on the opposite corner, signaling the different role
   - **Share bubble** in the top-right corner as a frosted paperCream bubble (same primitive as Find Detail save+share), 38px, 12px inset from top-right. Tap → native share sheet → copy public shelf URL on dismiss
   - **Booth post-it** anchored to the bottom-right of the banner, overhanging by `-16px bottom`, inset `14px` from the banner's right edge, rotated `+6deg`. Eyebrow "Booth Location" stacked, numeral 36px. This is the same post-it primitive used on Find Detail; here, it acts as the page's booth anchor (substitute for an inline X in the mall-anchor block below)
   - Banner image has a subtle top-down scrim (`rgba(18,34,20,0.32)` to transparent, 40% height) so the edit/share bubbles read against both light and dark photographs
3. **Title block** (36px top padding to clear the post-it overhang)
   - **Eyebrow** "a curated shelf from" — IM Fell English italic 13px muted, 0 0 4px margin
   - **Vendor display name** — IM Fell English 32px primary ink, line-height 1.1, `-0.005em` tracking, 400 weight. This is the page's headline
4. **Small mall block** — 16px top padding from title
   - Pin glyph 18px (not 22px — this is a secondary location statement, below the title; Find Map uses 22px because there the mall IS the page's subject)
   - Mall name IM Fell English 18px primary, line-height 1.3
   - Address system-ui 14px muted, dotted underline, tappable → Apple Maps deep link via `mapsUrl(address)`
   - Two-column grid (`22px 1fr`, 12px gap) with the pin in the left column and the mall+address stacked in the right
   - No tick, no X, no booth pill — the post-it above already names the booth, the X is redundant on this page per the glyph substitution rule, and the booth pill would double the booth number
5. **Diamond divider** — 22px top padding from mall block
6. **View toggle** — centered pair of text links, `Window View · Shelf View`, 16px IM Fell italic, active has 1px hairline under the text in `inkPrimary`, inactive is `inkMuted`, "·" separator at `inkFaint`. Default on mount: Window View
7. **Window View (default)** — 3-column grid, 10px gap, 18px row-gap (more vertical breathing room between rows because titles and prices sit under each tile)
   - **Tile** — 4:5 portrait, 6px radius, 1px inkHairline border (matches Find Detail shelf cards + Find Map find tiles — the committed photograph primitive)
   - **Title** below tile — IM Fell italic 13px mid-ink, line-height 1.35, 2-line clamp with ellipsis
   - **Price** below title — system-ui 12px `priceInk`, line-height 1.4, `-0.005em` tracking. Appears only if `price_asking` is set and > 0
   - **AddFindTile** (owner only) is the **top-left cell** — aspect 4:5, 6px radius, `1px dashed inkFaint` border, transparent fill, "+ / Add a find" centered (IM Fell 26px + IM Fell italic 13px, both muted ink). Tap → `/post?vendor=[id]`. Never renders in Shelf View
   - **Empty state** (no available finds, owner): just the AddFindTile, centered placeholder message "Your window is empty. Start stocking." (IM Fell italic 14px muted)
   - **Empty state** (no available finds, public): "Nothing on the shelf yet — check back soon." IM Fell italic 14px muted, centered
8. **Shelf View** — horizontal scroll, `scroll-snap-type: x mandatory`, 22px left padding on the container (first tile aligned with the 22px page margin, not flush to the screen edge), 14px gap, 12px right padding after the last tile
   - **Tile** — 4:5 portrait, 52vw width / 210px max-width (~55% larger visible area than Window View or Find Map tiles), 6px radius, 1px inkHairline border
   - **Title** — IM Fell italic 14px mid-ink (1px bump from Window View titles because tiles carry more weight), line-height 1.35, 2-line clamp
   - **Price** — system-ui 13px `priceInk` (1px bump from Window View for parity)
   - No AddFindTile (adding is a Window View gesture per v1.1h commitment)
9. **Diamond-divider closer** — 28px top padding, diamond flanked by hairline rules, then quiet IM Fell italic 16px line "The shelf ends here. More booths await you." at `inkMid`, line-height 1.5, centered. No button, no link — BottomNav's Home tab carries the navigation gesture
10. Bottom padding + bottom nav

**Owner-only affordances:**
- Banner edit button (top-left of banner)
- AddFindTile (top-left cell of Window View)
- All other content identical to the public view

**What retires on the Booth page:**
- `<LocationStatement>` component (`components/LocationStatement.tsx`) — deleted
- `<BoothLocationCTA>` component (`components/BoothLocationCTA.tsx`) — deleted
- `<ExploreBanner>` component (`components/ExploreBanner.tsx`) — deleted; closer pattern replaces it
- `TabSwitcher` pill chrome — retired; text-link view toggle replaces it. The `TabSwitcher.tsx` file itself stays parked with a retention comment because the mode-toggle primitive (active/inactive text + hairline) may generalize to other surfaces; the rounded-pill chrome is gone
- `FoundTile` in `components/ShelfGrid.tsx` — no longer called by either Booth page; file stays with a retention comment ("parked — no current caller, retained for future vendor sold-history surfaces post-beta")
- Georgia serif throughout — all chrome and copy moves to IM Fell English (finally clearing Georgia from the ecosystem's last major surface)
- Dark-green "Booth NNN" pill on the banner — retired; the booth post-it carries the booth number now
- `MapPin · America's Antique Mall · Louisville` inline line on the banner — retired; the mall block below the title carries the mall now
- 3-column square tiles — replaced with 3-column 4:5 portrait tiles (square felt like a thumbnail grid; portrait reads as a window pane)
- Green-gradient "Keep exploring / Explore more booths nearby" bottom CTA card — retired with `<ExploreBanner>`
- On Display / Found homes availability tabs — replaced with Window View / Shelf View inventory-view tabs
- Found homes surface — sold items no longer render on this page at all (sold data still lives in Supabase)
- `<AddBoothSheet>` code path on `/shelves` — separate retirement, flagged by T4b, not this sprint

**What's new on the Booth page (v1.1h):**
- Banner as pure photograph + post-it (banner is no longer the canvas for vendor name text overlay)
- Vendor display name as the IM Fell 32px page title below the banner
- Small pin-prefixed mall block as the secondary location statement
- Window View + Shelf View toggle and the behavior split between the two views
- 4:5 portrait tiles with titles + prices (previously: square tiles, no title, no price)
- AddFindTile promoted to the top-left cell position (previously: last cell after existing posts)
- 22px left-padding on Shelf View container so the first tile aligns with the page margin
- Diamond-divider closer matching Find Map's pattern

**Open questions deferred past v1.1h:**
- Curator's Statement / vendor bio block — still parked per session 14 David's call, revisit post-beta when there's real vendor feedback on whether the page benefits from a bio line
- Sold-history surface for a future "vendor story" view — `FoundTile` is retained against this future; not in scope for v1.1h
- Featured-tile rhythm in Window View grid (one larger tile every N rows) — parked; revisit once there's enough vendor photo data to see natural patterns
- 3:4 portrait-aspect tiles (vs current 4:5) — parked until vendor photo intake evolves beyond the MVP square-crop pipeline

### BottomNav — v1.1d minimal patch

The shared `components/BottomNav.tsx` is used by every page and still carries the legacy warm-white palette from v0.2. Full chrome rework is scoped for a dedicated session (not v1.1h — this sprint's scope is only the Booth page body). For now, the session-16 two-line patch holds:

- Background: `rgba(232,221,199,0.96)` (paperCream at 96% opacity with `backdrop-filter: blur(24px)`) — matches the new `paperCream` on the body
- Top border: `1px solid rgba(42,26,10,0.18)` (`inkHairline`) — strong enough to visually distinguish the nav from the page above it without becoming chrome; the border is essential because the nav-and-page are now nearly the same tone

Green accent (`#1e4d2b`) and muted ink (`#8a8476` legacy) retained for now.

### Feed — COMMITTED v1.1i (session 20)

The front door at route `/`. The one screen in the product where a shopper arrives without context and where *embracing the search* is the operational goal. Every design choice on this page is subordinate to that: the photograph is the invitation, not a card around the photograph.

**Order top-to-bottom:**
1. **Masthead row** (Mode B) — left slot menu icon (38px paper bubble), centered "Treehouse Finds" wordmark (18px Title Case single style), right slot profile/user-circle icon (38px paper bubble)
2. **Feed hero on paper** (Header 2) — 22px horizontal padding, 20px top padding, 6px bottom padding
   - **Eyebrow** — IM Fell English italic 15px muted, line-height 1.4. Copy is state-dependent:
     - When All malls is selected: "Finds from across"
     - When a specific mall is selected: "Finds from"
   - **Mall/geography name** — IM Fell English 26px primary ink, line-height 1.2, `-0.005em` tracking. **Tappable** — opens `<MallSheet>`. Paired inline with a small 14×14px chevron-down glyph in muted ink at the baseline to signal the affordance. Copy is state-dependent:
     - All malls: "Kentucky"
     - Specific mall: the mall's display name
   - **Address / geo line** — state-dependent:
     - All malls: IM Fell italic 13.5px muted, reads "Kentucky & Southern Indiana" — no pin glyph, no tap affordance (it's a geography summary, not a location)
     - Specific mall: pin glyph (13×16px muted) + system-ui 14px muted dotted-underline address, tappable via `mapsUrl(address)`
3. **Diamond divider** — `◆` flanked by hairline rules, 16px top padding / 14px bottom
4. **Paper masonry** — 22px horizontal padding, 2-column grid, 12px gap
   - **Column offset** — right column begins with a top margin equal to 50% of the first-left-column tile's rendered height (live-measured via `ResizeObserver` on the first tile). This creates the "branching" gestalt that deepens the treehouse metaphor. Skeleton uses a fixed 65px offset to prevent layout jump during initial load
   - **Tile** — full-width within its column, natural aspect ratio (variable height — the photograph's own aspect ratio determines the tile height, which is what produces the branching effect), **6px corner radius**, **1px `inkHairline` border**, overflow hidden, background `postit` (shows through while image loads)
   - **No title, no price, no caption** on tiles. The photograph is the entire tile. This is the deliberate divergence from the 4:5 Find tile primitive used elsewhere; the rationale is that the Feed is the one surface where *embracing the search* means letting the photograph alone do the work, and the price reveal happens on Find Detail after the user's tap has declared interest. Price in the grid would read as a marketplace listing filter; title in the grid would read as catalog metadata. Neither serves the front-door gesture
   - **Frosted heart top-right** — identical to Find Map's find tile heart: 30×30px paperCream translucent bubble (`rgba(232,221,199,0.78)` with `backdrop-filter: blur(8px)`), 0.5px inkHairline edge, heart icon 14px. **State-independent bubble background** — when saved, only the glyph color flips to filled green; the bubble stays paperCream (matches v1.1f Find Detail save-state treatment). Tap toggles the bookmark via `flagKey(postId)` in `safeStorage`, stops propagation so the tap doesn't navigate
   - **Sold items do not render** — `getFeedPosts` already filters `status: "available"` at the data layer; the client never sees sold rows on the feed. No grayscale treatment, no "Found a home" caption anywhere in the grid. See v1.1i sold-retirement commitment
   - **Tap the tile** — navigates to `/find/[id]`
5. **Empty state** — "The shelves are quiet." (IM Fell 20px primary) + "Check back soon — new finds land here the moment a vendor posts them." (IM Fell italic 14px muted, max-width 230px, centered). 72px top padding. No CTA (shoppers have nothing to do if the feed is empty; vendor onboarding lives at `/vendor-request` which is reachable via BottomNav context elsewhere)
6. **Bottom nav** — standard BottomNav chrome (v1.1d minimal patch)

**What retires on the Feed (v1.1i):**
- `<MallHeroCard>` gradient card primitive (dark-gradient hero with noise overlay, eyebrow "Treehouse Finds from", CTA button "Explore the shelves") — contradicts paper-as-surface and reads as marketplace marketing chrome
- `<GenericMallHero>` — the All-malls variant of `MallHeroCard`; replaced by the feed hero's All-malls state
- Inline `ChevronDown` mall dropdown in the masthead — replaced by the `<MallSheet>` bottom sheet, triggered by tapping the mall/geography name in the hero
- v0.2 tile surface (cream `#edeae1` with warm border) — retiled on paper with 6px radius + inkHairline border
- "Found a home" badge on sold tiles + sold-tile grayscale/opacity treatment — retired with the sold-retirement commitment; sold posts no longer appear in the grid at all
- v0.2 mall hero's cinematic gradient treatment (`default` / `golden` / `forest` / `terracotta` / `slate` gradient variants) — retired entirely; paper-as-surface replaces the gradient chrome
- Raw `localStorage` calls in the feed — already migrated to `safeStorage`; the v1.1i rewrite preserves this
- `colors` (v0.2 legacy palette) imports — feed migrates to the `v1` token set in `lib/tokens.ts` to match Find Detail / Find Map / Booth

**What's new on the Feed (v1.1i):**
- Feed hero block on paper with state-dependent eyebrow + 26px mall/geography name as tappable MallSheet trigger
- Frosted hearts on every tile for save-from-feed (previously: save only reachable from Find Detail)
- Paper masonry tiles at 6px radius + inkHairline border (matches every other photograph surface in the app)
- First-load default is All malls with "Finds from across / Kentucky" copy; a saved mall selection from `localStorage` overrides the default on return visits
- Sold posts filtered at both data layer and presentation (zero sold posts visible on the feed under any condition)

**Open questions deferred past v1.1i:**
- Whether saved-but-sold finds should show a tiny signal on the Find Map tile before tap-through (currently: sold saves render identically to available saves; 3B is the reveal on tap). Decision deferred until there's real on-device behavior data
- Pull-to-refresh on the feed — tracked as a Sprint 3 carryover, not in v1.1i scope
- Feed pagination beyond the first 80 posts — Sprint 6+
- Caveat margin-note as a rare Feed accent (per the one-per-screen rule) — held; the current v1.1i spec has no Caveat anywhere on the Feed, and adding one is a deliberate future design choice, not an oversight
- Vendor directory / cross-vendor discovery surface — Sprint 6+

### MallSheet — COMMITTED v1.1i (session 20)

The canonical bottom-sheet primitive for mall selection. Committed on the Feed as the first user; reusable by `/post` and `/vendor-request` in a future sprint.

**Structure:**
1. **Backdrop** — `rgba(30, 20, 10, 0.38)` dim overlay across the full viewport beneath the sheet. Tap dismisses
2. **Sheet container** — anchored to the bottom of the 430px viewport, slides up on open. Background `paperCream`, top corner radius 20px, `0 -8px 30px rgba(30, 20, 10, 0.28)` shadow, max-height 78% of viewport, scrollable internally. Respects `env(safe-area-inset-bottom)` so the bottom row doesn't sit behind BottomNav chrome
3. **Drag handle** — 44×4px rounded-rectangle in `inkFaint`, centered, 12px below the top edge. Visual drag affordance even though the sheet is also dismissible via backdrop tap
4. **Header** — "Choose a mall" in IM Fell English 22px primary, `-0.005em` tracking, 22px horizontal padding
5. **Subhead** — "Kentucky & Southern Indiana — tap to filter the feed." in IM Fell italic 14px muted, 22px horizontal padding, 14px bottom padding
6. **Diamond divider** — `◆` flanked by hairline rules, 4px top / 12px bottom padding, 22px horizontal padding
7. **All-malls row** — first row, special treatment:
   - **No pin glyph** in the left column (violating the pin-per-row pattern deliberately, because All isn't a place)
   - Label: IM Fell English *italic* 19px primary ink, "All malls"
   - Right: find-count in system-ui italic 13px muted (e.g., "1 mall live · more soon" for the beta-era single-mall reality; or "N malls" when multi-mall ships)
   - Active state (when All is the current filter): 1px hairline underline on the "All malls" label in inkPrimary (matches Booth page ViewToggle active treatment; matches the first cross-cutting use of this active-state pattern)
   - Grid: `1fr auto` two-column (no left pin column)
8. **Mall row** (repeating, one per mall in the system):
   - **Pin glyph** 18×22px in left column (primary ink when active, muted ink when inactive)
   - **Mall name + city** stacked in middle column: mall name IM Fell 18px primary, `-0.005em` tracking, line-height 1.25; city in system-ui 13px muted (e.g., "Louisville, KY" or "Clarksville, IN")
   - **Find-count** in right column: system-ui italic 12.5px muted (e.g., "42 finds"). Shows "—" (em-dash) for malls with no live content during beta
   - Active state: 1px hairline underline on the mall name label in inkPrimary; row background `rgba(42, 26, 10, 0.03)` subtle wash
   - Grid: `24px 1fr auto` three-column
   - Bottom border: 1px inkHairline (except on the last row)
9. **Sort** — mall rows sorted alphabetically by `name`; All malls always first regardless of sort

**Props contract** (for the eventual `components/MallSheet.tsx`):
```
<MallSheet
  open={boolean}
  onClose={() => void}
  malls={Mall[]}
  activeMallId={string | null}  // null means All is active
  onSelect={(mallId: string | null) => void}  // null selects All
  findCounts?={Record<string, number>}  // optional per-mall counts; falls back to "—"
/>
```

Selection invokes `onSelect` with the mall ID (or null for All) and the consumer is responsible for persisting the choice to `safeStorage` and closing the sheet via `onClose`.

**What retires with MallSheet (v1.1i):**
- Inline `ChevronDown` mall dropdown on the feed (v0.2) — replaced by MallSheet-triggering mall name in the feed hero
- Any ad-hoc mall pickers across other pages — they migrate to MallSheet in future sprints (`/post`, `/vendor-request`, admin flows)

### Find Detail sold landing state — COMMITTED v1.1i (session 20)

Applies when a shopper arrives at `/find/[id]` and the fetched `post.status === "sold"`. The normal Find Detail layout (photograph, post-it, title, caption, cartographic block, shelf strip) does not render; it is replaced entirely by the sold-landing layout below.

**Order top-to-bottom:**
1. **Masthead row** — back arrow (left, 38px paper bubble), "Treehouse Finds" wordmark (centered, 18px Title Case single style), right slot empty. **Same masthead as the normal Find Detail** so the chrome feels continuous; the body is what changes
2. **Headline** — IM Fell English 30px primary ink, line-height 1.2, `-0.005em` tracking, centered, 90px top padding, 32px horizontal padding. Copy: **"This find / found a home."** — set with a hard line break between "find" and "found" so the two-line composition reads as a quiet statement rather than a run-on sentence. Width naturally wraps at 430px; margin plus line break produce the cadence
3. **Explanation** — IM Fell English italic 16px muted, line-height 1.65, centered, max-width 300px, 14px top padding. Copy: **"The piece you saved has been claimed by someone else. That's the way of good things."** The closing fragment ("That's the way of good things.") is deliberate — it names the emotional reality honestly rather than apologizing for the outcome
4. **Diamond divider** — `◆` flanked by hairline rules, 20px top / 16px bottom padding, 60px horizontal padding (more inset than the Feed/Find Map diamond to read as a closer, not a section break)
5. **Primary link** — "Visit [vendor display name]'s shelf →" in IM Fell English italic 15px mid-ink, dotted underline in inkFaint, `textUnderlineOffset: 3`, centered. Wraps a `<Link>` to `/shelf/[vendor-slug]`. The vendor's Booth page still shows sold items (per v1.1i commitment), so this is a meaningful next step — the shopper can see more of this vendor's work even though this specific piece is gone
6. **Secondary link** — "Back to Treehouse Finds" in IM Fell English italic 15px mid-ink, dotted underline, centered, 22px top padding from primary link. Wraps a `<Link>` to `/`
7. **Bottom nav** — standard BottomNav chrome, flaggedCount badge still works

**Why this treatment and not the others:**
- **3A (dim the page + toast)** — was explored and rejected for the MVP. The ambiguity of a dimmed-but-still-there page creates a "is this real or not?" read, and the interaction design questions it raises (auto-redirect timing, does the post-it change, do we show other vendor finds beneath, does the saved-state memory matter) are not solvable without real on-device behavior data. Tracked as a post-MVP design direction worth revisiting
- **3C (render as normal)** — rejected because it shows a price that isn't real and could send a shopper on a wasted trip. Violates "rooted in reality"
- **3B** — chosen because it's honest, unambiguous, and matches the journal voice already committed on Find Map's closer line. End-of-path is a legitimate page state in this product

**Bookmark behavior when a saved find sells:**
The bookmark key in `safeStorage` is **not pruned** when a saved find sells. The user's Find Map continues to show the find in its itinerary (same tile treatment as an available save, no visible sold signal on the tile), and tapping through routes to this 3B sold landing state. The rationale: a user's saved list should not silently change behind them; the 3B page IS the closure, reached by the same tap that would have shown the find. Clearing the bookmark (either via the frosted heart on the 3B page if we add one in a future iteration, or via the Find Map tile's heart) remains the user's explicit action

**Open questions deferred past v1.1i:**
- Whether the 3B page itself should have an unsave affordance (currently: no — unsaving is done from Find Map). Trigger: real usage data showing whether users naturally return to Find Map to clean up or if they expect to unsave from 3B
- Whether saved-but-sold Find Map tiles should show a tiny signal (a small dot, a faint hairline tint) before tap-through. Held for on-device data

### Feed header + mall bottom sheet — SUPERSEDED by v1.1i

This section's v1.0 scaffolding ("scope against v1.0 before code") has been fully superseded by the committed **Feed** and **MallSheet** sections above (v1.1i, session 20). Retained here only as a breadcrumb: earlier drafts staged a bottom-sheet pattern without committing to specifics; the v1.1i commitment finalizes the spec and retires v0.2 `MallHeroCard` from the feed entirely.

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
- 4:5 photograph with 6px corner radius and 1px `inkHairline` border (matches Find Detail hero + shelf thumbnails + Booth Window/Shelf tiles)
- Frosted `paperCream` translucent heart bubble top-right, 30×30px, `backdrop-filter: blur(8px)`, 0.5px inkHairline edge — exact Find Detail chrome
- Heart is always filled green on this page (Find Map is by definition the saved-finds list; bubble never shows an unsaved state here). Tap unsaves the find and removes it from local state
- Title — IM Fell italic 13px mid-ink, max 2 lines with ellipsis
- Price — system-ui 13px `priceInk` (`#6a4a30`), `-0.005em` tracking (matches Find Detail price treatment)
- Sold state — photo gets 50% grayscale + 62% opacity filter; price replaces with "Found a home" in IM Fell italic 12.5px muted
**Sold state — UPDATED v1.1i:** sold saves still render in Find Map (their bookmark keys are not pruned when a find sells, and `getPostsByIds` still hydrates sold rows), but the **sold-state grayscale + opacity + "Found a home" caption treatment retires** per the v1.1i sold-retirement commitment. Sold saves render visually identical to available saves on the Find tile — the reveal happens on tap-through via the Find Detail 3B sold landing state. The `isSold` branch inside the Find tile becomes dead code after this sprint and should be removed. Do **not** add a status filter to `getPostsByIds`: doing so would prevent sold saves from hydrating, which would leave the user's bookmark key dangling with no tap-target and no way to reach the 3B closure — the Find Map tile is what takes the user to 3B. Keeping the bookmark alive + keeping the tile visible + letting 3B be the reveal is the committed three-part contract; removing any one of them breaks the other two.

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

---

## Pattern retirement log

Patterns removed from the system in v1.0 that shipped in v0.2:

| Retired | Replaced by | Why |
|---|---|---|
| `<LocationStatement>` component | Cartographic pin + X block (Find Detail, Find Map) / post-it on banner (Booth, v1.1h) | Data-display grammar; read as record not place. File deleted v1.1h. |
| `<BoothLocationCTA>` component | Inline cartographic block / Booth page's post-it + mall block (v1.1h) | Marketplace CTA chrome; eroded the journal voice. File deleted v1.1h. |
| `<ExploreBanner>` component (v1.1h) | Diamond-divider closer with quiet IM Fell italic line | Green-gradient CTA card contradicts paper-as-surface; copy read as marketplace voice ("Keep exploring / Discover more finds"); BottomNav's Home already carries the navigation. File deleted v1.1h. |
| `TabSwitcher` rounded-pill chrome (v1.1h) | Text-link view toggle ("Window View · Shelf View") | Pill chrome read as SaaS dashboard; the view toggle is part of the page's voice, not a separate UI primitive. The `TabSwitcher.tsx` file retires; a successor text-link toggle lives inside Booth page code for now (may extract to a component if another page needs it) |
| On Display / Found homes availability tabs (v1.1h) | Window View / Shelf View inventory-view tabs | Availability-as-tab is infrastructure thinking; ways-of-seeing-the-inventory is story thinking. Sold items retired from the page entirely |
| Four-button system (Primary/Secondary/Ghost/Link) | IM Fell English italic links with dotted underlines | Button chrome tips Treehouse toward generic app aesthetic |
| Georgia as the primary serif | IM Fell English | Georgia is general-purpose; IM Fell is *this product's* voice. v1.1h finally clears it from the Booth page (the last major surface) |
| Mono for booth numbers and data | IM Fell English (booth) / system-ui (precise data) | Mono signaled *record*; this product names *places* |
| Pulsing green status dot | Straight status pill | Tech/IoT feel; pill with typographic label fits the voice |
| Card pattern system (Plain/Thumbnail/Metric/CTA) | Paper as surface, whitespace + hairline ornaments | Card halos are dashboard grammar; paper is notebook grammar |
| "Directions" as explicit link word | Dotted underline on the address alone | Platform convention; less chrome |
| Italic on "Finds" in the masthead wordmark (v1.1e) | IM Fell English Title Case single style at 18px, `-0.005em` tracking | IM Fell ships 400 only — single-style + slight size bump reads as more present without a bolder face; italic on "Finds" was two styles competing for a line that only needs to announce one thing |
| "Booth" word and trailing arrow inside the shelf-link pill (v1.1e) | "Explore booth →" label carries verb + direction; pill carries only the number | Separating verb from token lets the pill read as a clean numeric badge and lets the label carry the tap-affordance signal closer to the address voice it sits next to |
| Save + share in the masthead right slot (v1.1e) | Save + share as frosted bubbles in the photograph's top-right corner | Consolidates interactive chrome near the image itself, freeing masthead weight for the wordmark and matching the convention most photo-first interfaces use |
| Vendor name text overlay on the Booth hero banner (v1.1h) | Vendor name relocates to IM Fell 32px page title below the banner | The banner was doing two jobs (photograph + title canvas); splitting them lets the banner be a pure photograph and lets the vendor name read as the page's headline |
| `MapPin · America's Antique Mall · Louisville` inline line on Booth banner (v1.1h) | Small pin-prefixed mall block below the title | Mall is context, not banner-header material; demoting it to a small block acknowledges the Booth page's subject is the booth, not the mall |
| `<MallHeroCard>` + `<GenericMallHero>` gradient hero cards (v1.1i) | Feed hero on paper (IM Fell italic eyebrow + 26px mall/geography name as MallSheet trigger + state-dependent address/geo line) | Dark gradient + noise overlay + CTA button read as marketplace marketing chrome and contradicted paper-as-surface. The paper hero lets the feed's front-door voice match the rest of the app without sacrificing mall identity |
| Inline `ChevronDown` mall dropdown in the feed masthead (v1.1i) | `<MallSheet>` bottom sheet triggered by tapping the mall/geography name in the feed hero | Inline dropdown is a control, not a place-selection gesture. Bottom sheet with pin-glyph-per-row and a no-glyph italic All row treats mall selection as a cartographic choice |
| Sold-state grayscale + opacity + "Found a home" caption on feed and Find Map tiles (v1.1i) | Sold filtered from feed at data layer; sold saves on Find Map render identical to available saves, with 3B sold landing state on Find Detail as the reveal | "Found a home" as a visible label on a browse/discovery surface reads as a marketplace status cue; retiring it from shopper-facing paths lets those surfaces stay about what's available. Sold still renders on the Booth page because the vendor's story/credibility benefits from showing what's moved

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
| "a curated shelf from" eyebrow copy (v1.1h) | One IM Fell italic lowercase eyebrow line above the vendor name on the Booth page. Kept in lowercase (not Title Case) because sentence-case here reads as a prepositional phrase continuing into the vendor name — "a curated shelf from / ZenForged Finds" reads as one complete thought. This is the *one* eyebrow allowed on the Booth page; the pattern does not generalize |

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

44×44px minimum (Apple HIG), achieved via padding where the visual element is smaller. This was already committed in v0.2; v1.1 reaffirms. The Booth page view toggle links meet this via 4px top / 6px bottom padding giving the 16px text a tap area of ~26×90px; the overall tap zone for "Window View" is ~44px total height including the line-height of the text.

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

## Terminology commitments (carried from v0.2, unchanged through v1.1h)

| Concept | Word | Forbidden alternatives |
|---|---|---|
| Sold item | "Found a home" | "Sold", "Unavailable" |
| Vendor's physical location | "Booth" | "Shop", "Stall" |
| Single item | "Find" | "Listing", "Item", "Product" |
| Vendor's collection | "Shelf" | "Inventory", "Store" |
| Mall | "Mall" everywhere in UI | "Treehouse Spot" retired |
| Available item | "On Display" (where named) | "Available" is internal data only |
| Vendor (user-facing) | "Curator" where emotional; "Vendor" where transactional | No mixing within one screen |
| Booth page inventory views (v1.1h) | "Window View" (grid) / "Shelf View" (horizontal scroll) | Do not revert to availability tab labels |

**Sold-label surface policy (v1.1i):** the word "Found a home" remains the committed terminology for the sold state when it does surface, but for the MVP window it appears in only two places: (1) the Find Detail sold landing state headline ("This find / found a home."), and (2) the Booth page if/when sold-history surfaces are re-added post-beta. The feed and Find Map do not show sold posts or any "Found a home" labeling during MVP.

---

## Remaining `PENDING`

| Item | Trigger for the pass |
|---|---|
| Nav Shelf decision + implementation | David reviews `docs/mockups/nav-shelf-exploration.html` A/B/C/D; ship chosen treatment; bundle with BottomNav full chrome rework |
| BottomNav full chrome rework | Bundle with Nav Shelf decision |
| Onboarding screens (`/vendor-request`, `/setup`, `/login`) v1.0 pass | Sprint 5 — bundle with "Curator Sign In" rename |
| `/admin` visual pass | T4b admin surface consolidation |
| `<MallSheet>` migration to `/post` and `/vendor-request` | When those surfaces get their v1.0 passes (Sprint 5). The primitive is committed in v1.1i; the migration is mechanical |
| 3A Find Detail sold landing state (photograph-still-visible treatment) | Post-MVP, when there's real on-device sold-find behavior data. Decisions needed before committing: auto-redirect timing, saved-state memory, does the post-it change, do we show other vendor finds beneath |
| Find Map saved-but-sold tile signal | Post-MVP on-device data — do users expect *any* visible cue on a sold save before tap-through, or is 3B a clean enough reveal? |
| Dark mode | Not prioritized |
| Curator's Statement / vendor bio block on Booth page | Post-beta; parked pending real vendor feedback |
| Sold-history surface for a future "vendor story" view | Post-beta; `FoundTile` retained against this future. Would re-surface "Found a home" terminology on the Booth page — in scope for that sprint, not MVP |
| Featured-tile rhythm in Booth Window View grid | Trigger: tiered pricing OR enough post-launch vendor photo data to see natural patterns |
| Portrait-aspect variety (3:4 tiles) | Trigger: vendor photo intake moves beyond MVP square-crop pipeline |
| Vendor directory / cross-vendor discovery | Sprint 6+ |
| Cleanup pass: inline `C` objects → `colors` import across older pages; magic-number spacing → spacing tokens | Dedicated cleanup session after Feed v1.1i ships (Find Detail / Find Map / Booth / Feed all on `v1` tokens after this sprint; older pages — vendor profile, mall page, post flow, admin — still on `colors`) |

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
| `lib/tokens.ts` | Implemented color, radius, spacing tokens (code-level source of truth). v1.1 additions land as the final step of the Booth v1.1h sprint. |
| `docs/DECISION_GATE.md` | Brand Rules, Tech Rules, Agent Roster. The tagline lives here as a core anchor. |
| `docs/onboarding-journey.md` | Sister canonical spec for onboarding flows |
| `CONTEXT.md` | Architecture reference |
| `.claude/MASTER_PROMPT.md` | Session-open protocol — includes Design agent standup |

---
> This document is the canonical source of truth for the Treehouse design system.
> It is maintained by the Design agent and reviewed by David at each design-adjacent session.
> Last updated: 2026-04-18 (session 20 — v1.1i pass: Feed paper masonry + feed hero on paper; `<MallSheet>` committed as canonical bottom-sheet primitive; sold retires from shopper discovery surfaces with Find Detail 3B sold landing state as the reveal; `<MallHeroCard>` + `<GenericMallHero>` retired)

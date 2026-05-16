# /find/[id] Destination Hero — Design Record

**Status:** 🟢 Ready for implementation
**Session:** 170 (2026-05-17)
**Cost shape:** B — re-architect destination as secondary hero (Shape B per session-170 triage)
**Predecessor:** Session 169 round 2 (`da3c29c`) introduced the CTA pair (Explore Booth + Flag the Find) and the tappable map snapshot under the mall/booth card. This design pass re-architects those additions into a coherent `<DestinationHero>` primitive.

---

## Problem statement

David's session-170 design ask surfaced 4 concerns on `/find/[id]`:

1. **Save/unsave (Remove Flag) visual class collides with secondary buttons** — toggle-state vocabulary should be semantically distinct from action vocabulary.
2. **"Purchase this item at" eyebrow reads weak** — important semantically (it sets up the destination) but the trailing dominant title + price block overwhelms it; text "trails off."
3. **Mall + Booth + Map are three stacked siblings, not one component** — should read as one surface, a secondary hero ("this is where you go to get this item").
4. **Page reads as add-on elements, not cohesive composition** — items 1–3 stacking from session 169's additive ship is the root cause.

Audit-first read of `app/find/[id]/page.tsx` confirmed: current vertical stack has **7 distinct elements** between photo hero and carousel (CTA pair / eyebrow / mall+booth card / map snapshot / carousel header / etc.) when the intent is **3 anchors** (photo hero / title-price / destination identity).

---

## Reframe (locked via session-170 prose pass)

**Flag the Find is the entire page's primary CTA.** It moves from a button in the under-price row to a corner bubble on the photograph itself, matching the canonical engagement-tier vocabulary across the lattice (♥-save on Home tiles, 🔖-bookmark on /shelf hero, ★-favorite on mall cards).

**The destination is purely informational** — *"here's where it is, here's a map signal so you can see where."* No CTAs inside the destination card. Map snapshot stays tappable as a spatial-wayfinding affordance.

**Result:** page composition collapses from 7 stacked elements to **3 anchors** — photo (with save) → title/price → destination hero → page ends.

---

## V1 mockup + frame pick

**Mockup:** `docs/mockups/find-destination-hero-v1.html` (3 frames, full page composition each, identical photo + title + price, only `<DestinationHero>` varies)

**Pick: Frame C — Map-led composition.** Map fills 16:9 at top of card; mall + booth info as info strip below; eyebrow floats outside above the card.

**Rationale:** Frame C reads as spatial-first — the map IS the place — which best serves David's stated thesis (digital-to-physical bridge). Frame A was too quiet (refined sibling, not a peer hero); Frame B's distinctive lift was a viable runner-up but risked competing visually with the photo hero. Frame C lets the map carry the meaning so individual elements compete less.

---

## Frozen decisions

### Page composition (3 anchors)

- **D1.** Page composition top-to-bottom: Photo hero (with save bubble top-right) → Title + Price (centered, current Lora 32 + Inter big treatment unchanged) → DestinationHero (informational) → page ends.
- **D2.** "More from this booth" carousel retires entirely (David's session-170 Q2 pick). Booth navigation covered by the destination card's vendor/booth strip tap → /shelf/[slug].
- **D3.** CTA pair under price (session 169 round 2: Explore Booth + Flag the Find) retires entirely. Both affordances dissolve into their new placements: save → photo corner bubble; booth navigation → vendor/booth strip tap.

### Save affordance (Flag the Find)

- **D4.** Flag the Find moves to **photograph top-right corner** as 44×44 v1.iconBubble PiLeaf — lattice canonical (David's session-170 Q3 pick, prioritizing strict lattice consistency over per-surface optimization).
- **D5.** PiLeaf (outline) on default; PiLeafFill on saved. Tap toggles. Existing `handleToggleSave` + `find_saved` / `find_unsaved` events preserved unchanged.
- **D6.** Bubble geometry: 44×44, v1.iconBubble bg, PiLeaf 22px stroke-default, color v1.green / v2.accent.green. Matches Home masonry tile flag affordance + /shelf hero bookmark bubble.

### `<DestinationHero>` structural shape (Frame C)

- **D7.** Map snapshot at top of card. Aspect ratio **16:9** (David's session-170 Q2 recommended pick — ~211px tall on iPhone SE). Full-width inside card, no internal padding around it.
- **D8.** Info strip below map. Two-column grid: mall info left, booth badge right. Padding `14px 16px 16px`. `column-gap: 14px`. `align-items: end`.
- **D9.** **Mall info column** (left): mall subtitle on top + vendor name below.
    - Mall subtitle: `font-family: FONT_INTER, font-size: 11.5px, color: v2.text.muted, text-decoration: underline + dotted + offset 3px, line-height: 1.4`. Format: `"{mallName} · {city}, {state}"`. Tappable → Apple Maps deep-link (`mapLink`).
    - Vendor name: `font-family: FONT_CORMORANT, font-size: 20px, color: v2.text.primary, line-height: 1.3, letter-spacing: -0.005em, marginTop: 3px`. Ellipsis on overflow (`whiteSpace: nowrap`).
- **D10.** **Booth badge column** (right, `align-items: flex-end`):
    - "BOOTH" label: `font-family: FONT_INTER, font-size: 9px, font-weight: 700, color: v2.accent.green, letter-spacing: 0.12em, text-transform: uppercase, line-height: 1, marginBottom: 4px`.
    - Booth numeral: `font-family: FONT_NUMERAL, font-size: 28px, font-weight: 500, color: v2.accent.green, line-height: 1, letter-spacing: -0.01em`.

### `<DestinationHero>` eyebrow

- **D11.** Eyebrow lives **outside the card, above it** (David's session-170 Q1 recommended pick).
- **D12.** Treatment: PiStorefront icon (`size={18}`) + "Purchase this item at" text. `font-family: FONT_CORMORANT, font-style: italic, font-size: 18px, color: v2.text.secondary, line-height: 1.3`. Flex row with `gap: 6px`. Padding `0 4px 10px` (small horizontal indent for typographic alignment with card; bottom gap to card).

### `<DestinationHero>` card visual

- **D13.** Card bg: `v2.surface.card` (#FFFCF5). 1px border: `v2.border.light`. Border-radius: 12px. Overflow hidden (so map snapshot's top corners clip to card radius).
- **D14.** Subtle shadow: `0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)` (David's session-170 Q4 recommended pick — gentle lift off page bg without competing with photo hero).

### Tap surface model

- **D15.** **Three independent tap targets** inside the destination card (David's session-170 Q5 recommended pick):
    1. **Map area** → `/map?mall=<slug>` (Link wrapper around the map snapshot div).
    2. **Mall subtitle text** → Apple Maps deep-link via `mapLink` (existing `<a target="_blank">` pattern from current implementation).
    3. **Vendor name + booth badge strip** → `/shelf/[vendorSlug]` (Link wrapper around the info-strip non-map portion).
- **D16.** `stopPropagation` on inner taps so the three targets don't bubble into each other. Mall subtitle anchor calls `onClick={(e) => e.stopPropagation()}` (preserves existing pattern).

### Defensive fallbacks

- **D17.** When `mallLat` OR `mallLng` OR `mallSlug` is null, the map snapshot section omits entirely. Card collapses to just the info strip (no map at top). Border-radius still applied to the info-strip-only card.
- **D18.** When `vendorSlug` is null, the vendor/booth strip is not tappable (still renders, just no `<Link>` wrapper). Mall subtitle stays tappable independently.
- **D19.** When `mapLink` is null, mall subtitle renders as plain text (not anchor). Defensive parity with existing implementation.
- **D20.** Map snapshot `onError` handler hides `<img>` tag when Mapbox rejects (e.g. preview deployments per session-156 token URL allowlist 15-session carry). Link wrapper stays so tap target routes regardless.

### Page-level

- **D21.** Page bg unchanged: `v2.surface.warm` (#FBF6EA) per session 169 round 3 (separate from v2.bg.main #E6DECF tabs default).
- **D22.** Title + Price block unchanged (centered Lora 32 + Inter ~22/700 green). Not in scope; not a concern from David's 4 items.
- **D23.** Below DestinationHero: page ends. No carousel (D2 retire), no BoothCloser (that's /shelf only), no footer disclaimer changes.

---

## Component contract — `components/DestinationHero.tsx`

```ts
export interface DestinationHeroProps {
  /** Mall display name (e.g., "America's Antique Mall") */
  mallName: string | null;
  /** Optional city for the postal-shape subtitle */
  mallCity?: string | null;
  /** Optional state abbreviation */
  mallState?: string | null;
  /** Mall latitude — required for map snapshot to render */
  mallLat: number | null;
  /** Mall longitude — required for map snapshot to render */
  mallLng: number | null;
  /** Mall slug — required for /map?mall= route */
  mallSlug: string | null;
  /** Vendor display name (e.g., "Treasures & Trinkets") */
  vendorName: string | null;
  /** Vendor slug — required for /shelf/[slug] route on info strip tap */
  vendorSlug: string | null;
  /** Booth identifier (e.g., "14B"). Falsy = no booth badge rendered. */
  boothNumber: string | null;
  /** Apple Maps deep-link URL for the mall subtitle tap */
  mapLink: string | null;
}
```

Component handles its own defensive rendering per D17–D20. Consumer (`/find/[id]`) passes raw props from page state.

---

## Implementation arcs (sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing`)

### Arc 1 — `<DestinationHero>` primitive in isolation (1 commit)

- New file `components/DestinationHero.tsx` per component contract above.
- Use existing `mallSnapshotUrl` helper from `lib/mapStaticImage.ts` (session 169 round 2).
- Build clean in isolation; no consumer touches yet.
- tsc + npm run build green.

### Arc 2 — `<DestinationHero>` consumer wiring on /find/[id] (1 coupled commit)

Single coupled commit per `feedback_single_coupled_commit_when_must_move_together`. The three current parts (eyebrow row + mall/booth card + standalone map snapshot Link) must move together — replacing them piece-by-piece would create broken intermediate states.

- Replace inline cartographic structure (~180 LOC across the eyebrow + cardInner IIFE + map snapshot Link) with single `<DestinationHero>` call.
- All page-level state (`mallLat`, `mallLng`, `mallSlug`, `mallName`, etc.) already exists from session 169 round 2.
- Dead-code byproduct: any imports no longer needed at the top of the page file (e.g., `mallSnapshotUrl` direct import if it was used inline; PiStorefront usage if only consumed by the inline eyebrow).
- tsc + npm run build green.

### Arc 3 — Save migration + CTA pair retirement (1 coupled commit)

Single coupled commit because:
- Save action must NOT be broken at any intermediate state — the photo-corner bubble must wire BEFORE the CTA-pair button retires.
- Doing this as two commits would either leave dual save affordances (confusing) or break save entirely (regression) for one commit cycle.

- Add `<button>` PiLeaf save bubble in top-right corner of `.photo` slot per D4–D6.
- Wire `onClick={handleToggleSave}` (same handler as CTA pair button uses today).
- Toggle PiLeaf ↔ PiLeafFill via `weight` prop on FlagGlyph (session 160 NEW pattern — weight variant opt-in via prop).
- Retire CTA pair entirely (delete the entire `{/* Session 169 round 2 — CTA pair ... */}` block).
- Dead-code byproduct: Explore Booth's PiStorefront usage if only consumed by the CTA pair (verify via grep — also used by DestinationHero eyebrow now, so likely keep import).
- tsc + npm run build green.

### Arc 4 — "More from this booth" carousel retirement (1 commit)

- Delete the entire `<ShelfSection>` (or equivalent) carousel section.
- Dead-code byproduct: vendor-posts fetch if it was the only consumer; any state/imports for the carousel components.
- Verify nothing else in the page consumes the carousel's data fetches before deleting.
- tsc + npm run build green.
- Page composition lands at locked D1 final shape.

### Implementation order rationale

- Arc 1 isolated primitive ships first per testbed-first discipline (mirrors session 118's R17 Arc 1 + session 102's R16 Task 4 + session 138's v2 primitives — all primitive-in-isolation-before-consumer).
- Arc 2 swaps the inline structure for the primitive — one coupled commit because the cartographic block has three intertwined parts.
- Arc 3 ships the save migration with CTA pair retirement coupled — preserves save action continuity.
- Arc 4 ships the carousel retirement last — biggest single delete, isolated to its own commit for surgical revertability.

---

## Tier B headroom (deferred — doors left open without redesign)

- **B1.** Save bubble enhanced weight (~56×56 with stronger ring) if iPhone QA reveals "too quiet" as primary page CTA. David explicitly picked standard 44×44 over enhanced — revisit only on QA flag. Single-line dial.
- **B2.** Map height dial 16:9 → 2:1 if iPhone QA reveals top-heaviness on long-mall-name finds. Single CSS value change.
- **B3.** Inside-card eyebrow option (above map as strip with hairline) if outside floating reads weak. Single structural shift inside DestinationHero.
- **B4.** Card lift dial to elevated shadow (Frame B's `--shadow-hero` from V1 mockup) if "second hero" doesn't read after ship. Single shadow swap.
- **B5.** BoothCloser-style closer text below DestinationHero (e.g., "Tap the map to see this location, or tap the booth to browse more finds.") if iPhone QA reveals confusion about the 3 tap affordances. Tier B safety net for D15.
- **B6.** "Get Directions" explicit affordance separate from dotted-underline mall subtitle if Apple Maps deep-link not discoverable. Could be small icon button next to the subtitle.
- **B7.** `v2.shadow.*` token tier extraction — 3rd unique inline-shadow consumer trigger met after DestinationHero ships (carries from session 167 + 168). DestinationHero inline shadow becomes the canonical 3rd consumer; promote to token tier.

---

## Risk register

- **R1.** Top-heaviness on long-mall-name finds — 16:9 map (~211px) + potentially 2-line wrapping vendor name (mitigated by ellipsis per D9) could feel tall. Mitigation: Tier B2 dial to 2:1.
- **R2.** 3-tap-target ambiguity — users may not know map / subtitle / vendor+booth strip are different tap targets. Mitigation: visual differentiation (map has cartographic content; subtitle has dotted underline; vendor name is large + visually anchored). Tier B5 closer copy as fallback.
- **R3.** Map snapshot silent-fail on Vercel preview — session 156 carry; Mapbox token URL allowlist excludes *.vercel.app. Production-PWA is authoritative QA surface. Defensive fallback in D20 already in place.
- **R4.** Save bubble visual weight reduction vs prior full-width button — David explicitly accepted this trade-off (Q3 standard 44×44 pick prioritizes lattice consistency). Watch on iPhone QA; Tier B1 enhanced bubble as fallback.
- **R5.** Surface-locked design reversal of session 169 round 2 CTA pair — surfaced explicitly in Arc 3 commit body per `feedback_surface_locked_design_reversals`. NOT a silent regression: session 169 was solving "primary CTA + secondary booth nav" via button pair; this re-architecture solves it structurally via lattice-aligned corner bubble + tappable destination card.
- **R6.** Surface-locked design reversal of session 169 round 2 standalone map snapshot — map snapshot now lives INSIDE the destination card instead of as a sibling below. Same map asset + same tap target (/map?mall=); just restructured into the card. Surfaced in Arc 2 commit body.

---

## Memory firings expected during implementation

- `feedback_design_record_as_execution_spec` — 27th cumulative firing (load-bearing operating mode validated yet again if Arcs 1–4 ship without re-scoping).
- `feedback_smallest_to_largest_commit_sequencing` — 4 firings (one per arc).
- `feedback_single_coupled_commit_when_must_move_together` — Arc 2 (cartographic block 3-part replacement) + Arc 3 (save migration + CTA pair retirement). 2 firings.
- `feedback_surface_locked_design_reversals` — Arc 2 (map snapshot moved into card) + Arc 3 (CTA pair retirement). 2 firings.
- `feedback_dead_code_cleanup_as_byproduct` — Arc 2 (inline structure imports) + Arc 3 (PiStorefront verification) + Arc 4 (carousel state/fetches). 3 firings.
- `feedback_visibility_tools_first` — pre-Arc-3 grep for PiStorefront consumers (don't drop import if DestinationHero still uses it).
- `feedback_treehouse_no_coauthored_footer` — honored on all commits.
- `feedback_session_close_auto_merges_pr` — honored on close.

---

## Net change forecast

- **+1 new component** (`components/DestinationHero.tsx`, ~180 LOC).
- **−~250 LOC** on `app/find/[id]/page.tsx` (cartographic block ~180 + CTA pair ~80 + carousel section ~varies).
- **Net codebase change:** likely ~−70 to −150 LOC depending on carousel section size.
- **Page composition:** 7 vertical sections → 3 anchors.
- **Memory-backed disciplines composed:** 8 distinct rules firing across 4 arcs in one focused session.

---
status: Ready
session: 71
supersedes: docs/find-detail-cartographic-refinement-design.md (session 70 — partial: D8–D12 cartographic block on `/find/[id]`)
mockup: docs/mockups/booth-lockup-revision-v1.html (session 70 — frame "Variant C · all-malls scope" lines 757–771)
front-matter: design-record
---

# `/find/[id]` cartographic collapse — Variant C all-malls-scope pattern

## Context

Session 70 Record 2 lifted the mall block on `/find/[id]` into a parallel inkWash card matching the booth card. Result: a 2-anchor cartographic block (mall card on top tappable → `/mall/[slug]`; booth card below tappable → `/shelf/[vendorSlug]`; with the spine PinGlyph + hairline tick + XGlyph connecting them).

Session 71 standup surfaced two compounding facts:
1. `/mall/[slug]` is on v0.2 dark theme (Reseller Intel typography + lens-fighting darkening filter). David approved deferring its v1.x migration until seeding reveals real traffic.
2. The session-70 parallel mall card made `/find/[id]` → `/mall/[slug]` a hero-level affordance — turning a low-traffic page into a destination on the warm-→-dark cliff.

David's redirect: collapse the two-card pattern into ONE card carrying vendor + mall · city/state + booth lockup. Drop the parallel mall card (and with it, the link to `/mall/[slug]` from this surface). This closes the warm-→-dark cliff at the source rather than fixing the destination.

## Decisions (D1–D6 frozen)

### D1 — Collapse two cards → one
The cartographic block carries a single inkWash card. Vendor name (IM Fell 18px) on left; mall · city/state subtitle (sans 11.5px, color `inkMuted`) below the vendor name; "BOOTH" eyebrow + IM Fell 26px numeral on right (Variant B lockup, unchanged from session 70).

**Why:** the parallel two-card pattern from session 70 turned `/find/[id]` → `/mall/[slug]` into a hero-level affordance, but `/mall/[slug]` is still on v0.2 dark theme. Collapsing the cards closes the warm-→-dark cliff at the source.

**How to apply:** structural pattern is the "Variant C · all-malls scope" frame from session-70 mockup (lines 757–771), applied to `/find/[id]`. Note: keeping IM Fell numeral (Variant B), not Variant C's sans numeral — the lockup family stays consistent across `/flagged`, Booths, and Find Detail.

### D2 — Card link target = `/shelf/[vendorSlug]`
The merged card is tappable to `/shelf/[vendorSlug]` when `vendorSlug` exists. The link to `/mall/[slug]` from this surface is **retired**.

**Why:** booth is the proximate destination from a flagged find (shopper context: "I want to go see this in person"). Mall is upstream context. Plus, `/mall/[slug]` is on v0.2 — sending shoppers there now would degrade the experience.

**How to apply:** the entire inkWash card div is wrapped in `<Link href={`/shelf/${vendorSlug}`}>`. `/vendor/[slug]` retains its own `/mall/[slug]` link until that page's own redesign (out of scope here).

### D3 — Drop "Visit the booth →" inline text
The session-70 Treatment C inline visit-link below the vendor name is **retired**.

**Why:** with the merged card already tappable to the booth, the inline text is redundant. The whole-card-as-link affordance from session 70 is unchanged; just the text label goes away.

**How to apply:** delete the `vendorSlug && (...)` block that renders "Visit the booth →" inside the vendor-name column.

### D4 — Mall · city/state subtitle is a tappable Apple Maps link
The subtitle line "Antique World · Lexington, KY" is itself a tappable link with `href = mapLink` (already computed; falls back to `name + city + state` when `address` is null) + `target="_blank"` + `e.stopPropagation()` (so the inner link doesn't trigger the wrapping shelf link).

**Why:** preserves shopper utility (in-app directions) without the visual weight of a separate address line. `mapLink`'s existing fallback logic means precise destinations still work even when address-string is missing.

**How to apply:** wrap the subtitle in an `<a href={mapLink}>` when `mapLink` is available; render as plain `<span>` otherwise. Style: dotted-underline on the city/state portion only would be visually noisy, so the entire subtitle gets the dotted-underline treatment with `textDecorationColor: v1.inkFaint`.

### D5 — Cartographic spine simplified to XGlyph only
The 28px spine column retires PinGlyph + the hairline tick. Only XGlyph remains, anchored to the single card.

**Why:** PinGlyph + tick + XGlyph was a 2-anchor visual ("pin at mall, X at booth, path between"). With one card, 2-anchor logic dissolves. Retaining just XGlyph preserves the cartographic identity that was load-bearing in session 70's hybrid call (cartographic on `/find/[id]`, retired on `/flagged`) while honestly representing the new single-anchor structure.

**How to apply:** in the cartographic block at [`app/find/[id]/page.tsx:986`](app/find/[id]/page.tsx), the spine column drops the `mallName && <PinGlyph>` block and the connecting hairline tick. XGlyph stays, anchored to the vendor row of the card.

**Alt considered + rejected:** retire spine entirely. Rejected because session 70 D8–D11 deliberately preserved the cartographic identity on `/find/[id]` as a hybrid call, and dropping the spine on the same surface one session later would feel reactive. If David's iPhone QA reads the single-XGlyph-with-no-spine-line as orphaned (tick was the connector to context above), the cheap fallback is to either (a) restore PinGlyph + tick anchored to the post-it eyebrow above the photo, or (b) retire the spine entirely.

### D6 — Keep IM Fell numeral (Variant B parity)
The "BOOTH" + numeral right column keeps IM Fell 26px numeral, not Variant C's sans numeral.

**Why:** the session-70 lockup family ships consistently across `/flagged` BoothSection, Booths VendorCard (sized to tile), and `/find/[id]`. Changing one surface to sans would break parity for no structural reason.

**How to apply:** unchanged from session 70 implementation. Right column structure preserved as-is.

## Surface × Treatment Matrix

| Surface | Vendor name | Mall subtitle | Booth lockup | Card link | Address line | Visit-link |
|---|---|---|---|---|---|---|
| **Before (session 70)** mall card | — | — | — | `/mall/[slug]` | yes (Apple Maps href) | n/a |
| **Before (session 70)** booth card | IM Fell 18px | — | Variant B (IM Fell numeral) | `/shelf/[vendorSlug]` | — | "Visit the booth →" |
| **After (session 71)** unified card | IM Fell 18px | sans 11.5px (Apple Maps href) | Variant B (IM Fell numeral) | `/shelf/[vendorSlug]` | merged into subtitle | retired |

## Files

- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — runtime change.
  - Drop the `mallName && (() => { ... })()` parallel mall-card block (lines ~1031–1115).
  - Modify the booth-card block (lines ~1117–1223): add mall · city/state subtitle as Apple Maps link inside the left column under the vendor name; remove "Visit the booth →" inline link.
  - Modify the spine column (lines ~1000–1028): drop PinGlyph + hairline tick rendering; XGlyph remains anchored to vendor row.
  - Add `mallCity` + `mallState` extracts alongside the existing `mallName` / `mallAddr` / `mallSlug` (line 681).
- [`docs/find-detail-cartographic-collapse-design.md`](docs/find-detail-cartographic-collapse-design.md) — this file.

## Out of scope

- `/mall/[slug]` redesign — explicitly deferred at session 71 standup.
- `/vendor/[slug]` `/mall/[slug]` link — not touched here. Until that page's own redesign, it remains the only entry to `/mall/[slug]`.
- `/flagged` BoothSection cards — already shipped session 70 with mall · city/state subtitle in all-malls scope. No change here.
- Booths VendorCard — out of scope (Variant B at 14/20px sized to tile, no mall subtitle).
- Cartographic glyph component changes — `XGlyph` itself is unchanged.

## Acceptance criteria

1. `/find/[id]` cartographic block renders ONE inkWash card (no parallel mall card above).
2. Card carries: vendor name (IM Fell 18px) → mall · city/state subtitle (sans 11.5px, dotted underline when Apple Maps link present) → booth lockup right column (Variant B IM Fell numeral, unchanged).
3. Tapping anywhere on the card except the subtitle → `/shelf/[vendorSlug]` (when vendorSlug exists).
4. Tapping the subtitle → opens Apple Maps with the precise destination (address when available, name+city+state fallback).
5. "Visit the booth →" inline text is gone.
6. Spine column shows only XGlyph anchored to the vendor row of the card. No PinGlyph, no hairline tick.
7. When `mallName` is null, the subtitle line is omitted entirely (card just shows vendor + booth).
8. When `vendorSlug` is null, the card is non-tappable (rare orphan case; matches session 70 fallback behavior).

## Carry notes / known limitations

- **Address line dropped from the visible UI.** Subtitle shows only "Mall name · City, State" — street address is no longer visible to the shopper. Directions still work via the Apple Maps link (which uses address under the hood when available). If shopper feedback during seeding reveals they want to see the street address before tapping for directions, the cheap fix is to add a smaller secondary line below the subtitle. Captured for seeding-walk QA.
- **`/mall/[slug]` reachability degraded.** Was reachable from `/find/[id]` and `/vendor/[slug]`. Now only reachable from `/vendor/[slug]`. Consistent with David's session 71 standup intent: "I didn't realize it actually linked anything."
- **Spine collapse from 2-anchor to 1-anchor.** If the single XGlyph-without-tick reads as orphaned at iPhone QA, two cheap fallbacks: (a) restore PinGlyph + tick anchored to the post-it eyebrow above the photo; (b) retire the spine entirely.

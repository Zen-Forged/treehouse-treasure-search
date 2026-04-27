---
status: Ready (E only — B+A parked pending iPhone QA)
session: 71
mockup: docs/mockups/image-standardization-v1.html
---

# Image standardization — E only (caption `min-height`)

## Context

David flagged that photos on Find Map carousel + `/my-shelf` window/shelf views appeared inconsistent in size — portrait vs square sources rendering "differently sized" tiles. Initial diagnosis (mockup-stage) proposed a three-change bundle:

- **E** — caption `min-height` so cards bottom-out at the same row regardless of title length / price presence.
- **B** — `object-position: center top` on every `<img>` so phone-portrait subjects (typically framed in upper half) survive crop.
- **A** — flip slot from `aspect-ratio: 4/5` (portrait) → `1/1` (square) so square-source photos crop less aggressively.

David's screenshot of `/flagged` (3 flagged finds, dog statue + lantern visible side-by-side) revealed the actual visible problem: **photos within tiles are uniform-height** (the `aspect-ratio: 4/5` slot enforces it correctly). What differs is **total card height** — caption length variance (1-line title vs 2-line title; price present vs not) makes cards bottom-out at different rows.

## Decision — ship E first; defer B + A pending QA

**E** directly addresses the root cause of the visible problem. **B + A** are quality improvements that change the surface aesthetic — worth doing only if E alone doesn't satisfy.

After shipping E:
- If iPhone QA reads as "fixed" → B + A are skipped (or revisited if real-content seeding surfaces a new symptom).
- If iPhone QA still catches "photos feel different sizes" → ship B + A as a follow-up commit using the existing mockup as the design record.

## Scope

Add `min-height` to the caption block on these four surfaces:

| Surface | File | Caption div line | Source aspect | Slot ratio |
|---|---|---|---|---|
| Find Map FindTile | [app/flagged/page.tsx:240](app/flagged/page.tsx) | `padding: "9px 10px 11px"` | mixed | 4/5 |
| my-shelf WindowTile | [components/BoothPage.tsx:716](components/BoothPage.tsx) | same | mixed | 4/5 |
| my-shelf ShelfTile | [components/BoothPage.tsx:866](components/BoothPage.tsx) | same | mixed | 4/5 |
| /find/[id] ShelfCard rail tile | [app/find/[id]/page.tsx:186](app/find/%5Bid%5D/page.tsx) | same | mixed | 3/4 |

## Math — picking the value

All four surfaces share the same caption shape:
- Padding 9 / 10 / 11 (vertical = 20px)
- Title: IM Fell 14px, `line-height: 1.2`, `WebkitLineClamp: 2` → max 33.6px
- Price (conditional): sans 12px, `line-height: 1.4`, `margin-top: 3` → 19.8px
- Max natural caption height (with `box-sizing: border-box`): 33.6 + 3 + 16.8 + 20 = **73.4px**

**Pick `minHeight: 76`** — comfortable round number, ~2.6px cushion above the natural max. Caption will be ≥ 76px in all four states (1-line / 2-line × no-price / price), eliminating card-height variance from caption length.

## Out of scope

- **B (`object-position: center top`)** — parked. Easy follow-up if portrait photos need head/upper-portion preservation.
- **A (slot 4/5 → 1/1 flip)** — parked. Bigger aesthetic change; defer until E's effect is judged.
- **Discovery feed masonry** — untouched (variable height is by design).
- **Find Detail full-bleed photo** — untouched (single-photo surface, no neighbor comparison).
- **Mall page MallPostCard** — untouched (deferred from session 71 standup).
- **AddFindTile + PlaceholderTile dashed cells** — these don't have captions (just placeholders); their existing 22px placeholder under the dashed cell already aligns with the natural single-line caption height. With min-height: 76 on real-tile captions, the dashed cells now lose that alignment in 3-up grids that mix dashed + real tiles. **Watch for at QA** — if it visibly drifts, bump the dashed cell's placeholder to 22 + (76 - natural-1-line-height) = ~57px.

## Acceptance criteria

1. On `/flagged` Find Map carousel: tiles in the same row align bottom-to-bottom regardless of caption length.
2. On `/my-shelf` window view (3-up grid): cards align top + bottom uniformly.
3. On `/my-shelf` shelf view (horizontal scroll): tiles all same height.
4. On `/find/[id]` related-finds rail: tiles same height.
5. No visible regression on tiles where the caption was already at max content (2-line title + price).
6. No regression in the dashed AddFindTile + PlaceholderTile heights — if drift surfaces, address as a fast follow.

## Carry forward (if E alone isn't enough)

If iPhone QA still surfaces the "photos feel different sizes" symptom after E lands, the existing mockup at [docs/mockups/image-standardization-v1.html](docs/mockups/image-standardization-v1.html) carries D1 (slot ratio flip 4/5 → 1/1) + D2 (object-position: center top) ready to ship as a follow-up commit.

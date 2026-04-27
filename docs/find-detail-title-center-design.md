---
status: Ready
session: 76
mockup: docs/mockups/find-detail-title-center-v1.html
---

# Find detail — title centered, price below

Track C of session 76. Item 2 of David's 6-item redirect bundle. Frozen
decisions D1–D5 below; mockup approved 2026-04-27.

## Why

The find-detail title block previously rendered as a single H1 with title +
em-dash + price inline, left-aligned. Two issues surfaced:

1. The em-dash separator was reading as a typographic flourish but obscuring
   the price as a discrete data point. Beta-vendor-readiness review wanted
   the price to land as its own signal, not as a tail to the title.
2. Left-aligned title against centered caption + centered cartographic card
   created a vertical jog in the page rhythm.

Centering the title and lifting the price to its own line resolves both.

## Frozen decisions

| ID | Decision | Choice |
|----|----------|--------|
| **D1** | Title alignment | Centered. |
| **D2** | Price placement | Separate line below the title. |
| **D3** | Price prefix | No leading em-dash. Just `$48`. |
| **D4** | Price typography | **Frame B** — IM Fell 32px regular, `priceInk` color. Twin to title weight; reads as poster (title commands, price tags). Frame C (22px italic subtitle) parked. |
| **D5** | Caption position | Unchanged. Centered IM Fell italic 19px below the title block, divider follows. |

## Implementation

[`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) — title block formerly a
single `<h1>` containing title + inline `<span>`-wrapped price now renders as:

- Outer `motion.div` gets `textAlign: "center"`
- `<h1>` carries title only (no inline price span)
- Price renders as a sibling `<div>` below the H1, font/size/letter-spacing/line-height
  matched to title for visual twinning, color `v1.priceInk`, `marginTop: 2`
- Both elements only render when `typeof price === "number" && price > 0`
  (no zero-render or null-render breaks the centered stack)

## Acceptance criteria

- [x] Title text-anchor → center on iPhone 13 viewport
- [x] Price renders on its own line below title, also centered
- [x] No leading `—` em-dash anywhere in the title-price block
- [x] Title remains 32px IM Fell regular, `inkPrimary`
- [x] Price 32px IM Fell regular, `priceInk` (matches existing token)
- [x] When price is null/0, only title renders (no empty price line)
- [x] Caption stays centered IM Fell italic 19px below — no change

## Carry-forwards

- **Frame C parked** — 22px IM Fell italic subtitle treatment. CSS-only
  pivot if real-content seeding reveals the 32px twin reads as too heavy.
- **Em-dash retirement** — the find-detail title was the last surface
  carrying inline em-dash separators. Future "title + secondary value"
  patterns should default to stacked, not inline. (Single firing — Tech Rule
  candidate on second firing.)

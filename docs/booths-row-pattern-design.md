---
status: Ready
session: 80
mockup: docs/mockups/wordmark-and-booths-tile-v2.html (Option C2 frame)
---

# Booths page — row pattern (Option C2)

Item 2 of David's session 80 redirect bundle. Frozen decisions D1–D9 below;
mockup C2 approved 2026-04-28.

## Why

The /shelves grid has shipped as photo-on-top + small lockup-below tiles in
a 2-column grid since session 49. Real-content seeding (still 22× bumped on
the queue) would have stress-tested the photo-led pattern, but David wants
to retire it before seeding lands. Three reasons surfaced in the V2 mockup
review:

1. **Density vs. discovery.** ~4 tiles visible per scroll on the 2-col grid.
   Switching to single-column rows surfaces ~7-8 booths per scroll — better
   for the "I'm looking for a specific vendor I met at the mall" use case
   that's the primary /shelves entry point. Photos still live on
   `/shelf/[slug]` for the visual-discovery moment.
2. **Mirror /flagged structurally.** The Find Map booth-section header is
   already a `[vendor name | BOOTH N]` lockup card with no photo. Carrying
   that vocabulary onto /shelves unifies the booth-list pattern across the
   two primary directory surfaces.
3. **Bookmark moves to the lockup row, not the photo corner.** Pairs with
   item 4's BoothHero relocation — bookmark on the directory row, bookmark
   on the booth's own photo, two consistent positions.

## Frozen decisions

| ID | Decision | Choice |
|----|----------|--------|
| **D1** | Layout pattern | Single-column row list. Each booth = one full-width row. Replaces 2-column photo-tile grid. |
| **D2** | Photo on row | None. Hero photo stays on `/shelf/[slug]` BoothHero only. |
| **D3** | Bio on row | Hidden. Vendor name only, single line. Predictable row height across all booths regardless of bio presence. |
| **D4** | Lockup composition | `[bookmark 22px col]` · `[vendor name 18px IM Fell, flex]` · `[admin chrome when applicable]` · `[BOOTH small-caps eyebrow + numeral 26px Times New Roman, auto right]`. Mirrors /flagged Find Map booth-section header sizing exactly. |
| **D5** | Lockup color | `v1.green` for both eyebrow and numeral. Matches Find Map booth-section header. (Wordmark went ink-black in item 5; lockup numerals stay green per David's "keep green" answer.) |
| **D6** | Bookmark position | Far-left of the row in a 22px-wide column. Bookmark icon (Lucide) directly — no bubble, no frosted background — since the row card itself provides the affordance container. Saved state fills with `v1.green`. |
| **D7** | Track D phase 5 source layoutId | RETIRED on /shelves source side. No photo means no source `<motion.div layoutId>`. `/shelf/[slug]` BoothHero still has the destination layoutId; framer-motion gracefully no-ops the morph when source is absent (per session 78 pattern when a source surface drops the shared element). |
| **D8** | Admin chrome (Pencil + Trash) | Inline icons inside the row, between vendor name and booth stack. ~18px Lucide icons in a small flex group. Trash only renders when `!vendor.user_id` (matches existing). The bookmark column on the left stays empty for admins (preserves session 67 D10: admin doesn't see bookmark on /shelves; can bookmark via /shelf/[slug] BoothHero now that item 4 moved it there). |
| **D9** | AddBoothTile (admin) | Becomes a row-shaped dashed card with inline `+` icon and "Add a booth" italic label. Same dashed-border visual vocabulary, full-width row instead of 1:1 square. Keeps file name `AddBoothTile.tsx` for callsite stability. |

## Implementation

### `app/shelves/page.tsx`

**`VendorCard` rewrite:** the function name is preserved (sole callsite stays
unchanged) but the rendered shape is now a row, not a photo+lockup tile.

```tsx
<motion.div initial={{...}} animate={{...}} whileTap={{ scale: 0.99 }}>
  <div onClick={handleCardTap} style={{
    background: v1.inkWash,
    border: `1px solid ${v1.inkHairline}`,
    borderRadius: 10,
    padding: "12px 14px 12px 12px",
    boxShadow: "0 1px 6px rgba(42,26,10,0.06)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  }}>
    {/* D6 — bookmark left column (22px). Empty spacer for admins (D8). */}
    {/* D4 — vendor name flex middle (18px IM Fell). */}
    {/* D8 — admin pencil + trash inline. */}
    {/* D4 — BOOTH stack auto right (small-caps + 26px TNR numeral, green). */}
  </div>
</motion.div>
```

**Grid → row list:** replace `gridTemplateColumns: "1fr 1fr"` with
`flexDirection: "column"` and `gap: 8` on every list container (the
`savedMallId` flat list AND each grouped-by-mall section).

**SkeletonCard:** rewritten as a single skeleton row stripe (full-width,
~52px tall, shimmer animation preserved).

### `components/AddBoothTile.tsx`

Visual rewrite to row shape: full-width dashed-border container (12px radius,
1px dashed `v1.inkFaint`), inline `+` icon + "Add a booth" italic IM Fell
label centered. No aspect-ratio. Matches the height of a typical VendorCard
row (~52px). Drop the body-slot 38px spacer (was for grid alignment with
adjacent tiles' lockup body — irrelevant in row layout).

### Track D phase 5 — what's preserved, what's retired

**Retired (source side):**
- `/shelves` VendorCard's `<motion.div layoutId={`booth-${vendor.id}`}>`
  on the photograph — no photo means no source motion.div.

**Preserved (destination side):**
- `/shelf/[slug]` BoothHero still receives `layoutId={`booth-${vendor.id}`}`
  via the existing prop. With no source, framer-motion has no element to
  morph FROM — the BoothHero photograph just renders normally on mount.
  This is the same graceful-no-op pattern session 78 demonstrated when
  admin /shelves taps routed to `/my-shelf?vendor=` instead of `/shelf/[slug]`.

**Net effect:** the photo-morph affordance from /shelves → /shelf/[slug] is
retired alongside the photo itself. No iPhone QA cliff to hit; no
namespace-collision risk.

### What's NOT changing

- **`/shelf/[slug]` and `/my-shelf` BoothHero** — still photo-led.
- **`/flagged` Find Map** — already row-shaped with booth-section card
  headers; this change makes /shelves match its vocabulary, not the other
  way around.
- **MallScopeHeader, FeaturedBanner, BottomNav, MallSheet** — all unchanged.
- **MallStatusPill** — still appears next to non-active mall section
  headers for admins.
- **Track D phase 5 destination** — preserved, will graceful-no-op when no
  source layoutId is present.

## Carry-forward

- **Real-content seeding becomes more important after this lands.** With
  photos retired from /shelves, the visual hook shifts entirely to
  `/shelf/[slug]`. Vendors with strong hero photos win bigger; vendors with
  weak/missing heroes lose less (since /shelves no longer surfaces the gap).
- **The /shelves discovery experience is now navigation-led, not browse-led.**
  Shoppers who don't know what they're looking for will likely default to
  Home (the masonry photo feed) over /shelves. /shelves becomes a
  "find a specific vendor" surface — useful, but not the discovery hook.
- **AddBoothInline retains its place on `/admin` Vendors tab** unchanged.
  The /shelves AddBoothTile (now a row) is the canonical add affordance
  for admins reaching it from the directory.

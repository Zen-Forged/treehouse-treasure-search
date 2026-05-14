# Style Guide on `/review-board` — Design Record

**Status:** 🟢 Ready (design-to-Ready, Shape B complete)
**Locked:** session 162 (2026-05-14)
**Implementation:** Shape C arc 2 — single session ship
**Companion artifacts:**
- V1 mockup: [`docs/mockups/style-guide-on-review-board-v1.html`](mockups/style-guide-on-review-board-v1.html)
- Source audit: [`docs/ui-tokenization-audit-2026-05.md`](ui-tokenization-audit-2026-05.md)
- Companion baselines: [`docs/type-scale-status.md`](type-scale-status.md) · [`docs/spacing-scale-status.md`](spacing-scale-status.md)

---

## Problem statement (David's articulation, session 162)

> "Review Board is good to get a visual check of how things are looking, however, I don't have confidence that the styles, formats, etc. are all actually being applied as I think they should be. For example, we have differing color values on some of the green buttons, to me, that should have been caught if they were all following the same style guide. The other thing is that in review board I can't easily say something like change this text formatting from one thing to the other because I have no source to reference. When I say things like make this text more bold or larger font size I'm picking based on a gut feeling which then may break the standardization. So I think it's both that compliment each other. If possible, it could all live on review board so I have a reference to keep it all in one place."

The style guide and the review board are **complementary, not separate**: the style guide IS the canonical reference; the review board IS the visual-state check. Without a shared vocabulary, feedback is gut-driven and risks breaking standardization. With the style guide rendered inside `/review-board`, feedback shifts from "make this bolder" to "use `type.size.lg`."

---

## Real insight surfaced — tier coexistence creates visible green drift

Three distinct "primary green" values coexist across tiers, all canonically named, all in active use:

| Token | Value | Tier | Used on |
|---|---|---|---|
| `v1.green` | `#1e4d2b` | v1 | `/find/[id]`, `/map`, `/post` flow |
| `v2.accent.green` | `#285C3C` | v2 | Home, Saved, `/shelf`, `/me`, `/welcome` |
| `colors.green` | `#1e4d2b` (= v1 via shared var) | v0.2 | `app/admin` only |

When a v1 surface and a v2 surface render side-by-side, the greens are visibly different (`#1e4d2b` vs `#285C3C`). This is the **load-bearing example** the style guide must surface — exact drift David flagged, fixable only by either (a) consumers picking the correct green for their tier or (b) eventually unifying the tiers.

The style guide does NOT resolve the drift — it makes it visible + explainable. Drift resolution happens in Shape C arc 3 (admin v0.2 → v2 migration) and beyond.

---

## Frozen decisions (D1–D15)

### D1 — Navigation model: Frame C (anchored sections above tiles)

Style Guide content sits at the **top** of `/review-board`, above the existing tile categories. Single scroll page; no tab state. Sticky anchor-pill nav lets you jump between sections without scroll-back-up.

Picked over Frame A (top tabs) and Frame B (sidebar) because:
- Cheapest to ship — preserves existing tile layout unchanged
- No nav-state to manage
- Sticky anchor pill provides section-switching ergonomics
- Tradeoff accepted: reference is "above" not "beside" during feedback writing — scroll-back-up cost paid each time the reviewer cross-references

### D2 — Anchor pill sections + order

Three buttons in order: `Foundations` · `Components` · `Surfaces ↓`

The `Surfaces ↓` button scrolls to the existing tile grid (preserves current chrome).

### D3 — Foundations section: 5 sub-sections, ordered by visual weight

1. **Color** (with green-drift call-out as load-bearing example)
2. **Type scale** (all 9 steps rendered against real sample copy)
3. **Space** (canonical 9 steps as visual rulers)
4. **Radius** (canonical 5 steps as visual swatches)
5. **Shadow** (8 v1.shadow.* tokens + explicit v2.shadow.* gap note)

Color leads because it's the highest-pain section per David's articulation. Type follows as the second-highest pain (feedback vocabulary). Space/radius/shadow are reference-only (less feedback-critical but complete the foundations picture).

### D4 — Components section: Layer 2 primitives gallery

15 primitives in arc 2 ship, grouped by family:

**Session 149 kickoff trio:**
- `<BottomSheet>` (1 consumer migrated: ShareSheet)
- `<ChannelGrid>` (1 consumer)
- `<SlimHeader>` (3 consumers — Booth / Mall / Find variants)

**3-tier engagement lattice (project-level memory `project_layered_engagement_share_hierarchy.md`):**
- `<ShareBubble>` (variant: frosted / v2; sessions 159 + 137)
- `<BookmarkBoothBubble>` (v2 arc 4)
- `<v2/StarFavoriteBubble>` — **dormant**; surfaced anyway with status badge to make the 3rd-consumer extraction trigger visible

**R17 location pair:**
- `<DistancePill>` (R17 arc 1; 2 consumers)
- `<LocationActions>` (R17 arc 1; 1 active consumer)

**Masthead slot trio:**
- `<MastheadProfileButton>`
- `<MastheadBackButton>`
- `<MastheadPaperAirplane>`

**Glyphs + forms:**
- `<FlagGlyph>` (Phosphor weight-variant primitive; showcase `weight` prop)
- `<FormField>`
- `<FormButton>`

Tier B Components (defer): `<EmptyState>`, `<PinGlyph>`, `<MapCarousel>`, `<ArrowBubble>`, `<PinCallout>`, `<MapControlPill>`, `<BoothHero>`, `<HomeFeedTile>`, `<PolaroidTile>`, `<SavedFindRow>`, `<SavedMallCardV2>`, `<SavedEmptyState>`.

### D5 — Token vocabulary mechanism: `<TokenCopyButton>` primitive

Click "copy" next to any token swatch → token name lands in clipboard → reviewer pastes into NotesPanel markdown feedback.

- Renders next to every token swatch in Foundations
- Renders next to every primitive name in Components
- Visual confirmation: button flips to "copied!" for 1500ms after click
- New Layer 2 primitive shipped as part of arc 2 (file: `app/review-board/TokenCopyButton.tsx`)
- Tokens used: `v2.bg.paper` bg + `v2.border.light` border + `v2.text.muted` text (default) → `v2.accent.green` text + `v2.green-soft` bg (active "copied!" state)
- Tooltip not required for v1; can extend in Tier B

### D6 — Sticky anchor pill behavior

- Pill stays at top of viewport during scroll (`position: sticky; top: 0`)
- Click pill button = smooth scroll to section (~250ms)
- Active state on pill reflects section currently in viewport (IntersectionObserver internally)
- New primitive: `app/review-board/StickyAnchorNav.tsx`

### D7 — Color section drift call-outs

Five color groupings rendered in this order:

1. **Greens** (load-bearing drift example) — v1.green / v2.accent.green / colors.green side-by-side swatches + button samples + usage guidance per cell
2. **Reds** — v1.red / v2.accent.red side-by-side (both `#8b2020` today — call out "matching across tiers; keep aligned during palette flips")
3. **Ambers** — v1.amber only (#7a5c1e); explicit "no v2 amber yet — gap when admin status pills migrate" note
4. **Cream / paper surfaces** — v1.paperCream / v1.postit / v2.bg.main / v2.surface.card / v2.surface.warm side-by-side
5. **Ink + text ramps** — v1 ink ramp (5 steps: primary/mid/muted/faint/hairline) + v2 text ramp (3 steps: primary/secondary/muted) side-by-side

Each swatch has a `<TokenCopyButton>` rendering the canonical token path (e.g., `v2.accent.green`).

### D8 — Type scale rendering

All 9 steps from `type.size.*` rendered as:
- Sample text in **3 font families** (Cormorant 500 / Inter 400 / Inter 600) side-by-side per step — reviewers see the actual rhythm in every font face
- Token name + px value in monospace label
- `<TokenCopyButton>` per row copying the canonical path (e.g., `type.size.lg`)

Sample copy is consistent: "Sample text in Treehouse rhythm" at each size. Same string repeated so the visual delta is purely scale-driven.

### D9 — Space + Radius rendering

**Space (9 steps):** rendered as horizontal rulers — each step shows a colored bar of the exact width with px label + token name + copy button.

**Radius (5 steps):** rendered as colored 80×80 squares with each radius value applied — visual proof of the corner curvature at each step + token name + copy button.

### D10 — Shadow rendering

All 8 `v1.shadow.*` tokens rendered against a sample "cream card on paper bg" element so the shadow is visible against backing color:
- `polaroid` / `polaroidPin` / `ctaGreen` / `ctaGreenCompact` / `sheetRise` / `cardSubtle` / `postcard` / `callout`

Each card shows: token name + truncated CSS string value in monospace + `<TokenCopyButton>`.

**Section header includes a note** flagging the missing `v2.shadow.*` tier as Tier B headroom (G2 from audit doc; session 159's BottomNav inline polaroid shadow is the 2nd-consumer extraction trigger).

### D11 — Components section: live primitive rendering

Each of the 15 primitives renders inside a card with:
- **Live React fixture** at the primitive's actual rendered size (not a screenshot — uses the real component imports)
- **Primitive name** (`<BottomSheet>` etc.) + `<TokenCopyButton>` copying the import path
- **Top-level props summary** in monospace (2-3 most-relevant props per primitive)
- **Status badge** where relevant: "DORMANT — awaits Favorite Mall ★" for StarFavoriteBubble; "2 of 3 lattice tiers shipped" for engagement bubbles; etc.

Layout: 3-column grid on desktop; collapses to 1-col on narrow viewports.

### D12 — Surfaces section unchanged

The existing `/review-board` tile grid is preserved verbatim below the style guide. NotesPanel + ExportButton + the 16 tile iframes (Browse / Auth / Vendor / System) ship as-is. The anchor pill scrolls to the start of this section via `id="surfaces"` anchor.

### D13 — Reactivity

All style guide tokens read via live `lib/tokens.ts` imports + CSS variable resolution at runtime. Flipping a value in `:root` ripples through the rendered swatches instantly. The style guide IS a working demonstration that the token-flip-as-design-update primitive is operational — useful when investor-narrative-grade evidence is needed.

### D14 — Security posture

Same as existing `/review-board`:
- Route is unlinked (no nav points to it)
- `<Metadata>` declares `robots: { index: false, follow: false }`
- No auth gate (review-board is an open internal-only surface; same as existing)
- No reads or writes to real production data
- Style guide is internal; never indexed

### D15 — Anchor pill geometry

Tokens:
- `bg`: `v2.surface.card` (matches BottomNav surface)
- `border`: `1px solid v2.border.light`
- Default text: `v2.text.secondary`
- Active state bg: `v2.accent.green` + text `v2.bg.paper`
- Min-width per button: 110px
- Padding per button: `space.s8 space.s16`
- Pill border-radius: `radius.pill` (999)
- Container max-width: 800px, centered horizontally
- Sticky top offset: 0 (flush with viewport top during scroll)
- Z-index: 50 (above iframe tile chrome, below any modal layer)

---

## Component contracts

### `<TokenCopyButton>`

```ts
// app/review-board/TokenCopyButton.tsx
interface TokenCopyButtonProps {
  tokenName: string;        // e.g., "v2.accent.green" or "type.size.lg"
  label?: string;           // optional display label; defaults to tokenName
}
```

Behavior:
- Renders `<button>` with monospace `tokenName` text
- onClick: `navigator.clipboard.writeText(tokenName)`
- 1500ms after click: label flips to "copied!" then back to default
- Disables during the 1500ms feedback window so double-click is benign

Tokens:
- Bg default: `v2.surface.warm`
- Bg active: `v2.accent.greenSoft`
- Border: `1px solid v2.border.light`
- Text default: `v2.text.muted`
- Text active: `v2.accent.green`
- Font: `FONT_INTER` `type.size.xs` (11px)
- Padding: `2px 8px`
- Radius: `radius.pill`

### `<StickyAnchorNav>`

```ts
// app/review-board/StickyAnchorNav.tsx
interface StickyAnchorNavSection {
  id: string;               // DOM id of target section
  label: string;            // button label
}

interface StickyAnchorNavProps {
  sections: StickyAnchorNavSection[];
  scrollOffset?: number;    // optional offset for sticky-aware scroll; defaults to 80
}
```

Behavior:
- Renders horizontal pill with one button per section
- Button click: `document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })` with manual offset adjustment for sticky pill height
- IntersectionObserver watches each section ID; updates internal `activeId` state when ≥50% of a section enters viewport
- Active button gets the active visual treatment per D15

### `<StyleGuideFoundations>`

```ts
// app/review-board/StyleGuideFoundations.tsx
// No props — self-contained section.
```

Renders 5 sub-sections per D3 + D7 + D8 + D9 + D10. Pure composition over live token imports.

### `<StyleGuideComponents>`

```ts
// app/review-board/StyleGuideComponents.tsx
// No props — self-contained section.
```

Renders 15 primitive cards in a 3-column grid. Imports each primitive directly. Uses fixture data from `lib/fixtures.ts` for primitives that need real shape (e.g., MastheadProfileButton needs `authedInitials`).

---

## Tier B headroom (post-arc-2, explicit non-scope)

| ID | Item | Trigger to revisit |
|---|---|---|
| B1 | Patterns section (engagement lattice diagrams + sheet/modal stack overview + masthead slot system + BottomNav variants) | Once Foundations + Components validated; likely 1 focused session |
| B2 | Tokens-by-tier exhaustive inventory tables (auto-generated from `lib/tokens.ts` at build time) | Style guide content gets thin / consumers ask for full inventory |
| B3 | Remaining Layer 2 primitives in Components section (EmptyState, PinGlyph, MapCarousel, ArrowBubble, PinCallout, MapControlPill, BoothHero, HomeFeedTile, PolaroidTile, SavedFindRow, SavedMallCardV2, SavedEmptyState) | Incremental — add as each primitive matures or surfaces in feedback |
| B4 | Token deep-link URLs (Q3 option b) — anchor IDs per token + share-link buttons | If reviewers need to share specific token references via URL |
| B5 | Style-guide-aware lint integration ("this consumer uses `#abc123` — should this be `v2.accent.green`?") | After lint:colors baseline drops further; lint surface integration with the style guide |
| B6 | Per-token consumer-count display (live grep showing which surfaces use each token) | When tokens get retired/migrated and reviewers need to know impact |
| B7 | `v2.shadow.*` tier extraction (G2 from audit doc) | 3rd inline-shadow consumer surfaces; design pass on the v2 shadow palette |
| B8 | Search / filter UI for the token gallery | When token count crosses ~100 and discoverability degrades |
| B9 | Print / export mode for the style guide (PDF generation, share with non-engineers) | If style guide gets shared externally |
| B10 | Sticky-nav fallback for narrow viewports (collapse anchor pill to dropdown) | If iPhone-mobile review-board usage becomes load-bearing (currently desktop-first) |

---

## Implementation arc sequencing (arc 2 — 1 session)

Per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88.

| # | Commit | What |
|---|---|---|
| 1 | `<TokenCopyButton>` primitive in isolation | `app/review-board/TokenCopyButton.tsx` (~60 LOC). No consumer wiring. |
| 2 | `<StickyAnchorNav>` primitive in isolation | `app/review-board/StickyAnchorNav.tsx` (~110 LOC). No consumer wiring. |
| 3 | `<StyleGuideFoundations>` component | 5 sub-sections per D3+D7+D8+D9+D10; consumes `<TokenCopyButton>` + live token imports |
| 4 | `<StyleGuideComponents>` component | 15 primitive renders per D4+D11 |
| 5 | `app/review-board/page.tsx` adoption | Mounts `<StickyAnchorNav>` + `<StyleGuideFoundations>` + `<StyleGuideComponents>` ABOVE existing tile grid. Adds `id="surfaces"` anchor on existing categories container. Adds `id="foundations"` + `id="components"` on the new sections. Updates header paragraph to mention "Style Guide above; surfaces below." |

Each commit independently revertable. Build clean at every commit boundary per `feedback_design_record_as_execution_spec` ✅ Promoted (24th cumulative firing when arc 2 ships clean).

---

## Companion follow-on after arc 2

- Walk the live `/review-board` on iPhone PWA. Verify Frame C feels right; verify copy-button works; verify the green-drift call-out reads as designed.
- If clean, fold the style guide into investor-update next-trigger narrative (the system can be updated by changing tokens; reviewers have a shared vocabulary for feedback).
- Open Tier B B7 (v2.shadow.* tier extraction) since the Foundations Shadow section will surface the gap concretely.
- Schedule Shape C arc 3 (`app/admin/page.tsx` v0.2 → v1/v2 migration) — closes the biggest in-scope debt cluster and uses the style guide as the canonical reference for migration target values.

---

## References

- [`docs/mockups/style-guide-on-review-board-v1.html`](mockups/style-guide-on-review-board-v1.html) — V1 mockup, 3 frames
- [`docs/ui-tokenization-audit-2026-05.md`](ui-tokenization-audit-2026-05.md) — Shape A audit + Shape C arc 1 ship narrative
- [`docs/type-scale-status.md`](type-scale-status.md) — session 162 type scale baseline doc
- [`docs/spacing-scale-status.md`](spacing-scale-status.md) — session 144 spacing baseline doc
- [`lib/tokens.ts`](../lib/tokens.ts) — canonical token source
- [`app/globals.css`](../app/globals.css) — `:root` CSS variable definitions
- [`memory/project_layered_engagement_share_hierarchy.md`](../memory/project_layered_engagement_share_hierarchy.md) — 3-tier engagement + share lattice
- `memory/feedback_design_record_as_execution_spec.md` — load-bearing operating mode (23+ firings as of session 161)
- `MASTER_PROMPT.md` §Design Agent — "Commit design records in the same session" (session 56 rule)

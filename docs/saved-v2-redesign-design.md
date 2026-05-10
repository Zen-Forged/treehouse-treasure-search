# Saved v2 Redesign — Design Record

> **Status:** 🟢 Ready for implementation
> **Authored:** Session 138 (2026-05-09)
> **Surface:** `/flagged` route (the Saved page)
> **Arc:** Arc 1 of v2 visual migration — see [`v2-visual-migration.md`](./v2-visual-migration.md) for project-level migration plan
> **Mockup:** [`docs/mockups/saved-v2-redesign-v1.html`](./mockups/saved-v2-redesign-v1.html)
> **Replaces:** sessions 121 + 122 Saved page implementation; sessions 95 + 83 polaroid tile pattern on /flagged

---

## Scope

This is **Arc 1** of the project-level v2 visual migration. Saved page is the seed surface. Subsequent arcs migrate Home + Find + /shelf + Map. The migration plan is in [`v2-visual-migration.md`](./v2-visual-migration.md).

Arc 1 ships:
- v2 typography tokens (Cormorant Garamond + Inter loaded; FONT_LORA + FONT_SYS still alive in codebase but not consumed by Saved)
- v2 palette tokens (added alongside v1; consumed only by Saved primitives)
- New row pattern primitive (Saved-only consumer; abstracts to shared in Arc 2 if 2nd consumer surfaces)
- Per-booth accordion (Saved-only)
- ✓ Found Find-tier engagement affordance (lattice extension; localStorage-only persistence)
- ★ Favorite Mall (Mall-tier engagement-lattice completion; localStorage-only persistence)
- Frame δ structural shape — ★ top-right corner bubble + distance pill as eyebrow above GET DIRECTIONS

Arc 1 does **not** ship:
- Polaroid retirement on Home + Find + /shelf grid + ShelfTile + find/[id] carousel (Arc 2-4 work)
- Decorative leaf chrome (sub-Q-A deferred to v2 Arc 6 — universal page-background chrome)
- Wordmark v2 (sub-Q-B locked at "keep existing PNG")
- ✓ Found / ★ Favorite analytics (Tier B — see migration doc)
- ✓ Found / ★ Favorite DB persistence (Tier B — localStorage-only for now)

## Locked decisions — system-level (Q1-Q6 + Q5a + sub-Q)

Inherited from v2 migration doc lock table; restated here for design-record completeness:

| # | Decision |
|---|---|
| Q1 (a) | Cormorant Garamond replaces Lora project-wide |
| Q1.1 | Inter replaces FONT_SYS as canonical sans companion |
| Q2 (a) | New v2 palette replaces v1 paper-family entirely |
| Q3 (a) | Polaroid retires system-wide; row pattern is new shared primitive |
| Q4 (a) | Saved-only accordion; extract `<GroupedListSection>` only on 2nd consumer |
| Q5 | ✓ Found as new Find-tier engagement axis |
| Q5a (i) | ✓ Found localStorage-only persistence for now |
| Q6 (a) | ★ Favorite Mall ships in Arc 1 alongside visual rebrand |
| sub-A (b deferred) | Decorative leaf chrome out of Arc 1 scope; lands in v2 Arc 6 universally |
| sub-B (a) | Existing PNG wordmark stays; mockup-rendered Cormorant treatment was placeholder |

## Locked decisions — Saved-specific (D1-D6)

| # | Decision |
|---|---|
| D1 (a) | Mall card sort order: favorited-first, then distance-asc within each group |
| D2 (a) | All accordions expanded by default |
| D3 (refined) | Empty state: *"No finds collected yet — keep exploring"* with link to Explore page (`/`) |
| D4 (a) | Favorited malls float to top of list (regardless of distance) |
| D5 (a) | ★ persistence: localStorage-only for now (matches Q5a precedent for ✓ Found) |
| D6 (a) | No search/filter chrome on Saved (Saved is a planned-list, not a discovery surface) |

## Frame δ structural lock

Per V1 mockup pick + post-pick refinements:

```
┌─ mall-card ────────────────────────────────┐
│  Cormorant 28/600 mall name      [★ 42px] │  ← name + ★ row
│  Inter 13 mall address full width          │  ← address spans 2 cols
│                                            │
│       [paper-warm pill: 2.9 MI AWAY]       │  ← distance eyebrow centered
│                                            │
│  ┌────────────────────────────────────┐   │
│  │  GET DIRECTIONS    ↗               │   │  ← full-width green CTA
│  └────────────────────────────────────┘   │
│                                            │
│  ───── 🍃 6 finds waiting to be ───── ─    │  ← centered italic Cormorant
│            discovered                       │     w/ leaf glyph + dashed flankers
│                                            │
├─ booth-section ────────────────────────────┤
│  🏪 BOOTH 214 · Yesterday's Memories  ⌃   │  ← accordion header
│  ┌──────────────────────────────────────┐  │
│  │ ○  [photo]  Copper Kettle      🍃   │  │  ← find row
│  │            $28.00                    │  │
│  ├──────────────────────────────────────┤  │
│  │ ●  [photo]  Brass Vase         🍃   │  │  ← ✓ Found state demo
│  │            $35.00                    │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

Held constants from V1 mockup (do not relitigate):
- ★ top-right corner bubble (44×44, mirrors save-bubble pattern)
- Distance pill as eyebrow above GET DIRECTIONS (`2.9 MI AWAY` small-caps Inter 10px / 0.14em)
- Mall name + address span full card width (★ doesn't steal address horizontal)
- "X finds waiting to be discovered" centered italic Cormorant 13px with PiLeaf glyph + dashed-rule flankers — INSIDE the mall card, below GET DIRECTIONS, above accordion sections (replaces session-122 page header)
- GET DIRECTIONS = full-width green CTA inside mall card (preserves session-134 D9+D10 LocationActions Take Trip full-width pattern)
- Per-booth accordion sections — header (storefront icon + BOOTH N small-caps + booth-name italic Cormorant + chevron up/down) + find rows below
- Find rows: `[24px ✓ Found circle] [64px photo thumb] [name + price stack] [36px ♥ leaf bubble]` — 4-column grid; row height ~88px (64 + 12*2 padding)
- Find row meta = name (Cormorant 17px medium) + price (Inter 14px) ONLY — booth meta dropped (accordion header names the booth, redundant)
- Bottom nav: 3-tab shopper view (Explore / Saved with 9+ badge / Map) — vendor/admin gets 4-tab with rightmost role-tab per session-114 stable-tabs rule
- Wordmark = existing PNG asset unchanged (sub-Q-B (a))

## Component contracts

### `<SavedMallCardV2>`

Replaces session-121 `<SavedMallCard>` inline implementation in `app/(tabs)/flagged/page.tsx`.

**Props:**
```ts
interface SavedMallCardV2Props {
  mall: Mall;                   // includes mall.id, name, address, latitude, longitude, hero_image_url (unused in v2)
  distanceMi: number | null;    // null when geolocation unavailable; render fallback below
  isFavorite: boolean;
  onToggleFavorite: () => void;
  children: React.ReactNode;    // accordion sections
}
```

**Layout (Frame δ):**
- Padding: 18px 20px 14px (mall-card-head)
- `head-δ`: CSS grid `1fr 42px` columns × `auto auto` rows; column-gap 14px; row-gap 6px
  - Mall name: grid-column 1, grid-row 1 (Cormorant 28px / 600 / line-height 1.1 / v2.text.primary)
  - ★ bubble: grid-column 2, grid-row 1 (42×42 v2.surface.warm bg + v2.border.light border; v2.accent.green stroke; active state v2.accent.greenSoft bg + v2.accent.green border + filled star)
  - Address: grid-column 1 / span 2, grid-row 2 (Inter 13px / 1.4 / v2.text.secondary)
- Distance eyebrow row: padding 0 20px 8px; flex justify center; pill (v2.surface.warm bg + v2.border.light border + 14px radius + 4px×12px padding; Inter 10px / 600 / 0.14em letter-spacing / uppercase / v2.text.primary)
- Action row: padding 0 20px 12px; full-width green CTA button (v2.accent.green bg / white text / Inter 13/600/0.12em uppercase / 14px×16px padding / 8px radius + ↗ icon 14px right)
- Finds-waiting row: padding 0 20px 16px; flex center; PiLeaf glyph 13px + Cormorant italic 13px label + dashed-rule flankers (max-width 80px each side, v2.border.medium 1px dashed)

**Distance fallback** (when `distanceMi === null`):
- Pill renders text "DISTANCE UNAVAILABLE" — same styling, smaller letter-spacing 0.10em
- OR pill row collapses entirely (TBD during implementation; default to "ENABLE LOCATION" copy with tap-to-prompt behavior — reuses session-118 `useUserLocation` hook prompt path)

### `<AccordionBoothSection>`

Saved-only primitive (per Q4 (a)). Extracts to shared `<GroupedListSection>` only on 2nd consumer trigger.

**Props:**
```ts
interface AccordionBoothSectionProps {
  booth: { number: string; name: string; vendorSlug: string };
  defaultExpanded?: boolean;   // D2 lock: defaults to true
  children: React.ReactNode;   // SavedFindRow children
}
```

**Layout:**
- Border-top: 1px v2.border.light (separates from mall card head + sibling sections)
- Booth head: padding 14px 20px; flex row; gap 10px; v2.surface.card bg; cursor pointer
  - PiStorefront 22px v2.accent.green stroke (booth-storefront icon)
  - "BOOTH {number}" Inter 11px / 700 / 0.14em / uppercase / v2.accent.green
  - 3px dot v2.text.muted (separator)
  - Cormorant italic 17px / 500 / v2.text.primary booth name (1-line ellipsis on overflow)
  - Chevron 20px v2.text.muted (rotates 180° when expanded)
- Find list: when expanded, render children below booth head
- Toggle: `onClick` flips local `expanded` state; expanded state persists in component-local React state (no localStorage; D2 (a) defaults all expanded so persistence is moot — but if iPhone QA reveals users want to keep specific booths collapsed, layer in localStorage hook later)

### `<SavedFindRow>`

**Props:**
```ts
interface SavedFindRowProps {
  post: Post;                   // includes post.id, image_url, title, price (cents)
  isFound: boolean;
  isSaved: boolean;             // always true on /flagged context but threaded for explicit semantics
  onToggleFound: () => void;
  onToggleSaved: () => void;
  onTapDetail: () => void;      // navigate to /find/[post.id]
}
```

**Layout:**
- Padding 12px 20px; CSS grid `24px 64px 1fr 36px`; gap 12px; align-items center; border-top 1px v2.border.light
- ✓ Found circle (find-check): 22×22 circle; 11px border-radius; 1.5px solid border v2.border.medium when empty; v2.accent.green bg + v2.accent.green border when found; centered 10px white inner circle when found (filled-spot visual per David's "just a filled in spot works for now")
- Photo thumb (find-thumb): 64×64; 6px radius; v2.surface.warm bg fallback; v2.border.light border; image fills via background-size cover
- Find meta (find-meta): min-width 0; vertical stack
  - Find name: Cormorant 17px / 500 / v2.text.primary / line-height 1.2 / 1-line ellipsis / margin-bottom 2px
  - Price: Inter 14px / 500 / v2.text.primary
- Save leaf bubble (find-leaf): 36×36 circle; v2.surface.warm bg + v2.border.light border; PiLeaf 18px stroke v2.accent.green; FILLED v2.accent.green path when isSaved (always true on /flagged so always-filled state)
- Tap behavior: row body (excluding find-check + find-leaf) navigates to `/find/[post.id]`; find-check + find-leaf stop propagation

### `<StarFavoriteBubble>`

**Props:**
```ts
interface StarFavoriteBubbleProps {
  size?: number;                // default 42; size variant for future surface use
  isFavorite: boolean;
  onToggle: () => void;
}
```

**Layout:**
- Circle bubble: `size`×`size`; size/2 border-radius; v2.surface.warm bg + v2.border.light border; v2.accent.green stroke star (1.5px outline) when not favorited; v2.accent.greenSoft bg + v2.accent.green border + filled star when favorited
- Star icon: 22×22 (scales proportionally if size != 42); 5-pointed star (lucide-style)

### `<FoundCheckCircle>`

**Props:**
```ts
interface FoundCheckCircleProps {
  isFound: boolean;
  onToggle: () => void;
}
```

**Layout:**
- Circle: 22×22; 11px border-radius; 1.5px solid v2.border.medium when empty; v2.accent.green bg + v2.accent.green border when found
- Inner: when found, 10px white circle centered (filled-spot visual)
- Tap toggles `isFound` via `onToggle` callback

## Hooks

### `useShopperFavoriteMalls()`

New hook in `lib/useShopperFavoriteMalls.ts`. **localStorage-only** for v2 Arc 1 per D5 (a). Mirrors the shape of session-112 `useShopperSaves` for future DB-sync upgrade.

**API:**
```ts
type ShopperFavoriteMalls = {
  ids: Set<string>;             // mall.id values
  isReady: boolean;             // hydration complete
  toggleFavorite: (mallId: string) => void;
  isFavorite: (mallId: string) => boolean;
};

export function useShopperFavoriteMalls(): ShopperFavoriteMalls;
```

**Implementation:**
- localStorage key: `treehouse:shopper_favorite_malls` (JSON array of mall.id strings)
- useLayoutEffect sync read on mount (per `feedback_browser_api_in_useState_initializer_hydration.md`)
- Cross-instance sync via custom event `treehouse:favorite_malls_change` (mirrors session-110 `treehouse:saved_mall_change` pattern)
- Cross-tab sync via `storage` event listener
- Toggle: optimistic local update + broadcast custom event (no DB write since localStorage-only)
- Server-side rendering: returns `ids: new Set(), isReady: false` until hydration

**Future DB-sync upgrade path** (Tier B):
- Add `shopper_favorite_malls` table (composite PK: shopper_id + mall_id; favorited_at timestamp)
- Hybrid mode: guest → localStorage; authed + shopper row → DB; mirrors `useShopperSaves` 3-mode shape
- Migration: localStorage entries silently migrate to DB on first authed sign-in via the silent-claim mechanic from session 111

### `useShopperFindsFound()`

New hook in `lib/useShopperFindsFound.ts`. **localStorage-only** for v2 Arc 1 per Q5a (i). Mirrors `useShopperFavoriteMalls` shape.

**API:**
```ts
type ShopperFindsFound = {
  ids: Set<string>;             // post.id values
  isReady: boolean;
  toggleFound: (postId: string) => void;
  isFound: (postId: string) => boolean;
};

export function useShopperFindsFound(): ShopperFindsFound;
```

**Implementation:**
- localStorage key: `treehouse:shopper_finds_found` (JSON array of post.id strings)
- Same sync + cross-instance + cross-tab patterns as `useShopperFavoriteMalls`
- Custom event: `treehouse:finds_found_change`

## Mall card sort logic

Per D1 (a) + D4 (a):

```ts
function sortMallsForSavedView(
  malls: Mall[],
  favorites: Set<string>,
  distances: Map<string, number | null>,
  saveRecency: Map<string, number>,
): Mall[] {
  return [...malls].sort((a, b) => {
    // D4: Favorited float to top
    const aFav = favorites.has(a.id);
    const bFav = favorites.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;

    // D1: Within each group (favorited or not), sort by distance asc
    const aDist = distances.get(a.id);
    const bDist = distances.get(b.id);
    if (aDist !== null && bDist !== null) return aDist - bDist;
    if (aDist !== null) return -1;  // mall with distance ranks above mall without
    if (bDist !== null) return 1;

    // Fallback: save-recency desc when distance unavailable for both
    return (saveRecency.get(b.id) || 0) - (saveRecency.get(a.id) || 0);
  });
}
```

**Edge cases:**
- All malls favorited → effectively distance-asc (D1 secondary)
- Geolocation denied/unavailable → distances all null; fallback to save-recency desc within each favorited/not-favorited group
- Recently-saved mall that gets favorited → floats to top; loses recency tie-break advantage but gains favorite bucket

## Empty state

Per D3 refined:

```jsx
<div className="empty-state">
  <h2 className="empty-headline">No finds collected yet — keep exploring</h2>
  <Link href="/" className="empty-cta">Open Explore</Link>
</div>
```

**Layout:**
- Centered vertically + horizontally in available space
- Headline: Cormorant italic 17px / 400 / v2.text.secondary
- CTA: full-width green pill button (matches GET DIRECTIONS shape, narrower max-width 200px); navigates to `/`
- Padding above CTA: 20px

**Triggers:**
- `posts.length === 0` after hydration completes
- Distinct from "search hides all saves" pattern from session 120 — search is removed in v2 (D6 (a)), so the only empty-state trigger is true zero-saves

## Implementation arc sequencing

Per [`feedback_smallest_to_largest_commit_sequencing.md`](../memory/feedback_smallest_to_largest_commit_sequencing.md). All commits expected to be build-clean at boundary; iPhone QA on Vercel preview before close.

### Arc 1.1 — v2 token foundation (smallest)

- Add v2 palette tokens to `lib/tokens.ts` alongside v1 (additive layer; no v1 retire)
- Load Cormorant Garamond 400/500/600/700 + italic via next/font/google
- Load Inter 400/500/600/700 via next/font/google
- Add `FONT_CORMORANT` + `FONT_INTER` constants alongside existing `FONT_LORA` + `FONT_SYS`
- Update `app/layout.tsx` to inject font CSS variables in <body>
- Build clean; no consumer wiring; no visual change anywhere

### Arc 1.2 — New primitives in isolation

- `components/v2/SavedMallCardV2.tsx`
- `components/v2/AccordionBoothSection.tsx`
- `components/v2/SavedFindRow.tsx`
- `components/v2/StarFavoriteBubble.tsx`
- `components/v2/FoundCheckCircle.tsx`
- `components/v2/SavedEmptyState.tsx`
- `app/saved-v2-test/page.tsx` — smoke-test route per [`feedback_testbed_first_for_ai_unknowns.md`](../memory/feedback_testbed_first_for_ai_unknowns.md) (5th cumulative firing — pattern repeatable across both AI-vendored and pure-CRUD primitives)
- All Cormorant + v2 tokens; mocked data; no production consumers wired
- iPhone QA on Vercel preview against `/saved-v2-test`

### Arc 1.3 — Hooks

- `lib/useShopperFavoriteMalls.ts`
- `lib/useShopperFindsFound.ts`
- Both hybrid hooks following `useShopperSaves` shape (mode = localStorage-only for v2 Arc 1)
- Add to `/saved-v2-test` route to validate cross-instance sync via custom events
- Build clean

### Arc 1.4 — Wire `/flagged` to v2 primitives (largest)

- Replace inline `<SavedMallCard>` (session 121) with `<SavedMallCardV2>`
- Replace per-find polaroid rendering with `<AccordionBoothSection>` containing `<SavedFindRow>` instances
- Drop session-122 page header `{count} saved find{s} waiting to be found` (moves into mall card per Frame δ)
- Drop existing `useUserLocation` distance pill placement (session 121 D11) — moves into mall card eyebrow per Frame δ
- Drop existing PolaroidTile usage on `/flagged`
- Drop existing `<MastheadShareButton>` carry from session 121 (already retired in session 137; verify no reference)
- Wire `useShopperFavoriteMalls` for ★ state + toggle
- Wire `useShopperFindsFound` for ✓ state + toggle
- Implement `sortMallsForSavedView` ordering
- Wire empty state per D3
- Build clean; iPhone QA on Vercel preview against production-shape data
- Push + David QA + ship

### Deferred to v2 Arc 6

- Decorative leaf chrome universal (sub-Q-A pulled out of scope for Arc 1)

## Tier B explicit headroom

Saved-specific deferrals (project-level Tier B in [`v2-visual-migration.md`](./v2-visual-migration.md)):

| Item | Reason | Trigger |
|---|---|---|
| Per-booth accordion expanded/collapsed state persistence | D2 (a) defaults all expanded; persistence moot until users want bespoke state | iPhone QA reveals users want collapsed-state memory |
| Drag-to-reorder favorited malls | Out of scope; D4 (a) ships sort-by-favorite-then-distance | When favorited mall count exceeds ~5 + users want manual ordering |
| Distance pill "ENABLE LOCATION" tap-to-prompt copy | Implementation detail surfaced in `<SavedMallCardV2>` props doc | When iPhone QA shows distance-unavailable state |
| Per-find "Found at..." note (was-found-when-where memory) | Out of scope; ✓ Found is binary state in Arc 1 | Find-to-found formal session — could capture timestamp + optional note |
| Bulk action affordance (multi-select via long-press to enable) | Out of scope per Q5 framing (✓ Found is single-tap, not multi-select) | If bulk-share / bulk-unsave product surface emerges |
| Saved page subtitle / page-level header | Removed per mockup (session-122 header moved into mall card) | Only revisit if Saved page gets a "scoping" header (e.g., "Saved across X malls" summary) |
| Mall card hero photo | Mockup omits; Frame δ has no photo slot | If photo composition becomes part of mall card identity (would need design pass) |

## Reversal log — Saved-specific reversals

Per [`feedback_surface_locked_design_reversals.md`](../memory/feedback_surface_locked_design_reversals.md):

| Session | Decision retired | Replacement |
|---|---|---|
| 121 | `<SavedMallCard>` inline component on `/flagged` (Frame C full-width restack with photo retired) | `<SavedMallCardV2>` Frame δ (★ + name + ★, distance eyebrow, GET DIRECTIONS, finds-waiting, accordion sections) |
| 121 | DistancePill below address per saved mall card | Distance pill becomes eyebrow above GET DIRECTIONS per Frame δ |
| 121 | LocationActions (Get Directions) at mall-level footer of /flagged section | GET DIRECTIONS as full-width CTA inside mall card (matches session-134 D9+D10 Take Trip full-width pattern, just relocated) |
| 121 | D8 save leaf restoration on /flagged tiles (reversed session-99 retirement) | **Preserved** — leaf save bubble stays on each find row in v2 |
| 122 | Page-level "{count} saved find{s} waiting to be found" 17px italic ink-muted FONT_LORA above per-mall stack | Moves INSIDE mall card as "X finds waiting to be discovered" italic Cormorant 13px with PiLeaf glyph + dashed-rule flankers |
| 122 | FlagGlyph (PiLeaf) prefix on page header | Becomes part of "X finds waiting to be discovered" line inside each mall card |
| 122 | BottomNav Saved badge sources from `saves.ids.size` | **Preserved** — same source; badge unchanged in v2 |
| 122 | Polaroid tile pattern on /flagged FindTile | Replaced by `<SavedFindRow>` row pattern |
| 134 | LocationActions Browse half retired + Take Trip full-width across /find/[id] + /shelf/[slug] + /geolocation-test | **Preserved approach** — GET DIRECTIONS in v2 Saved is full-width single CTA, no Browse half |
| 137 | 3-tier engagement+share lattice (Mall ★ Favorite + Booth 🔖 Bookmark + Find ♥ Save × Share) | **Extended** — Find tier gains ✓ Found as second engagement axis; Mall tier ★ Favorite ships in this Arc |

## Validation checklist (pre-merge iPhone QA)

For Arc 1.4 push:

- [ ] Cold start: `/flagged` loads with mall cards in correct sort order (favorited first, distance asc)
- [ ] ★ tap on unfavorited mall: bubble fills + mall floats to top (sort re-runs); state persists across reload (localStorage)
- [ ] ★ tap on favorited mall: bubble empties + mall returns to distance-sorted position
- [ ] Distance eyebrow renders correctly when location granted ("X.X MI AWAY" pill)
- [ ] Distance eyebrow handles location-unavailable case (pill renders fallback or hides per implementation call)
- [ ] GET DIRECTIONS opens native maps app (existing `lib/mapsDeepLink.ts` from R17)
- [ ] Accordion: tap booth header collapses/expands the find rows below; chevron rotates
- [ ] All accordions expanded by default on mount (D2 (a))
- [ ] Find row tap (excluding ✓ + 🍃) navigates to `/find/[post.id]`
- [ ] ✓ tap fills the circle; state persists across reload (localStorage)
- [ ] ✓ tap on filled circle empties it
- [ ] 🍃 tap unsaves the find; row disappears; mall card "X finds waiting" count decrements; if mall reaches 0 saved finds, mall card disappears entirely (cascade behavior preserved from session 121)
- [ ] Empty state: with all saves removed, "No finds collected yet — keep exploring" + Explore CTA renders
- [ ] Empty state CTA navigates to `/`
- [ ] Cormorant Garamond renders (not falling back to system serif)
- [ ] Inter renders (not falling back to system sans)
- [ ] v2 palette tokens render (page bg #F7F3E8, cards #FFFCF5, etc.)
- [ ] Bottom nav: Saved badge count matches actual save count (uses `saves.ids.size` per session 122)
- [ ] Bottom nav: Saved tab active state renders Cormorant nav-label as Inter (per Q1.1)
- [ ] Decorative leaf chrome NOT present (sub-Q-A deferred to v2 Arc 6)
- [ ] Existing PNG wordmark renders unchanged (sub-Q-B (a))
- [ ] No regressions on Home / Find / Map / /shelf / /shelves / /admin (v1 surfaces untouched in Arc 1)

## Future v2 arcs reference back to this doc

When v2 Arc 2 (Home) starts, its design pass should reference:
- This Saved Arc 1 design record as the polaroid-retirement precedent
- The `<SavedFindRow>` primitive as the candidate for shared `<v2/Row>` extraction (per Q4 trigger)
- The v2 token consumption patterns established here

When v2 Arc 6 (decorative leaf chrome universal) starts, its design pass should reference:
- This Saved Arc 1 design record's sub-Q-A deferral
- The mockup's leaf SVG treatment as the visual reference
- The "designed to sit behind content without impacting elements on top" constraint per David's lock

## Memory file updates triggered by Arc 1 ship

Post-ship:
- Update [`project_layered_engagement_share_hierarchy.md`](../memory/project_layered_engagement_share_hierarchy.md) — extend lattice table with ✓ Found as second engagement axis on Find tier
- Create new project memory `project_v2_visual_system.md` — captures Cormorant + Inter + v2 palette + row pattern + accordion as canonical visual system; references this doc + the migration doc; becomes load-bearing project memory once v2 Arc 2 ships and 2+ surfaces are on v2

## Carry to session 139 (or implementation session)

Implementation arcs ready to execute against this design record. No design calls needed mid-implementation; if any surface, the design pass left axes open and we should pause + design + lock + resume per [`feedback_design_record_as_execution_spec.md`](../memory/feedback_design_record_as_execution_spec.md) discipline.

Recommended implementation cadence:
- Session 139: Arcs 1.1 + 1.2 + 1.3 (token foundation + primitives + hooks; smoke-test route validated)
- Session 140: Arc 1.4 (wire `/flagged` + iPhone QA + push + ship)
- Session 141+: v2 Arc 2 (Home migration) design pass

Aggressive cadence (single session): Arcs 1.1-1.4 in one focused session if David picks (a) at session 139 open. ~90-120 min based on session-136 precedent (10-commit Requests tab ship in ~90 min against locked design record).

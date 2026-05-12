# Home Chrome Restructure — Design Record

> Frozen design decisions. Session 154 (2026-05-12). Status: 🟢 Ready for implementation.
> Companion mockup: [`docs/mockups/home-chrome-restructure-v1.html`](mockups/home-chrome-restructure-v1.html) — V1 frame A picked then **REVERSED** post-pick (see D-Reversal-1 below); V2 mockup skipped per `feedback_v2_options_before_drafting`.

---

## Status

- ✅ **Audit complete** (session 154) — current state localized across RichPostcardMallCard / TreehouseMap / SearchBar / app/(tabs)/layout.tsx / app/page.tsx / app/(tabs)/map/page.tsx / app/(tabs)/flagged/page.tsx
- ✅ **Reference scan complete** (session 154) — FB Marketplace + Apple Maps + AllTrails + Yelp + Airbnb mall+map patterns surveyed
- ✅ **V1 mockup committed** (session 154) — 3 frames spanning card-expanded-shape axis + 3 floating-nav variants
- ✅ **Tension surfaced + direction reversed mid-session** — V1 Frame A "in-place embed" rejected post-pick; minimal text-strip pattern locked (D-Reversal-1)
- ✅ **15 frozen decisions** D1–D15 below
- 🟢 **Ready for implementation** — 4 arcs sequenced smallest→largest (~10-11 commits total)

---

## D-Reversal-1 — Session 120 R10 D-rules REVERSED

**Reversed:** Session 120 V3.1 locked "rich postcard mall card with photo + 22px name + address + dashed-divider pill" after 3 iPhone QA rounds. David's session-120 verdict: *"top of Home + top of Saved each read as one card-stock identity piece"* — rich card pattern picked.

**Reversal reasoning (session 154, David):**
1. *"The mall card on the homepage just takes up too much space."*
2. *"It also loses context once you start scrolling so there is no way to know where you're at unless you scroll to the top, not ideal."*
3. *"The reference to FB was that it's just text with the location and then a filter option to expand."*

The chunky postcard's vertical cost is real (estimated ~140-180px); the context-loss on scroll is structural (not state-trackable — solved only by a sticky/persistent surface). The pair of complaints resolves to the same fix: **retire the chunky card; adopt a thin persistent strip; map becomes an on-demand drawer**.

**Scope of reversal:** Home page only. Saved page (/flagged) keeps its session 121-122 R18 per-mall stack (Q2 locked at session 154 = b). Mall card photo + address retire from Home entirely (Tier B candidates: future "Mall Details" sheet if surfaced as missing).

Per `feedback_surface_locked_design_reversals` (~56th cumulative firing) — captured explicitly + carried in implementation commit bodies.

---

## Locked decisions

### D1 — Persistent location strip replaces chunky postcard mall card

A new **`<MallStrip>`** primitive becomes top-of-page chrome on Home. The chunky `<RichPostcardMallCard>` retires from Home entirely (still exists in components/ for /flagged usage if needed — audit during implementation to confirm Saved actually uses it or if Saved has its own inline implementation).

**Strip specs:**
- **Height**: 40px (between iOS standard 44px tap target and tighter 36px chip-row)
- **Width**: 100% of content column (max-width 430, edge-to-edge)
- **Position**: `position: fixed` below masthead, pinned to viewport throughout scroll (NOT sticky — fixed matches StickyMasthead's session-77 PWA-safe pattern)
- **Bg**: `v2.surface.warm` (#FBF6EA) — distinct from masthead's `v2.bg.main` (#F7F3EB), creates the 2-row chrome visual separation
- **Border**: 1px hairline bottom only (top edge butts against masthead bottom border)
- **Content layout**: flex row, padding `0 18px`, gap 10px, align-items center
- **Glyph**: `<PiLeaf>` (Phosphor leaf outline), 16px, color `v2.text.secondary` (#5C5246)
- **Mall name**: FONT_LORA 16px weight 500, color `v2.text.primary`, line-clamp 1 with measure-and-shrink to 13px MIN if name overflows (session 116 PostcardMallCard precedent; sub-rule `feedback_lora_lineheight_minimum_for_clamp` lineHeight 1.3+)
- **Chevron**: `<PiCaretDown>` (Phosphor), 14px, color `v2.text.secondary`, anchored right
- **Tap target**: full strip width

**All-Kentucky scope handling:** When scope is all-Kentucky (no specific mall picked), strip reads `🌿 All Kentucky locations` with same chevron. Tapping still opens the map drawer (which fits-bounds all active malls).

### D2 — Mall map drawer composed from existing primitives

New **`<MallMapDrawer>`** composing `<BottomSheet>` (Layer 2 primitive, session 149) + `<TreehouseMap>` (session 108) + migrated map-control pill from `app/(tabs)/map/page.tsx`.

**Drawer specs:**
- **Trigger**: tap anywhere on `<MallStrip>` opens drawer
- **Height**: 65% of viewport (450-540px on iPhone — fills below the masthead/strip, exposes content above via dimmed-overlay tap-to-dismiss)
- **Handle**: BottomSheet's existing handle pill (no override)
- **Header**: BottomSheet's TopBar slot — title "Active locations" FONT_LORA 16px weight 500 + ✕ close button right
- **Body**: TreehouseMap mounts with `selectedMallId` prop from current scope; map fills body width; ~380px tall after header
- **Map control pill** (migrated from /map): top-right INSIDE map at `top: 12, right: 12`. Behavior unchanged from /map:
  - Scope set → "Clear ✕" pill → tap sets `selectedMallId=null` (drawer stays open; map fits-bounds to all-Kentucky)
  - All-Kentucky → "List view ⋮" pill → tap opens `<MallSheet>` (existing primitive) for picker
- **Pin interaction**: tap pin → callout (PinCallout unchanged); tap callout commit → `setSelectedMallId(id)` + drawer closes + page scrolls to top + strip updates
- **Dismiss**: tap ✕ / swipe-down handle / tap dimmed area outside drawer

### D3 — Expand/collapse state tracking

Local React state inside `<HomeChrome>` page-level component:
```tsx
const [drawerOpen, setDrawerOpen] = useState(false);
```

**Rationale:** matches FB Marketplace's transient-modal feel; no URL param noise; resets on tab-switch out + back (clean exit). Map state (selectedMallId) lives in the shared `useSavedMallId` hook (session 109 cross-instance sync), NOT in local drawer state.

**NOT picked:** URL param (`?map=open`) preserves state on refresh + deep-linkable, but adds noise to URL bar + breaks back-button mental model (back closes drawer instead of leaving Home). SessionStorage persists within tab session, dies on tab close — same back-button issue.

### D4 — /map page disposition: redirect to /

`/map` route redirects to `/` via `next.config.js` rewrite/redirect. No scope-param preservation (per Q1=a lock). Direct links + bookmarks land on Home; user taps strip to expand map.

**File disposition:** `app/(tabs)/map/page.tsx` deletes entirely. MapContextualPill migrates into MallMapDrawer (its logic survives; standalone component retires).

### D5 — Search bar landing position: own row below strip

Search bar pulls out of `<RichPostcardMallCard>` (which itself retires from Home — D1) and becomes a **standalone row below the fixed strip**. Position:
- Strip is `position: fixed` at top (always visible)
- Page body starts below strip with padding-top reserving strip height (40px + masthead height)
- First content row in page body is the search bar (NOT sticky — scrolls away normally)
- Below search bar: feed grid

**Search bar shape (item 4):**
- Height 44px (item 4 ask: "rounded corners not pills shape")
- borderRadius 10 (matches session 153's v2.surface.input recessed-well canonical)
- Bg `v2.surface.input` (#F0EBE0)
- Border `1px solid v2.border.light`
- Padding 12px 16px
- Font: existing SearchBar internal (FONT_LORA 15px italic, etc.)
- Internal contract unchanged — debounce, caret, clear button, focus ring all move with the primitive
- Margin: 12px top, 16px L/R, 4px bottom

**Rationale:** "you're here, now find a thing" — strip says where; search says what. Place-first reading matches `project_treehouse_thesis_digital_to_physical_bridge` (memory file). Search is action not context — doesn't need to persist on scroll.

### D6 — Floating nav: Variant Z (compact center pill)

- Position `fixed, bottom: max(14px, env(safe-area-inset-bottom) + 14px), left: 50%, transform: translateX(-50%)`
- Border-radius 24
- Padding `9px 22px`
- Bg `rgba(247,243,235,0.92)` + `backdrop-filter: blur(12px)`
- Border `1px solid rgba(42,26,10,0.10)`
- Box-shadow `0 6px 18px rgba(0,0,0,0.08)`
- Display: flex, gap: 24, align-items: center
- Tabs unchanged from current BottomNav.tsx (icon + label, active-state green)

**Role-conditional 3rd tab handling:** pill width grows to fit 3rd tab when present. Center-aligned so growth is symmetric. Guests/shoppers see 2-tab pill (Explore + Saved); vendor sees 3-tab pill (+ Booth); admin sees 3-tab pill (+ Admin).

**Map tab retires** (D-Q1 lock): tab is removed from `tabs` array in BottomNav.tsx. Tab key `"map"` retires from `NavTab` type union (audit `/map` consumers — should be zero outside redirect).

### D7 — Layout chrome ownership: HomeChrome page-level component

Per audit Option A: **chrome moves from `app/(tabs)/layout.tsx` to a new `<HomeChrome>` component inside `app/page.tsx`** (or as a separate file `components/HomeChrome.tsx` imported by Home only).

**Layout-level chrome (post-restructure):**
- StickyMasthead (unchanged, session 154 -18px height already shipped)
- BottomNav (Variant Z floating)
- ShareSheet entry points (session 137)

**Page-level chrome (Home only):**
- MallStrip (fixed below masthead)
- MallMapDrawer (mounts in DOM, hidden until drawerOpen=true)
- Standalone SearchBar row
- Feed body

**Saved page (/flagged):** keeps current chrome — page-level FeaturedBanner + page header "{count} saved find{s} waiting to be found" + per-mall card stack (D-Q2 lock).

**`showPostcardCard` conditional in layout.tsx:** retires entirely. Layout no longer mounts any mall-card chrome. The slim `<PostcardMallCard>` on /map retires alongside /map page deletion.

### D8 — Page body padding adjustments

With masthead (85px shipped session 154 item 1) + strip (40px) = 125px of fixed chrome above page body. Plus floating nav reserves bottom space.

**Home page body specs:**
- padding-top: `calc(masthead-height + 40px)` — reserves space for masthead + strip
- padding-bottom: `max(110px, env(safe-area-inset-bottom) + 100px)` — unchanged from current (still reserves nav clearance)
- Floating nav doesn't consume flow (position: fixed) — body scrolls beneath it naturally

**Saved page (/flagged):** unaffected — no MallStrip, no padding-top change from current shape.

**/find/[id], /shelf/[slug], /me, /admin, etc.:** no MallStrip on these pages (only Home gets the strip). Body padding-top reverts to masthead-only.

### D9 — Mall photo + address retirement from Home

Mall photo (`hero_image_url`) and street address retire from Home entirely. Strip is text-only (D1) + leaf glyph.

**Carries:**
- `mall.hero_image_url` column stays in schema (used by RichPostcardMallCard on /flagged? — verify during implementation; if zero consumers post-implementation, retire in cleanup arc)
- Photo migration to a "Mall Details" sheet/page = **Tier B headroom** (deferred; future product ask)

### D10 — Strip expand affordance: full-strip tap + chevron visual hint

Whole strip is tappable (button element, no inner stopPropagation needed since no nested interactive children). Visual: `<PiCaretDown>` 14px right-anchored signals expandability. No text label like "Tap to view map" — minimal per Q-B=a lock.

**Active-state visual:** when drawer is open, chevron rotates 180° via CSS transform transition (200ms). Drawer-close (D2) collapses it back.

### D11 — Strip background: solid not translucent

`v2.surface.warm` (#FBF6EA) SOLID — not rgba/translucent. Per session-132 frosted-glass retire (predicate-accumulating-patches resolution) + session-146 v2 chrome translucent rgba retirement default. The strip needs to read as anchored chrome, not as a popup.

### D12 — Strip tap analytics event

New R3 client event: `home_strip_tapped` with payload `{ mall_slug | "all-kentucky" }`. Captures map-drawer engagement rate as a discoverable affordance signal.

Existing `mall_picked` event continues to fire on pin-commit inside drawer (existing /map page logic preserved post-migration).

### D13 — Implementation arc sequencing (4 arcs, ~10-11 commits, smallest→largest)

**Arc 1 — Primitives + smoke route** (~4 commits):
- 1.1 Add `home_strip_tapped` to ClientEventType union (+ /api/events whitelist if relevant per session 137 carry)
- 1.2 New `<MallStrip>` primitive in components/MallStrip.tsx — pure presentation, props `{mall, onTap, isOpen}` (isOpen drives chevron rotation)
- 1.3 New `<MallMapDrawer>` primitive in components/MallMapDrawer.tsx — composes BottomSheet + TreehouseMap + migrated MapControlPill logic
- 1.4 New `/home-chrome-test` smoke route — mounts MallStrip + MallMapDrawer in isolation with fixture data per `feedback_testbed_first_for_ai_unknowns` (5th cumulative)

**Arc 2 — Home page consumer wiring** (~3 commits):
- 2.1 New `<HomeChrome>` component in components/HomeChrome.tsx wrapping MallStrip + MallMapDrawer + standalone SearchBar row
- 2.2 Retire `<RichPostcardMallCard>` mount from `app/page.tsx`; mount `<HomeChrome>` instead. SearchBar wiring moves into HomeChrome (already extracted from RichPostcardMallCard at component level — audit confirms SearchBar is already a sibling not a child)
- 2.3 Update `app/page.tsx` body padding-top per D8

**Arc 3 — Layout + nav + /map disposition** (~3 commits):
- 3.1 BottomNav Variant Z rewrite (item 2) — bg rgba + backdrop-blur + 24px radius + compact pill + retire `"map"` from NavTab + remove Map tab definition
- 3.2 Retire `showPostcardCard` conditional + slim PostcardMallCard mount from `app/(tabs)/layout.tsx`
- 3.3 /map redirect via `next.config.js` + delete `app/(tabs)/map/page.tsx`

**Arc 4 — Cleanup** (~1-2 commits):
- 4.1 Retire `MapContextualPill` component from `app/(tabs)/map/page.tsx` (logic absorbed into MallMapDrawer in Arc 1.3) — file already deleted in 3.3
- 4.2 Audit `<RichPostcardMallCard>` consumers post-Arc 2 — if zero, full retirement + dead-code byproduct cleanup per `feedback_dead_code_cleanup_as_byproduct`

Build clean at every commit boundary per project canonical. Each commit independently revertable.

### D14 — Saved page parity question deferred

Per D-Q2 lock: Saved keeps its per-mall stack. **Open question for future session**: does Saved page get a thin location strip too? Currently the page header "{count} saved find{s} waiting to be found" carries place-context across the page (via per-mall section headers). If iPhone QA on Home's new strip reveals it's load-bearingly better than the section-header pattern, surface as Tier B.

### D15 — Mid-Home content-shift consideration

The fixed strip + floating nav remove the BottomNav's reserved-flow-space (session 121's BottomNav consumed flow). Net effect on Home: feed gets ~40px less viewport (strip steals it). On portrait iPhone with 4:5 photo polaroid tiles, this means ~1 fewer row visible above the fold.

**Acceptable trade per V1 framing.** If iPhone QA reveals the feed feels too cramped, the strip can dial to 36px height OR the masthead can dial further (session-154-item-1 already reduced 18px; further reduction would reverse the wordmark size lock from session 95).

---

## Component contracts

### `<MallStrip>` (NEW — components/MallStrip.tsx)

```ts
interface MallStripProps {
  mall: MallScope;          // matches existing MallScope type (Mall | "all-kentucky")
  isOpen: boolean;          // drives chevron rotation 0° / 180°
  onTap: () => void;        // opens drawer
}
```

- Pure presentation. No internal state. No data fetching.
- Renders `<button>` for accessibility + semantic tap.
- `mall === "all-kentucky"` → renders "All Kentucky locations" with leaf glyph.
- Specific mall → renders `mall.name` with leaf glyph + measure-and-shrink.

### `<MallMapDrawer>` (NEW — components/MallMapDrawer.tsx)

```ts
interface MallMapDrawerProps {
  open: boolean;
  onClose: () => void;
  malls: Mall[];
  selectedMallId: string | null;
  savedByMallId: Record<string, number>;
  onMallPick: (id: string) => void;   // commit scope + close
  onClear: () => void;                 // setSelectedMallId(null), drawer stays open
}
```

- Composes `<BottomSheet>` + `<TreehouseMap>` + internal MapControlPill.
- TreehouseMap mounted as child only when `open === true` (lazy mount via dynamic import to preserve current /map ssr:false behavior — session 108).
- Map fills BottomSheet's body slot; pill anchors `top: 12, right: 12` relative to map container.

### `<HomeChrome>` (NEW — components/HomeChrome.tsx)

Page-level wrapper composing MallStrip + MallMapDrawer + standalone SearchBar row. Consumed only by `app/page.tsx`. Holds local `drawerOpen` state + `useSavedMallId` hook for scope.

### `<MallStrip>` + `<MallMapDrawer>` Layer 2 promotion

Both NEW primitives are Layer 2 candidates (session 149 kickoff). On 2nd consumer (if Saved page ever adopts the strip per D14 deferred question), promote both to `components/ui/`.

---

## Tier B headroom (explicit doors-open)

- **Mall Details sheet/page** — photo + address retired from Home (D9); future asks like "show me what this mall looks like before I visit" surface a separate Mall Details bottom sheet (composes BottomSheet + photo + address + favorite-mall ★ from project_layered_engagement_share_hierarchy lattice). Not in scope this session.
- **Strip variant for Saved page** — D14 deferred until iPhone QA on Home validates the strip pattern.
- **Strip per-mall counts** — Q-B alt (c) "🌿 America's Antique Mall · 28 finds" deferred. Engagement-signal value real but adds count-fetching dep + visual density. Surface as Tier B if iPhone QA suggests strip reads too quiet without engagement signal.
- **Search-bar above strip variant** — Q-A alt order; if D5's "place-first" reading proves wrong in iPhone QA, search can flip above strip in a 1-commit dial.
- **Drawer 2nd tier — radius slider / distance filter** — FB Marketplace's literal drawer has a radius slider. Treehouse doesn't currently have a radius concept (all malls show by default). Tier B candidate if user testing surfaces "I only want malls within 30 min."
- **Drawer search-within-map** — Tier B for when both R10 + R16 features compose ("brass at malls within 30 min"). Currently search-by-tag is scoped to selected mall via `useSavedMallId`; drawer-internal search is post-MVP.

---

## Carry-forwards / open implementation questions

- **`mall.hero_image_url` consumer audit during Arc 4.2** — confirm whether any non-retired surface still reads it (e.g. /flagged uses `<RichPostcardMallCard>`? — V1 design audit suggests no, but verify via grep before retiring the column).
- **`<RichPostcardMallCard>` zero-consumer disposition** — if Arc 4.2 confirms zero consumers post-Home-retire, full file deletion (~300 lines retire). Per `feedback_dead_code_cleanup_as_byproduct` (~34th cumulative).
- **Direct deep-links to /map from external sources** — Q-007 share booth email templates may contain /map URLs (audit lib/email.ts at implementation time). If yes, either:
  - Update email templates to point at / instead of /map, OR
  - Keep /map as a 301 redirect (current D4 lock) which preserves existing email-link compatibility
- **/map page tombstone** — `app/(tabs)/map/page.tsx` retires; consider archiving the file's design-history comments to `docs/session-archive.md` or just trusting git history.

---

## Reference scan summary (session 154)

| Pattern | Card-vs-Map relationship | Why we picked vs picked-against |
|---|---|---|
| **FB Marketplace** (anchor) | Thin top text strip; tap → bottom drawer with map + radius slider | ✅ PICKED literal — minimal, persistent, click-to-expand, exactly the brief |
| **Apple Maps Places** | Tap pin → bottom drawer slides up | Pattern fit but Apple's is pin-triggered (we're scope-triggered via strip) — adapted |
| **AllTrails search** | Top pill → full-screen overlay | Considered Frame C in V1; rejected as too modal-heavy for the scope-pick use case |
| **Yelp** | Top chip → full-screen overlay map | Same as AllTrails; over-modal for scope-pick |
| **Airbnb** | Collapsed map header → inline expand | V1 Frame A approximation; rejected post-pick — too much chrome at top |

The minimal text-strip + drawer pattern (FB Marketplace literal) won on three axes: (1) minimal vertical real estate at top of page; (2) persistent context via fixed positioning; (3) map is on-demand not always-mounted (perf win — Mapbox doesn't initialize unless drawer opens).

---

## Memory rules fired this session (design pass)

- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted — Shape C (hybrid: ship dials 1+3 fast; design-pass coupled trio 2+4+5) picked by David
- `feedback_visibility_tools_first` — Explore-agent audit-first dispatch with 7-file/6-question structured query before any mockup
- `feedback_reference_first_when_concept_unclear` ✅ Promoted (~6th cumulative) — 5-pattern cross-domain scan (FB / Apple / AllTrails / Yelp / Airbnb)
- `feedback_mockup_options_span_structural_axes` — V1 spans 3 structural shapes on card-expanded-axis (not style variants within one shape)
- `feedback_v2_options_before_drafting` ✅ Promoted — V2 skipped (fill axes prose-resolvable post-Frame-A-reversal)
- `feedback_user_clarification_restate_interpretation` (~57th cumulative) — David's "FB reference is just text" tension restated explicitly before reversal
- `feedback_surface_locked_design_reversals` (~56th cumulative firing) — V1 Frame A reversed mid-pass; session 120 R10 V3.1 reversed; both captured in D-Reversal-1 with David's verbatim quotes
- `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted — corollary firing: state-tracking choice (D3 in V1) doesn't solve context-loss-on-scroll; layout-layer persistence (fixed strip) is the right lever
- `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted — Arc 1-4 sequenced 11 commits smallest→largest with build clean at every boundary
- `feedback_design_record_as_execution_spec` ✅ Promoted (~22nd cumulative) — this record locks 15 decisions + 4 component contracts + arc sequencing for execution session 155
- `feedback_commit_design_records_in_same_session` — design record + V1 mockup + V2 mockup (skipped) commit together at session-154 close

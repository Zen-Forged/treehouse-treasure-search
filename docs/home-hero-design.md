# Home Hero — design record

> **Status:** 🟢 Ready for implementation · V2 sticky-header amendment applied
> **Picked frame:** Frame C (search bar inside hero · padding below before mall picker)
> **Picked sticky shape:** Shape A (single hero, `position: sticky; top: negative`) — per V2 amendment
> **Mockup V1:** [`docs/mockups/home-hero-v1.html`](mockups/home-hero-v1.html) — frame axis
> **Mockup V2:** [`docs/mockups/home-hero-v2.html`](mockups/home-hero-v2.html) — sticky-header behavior axis
> **Asset:** [`/public/home-hero.png`](../public/home-hero.png) (1536×1024, 867KB post-optimization — wordmark baked in)
> **Last updated:** session 164 (2026-05-14) — V2 amendment

---

## Reversal log (sticky chrome retirement, surfaced explicitly per `feedback_surface_locked_design_reversals` ✅ Promoted)

This redesign reverses three frozen decisions from the (tabs)/ chrome lineage:

| Old decision | Old session | New decision | Reason |
|---|---|---|---|
| Sticky chrome stack (StickyMasthead 84 + SearchBar wrap 56 + MallStrip 36 = 176px) pins to top of every (tabs)/ surface during scroll | Sessions 154+155+157 (Home chrome restructure) | Hero + SearchBar + MallPickerChip all scroll away with the feed; only BottomNav remains sticky | Frame C decision — hero is a top-of-feed identity beat, not persistent chrome |
| `<TreehouseFindsWordmark>` rendered in React via StickyMasthead at fixed height across all (tabs)/ surfaces | Sessions 87+88+95+96 (wordmark-as-image evolution) | Wordmark baked into `/public/home-hero.png` asset; React wordmark retires from (tabs)/ surfaces | Q2 (a) — single asset swap workflow over independent React+image updates |
| MallStrip primitive as sticky chrome at 36px height with small-caps "FROM" eyebrow + Cormorant 18px name | Session 157 (height trim 40→36) + sessions prior | MallPickerChip primitive — single inline row, PinIcon + Cormorant 22px name + chev, no eyebrow, no sticky | Frame C visual hierarchy — mall as identity-level serif anchored to hero composition |

Preserved (no reversal):
- MallSheet picker UX itself (tap chip → opens existing MallSheet primitive) — backend unchanged, only the trigger relocates
- StickyMasthead primitive itself + consumers OUTSIDE (tabs)/ (e.g., /find/[id], /shelf/[slug], /my-shelf, /me, /login) — all preserved verbatim
- SearchBar primitive (`components/SearchBar.tsx`) — relocates from sticky chrome to embedded inside HomeHero; props/behavior unchanged
- BottomNav (2-tab pill, session 159) — sticky behavior preserved verbatim

---

## V2 amendment — sticky-header behavior (within-session reversal of D5)

Per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 — within-session reversals follow the same surfacing rule as cross-session reversals. After Arc 1 shipped at this session (commits `bb177e5` design + `248fbf9` asset + `398808c` primitive + `b652a84` smoke route), David's iPhone QA + reflection surfaced two refinements:

1. **Search bar drops 20px** — `bottom: 52 → 32`. Pure dial.
2. **Hero should NOT scroll away entirely** — instead collapse to a thin sticky header (~90px) that keeps the search bar visible at top while user scrolls the feed.

V2 mockup `docs/mockups/home-hero-v2.html` spanned 3 implementation shapes (A sticky-negative-top / B two-stacked-elements / C scroll-driven-collapse). David picked **Shape A**.

### Reversal entry

| Old decision | Session | New decision | Reason |
|---|---|---|---|
| D5 — Hero + chrome scroll away with feed; only BottomNav remains sticky | Session 164 V1 | Hero pins to top via `position: sticky; top: calc(STICKY_THIN_HEIGHT - 33vh)` once scrolled past the offset; only the bottom 90px stays visible as a thin sticky header containing the search bar | David's iPhone QA call: *"allow a bit of scroll and then the background sticks with search bar so it's still a header but thinner not the full hero"* |
| D7 — SearchBar position `bottom: 52` | Session 164 V1 | SearchBar position `bottom: 32` (drop 20px) | David's iPhone QA dial |

### New decisions added

### D16 — Sticky-header behavior (Shape A from V2)
HomeHero uses `position: sticky; top: calc(STICKY_THIN_HEIGHT - 33vh); z-index: 10`. As user scrolls, hero rises with feed content until its top edge would reach the negative offset, then it pins. Only the bottom `STICKY_THIN_HEIGHT` (90px) stays visible at top of viewport — natural image continuity since it's the same DOM node + same image scrolled into its sticky position. Wordmark portion of the image scrolls out the top naturally. **Why:** Shape A from V2 — simplest implementation (one element, CSS-only, no JS), natural image continuity, asset's bottom wood-tone qualifies as "visually quiet" for search bar readability constraint.

### D17 — `STICKY_THIN_HEIGHT` constant = 90px
Module-scope constant in `HomeHero.tsx` controlling the visible-strip height when sticky pins. Search bar (46px height, `bottom: 32`) ends up at strip-y ~12-58 in the 90px strip — top-biased with 32px breath below. **Why:** 90px gives the search bar a generous-feeling top chrome while staying visually distinct from the full 33vh hero; dial axis for iPhone QA if 90px reads too tall (→ 72px) or too short (→ 110px).

### D18 — z-index discipline
HomeHero gets `z-index: 10` so the sticky strip stays above scrolling feed content. Tile grid + MallPickerChip render without explicit z-index (auto-stack below the sticky). MallPickerChip's pop-up MallSheet sheet primitive (which uses portal-rendered overlay) is unaffected. **Why:** prevent visual bleed-through during scroll.

### D19 — Asset constraint clarified
Hero asset's bottom ~30% (which becomes the persistent sticky strip after scroll) should be visually quiet. The attached asset's bottom wood-tone passes this constraint. **Why:** sticky strip contains the search bar; busy photographic content underneath the search would reduce input readability.

### Implications

- Arc 1 status: ✅ shipped (4 commits) at the original D5 (scroll-away). The V2 amendment introduces a new Arc 1 dial commit (search-bottom 52→32 + sticky-positioning).
- Arc 3 status: the `(tabs)/layout.tsx` adoption now needs to position HomeHero as a direct sticky child of the layout (not nested inside an overflow-constrained ancestor). Verified clean against Next.js App Router default body styling.
- Tier B7 (was "v2.shadow.* extraction" placeholder) → reassigned: **B7 = Shape C scroll-driven smooth collapse** if Shape A's sudden snap-to-sticky feels janky. Deferred unless iPhone QA flags.

---

## Frozen decisions

### D1 — Surface scope
Hero applies to all 3 `(tabs)/` surfaces: Home (`/`), Saved (`/flagged`), Map (`/map`). Same asset on all three. Mounts in `app/(tabs)/layout.tsx` (shared chrome). **Why:** consistent identity beat across browse/save/explore surfaces; one swap point.

### D2 — Wordmark baked into asset
The hero asset carries the wordmark (`treehouse` + `FINDS` + leaf glyph). No React `<TreehouseFindsWordmark>` layer over it. **Why:** simpler swap workflow (drop one file in `/public` + redeploy = full visual refresh); David explicitly picked Q2 (a).

### D3 — Hero height: 33vh viewport-relative
Hero block is `height: 33vh`. On iPhone 14 Pro (844px viewport) = ~278px; on iPhone SE (667px) = ~220px. **Why:** viewport-relative scales with device per Q3 (b); 33vh revised down from 40vh per David's "still too tall" dial. **Sub-decision:** if iPhone QA on real device reveals 33vh too short for the wordmark to read clearly, dial up to 36-38vh; if still too tall, dial down to 30vh.

### D4 — Asset path + swap mechanism
`/public/home-hero.png` (canonical filename). Code-side swap = drop new file with same name + redeploy. No admin UI in V1. **Why:** Shape A locked at session-open per cost-shape triage; admin-toggleable is Tier B headroom (B1).

### D5 — Scroll behavior
Hero + SearchBar + MallPickerChip ALL scroll away with the feed content. Only BottomNav remains sticky at the bottom. **Why:** Q5 (a) — hero is a top-of-feed identity beat, not persistent chrome. Tile grid claims full viewport once user scrolls past hero.

### D6 — Frame pick: C (search bar INSIDE hero)
SearchBar lives fully inside the hero block, anchored to the bottom edge with internal padding. Compared to Frame A (search overlaps hero/cream boundary) and Frame B (search flush below hero on cream), Frame C reads as the most integrated composition — search reads as part of the hero identity, not chrome below it. **Why:** David's verbatim pick; matches screenshot reference literally.

### D7 — SearchBar position inside hero: 52px from hero bottom
SearchBar (56px height) bottom edge sits 52px above the hero's bottom edge. So search top edge at `hero_height - 52 - 56 = hero_height - 108` (e.g., 170px on 278px hero). 52px breathing room below search creates visual settle before hero transitions to cream content zone. **Why:** David's "set a bit higher" dial moved from 36px → 52px.

### D8 — SearchBar appearance
Reuses existing `<SearchBar>` primitive (`components/SearchBar.tsx`). Bg `#FFFCF5` (v2.surface.input post session 157 alignment), 1px border `rgba(224,216,194,0.9)`, soft drop shadow `0 4px 12px rgba(42,26,10,0.08)`. **Why:** existing primitive's contrast story (light-cream bar over photographic content) already validated; reusing avoids primitive drift.

### D9 — Hero bottom cream-fade overlay
CSS gradient overlay on the hero container:
```
linear-gradient(180deg,
  rgba(247,243,235,0) 0%,
  rgba(247,243,235,0) 78%,
  rgba(247,243,235,0.30) 90%,
  rgba(247,243,235,0.78) 98%,
  #F7F3EB 100%)
```
Smooths the transition from photographic image to flat cream content zone below hero. **Why:** asset's bottom edge is dark wood-tone (no natural fade); without this overlay, the hero/cream boundary reads as a hard cut.

### D10 — Mall picker chip below hero
New `<MallPickerChip>` primitive. Composition (left → right inline row):
- PinIcon: Phosphor `PiMapPin` filled, 22px, color `v2.accent.green` `#285C3C`
- Mall name: Cormorant 22px weight 500, color `v1.inkPrimary` `#2A1E12`, letter-spacing 0.002em
- Chevron: Phosphor `PiCaretDown` 18px, color `v2.text.secondary` `#5C5246`, 8-10px left margin

No background, no border, no eyebrow. Single inline row. **Why:** David's screenshot literal; treats mall as identity-level serif anchoring the hero composition; departs from MallStrip's small-caps eyebrow vocab on purpose (Frame C voice).

### D11 — MallPickerChip padding
22px top breathing room from hero bottom edge, 18px horizontal page padding, 8-12px bottom breathing room before tile grid begins. **Why:** matches existing page-padding conventions (16-18px horizontal across project) + creates clear content-zone-start beat after hero ends.

### D12 — Background image sizing + positioning
`background-size: cover`, `background-position: center center`, `background-repeat: no-repeat`. Asset is 1536×1024 (3:2 landscape); at 33vh hero on iPhone 14 Pro (390 wide × 278 tall) cover-fits with image scaled to 417×278 and 13.5px clipped on each side at center X. **Why:** wordmark baked at center stays visible at all viewport widths; minimal cropping needed.

### D13 — Sticky chrome retirement scope
Today's `(tabs)/layout.tsx` chrome stack retires entirely from these 3 surfaces:
- StickyMasthead (84px sticky) → retired
- SearchBarRow wrapper + Suspense boundary (56px sticky) → SearchBar relocates into HomeHero
- MallStrip (36px sticky) → MallPickerChip inline below hero

Outside `(tabs)/`, StickyMasthead + its consumers stay verbatim (`/find/[id]`, `/shelf/[slug]`, `/my-shelf`, `/me`, `/login`, etc.). **Why:** the redesign is `(tabs)/` scope only; detail/auth/vendor surfaces keep their masthead voice.

### D14 — Asset optimization at Arc 1
The 3.3MB PNG ships through `npx -y pngquant-bin --quality=80-95 --speed=1` or equivalent before Arc 1 commits, targeting <600KB. Verify visual fidelity at 33vh hero render size on iPhone 14 Pro before pushing. **Why:** 3.3MB single-image weight would dominate page-weight budget for `(tabs)/` surfaces; pngquant at 80-95 typically achieves ~85% size reduction at no perceptible quality loss.

### D15 — Empty-state behavior
Hero renders identically on every `(tabs)/` surface regardless of content state:
- Saved (`/flagged`) at 0 saves → same hero
- Map (`/map`) at any mall scope → same hero
- Home at all-Kentucky vs specific-mall scope → same hero

**Why:** consistent identity beat per D1; the hero is not state-aware. Per-surface differentiation lives in the content zone below.

---

## Component contracts

### `<HomeHero>` — new primitive at `components/HomeHero.tsx`

Props:
```ts
type HomeHeroProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string; // default: "What are you searching for today?"
};
```

Internal structure:
- Outer `<section>` with `height: 33vh`, background-image cover-centered, cream-fade overlay gradient (D9)
- Embedded `<SearchBar>` positioned absolute at `bottom: 52px` from hero bottom (D7)
- No children; self-contained composition

Asset source: `/public/home-hero.png` (hardcoded path; swap mechanism is file replacement per D4).

### `<MallPickerChip>` — new primitive at `components/MallPickerChip.tsx`

Props:
```ts
type MallPickerChipProps = {
  mallName: string;
  onTap: () => void;
};
```

Renders: inline `<button>` row with PinIcon + Cormorant 22px name + PiCaretDown (D10). 22px top padding, 18px horizontal page padding, 8-12px bottom padding (D11). Tap fires `onTap` — typically opens existing MallSheet primitive.

---

## Implementation arcs (sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88)

### Arc 1 — `<HomeHero>` primitive in isolation (~3 commits)
- **1.1** Optimize hero asset: `npx -y pngquant-bin --quality=80-95 --speed=1 public/home-hero.png --output public/home-hero.png --force`. Verify size <600KB. Commit asset.
- **1.2** Ship `<HomeHero>` primitive at `components/HomeHero.tsx` embedding SearchBar at `bottom: 52px` + cream-fade overlay + 33vh height. Build clean.
- **1.3** Smoke route: new `/home-hero-test/page.tsx` mounting HomeHero with a stateful searchQuery. Validate visual at iPhone SE/14 Pro widths via Vercel preview.

### Arc 2 — `<MallPickerChip>` primitive in isolation (~2 commits)
- **2.1** Ship `<MallPickerChip>` primitive at `components/MallPickerChip.tsx`. Props per contract above.
- **2.2** Extend `/home-hero-test/page.tsx` to mount MallPickerChip below HomeHero + tile grid placeholder. Validate the full Frame C composition on Vercel preview.

### Arc 3 — `(tabs)/layout.tsx` adoption (~2 commits)
- **3.1** Adoption: replace StickyMasthead + SearchBarRow + MallStrip sticky chrome stack with `<HomeHero>` (scrolls away) + `<MallPickerChip>` (inline below hero on cream). Hero + chrome scroll with feed; only BottomNav sticky per D5.
- **3.2** Dead-code byproducts per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted: StickyMasthead import retire from (tabs)/; MASTHEAD_HEIGHT consumer audit (likely retires if no remaining (tabs)/ consumers; outside-(tabs) consumers keep it); MallStrip primitive retirement audit (if no remaining consumers across project, full file delete); SearchBarRow Suspense wrapper retirement; v1.basemap.cream var realignment if any.

### Arc 4 — iPhone QA + dial-cycle (~0-3 commits, post-push)
Vercel preview push after Arc 3 → iPhone PWA walk across Home + Saved + Map. Expected dial axes:
- Hero height 33vh vs 30vh vs 36vh — adjust to David's eye
- SearchBar position 52px vs 60px vs 44px from hero bottom — adjust per real device feel
- MallPickerChip padding rhythm — verify breathing room reads right
- Background image `background-position` if wordmark crops on narrow phones

Total estimated: 5-7 runtime commits + 0-3 dial commits = single focused session per Shape A scoping.

---

## Tier B headroom (explicit, deferred)

- **B1**: Admin-toggleable hero asset via `/admin` upload UI (Shape B from cost-shape triage). Reuses FeaturedBanner pattern from sessions 91+92. Defer until David asks for seasonal swap cadence.
- **B2**: Multi-asset rotation system (Shape C) — seasonal, time-of-day, scope-aware. Full design pass; multi-session.
- **B3**: Scope-aware hero override (different image per mall) — would compose onto Shape B; needs Mall.hero_image_url column + selection logic. Defer.
- **B4**: Parallax scroll effect on hero — hero stays partially visible while content scrolls; reverses D5. Full design pass to assess scroll-physics + iPhone PWA perf. Defer.
- **B5**: WebP + AVIF variants via `<picture>` element with srcset for next/image optimization. Defer until production page-weight audit triggers it.
- **B6**: Hero asset darker bottom-band variant — if Frame C's search-on-image reads busy at iPhone QA, ship an asset variant where the bottom 30% has muted/blurred wood-tones to support search readability. Defer pending QA.

---

## Risk register

| ID | Risk | Mitigation |
|---|---|---|
| R1 | 3.3MB PNG asset weight on (tabs)/ page-weight | Arc 1.1 pngquant optimization to <600KB before commit |
| R2 | Cover-sizing crop at narrow viewports may clip baked wordmark on phones <360 wide | iPhone QA on SE/Mini; if clipping surfaces, dial `background-position` to a specific Y value |
| R3 | SearchBar cream bg may compete with photographic content beneath at Frame C (search-on-image) | 1px border + drop shadow already in spec; iPhone QA verdict; Tier B6 darker-bottom-band asset variant available |
| R4 | Hero on `/map` may compete with map drawer chrome (sessions 158-161) | MapMobileDrawer is anchored body-bottom not top-chrome; hero scrolls away on first scroll anyway. Verify iPhone QA |
| R5 | Asset wordmark size baked at one resolution may read too small on iPhone Pro Max widths | Cover-sizing scales image up to fill width; wordmark scales proportionally; iPhone QA across SE + 14 Pro + 14 Pro Max widths in Arc 4 dial cycle |

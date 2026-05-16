# Chrome Unification — Design Record

> **Status:** ✅ Frozen (V2 mockup with chip-overlay refinement approved). Ship via 7-commit arc smallest-and-most-isolated first per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted.
> **Source mockups:**
>   - [chrome-unification-v1.html](mockups/chrome-unification-v1.html) — first interpretation (5 surfaces; masthead always visible + cream chrome). Approved at 90%, then refined.
>   - [chrome-unification-v2.html](mockups/chrome-unification-v2.html) — refined interpretation (masthead bg = hero photo; logo sticky-journey; chip-overlay). **Canonical record.**

## Pre-V1 locked decisions (from prose Q&A)

- **Q1 = (b) Profile floating overlay stays.** Reverses option (a) "move into masthead right slot." Preserves session 166 dial 9 geometry validated on iPhone QA — `OVERLAY_TOP = calc(max(14px, env(safe-area-inset-top, 14px)) + 14px)`, `OVERLAY_X = 18`, `OVERLAY_Z = 50`. Masthead's right slot stays null on (tabs)/.
- **Q2 = (b) Back floating overlay stays** (Home only, when MallMapDrawer is open). Mirrors Q1. Floating overlay calls `closeDrawer` on tap (session 157 wiring preserved).
- **Q3 = (b) Masthead arrives on scroll on Home.** Reverses earlier interpretation. The "masthead" on Home isn't a separate element — it IS the sticky-collapsed state of HomeHero. As scroll progresses, hero collapses to the masthead strip + logo sticky-pins at masthead vertical-center. Non-Home surfaces render the strip statically (from rest).
- **Q4 = (iii) Logo lives only in masthead** — never baked into the hero photo. Hero photo (`BG.png`) is wordmark-less.
- **Scope this session: Home + Saved + detail (/find /shelf) + auth/vendor (/me /login /vendor-request /post/* /contact /my-shelf).** /admin exempt — it has a bespoke v0.2 dark chrome and doesn't consume StickyMasthead, so the swap doesn't reach it naturally.

## Refinement post-V1 (David's verbatim: "I don't actually want the logo to hit the bottom of the hero image, rather I want the mall selector component to appear to scroll over the top of the bottom portion of the hero image to trim the bottom of the photo.")

Original V2: 98px masthead strip, logo at vcenter (y≈49), chip butts against masthead bottom edge.

Refined V2 (canonical): **130px masthead strip**, logo at vcenter (y≈65) — sits comfortably with photo extending below — chip sticky-pins at y=100 with **z-index above the strip**, occluding the bottom 30px of the photo. Chip "trims" the photo by overlay. Upward box-shadow on the chip (`box-shadow: 0 -2px 8px rgba(42,26,10,0.10)`) reinforces the layered-over-photo reading.

## Frozen decisions

| ID | Decision | Notes |
|---|---|---|
| D1 | Universal masthead strip aesthetic: BG.png cropped to strip height (center 92% background-position to show bottom slice) + bottom-fade gradient to surface bg + `treehouse_transparent.png` centered at strip vcenter | Same visual across Home (sticky-collapsed) + Saved + detail + auth/vendor surfaces |
| D2 | `MASTHEAD_HEIGHT` = `calc(max(14px, env(safe-area-inset-top, 14px)) + 116px)` | Was 84. +32px bumps strip to ~130px on flat-bottom iPhones, ~163px on notched. Body content offsets via spacer |
| D3 | Logo position in strip: `top: calc(max(14px, env(safe-area-inset-top, 14px)) + 50px)` — vertical center of the visible (non-chip-occluded) portion | Safe-area-aware; works across flat + notched iPhones |
| D4 | Logo width = 150px (general consumers), 130px (when masthead has filled left/right slots — /find, /shelf) | Height auto-sizes via 815×399 aspect ratio (~73px / ~64px) |
| D5 | Chip on Home only. Sticky-pin at `top: calc(max(14px, env(safe-area-inset-top, 14px)) + 86px)` — 30px above masthead bottom. z-index 38 (above strip's z 30). Upward box-shadow | Chip overlay "trims" the photo by occluding the bottom 30px |
| D6 | Non-Home surfaces (Saved, /find, /shelf, /me, /vendor-request, /post/*, /contact, /my-shelf) render the strip statically — no scroll-collapse, no chip overlay | Full 130px strip visible; logo + slot affordances directly in the strip |
| D7 | Profile floating overlay preserved at session 166 dial 9 geometry | Q1 lock |
| D8 | Back floating overlay preserved (Home + drawer-open only) | Q2 lock |
| D9 | Hero photo asset on Home: `/public/BG.png` (wordmark-less). Wordmark sits as a separate sticky element in HomeHero | Replaces `home-hero.png` (wordmark-baked) |
| D10 | Universal wordmark asset: `/public/treehouse_transparent.png` (815×399 RGBA, transparent bg). Replaces `/public/wordmark.png` in StickyMasthead's default + app/login direct img tag | Wordmark.png stays in /public for /admin's bespoke chrome to reference if needed (currently /admin doesn't render wordmark.png) |
| D11 | `/admin` exempt at primitive level (doesn't use StickyMasthead) | No code change needed for /admin |
| D12 | HomeHero on Home only. Saved + other (tabs)/ surfaces get StickyMasthead | Session 166 dial 7 lock preserved (chip+drawer also Home-only) |
| D13 | Logo on Home is a SIBLING of HomeHero at TabsChrome level (not a child of HomeHero) | Sticky behavior must extend beyond HomeHero's bounds — sticky-pinned to viewport top regardless of hero scroll state |
| D14 | **Embedded SearchBar in HomeHero is RETIRED.** Hero is photo-only. Search affordance lives... TBD on iPhone QA | Open: SearchBar may need to relocate to page-body content. iPhone QA will surface if this is missed. If David flags absence, easy follow-on commit adds SearchBar below the chip as scrollable page content |
| D15 | Chip's box-shadow inverted (`0 -2px 8px`) — casts upward onto the photo it overlays | Reinforces "layered over" reading |

## Implementation arc (~7 commits, smallest-and-most-isolated first)

1. **Asset rotation + dead-code retire.** Stage `BG.png` + `treehouse_transparent.png` as tracked. Retire aborted exploration mockup + redundant cream-bg `treehouse.png`.
2. **Design pass commit.** This file + V1 + V2 mockups per Design Agent rule (`feedback_commit_design_records_in_same_session` ✅ Promoted).
3. **`lib/chromeTokens.ts`** — shared constants module (MASTHEAD_HEIGHT_PX, LOGO_TOP_PX, CHIP_TOP_PX, CHIP_OVERLAP_PX). Pure additive — no consumers.
4. **StickyMasthead refactor.** Adopts strip aesthetic with BG.png bg + treehouse_transparent.png centered + bumped MASTHEAD_HEIGHT. Inherits across ~7 consumers (/find /shelf /me /my-shelf /post/tag /vendor-request /contact). /admin unaffected.
5. **HomeHero rewrite.** Swap `home-hero.png` → `BG.png`. Retire embedded SearchBar per D14. Sticky-stop math adjusts for new MASTHEAD_HEIGHT.
6. **TabsChrome wiring.** Saved mounts `<StickyMasthead />` directly (currently mounts nothing). Home keeps `<HomeHero />`. Home gets a new sibling sticky logo element (per D13). Chip geometry: `top: CHIP_TOP_PX`, `z-index: CHIP_Z`, upward box-shadow.
7. **app/login direct img swap.** `wordmark.png` → `treehouse_transparent.png`.

## Risks captured in V2 mockup (for iPhone QA watch-list)

- iOS Safari sticky-overlap + z-index reliability (testbed validation may be needed mid-arc)
- Status-bar text color across surfaces (hero photo means light text universally — flip from current dark)
- Bubble contrast on hero strip (light-bg + dark-glyph should still read; iPhone QA tells)
- SearchBar removal (D14) — may need relocation on iPhone QA
- BG.png is **reference-only** at 475×268; higher-res asset coming from David before ship leaves preview

## Investor-narrative thread

This is the first visual-identity refresh since session 87's wordmark asset overhaul. Same visual vocabulary (lowercase serif + leaf + small-caps FINDS subtitle), refined typography + simpler leaf glyph + transparent bg for photographic layering. The "hero photo IS the masthead bg" pattern is the digital-to-physical bridge thesis crossing into chrome — every page carries a fragment of "real place" texture in its top strip.

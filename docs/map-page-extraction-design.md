# Map page extraction — R-session design record

> **Session 176 R-session.** Pull MallMapDrawer back out of the Explore page into its own dedicated `/map` route with bordered-window containment (Frame A, pre-155 revival). Reverses session 155's drawer-overlay reshape; reverses session 109's /map-page deletion. Revives the pre-155 "contained window" feel David explicitly referenced.
>
> **Status:** 🟢 Ready for implementation across 4 arcs in session 177+.

---

## David's verbatim ask (session 176, after F1 dial shipped)

> "I want to pull the map portion back out from the explore page into it's own page. My goal is to still make it feel like a seamless transition though as much as possible. It needs to have a back button to go back to the explore page. It should not include a search bar. I want it to make better use of the screen and still feel part of the app. I liked the first iteration where it felt a bit contained in a window an not extending the entire screen. We'll need an R session for this."

---

## Tension to resolve

"Better use of the screen" pulls toward maximum map area (full-bleed). "Contained in a window not extending entire screen" pulls toward bordered chrome with breathing room (pre-155 pattern). David's pick on V1: **Frame A — bordered window literal revival**. The "better use of screen" payoff comes not from edge-to-edge map but from **dedicated-page surface** vs. drawer-overlay (no chrome stack consuming the top third; map gets the whole middle of the page).

---

## Cross-session reversals surfaced (per `feedback_surface_locked_design_reversals` ✅ Promoted)

This R-session reverses substrate accumulated across 6 prior sessions. All reversals surfaced explicitly + acknowledged:

| Session | Locked decision being reversed/bounded-revised | This session's call |
|---|---|---|
| 109 | `/map` page deleted entirely → drawer-in-Home only | REVERSED — `/map` page revived as dedicated route |
| 155 D-Reversal | Drawer overlays Explore page (chrome-less Iter 2) | REVERSED — drawer retires; standalone page |
| 156 dials | MapControlPill secondary style + masthead retire on /map presumed-dead | BOUNDED-REVISED — pill carries to new page; masthead lives at standard chrome position |
| 158 Arc 3 | MallMapDrawer is canonical drawer pattern | RETIRED — drawer wrapper drops; inner content (TreehouseMap, MapCarousel, PinCallout) carries verbatim |
| 161 refinement | Drawer-specific shelf wrapper + safe-area-aware bottom padding | RE-PURPOSED — shelf becomes page-level shelf above BottomNav (same canonical geometry) |
| 166 D3 Arc 2+3 | MallMapDrawer cemented inside `(tabs)/` chrome via TabsChrome orchestrator | RE-PURPOSED — TabsChrome simplifies (drawer composition retires); HomeChrome wrapper file already absent (retired prior) |
| 175 C4 Option α | Drawer-open auto-scroll retired as Option α byproduct | UNCHANGED — Option α stays; no drawer means no auto-scroll concern |

**Substrate that carries verbatim:** TreehouseMap (866 LOC, custom palette, peek-then-commit, fitBounds, ResizeObserver, retry watchdog) · MapCarousel (297 LOC nearest-first sort + auto-scroll) · PinCallout (439 LOC, header + DistancePill + Browse/Go CTAs + neighbor arrows) · useUserLocation · useSavedMallId · mallSort helper · cartographic palette + LeafBubblePin canonical · peek-state interaction pattern · MapControlPill always-visible (session 161) · FIT_PADDING_WITH_SHELF constant (validated against new shelf geometry; may dial).

**Substrate that retires:** `MallMapDrawer` wrapper · drawer-specific framer-motion slide-up · body scroll lock · `useMapDrawer` context (audit consumers; MastheadBackButton uses drawer-open state for back-button gating — replaces with pathname check).

**Substrate revived from dormant:** `MallSheet.tsx` (456 LOC, dormant since session 158) — revives for D6 scope-picker on /map.

---

## Frozen decisions D1–D20

### Entry path + transition (D1–D4)

- **D1.** MallStrip tap on Home routes to `/map` via `router.push('/map')`. Strip is the canonical entry. Replaces drawer-toggle handler.
- **D2.** MallStrip mirrors at top of `/map` page (below masthead). Same chip primitive, same visual treatment, same current-scope label. Tap behavior on `/map` differs from Home (see D6).
- **D3.** MapCarousel as canonical bottom shelf on `/map`. Always visible (sessions 158 + 161 substrate). Sort logic from `lib/mallSort.ts` unchanged.
- **D4.** Framer-motion slide-up transition on `/map` enter (`y: 100% → 0`, duration ~280ms ease-out). Back-nav reverses to slide-down (`y: 0 → 100%`, ~240ms ease-in). Mimics the pre-existing drawer enter/exit — user perceives "expanded the drawer to fill the screen" rather than "jumped to a new page." See risk R3 for Mapbox re-init concern.

### Containment geometry (D5)

- **D5.** **Frame A — bordered window** (V1 pick). Map sits inside a bordered container with `1px solid v2.border.medium` + `border-radius: 14px` + ~14px page padding around (left/right/top — bottom edge meets the carousel shelf). Subtle drop shadow (`0 2px 6px rgba(0,0,0,0.04)`) for soft elevation off the v2.bg.main page bg. Map labels never touch viewport edges; chrome stack reads as deliberately deliberate, not accidental full-bleed.

### Scope-pick on /map (D6–D7)

- **D6.** MallStrip tap while on `/map` opens `<MallSheet>` (bottom sheet, pre-155 revival). MallSheet currently dormant in repo (456 LOC); revives without code change. Lists active malls with current scope highlighted. Tap a mall → commits scope + closes sheet (stays on /map, map fly-to). "All Kentucky" option at top of list. Reuses substrate 100%.
- **D7.** PinCallout "Explore" CTA on `/map` commits scope + routes back to `/explore` (Home). PinCallout "Directions" CTA opens native maps deep-link (unchanged from current). The map page is a "pick where to shop" utility — committing a scope means "let me see what's there," which is the Explore feed.

### Saved tab integration (D8)

- **D8.** Saved tab keeps no `/map` entry. MallStrip stays Home-only (no reversal of session 175 Option α). Users navigate Saved → Home → MallStrip tap → /map. Cleanest mental model; map lives in the Explore flow.

### Chrome stack on /map (D9–D12)

- **D9.** Masthead on `/map`: standard chrome position (not floating overlay). Left slot: MastheadBackButton routing to `/` (root, the Explore page). Right slot: Profile bubble unchanged (matches `/find/[id]` + `/shelf/[slug]` pattern).
- **D10.** Wordmark in masthead center: standard treatment (matches all other pages).
- **D11.** MallStrip directly below masthead, same sticky-pin behavior as Home (sticky at top:HERO_BOTTOM_EDGE-equivalent → just `top: 0` here since no hero on /map). Strip remains visible during any map scroll/zoom (it's chrome, not map content).
- **D12.** Back button on `/map` returns to `/` via `router.push('/')` not `router.back()` — guarantees Explore destination even if user landed on /map from a deep link or non-Home referrer.

### Map page body geometry (D13–D16)

- **D13.** Map container vertical bounds: between MallStrip bottom and MapCarousel top. Carousel takes ~134px (114px card height + 14px top + 4px scroll padding + 2px border/shadow). On iPhone SE (667px), map gets ~440px — almost double the current drawer geometry (which is bounded by SearchBar + strip above + carousel below).
- **D14.** MapControlPill placement: top-right inside the bordered window (matches V1 mockup). Default `top: 12px; right: 12px;` inside the window. Defer placement-tuning to iPhone QA.
- **D15.** MapCarousel sits below the bordered window, NOT inside it. Carousel is page-level chrome (above BottomNav). The bordered window contains ONLY the TreehouseMap. Keeps the "window" metaphor clean.
- **D16.** Page background: `v2.bg.main` (#F4EFE3), matching Home + Saved. Carousel sits on `v2.bg.page` with `border-top: 1px solid v2.border.light` (carries from session 161 shelf substrate).

### Substrate behavior (D17–D20)

- **D17.** User location pin + 10mi sonar pulse carries verbatim from `components/UserLocationPin.tsx` (sessions 158 + 161).
- **D18.** PinCallout shape carries verbatim — header (name + DistancePill) + stat line + Browse/Go CTA pair + neighbor arrows. Only CTA's onCommit handler changes per D7.
- **D19.** Cartographic palette via `resolveCssVar()` Mapbox bridge from session 156 — unchanged.
- **D20.** When mall scope is `null` (all-Kentucky), MallStrip on Home displays "All Kentucky" chip; tap still routes to /map; /map shows fitBounds across all active malls.

---

## Open Tier B headroom (deliberately deferred — capture, don't ship)

1. **Mapbox Studio italic-Lora label face** — deferred 14+ sessions; lands when David moves to Studio-hosted style URL. Carries from session 108.
2. **Mapbox preview-only token setup** — 21-session carry (sessions 156→175→176). Without it, `/map` Mapbox tiles silently fail on Vercel preview deployments (production-PWA QA only). ~15 min HITL.
3. **`/map` page Mapbox container re-init optimization** — Framer-motion slide-up + Mapbox container resize may need tuning; ResizeObserver from session 156 should handle but verify in QA.
4. **PinCallout commit toast** — if QA reveals users miss the "commit + route" silent transition, add a soft toast "Scope set" with brief animation before route.
5. **MallStrip "I'm navigating" visual treatment** — chip currently uses chevron-down caret signaling "opens overlay below." Post-D1 it routes instead. Consider chevron-right or PiArrowRight glyph if QA flags ambiguity. Defer.
6. **`/map?mall=<slug>` deep-link param** — URL-shareable scope state on /map. Currently scope persists via `useSavedMallId` localStorage hook (sufficient for normal flow). Add ?mall= param if external sharing of scoped map becomes a real ask.
7. **`/map` page back-button on first visit** — if user lands on /map via deep link with no Home referrer, router.push('/') is correct fallback. Verify no jarring transition in QA.
8. **MapControlPill iPhone QA dial** — placement (top-right vs bottom-right vs floating-outside-window) deferred to iPhone QA after Arc 1+2 ship.

---

## Component contracts

### New

- **`app/(tabs)/map/page.tsx`** — new route under (tabs) so it inherits the BottomNav from `(tabs)/layout.tsx`. Page composes masthead-back + MallStrip + bordered map window + MapCarousel.
- **`components/MapPageBody.tsx`** (~150 LOC est.) — bordered window primitive containing TreehouseMap + MapControlPill overlay. Public contract: `{ malls, selectedMallId, peekedMallId, onPinTap, onMapTap, onCommit, onReset, mallStats, savedByMallId }`. Same shape as MallMapDrawer's body minus the drawer wrapper.
- **`components/MapPageTransition.tsx`** (~60 LOC est.) — framer-motion wrapper providing slide-up enter + slide-down exit. Wraps page content. Reusable for any future "slides up from bottom to fill viewport" route transition.

### Modified

- **`components/MallPickerChip.tsx`** — `onTap` handler swaps from drawer-toggle (`openMapDrawer()`) to `router.push('/map')`. No visual change in Arc 3; defer caret change to Tier B5.
- **`components/MallSheet.tsx`** — revived from dormant. Verify no drift from session 158 contract. May need minor v2-token alignment if any inline values predate session 144 token foundation refactor (audit at Arc 2).
- **`components/TabsChrome.tsx`** — drawer composition retires. Layout owns masthead + MallStrip + BottomNav; pages own body content. May simplify substantially or rename if drawer-orchestration was its primary purpose.
- **`(tabs)/layout.tsx`** — MallStrip conditional: visible on Home + Map; hidden on Saved (per D8). Adjust pathname-based slot logic.
- **`components/MastheadBackButton.tsx`** — back-button conditional swaps from `useMapDrawer().isOpen` check to pathname check (`pathname !== '/'`).

### Retired

- **`components/MallMapDrawer.tsx`** — wrapper retires; inner composition logic moves to MapPageBody.
- **`lib/useMapDrawer.tsx`** — context retires post-D18 (no consumers after MastheadBackButton + TabsChrome + (tabs)/page + (tabs)/layout + app/layout all drop consumption).
- Dead-code byproducts per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted: drawer-specific framer-motion, body-scroll-lock effect, any drawer-toggle handlers in TabsChrome/HomeChrome callsites.

---

## Implementation arcs (sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted)

### Arc 1 — New /map page + MapPageBody primitive in isolation (3 commits)

- **Arc 1.1** Create `components/MapPageBody.tsx` with bordered window + TreehouseMap + MapControlPill (no MapCarousel yet). Smoke route at `/map-page-test` per `feedback_testbed_first_for_ai_unknowns` ✅ Promoted.
- **Arc 1.2** Create `app/(tabs)/map/page.tsx` mounting masthead-back + MallStrip (display-only initially) + MapPageBody + MapCarousel. Validates Frame A geometry on real device.
- **Arc 1.3** Wire scope state (useSavedMallId already exists) + onPinTap/onMapTap/onCommit handlers stubbed to console.log.

### Arc 2 — MallSheet scope-picker wired on /map (2 commits)

- **Arc 2.1** Revive MallSheet; audit for v2-token drift; minor cleanup if needed.
- **Arc 2.2** Wire MallStrip on /map: onTap opens MallSheet; MallSheet onMallPick updates scope + closes sheet + map flies to new scope.

### Arc 3 — Wire Home entry + retire drawer substrate (2 coupled commits)

- **Arc 3.1** MallPickerChip onTap swaps from drawer-toggle to `router.push('/map')`. PinCallout commit handler on /map: scope-change + `router.push('/')`. Smoke-test both on Vercel preview.
- **Arc 3.2** Retire MallMapDrawer + useMapDrawer + drawer-toggle code paths. Single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — dead-code byproducts per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted (drawer wrapper retires; TabsChrome simplifies; MastheadBackButton conditional updates; (tabs)/layout MallStrip conditional adjusts; (tabs)/page simplifies).

### Arc 4 — Framer-motion slide-up transition (1 commit)

- **Arc 4.1** Wrap `app/(tabs)/map/page.tsx` with MapPageTransition. Verify enter (slide-up from bottom) + exit (slide-down) work cleanly. Mapbox container resize verification via session 156 ResizeObserver substrate.

### Arc 5 — Production iPhone QA + dial-backs

- iPhone PWA walk on production v0.176.0. Validate D1–D20 + Tier B candidate dials (MapControlPill placement, MallStrip chip visual on Home, etc.).

**Estimated total: 8 commits across Arcs 1–4 + iPhone QA dials in Arc 5. Single-session ship plausible at ~90 min.**

---

## Risk register

| ID | Risk | Mitigation |
|---|---|---|
| R1 | FIT_PADDING_WITH_SHELF constant (223px) calibrated for drawer geometry; carousel position on /map may differ → fitBounds clips bottom malls | Re-validate constant against /map shelf placement at Arc 1.2; expose as MapPageBody prop if /map differs |
| R2 | useMapDrawer context retirement — audit consumers (5 files per pre-write grep). MastheadBackButton's drawer-open check is the load-bearing consumer for back-button gating on Home | Replace with pathname check in MastheadBackButton; verify all 5 consumers retire cleanly at Arc 3.2 |
| R3 | Mapbox re-init across route transitions — page enter slide-up triggers container resize which Mapbox needs to handle without blanking | ResizeObserver from session 156 already in TreehouseMap; verify in Arc 4 QA; watchdog retry from session 156 is the fallback if blanking occurs |
| R4 | MallSheet drift from session 158 contract (dormant 18 sessions) | Audit + v2-token sweep at Arc 2.1 before consumer wiring; smoke-test in isolation |
| R5 | Framer-motion + Next.js App Router route transitions are non-trivial — exit animation requires AnimatePresence at layout level or manual control | Arc 4 may surface implementation complexity warranting either Next.js 14's `unstable_after` or framer's layout-level AnimatePresence wrapper; document approach in Arc 4 commit body |
| R6 | Mapbox preview-only token still not set up → /map silently fails on Vercel preview (Tier B2) | Production-PWA QA fallback acceptable for ship (carries from session 156); 15-min HITL closes it permanently |
| R7 | All-Kentucky scope on /map fitBounds — verify the existing fitBounds-to-all-active-malls path handles the page-geometry correctly | Test path explicitly at Arc 1.2 + Arc 1.3 |

---

## Carries closing this session

- **Session 175 → 176:** Round 3 iPhone QA on C4+C5 → **superseded** by F1 + F2 (HomeHero behavior changes again at C1; map architecture changes at F2). Round 3 walk owed against the new state.
- **Session 175 → 176:** `docs/launch-gaps.md` strategic session — **carries to 177** unchanged (David pivoted to map architecture this session).
- **Session 175 → 176:** Remaining v0.174 contrast watch-items + Saved hotfix watch-items — **carries to 177** unchanged.

---

## What "seamless transition" means in this design

David's verbatim ask: "still make it feel like a seamless transition though as much as possible." Three layers carry the seamless feel:

1. **Visual chrome continuity** — masthead style, fonts, palette, MallStrip primitive all match Home (D2 + D9-D11). User reads same brand identity.
2. **Spatial transition mechanic** — framer-motion slide-up matches the prior drawer's enter animation (D4). User perceives "expanded the drawer" not "jumped to new page."
3. **Mall scope continuity** — useSavedMallId hook persists scope across navigations via localStorage broadcast (substrate from session 110). User's last picked mall stays selected when arriving at /map. Same primitive both sides of the seam.

What "seamless" does NOT mean: shared layoutId across routes (R3 risk; Mapbox re-init complexity). The illusion of continuity is sufficient; literal shared-element is overkill.

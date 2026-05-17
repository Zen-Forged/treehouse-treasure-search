# Changelog

All notable changes to Treehouse Finds, versioned per session.

**Scheme:** `v0.{session}.{patch}` while pre-beta — patch increments for mid-session hotfix cycles. `v1.0.0` lands at beta launch. Each entry maps directly to the corresponding session block in [CLAUDE.md](CLAUDE.md) — open that block for the full beat-by-beat narrative + memory firings + carries.

Format inspired by [Keep a Changelog](https://keepachangelog.com).

---

## [v0.177.0] — 2026-05-17

### Session 177 — iPhone QA bundle on production v0.176.0: /find/[id] map filter retire + carousel revival + Explore this Booth CTA + hero compression magnitude dial

4 runtime commits + 1 close. David opened with `/session-open`; standup recommended F2 Map page extraction implementation (Arcs 1-5 against session 176's locked design record) as PRIMARY. David redirected with 4 iPhone-QA-driven findings on production v0.176.0 — same shape as session 175 (QA pivot pre-empting recommended primary). Per `feedback_user_clarification_restate_interpretation` ✅ Promoted (~31+ cumulative firings), each finding restated interpretively + clarifying questions batched via single `AskUserQuestion` per `feedback_v2_options_before_drafting` ✅ Promoted before drafting any code: F1 scope (/find/[id] only vs global cartographic mute) / F2 magnitude (40 vs 60 vs 20px) / bundle vs F2 sequencing. David picked all 3 Recommended options (/find/[id]-only / 40px / bundle this session + F2 next session). 4 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 (~499+ cumulative firings).

C1 `d91ecda` — F2 SCROLL_BEFORE_STICKY_PX 80 → 40 (smallest dial). David's verbatim: *"The sticky position of the explore header goes too far and cuts off part of the logo. It should look more like the second image attached with just some padding between the top of the logo and the screen up top."* Bounded magnitude dial of session 176 C1 — structural pattern (negative-top sticky compression) preserved; magnitude halves. 80px (~36% compression on iPhone SE) → 40px (~18% compression). Compressed hero now shows ~40px of breathing room above the wordmark when sticky-pinned. `HERO_BOTTOM_EDGE` export inherits the new value automatically via `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`; chip + drawer consumers re-anchor without code changes. **11th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161 — html2canvas-pro `npm install` at C1 commit boundary; lockfile updated.

C2 `72d3a3b` — F4 Explore this Booth button stacked below Flag the Find. David's verbatim: *"Add a button under the 'Flag the Find' button for 'Explore this Booth' (navigate to /shelf)."* Bounded revival of session 170 Arc 3's OTHER CTA-pair half per `feedback_surface_locked_design_reversals` ✅ Promoted (~82+ cumulative firings). Session 169 round 2 shipped Explore Booth + Flag the Find as side-by-side 50/50 CTA pair; session 170 Arc 3 retired BOTH on Shape B re-architecture ("save bubble IS primary CTA; booth nav via DestinationHero strip"); session 171 C6 bounded-revived Flag the Find under Price as dual affordance with photograph save bubble; session 177 C2 bounded-revives Explore Booth as a STACKED button below Flag the Find (not side-by-side per session 169 — David's verbatim singular noun + vertical stack vocabulary). Outer wrapper restructured from single-button container to flex-column with gap 10 so both buttons share the same padding + marginBottom. Style mirrors session 169 secondary outlined treatment exactly (cream bg + green text + 1px green outline) — Flag the Find above stays primary engagement CTA per lattice canonical `project_layered_engagement_share_hierarchy` ✅ Promoted. Label "Explore this Booth" verbatim per `feedback_user_provided_verbatim_values_ship_as_is` ✅ Promoted. PiStorefrontBold import REVIVED — was retired session 170 Arc 3 alongside the original Explore Booth CTA; revival comment preserves provenance.

C3 `d437c35` — F1 retire CSS warmth filter on /find/[id] map thumbnail. David's verbatim: *"The overlay on the map in the /find section is offputting due to the stark contrast i.e. warm hue on the map. We need it to be more muted like the mapbox background is."* Bounded surface-locked design reversal of session 171 dial #2 per `feedback_surface_locked_design_reversals`. Session 171 shipped `filter: sepia(0.4) saturate(1.1) hue-rotate(-8deg)` on the static Mapbox thumbnail to push the default light-v11 grey toward the project's v1.basemap.cream warm-cream (#F1E9D2) so the thumbnail matched /map page's interactive cartographic vocabulary. Production iPhone QA on v0.176.0 reads that warmth as stark contrast against the surrounding warm-cream cardstock. Audit-first per `feedback_visibility_tools_first` ✅ Promoted localized the bug class: /find/[id]'s map is a STATIC Mapbox image (`lib/mapStaticImage.ts` using `mapbox/light-v11`), NOT TreehouseMap with runtime palette overrides — the warm hue was purely the CSS filter. Bounded reversal scope: ONLY this thumbnail surface; /map page's interactive TreehouseMap keeps the warm-cream cartographic palette (session 156's `resolveCssVar`-fixed `setPaintProperty` overrides) since map IS the primary identity surface there. Placeholder bg also dialed v2.surface.warm → #F2EFEA neutral cream-grey for visual consistency with the now-muted image.

C4 `7c76217` — F3 revive "More from this booth" carousel (no Visit Booth text). David's verbatim: *"Need to add back in the more from this booth functionality at the bottom of the /find page. However, do not include the text on the far right that says 'visit booth' as this will be replaced by this [Explore this Booth button under Flag the Find — F4]."* Largest commit (+415/-42 LOC). Bounded surface-locked design reversal of session 170 Arc 4 (commit `dde9696` that retired the entire <ShelfSection> + 326 LOC + all substrate). Audit-first git-history recovery via `git show dde9696^:app/find/[id]/page.tsx` extracted the exact pre-retirement source state — mirror-image revival preserves all prior decisions including session 169 round 3's earlier retirement of the "Visit Booth" right-slot text (commit `03a6c76` — David's session-177 spec aligns automatically since the revival source state already honored it). Sub-pattern of `feedback_visibility_tools_first`: parent-of-retirement-commit recovery (`git show <sha>^:path`) reads as a canonical pattern for "revive the structural pattern that was retired at <sha>." Imports revived (useCallback / getVendorPosts / writeFindContext / getVendorPostsCache / setVendorPostsCache / FindRef / HomeFeedTile) + module-scope `findStripScrollKey` helper + 326-LOC `<ShelfSection>` function + `setShelfHasItems` + `shelfReady` useState + Phase C QA fix #3 setShelfReady reset + scroll-restore `shelfReady` gate + `handleShelfReady` useCallback + mount site OUTSIDE swipe-nav motion.div per pre-retirement geometry. All revival markers preserved with explicit "REVIVED at session 177 C4" provenance comments for greppability. F4 + F3 are the cross-session reversals of session 170 Arc 3 + Arc 4 respectively; F3's carousel restores parallel-discovery affordance ("look at other finds at this booth"), F4's button restores discoverable booth-nav affordance — DestinationHero's tappable vendor strip remains as co-equal third affordance, same pattern as Flag the Find ↔ photograph save bubble pair (multiple co-equal affordances for the same intent on the same surface — lattice canonical).

Vercel queue operational gap surfaced — when worktree push lands behind 2 prior deployments (session 176 close docs + PR squash-merge), MCP doesn't expose a cancel/delete tool. Workaround: dashboard URL handoff with identification of which deployments are non-load-bearing to cancel. NEW Tech Rule candidate: "Vercel queue cancellation requires dashboard (MCP gap) — provide URL + identify safe-to-cancel deployments by commit message inspection."

### Added

- **"Explore this Booth" button** below Flag the Find on `/find/[id]` (`app/find/[id]/page.tsx`). Secondary outlined CTA (cream bg + green text + 1px green outline + PiStorefrontBold 14px). Routes to `/shelf/[vendorSlug]`. Gated on `vendorSlug` non-null.
- **"More from this booth" carousel** revived at bottom of `/find/[id]`. Horizontal-scroll thumbnail strip showing other finds from the same booth (excluding current find). Cache-hit fast path via `getVendorPostsCache` + async fetch fallback via `getVendorPosts`. Per-tile tap writes swipe-context via `writeFindContext` so users can swipe through booth siblings. Header eyebrow LEFT-ONLY ("More from this booth…" italic Cormorant 18 in v2.text.secondary) — NO "Visit Booth" right-slot text (F4 Explore this Booth button under Flag the Find carries that intent).

### Changed

- **Home hero compression magnitude** — `SCROLL_BEFORE_STICKY_PX = 80` → `40` in `components/HomeHero.tsx`. Compressed pinned hero now shows ~40px breathing room above the wordmark (was: leaf glyph flush against URL bar). Bounded magnitude dial of session 176 C1; structural pattern preserved. `HERO_BOTTOM_EDGE` export inherits new value automatically; chip + drawer geometry re-anchors without code changes.
- **/find/[id] static map thumbnail palette** — CSS `filter: sepia(0.4) saturate(1.1) hue-rotate(-8deg)` retired in `components/DestinationHero.tsx`. Static Mapbox image now renders unmodified at default `mapbox/light-v11` neutral palette. Placeholder bg v2.surface.warm → #F2EFEA cream-grey for visual consistency. Bounded reversal scope: only this /find/[id] thumbnail; /map page's interactive TreehouseMap keeps warm-cream cartographic palette.

### Removed

- **CSS warmth filter** on `/find/[id]` map thumbnail (session 171 dial #2 retired per David's QA on v0.176.0).

### iPhone QA watch-items

- **F2 magnitude validation** — 40px reads as "just enough breathing room above the wordmark" not too aggressive / not too subtle. Dial up to 50 or down to 30 if QA flags.
- **F4 Explore this Booth button** — verify cream-on-cream readability against /find/[id] page bg; verify tap routes to correct `/shelf/[vendorSlug]`; verify stacked-pair visual hierarchy (Flag the Find = primary; Explore this Booth = secondary).
- **F1 muted map thumbnail** — verify default light-v11 grey reads cohesively with surrounding warm-cream cardstock (no jarring contrast); placeholder bg #F2EFEA harmonizes with both states.
- **F3 carousel revival end-to-end** — verify cache-hit fast path (back-nav into same find restores scroll position pre-paint); verify scroll-restore shelfReady gate (peer-nav into different find waits for carousel ready signal before scrollTo); verify per-tile tap preserves swipe-context (tap booth sibling → swipe back to original find works).

[v0.177.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.177.0

---

## [v0.176.0] — 2026-05-17

### Session 176 — Home hero scroll-and-compress dial + Map page extraction R-session design-to-Ready (Frame A bordered window + 20 frozen decisions)

2 runtime commits + 1 close. David opened with `/session-open`; standup recommended Round 3 iPhone QA + launch-gaps strategic session pair. David redirected to two iPhone-QA-driven findings on production v0.175.0: (F1) Home hero should scroll a bit before becoming sticky (reference image: Saved page hero at natural top-of-flow position); (F2) Pull MallMapDrawer back out of Explore into its own dedicated `/map` page with back button + no search bar + "contained window" feel + "seamless transition" + David's explicit "needs an R session." Per `feedback_user_clarification_restate_interpretation` ✅ Promoted, both findings restated interpretively before drafting; F2 surfaced as MAJOR design reversal of session 109's /map-page deletion + session 155's drawer-overlay reshape per `feedback_surface_locked_design_reversals` ✅ Promoted (~78+ cumulative firings).

C1 `b102aaa` — F1 Shape A scroll-and-compress dial. `position: sticky; top: -SCROLL_BEFORE_STICKY_PX (= 80px)` replaces Option α's `top: 0`. At scrollY=0 hero sits at top:0 (full 33vh visible, chrome bubbles overlay photograph, matches reference image). User scrolls — hero scrolls UP with content for 80px. Past threshold, sticky activates pinning hero with top 80px offscreen. Visible pinned hero = 33vh - 80px (~36% compressed on iPhone SE; wordmark + SearchBar still visible). BOUNDED REVIVAL of session 164 D16-D19 + session 166 dial 10 collapsing-header pattern at smaller magnitude (session 164: 158-191px collapse = 58-72% on iPhone SE; session 176: 80px collapse = 36%). BOUNDED REVISION of session 175 Option α — full-identity-beat thesis stays for scrollY=0; partial-compression activates AFTER user scrolls past 80px threshold. Single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — `HERO_BOTTOM_EDGE` export updates from `${HERO_HEIGHT_VH}vh` to `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)` so chip + drawer geometry inherit compressed bottom edge automatically. Pre-existing local-env miss on parked `ShelfImageShareScreen.tsx` (html2canvas-pro) resolved via `npm install` at commit boundary — **10th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161.

C2 `c064baa` — F2 Map page extraction R-session design-to-Ready. Audit-first per `feedback_visibility_tools_first` ✅ Promoted dispatched Explore-agent inventory of session 155-166 map substrate (10 file reads + git-history recovery of pre-155 /map page from commit `3bbcbfb0d^` for the "contained window" reference David pointed at). Pre-V1 prose scoping (Q1-Q4 single AskUserQuestion) locked 4 structural decisions before drafting V1 mockup: D1 strip-routes-to-/map; D2 strip-mirrors-on-/map; D3 carousel-canonical-bottom-shelf; D4 framer-motion-slide-up. V1 mockup at `docs/mockups/map-page-extraction-v1.html` spans containment geometry across 3 frames (A bordered window literal revival / B soft-padded breathing room / C full-bleed) per `feedback_mockup_options_span_structural_axes` ✅ Promoted with 7-axis trade-off matrix. **David picked Frame A** — bordered window literal revival (1px border + 14px radius + 14px page padding). Post-V1 prose fill-refinement (Q5-Q7) — V2 mockup SKIPPED per `feedback_v2_options_before_drafting` ✅ Promoted (axes prose-resolvable); 3 fill axes locked: D6 MallSheet revival on /map strip tap; D7 PinCallout commit routes to /explore; D8 Saved keeps no /map entry. 20 frozen decisions D1-D20 + 8 Tier B explicit headroom items + 7-row risk register + 4-arc implementation sequencing (~8 commits, single-session ship plausible at ~90 min in session 177+). 6 cross-session reversals surfaced explicitly + acknowledged across sessions 109 + 155 + 156 + 158 + 161 + 166 + 175. Substrate inventory: 866-LOC TreehouseMap + 297-LOC MapCarousel + 439-LOC PinCallout + 5 hooks + cartographic palette + peek-state pattern all carry verbatim; MallMapDrawer wrapper + useMapDrawer context + drawer-specific framer-motion all retire; MallSheet (456 LOC dormant since session 158) revives for D6. Design record + V1 mockup committed together as single coupled commit per Design Agent rule + `feedback_commit_design_records_in_same_session` ✅ Promoted.

### Added

- **`SCROLL_BEFORE_STICKY_PX` constant** in `components/HomeHero.tsx` (= 80) — scroll distance allowed before negative-top sticky activates on Home. Easily dial-able via iPhone QA; module-scope constant propagates through chip + drawer geometry via single `HERO_BOTTOM_EDGE` export.
- **`docs/map-page-extraction-design.md`** — 20-decision design record for /map page extraction R-session (Frame A bordered window, 4-arc implementation sequencing, 8 Tier B headroom items, 7-row risk register). 🟢 Ready for implementation in session 177+.
- **`docs/mockups/map-page-extraction-v1.html`** — V1 mockup with 3 frames spanning containment geometry axis + 7-axis trade-off matrix. Frame A locked.

### Changed

- **Home hero sticky behavior** — `position: sticky; top: 0` → `position: sticky; top: -80px`. At scrollY=0 hero shows full 33vh; user scrolls 80px before pinning; pinned hero shows 33vh - 80px (~36% compressed on iPhone SE). Bounded revival of session 164 collapsing-header pattern at smaller magnitude. Bounded revision of session 175 Option α (scrollY=0 thesis preserved; pinned-state thesis revised).
- **`HERO_BOTTOM_EDGE` export** — value updates from `${HERO_HEIGHT_VH}vh` to `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`. Consumers (`MallPickerChip`, `MallMapDrawer`) inherit compressed bottom edge automatically via existing import; single coupled commit because hero offset + chip pin + drawer pin all track same physical dimension.

### iPhone QA watch-items

- **C1 scroll-and-compress dial** — verify 80px threshold reads as "a bit" not too aggressive or too subtle. Hero pinned compressed state should still show wordmark + SearchBar clearly. Dial `SCROLL_BEFORE_STICKY_PX` if QA flags.
- **Chip + drawer geometry under compression** — chip + drawer should pin flush against compressed hero bottom edge without gap or overlap on iPhone SE / 14 Pro Max. `HERO_BOTTOM_EDGE` calc inherits automatically; verify visually.
- **Combined walk owed**: C1 verification + Round 3 carries from session 175 (Option α + chip flicker now superseded by C1 behavior change; Round 3 walks the new state) + 9 unwalked v0.174 watch-items (combinable into single ~30 min walk).
- **F2 design pass**: implementation pending Arc 1+2+3+4 in session 177+ (~8 commits, ~90 min single-session ship plausible against locked record). Production iPhone QA at Arc 5.

[v0.176.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.176.0

---

## [v0.175.0] — 2026-05-17

### Session 175 — iPhone QA dial bundle on production v0.174.1: /login sub-text + EditBoothSheet typography + iOS keyboard + Home/Saved hero behavior reversal (session 164 D16-D19) + mall chip flicker fix

5 runtime commits + 1 close. David walked production v0.174.1 on iPhone PWA + surfaced findings across 3 rounds compressed into single session. Round 1 shipped surgical 3-fix bundle (C1 /login sub-text bumps + C3 EditBoothSheet iOS keyboard `scrollIntoView` + C2 EditBoothSheet typography size bumps). Round 2 shipped Option α major design reversal — Home hero stops collapsing entirely + Saved gets static in-flow hero (4-file coupled commit reversing session 164 D16-D19 sticky-collapsing-header). Round 3 shipped mall chip flicker fix (5th cumulative firing of `feedback_module_scope_cache_for_warm_nav_hydration` ✅ Promoted at session 168). David ran `/session-close` before completing Round 3 walk continuation on C4+C5 → carries to session 176 as primary validation gate.

First cross-axis firing of `feedback_audit_bounded_enumeration_is_patch_shape` ✅ Promoted at session 174 close — pattern generalizes from un-enumerated SITES (color audit's per-site enumeration) to un-enumerated DIMENSIONS (color vs size as separate audit axes). EditBoothSheet's colors passed WCAG 4.5:1; what failed is absolute SIZE legibility at iPhone arm-length (16/11/11 px), an un-enumerated dimension. David's "Why wasn't this caught?" surfaced this honest scope-bound answer explicitly.

### Added

- **`HERO_BOTTOM_EDGE` export** in `components/HomeHero.tsx` — `${HERO_HEIGHT_VH}vh` constant representing the hero's natural bottom edge in viewport coordinates. Consumers (`MallPickerChip`, `MallMapDrawer`) pin themselves at or below this edge.
- **`cachedMallId` module-scope cache** in `lib/useSavedMallId.ts` — sync warm-nav hydration primitive. `useState` initializer reads cache → hydrates synchronously on warm-nav re-mount. Setter writes cache alongside localStorage + custom-event broadcast. Storage event (cross-tab) also updates cache.
- **`cachedMalls` module-scope cache** in `components/TabsChrome.tsx` — sync warm-nav hydration for `getActiveMalls()` async fetch. Paired with `cachedMallId` for full sync-hydration of `selectedMall` computation on warm-nav.
- **iOS keyboard `scrollIntoView` pattern** at EditBoothSheet booth name input (vendor mode) — `onFocus` handler with `setTimeout(300)` + `scrollIntoView({ block: "center", behavior: "smooth" })`. 300ms delay clears iOS keyboard slide-up animation (~250ms) + sheet entry transition (340ms). Captured `target` const avoids stale ref.

### Changed

- **`/login` top sub-text** ("Enter your email to continue on Treehouse Finds.") — 18 → 20px Cormorant italic + weight 400 → 500. Third bump on this string (14→16 session 153, 16→18 session 169, 18→20 here).
- **`/login` bottom sub-text** ("We'll email you a sign-in link — no password needed.") — 14 → 16px Cormorant italic + weight 400 → 500. Paired with top sub-text bump.
- **EditBoothSheet title** ("Edit booth name") — 16 → 20px Cormorant.
- **EditBoothSheet eyebrow** ("Kentucky Treehouse · America's Antique Mall") — 11 → 13px italic Cormorant.
- **EditBoothSheet helper** ("Booth number and location are managed by Treehouse Finds...") — 11 → 14px italic Cormorant (matches /login bottom sub-text for cross-surface Cormorant italic helper-voice consistency).
- **Home hero behavior** — `position: sticky; top: calc(STICKY_THIN_HEIGHT - 33vh)` collapsing-header → `position: sticky; top: 0; height: 33vh` (stays at full 33vh pinned to viewport top throughout scroll). Page content scrolls under the full hero + chip. NO COLLAPSE.
- **Saved hero behavior** — sticky-collapsing → `position: static` (renders in document flow at top of page; scrolls away with content). Identity beat that scrolls with content, not sticky chrome.
- **`MallPickerChip` sticky top** — pins at `HERO_BOTTOM_EDGE` (33vh) so it sits flush against hero's bottom edge throughout scroll.
- **`MallMapDrawer` top calc** — `calc(HERO_BOTTOM_EDGE + 48px)` ≈ 318px on iPhone SE; MallPickerChip stays visible above drawer as dismiss affordance.

### Removed

- **Session-166-dial-3 drawer-open auto-scroll effect** (~30 lines) in `components/TabsChrome.tsx`. Retired as scope-adjacent dead-code byproduct of Option α per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. The auto-scroll forced scrollY to ~190px on drawer-open at scrollY=0 so hero would collapse out of drawer's render area. With Option α the hero stays full 33vh sticky at top:0 throughout scroll — drawer pins regardless of scrollY, no "drawer behind hero" race to resolve.
- **`HERO_STRIP_HEIGHT_HOME`** (`"calc(max(14px, env(safe-area-inset-top, 14px)) + 144px)"`) + **`HERO_STRIP_HEIGHT_SAVED`** (`"90px"`) + **`stickyThinHeight` ternary** + **calc-based negative-offset sticky positioning** in `HomeHero.tsx`. All dead code post-Option α.
- **`STICKY_THIN_HEIGHT` export** — renamed to `HERO_BOTTOM_EDGE` (semantic-meaning change; the export now represents the hero's natural bottom edge, not a collapsed thin-strip value). Sub-pattern of `feedback_dead_code_cleanup_as_byproduct` extended from code deletion to identifier semantics.

### Fixed

- **EditBoothSheet booth name input** keyboard covers most of sheet on iOS Safari (David's verbatim: "when edit is selected the keyboard covers most of it. This shouldn't happen.") — fixed via `onFocus` handler + `scrollIntoView({ block: "center" })` with 300ms delay clearing keyboard slide-up + sheet entry transition.
- **Mall chip flicker on Saved → Explore warm-nav** (David's verbatim: "The mall chip flickers when navigating from Saved to Explore (takes a split second to load)") — module-scope caches for `malls` + `mallId` enable sync hydration on warm-nav re-mount of TabsChrome; chip mounts with correct mall name immediately, eliminating "All Kentucky locations" → mall-name text flip.

### iPhone QA watch-items

1. **C4 Option α Home hero behavior** — verify hero stays full 33vh sticky during scroll (no collapse); page content scrolls under hero + chip. ~33vh hero + 48px chip = ~318px fixed chrome on Home during scroll (~40% iPhone SE viewport). Trade accepted at Option α pick: identity presence + simplicity over feed real estate.
2. **C4 Option α Saved static-in-flow** — verify hero renders inline at top + scrolls away with content (no sticky behavior on Saved).
3. **C4 MallMapDrawer drawer-open at scrollY=0** — opens cleanly below hero + chip without auto-scroll jank (auto-scroll effect retired).
4. **C5 chip warm-nav sync** — chip mounts with correct mall name on Saved → Explore nav (no "All Kentucky locations" flash). First cold mount may still show brief unhydrated state — acceptable since warm-nav was the surfacing path.
5. **C3 iOS keyboard scroll behavior** — booth name input scrolls into center of visible viewport after keyboard slides up (~300ms delay).
6. **C2 EditBoothSheet typography** — 20/13/14 px sizes read comfortably at iPhone arm-length without feeling oversized.
7. **C1 /login sub-text prominence** — 20px italic 500 + 16px italic 500 read prominent without feeling heavy.

[v0.175.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.175.0

---

## [v0.174.2] — 2026-05-17

### Session 174 final close — CLAUDE.md addendum integrating v0.174.1 Round 2 hotfix narrative

Docs-only patch increment per Shape A versioning ("still bump for docs-only sessions so timeline stays continuous"). Integrates the v0.174.1 hotfix arc into the session 174 full block, updates CURRENT ISSUE to point at v0.174.1 production state, refreshes session 175 opener with v0.174.1-aware iPhone QA framing. No runtime code changes.

### Changed

- **CLAUDE.md session 174 full block** — extended with `### Round 2 hotfix — v0.174.1` subsection covering David's Saved Browse #1 finding + 3-file visual hierarchy ship (SavedMallCardV2 article bg flip + mall-section card wrapper, AccordionBoothSection trailing empty row, SavedFindRow card → warm). Worktree-drift-resolution pattern fired 2nd cumulative time post-promotion (session 153 was 1st post-promotion firing).
- **CURRENT ISSUE** — Last updated date stays 2026-05-17; production reference updated `v0.174.0` → `v0.174.1` with hotfix merge SHA `a40d0b5`; recommended next session unchanged (iPhone QA on v0.174.1 contrast sweep + Saved visual hierarchy paired with launch-gaps strategic session).
- **Session 175 opener** — pre-filled opener block updated to reference v0.174.1 + 6 contrast-sweep watch-items extended with 3 Saved-visual-hierarchy watch-items from v0.174.1.

[v0.174.2]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.174.2

---

## [v0.174.1] — 2026-05-17

### Session 174 hotfix — Round 2 Review Board (Saved Browse #1): visual hierarchy on /flagged

Mid-session hotfix on top of v0.174.0 per Shape A versioning (patch increment). David's Round 2 iPhone QA finding post-v0.174.0 ship: *"change bg of the card container for the booth list to v2.surface.warm. But keep the mall section and booth sections (not the saved finds) the surface card color. Then add an empty row after the last item saved on the list and keep it the v2.surface.warm color."* Single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — 3 file changes causally linked for visual hierarchy to read coherently.

Two clarifications resolved at opener per `feedback_user_clarification_restate_interpretation` ✅ Promoted (~23+ cumulative firings) + `feedback_v2_options_before_drafting` ✅ Promoted: mall section scope = "Full top portion" (mall header + DistancePill + Take the Trip + finds-waiting eyebrow) + empty row height = "Half-row breathing space" (~44px). Both recommended picks.

### Changed

- **`components/v2/SavedMallCardV2.tsx`** — outer `<article>` bg: `v2.surface.card → v2.surface.warm`. NEW inner `<div bg: v2.surface.card>` wrapper around full mall-section top portion (head-δ + Take the Trip + finds-waiting eyebrow). Reads as "warm container with card identity at top."
- **`components/v2/AccordionBoothSection.tsx`** — NEW trailing empty row at end of expanded body (aria-hidden, height 44px, `bg: v2.surface.warm`, borderTop 1px `v2.border.light`). Matches SavedFindRow separator pattern; reads as "completion row" extending warm-rows zone below last entry.
- **`components/v2/SavedFindRow.tsx`** — row bg: `v2.surface.card → v2.surface.warm`. Find rows recede as "warm casual rows" against booth body's card surface.

### iPhone QA watch-items

- **`SavedFindRow:138` save bubble bg** is `v2.surface.warm` — now matches row bg; only 1px border + green leaf icon distinguishes bubble. May visually disappear; one-line dial to `v2.surface.card` if reads "lost in the row" on real device.
- **Hairline contrast** — `SavedFindRow` borderTop 1px `v2.border.light` against warm bg (vs previous card bg); watch for softer separator read.
- **Booth-to-booth seam** — between two `AccordionBoothSection`s the article's warm bg shows briefly + the next section's borderTop hairline; should read as natural section break.

[v0.174.1]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.174.1

---

## [v0.174.0] — 2026-05-17

### Session 174 — Contrast fix-bundle implementation (Arcs 1-4 against locked audit) + iPhone-QA-driven Shape β system-wide sweep (Arc 5) + lint baseline 99 → 0

18 runtime commits + 1 close. Largest single-session contrast pass on record + the cleanest live demonstration of `feedback_kill_bug_class_after_3_patches` ✅ Promoted firing at audit-execution scope. David opened with `/session-open`; standup recommended fix-bundle implementation against the now-fresh `docs/contrast-audit.md` per session 173 close opener. David: *"yes."* Per `feedback_v2_options_before_drafting` ✅ Promoted + `feedback_triage_cost_shape_before_design_pass` ✅ Promoted, surfaced REC-3 (lint script vs token split) + REC-4 (italic-serif brand voice scope) as cost-shape triage at opener to batch brand/arch context-switch vs mid-session. David picked **REC-3 Lint script** (smallest blast radius, namespace stable, tooling investment as structural backstop) + **REC-4 audit recommendation** (all 4 Cormorant italic Tier 1 sites promote to `v2.text.primary`).

Arcs 1-4 shipped 13 commits sequenced smallest→largest with build clean at every commit boundary, vendor-flow first per REC-5 + `project_vendor_value_first_prioritization` ✅ Promoted. **29th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted** validated across 29+ different features — audit ran as execution spec; zero design calls + 2 brand/arch picks resolved at opener as cost-shape triage; multiple audit-description + line-number drifts caught + handled via grep-localization per `feedback_subagent_dispatch_catches_audit_drift` ✅ Promoted (BoothPage:596→:644, :688→:736, shelf:210→:243, find/[id]:1125 description drift, find/[id]/edit:601→:602, audit-missed :234 + :882 + ShareSheet's audit-paired icon all surfaced + handled via `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted byproduct cleanup pattern).

David's iPhone QA on Vercel preview surfaced THE bug-class moment: **"I am still seeing areas where it's difficult to read"** with a Review Board finding on `/login` "muted font color still appearing `color: var(--th-v2-text-muted)`". Diagnosed gap — the audit's per-site enumeration was scope-bounded to ≤14px text + 15-16px italic; the systemic recommendation #1 said "retire `v2.text.muted` as a TEXT color entirely" but the execution only swept enumerated sites. **75% miss rate on `/login` alone** (audit enumerated 1 of 8 in-scope muted sites; the other 7 were "≥15px non-italic muted assumed legible" — David's QA invalidated the audit's assumption: muted is #A39686 on #E6DECF = **2.16:1 which fails WCAG AA at any size, italic or not**).

Per `feedback_kill_bug_class_after_3_patches` ✅ Promoted (3rd attempt — audit enumeration + execution + QA — escalates to structural fix) + `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted (per-site enumeration was the patch shape; system sweep + lint enforcement is the structural-fix shape), cost-shape triage surfaced 3 shapes Shape α (user-facing only, defer admin) vs Shape β (system-wide all 99 baseline) vs Shape γ (per-site triage). David picked **Shape β — System-wide sweep, all 99 baseline**. Arc 5 shipped 5 commits + lint extension + baseline doc update: 36 files swept across vendor-flow (Arc 5.1, 8 files) + auth/shopper (Arc 5.2, 7 files) + shared chrome (Arc 5.3, 12 files) + admin/Review Board (Arc 5.4, 9 files) + lint extension catching v1.inkFaint + Lucide bare-JSX icons (Arc 5.5) + baseline doc updated with decay-tracking table. **Baseline dropped 99 → 0.** Contrast bug class structurally closed.

Tooling additions: `scripts/lint-contrast.ts` modeled after session-162 `lint-shared.ts` pattern (detection: `color: v[12].(text.muted|inkMuted|inkFaint)` inline + TSX prop; allowlist: comments + placeholder context + decorative ≥22px icons via library-prefix OR bare-PascalCase JSX heuristic + size threshold). `npm run lint:contrast` registered as 6th lint script alongside spacing/colors/fonts/shadows/radius. Warn-not-fail per session 143 lock — calibration debt baseline, regression detection on new callsites. `docs/contrast-lint-baseline.md` ships as living document with decay tracking (Arc 4 init: 99 → Arc 5 close: 0).

### Added

- **`scripts/lint-contrast.ts`** (NEW, 134 LOC) — contrast token-compliance lint per REC-3 architectural pick. Detects `v2.text.muted` / `v1.inkMuted` / `v1.inkFaint` used as prose color; allowlists per-line based on comment / placeholder / ≥22px decorative icon (two-tier: prefix-name libraries + bare-PascalCase JSX for Lucide). Warn-not-fail.
- **`docs/contrast-lint-baseline.md`** (NEW) — living document tracking baseline decay session-over-session. Initial entries: Arc 4 init (99) + Arc 5 close (0; Δ −99).
- **`npm run lint:contrast`** — 6th lint script registered in `package.json` alongside spacing/colors/fonts/shadows/radius.

### Changed

- **System-wide v2.text.muted retirement as prose color** (Arc 5 Shape β) across **36 files / ~114 sites** (vendor-flow first per REC-5):
  - Vendor-flow (Arc 5.1, 8 files): `vendor-request` + `post/tag` + `setup` + `AddBoothSheet` + `AddBoothInline` + `EditBoothSheet` + `AddBoothTile` + `BoothPickerSheet`
  - Auth + shopper (Arc 5.2, 7 files): `login` + `welcome` + `admin/login` + `find/[id]` + `(tabs)/page` + `my-shelf` + `contact`
  - Shared chrome (Arc 5.3, 12 files): `MallScopeHeader` + `MallSheet` + `BoothPage` + `BoothLockupCard` + `SearchBar` + `EmptyState` + `FeaturedBanner` + `PhotographPreview` + `PostingAsBlock` + `TreehouseMap` + `VendorCTACard` + `BoothFormFields`
  - Admin + Review Board (Arc 5.4, 9 files): `admin/RelinkSheet` + `admin/VendorsTab` + `admin/ForceDeleteConfirm` + `admin/InviteVendorSheet` + 5 `review-board/*` files
  - Targets: `v2.text.muted → v2.text.secondary` + `v1.inkMuted → v1.inkMid` + `v1.inkFaint → v1.inkMid` (all #5C5246, passes WCAG AA 5.71-7.45:1 on all 4 in-scope backgrounds; preserves v1 namespace on v1-layer files)
  - Preserved per audit recommendation #1: border consumers + conditional ternary branches + placeholder template-literal at `SearchBar:181` (`${v2.text.muted}` syntax bypassed bare `color:` pattern naturally)
- **Arc 1 — Decoration retire (17 sites, 4 commits):** `textDecorationStyle: "dotted" → "solid"` + `textDecorationColor: v2.text.muted | v1.inkFaint → v2.border.light` across vendor-flow (BoothPage:648 + find/[id]/edit:514) + chrome primitives (MallScopeHeader + DestinationHero + BoothLockupCard) + auth/onboarding (login + setup + welcome + vendor-request × 3) + v1-layer shopper (find/[id] × 3 + shelf/[slug]:261). Decoration retire ships FIRST per REC-2 + `feedback_kill_bug_class_after_3_patches` so Arc 2 replace_all is structurally safe.
- **Arc 2 — Tier 2 sweep + REC-6 state-conveying icons (24 sites, 3 commits):** post/preview + me + ShareSheet (Arc 2.1, +ShareSheet:1162 PiLeafBold per REC-6) + find/[id]/edit (Arc 2.2, +audit-missed :234 drift) + shopper-flow REC-6 icon pairs (Arc 2.3, PinCallout:184 MapPin + login:732+733 + vendor-request:822+823 PiEnvelopeSimple+text per REC-6 "icon + text it prefixes are same scope unit").
- **Arc 3 — Tier 1 ship + REC-4 italic-serif (16 sites, 5 commits):** BoothPage (Arc 3.1, 4 sites incl audit-missed :882 byproduct) + find/[id]/edit (Arc 3.2, 3 sites with audit description drift surfaced) + auth/onboarding REC-4 picks (Arc 3.3, 4 italic-serif → primary per David's pick + handle:282 helper → secondary) + v1-layer shopper (Arc 3.4, 3 sites with audit description drift surfaced) + Saved chrome (Arc 3.5, SavedMallCardV2:168).

### Fixed

- David's iPhone QA finding (`/login` muted font color persisting in computed styles) — closed structurally via Shape β system sweep. All 8 in-scope `/login` muted sites now retired to `v2.text.secondary` (passing WCAG AA 5.71-7.45:1 on all backgrounds).

### iPhone QA watch-items

- **Decorative `·` bullet separators** (PostingAsBlock + VendorsTab) — visually darken slightly from muted → mid (same family, just less ghostly); acceptable variation OR one-line dial-back per site if reads "too prominent / pulling attention."
- **"(optional)" italic suffixes** after form labels — darken to mid; potentially reads more prominent than intended (subordinated label decoration); dial back if needed.
- **Dotted-decoration source colors** at find/[id]/edit:506 + other italic-serif Tier 1 sites swept to primary per REC-4 — voice trade-off acknowledged (loses some soft editorial-register voice); dial back specific sites to secondary if italic stroke loss + primary tier reads heavy.
- **BoothPage :509 chevron `▾`** (Cormorant 20px decorative, sweep visually darkens) — defer classification; iPhone QA dial if reads heavy.
- **`/shelf/[slug]:227` Heart icon** (size 32 decorative on NotFound) — was preserved per audit ≥22px exclusion + post-Arc-5 lint allowlist; should still read muted but darker on cream bg.
- **`/vendor-request:544` PiCamera 28px + opacity:0.75 compound risk** — single-line dial (drop opacity to 1.0 OR promote color tier) if camera placeholder reads ghostly on real device.

[v0.174.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.174.0

---

## [v0.173.0] — 2026-05-17

### Session 173 — Design-reviewer subagent registration validated via real dispatch + 4 audit-doc RECs applied to `docs/contrast-audit.md`

4 audit-doc commits + 1 close (docs-only session — no runtime code changed). Shape A gameplan move #1 follow-on per session 172 close opener. Validates subagent registration end-to-end via real `subagent_type: "design-reviewer"` Agent tool dispatch (vs session 172's inline-threaded `general-purpose` workaround per `reference_subagent_registration_session_start_only` ✅ Promoted) — agent registered from disk at session N+1 exactly as the platform fact predicted. Reproducibility check: 4 of 6 session-172 RECs reconverged + 2 sharpenings; critical NEW finding the static audit doc AND session 172 dispatch both missed — 13 omitted decoration sites (76% miss rate vs audit's 4 enumerated) — recommends arc re-sequencing so decoration retire ships FIRST, dissolving mixed-consumer collision class before ARC-2 `replace_all` runs.

All 4 advisory-actionable RECs applied to `docs/contrast-audit.md` per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted (+150/-18 lines, ~470+ cumulative firings); audit doc now sets up session 174's fix-bundle implementation as clean execution pass against fresh substrate. REC-3 (lint-script vs token-split architectural pick) + REC-4 (italic-serif brand voice scope) deferred to session 174 implementation opener — both need David's brand/arch input.

### Changed

- **`docs/contrast-audit.md` — 4 RECs applied via session 173 design-reviewer dispatch:**
  - **REC-1 (Launch-blocking) — re-baseline:** Token reference table updated with current resolved hex values from `app/globals.css` `:root` (verified session 173 via direct file read; supersedes any stale values cited elsewhere in doc). NEW "WCAG ratios reference matrix" section after Token reference computes 12 fg×bg pairs via Python WCAG 2.x relative-luminance algorithm as ground-truth reference for all offender rows. Notes bg.main 23.9% drop since session 168 (`#FBF6EA` → `#E6DECF`) and `v1.paperCream` as WORST-case canvas at 2.45:1 (not tabulated in original audit). 5 key findings derivable from matrix: muted FAILS on ALL 4 backgrounds (even highest-contrast `v2.surface.card` at 2.82:1 fails AA-large + non-text 3:1); secondary PASSES AA on ALL 4 (universal safe target); primary PASSES AAA on ALL 4.
  - **REC-2 (Launch-blocking) — 17-site enumeration + arc re-sequence (single coupled commit):** Bonus pattern table reorganized into 3 subsections (9 in-scope `v2.text.muted` decoration sites + 8 in-scope `v1.inkFaint` decoration sites + 4 post-flow excluded sites). Audit's BoothPage line :600 corrected to :648 (line drift post-session-171). Systemic recommendation #3 updated 4 → 17 instances + mixed-consumer collision risk flagged + sequencing-first guidance added. "Recommended fix-bundle sequencing" RE-ORDERED: OLD order (Arc 1 Tier 1 → Arc 2 Tier 2 sweep → Arc 3 Bonus → Arc 4 Token) → NEW order (Arc 1 Decoration retire → Arc 2 Tier 2 sweep (now safe) → Arc 3 Tier 1 ship → Arc 4 Token enforcement). Each arc gains vendor-flow-first sub-sequencing per REC-5. Arc 4 promoted from "(optional)" — JSDoc-only enforcement insufficient per `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted; lint-vs-token-split call deferred to session 174 opener. Session estimate updated 60-90 min → 75-105 min (Arc 1 expanded 4 → 17 sites).
  - **REC-5 (Medium) — vendor-value sequencing framing:** NEW "Vendor-value sequencing framing (session 173 — REC-5)" section before "Recommended fix-bundle sequencing." Identifies 6 vendor-flow files in scope (`/find/[id]/edit` + `/post/preview` + `/post/tag` + `/me` + `BoothPage` + `ShareSheet`) for first-within-arc sequencing per `project_vendor_value_first_prioritization` ✅ Promoted. Verbatim implementation-session opener paragraph included so session 174's standup can copy-paste rather than re-derive rationale.
  - **REC-6 (Medium) — icon spot-audit:** Exclusion table row tightened from "Icons >14px in muted" → "Decorative icons ≥22px in muted only"; sub-22px icons + state-conveying icons demoted out of exclusion to NEW "Icon contrast spot-audit (session 173 — REC-6)" section. Grep-derived inventory: 4 state-conveying icons needing color promotion (`ShareSheet:1162` PiLeafBold size 14 / `PinCallout:184` MapPin size 16 / `vendor-request:822` + `login:732` PiEnvelopeSimple size 14); 4 decorative ≥22px icons for iPhone QA spot-check (`vendor-request:544` PiCamera size 28 + opacity:0.75 flagged as COMPOUND RISK at ~1.6:1 effective contrast). Cites WCAG 2.1 SC 1.4.11 3:1 floor for non-text + session 45 precedent invalidation post-session-168.

### Added

- **2 memory files promoted-via-memory** (2nd cumulative firing per `feedback_tech_rule_promotion_destination` ✅ Promoted):
  - **`feedback_subagent_ship_with_validating_test_case.md`** — When shipping a new subagent (or significantly extending an existing one), include a real-input test case dispatch in the same session as the agent ship. Validates trust contract works end-to-end + catches structural design flaws before they reach production use. Session 172 first firing (inline-threaded `general-purpose` workaround); session 173 second firing (real `subagent_type` dispatch validating registration path).
  - **`feedback_subagent_dispatch_catches_audit_drift.md`** — When dispatching a read-only subagent against a static audit/design record/spec doc that was written 5+ sessions ago, the agent's fresh read of current substrate often surfaces drift the static doc missed (stale offender lists / stale baselines / stale exclusion rules / missing offenders). Dispatch as freshness check before treating doc as canonical. Session 172 first firing (bg-baseline drift); session 173 second firing (13 omitted decoration sites + WCAG 1.4.11 floor + worst-case `v1.paperCream`).

### iPhone QA watch-items

None — docs-only session; no user-visible chrome changed. Session 174 fix-bundle implementation will be the QA target.

[v0.173.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.173.0

---

## [v0.172.0] — 2026-05-17

### Session 172 — Design-reviewer subagent + /design-review slash command + validated test case against contrast audit

2 runtime commits + 1 close. Shape A gameplan move #1 from session 171 close — David committed at session 171 to evolve the operating mode away from per-pixel "pixel prompting" toward a design-reviewer agent that takes design authority on structural calls. Session 172 shipped the agent definition + canonical dispatch wrapper end-to-end + ran a real-input test case against `docs/contrast-audit.md` to validate the trust contract.

Audit-first localized no existing subagents at `.claude/agents/` (project or user level — first subagent in the project). 3 cost-shape Qs surfaced + David picked all recommendations: Shape B (agent + slash command, not agent-only) · Pre-implementation design pass (NOT post-implementation pre-QA self-walk) · Always advisory (NOT autonomous on token-layer remaps). The pre-mockup-prose-model-first rule fired — David's session 171 close articulation IS the design; no V1 mockup phase needed.

Test case dispatched the agent against `docs/contrast-audit.md` (47 offenders across 19 files + 3 systemic recommendations from session 171 Explore agent). The agent's structured triage report surfaced **6 substantive RECs the audit had NOT caught**: (REC-1) audit was written against `v2.bg.main = #FBF6EA` but `:root` now resolves `#E6DECF` post-session-168 unification — agent computed actual WCAG ratios via Python (`v2.text.muted #A39686` on `#E6DECF` = 2.16:1, materially worse than audit-implied 2.68:1; recommends re-baseline before ARC-1 ships); (REC-2) systemic "retire v2.text.muted as text color" recommendation demoted to optional in audit's ARC-4 — agent cited `feedback_predicate_accumulating_patches_signals_wrong_shape` + `feedback_kill_bug_class_after_3_patches` + grep-verified 144 callsites / 110 legitimate non-prose consumers, recommends enforcement seam (lint script OR token split with deprecated JSDoc + successor tokens); (REC-3) "italic serif at ≤15px retire" recommendation overstates against Brand Rules editorial voice — agent cited DECISION_GATE Brand Rules row 64 + `feedback_lora_lineheight_minimum_for_clamp` ✅ Promoted (clamp-floor 1.3 NOT "retire at ≤15px"), proposes sharpened scope; (REC-4) ARC-2 `replace_all` per file risks mixed-consumer collision in 6 vendor-flow files (icon + text both using `v2.text.muted` in same file); (REC-5) "icons >14px exempt" exclusion rule predates bg-unification — at #E6DECF (2.16:1) meaningful state icons now fail WCAG 1.4.11 non-text 3:1 threshold; (REC-6) fires vendor-value gate explicitly — bundle composes onto vendor value (6 of 19 files vendor-flow surfaces) not pure shopper polish.

Trust-contract validation: every recommendation carried explicit citation (file:line / memory file with ✅ Promoted status / brand rule row / WCAG ratio computed not assumed / session number). "Outside advisory bounds — needs David's input" section surfaced 4 honest items (italic-serif scope / token-split vs lint architectural pick / audit re-run scope / 1-vs-2-session shape) — agent correctly declined to decide brand calls or cost-shape calls from operating disciplines alone. No vibes language; no per-pixel asks; structured triage shape held end-to-end. The agent works as designed.

David's pick on the 6 RECs: defer all to follow-on session. Session 172 closes as "agent + slash command + validated test case shipped; audit findings deferred." Lets David sleep on the recommendations before picking how to act (especially REC-2 lint-vs-split architectural pick + REC-3 brand-voice call).

**Subagent registration constraint surfaced as platform fact**: Claude Code reads `.claude/agents/` at session start, NOT dynamically. The freshly-shipped `design-reviewer.md` won't dispatch via `Agent({ subagent_type: "design-reviewer" })` until next session. Slash commands at `.claude/commands/` DO auto-register dynamically (confirmed via skill-listing reminder after commit 2). Workaround for same-session validation: thread agent system prompt inline via `general-purpose` dispatch with "STEP 1 — Read your agent definition" as first instruction. Captured as NEW memory file `reference_subagent_registration_session_start_only.md` for future subagent ships.

### Added

- **`.claude/agents/design-reviewer.md`** — Pre-implementation design-pass advisor for Treehouse Finds. Read-only tools (Read, Grep, Glob, Bash); no Edit/Write/NotebookEdit by design. Persona + must-cite trust contract verbatim from David session 171 close ("as long as the explanation can point to sound reasoning from a UI/UX design process I'm good with the calls you make") + acceptable citation sources enumerated (WCAG AA contrast ratios with computed ratios not asserted / Fitts's Law tap targets / scanning patterns / mobile-first density for 40-65 demographic / lattice canonical per `project_layered_engagement_share_hierarchy` / Brand Rules from `docs/DECISION_GATE.md` / digital-to-physical bridge thesis / vendor-value priority gate / project precedent from session blocks / token canonical values from `lib/tokens.ts` / operating-discipline memory files at `~/.claude/projects/.../memory/`) + structural-axes-only output format with 6 explicit ✅/❌ examples + structured triage report shape (Citation / Reasoning / Recommendation / Severity per REC + "Outside advisory bounds" + "Verified against — substrate read" sections) + 7 enumerated anti-patterns (drifting into pixel asks / recommending without citation / auto-applying changes / compromising trust contract for politeness / citing wrong source / vibes-coded language / scope drift beyond dispatch) + project-specific design disciplines composing list (11 promoted memory files the agent must cite when their domains apply).
- **`.claude/commands/design-review.md`** — Canonical dispatch wrapper for the design-reviewer subagent. Verifies target file exists; pre-loads canonical substrate (Brand Rules section + 3 project priority memories + MEMORY.md index + lib/tokens.ts head); dispatches via Agent tool with self-contained prompt threading the must-cite trust contract verbatim; relays structured triage report back without auto-applying. Embedded dispatch prompt template so future sessions get consistent scaffolding. Anti-patterns enumerated explicitly: don't skip substrate read / don't thread per-pixel asks / don't auto-apply / don't compress structured output / don't dispatch on pure-logic work.
- **`memory/reference_subagent_registration_session_start_only.md`** — NEW reference memory capturing the Claude Code platform fact: subagent registration is session-start-only; slash commands register dynamically. Includes the inline-threaded general-purpose workaround for same-session validation (the pattern that produced session 172's test-case triage report). Origin: session 172 dispatch failure ("Agent type 'design-reviewer' not found").

### iPhone QA watch-items

N/A — no runtime app changes. Test case via `/design-review docs/contrast-audit.md` next session validates the subagent registration path end-to-end (~5 min sanity check at session 173 open).

[v0.172.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.172.0

---

## [v0.171.0] — 2026-05-17

### Session 171 — iPhone QA dial bundle ×2 + wordmark swap ×2 + contrast audit (Audit B) + vendor-value priority gate memory + Shape A gameplan locked

14 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA on production v0.170.0. David redirected with **6-item iPhone QA finding bundle on session 170 Shape B re-architecture**: (1) restore Flag the Find button under Price (reverses session 170 Arc 3 retirement on dual-affordance model), (2) tint embedded map snapshot toward cartographic cream palette, (3) increase "Purchase this item at" eyebrow weight, (4) darker mall name color, (5) booth name weight bump, (6) bold variant of booth icon project-wide. Triage cost shape A (6 commits sequenced smallest→largest); 2 load-bearing clarifications via AskUserQuestion (save model dual vs single; map palette CSS-filter vs container-bg vs Mapbox-Studio). Bundle shipped clean; David: "clean."

Pivoted to wordmark swap (`treehouse_updated.png` → overwrites `wordmark.png`); David then re-swapped with cropped version (`treehouse_wordmark.png`) when first version rendered ~10% narrower than original at established display heights. Both swaps optimized via pngquant (176KB → 40KB / 173KB → 41KB, ~77% reductions matching session 104 + 164 brand-asset-optimization precedent).

Second iPhone QA round surfaced **5 new findings + launch-blocking contrast audit ask**: (1) BoothHero hero image flickers on /shelf load — paint in if possible, (2) /shelf scroll-restore should activate only on back-nav not forward-from-/find, (3) bold variant of bookmark icon, (4) reduce mall-name-to-address gap in MallBlock, (5) darker color for "A curated booth by" + **"We need to do a full audit on contrast and legibility for this to launch"**. Per `feedback_recurring_phrase_signals_system` ✅ Promoted, item 5's "this continues to be hard to read" + "I see this also on other pages" + explicit launch-blocker framing = system-level concern. Triage cost shape Audit B (Explore-agent scan → prioritized offender doc) picked over Audit A (defer) and Audit C (lint:contrast script).

Explore agent dispatched in **background parallel** with foreground dial-bundle shipping (first firing of this parallelism pattern — async agent did read-only audit while 5 commits + audit-doc commit shipped in foreground). Audit produced 47 offenders across 19 files (16 Tier 1 critical small italic on secondary/muted; 18 Tier 2 high small upright on muted; 9 Tier 3 borderline; 4 bonus dotted-underline pattern; systemic recommendation to retire `v2.text.muted` as a text-color token entirely).

David's **meta-reflection** at session close: "for about the last 30 sessions I've been what I'd consider 'pixel prompting'... I want to create a team who are experts in UI/UX design and helps make the right decisions together without a lot of my input." Surfaced 3 strategic concerns (map nav topology / found-state ephemerality + onboarding gap / color consolidation 100-shades-of-green) + vendor-value priority concern (paid users are vendors; prioritize vendor-experience + vendor-promotion features over shopper polish). Restated interpretation; proposed gameplan Shape A (4 moves: design-reviewer agent + launch-gaps doc + strategic-vs-tactical session split + color consolidation arc). David picked **Shape A** with the load-bearing trust contract: *"as long as the explanation can point to sound reasoning from a UI/UX design process I'm good with the calls you make."* Vendor-value priority captured as project memory file [`project_vendor_value_first_prioritization.md`](memory/project_vendor_value_first_prioritization.md) — now auto-loaded into every future session-opening standup.

### Added

- **`components/DestinationHero.tsx`** dial bundle — `fontWeight: 600` on eyebrow (C1), `color: v2.text.secondary` on mall subtitle both rendering paths (C2), `fontWeight: 600` on vendor name (C3), CSS `filter: "sepia(0.4) saturate(1.1) hue-rotate(-8deg)"` on Mapbox static snapshot to push light-v11 toward cartographic warm-cream (C4 — Cost-shape A per David's Q2 pick over container-bg + Mapbox Studio paths).
- **Flag the Find button under Price on `/find/[id]`** — full-width primary CTA restoring session-169 round-2 button as DUAL AFFORDANCE with photograph corner save bubble (bounded surface-locked reversal of session 170 Arc 3 thesis "the corner bubble IS the page's primary CTA"). Both affordances toggle same `isSaved` state via React reactivity. Visual: v2.accent.greenMid bg + cream text + outline FlagGlyph (unsaved) → v2.surface.input bg + greenMid text + filled FlagGlyph + 1px border (saved). Padding 10/9 keeps height constant across border toggle. Explore Booth from the prior pair does NOT return per David's singular ask.
- **`docs/contrast-audit.md`** — Audit B deliverable; 47 prioritized offenders across 19 files with file:line + element + font + size + current-token → suggested-mapping. Tier 1 (16 critical) / Tier 2 (18 high) / Tier 3 (9 borderline) / Bonus (4 dotted-underline). Systemic recommendations: retire `v2.text.muted` as text color (preserve for icons + dividers + placeholders); italic serif at ≤15px on warm-cream fails 40-65 demographic (session 46 IM Fell precedent extends to Cormorant + Lora); retire dotted-underline pattern for body text. Recommended fix-bundle sequencing: 4 arcs (Tier 1 ship / Tier 2 sweep / Bonus retire / optional token enforcement). Input for follow-on fix-bundle session.
- **`memory/project_vendor_value_first_prioritization.md`** — NEW project memory capturing David's vendor-value priority gate articulated at session close. Auto-loaded into every future session; runs at session-opening standup as "Does this add vendor value or assist vendors in promoting to shoppers? If not, can it be deferred?" Pairs with `project_treehouse_thesis_digital_to_physical_bridge` + `project_layered_engagement_share_hierarchy`. Includes explicit vendor-value candidate backlog (Share My Shelf revival / vendor profile enrichment / Stripe integration / Analytics+KPIs / vendor onboarding).
- **Global `popstate` listener** installed once-per-tab via module-scope `installPopstateMarker()` on `/shelf/[slug]` mount. Writes `Date.now()` to `sessionStorage` key `th_recent_popstate` on real popstate events (Next.js internal pushState doesn't fire native popstate per `feedback_nextjs_internal_history_calls_clobber_flags` ✅ Promoted). Listener persists across route changes (deliberately not cleaned up — global session-state writer, not per-component state).
- **HTML5 paint-in hints on `<BoothHero>` `<img>`** — `fetchPriority="high"` + `decoding="async"` + browser-cache preloader via `new Image().src = heroImageUrl` in dedicated useEffect once URL is known. Two-layer paint-in: warm-nav re-mounts paint from HTTP cache instantly; cold-start gets ~30-50% faster paint via fetch-priority hint. Closes visible flicker on `/shelf` cold load.

### Changed

- **Wordmark asset `/public/wordmark.png`** swapped twice in same session — first to `treehouse_updated.png` (1211×721, 1.679:1 aspect, ~10% narrower than original script wordmark), then re-swapped to cropped `treehouse_wordmark.png` (1092×601, 1.817:1 aspect, ~3% narrower — much closer to original footprint). Visual identity shift: refined serif Roman "treehouse" + small-caps "FINDS" with hairline rules + sapling glyph above (vs prior script-italic "treehouse" + leaf-on-stem). URL contract `/wordmark.png` preserved so all 5 runtime consumers + email pipeline + 13 mockup/doc references inherit automatically. Final size: 107KB → 41KB (~62% reduction across both swaps via pngquant per session 104 + 164 brand-asset-optimization precedent).
- **`PiStorefront` → `PiStorefrontBold` sweep** across 4 surfaces: BottomNav (Booth tab role-conditional, size 22) · DestinationHero (eyebrow above destination card, size 18) · `/login` (vendor sign-in action card, size 20) · `v2/AccordionBoothSection` (Saved page accordion booth header, size 22). Mirrors session 169 PiLeaf → PiLeafBold project-wide sweep. 2 doc-rot comments updated in same commit per `feedback_dead_code_cleanup_as_byproduct`; 1 historical-retirement comment intentionally preserved at `app/find/[id]/page.tsx:69` for greppability.
- **`PiBookmarkSimple` → `PiBookmarkSimpleBold` sweep** across 2 surfaces: `BookmarkBoothBubble` (BoothHero photo top-right bookmark bubble, size 22) · `/shelf/[slug]` (admin-only inline "Bookmark Booth" button, size 14). All 3 engagement-tier bubbles now render at Bold weight when unsaved (FlagGlyph PiLeafBold + BookmarkBoothBubble PiBookmarkSimpleBold + StarFavoriteBubble PiStar) — visual lattice cohesion across find/booth/mall tiers per `project_layered_engagement_share_hierarchy`.
- **`/shelf/[slug]` scroll-restore** gated on real popstate via the new `th_recent_popstate` sessionStorage marker. Within 1000ms window of marker timestamp = back-nav → restore `pendingScrollY`; outside window OR no marker (forward-nav / fresh deep-link / hard refresh) → `scrollTo(0, 0)`. Marker consumed after read so sibling pages don't reuse same back-nav signal. Closes the "/shelf doesn't load from top when navigating forward from /find" bug class.
- **`BoothPage` `<MallBlock>` mall name `lineHeight`**: `1.3` → `1.15`. Tightens half-leading sum from ~6.3px to ~4.9px visual gap (~22% reduction) between mall name and address. Continues session 153 R10A tightening to the previously-unaddressed half-leading layer. Single-line text (not clamped) so `feedback_lora_lineheight_minimum_for_clamp` doesn't apply.
- **`BoothPage` "A curated booth by" eyebrow color**: `v2.text.secondary` → `v2.text.primary` (the audit's canonical Tier 1 example). Single instance fix; remaining 46 offenders carry as fix-bundle session candidates via `docs/contrast-audit.md`.

### Fixed

- **`BoothHero` hero image flicker on `/shelf` load** via preloader + fetchPriority + decoding hints (see Added).
- **`/shelf` scroll position restoring on forward-nav** via popstate-gated restore (see Changed).
- **`package-lock.json` drift** swept clean alongside close (was modified by mid-session `npm install` to resolve `html2canvas-pro` pre-existing local-env miss per `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted — 11th cumulative firing).

### iPhone QA watch-items

**Bundle 1 (6 commits, dial-class):**
- "Purchase this item at" + vendor name read at proper weight without overshoot; if Cormorant 600 feels heavy, dial to 500
- Mall subtitle reads at secondary not muted; if still quiet, bump to primary
- Map snapshot tints toward warm cream not muddy brown; dial-up sepia(0.55) saturate(1.2) if still grey; dial-down sepia(0.3) drop hue-rotate if too brown
- PiStorefrontBold reads cohesive with PiLeafBold on BottomNav + DestinationHero
- Flag the Find button under Price + photograph save bubble both toggle same state on tap (either affordance, immediate reflection)

**Bundle 2 (6 commits, dial-class + audit doc):**
- MallBlock spacing on /shelf + /my-shelf reads as tightly-coupled lockup; dial address lineHeight 1.55 → 1.3 if still too loose
- "A curated booth by" reads cleanly at primary color
- BookmarkBoothBubble bolder + cohesive with PiLeafBold + PiStorefrontBold lattice siblings
- BoothHero cold-cache walk on cellular — does hero paint with first frame or still flicker?
- /shelf scroll-restore matrix: back from /find restores ✓ · forward from /find lands at top ✓ · deep-link lands at top ✓ · hard refresh lands at top ✓
- PWA wordmark cache — hard-refresh iPhone PWA if old wordmark persists

**Wordmark swap:**
- Aspect ratio 1.875:1 → 1.817:1 (final cropped version) means ~3% narrower at same display height. Watch surfaces sized by height for any "too small" feel; per-callsite height/width prop dial is clean follow-on if needed.

### Mapbox preview-token gap (17-session carry, 156→171)

Production-PWA QA remains authoritative for map-snapshot consumers (DestinationHero map snapshot silently fails on `*.vercel.app` previews per Mapbox token URL allowlist excluding `*` wildcards). ~15 min HITL to provision preview-only token + set `NEXT_PUBLIC_MAPBOX_TOKEN` for Preview Vercel env.

[v0.171.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.171.0

---

## [v0.170.0] — 2026-05-17

### Session 170 — /find/[id] destination hero design-pass + 4-arc Shape B ship

5 runtime commits + 1 close. David opened with a design ask on `/find/[id]` surfacing 4 concerns: (1) save/unsave CTA visually identical to secondary Explore Booth button, (2) "Purchase this item at" eyebrow reads weak vs dominant title + price, (3) mall + booth + map should be one component (secondary hero), (4) page reads as stacked add-ons not cohesive composition. Audit-first read confirmed: items 1–3 are direct consequences of session 169 round 2's additive ship (CTA pair + standalone map snapshot landed as separate refinements). Item 4 is the synthesis question once they stack. Cost-shape triage A/B/C surfaced 3 plausible scopes; David picked **Shape B — re-architect destination as secondary hero**. 3 prose Qs before V1 + 1 prose Q on save bubble weight locked all structural decisions except the destination hero's surface identity. V1 mockup at `docs/mockups/find-destination-hero-v1.html` spanned 3 frames (Anchored card / Distinctive secondary hero / Map-led composition) — David picked **Frame C**. 4 prose Qs on fill-refinement (eyebrow placement / map aspect / card lift / tap surface model) — all recommended picks (clean design pass; no V2 mockup needed). 23 frozen decisions D1–D23 + component contract + 7 Tier B items + 6-item risk register + 4-arc implementation sequencing locked at `docs/find-destination-hero-design.md`. Implementation shipped clean against the locked record (28th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted across 28+ different features — load-bearing operating mode validated yet again).

**Page composition collapses 7 stacked sections → 3 anchors**: Photo hero (with PiLeaf save bubble top-right — primary CTA, lattice canonical 44×44, already on photograph since session 97) → Title + Price (unchanged) → DestinationHero (informational only — eyebrow + mall/booth + tappable map) → page ends. CTA pair retires (Explore Booth + Flag the Find both delete; booth navigation covered by DestinationHero's tappable vendor/booth strip → /shelf/[slug]); "More from this booth" carousel + ShelfSection retire entirely.

### Added
- **`components/DestinationHero.tsx`** — Frame C map-led composition primitive (~275 LOC). Map snapshot fills 16:9 at top of card; mall + booth info as info strip below; eyebrow "Purchase this item at" floats outside above the card. Props: `mallName/City/State/Lat/Lng/Slug` + `vendorName/Slug` + `boothNumber` + `mapLink` (all nullable, defensive throughout). Three independent tap targets per D15: map → `/map?mall=<slug>`; mall subtitle text → Apple Maps via `mapLink` (stopPropagation); vendor + booth strip → `/shelf/[vendorSlug]`. Defensive fallbacks (D17–D20): missing mall coords → map omits + card collapses to info strip; missing vendorSlug → strip renders without Link; missing mapLink → subtitle as plain text; map `onError` → `<img>` hides + Link wrapper stays (Mapbox preview-deployment silent fail per session 156 token allowlist 15-session carry).
- **23-decision design record** at `docs/find-destination-hero-design.md` — D1 page composition / D2 carousel retires / D3 CTA pair retires / D4–D6 save bubble (lattice canonical 44×44 with FlagGlyph weight toggle) / D7–D10 DestinationHero structural shape (16:9 map at top, 2-column info strip below) / D11–D12 eyebrow outside above card / D13–D14 card visual (v2.surface.card + 1px v2.border.light + radius 12 + subtle shadow) / D15–D16 three independent tap targets with stopPropagation / D17–D20 defensive fallbacks / D21–D23 page-level (bg unchanged, title block unchanged, page ends after DestinationHero).
- **V1 mockup** at `docs/mockups/find-destination-hero-v1.html` — 3 frames spanning destination-hero surface identity (Anchored card / Distinctive secondary hero / Map-led) with full page composition each + 7-axis trade-off matrix.

### Changed
- **/find/[id] page composition** — collapses from 7 stacked sections to 3 anchors per Shape B Frame C re-architecture. Inline cartographic block (eyebrow + cardInner IIFE + standalone map snapshot Link) replaced by single `<DestinationHero>` call.

### Removed
- **CTA pair under price retires entirely** — Explore Booth (secondary outlined green-on-cream) + Flag the Find / Remove Flag (primary filled green with saved-state color flip) both delete. Save covered by existing photograph corner bubble (lattice canonical, since session 97). Booth navigation covered by DestinationHero's tappable vendor/booth strip. Surface-locked design reversal of session 169 round 2's "two butts under the price" decision per `feedback_surface_locked_design_reversals` — same product need (primary CTA + secondary booth nav) solved structurally instead of as a button pair.
- **"More from this booth" carousel + `<ShelfSection>` function definition retires** — David's session-170 Q2 pick: "Retire entirely". Booth navigation covered by DestinationHero strip + carousel-isolated state (allItems, ready, stripRef, stripPendingX, stripRestored, findStripScrollKey, handleCarouselTap with writeFindContext swipe-context handoff) all retire as scope-adjacent dead code byproducts per `feedback_dead_code_cleanup_as_byproduct`.
- **Inline cartographic block** (~260 LOC of eyebrow row + cardInner IIFE + standalone map snapshot Link) — all 3 parts collapse into `<DestinationHero>` per single-coupled-commit (3 inline parts must move together). Surface-locked design reversal of session 169 round 2's standalone map snapshot placement — same Mapbox asset + same tap target (/map?mall=), just restructured into the card per Frame C.
- **Page-level dead-code byproducts retire alongside ShelfSection**: `useCallback` import (only consumer was handleShelfReady) · `getVendorPosts` from "@/lib/posts" (only consumer was carousel fetch) · `getVendorPostsCache, setVendorPostsCache, writeFindContext, FindRef` from "@/lib/findContext" (all 4 consumed only inside ShelfSection) · `HomeFeedTile` import (only consumer was per-tile render) · `findStripScrollKey` module helper (only consumer was carousel horizontal scroll-restore) · `shelfReady` useState + `setShelfReady` calls + Phase C QA fix #3 reset hook · `setShelfHasItems` useState (dead destructure half) · `handleShelfReady` useCallback · `shelfReady` gate in scroll-restore useLayoutEffect + `shelfReady` from deps array (document height now stabilizes after `setLoading(false)` without async-fetch growth; staircase retry 100/300/600ms preserved as safety net).
- **`mallSnapshotUrl` direct import on /find/[id]/page.tsx** — only consumer was the inline map snapshot; DestinationHero owns it now.
- **`PiStorefront` direct import on /find/[id]/page.tsx** — only consumers were Explore Booth button (Arc 3) + inline cartographic eyebrow (Arc 2); both retired.

### Fixed
- **Resolved pre-existing local-env build failure** on parked `html2canvas-pro` module (`components/ShelfImageShareScreen.tsx`) via `npm install` at Arc 1 commit-boundary tsc gate. **10th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161 close — memory file from 9 sessions ago saved time today (resolution shape pre-specified the fix: `npm install` not regression hunt).

### iPhone QA watch-items

- `/find/[id]` cold-start composition reads cohesive (3 anchors, not 7 stacked sections); destination hero reads as the "where you go" anchor
- Save bubble on photograph top-right toggles PiLeaf ↔ PiLeafFill on tap; saved-state color flips to v1.green
- DestinationHero map snapshot renders on production-PWA (preview likely silent-fails per session 156 Mapbox token URL allowlist 15-session carry)
- Map snapshot tap routes to `/map?mall=<slug>`; mall map auto-flies to the correct mall scope
- Mall subtitle dotted-underline tap opens Apple Maps deep-link (native maps app, not in-app /map)
- Vendor + booth strip tap routes to `/shelf/[vendorSlug]`
- No CTA buttons under price (entire row retired); no "More from this booth" carousel (entire section retired)
- Back-nav scroll-restore still works after `shelfReady` gate retirement (staircase 100/300/600ms preserved as safety net)
- Photograph + post-it stamp + share airplane bubble + save bubble all render in their canonical session-97/159/169 positions

[v0.170.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.170.0

---

## [v0.169.0] — 2026-05-16

### Session 169 — Review Board walk #3 — 4 iPhone-QA-driven dial rounds across single session

17 runtime commits + 1 close. **New record for single-session refinement chain depth** — extends session 168's 9-rounds-within-one-push-cycle to **4 separate push cycles + iPhone-QA-on-Vercel-preview rounds + dial cycles inside one session**. David's Review Board feedback paste opened the session (8 findings across 6 surfaces); each round shipped + pushed + David QA'd on Vercel preview + surfaced next-round findings = 21 distinct findings acknowledged + closed across 4 rounds. Round 3 unification lock (back-button + profile bubble = v1.iconBubble) conflicted with Round 4 visibility ask (bubble invisible on dark hero photo overlay); design tension resolved cleanly via `variant` prop on shared primitive that preserves the consistency lock as default + restores context-aware visual as the overlay variant. The "ship → push → iPhone QA on Vercel preview → next round" cadence at production-preview velocity compresses dramatically (each round shipped + validated in under 30 min of dial time) without compromising commit hygiene or design-tension surfacing.

### Added
- **`lib/mapStaticImage.ts`** — Mapbox Static Images URL composer primitive. Pure-string helper composing `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+{green}({lng},{lat})/{lng},{lat},{zoom}/{w}x{h}@2x?access_token=...`. Reusable for any future thumbnail-map use case. Returns "" when token absent for graceful fallback. File-top captures the session-156 token URL allowlist gap (preview deployments fail tile fetches silently; production-PWA is authoritative QA).
- **/find/[id] CTA pair side-by-side** — Explore Booth (secondary outlined green-on-cream + PiStorefront glyph, Links to /shelf/[vendorSlug]) on left + Flag the Find (primary filled green) on right. Replaces session-157 single full-width Save-the-Find button per David's session-169-Round-2 design ask.
- **/find/[id] tappable map snapshot** — Mapbox static image (aspectRatio 2.5/1) under the mall/booth card, wrapped in Link to /map?mall=<slug> for spatial-wayfinding tap target. `<img onError>` graceful-hide for preview deployments where token URL allowlist excludes *.vercel.app.
- **/my-shelf "Add a Find" primary CTA** — full-width green button above WindowView (replacing DiamondDivider) with PiCamera glyph. Mirrors /shelf/[slug] Bookmark Booth shape from Round 1; promotes vendor-self primary action from grid-cell dashed tile to primary affordance above the grid.
- **Floating back button on /flagged** — TabsChrome extends drawer-back overlay condition to also render on /flagged (routes to / via fallback). Symmetric to Profile overlay at top-right.
- **`StickyMasthead` optional `bg?: string` prop** — default v2.bg.main backward-compat for all non-passing consumers; /find/[id] + /shelf/[slug] + /my-shelf pass `bg={v2.surface.warm}` so masthead chrome + page bg read continuous on those 3 pages.
- **`MastheadBackButton` + `MastheadProfileButton` `variant?: "default" | "overlay"` prop** — default = v1.iconBubble (Round 3 unification lock for masthead-slot consistency). "overlay" = solid v2.surface.warm + 1px v2.border.light border (pre-Round-3 visual restored as overlay-only contract for floating-overlay context over dark hero photo).
- **Mall lat/lng + slug revived on /find/[id] page state** — retired session 157 alongside LocationActions render; SELECT-side enrichment on lib/posts.ts kept them flowing through unchanged. Revived for map snapshot consumer + Explore Booth Link href.

### Changed
- **System-wide page bg flip on /find/[id] + /shelf/[slug] + /my-shelf**: `v2.bg.main` (#E6DECF) → `v2.surface.warm` (#FBF6EA). Reads as "you've entered a specific physical place" warmer chrome vs (tabs)/ Explore/Saved/Booth-nav default.
- **Back-button + profile-icon system-wide unification → `v1.iconBubble`** — `MastheadBackButton` + `MastheadProfileButton` primitives flipped (v2.surface.warm + border → v1.iconBubble + no border). Inline back-button sweep on 10 v2 user-facing surfaces (login + login/email/handle + post/tag + post/preview + vendor-request + setup + welcome + me + find/[id]/edit + my-shelf local Masthead). Login Help icon also flipped for masthead cohesion. /shelf/[slug] + /contact + /admin/login skipped (already on v1.iconBubble inline). Matches /find/[id]'s IconBubble reference exactly.
- **PiLeaf → PiLeafBold system-wide sweep** — FlagGlyph default `weight` "regular" → "bold" + 8 direct callsites (PiLeafIcon wrapper + HomeFeedTile + SavedFindRow + SavedMallCardV2 + BottomNav + my-shelf empty state + TreehouseMap LeafBubblePin + ShareSheet footer disclaimer). Closes session-97 project-wide bold-retire reversal arc (97 retire → 160 bounded local revival → 169 full canonical promotion).
- **"Take Trip" → "Take the Trip" vocabulary unification** — system sweep across LocationActions.tsx:109 + SavedMallCardV2.tsx:203 + 3 scope-adjacent doc updates. All 4 consumers (LocationActions on /find + /shelf + /map's PinCallout + SavedMallCardV2 on Saved) read identically post-sweep.
- **/find/[id] "Save the Find" / "Saved" CTA copy → "Flag the Find" / "Remove Flag"** — saved-state moves from passive past-tense to explicit-intent verb. ARIA labels updated. Internal `handleToggleSave` + `shopper_saves` DB column + `find_saved` / `find_unsaved` events preserved per `feedback_user_facing_copy_scrub_skip_db_identifiers`.
- **SearchBar typed-text + placeholder color** — `v1.inkPrimary` (#2B211A) → `v2.text.muted` (#A39686). Paired `::placeholder` rule pinned to same hex.
- **BoothTitleBlock top padding** — 36 → 16 (canonical space.s16). Shared primitive; both consumer Skeleton blocks updated in same commit to avoid skeleton-to-real-content jolt.
- **Login content positioning** — `justifyContent: "center"` → `flex-start` + explicit `paddingTop: 24`. Wordmark + form anchored near header.
- **/post/tag layout** — Find + Tag stack vertically + centered at 58% width (was 2-col side-by-side per session 94 D7-2e).
- **/shelf/[slug] Bookmark Booth button placement** — above WindowView (replacing DiamondDivider), not below BoothCloser (session 157 placement).
- **/find/[id] eyebrows** — "Purchase this item at" + PiStorefront glyph 16→18; "More from this booth…" + sibling "Visit Booth →" link 16→18; "More from this booth…" color v2.text.muted → v2.text.secondary for cross-eyebrow consistency.
- **Login subtext readability** — wordmark sub 16→18 + "We'll email you..." 12→14; post/preview subtitle 14→16.

### Removed
- **/find/[id] "Visit Booth →" link** above "More from this booth" header (session 157 Find #6 placement) — round-2 Explore Booth secondary CTA carries booth-navigation now. ChevronRight import dropped (only consumer).
- **/shelf/[slug] + /my-shelf `DiamondDivider` imports** — primitive still exported from components/BoothPage.tsx for any future consumer.
- **/my-shelf WindowView `showAddTile` + `onAddClick` prop wiring** — dashed AddFindTile inside grid retires; promotes to primary CTA above grid.
- **"Take Trip" copy** — system-wide rename to "Take the Trip" across 4 LocationActions consumers + SavedMallCardV2.
- **PiLeaf Regular weight as default** — system-wide flip to PiLeafBold across 9 consumer sites + FlagGlyph default. PiLeafFill (saved/active states) unchanged.

### iPhone QA watch-items
- /find/[id] + /shelf/[slug] + /my-shelf page bg #FBF6EA reads right vs (tabs)/ default #E6DECF.
- v1.postit #fbf3df stamp on #FBF6EA — barely-distinguishable; small dial may be needed if it reads as merging.
- variant="overlay" Profile + Back bubbles render with proper contrast on TabsChrome over HomeHero hero photo (dark woodgrain corner).
- Floating back button on /flagged routes to / cleanly via BottomNav nav from Explore.
- PiLeafBold weight reads as intended across 9 sweep sites.
- /find/[id] CTA pair (Explore Booth left secondary + Flag the Find right primary) reads as dual hierarchy.
- Mapbox static map snapshot renders on production-PWA (preview likely silently failed per session 156 token URL allowlist 15-session carry).
- "Take the Trip" + "Flag the Find" + "Remove Flag" copy reads as clear action-intent vocabulary across all consumers.
- Masthead-page-bg continuity via new `bg` prop (no visible seam on /find /shelf /my-shelf).

[v0.169.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.169.0

---

## [v0.168.0] — 2026-05-16

### Session 168 — Foundation unification (greens + inks + bg) + BottomNav pill restructure + 9 iPhone-QA-driven dial rounds

16 runtime commits + 1 close. The longest single-session refinement chain on record — David's foundation-color-unification ask opened the session; 9 rounds of iPhone-QA-driven dial cycles compounded across the day. Foundation greens + inks consolidated to canonical values via Shape A token-value collapse (zero consumer code changes). BottomNav pill restructured to canonical single-pill computed-position pattern after 2 layoutId-pattern patches failed (per `feedback_kill_bug_class_after_3_patches`). Masthead paddingBottom dialed 12 → 0 → 8 via convergence-via-iteration (shipping endpoints faster than guessing the middle). Background unified system-wide to v2.bg.tabs canonical (#E6DECF) across ~37 v2 surfaces + masthead + body + Mapbox cartographic land base.

### Added
- **Memory file [`feedback_module_scope_cache_for_warm_nav_hydration.md`](memory/feedback_module_scope_cache_for_warm_nav_hydration.md)** — promoted at 4 firings in single session. When an async-state hook (auth / role / vendor / posts) starts at INITIAL_STATE on every mount and flashes guest/loading chrome before settling, add module-scope cache so warm-nav re-mounts hydrate synchronously. Sub-pattern of `feedback_synthesize_existing_row_to_reuse_flow_infra` extended from row-level to state-level synthesis. 4 canonical implementations this session: cachedAuthUser (app/my-shelf/page.tsx), cachedRoleState (lib/useUserRole.ts), cachedShopperAuthState (lib/useShopperAuth.ts), cachedVendorBundle (app/my-shelf/page.tsx).
- **MEMORY.md index** updated with new entry.
- **BottomNav canonical single-pill primitive** — sliding indicator pattern used by Material Design tabs / Vercel docs nav / Linear view switcher. `tabRefs` + `pillGeom` useState + useLayoutEffect re-measure + window-resize listener + `pointerEvents:none`. Replaces 2-rounds-of-failed-patches layoutId approach.
- **TabsChrome auto-close-drawer-on-nav-away rule** — `useEffect` watching `pathname !== "/"` calls `closeDrawer()`. Lives in TabsChrome (Home-chrome contract) not in MapDrawerProvider itself (preserves future cross-surface use cases).
- **BottomNav scroll-storage clearing on Booth tap** — surgical fix so `/my-shelf` lands at scroll=0 on tab nav (preserves /find/[id] back-nav scroll restoration intent from sessions 85+86).
- **SavedEmptyState `<MdOutlineExplore>` icon** — mirrors BottomNav Explore-tab vocabulary so empty-state CTA reads as direct shortcut to that tab.

### Changed
- **`v2.accent.green` `#285C3C` → `#1F4A31`** — collapsed to canonical (matches David's preferred greenDark). 77 consumer surfaces inherit via CSS var.
- **`v2.accent.greenMid` `#3E694F` → `#1F4A31`** — also canonical. Was misclassified at round 1 as "intentional toggle variant"; iPhone QA audit revealed canonical CTA fill across 5 surfaces (all 3 lattice tiers). Saved-state hierarchy preserved by bg-to-cream flip pattern.
- **`v1.green` + `colors.green` `#1e4d2b` → `#1F4A31`** — same canonical (~86 consumers across v1 + v0.2 inherit).
- **6 rgba green derivations updated** to new (31,74,49) source RGB (shadow CTAs, disabled state, v0.2 light/solid/border).
- **`v1.ink-*` + `colors.text-*` ink scale → matching `v2.text.*` canonical values** — v1.inkPrimary `#2a1a0a` → `#2B211A`, v1.inkMid `#4a3520` → `#5C5246`, v1.inkMuted `#6b5538` → `#A39686`, v1.inkFaint `rgba(42,26,10,0.28)` → solid `#A39686`. Same flip for v0.2 textPrimary/Mid/Muted/Faint.
- **`v2.bg.main` `#F7F3EB` → `#E6DECF`** — unifies all v2 surfaces + StickyMasthead chrome with v2.bg.tabs canonical. Body bg (globals.css + layout.tsx inline-style pairing) + Mapbox `--th-v1-basemap-cream` follow.
- **StickyMasthead `paddingBottom: 12 → 0 → 8`** + MASTHEAD_HEIGHT calc `safe+84 → safe+72 → safe+80` (coupled with paddingBottom; spacer must match paint height). Convergence-via-iteration: 12 too gappy, 0 too tight, 8 (canonical space.s8) just right.
- **BottomNav structure** — pill moved from per-tab layoutId target to nav-level single absolute element with `getBoundingClientRect`-driven `x` + `width`. `overflow:hidden` retired (no longer needed; also unclips Saved badge). +114 / −77 LOC.
- **CLAUDE.md** rotated: session 168 = new full block at top, session 167 demoted to mini-block tombstone.
- **package.json** version `0.167.1` → `0.168.0`.
- **/review-board style guide** — `<GreenDriftCallout>` body flipped from "drift exists; pick your tier" → "drift resolved; v2.accent.greenDark preferred for new work." Green section reorganized canonical-first. Ink section restructured to canonical 3-step + hairline. v2.bg.main swatch hex + notes updated to "Unified v2 body + page + masthead chrome."

### Removed
- **layoutId-pill pattern on BottomNav** — replaced by canonical single-pill primitive. Patches at rounds 3-4 (initial=false + overflow:hidden + tween + layout=position) didn't fully constrain; kill-the-bug-class restructure shipped at round 5.
- **`overflow: hidden` on BottomNav `<nav>`** — no longer needed structurally; also unclips the Saved-tab badge that sits at `right: -2` on the icon row.
- **12px masthead `paddingBottom` slab** — set when masthead carried a hairline borderBottom (retired session 156). Border gone → slab persisted without semantic purpose. Now 8 (canonical space.s8 — clear breath without slab feel).
- **`<motion.div initial={...}>` default mount animation on BottomNav pill** — `initial={false}` added at round 3 (subsequently moot after round 5 restructure but kept as defensive default on the canonical pattern).

### iPhone QA watch-items
- /find/[id] post-it stamp contrast against warmer #E6DECF bg (v1.postit #fefae8 unchanged; verify still reads).
- /shelf/[slug] BoothHero composition + post-it readability.
- Form-page bg on /me + /login + /vendor-request + /welcome (warmer cream now).
- Mapbox land base on /map (basemap.cream follows so land + chrome continuous).
- /admin UNCHANGED on purpose (v0.2 namespace); verify no accidental drift.
- BottomNav canonical pill slides cleanly L↔R between Explore/Saved/Booth (vendor) — no corner artifact, contained in nav at all times.
- Masthead 8px breathing room reads right.
- Module-scope cache flash-suppression: tap Booth from another tab as vendor → Masthead + BoothHero + title + mall all paint in one frame, no skeleton flash.
- Inline-hex consumer drift: ~14 inline `#1e4d2b` + 2 `#285C3C` + 19 rgba(30,77,43,*) + 2 rgba(40,92,60,*) still on old hex; mostly low-visibility shadows/glows + admin event-color tags + email CTAs + brand themeColor meta + isSaved heart + BottomNav internal const + 2 style-guide swatches.

[v0.168.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.168.0

---

## [v0.167.1] — 2026-05-16

### Session 167 close — docs, memory, chrome-arc archive context

Closing-ceremony patch on v0.167.0. No user-visible runtime changes. Captures the session's operational learnings + rotates session blocks per the standard close protocol. The session's two meaningful operational ships are already in production:
- **v0.167.0** — Shape A versioning infrastructure (CHANGELOG.md + per-session bump + annotated tags wired into /session-close)
- **Worktree cleanup** — 48 → 5 worktrees + 52 → 3 local claude/* branches retired (operational hygiene; not a code change)

#### Added
- **Memory file `feedback_pre_mockup_prose_model_first.md`** — promoted at first firing. When user has a clear picture in their head, the prose IS the design — skip V1 mockup phase + implement directly. Reserves mockup-first design passes for genuinely-unclear-shape asks. 22-variable budget rule + "too many variables / cancel this" signal handling. Sub-pattern of `feedback_reference_first_when_concept_unclear.md`. First firing was this session (22-variable design pass cancelled → user prose model gave cleaner direction in 2 sentences).
- **MEMORY.md index** updated with new entry.

#### Changed
- **CLAUDE.md** rotated: session 167 = new full block at top, session 166 demoted from full block to mini-block tombstone, session 160 mini-block rotated off entirely (referenced in git history).
- **package.json** version `0.167.0` → `0.167.1`.

#### Archived (not deleted)
- **Chrome-unification work** at [`archive/chrome-unification-v1`](https://github.com/Zen-Forged/treehouse-treasure-search/tree/archive/chrome-unification-v1) on origin. 6 commits including design record (`docs/chrome-unification-design.md`), V1+V2 mockups, BG.png + treehouse_transparent.png assets, full primitive code rewrite (HomeHero / StickyMasthead / MallPickerChip / MallMapDrawer / TabsChrome / lib/chromeTokens.ts). Preserved for future revival; not promoted to production this session per David's "iterate from production baseline" call.

#### Patterns observed (Tech Rule candidates — promote on second firing)
- **Cost-shape triage at META level for tooling/process asks** — David's "how do I version" question → 4 cost shapes (A/B/C/D) surfaced before any implementation. Sub-pattern of `feedback_triage_cost_shape_before_design_pass.md` ✅ Promoted extended from design asks to tooling/process asks.
- **Archive-then-fresh-branch flow for cancelled exploration** — when a multi-commit exploration ends with "don't merge this, iterate from production," canonical move: push HEAD to `archive/*` ref on origin → delete original `claude/*` ref on origin → cherry-pick keepers (e.g., versioning infra) to fresh branch off main → ship fresh branch. Preserves work without polluting main + makes future revival a `git checkout archive/*` away.
- **Worktree cleanup as scope-adjacent operational hygiene** — `gh pr list --state merged --base main` + worktree-list-porcelain + per-branch lookup loop retired 43 of 46 merged worktrees in single pass. Pattern: cleanup is cheap when scoped to `--state merged` (safe by definition) + per-branch worktree-path lookup; the 3 unmerged worktrees flagged for user-discretion.

[v0.167.1]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.167.1

---

## [v0.167.0] — 2026-05-16

### Versioning infrastructure — Shape A (annotated tags + CHANGELOG)

Mid-session David asked "how do I start controlling versioning better." Cost-shape triage surfaced 4 shapes (A tags+CHANGELOG / B + GitHub Releases / C + Vercel promotion gate / D + visual regression). David picked Shape A — lightest, fits pre-beta iteration cadence, composes cleanly with heavier shapes later. Sub-decision on naming scheme: session-aligned `v0.{session}.{patch}` so versions map directly to CLAUDE.md session blocks.

The original session-167 chrome-unification ship (BG.png hero + new wordmark + chip-overlay refinement) was archived to [`archive/chrome-unification-v1`](https://github.com/Zen-Forged/treehouse-treasure-search/tree/archive/chrome-unification-v1) per David's call — too many unknowns surfaced during the design pass; iterate from production baseline going forward. This release ships **only the versioning discipline**, not the chrome change.

#### Added
- **`CHANGELOG.md`** at repo root — this file. Each future entry will be prepended at session close per the updated protocol.
- **`package.json`** `"version"` field bumped `0.1.0` (Next.js scaffold default) → `0.167.0` aligning to session number.
- **`.claude/commands/session-close.md`** updated with new **step 4 (Versioning)** before the Git step + a **post-merge tagging step** in the Git block. At every future session close it now: bumps `package.json`, prepends a CHANGELOG.md entry, includes both in the close commit, then after the squash-merge fires `git tag -a v0.{session}.0 <merge-sha>` + pushes the tag.

#### What this unlocks
- **Named references** — "v0.167" instead of commit SHAs in design conversations + investor updates
- **Rollback targets** — `git checkout v0.X.0` restores any past production state; `git diff v0.X.0..v0.Y.0` shows what changed between any two releases
- **Public timeline** — CHANGELOG.md is a public artifact suitable for investor updates, beta sign-up pages, or just remembering "what shipped when"
- **Hotfix lane** — same-day fix after a session ship goes as `v0.{session}.1`, `v0.{session}.2`, etc., without colliding with the next session's `v0.{session+1}.0`

#### Pre-v0.167.0 history
Sessions 1-166 ran without formal version tags. Detailed narrative lives in [CLAUDE.md](CLAUDE.md) session blocks + [`docs/session-archive.md`](docs/session-archive.md). PRs #1-#46 on [Zen-Forged/treehouse-treasure-search](https://github.com/Zen-Forged/treehouse-treasure-search/pulls?q=is%3Apr+is%3Aclosed) carry per-session squash commits to `main`. Backfilling 166 retroactive tags was deliberately skipped — would inflate the timeline without adding rollback value (each commit SHA on main is already accessible via PR history).

[v0.167.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.167.0

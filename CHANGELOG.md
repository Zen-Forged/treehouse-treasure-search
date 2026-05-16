# Changelog

All notable changes to Treehouse Finds, versioned per session.

**Scheme:** `v0.{session}.{patch}` while pre-beta — patch increments for mid-session hotfix cycles. `v1.0.0` lands at beta launch. Each entry maps directly to the corresponding session block in [CLAUDE.md](CLAUDE.md) — open that block for the full beat-by-beat narrative + memory firings + carries.

Format inspired by [Keep a Changelog](https://keepachangelog.com).

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

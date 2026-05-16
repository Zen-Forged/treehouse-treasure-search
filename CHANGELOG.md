# Changelog

All notable changes to Treehouse Finds, versioned per session.

**Scheme:** `v0.{session}.{patch}` while pre-beta — patch increments for mid-session hotfix cycles. `v1.0.0` lands at beta launch. Each entry maps directly to the corresponding session block in [CLAUDE.md](CLAUDE.md) — open that block for the full beat-by-beat narrative + memory firings + carries.

Format inspired by [Keep a Changelog](https://keepachangelog.com).

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

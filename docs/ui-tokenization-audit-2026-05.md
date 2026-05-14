# UI Tokenization Audit — 2026-05-14 (Session 162, Shape A)

> **Purpose**: Inventory the current design-system state, surface tokenization gaps + consistency drift, and produce a ranked backlog so future sessions can drive toward "the UI can be updated by changing tokens, not consumer-side code." Output of Shape A (audit-only, no consumer changes). Sets the scope for Shape B (style-guide design pass) and Shape C (ship live style guide + close highest-leverage gaps).
>
> **Scope of this audit**: token system inventory (`lib/tokens.ts` + `app/globals.css`), component primitive inventory (`components/ui/` + `components/*.tsx`), inline hardcoded-value violation baselines (5 lint scripts), gap categories, ranked backlog. **No consumer-side changes were made.** Lint scripts added: `lint:colors` / `lint:fonts` / `lint:shadows` / `lint:radius` join the existing `lint:spacing`.
>
> **Companion docs**: [`docs/spacing-scale-status.md`](spacing-scale-status.md) (session 144 spacing baseline) · [`lib/tokens.ts`](../lib/tokens.ts) (canonical token source) · [`app/globals.css`](../app/globals.css) (`:root` CSS variable definitions).

---

## 0. Executive Summary

**Total token-compliance violations (session 162 baseline):** **2,628 across 154 scanned files** in `app/` + `components/`.

| Category | Violations | Files | Lint command |
|---|---:|---:|---|
| Colors (hex + rgba literals) | 1,022 | 87 | `npm run lint:colors` |
| Fonts (inline fontFamily + fontSize) | 939 | 93 | `npm run lint:fonts` |
| Spacing (off-scale padding/margin/gap) | 425 | 82 | `npm run lint:spacing` |
| Radius (off-scale borderRadius) | 187 | 60 | `npm run lint:radius` |
| Shadows (inline boxShadow literals) | 55 | 44 | `npm run lint:shadows` |
| **Total** | **2,628** | — | — |

**Spacing baseline trend:** 415 (session 144) → 398 (session 149, post-Layer 2 kickoff) → **425 (session 162)**. Up 27 from low point — a modest amount of fresh drift across sessions 150–161's feature work. Stay-alert signal, not alarming.

### Top 3 takeaways

1. **The token system is solid; the problem is adoption, not architecture.** Layer 1 (CSS variables + canonical space/radius scales) shipped session 144 cleanly. v1 + v2 tiers each cover ~70+ semantic tokens. The 2,628 violations are mostly inline literals in legacy surfaces (admin, reseller-intel layer) or in features that pre-date v2.

2. **The reseller-intel surfaces account for ~30% of all violations and are intentionally off-system.** `app/decide/page.tsx` + `app/discover/page.tsx` + `app/intent/page.tsx` + `app/enhance*/page.tsx` + `app/refine/page.tsx` + `app/scan/page.tsx` + `app/share/page.tsx` + `app/finds*/*.tsx` run on the dark reseller theme (`#050f05`) explicitly NOT in the v1/v2 token graph (locked in tokens.ts file-top). These should be **excluded from the lint scope** going forward to make the violation count signal-bearing.

3. **`app/admin/page.tsx` is the single biggest in-scope target — 265+ violations across all 5 categories.** v0.2 admin tier never migrated to v1/v2; it's the largest tokenization-debt cluster left.

### Recommended next phases (cascading)

- **Shape B** (1–2 sessions): pick the style-guide form (static markdown / live `/style-guide` route / printable HTML reference) via V1 mockup spanning the structural axis. Design record + Tier B headroom items.
- **Shape C arc 1** (1 session): exclude the reseller-intel layer from lint scope (one-line config change in `lint-shared.ts` `SKIP_DIRS` extension) + add **canonical type scale** (fontSize tokens) which is currently missing.
- **Shape C arc 2** (1 session): ship live `/style-guide` route with real components against real tokens, organized by tier (v1 / v2 / canonical scales) + every Layer 2 primitive rendered against a fixture.
- **Shape C arc 3** (1–2 sessions): close the **app/admin/page.tsx + admin modals tokenization debt** — biggest single in-scope cluster (265+ violations across 6 files).
- **Shape C arc 4** (1 session): extract `<ToggleEngagementButton>` primitive from ShareBubble + BookmarkBoothBubble + StarFavoriteBubble (3rd-consumer extraction trigger met) — closes a long-running carry.

---

## 1. Token System Inventory

### 1.1 Three coexisting tiers + 2 canonical scales

Locked in `lib/tokens.ts`. All values resolve to CSS custom properties defined in `app/globals.css :root` (Layer 1 refactor, session 144). Updating a value = single `:root` edit; ~200 consumer call-sites unchanged.

| Tier | Prefix | Purpose | Active surfaces |
|---|---|---|---|
| **Canonical Scales** | `space.*` / `radius.*` | Project-wide rhythm scales (session 144) | All Layer 2 primitives (`components/ui/`) + any new consumer |
| **v1** | `v1.*` + `FONT_*` | Journal vocabulary (cream paper, IM Fell heritage) | /find/[id], /map, /post flow, /mall, /vendor, /shelves admin |
| **v2** | `v2.*` | Field-guide migration (sessions 138–148; cream-cooler, Cormorant + Inter) | Home, Saved, /find post-v2, /shelf, /me, /welcome, /login, /post (v2-pure end-to-end) |
| **v0.2** | `colors.*` + `spacing.*` | Legacy ecosystem tokens | `app/admin/page.tsx` only (parked migration) |

### 1.2 Canonical scales (Layer 1, session 144)

**`space.*`** — 9 steps: `s2 s4 s8 s12 s16 s24 s32 s48 s64` (px). Locked session 143.

**`radius.*`** — 5 steps: `sm:8` `md:12` `lg:16` `xl:20` `pill:999` (px). Locked Arc 6.1.4.

**Missing canonical scales (gap captured for Shape C):**
- **Type scale** — no `fontSize` token tier exists. Surfaces use raw numerics (11, 12, 13, 14, 16, 18, 22, etc.) inline. **939 fontSize violations** today are all "would need a scale to migrate to."
- **Shadow tier** — `v1.shadow.*` exists with 8 tokens but no v2 equivalent. Session 159 inline polaroid shadow in BottomNav is the 2nd-consumer-extraction trigger; future Layer 2 work folds into `v2.shadow.*` or a top-level `shadow.*` tier.

### 1.3 v1 token tier (full inventory)

Documented in detail by Explore agent 1. Major groups:

| Group | Tokens | Notes |
|---|---|---|
| Colors / surfaces | `paperCream`, `postit`, `paperWarm`, `postcardBg`, `postcardBorder`, `iconBubble` | 6 tokens |
| Ink scale | `inkPrimary`, `inkMid`, `inkMuted`, `inkFaint`, `inkHairline`, `priceInk`, `inkWash` | 7 tokens |
| Accent / states | `green`, `onGreen`, `greenDisabled`, `red`, `redBg`, `redBorder`, `amber`, `amberBg`, `amberBorder` | 9 tokens |
| Radii (legacy) | `imageRadius=6`, `bannerRadius=16`, `radius.input=14`, `radius.button=14`, `radius.pill=999`, `radius.sheet=20` | Pre-canonical-scale; some off-scale (6, 14) |
| Spacing (legacy) | `gap.xs=6`, `gap.sm=8`, `gap.md=12`, `gap.lg=16`, `gap.xl=22` | Pre-canonical-scale; some off-scale (6, 22) |
| Icons | `icon.xs=14`, `icon.sm=16`, `icon.md=18`, `icon.nav=21`, `icon.lg=22`, `icon.xl=24` | Off-canonical-spacing-scale (14, 18, 21, 22) — icon sizes are different vocabulary |
| Shadows | `shadow.polaroid`, `polaroidPin`, `ctaGreen`, `ctaGreenCompact`, `sheetRise`, `cardSubtle`, `postcard`, `callout` | 8 tokens — only shadow tier currently shipping |
| Basemap | `basemap.cream`, `cream2`, `water`, `water2`, `park`, `label` | Mapbox runtime layer overrides (session 156 fix) |

### 1.4 v2 token tier (full inventory)

| Group | Tokens |
|---|---|
| Surfaces | `bg.main` (#F7F3EB), `bg.paper`, `bg.soft`, `surface.card` (#FFFCF5), `surface.warm`, `surface.input`, `surface.error` |
| Text | `text.primary` (#2B211A), `text.secondary` (#5C5246), `text.muted` (#A39686) |
| Accent | `accent.green` (#285C3C), `greenDark`, `greenSoft`, `greenMid`, `accent.red` |
| Brown | `brown`, `brownSoft` |
| Borders | `border.light` (#E5DED2), `border.medium` (#D6CCBC), `border.error` |

### 1.5 v0.2 legacy tier

26 tokens grouped: `colors.bg` / `surface*` / `border*` / `text*` / `green*` / `red*` / `header` / `bannerFrom-To` / `tag*` + `spacing.pagePad/cardPad/sectionGap/contentGap/tileGap`. Single active consumer: `app/admin/page.tsx`.

### 1.6 Font tokens

| Token | Source | Weight stack | Status |
|---|---|---|---|
| `FONT_LORA` | `next/font/google` | 400/500/600, normal+italic | Deprecated, not retired — replaced by FONT_CORMORANT in v2 migration but still loaded for v1 surfaces. Cleanup gated on zero-grep confirmation. |
| `FONT_INTER` | `next/font/google` | 400/500/600/700 | v2 canonical sans (session 138) |
| `FONT_CORMORANT` | `next/font/google` | 400/500/600/700, normal+italic | v2 canonical serif (session 138) |
| `FONT_NUMERAL` | System (Times New Roman) | — | Booth numerals (session 75); project-wide canonical for numeric stamps |
| `FONT_SCRIPT` | `next/font/google` (Dancing Script) | 500 | Loaded session 120, may be orphan post-V3 (see "Cleanup candidates") |
| `FONT_SYS` | System fallback | — | Deprecated; replaced by FONT_INTER in v2 |

### 1.7 CSS variable summary

All tokens (except literal-string shadows + motion tokens) resolve through `:root` CSS custom properties prefixed:
- `--th-v1-*` for v1 tier
- `--th-v2-*` for v2 tier
- `--th-c-*` for v0.2 tier
- `--th-space-N` for canonical space scale
- `--th-radius-{sm,md,lg,xl,pill}` for canonical radius scale
- `--font-{lora,cormorant,inter,dancing-script}` for `next/font/google` font CSS variables

**Single-edit palette flip**: changing `--th-v2-accent-green` in `:root` ripples through every v2 consumer instantly. Layer 1 architecture works. This audit confirms it's load-bearing.

---

## 2. Baseline Violation Counts (Session 162)

### 2.1 Per-category totals

```
$ npm run lint:spacing -- --quiet
Files scanned:    154
Files with debt:  82
Total violations: 425

$ npm run lint:colors -- --quiet
Files scanned:    154
Files with debt:  87
Total violations: 1,022

$ npm run lint:fonts -- --quiet
Files scanned:    154
Files with debt:  93
Total violations: 939

$ npm run lint:shadows -- --quiet
Files scanned:    154
Files with debt:  44
Total violations: 55

$ npm run lint:radius -- --quiet
Files scanned:    154
Files with debt:  60
Total violations: 187
```

### 2.2 Top-10 offenders per category

**Spacing (425 total):**

| File | Count |
|---|---:|
| `app/admin/page.tsx` | 56 |
| `app/find/[id]/page.tsx` | 23 |
| `app/decide/page.tsx` ⚠ | 19 |
| `app/mall/[slug]/page.tsx` | 15 |
| `app/vendor/[slug]/page.tsx` | 14 |
| `components/admin/ReviewRequestModal.tsx` | 14 |
| `components/AnalysisSheet.tsx` ⚠ | 12 |
| `app/vendor-request/page.tsx` | 11 |
| `components/ShareSheet.tsx` | 11 |
| `app/post/edit/[id]/page.tsx` | 10 |

**Colors (1,022 total):**

| File | Count |
|---|---:|
| `app/decide/page.tsx` ⚠ | 108 |
| `app/admin/page.tsx` | 55 |
| `app/discover/page.tsx` ⚠ | 49 |
| `app/mall/[slug]/page.tsx` | 47 |
| `app/share/page.tsx` ⚠ | 40 |
| `app/intent/page.tsx` ⚠ | 39 |
| `app/enhance-text/page.tsx` ⚠ | 38 |
| `app/finds/page.tsx` ⚠ | 38 |
| `components/OpportunityMeter.tsx` ⚠ | 34 |
| `app/scan/page.tsx` ⚠ | 32 |

**Fonts (939 total — fontFamily literals + fontSize numerics):**

| File | Count |
|---|---:|
| `app/admin/page.tsx` | 125 |
| `app/decide/page.tsx` ⚠ | 59 |
| `components/admin/ReviewRequestModal.tsx` | 31 |
| `app/mall/[slug]/page.tsx` | 28 |
| `app/vendor/[slug]/page.tsx` | 28 |
| `components/OpportunityMeter.tsx` ⚠ | 26 |
| `app/find/[id]/page.tsx` | 25 |
| `components/admin/VendorsTab.tsx` | 24 |
| `app/post/edit/[id]/page.tsx` | 23 |
| `app/ui-test/page.tsx` | 19 |

**Shadows (55 total):**

| File | Count |
|---|---:|
| `app/find/[id]/page.tsx` | 4 |
| `app/decide/page.tsx` ⚠ | 2 |
| `app/enhance/page.tsx` ⚠ | 2 |
| `app/finds/page.tsx` ⚠ | 2 |
| `app/post/tag/page.tsx` | 2 |
| `components/BoothPage.tsx` | 2 |
| `components/DevAuthPanel.tsx` | 2 |
| `components/MapCarousel.tsx` | 2 |
| `components/ShelfImageTemplate.tsx` 🅿 | 2 |
| 7 more files at 1 each | 7 |

**Radius (187 total):**

| File | Count |
|---|---:|
| `app/admin/page.tsx` | 29 |
| `app/decide/page.tsx` ⚠ | 13 |
| `app/mall/[slug]/page.tsx` | 7 |
| `app/vendor/[slug]/page.tsx` | 6 |
| `app/shelf/[slug]/page.tsx` | 5 |
| `app/vendor-request/page.tsx` | 5 |
| `components/AddBoothInline.tsx` | 5 |
| `components/AddBoothSheet.tsx` | 5 |
| `components/PinCallout.tsx` | 5 |
| `components/admin/ReviewRequestModal.tsx` | 5 |

> ⚠ = reseller-intel surface, intentionally off the v1/v2 system. Excluding the 8 ⚠ files (decide, discover, intent, share, enhance, enhance-text, refine, scan, finds, finds/[id]) + `OpportunityMeter` + `DecisionDial` + `AnalysisSheet` would drop the total by **~700+ violations** (roughly 27% of all noise). Recommend exclusion in Shape C arc 1.
>
> 🅿 = parked code (session 152 ShelfImageTemplate + ShelfImageShareScreen). Counts as noise; not active surface.

### 2.3 Cross-category hotspots (highest-leverage refactor targets)

Files appearing in 3+ top-10 leaderboards (i.e., wide cross-category drift):

| File | Categories hit | Total est. |
|---|---|---:|
| **`app/admin/page.tsx`** | spacing + colors + fonts + radius (4 of 5) | ~265 |
| **`app/decide/page.tsx`** ⚠ | spacing + colors + fonts + shadows + radius (5 of 5) | ~201 |
| **`app/mall/[slug]/page.tsx`** | spacing + colors + fonts + radius (4 of 5) | ~97 |
| **`components/admin/ReviewRequestModal.tsx`** | spacing + fonts + radius (3 of 5) | ~50 |
| **`app/vendor/[slug]/page.tsx`** | spacing + fonts + radius (3 of 5) | ~48 |
| **`app/find/[id]/page.tsx`** | spacing + fonts + colors + shadows (4 of 5) | ~75 |

After excluding ⚠ reseller-intel surfaces, the **top 5 in-scope refactor targets** are:
1. `app/admin/page.tsx` (~265 violations across 4 categories)
2. `app/mall/[slug]/page.tsx` (~97)
3. `app/find/[id]/page.tsx` (~75)
4. `components/admin/ReviewRequestModal.tsx` (~50)
5. `app/vendor/[slug]/page.tsx` (~48)

**Closing these 5 files would eliminate ~535 violations (~30% of in-scope debt).**

---

## 3. Component Primitive Inventory

### 3.1 Layer 2 primitives (`components/ui/`) — current state

3 primitives shipped session 149 (kickoff):

| File | Description | Consumers |
|---|---|---:|
| `BottomSheet.tsx` | Modal scrim + bottom-sheet container + handle + TopBar | 2 (ShareSheet + 1 other) |
| `ChannelGrid.tsx` | 3-col tile row for share-channel selection | 2 |
| `SlimHeader.tsx` | Entity-discriminated context block (Booth/Mall/Find variants) | 3 |

**Adoption status:** Only ShareSheet has migrated to `<BottomSheet>` primitive. 5+ other modal/sheet patterns (`AddBoothSheet`, `EditBoothSheet`, `BoothPickerSheet`, `AddFindSheet`, `AnalysisSheet`, `ReviewRequestModal`, `RelinkSheet`, `ForceUnlinkConfirm`, `ForceDeleteConfirm`) all carry custom chrome.

### 3.2 Top-level `components/*.tsx` — primitive vs feature classification

**Chrome / layout** (load-bearing, always-present):
- `StickyMasthead.tsx` (14 consumers)
- `BottomNav.tsx` (10 consumers)
- `HomeChrome.tsx` (2)
- `MallScopeHeader.tsx` (?)

**Masthead-slot primitives** (small, single-purpose, multi-consumer):
- `MastheadProfileButton.tsx` (4 consumers, 44×44 geometry locked)
- `MastheadBackButton.tsx` (1 — but used universally on non-Home tabs)
- `MastheadPaperAirplane.tsx` (multi-consumer; sessions 137 share consolidation)

**Engagement bubbles** — **3rd consumer extraction trigger met:**
- `ShareBubble.tsx` (variant: frosted / v2, 2 consumers from day 1 — session 159)
- `BookmarkBoothBubble.tsx` (1 consumer)
- `v2/StarFavoriteBubble.tsx` (0 consumers, DORMANT awaiting Favorite Mall ★)

> **Promotion recommendation**: extract `<ToggleEngagementButton>` or `<AffordanceBubble>` primitive when Favorite Mall ★ ships. All 3 share color-reversal toggle CSS structure (mentioned as session 157 NEW pattern, 2-of-3 trigger met; 3rd consumer triggers promotion).

**Tile primitives** — both meet extraction trigger (3+ consumers each):
- `v2/HomeFeedTile.tsx` (3 consumers, v2 Arc 2)
- `PolaroidTile.tsx` (3 consumers, session 95 Phase 2)

> Both mature in different contexts. No immediate extraction needed; color-reversal CSS pattern (session 157) is the next candidate for shared infrastructure when a 4th tile lands.

**R10/R17 map+location primitives:**
- `DistancePill.tsx` (2 consumers — R17 Arc 2)
- `LocationActions.tsx` (1 — but reused on multiple page renders)
- `PinGlyph.tsx` (2 — session 157)
- `LeafBubblePin.tsx` (1 — TreehouseMap internal)
- `UserLocationPin.tsx` (1 — TreehouseMap)
- `MapCarousel.tsx` (1 — MallMapDrawer)
- `MapControlPill.tsx` (1)
- `PinCallout.tsx` (1)
- `TreehouseMap.tsx` (1 — wrapper for Mapbox GL)

**Other primitives in current rotation:**
- `FlagGlyph.tsx` (Phosphor weight-variant primitive, 2 consumers, session 140 + opt-in `weight` prop session 160)
- `FormField.tsx` + `FormButton.tsx` (form primitives, multi-consumer)
- `EmptyState.tsx` (generic empty-state container)
- `SearchBar.tsx` + `SearchBarRow.tsx` (R16 discovery)
- `BoothHero.tsx` (booth photograph + post-it stamp; shipped session 67)
- `BoothLockupCard.tsx` (mentioned in agent 3 report as 0 consumers — likely retired/parked)
- `MallSheet.tsx` (DORMANT session 158 — kept for revive)

**Parked / dormant (revive vs retire pending):**
- `ShelfImageTemplate.tsx` 🅿 (session 152 within-session retirement; revive contract in file-top comment)
- `ShelfImageShareScreen.tsx` 🅿 (session 152)
- `MallSheet.tsx` (session 158 dormant — verify grep confirms zero consumers)
- `v2/StarFavoriteBubble.tsx` (session 138 dormant — Favorite Mall ★ revival)
- `TabPageMasthead.tsx` (session 107 — 0 consumers; cleanup candidate)
- `AddBoothTile.tsx` + `AddBoothInline.tsx` + `BoothLockupCard.tsx` + `CompCard.tsx` — verify current consumer state (potentially retire)
- `VendorCTACard.tsx` — scheduled cleanup agent monitors; verify still in use

### 3.3 Sheet/modal primitive adoption matrix

| Component | BottomSheet status | Notes |
|---|---|---|
| `ShareSheet.tsx` | ✅ MIGRATED | Reference consumer for `<BottomSheet>` + `<SlimHeader>` + `<ChannelGrid>` (session 149) |
| `AddBoothSheet.tsx` | ❌ Custom chrome | Migration candidate (admin-only, low-risk) |
| `EditBoothSheet.tsx` | ❌ Custom chrome | Migration candidate (admin-only) |
| `BoothPickerSheet.tsx` | ❌ Custom chrome | Mall/booth selection — needs picker primitive |
| `AddFindSheet.tsx` | ❌ Custom chrome | Find creation flow — may need step/validation chrome beyond BottomSheet |
| `AnalysisSheet.tsx` | ❌ Custom chrome | Special motion (sequential fade) — case-by-case |
| `ReviewRequestModal.tsx` | ❌ Custom chrome | Admin modal — different from sheet (centered, smaller) |
| `RelinkSheet.tsx` | ❌ Custom chrome | Admin |
| `ForceUnlinkConfirm.tsx` | ❌ Centered modal | Admin |
| `ForceDeleteConfirm.tsx` | ❌ Centered modal | Admin |

> **Decision needed during Shape C**: extend Layer 2 with `<CenteredModal>` primitive (sibling to `<BottomSheet>`) so admin confirm-dialogs converge.

---

## 4. Gap Categories

Concrete missing pieces of the system, ordered by leverage.

### 4.1 Critical gaps (block tokenization completeness)

**G1 — No canonical type scale.** 939 fontSize violations are all "would need a scale to migrate to." Type rhythm is currently a per-page judgment call. Reference scales (potential lock): 11/12/13/14/16/18/22/26/32 OR a denser modular scale. **Lands in Shape C arc 1 alongside lint scope cleanup.**

**G2 — No v2 shadow tier.** v1.shadow.* covers 8 named shadows; v2 surfaces have inline shadows (BottomNav session 159, PinCallout, MapControlPill, etc.). **Tier B headroom captured session 159** as 2nd-consumer extraction trigger.

**G3 — No centered-modal primitive.** Admin confirm-dialogs (ForceUnlinkConfirm, ForceDeleteConfirm, ReviewRequestModal) each implement bespoke chrome. Layer 2 has BottomSheet for bottom-anchored; needs `<CenteredModal>` sibling.

**G4 — Reseller-intel surfaces pollute lint baselines.** ~700+ violations come from deliberately off-system pages (`/decide`, `/discover`, `/intent`, `/share`, `/enhance*`, `/refine`, `/scan`, `/finds*`, `OpportunityMeter`, `DecisionDial`, `AnalysisSheet`). Fix: extend `SKIP_DIRS` or add a per-surface allowlist file. **One-line change**, makes baselines actionable.

### 4.2 Adoption gaps (token system exists; consumers haven't migrated)

**G5 — `app/admin/page.tsx` v0.2 → v1/v2 migration.** Largest single in-scope cluster: ~265 violations across 4 categories. v0.2 ecosystem-token tier never migrated. Decision needed: migrate to v1 (admin lives alongside vendor flow surfaces on v1) OR carve out v2 admin namespace.

**G6 — `components/admin/*` modal chrome.** 5 admin modals (ReviewRequestModal + VendorsTab + RelinkSheet + ForceUnlinkConfirm + ForceDeleteConfirm) carry their own font/color/radius decisions. After G3 ships `<CenteredModal>` primitive, these can converge.

**G7 — `app/mall/[slug]/page.tsx` lensless on dark theme.** Known carry from session 66 (lensless on v0.2 dark theme; lens applies when this page does v1.x ecosystem migration). Adjacent to G5.

### 4.3 Component primitive gaps

**G8 — Engagement bubble primitive not yet extracted.** Trigger met (3 consumers: Share + Bookmark + Star). Waits for Favorite Mall ★ wiring (next Mall-tier engagement affordance per lattice). When ★ ships, extract `<AffordanceBubble>` / `<ToggleEngagementButton>` with variant discrimination.

**G9 — `<ToggleButton>` engagement-tier CTA primitive not yet extracted.** Save the Find + Bookmark Booth share identical color-reversal toggle CSS (session 157, 2 of 3 lattice tiers). Triggers on 3rd consumer (Favorite Mall ★ CTA button, not bubble — likely on a future mall surface).

**G10 — `<DimensionPill>` / `<StatusPill>` not extracted.** DistancePill (R17), MapControlPill (Reset), the admin status pills (DISCONNECTED / PENDING / UNLINKED / LINKED / COLLISION) all share pill shape + token-driven color blocks. Triggers on next pill-shape consumer.

### 4.4 Documentation gaps

**G11 — No master style guide.** This audit is the start. Shape B picks form (static doc / live route / printable). Shape C ships.

**G12 — No per-token usage docs.** `lib/tokens.ts` has rich top-of-file comments but no per-token "use this for X" guidance. Style guide should make each token addressable + show real usage.

**G13 — Stale `docs/design-system.md` snippets.** Wordmark spec stale per session 87 carry; "session N retired X" comments scattered across files (session 116 noted ~9–10 doc-rot comments). Stale-comment audit could be done alongside style-guide ship.

---

## 5. Ranked Backlog

Ordered by leverage × confidence. Each item names the next session arc + estimated cost.

### Wave 1 — Make the baselines actionable (1 session, Shape C arc 1)

1. **Exclude reseller-intel surfaces + ui-test from lint scope** (`scripts/lint-shared.ts` SKIP_DIRS extension or per-file allowlist). One-line change. Drops baseline by ~700+ violations → actionable count becomes ~1,900.
2. **Add canonical type scale to Layer 1** (`type.size.{xxs,xs,sm,md,lg,xl,xxl}` or numeric `type.t11/t12/t13/t14/t16/t18/t22/t26/t32`). Add `:root` CSS vars + token exports. **NO consumer changes** in this commit — the scale exists for future migration.
3. **Re-run baselines** after both changes. Update this audit doc with new counts.

### Wave 2 — Ship the master style guide (1–2 sessions, Shape B + Shape C arc 2)

4. **Shape B design pass**: V1 mockup spans the style-guide-form structural axis (static doc vs `/style-guide` live route vs printable HTML). Locked decisions; design record committed.
5. **Shape C arc 2**: ship the picked form. Sections — Foundations (palette, type, space, radius, shadow) / Components (every Layer 2 primitive with real fixtures) / Patterns (engagement lattice, sheet/modal stack, masthead slots) / Tokens-by-tier (v1 / v2 / canonical / v0.2 dormant).

### Wave 3 — Pay down the in-scope debt (3–4 sessions, Shape C arcs 3+)

6. **`app/admin/page.tsx` v0.2 → v1 migration arc** (~265 violations, largest single in-scope target). Migrate colors + fonts + spacing + radius in coupled commits per session 132's coupled-token-commit pattern. Test against admin walkthrough.
7. **Admin modals consolidation** (`<CenteredModal>` primitive extraction + 5 consumers migrate: ReviewRequestModal, RelinkSheet, ForceUnlinkConfirm, ForceDeleteConfirm, AddFindSheet centered variants). Eliminates ~80+ violations.
8. **`<AffordanceBubble>` extraction** when Favorite Mall ★ ships (lattice closure for Mall engagement tier).
9. **`app/mall/[slug]/page.tsx` migration to v1/v2 system** (~97 violations; lens applies post-migration).
10. **`app/find/[id]/page.tsx` adoption sweep** (~75 violations on a v2-migrated surface — drift since last session-141 v2 ship).

### Wave 4 — Layer 2 primitive library completion (ongoing, multi-session)

11. **Sheet/modal migrations**: AddBoothSheet + EditBoothSheet + BoothPickerSheet + AddFindSheet → `<BottomSheet>`.
12. **Parked-code retirement pass**: ShelfImageTemplate + ShelfImageShareScreen + paper.png + html2canvas-pro dep (10-of-3 threshold exceeded per CLAUDE.md carry).
13. **Dormant token cleanup**: FONT_LORA + FONT_SCRIPT + FONT_SYS retirement confirmation via grep audit.
14. **Doc-rot comment audit**: ~9–10 references to retired components/patterns in inline comments (session 116 carry).

### Wave 5 — Beyond Shape C (style guide as living doc)

15. **Lint scope ratchet**: add `--fail-on-increase` mode that fails CI when violation count grows. Style guide becomes load-bearing for "what tokens exist."
16. **Codemod tooling**: scripts to bulk-migrate hex literals → token refs for high-confidence patterns (e.g., `#1e4d2b` → `v1.green`).

---

## 6. Master Style Guide — Design Considerations

### 6.1 What the style guide needs to document (from this audit's findings)

**Foundations:**
- Palette: every color token per tier (v1 + v2 + v0.2 dormant), with hex swatch + named usage
- Type: every FONT_* token + every fontSize in the future canonical scale, rendered against real copy
- Space: 9-step canonical scale with visual rulers
- Radius: 5-step canonical scale rendered against real surfaces
- Shadow: v1.shadow.* visual gallery (8 tokens) + future v2.shadow.* placeholder

**Components (every Layer 2 primitive with live fixture):**
- BottomSheet, ChannelGrid, SlimHeader (current)
- MastheadProfileButton, MastheadBackButton, MastheadPaperAirplane
- ShareBubble (frosted + v2 variants)
- DistancePill, PinGlyph, FlagGlyph
- FormField, FormButton, EmptyState
- StickyMasthead, BottomNav, MallScopeHeader, HomeChrome (chrome layer)
- Engagement-tier CTAs (Save the Find, Bookmark Booth — pre-primitive-extraction)

**Patterns:**
- 3-tier engagement + share lattice (Mall / Booth / Find — `project_layered_engagement_share_hierarchy.md`)
- Sheet/modal stack (BottomSheet variants + future CenteredModal)
- Masthead slot system (left / wordmark / right; per-page conditional rendering)
- BottomNav variants (2-tab universal, 3-tab vendor, role-aware Profile destination)

**Tokens-by-tier inventory tables:**
- v1.* table with live swatch + sample consumer
- v2.* table with live swatch + sample consumer
- canonical `space.*` / `radius.*` ruler renders

### 6.2 Form-axis decisions (Shape B picks one)

| Form | Pros | Cons |
|---|---|---|
| **Static markdown doc** (`docs/style-guide.md`) | Cheapest. Lives in repo. Diffable in PRs. | Token swatches via image embed only (rot fast). Can't render real components. |
| **Live `/style-guide` route** | Real components against real tokens. Instant feedback on token-flip experiments. Diffable via screenshots. | Costs ship cycles. Has to render under prod build. Could leak via SEO if not gated. |
| **Printable HTML reference** (`docs/style-guide-v1.html` like mockup files) | Self-contained. Easy to share with non-engineers. Renders real CSS. | Not linked to runtime tokens (drift risk). Separate maintenance burden. |
| **Hybrid (static doc + live route)** | Best of both. Doc as overview / route as live fixture. | Two surfaces to maintain. |

**Recommendation for Shape B**: hybrid — `/style-guide` as the live source of truth + a thin `docs/style-guide-overview.md` that links into specific sections.

---

## 7. Lint Extension Pattern

### 7.1 What shipped this session

Five lint scripts (4 new + 1 pre-existing) now share the file walk + report rendering via `scripts/lint-shared.ts`:

| Script | Detects | Canonical scale check? |
|---|---|---|
| `lint:spacing` | padding/margin/gap/top/right/bottom/left/inset numerics | Yes (2/4/8/12/16/24/32/48/64) |
| `lint:colors` | hex + rgba literals | No (no canonical color scale; tokens are tier-based) |
| `lint:fonts` | inline fontFamily literals + fontSize numerics | No (no type scale yet — see G1) |
| `lint:shadows` | inline boxShadow literals | No |
| `lint:radius` | borderRadius numerics off-scale | Yes (8/12/16/20/999) |

All exit 0 (warn-not-fail). All support `--json` and `--quiet`.

### 7.2 How to extend

1. Create `scripts/lint-<thing>.ts` mirroring `lint-radius.ts`'s shape.
2. Import `walk`, `collectFiles`, `readFile`, `relativeToRoot`, `getCliFlags`, `renderReport`, `Violation` from `./lint-shared`.
3. Declare detection regex(es). For numeric scale checks, add a `CANONICAL` Set + `isOnScale()` helper.
4. Add `"lint:<thing>": "npx tsx scripts/lint-<thing>.ts"` to `package.json` scripts.
5. Run `--quiet` for baseline; document in this audit doc.

### 7.3 Future shared-module extensions

- `SKIP_DIRS` / per-surface allowlist (Wave 1 task 1) to exclude reseller-intel surfaces from token-compliance scope.
- `loadTokens()` helper that parses `lib/tokens.ts` and exposes the union of all canonical values. Lints can then validate against tokens.ts directly without hardcoding scales — single source of truth.
- `--fail-on-increase` mode for CI ratchet (Wave 5).

---

## 8. Companion Action — Update `docs/spacing-scale-status.md`

The spacing-scale-status doc was authored session 144 with the 415-violation baseline. As of session 162:

- **425 total** (up from 398 post-149 low; 10 above session-144 baseline).
- **154 files scanned** (up from 141 — feature ships have added 13 new files).
- **82 files with debt** (up from 74).

Top offenders shift over time. Session 144 noted `app/admin/page.tsx`; that's still #1 (56) but the second-place file is now `app/find/[id]/page.tsx` (23) — drift since v2 Arc 3 ship.

**Recommend**: update `spacing-scale-status.md` with the session-162 snapshot in Shape C arc 1 alongside the lint scope cleanup, then make snapshot updates a session-close protocol step for any session that runs `npm run lint:*`.

---

## 9. References

- [`lib/tokens.ts`](../lib/tokens.ts) — canonical token source
- [`app/globals.css`](../app/globals.css) — `:root` CSS variable definitions
- [`docs/spacing-scale-status.md`](spacing-scale-status.md) — session 144 spacing baseline
- `scripts/lint-spacing.ts` (Arc 6.1.4) · `scripts/lint-colors.ts` · `scripts/lint-fonts.ts` · `scripts/lint-shadows.ts` · `scripts/lint-radius.ts` · `scripts/lint-shared.ts` (session 162 shared module)
- [`memory/project_layered_engagement_share_hierarchy.md`](../memory/project_layered_engagement_share_hierarchy.md) — 3-tier engagement + share lattice (session 137)
- CLAUDE.md session blocks 144 (Layer 1 refactor) + 149 (Layer 2 kickoff) + 158 (R10 enrichment) for design-history context

---

**Audit complete. Recommended next move: Shape B (style-guide form design pass) or Shape C arc 1 (lint scope cleanup + type scale).**

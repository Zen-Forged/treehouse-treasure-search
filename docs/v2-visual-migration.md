# v2 Visual Migration — Project-level migration plan

> **Status:** Arc 1 ✅ Shipped sessions 138 + 139 (12 commits cumulative). Arc 2 (Home) ✅ Shipped session 140 (9 commits — design + 2 implementation arcs + chrome migration + Phosphor icon restoration + masonry alignment + shadow dial + iOS auto-link). Arc 3 (Find/[id]) next.
> **Authored:** Session 138 (2026-05-09)
> **Scope:** Project-wide visual system migration from v1 (Lora + paper-family + polaroid tiles) to v2 (Cormorant Garamond + warm-paper palette + row pattern).
> **Companion docs:** [`saved-v2-redesign-design.md`](./saved-v2-redesign-design.md) — Arc 1 design record · [`home-v2-redesign-design.md`](./home-v2-redesign-design.md) — Arc 2 design record.
> **Mockups:** [`docs/mockups/saved-v2-redesign-v1.html`](./mockups/saved-v2-redesign-v1.html) (Arc 1) · [`docs/mockups/home-v2-redesign-v1.html`](./mockups/home-v2-redesign-v1.html) (Arc 2)

---

## Why v2

The v1 visual system (Lora editorial serif since session 82, paper-family palette since session 132, polaroid tile pattern since session 83) was load-bearing through the project's exploration phase. As the project crosses 13/18 R-rows shipped + the digital-to-physical bridge thesis becomes the user's actual experience (R1 identity + R16 discovery + R17 location + R18 cross-location saves all live), the visual surface needs to evolve from "warm-paper exploration" to "field-guide identity" — a more curated, more intentional voice that signals the product is now a coherent collection-and-discovery tool, not a discovery prototype.

The v2 voice draws from:
- **Field-guide reference** (Sibley Birds / Kew Gardens / Audubon Society) — Cormorant + Inter typography pairing; small-caps tier markers; italic Latin/common-name companion structure.
- **National Parks Passport book** — physical-bridge thesis (mark-as-collected); regional grouping; cream paper + decorative botanical chrome.
- **Goodreads tri-state shelves** — engagement-axis taxonomy (saved → found-in-store as a status lifecycle, not separate features).

Composes cleanly onto the **3-tier engagement+share lattice** (session 137 [`project_layered_engagement_share_hierarchy.md`](../memory/project_layered_engagement_share_hierarchy.md)) — see lattice extension below.

## Locked decisions (system-level)

| # | Decision | Lock |
|---|---|---|
| Q1 | Cormorant Garamond replaces Lora project-wide (single editorial serif family for upright + italic; `FONT_LORA` token retires) | (a) |
| Q1.1 | Inter replaces FONT_SYS as the canonical sans companion (per mockup spec; explicit lock-by-inheritance from Q1 system-migration scope) | locked-by-inference |
| Q2 | New palette replaces v1 paper-family entirely (`v1.paperCream/paperWarm/postit/postcardBg` deprecated; v2 tokens canonical) | (a) |
| Q3 | Polaroid retires system-wide; row pattern becomes new shared primitive (session-83 "browse vs navigate/detail rule for material chrome" itself retires) | (a) |
| Q4 | Saved-only accordion-per-booth pattern; extract `<GroupedListSection>` only on 2nd confirmed consumer | (a) |
| Q5 | ✓ Found as new Find-tier engagement axis (lattice extension — see below) | locked |
| Q5a | ✓ Found persistence: localStorage-only for now; future find-to-found formal session can layer DB sync without restructure | (i) |
| Q6 | ★ Favorite Mall ships in Arc 1 alongside the visual rebrand (Mall-tier engagement-lattice completes simultaneously) | (a) |
| sub-A | Decorative leaf chrome scope: global page-background chrome on every surface, designed to sit behind content without impacting elements on top. **Pulled out of Arc 1 scope**; lands in dedicated chrome arc | (b) deferred |
| sub-B | Wordmark stays as existing PNG asset (4-session-hardened sessions 87/88/104). v2 mockup's stacked Cormorant rendering was placeholder only | (a) |

## v2 token migration

### Typography

| Old (v1) | New (v2) | Notes |
|---|---|---|
| `FONT_LORA` (Lora 400/500/italic via next/font/google) | `FONT_CORMORANT` (Cormorant Garamond 400/500/600/700 + italic via next/font/google) | Single editorial serif family for upright + italic across all surfaces |
| `FONT_SYS` (system-stack sans) | `FONT_INTER` (Inter 400/500/600/700 via next/font/google) | Canonical sans companion per mockup spec |
| `FONT_NUMERAL` (Times New Roman) | `FONT_NUMERAL` **kept** | Numeral font (booth numbers, tier counts) is project-canonical since session 75; v2 doesn't touch it |
| `FONT_IM_FELL` | already retired (session 82) | — |

### Color palette

| v1 token | v2 token | Hex | Usage |
|---|---|---|---|
| `v1.paperCream` (#f2ecd8 post-session-132) | `v2.bg.main` | `#F7F3EB` | Page background + tab chrome (StickyMasthead + BottomNav). Session-140 chrome dial — was #FBF6EA at session 139 (matched surface.warm); split back at session 140 to create cooler chrome under warmer card surfaces. v1 chrome surfaces (vendor pages, /post/preview, /find/[id] cartographic) stay on `v1.paperCream` #f2ecd8 — only tab chrome migrates. |
| (new) | `v2.bg.paper` | `#FFFCF5` | Card surface bright |
| (new) | `v2.bg.soft` | `#F1EBDD` | Page background soft variant |
| `v1.postit` (#fbf3df) | `v2.surface.card` | `#FFFCF5` | Mall card surface (paper bright) |
| `v1.paperWarm` (#fefae6) | `v2.surface.warm` | `#FBF6EA` | Distance pill bg + thumbnail bg + secondary surfaces |
| `v1.inkPrimary` | `v2.text.primary` | `#2B211A` | Primary body text |
| `v1.inkMid` | `v2.text.secondary` | `#756A5E` | Secondary text + addresses |
| `v1.inkMuted` | `v2.text.muted` | `#A39686` | Tertiary muted text + decorative strokes |
| `v1.green` | `v2.accent.green` | `#285C3C` | Brand green (CTAs + accents) |
| (new) | `v2.accent.greenDark` | `#1F4A31` | Hover/active states for green CTAs |
| (new) | `v2.accent.greenSoft` | `#E8EEE6` | Active-state bg for ★ favorited bubble |
| (new) | `v2.brown` | `#6A513E` | Wordmark + secondary brand brown |
| (new) | `v2.brownSoft` | `#B8A996` | Decorative botanical chrome stroke |
| `v1.postcardBg` | `v2.border.light` | `#E5DED2` | Hairline borders on cards + rows |
| (new) | `v2.border.medium` | `#D6CCBC` | Stronger hairline (dashed flankers + checkbox border) |

**Migration shape:** v2 tokens land in `lib/tokens.ts` alongside v1 tokens (additive layer, no breaking changes). Each consumer migrates from `v1.*` to `v2.*` references in its own arc. Final v2 Arc (Cleanup) drops v1.* entirely once no consumers remain.

### Tile pattern

| Old (v1) | New (v2) | Notes |
|---|---|---|
| `<PolaroidTile>` (session 95 Phase 2 Session B) | Row pattern (new shared primitive) | Polaroid surfaces (Home masonry / /flagged / /shelf/[slug] grid / ShelfTile / find/[id] "More from this booth" carousel) all migrate per their respective v2 Arc |
| Session 83 "browse vs navigate/detail rule for material chrome" | **Retires** | Row pattern unifies both browse and planned-list energies; the dual-pattern rule no longer applies |

Row pattern primitive shape — captured in detail in [`saved-v2-redesign-design.md`](./saved-v2-redesign-design.md) component contracts. Likely abstracts to a shared `<v2/Row>` primitive in v2 Arc 2 (Home migration) on the second-consumer trigger.

## Lattice extension — ✓ Found

Updates [`project_layered_engagement_share_hierarchy.md`](../memory/project_layered_engagement_share_hierarchy.md) — Find tier gains a second engagement axis:

| Tier | Engagement (existing) | Engagement (new in v2) | Outbound |
|---|---|---|---|
| Mall | (none → ★ Favorite ships in v2 Arc 1) | — | Share Mall (session 137) |
| Booth | 🔖 Bookmark | — | Share Booth (sessions 50 + 135) |
| Find | ♥ Save (leaf bubble) | **✓ Found** (filled circle — discovered in physical store) | Share Find (session 137) |

✓ Found is the **first lattice cell that semantically captures the digital→physical bridge crossing**. Save = wishlist (digital intent). Found = discovered (physical confirmation). Composes onto David's "find to found" north star (session 121 strategic restructure articulation, deferred but captured).

Future lattice extensions worth tracking:
- **Booth tier ✓ Visited** — analog of ✓ Found at the Booth tier
- **Mall tier ✓ Visited** — analog of ✓ Found at the Mall tier
- **Find/Booth/Mall × additional outbound channels** — Messenger/Copy Link extensions per session-135 Tier B

Memory file update applied post-Arc-1 ship.

## Cross-surface migration arc sequencing

| Arc | Surface | Scope | Est. sessions |
|---|---|---|---|
| **1** | Saved (`/flagged`) | This design pass — Cormorant + v2 palette + row pattern + accordion + ✓ Found + ★ Favorite Mall | 1 implementation |
| **2** | Home (`/` masonry feed) | Largest visual surface; tokens + typography + polaroid retirement + row pattern adoption (or stay polaroid?) — **structural decision needed in design pass** | 1 design + 1-2 implementation |
| **3** | Find/[id] + Find/[id]/edit | Cartographic eyebrow + "Purchase this item at" card + "More from this booth" carousel migrate to v2 tokens + typography + row pattern | 1 implementation (no design needed if Arc 2 locks the row pattern shape) |
| **4** | /shelf/[slug] | BoothHero + WindowView grid + BoothTitleBlock + BoothCloser + LocationActions all migrate | 1 implementation |
| **5** | /map | PinCallout + RichPostcardMallCard tokens + typography + leaf-pin updates | 1 implementation |
| **6** | Decorative leaf chrome (universal) | Global page-background SVG decoration on every surface (sub-Q-A deferred from Arc 1); designed to sit behind content without impacting elements on top | 1 design + 1 implementation |
| **7** | Cleanup | Retire `FONT_LORA` + `v1.*` token references once Arcs 2-6 confirm zero consumers remain | 1 cleanup |

**Total estimate:** ~7-9 sessions across the v2 migration. Each Arc is its own design + implementation cycle following the project's design-record-as-execution-spec discipline ([`feedback_design_record_as_execution_spec.md`](../memory/feedback_design_record_as_execution_spec.md), 8 cumulative firings as of session 137).

**Sequencing rationale:** Saved first because it sets the field-guide voice on a coherent surface (David's "first to set the stage" framing). Home second because it's the highest-traffic surface + the polaroid retirement decision needs the most design attention there. Find + /shelf inherit from Arcs 1-2 with minimal new design calls. /map is structurally smaller (PinCallout + mall card already shipped v1 of this primitive). Leaf chrome universal arc is a chrome layer that touches all surfaces but doesn't change content layout. Cleanup retires v1 once all consumers migrate.

## Reversal log — v1 decisions explicitly retired by v2

Per [`feedback_surface_locked_design_reversals.md`](../memory/feedback_surface_locked_design_reversals.md) (cumulative 35+ firings), every v1 decision retired by v2 is surfaced explicitly:

| Session | Decision retired | Replacement |
|---|---|---|
| 82 | Lora as project-canonical editorial serif (IM Fell completely retired) | Cormorant Garamond as single editorial serif family |
| 83 | Polaroid evolved tile pattern as project-canonical for browse/collect surfaces | Row pattern as new shared primitive for Saved (and propagating across other surfaces in subsequent arcs) |
| 83 | "Browse vs navigate/detail rule for material chrome" (polaroid for browse; light card for navigate/detail) | Row pattern unifies both energies; rule itself retires |
| 95 | `<PolaroidTile>` shared primitive (Phase 2 Session B) | Row pattern primitive replaces it |
| 121 | Save leaf bubble per-find restoration on /flagged tiles (D8 reversal of session-99 retirement) | **Preserved** — leaf bubble stays as ♥ Save on the find row in v2 |
| 122 | Page-level "X saved find{s} waiting to be found" 17px italic ink-muted FONT_LORA above per-mall stack | Moves **inside** the mall card as "X finds waiting to be discovered" with leaf glyph + dashed flankers |
| 122 | SavedMallCard full-width chrome restack with photo retired + per-find DistancePill placement | New SavedMallCardV2 with mall name + ★ + address + distance eyebrow + GET DIRECTIONS + finds-waiting + accordion sections |
| 132 | Shape A v1 paper-family lightening (`v1.paperCream` #f2ecd8 + companion bumps) | v2 palette replaces v1 paper-family entirely |
| 132 | Frosted-glass primitive retire on chrome surfaces (rgba + backdrop-blur → solid #f2ecd8 across 6 chrome surfaces) | **Preserved approach** — v2 chrome continues to use solid surfaces, never frosted-glass |
| 137 | 3-tier engagement+share lattice (north-star reference) | **Extended** — Find tier gains ✓ Found as second engagement axis |

## Tier B explicit headroom

Doors deliberately left open by Arc 1's Saved scope; document where so future sessions know what's open vs frozen:

| Item | Reason | Trigger to revisit |
|---|---|---|
| `<GroupedListSection>` shared primitive extraction | Arc 1 ships Saved-only accordion (Q4 (a) — premature abstraction risk = 0) | When 2nd confirmed consumer surfaces (Trips/Lists product surface, per-mall Find filtering, etc.) |
| ✓ Found DB persistence (per-shopper, syncs across devices) | Arc 1 ships localStorage-only (Q5a (i)) | When find-to-found formal session lands as design pass — extends `useShopperFindsFound` to mirror `useShopperSaves` hybrid-hook pattern with new `shopper_finds_found` table |
| ✓ Found analytics (R3 events `find_marked_found` / `find_unmarked_found`) | Arc 1 doesn't instrument | When find-to-found analytics is load-bearing for moonshot decisions |
| ★ Favorite Mall analytics (R3 events `mall_favorited` / `mall_unfavorited`) | Arc 1 doesn't instrument | Same trigger as ✓ Found analytics — likely both at once |
| Wordmark v2 stacked Cormorant treatment | Sub-Q-B (a) keeps existing PNG | Separate session if David wants to evolve the wordmark; current PNG is 4-session-hardened so it's a real design call |
| Decorative leaf chrome universal | Sub-Q-A pulled out of scope | v2 Arc 6 — lands as page-background chrome on all surfaces |
| Polaroid retirement on Home + Find + /shelf carousel + /shelf grid | Out of Arc 1 scope (Saved-only) | v2 Arc 2 (Home) is the next major polaroid-retirement consumer + likely the trigger for shared row primitive extraction |
| Empty state for power users (>50 saves) | Arc 1 ships single empty state (D3) for 0 saves | When density at scale becomes a design concern (sort/filter affordance becomes load-bearing) |
| ★ Favorite Mall sort vs separate "Favorites" sub-section | Arc 1 ships floating-to-top (D4 (a)) | If user feedback says favorited malls need their own visual zone vs just sort priority |
| BottomNav v2 — Cormorant nav-labels? | Arc 1 keeps Inter nav-labels per Q1.1 lock | If nav-labels read sterile against the Cormorant editorial voice on populated surfaces |

## Implementation principles for all v2 arcs

Inherit from project-canonical operating disciplines:

- **Smallest→largest commit sequencing** ([`feedback_smallest_to_largest_commit_sequencing.md`](../memory/feedback_smallest_to_largest_commit_sequencing.md), 175+ cumulative firings) — Each v2 Arc sequences its commits smallest→largest with build clean at every commit boundary.
- **Design record as execution spec** ([`feedback_design_record_as_execution_spec.md`](../memory/feedback_design_record_as_execution_spec.md), 8 cumulative firings) — Each Arc's design record runs as pure execution pass; if "pure execution" surfaces re-scoping, the design pass left axes open.
- **Mid-session iPhone QA on Vercel preview** ([`feedback_mid_session_iphone_qa_on_vercel_preview.md`](../memory/feedback_mid_session_iphone_qa_on_vercel_preview.md), 22+ cumulative firings) — Each Arc gets iPhone QA on Vercel preview before close, not after merge.
- **Surface locked design reversals** ([`feedback_surface_locked_design_reversals.md`](../memory/feedback_surface_locked_design_reversals.md), 35+ cumulative firings) — Any time a v1 decision is being retired by v2, surface the prior reasoning + acknowledge the reversal in the commit body.
- **Dead-code cleanup as scope-adjacent byproduct** ([`feedback_dead_code_cleanup_as_byproduct.md`](../memory/feedback_dead_code_cleanup_as_byproduct.md), 25+ cumulative firings) — As consumers migrate from v1 to v2 tokens, retire dead code in the same commit (not a separate refactor).
- **Schema-forced deviations are NOT design reversals** — If a token migration surfaces a missing v2 token or unexpected v1 dependency, surface explicitly in commit body but don't treat as a design-record reversal.

## Memory file updates triggered by Arc 1 ship

Post-Arc-1 ship, update:
- [`project_layered_engagement_share_hierarchy.md`](../memory/project_layered_engagement_share_hierarchy.md) — add ✓ Found Find-tier engagement axis to the lattice; expand the table.
- New project memory: `project_v2_visual_system.md` — captures Cormorant + Inter + v2 palette + row pattern as the canonical visual system; references this migration doc + the Saved Arc 1 design record. Becomes load-bearing project memory once 2+ surfaces ship v2.

## Project-evolution beat

This is the **largest visual-system migration in project history**. v1 (Lora since session 82 + paper-family since session 132 + polaroid since session 83 — three sessions of cumulative visual investment + ~50 sessions of compounding decisions on top) → v2 (Cormorant + warm-paper palette + row pattern + field-guide voice). The migration record names it explicitly: this is v2 of the design system, not a single-page refresh.

The compounding investor shape: a project that survives a system migration of this scope without regressing is one that has matured beyond exploration into curated identity. The discipline-backed migration sequencing (Saved as Arc 1 because David framed it as "first to set the stage" + the field-guide voice composes most naturally onto a planned-list surface) keeps each subsequent arc surgical. Future investor updates can reference the v2 migration as a meaningful design-evolution beat alongside the digital-to-physical bridge thesis crossing into "MEASURE the place" territory at session 133.

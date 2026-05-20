# Map PinCallout refinement — design record

**Status:** Ready (decisions frozen 2026-05-20, session 188).
**V1 mockup:** [`docs/mockups/map-pincallout-refinement-v1.html`](mockups/map-pincallout-refinement-v1.html) — the mockup is the authority. If this doc and the mockup disagree, the mockup wins.
**Predecessor records:** [`docs/map-enrichment-design.md`](map-enrichment-design.md) (session 158) · [`docs/map-page-extraction-design.md`](map-page-extraction-design.md) (session 176)

---

## Why this exists

iPhone-QA-driven refinement of the `<PinCallout>` primitive (the floating callout above a selected pin on `/map`). David's verbatim 6-finding bundle:

1. Move distance chip above mall name on map selected component
2. Center "x fresh finds" + increase font size + change to a sans serif font we already use
3. Add the PiLeaf icon to the left of the number (x fresh finds)
4. Make mall thumbnail on selected PIN a circle shape
5. Fresh finds count should be the number of total items in that location (30-day window is the freshness window)
6. Center all components — will need a design pass to calibrate

The bundle is structural — current PinCallout has horizontal composition (thumb on left · text-stack on right), David's "center all components" call reshapes to vertical-stacked symmetric. The design pass calibrates the spacing rhythm + thumb size + font split.

Sub-arc of /map page refinement (extends sessions 158 + 161 + 165 + 178-180).

---

## Cost shape picked

**Shape B — V1 mockup first, then ship.** Per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132. V1 mockup spans 3 frames on the thumb-size + density axis within the locked vertical-stacked composition; David picked **Frame β — Balanced** (56 px thumb · 7/10/12 px spacing · 20 px mall name · 14 px fresh-finds).

---

## Frame picked: Frame β (Balanced)

56 px circle thumb · vertical-stacked symmetric composition · everything centered · 230 px min-width callout. Thumb has enough presence to read as identity not decoration; name + count balance below.

Reference frames α (compact 40 px) + γ (hero 76 px) parked in mockup for revival if Frame β reads off at iPhone QA.

---

## Decisions (frozen)

| # | Decision | Choice |
|---|---|---|
| **D1** | PinCallout composition reshape | ✅ Horizontal (thumb-left + text-right) → **vertical-stacked symmetric**. BOUNDED REVERSAL of session 107 R10 Arc 1 D26 horizontal composition; surface in commit body. |
| **D2** | Composition order top → bottom | ✅ Circle thumb · DistancePill · mall name · PiLeaf + count line · CTA row. |
| **D3** | Horizontal alignment | ✅ All components horizontally centered within callout body. |
| **D4** | Thumb shape | ✅ **Circle** (`borderRadius: "50%"`). Replaces current 6 px rect-rounded shape. |
| **D5** | Thumb size | ✅ **56 px diameter** (Frame β). |
| **D6** | Thumb content | ✅ `mall.hero_image_url` via `<img>` with `objectFit: cover`. **MapPin glyph fallback** when null; 18 px size for the larger thumb (was 16 px on the 36 px rect). Border preserved (1.5 px `v2.surface.card` outline + `0 2px 6px rgba(42,26,10,0.15)` shadow). |
| **D7** | DistancePill placement | ✅ Above mall name in its own centered row. Primitive retained verbatim (cream-bg pill — no changes to `<DistancePill>` itself). Renders nothing on null miles per primitive's null-passthrough. |
| **D8** | Mall name typography | ✅ `FONT_CORMORANT 600` at **20 px**, `lineHeight: 1.3`, `color: v2.text.primary`, centered. Right-aligned ellipsis truncation **retires** — centered + callout grows to fit (long mall names allowed to wrap to 2 lines naturally). |
| **D9** | Stat line — split treatment | ✅ **"18" → `FONT_NUMERAL` (Times New Roman)** per session-75 canonical, reaffirmed by 2026-05 ui-tokenization-audit at session 162. **"fresh finds" → `FONT_INTER` sans** per David's verbatim spec. Both `v2.accent.green`; number `fontWeight: 700`, label `fontWeight: 600`, `fontSize: 14`. BOUNDED REVERSAL of session 158 D-bundle "fresh finds" Cormorant italic 14 treatment; surface in commit body. Reuses MallScopeHeader split-treatment pattern per session 75 D5. |
| **D10** | PiLeaf glyph | ✅ `<PiLeaf>` outline weight (NOT `<PiLeafFill>`) at **15 px** sits left of the count number. Color `v2.accent.green`. `inline-flex` row with `gap: 6 px` (PiLeaf · "18" · "fresh finds"). |
| **D11** | Fresh-finds count semantic | ✅ Posts at the mall with `status = 'available'` AND `published_at >= NOW() - INTERVAL '30 days'`. Server-side filter on the existing `getMallStatsByMallId` query. |
| **D12** | `findCount` semantic shift | ✅ Single-consumer audit confirms PinCallout is the only production reader. Semantic shifts from "all available finds at mall" to "available finds posted in last 30 days at mall." Variable name preserved (no rename — too invasive for the semantic clarification). Add comment in `lib/posts.ts` documenting the 30-day window. |
| **D13** | Fixture mirror | ✅ `lib/fixtures.ts` `getFixtureMallStats` extended with matching 30-day semantic (Review Board parity). Scope-adjacent byproduct in the data-layer commit. |
| **D14** | Spacing rhythm at Frame β | ✅ 56 px thumb · 7 px gap → DistancePill · 10 px → mall name · 12 px → stat line · 12 px → CTA row. Callout `padding: 14 px 18 px`. `minWidth: 230 px`. |
| **D15** | CTA row | ✅ Preserved verbatim — Directions outline + Explore filled green, 28 px height, `FONT_INTER` 11 px 600, 6 px gap between buttons. |
| **D16** | Tail (notch pointing at pin) | ✅ Preserved verbatim — extracted helper, both branches share. |
| **D17** | Flanking ArrowBubble (neighbor-step) | ✅ Preserved verbatim — 30 px round bubbles flanking the card with `gap: 6 px`; disabled state at first/last position with `opacity: 0.35` + `pointerEvents: none`. |
| **D18** | No-coords fallback branch | ✅ Same vertical-stacked reshape applies (visual consistency) BUT minus DistancePill + minus CTA row + chevron at bottom. Callout reads "centered card without R17 wiring." Defensive coverage preserved for future-malls / transient race conditions. |
| **D19** | Saved-state branch | ✅ Preserved verbatim — when `savedCount > 0`, label switches "fresh finds" → "saved finds"; number + typography + split treatment + PiLeaf prefix all stay identical. Lattice semantic per session 158 (saved = user's, fresh = mall inventory) holds. |
| **D20** | Surface scope | ✅ `<PinCallout>` only — single primitive, single consumer (`<TreehouseMap>` via `<MapPageBody>` at `/map`). No other surface reads from the changed shape. |

---

## Bounded reversals surfaced explicitly

Per `feedback_surface_locked_design_reversals` ✅ Promoted. Two prior locked decisions reversed within bounded scope:

- **R-1 (D1 reverses session 107 R10 Arc 1 D26)** — D26 locked horizontal callout composition (thumb-left + text-right). Reason for reversal: David's iPhone-QA-driven "center all components" call. The horizontal shape served R10's peek-state purpose (compact + scannable above a pin) for ~80 sessions; the v2 visual maturity + recent R18 cross-location-saves work has elevated the callout from "informational badge" to "place identity card" — vertical-stacked symmetric matches the new role.
- **R-2 (D9 reverses session 158 D-bundle "fresh finds" Cormorant italic 14)** — session 158 dial F + I shipped the statline as Cormorant italic 14 green. Reason for reversal: David's verbatim spec "change to a sans serif font we already use" + session-75 canonical preservation = split treatment (FONT_NUMERAL number + FONT_INTER label) is the right shape. Italic Cormorant retires from this line only; remains canonical for editorial voice elsewhere.

---

## Component contracts

### `<PinCallout>` — updated props (no signature changes)

Existing props unchanged. Only the internal composition + rendered tree changes. Public API stable:

```tsx
interface PinCalloutProps {
  mall:        Pick<Mall, "id" | "slug" | "name" | "hero_image_url" | "latitude" | "longitude">;
  findCount:   number;           // semantic: 30-day window (D11)
  savedCount?: number | null;
  anchor:      { x: number; y: number };
  onCommit:    () => void;
  miles?:      number | null;
  onPrev?:     () => void;
  onNext?:     () => void;
  hasPrev?:    boolean;
  hasNext?:    boolean;
}
```

### `lib/posts.ts` — `getMallStatsByMallId()` query extension

```ts
// Before:
supabase.from("posts").select("mall_id").eq("status", "available")

// After:
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
supabase.from("posts").select("mall_id").eq("status", "available").gte("published_at", thirtyDaysAgo)
```

Add comment block above function documenting the 30-day semantic + the canonical 30-day window length.

### `lib/fixtures.ts` — `getFixtureMallStats()` mirror

Extend with same 30-day filter against `FIXTURE_POSTS[].published_at` (already includes timestamps).

---

## Tier B headroom (deliberately out of scope)

Doors deliberately left open for post-ship iPhone QA dials or future sessions:

- **B1 — Number weight dial.** Inter 600 mocked across all frames; if "18" reads light against Cormorant 20 mall name above, push to 700. One-line dial post-ship.
- **B2 — Thumb shadow weight.** Current `0 2px 6px rgba(42,26,10,0.15)`; could go heavier if thumb reads flat against `v2.surface.card`. One-line dial.
- **B3 — Spacing rhythm tuning.** Frame β baseline 7/10/12 px gaps; if "feels off" on iPhone QA, dial 1-2 px per gap. Captured as the "calibrate" call in D14 — David explicitly flagged this as needing post-ship dial.
- **B4 — Fallback glyph swap.** When `hero_image_url` null, thumb renders MapPin 18 px center. Could swap to PiStorefront (matches /find/[id] cartographic eyebrow per session 134) if MapPin reads off. Single-line replacement.
- **B5 — Number font weight in saved-state branch.** D19 preserves the split treatment + visual identity verbatim across both branches. If iPhone QA reveals "saved finds" reads differently against the green than "fresh finds" (subjective), the saved-state could push number weight to 800 for emphasis. Same one-line dial.
- **B6 — Pin overlap when callout taller.** Vertical-stacked composition is taller than horizontal at Frame β (~140 px vs ~70 px). The `transform: "translate(-50%, calc(-100% - 12px))"` handles this — callout always sits 12 px above the pin regardless of height. But near the top edge of the map (north-bound pins), the callout could clip. Mapbox `easeTo` offset (session 158 `MAP_PEEK_OFFSET_Y`) is the kill switch if it surfaces.

---

## Risk register

| # | Risk | Mitigation |
|---|---|---|
| **R1** | `posts.published_at` column may not be indexed → 30-day filter slow at scale | Posts table is currently small (low hundreds). Supabase defaults to B-tree index on timestamp columns. Verify at iPhone QA via Network panel; add migration if N+1 surfaces. |
| **R2** | Mall hero_image_url cropping in 56 px circle | `objectFit: cover` handles. Larger circle than current 36 px rect may reveal cropping that was hidden — check America's Antique Mall + 1-2 other malls' hero images at QA. |
| **R3** | Long mall names break centered single-line at 20 px Cormorant | D8 allows 2-line wrap. Centered line-break reads cleanly in mockup; verify at iPhone QA against the longest actual mall name. |
| **R4** | iPhone SE 375 px width with arrow bubbles + 230 px callout | Math: 230 + (30 × 2) + (6 × 2) = 302 px. Comfortable. |
| **R5** | Frame β reads "balanced" in mockup but flat against real Mapbox basemap | Mockup uses approximated cream gradient; real Mapbox cream may read different. Resolved at iPhone QA — Frame α (compact) or Frame γ (hero) parked in mockup for revival. |
| **R6** | Split treatment FONT_NUMERAL + FONT_INTER reads as "two voices arguing" | Same risk session 75 considered + ruled acceptable; MallScopeHeader has shipped this exact split pattern for ~113 sessions without issue. Frame β preview validates visually. |
| **R7** | 30-day count of zero ("0 fresh finds") on quiet malls | Existing fallback unchanged — render "0 fresh finds" or fall through to discovery copy when both fresh + saved are 0. Mall-level count of 0 is informational, not broken. |

---

## Implementation arcs (sequenced smallest → largest)

Per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88.

### Arc 1.1 — Data layer (1 commit, smallest)

- Extend `getMallStatsByMallId` query in `lib/posts.ts` with 30-day `published_at` filter.
- Extend `getFixtureMallStats` in `lib/fixtures.ts` with matching 30-day filter against `FIXTURE_POSTS`.
- Add comment block above `getMallStatsByMallId` documenting the 30-day semantic.
- No UI touch; existing PinCallout consumes the new count automatically.

### Arc 1.2 — PinCallout reshape (1 coupled commit, largest)

Per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — composition + dimensions + fonts + colors at Frame β are all interlocked. Single coupled commit; intermediate splits would leave broken visual states.

- Rewrite the R17 Arc 2 callout-card branch in `components/PinCallout.tsx` to vertical-stacked symmetric per D1-D19.
- Apply same reshape (minus DistancePill + CTA row) to the no-coords fallback branch per D18.
- Surface R-1 + R-2 bounded reversals in commit body with prior reasoning quoted.

### Arc 1.3 — iPhone QA round 1 on Vercel preview

David walks the Vercel preview after Arc 1.2 push. Each finding ships as a smallest-→largest one-line dial commit per the iPhone-QA-driven cadence (sessions 161 + 165 + 180 lineage).

Tier B items above are pre-scoped dials; non-Tier-B findings get triaged via cost-shape before drafting.

### Arc 2 (optional, post-iPhone-QA)

If iPhone QA surfaces "Frame β reads off at real cream + real hero photo" → revive Frame α or Frame γ from V1 mockup as the candidate; small dial commit retains all D1-D20 with thumb size + spacing rhythm swap.

---

## Acceptance criteria (for the iPhone QA pass after Arc 1.2)

- [ ] Tap any leaf pin on `/map` — callout renders vertical-stacked symmetric with circle thumb on top, DistancePill below, mall name centered, PiLeaf + "X fresh finds" stat line, CTA row at bottom.
- [ ] Thumb is circular (no rectangular corners). Hero image fills circle via `objectFit: cover`.
- [ ] DistancePill renders in its own row ABOVE the mall name (not inline beside it).
- [ ] Stat line reads "PiLeaf-glyph + 18 + fresh finds" where "18" is Times New Roman serif + "fresh finds" is Inter sans + both `v2.accent.green`.
- [ ] Fresh-finds count reflects 30-day-window posts at that mall (not all-time). Cross-check against `getMallStatsByMallId` query output.
- [ ] Saved-state branch: when shopper has saves at the mall, label switches "fresh" → "saved"; everything else identical.
- [ ] No-coords fallback branch: when `mall.latitude` or `mall.longitude` is null, callout still renders with reshape (no DistancePill, no CTA row, with chevron).
- [ ] Flanking arrow bubbles still work for neighbor-stepping; disabled state at first/last position.
- [ ] Tail still points down at the pin; callout sits 12 px above pin regardless of callout height.
- [ ] Long mall name wraps to 2 lines centered (does not clip or overflow). Test against the longest active mall.

---

## Carry-forwards into future sessions

- **MallScopeHeader split treatment pattern is the canonical for any future stat-line composition** (number-as-stamp + label-as-voice). Session 75 D5 established; session 188 reaffirms across surfaces. When introducing a new statline with numeric prefix, default to this pattern + add to D9 lineage.
- **30-day freshness window is a project-canonical "freshness window" constant.** If future surfaces want a "fresh activity" affordance (Home feed fresh chip, vendor My Shelf fresh count, /flagged sort-by-freshness), reuse the 30-day window unless explicitly redesigned. Worth surfacing as `lib/freshness.ts` or `FRESHNESS_WINDOW_DAYS = 30` constant if 2nd surface adopts.
- **Vertical-stacked symmetric callout shape is the new PinCallout default.** Future map-side callout primitives (e.g., a vendor-locator callout per future R-row) should adopt this composition unless an explicit design call reverses.

---

## What this record explicitly does NOT cover

- Mall-level `<MapCarousel>` cards (the bottom carousel at `/map`) — separate primitive, separate consumers, unchanged this session.
- `<MallPickerChip>` (session 166) — separate primitive, unchanged.
- Mapbox basemap palette — preserved verbatim from session 181 (custom Studio cream style URL).
- `<DistancePill>` primitive itself — internal styling unchanged; only its position within PinCallout changes.
- `<PiLeaf>` icon weight + size canonical anywhere outside PinCallout — that's a separate session's design call.

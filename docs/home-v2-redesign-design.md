# Home v2 Redesign — Design Record

> **Status:** 🟢 Ready for implementation
> **Authored:** Session 140 (2026-05-10)
> **Surface:** `/` route (the Home discovery feed) within `app/(tabs)/page.tsx`
> **Arc:** Arc 2 of v2 visual migration — see [`v2-visual-migration.md`](./v2-visual-migration.md) for project-level migration plan
> **Mockup:** [`docs/mockups/home-v2-redesign-v1.html`](./mockups/home-v2-redesign-v1.html)
> **Cost shape:** Shape B (light design pass on tile shape only) per [`feedback_triage_cost_shape_before_design_pass.md`](../memory/feedback_triage_cost_shape_before_design_pass.md)
> **Replaces (on Home only):** session 83 polaroid evolved tile pattern, session 95 `<PolaroidTile>` consumer wiring on Home masonry, session 81 frosted-glass heart bubble overlay (already retired on chrome surfaces session 132; this closes the bubble-overlay holdout)

---

## Scope

This is **Arc 2** of the project-level v2 visual migration. Saved (`/flagged`) was Arc 1 (sessions 138 + 139). Subsequent arcs migrate Find, /shelf, Map, decorative leaf chrome, and v1-token cleanup.

Arc 2 ships:
- Home tile migrates to v2 token + typography vocabulary
- New v2 tile primitive scoped to Home (one consumer; abstracts to shared if Arc 3 / Arc 4 confirms 2nd consumer)
- Frame C wrapper chrome (lighter polaroid — warm-paper mat preserved, shadow softened, mat thinner than v1)
- Heart bubble overlay migrated from frosted-glass → v2.surface.warm solid (consistent with SavedFindRow vocabulary; closes session-132 frosted-glass-retire holdout)
- Below-photo relative timestamp migrated from FONT_SYS italic → Inter italic
- Treehouse Lens filter preserved on photos
- v1-token + FONT_LORA + FONT_SYS dead-code retire on Home (per `feedback_dead_code_cleanup_as_byproduct`)

Arc 2 does **not** ship:
- Photograph-only contract change (no title / price / booth attribution added — Q1a locks)
- ✓ Found Find-tier engagement on Home tiles (Q2b — stays Saved-only initially)
- RichPostcardMallCard migration (sequenced for Arc 5 alongside /map per session-139 Q1 (a))
- ★ Favorite Mall consumer wiring (deferred to Arc 5 per session-139 Q1 (a))
- New v2 tile shared-primitive abstraction (Q4 system-level — premature abstraction risk; extracts when 2nd consumer confirms in Arc 3 or 4)
- Decorative leaf chrome (sub-Q-A deferred to v2 Arc 6 — universal page-background chrome)
- Polaroid retirement on Find + /shelf grid + ShelfTile + find/[id] carousel (Arc 3-4 work)

## Locked decisions — system-level (inherited)

Inherited from v2 migration doc lock table; restated for design-record completeness:

| # | Decision |
|---|---|
| Q1 (a) | Cormorant Garamond replaces Lora project-wide |
| Q1.1 | Inter replaces FONT_SYS as canonical sans companion |
| Q2 (a) | New v2 palette replaces v1 paper-family entirely |
| Q3 (a) | Polaroid retires system-wide; row pattern is new shared primitive — **Home Arc 2 partial reversal: see Reversal log** |
| Q4 (a) | Saved-only accordion; extract `<GroupedListSection>` only on 2nd consumer (analogous logic for v2 tile primitive applies to Home) |
| Q5 | ✓ Found as new Find-tier engagement axis |
| Q5a (i) | ✓ Found localStorage-only persistence for now |
| Q6 (a) | ★ Favorite Mall ships in Arc 1 alongside visual rebrand |
| sub-A (b deferred) | Decorative leaf chrome out of Arc 1 scope; lands in v2 Arc 6 universally |
| sub-B (a) | Existing PNG wordmark stays |

## Locked decisions — Home-specific (Q1-Q5 + D1-D6 + sub)

Pre-V1 scoping locked the content shape:

| # | Decision | Implication |
|---|---|---|
| Q1 (a) | Photograph-only contract preserved on Home tile | No title / price / booth attribution added; tile = "is this photo interesting?" |
| Q2 (b) | Home stays ♥-only (no ✓ Found on Home tiles) | ✓ Found stays Saved-only as collected-list engagement; mark-as-found semantically needs the saved/scoped context |
| Q3 (a) | Heart bubble migrates frosted-glass → v2.surface.warm solid | Consistent with SavedFindRow vocabulary; closes session-132 frosted-glass-retire holdout |
| Q4 (a) | Relative timestamp ("3 hours ago") kept; FONT_SYS italic → Inter italic | Preserves session-69 recency signal; v2 typography migration only |
| Q5 (a) | Treehouse Lens filter preserved on photos | Continuity with v1 brand voice |

V1 mockup span the wrapper-chrome axis (zero → full chrome) across 4 frames: A flat photo grid, B v2 editorial card, C lighter polaroid, D polaroid preserved. **David picked Frame C.**

Frame C dials locked:

| # | Decision | Lock | Notes |
|---|---|---|---|
| D1 (b) | Wrapper padding `5/5/6` (top/sides/bottom) | tighter mat than V1 mockup default; more photo-forward |
| D2 (a) | Wrapper border-radius `4px` | v1 verbatim radius (V1 mockup default was 6px) |
| D3 (b) | Shadow `0 3px 8px rgba(43,33,26,0.08), 0 1px 2px rgba(43,33,26,0.05)` | mid (V1 mockup default); iPhone QA truth-teller for visual weight |
| D4 (a) | Wrapper bg `v2.surface.warm` (#FBF6EA) | warm cream contrasts dimensionally against `v2.bg.main` page bg |
| D5 (b) | Photo inner border retired | cleaner edge; photo flush against mat |
| D6 (b) | Below-photo timestamp gap `5px` margin-top | matches v2 spacing rhythm |
| sub-A (iii) | Photo inner border-radius `4px` | matches wrapper radius for coherent geometry; pairs naturally with no-border decision |

**Composition note:** the picked dial set (5/5/6 mat + 4px wrapper radius + 4px photo radius + no inner border + mid-soft shadow + warm-paper bg) lands squarely between Frame C (V1 mockup) and Frame D (preserved polaroid) — closer to "v1 polaroid with v2 tokens + tighter mat + softer shadow" than to Frame C's lighter-and-more-rounded original. Reads as deliberate continuity with v1's polaroid-as-browse vocabulary, just lighter.

## Component contracts

### `<HomeFeedTile>` (new v2 primitive, components/v2/HomeFeedTile.tsx)

Photograph-only tile primitive scoped to Home masonry. Replaces `<PolaroidTile>` consumer wiring on Home only; PolaroidTile stays alive for /post/preview, /post/tag, find/[id] carousel until those surfaces migrate in Arcs 3-4.

```ts
interface HomeFeedTileProps {
  /** Find image URL (photograph-only; null/falsy renders italic-title fallback per session-83 contract). */
  src: string;
  alt: string;
  /** Rendered when src is falsy or img onError fires. */
  fallback?: ReactNode;
  /** Save-state for heart bubble (filled green leaf vs outline ink leaf). */
  isFollowed: boolean;
  /** Heart bubble tap handler. e.stopPropagation() owned by tile to prevent Link nav. */
  onToggleFollow: () => void;
  /** Last-viewed highlight (Home parent times out + unsets; primitive renders 1.5px green border + halo). */
  highlighted?: boolean;
  /** Tap-flash overlay + scale animation on touchstart (Home masonry-only behavior). */
  tap?: boolean;
  /** Below-photo content slot — Home passes the relative timestamp render. */
  below?: ReactNode;
  /** Image loading attribute. Default undefined (browser default = eager). */
  loading?: "eager" | "lazy";
  /** Optional callback fired when img onError handler runs. */
  onImageError?: () => void;
}
```

Rendering (Frame C dialed):
- Outer `<div>` wrapper: bg `v2.surface.warm`, padding `5px 5px 6px`, border-radius 4px, box-shadow `0 3px 8px rgba(43,33,26,0.08), 0 1px 2px rgba(43,33,26,0.05)`, width 100%, opacity 1
- Inner `<div>` photo container: position relative, width 100%, aspectRatio "4/5", transform tap-flash logic from PolaroidTile preserved verbatim
- Photo `<div>`: position absolute, inset 0, border-radius 4px, overflow hidden, background v2.surface.warm (fallback before image renders), NO border (D5b)
  - `<img>` inside: width/height 100%, objectFit cover, filter TREEHOUSE_LENS_FILTER (Q5a preserved)
  - Highlighted state: 1.5px solid v2.accent.green border + box-shadow `0 0 0 3px rgba(40,92,60,0.13), 0 4px 14px rgba(43,33,26,0.11)`
- Heart bubble (`<button>`): position absolute, top 8, right 8, width 36, height 36, border-radius 18, bg `v2.surface.warm`, border `1px solid v2.border.light`, color `v2.accent.green`
  - Inner SVG (leaf): width 17, height 17, viewBox 24×24, stroke 1.7, stroke-linecap/linejoin round, path = `M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2c1.7 5 .67 16-8.2 18zM2 21c0-3 1.85-5.36 5.08-6` (matches FlagGlyph + SavedFindRow heart vocabulary)
  - Filled state (isFollowed): fill currentColor (green); outline state: fill none, stroke currentColor
- Below content slot (`{below}`): rendered as sibling after photo container; consumer responsible for typography (Home passes timestamp Inter italic 11.5px v2.text.muted with 5px margin-top)

Tap-state animation (when `tap === true`):
- onPointerDown: setTapped(true), setTimeout 320ms → setTapped(false)
- transform: tap && tapped ? "scale(1.028)" : "scale(1)"
- transition: tap && tapped ? "transform 0.14s cubic-bezier(0.34,1.56,0.64,1)" : "transform 0.32s cubic-bezier(0.22,1,0.36,1)"
- Tap-flash overlay inside photo: position absolute, inset 0, bg `rgba(40,92,60,0.08)` (was rgba(30,77,43,0.08) v1.green-tinted; v2 = v2.accent.green-tinted), opacity tapped ? 1 : 0, transition 0.08s in / 0.28s out
- These animation values carry verbatim from PolaroidTile per `feedback_design_record_as_execution_spec` — established home-feed motion vocabulary; only token-color values migrate

### Home page consumer (`app/(tabs)/page.tsx`)

Current (v1):
```tsx
<PolaroidTile
  src={post.image_url ?? ""}
  alt={post.title}
  tap
  highlighted={highlighted}
  innerBorder
  photoRadius={v1.imageRadius}
  fallback={...italic Lora title fallback...}
  topRight={<button>...heart bubble (frosted-glass)...</button>}
  below={<div>...timestamp FONT_SYS italic 11.5...</div>}
/>
```

After (v2):
```tsx
<HomeFeedTile
  src={post.image_url ?? ""}
  alt={post.title}
  tap
  highlighted={highlighted}
  isFollowed={isFollowed}
  onToggleFollow={handleHeartClick}
  fallback={
    <div style={{...padding..., fontFamily: FONT_CORMORANT, fontStyle: "italic", fontSize: 14, color: v2.text.muted, lineHeight: 1.35}}>
      {post.title}
    </div>
  }
  below={
    <div style={{padding: "0 2px", fontFamily: FONT_INTER, fontStyle: "italic", fontSize: 11.5, color: v2.text.muted, letterSpacing: "0.01em", lineHeight: 1.2, textAlign: "left"}}>
      {formatTimeAgo(post.created_at)}
    </div>
  }
/>
```

Inline heart `<button>` element retires from page consumer (moves into HomeFeedTile); page consumer passes `isFollowed + onToggleFollow` instead of fully-rendered topRight slot.

PolaroidTile import retires from `app/(tabs)/page.tsx`; PolaroidTile.tsx stays in repo for /post/preview, /post/tag, find/[id] carousel until Arc 3.

## Reference grounding

Per [`feedback_reference_first_when_concept_unclear`](../memory/feedback_reference_first_when_concept_unclear.md) (6th cumulative firing), 4 cross-domain references inform the Frame C choice:

| Reference | Frame angle |
|---|---|
| Pinterest masonry | Frame A precedent — pure photo-first; modern feed feel; loses dimensional craft |
| Etsy Editor's Picks · Faire wholesale grid | Frame B precedent — clean editorial card; composes with row-list surfaces; risks "list-y" feel on browse |
| Field Mag · Kinfolk · The Cool Hunter | **Frame C precedent** — restrained dimensional lift on warm cream; soft shadow signals craft without dominating |
| Polaroid Originals · Lomography community | Frame D precedent — full polaroid mat; nostalgic photographic identity at the cost of "modern app" signaling |

Frame C reads closest to the field-guide voice locked at session 138 (Sibley/Kew/Audubon/NPS Passport) — restrained dimensional lift on warm cream paper. Saved Arc 1's row card vocabulary used the bright `v2.surface.card` (#FFFCF5); Home Arc 2's tile uses the warm `v2.surface.warm` (#FBF6EA) — same family but warmer, signaling that Home is a browse surface (warm + photographic) vs Saved's collected-list (bright + planned).

## Reversal log — v1 decisions explicitly retired by Home Arc 2

Per [`feedback_surface_locked_design_reversals.md`](../memory/feedback_surface_locked_design_reversals.md) (cumulative 37+ firings), every v1 decision retired by Home Arc 2 surfaced explicitly:

| Session | Decision retired | Replacement |
|---|---|---|
| 81 | Heart bubble overlay frosted-glass `rgba(245,242,235,0.85)` + backdrop-blur 8px (session-81 lighter-bubble across 5 surfaces) | v2.surface.warm solid + 1px v2.border.light hairline; closes the session-132 frosted-glass-retire holdout (chrome surfaces retired session 132; bubble overlays were the final consumer) |
| 83 | Polaroid evolved tile pattern with v1.paperWarm bg + v1 dimensional shadow + 7/7/8 mat + 6px photo radius + 1px inner border | Frame C lighter polaroid: v2.surface.warm bg + softer shadow + 5/5/6 mat + 4px photo radius + no inner border |
| 95 | `<PolaroidTile>` consumer wiring on Home masonry | New `<HomeFeedTile>` v2 primitive; PolaroidTile preserved for /post/preview, /post/tag, find/[id] carousel until Arcs 3-4 |
| 69 | Below-photo timestamp FONT_SYS italic 11.5px v1.inkMuted (italicized session 69 to nod toward IM Fell italic vocabulary) | Inter italic 11.5px v2.text.muted (FONT_SYS retires from Home; recency signal preserved verbatim, only typography migrates) |

### Partial reversal of v2 plan Q3 (a) — explicitly surfaced

v2 migration plan Q3 (a) lock: "Polaroid retires system-wide; row pattern becomes new shared primitive (session-83 'browse vs navigate/detail rule for material chrome' itself retires)."

**Frame C is a partial reversal of this lock.** The polaroid wrapper concept is preserved on Home (warm-paper mat + dimensional shadow), just lighter. Saved Arc 1 already shipped the row pattern primitive for collected-list surfaces; Find Arc 3 + /shelf Arc 4 will retire polaroid per the plan. Home is the holdout where polaroid stays — recast as "lighter polaroid for the browse surface" rather than "polaroid retired everywhere."

The session-83 "browse vs navigate/detail rule for material chrome" therefore stays partially alive after Arc 2: polaroid (lighter) for browse on Home; row pattern for collected-list on Saved. Find + /shelf decisions still pending in Arcs 3-4 — they may unify under row pattern or extract a shared v2 tile primitive that could promote `<HomeFeedTile>` to `<v2/PhotoTile>`. Sequencing rationale stays load-bearing: Arc 3 + Arc 4 are second-consumer triggers for the abstraction call.

## Implementation arcs (sequenced smallest→largest)

Per [`feedback_smallest_to_largest_commit_sequencing`](../memory/feedback_smallest_to_largest_commit_sequencing.md) (190+ cumulative firings):

### Arc 2.1 — `<HomeFeedTile>` v2 primitive in isolation
- New file `components/v2/HomeFeedTile.tsx` per component contract above
- Build clean (tsc + npm run build); no consumer wiring
- Smallest, most-isolated; surgically revertable
- ~1 commit

### Arc 2.2 — Wire HomeFeedTile into Home + dead-code byproduct
- `app/(tabs)/page.tsx` consumer migration: PolaroidTile import retires; HomeFeedTile imported; topRight inline heart `<button>` retires (moves into HomeFeedTile); fallback + below callbacks migrate from FONT_LORA/FONT_SYS + v1.* tokens → FONT_CORMORANT/FONT_INTER + v2.* tokens
- Dead-code byproduct: FONT_LORA + FONT_SYS imports drop from page if no other consumers remain on the file
- v1.green + v1.inkPrimary + v1.inkMuted + v1.inkHairline references on Home tile path retire
- Build clean
- ~1 commit

### Arc 2.3 — iPhone QA on Vercel preview + dial pass if needed
- Dial pass deferred until iPhone QA surfaces specific asks
- Frame C dial locked at design-record values; D3 shadow weight is the most likely iPhone-QA dial axis per the rule "iPhone QA on Vercel preview is the load-bearing judgment moment for visual weight regardless"
- 0-N commits depending on QA outcomes

**Total estimate:** 2-4 commits across 1 session.

## Tier B explicit headroom

Doors deliberately left open by Arc 2; document where so future sessions know what's open vs frozen:

| Item | Reason | Trigger to revisit |
|---|---|---|
| `<v2/PhotoTile>` shared primitive abstraction | Arc 2 ships HomeFeedTile-only (Q4 logic — premature abstraction risk = 0 with one consumer) | When Arc 3 (Find) or Arc 4 (/shelf) ships and reuses photo-tile shape |
| ✓ Found on Home tiles | Q2b — stays Saved-only initially; Find-tier engagement on browse surfaces requires product call | When David's find-to-found north star (session 121) escalates to active design pass |
| Find name / price / booth attribution on Home tiles | Q1a — photograph-only contract preserved | If discovery feed needs informational density (e.g., post-beta user testing surfaces "I can't tell what this is") |
| Polaroid retirement structural call on Find + /shelf carousel + /shelf grid + ShelfTile | Out of Arc 2 scope (Home only) | v2 Arc 3 (Find) — second-consumer trigger for v2 photo-tile primitive abstraction; row vs tile structural call gets made there |
| Last-viewed highlight palette migration (1.5px solid green + halo) | v1.green + rgba(30,77,43,0.13) → v2.accent.green + rgba(40,92,60,0.13) — token migration only, behavior unchanged | Lands in Arc 2.1 verbatim; if highlighted-state visual reads off post-migration, separate dial |
| RichPostcardMallCard above masonry | Sequenced for Arc 5 alongside /map (★ Favorite Mall consumer wiring) | Arc 5 |
| Eyebrow "Finds from: {mall name}" line typography migration | Implicit Arc 2 scope — currently FONT_LORA italic 13 v1.inkMuted | Migrate alongside Arc 2.2 to Cormorant italic 13 v2.text.muted; flag if iPhone QA reads off |

## Memory file updates triggered by Arc 2 ship

Post-Arc-2 ship, update:
- [`v2-visual-migration.md`](./v2-visual-migration.md) — mark Arc 2 status `🟢 Ready` → `✅ Shipped`; reversal log gains Frame C partial-reversal-of-Q3a entry
- No new memory file required (existing rules carried Arc 2 cleanly)

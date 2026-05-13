# Map enrichment — design record

> **Status:** 🟢 Ready (session 158 — design-to-Ready same-session)
> **Mockup:** [docs/mockups/map-enrichment-v1.html](mockups/map-enrichment-v1.html)
> **Scope:** Add user-location marker + nearest-first horizontal mall carousel + carousel-stepping arrows on PinCallout. All scoped to the existing `MallMapDrawer` experience on Home.
> **Surfaces touched:** `components/TreehouseMap.tsx`, `components/PinCallout.tsx`, `components/MallMapDrawer.tsx`, new `components/MapCarousel.tsx`, `lib/clientEvents.ts`, `lib/events.ts`, `app/api/events/route.ts`, `app/home-chrome-test/page.tsx`.
> **No DB migrations.** No new API routes. All substrate already shipped (R17 distance/geolocation hook, leaf-bubble vocabulary, fitBounds/flyTo logic).

## Intent

The map drawer (shipped sessions 154–155) gives shoppers a spatial view of the 29 active Kentucky locations, but offers no orientation cue (where am I?) and no quick way to step through neighbors. Three enrichments:

1. **User-location marker** — a branded leaf "you are here" pin so users orient relative to mall pins.
2. **Bottom carousel** — horizontal-scroll thumbnail strip showing all active malls sorted nearest→furthest; visible only while the drawer is open.
3. **Carousel-stepping arrows on PinCallout** — left/right chevron bubbles flanking the callout that step through the carousel's sorted order, peeking the next-nearest neighbor each tap.

The digital-to-physical bridge thesis (`project_treehouse_thesis_digital_to_physical_bridge`) gets a meaningful sharpen: the map crosses from "show me the places" to "show me **my place** relative to the places." Distance + neighbor-stepping make the carousel a "what's nearby?" affordance — the closest the project has come to "where would I drive next?" as visible chrome.

## Frozen decisions

### D1 — Carousel chrome layer position

Fixed-positioned floating layer, sibling of `MallMapDrawer`'s motion.div (not inside its bounding box). Visible only while drawer is open. Drawer geometry unchanged.

- `position: fixed`, `left/right: 0`, `padding: 0 12px`
- `bottom: 100px` — sits above BottomNav (bottom:22 + height:56 = 78) with a 22px breath gap
- `z-index: 35` — above drawer (z-30), below BottomNav (z-50)
- Mobile-column containment: `left: 50%`, `max-width: 430px`, `transform: translateX(-50%)` mirroring the rest of the app chrome

### D2 — Carousel card shape — Frame B Postcard mini

Locked per session 158 V1 pick. Matches the family vocabulary of v2 mall cards (photo banner + cream body + Cormorant name + Inter distance label).

- **Card dimensions:** 142 × 108 (photo 56 + body ~52)
- **Card background:** `v2.surface.warm` (`#FFFCF5`)
- **Card border:** 1px `v2.border.light` → 1.5px `v2.accent.green` when selected
- **Card border-radius:** 10px
- **Card box-shadow:** `0 1px 2px rgba(43,33,26,0.06), 0 6px 18px rgba(43,33,26,0.06)`
- **Photo:** 56px tall × full card width; `object-fit: cover`; fallback bg `v1.basemap.cream2` when `mall.hero_image_url` is null
- **Body:** padding `5px 10px 8px`; flex column gap 2
- **Mall name:** `FONT_CORMORANT` 13px / weight 600 / `v2.text.primary` / lineHeight 1.3 / 1-line clamp with ellipsis
- **Secondary row (typography slot):** `FONT_INTER` 10px / weight 700 / letterSpacing 0.03em / uppercase / `v2.accent.green`. Content per D3 sort state.
- **Selected-state lift:** `transform: translateY(-3px)`

> **Cohesion note:** Card shape lives as a self-contained primitive at `components/MapCarousel.tsx`. Does not consume retired `<RichPostcardMallCard>` / `<PostcardMallCard>` (deleted session 155). The vocabulary match is intent + token set, not inheritance.

### D3 — Sort order + secondary-row content per permission state

| `useUserLocation().status` | Sort order | Secondary row content |
|---|---|---|
| `granted`, all-Kentucky scope | distance asc from user | distance label from user (e.g. "2.7 MI") |
| `granted`, specific-mall scope | selected mall at index 0, rest sorted distance asc **from selected mall's lat/lng** (spatial neighbors of the anchor) | distance label **from user** for every card |
| `denied` / `unavailable` | alphabetical by `mall.name` | empty (no distance label per Q2=C) |
| `prompting` / `idle` | alphabetical (transient — re-sort once resolved) | empty until resolved |

**Within-session clarification (Arc 2.1 ship):** distance LABEL on each card is always user-centric when granted, regardless of sort anchor. The sort anchor varies (user when all-Kentucky / selected mall when scoped) so the carousel reads as spatial-neighbors-of-anchor, but the displayed distance stays "from where I am right now" — matching `<PinCallout>`'s `<DistancePill>` vocabulary (always user-centric per R17 design). The mental model: sort tells you spatial proximity to the focus; label tells you commute distance from you.

Per `feedback_within_session_design_record_reversal` — original D3 said "distance label from selected mall" when scoped; clarified to "distance label from user" during Arc 2.1 implementation review for consistency with the DistancePill semantic shipped by R17.

Permission-denied state uses alphabetical instead of arbitrary order; "no distance labels" per Q2=C is preserved.

> **Edge case:** Malls with null `latitude` / `longitude` always sort last in the granted branches (treated as `Infinity` distance), preserving their visibility while quietly de-ranking them. They render with an empty secondary row.

### D4 — Selected state visual

- Card border becomes `1.5px solid v2.accent.green` (was 1px `v2.border.light`)
- Card lifts by `translateY(-3px)`
- No color tint, no scale change — border + lift is enough signal against the cream surface

### D5 — Auto-scroll-to-selected card on selection change

When `peekedMallId` updates (via pin tap, card tap, or arrow tap), the carousel auto-scrolls so the selected card is visible:

- `card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })`
- First-mount scroll-to-initial-selected uses `behavior: "instant"` to avoid a startup animation
- Refs map indexed by `mall.id`

### D6 — Card tap behavior — peek (NOT commit)

Tapping a card **peeks** the mall (highlights pin + flies map + shows callout). Does NOT close the drawer or commit scope to Home. The existing **Explore** CTA in the callout remains the explicit commit affordance.

Reasoning: the carousel is a browse-the-neighborhood surface inside the map experience. Forcing every card tap to commit-and-close would lose the spatial preview value of seeing the pin animate on the map. Matches Apple/Google Maps places-carousel pattern (carousel scroll = peek; explicit "View on Map" / "Open" = commit).

> **Within-session reversal candidate:** if iPhone QA reveals users expect tap = commit, single-line flip via `onCardTap` → `onMallPick` instead of `setPeekedMallId`. Per `feedback_within_session_design_record_reversal`.

### D7 — User-pin visual

Branded leaf treatment, variant **(A) filled + pulsing halo**, per session 158 sub-decision pick.

- **Geometry:** 28 × 28 round, `border-radius: 50%`
- **Fill:** `v2.accent.green` (saturated; matches selected mall-pin fill so brand is consistent)
- **Glyph:** `PiLeaf` (Phosphor cohesion per session 145 sweep), 14px, color `v2.surface.warm` (cream-on-green canonical per session 143)
- **Halo:** outer box-shadow at 6px rgba(46,86,57,0.22) + 14px rgba(46,86,57,0.10) for the soft ambient ring
- **Pulse:** absolute pseudo-element ring (1.5px border, `rgba(46,86,57,0.32)`), scale 1 → 1.5 + opacity 0.5 → 0, 2.2s ease-in-out infinite. Animation lives in `TreehouseMap.tsx` inline keyframes block.
- **z-index:** 6 (above mall pins at z-5, below callout at z-9)

> **Brand differentiation:** mall pins are *outlined* (cream interior + green border); user pin is *filled* (solid green + cream glyph + green halo). Same leaf glyph; inverted color treatment signals "you" vs "place."

### D8 — User-pin render gate

| `useUserLocation().status` | Render user pin? |
|---|---|
| `granted` | yes, at `userLoc.lat / userLoc.lng` |
| `denied`, `unavailable`, `idle`, `prompting` | no |

Pin is informational only — no click handler, no onTap, no callout.

### D9 — Arrow chevron bubbles on PinCallout

Sub-decision (a) per session 158: **flanking bubbles outside the callout**.

- **Geometry:** 30 × 30 round, `border-radius: 50%`
- **Background:** `v2.surface.warm`
- **Border:** 1px `v2.border.light`
- **Box-shadow:** same as callout shadow (project-canonical subtle)
- **Glyph:** `PiCaretLeft` / `PiCaretRight` (Phosphor cohesion), size 16px, color `v2.text.secondary`
- **Layout:** flex siblings of the callout, gap 6px. Wrap container `display: flex; align-items: center; gap: 6px`.
- **Hit area:** full 30px bubble; clicks `stopPropagation` so they don't bubble to map's empty-tap dismiss
- **Disabled state:** when at first / last position in sorted order — opacity 0.35, `pointer-events: none`. No glyph swap (still chevron, just dimmed).

> **Visibility gate:** arrows render only when the sorted neighbor list has > 1 mall AND a mall is currently peeked. Same callout-render gate as today.

### D10 — Arrow step semantics

Tapping `‹` peeks the previous mall in carousel sort order (D3). Tapping `›` peeks the next.

- Updates `peekedMallId` (same state path as pin tap or card tap)
- Triggers map `easeTo` to the new pin's coordinates (320ms duration matching session 108 D26's pin-tap recenter)
- Carousel auto-scrolls to the new selected card per D5
- Fires `map_callout_neighbor_stepped` analytics with `{ from_mall_slug, to_mall_slug, direction }`

> Arrows step within the carousel's sorted order — NOT geographic-nearest-from-current-peek. This matches Q4=A locked. Per the sorted list: from anchor, → goes to position+1, ← goes to position−1.

### D11 — Carousel mount/unmount lifecycle

Visible only when `MallMapDrawer.open === true`. Mounts/unmounts via its own `AnimatePresence` block, separate from the drawer's. Same easing + duration as drawer slide-up so the two layers feel coupled.

- `initial={{ y: 100, opacity: 0 }}`
- `animate={{ y: 0, opacity: 1 }}`
- `exit={{ y: 100, opacity: 0 }}`
- `transition`: `MOTION_BOTTOM_SHEET_EASE` + `MOTION_BOTTOM_SHEET_SHEET_DURATION` (existing tokens)

### D12 — State source of truth for selection sync

`peekedMallId` in `MallMapDrawer.tsx` remains the single source of truth (already shipped session 108 D26). All three interaction sources write to it:

- **Pin tap** → `setPeekedMallId(id)` (existing)
- **Card tap** → `setPeekedMallId(id)` (new, via `<MapCarousel onCardTap />`)
- **Arrow tap** → `setPeekedMallId(neighborId)` (new, via `<PinCallout onPrev/onNext />`)

Carousel reads `peekedMallId` + scrolls accordingly; PinCallout reads sorted-neighbor list + renders disabled-state per position.

### D13 — Component contracts

**New: `<MapCarousel>` at `components/MapCarousel.tsx`** (~160 LOC)

```ts
interface MapCarouselProps {
  open:           boolean;
  malls:          Mall[];
  selectedMallId: string | null;     // scoped mall (anchored left when granted)
  peekedMallId:   string | null;     // selected card visual + auto-scroll target
  onCardTap:      (mallId: string) => void;
}
```

Internally computes sorted order via `useUserLocation()` + `lib/distance.ts`. Auto-scroll-to-peeked via ref-map + `useEffect`. Renders own `AnimatePresence`.

**Extended: `<PinCallout>`** (existing — adds 4 props)

```ts
interface PinCalloutProps {
  // ... existing props
  onPrev?:  () => void;
  onNext?:  () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}
```

When `onPrev` / `onNext` defined → renders flanking chevron bubbles. When undefined → existing behavior unchanged (defensive fallback per existing pattern).

**Extended: `<TreehouseMap>`** (existing — internal changes only, no new props)

- Adds user-pin marker rendering inside existing marker-sync `useEffect` (`useUserLocation` already imported)
- Computes sorted neighbor list internally + passes prev/next handlers + has-flags into `<PinCallout>`

**Extended: `<MallMapDrawer>`** (existing — internal changes only)

- Renders `<MapCarousel>` as new sibling inside the existing `AnimatePresence` wrapper
- Passes `peekedMallId` + `onCardTap={setPeekedMallId}` to carousel

### D14 — R3 analytics events

Two new events. Wired in `lib/clientEvents.ts` ClientEventType union + `lib/events.ts` EventType union + `app/api/events/route.ts` CLIENT_EVENT_TYPES whitelist (per session 137 carry — all three sites at write time).

| Event | Payload | Fires when |
|---|---|---|
| `map_carousel_card_tapped` | `{ mall_slug: string, sort_position: number }` | Card tapped in carousel |
| `map_callout_neighbor_stepped` | `{ from_mall_slug: string, to_mall_slug: string, direction: "prev" \| "next" }` | Arrow bubble tapped |

### D15 — Smoke route testbed: `/home-chrome-test`

Existing session-154 smoke route adds `<MapCarousel>` mounted alongside `<MallMapDrawer>` with the same `FIXTURE_MALLS` data. Validates the carousel + user-pin + arrow-stepping primitives in isolation BEFORE production consumer wiring.

Per `feedback_testbed_first_for_ai_unknowns` extended to "any structurally-novel primitive composition," even when no AI/LLM call is involved.

## Tier B explicit headroom (deferred, doors left open)

- **Drag-to-scroll-syncs-map (carousel scroll → flyTo)** — naturally next iteration if D6's tap-only model reads stale; the existing primitives support it.
- **Carousel pagination indicator** — dots or rail under the carousel; only useful when mall count grows past ~15.
- **User-pin tap → context menu** — could surface "Center on me" + "Use this location" affordances. Currently informational only.
- **Permission-denied UX nudge** — toast or banner offering re-prompt CTA. Currently silently falls to alphabetical sort.
- **Granted secondary row enrichment** — could pair distance with city/region ("2.7 MI · Louisville"). Currently distance-only.
- **Outside-KY user-pin** — pin renders at correct lat/lng but viewport clamped to KY_BOUNDS, so it's invisible. Could surface "you're outside KY — showing closest" empty state.
- **Carousel virtualization** — react-window or similar if mall count exceeds ~50.
- **Arrow long-press = jump to first/last** — discoverability tradeoff; defer until carousel has > 10 items.

## Implementation arcs sequenced smallest→largest

### Arc 1 — Foundation (2 commits)

**1.1** Extend `ClientEventType` + `EventType` + `/api/events` whitelist with the two new events (D14). Additive only; zero runtime cost. Smallest possible foundation commit.

**1.2** `<TreehouseMap>` adds user-pin marker (D7 + D8). Extends existing marker-sync `useEffect`; reuses already-imported `useUserLocation()`. Pulse animation lives in inline `<style>` block at module scope (no global CSS edit needed).

### Arc 2 — Carousel primitive (2 commits)

**2.1** `<MapCarousel>` primitive at `components/MapCarousel.tsx` in isolation, mounted on `/home-chrome-test` smoke route (D15). No production consumer wiring yet. Validates layout + sort + auto-scroll + pulse + selected-state visuals.

**2.2** `<MapCarousel>` wired into `<MallMapDrawer>` as sibling. `peekedMallId` state plumbed via `onCardTap` per D12. Carousel mounts/unmounts with drawer per D11.

### Arc 3 — PinCallout neighbor-stepping (1 commit)

**3.1** `<PinCallout>` gains `onPrev` / `onNext` / `hasPrev` / `hasNext` props + flanking chevron bubbles per D9. `<TreehouseMap>` computes sorted-neighbor list internally + wires prev/next handlers + has-flags into the callout. Disabled-state at first/last per D9. Analytics event per D10/D14.

**Total: 5 commits sequenced smallest→largest.** Build clean expected at every commit boundary per `feedback_smallest_to_largest_commit_sequencing`.

## Memory firings anticipated

- `feedback_design_record_as_execution_spec` — 24th cumulative firing target on clean implementation pass (load-bearing operating mode)
- `feedback_smallest_to_largest_commit_sequencing` — 5 firings expected (cumulative ~320+)
- `feedback_testbed_first_for_ai_unknowns` — 7th cumulative firing extended to non-AI primitive composition
- `feedback_visibility_tools_first` — audit-first read of 4 files BEFORE drafting V1 (already fired)
- `feedback_v2_options_before_drafting` — V1 mockup spanned only structural axis; sub-decisions (user-pin + arrows) surfaced as prose Q&A → David picked → no V2 mockup needed
- `feedback_treehouse_no_coauthored_footer` — honored on all commits
- `feedback_session_close_auto_merges_pr` — close protocol when shipping completes

## Cross-references

- R10 design record `docs/r10-location-map-design.md` — original Mapbox + leaf-pin + PinCallout decisions (sessions 106–108)
- R17 design record `docs/r17-geolocation-design.md` — `useUserLocation` hook + DistancePill + LocationActions (sessions 117–119)
- Home chrome restructure `docs/home-chrome-restructure-design.md` — MallMapDrawer + MallStrip (sessions 154–155)
- Session 156 close — Mapbox `resolveCssVar` bridge + defensive load-reliability primitive (CSS-var-to-non-CSS-API context)

---

## Within-session dial bundle (post-iPhone-QA — same session)

After Arc 1–3 shipped, iPhone QA surfaced 7 dial findings (4 design + 3 structural). All shipped within the same session per the post-promotion `feedback_within_session_design_record_reversal` pattern (~6th cumulative firing). Sequenced smallest→largest in 4 commits + this amendment. The original D-decisions are preserved above for design-history traceability; the dial overrides live here.

### Dial A — Carousel cards + flanking arrow bubbles → `v2.surface.card`

**Original** (D2 card spec + D9 arrow bubble spec): `background: v2.surface.warm` (#FBF6EA, slightly warmer).
**Override**: `background: v2.surface.card` (#FFFCF5, matches BottomNav per session 157).

Reason: David's QA: *"Change card bg color of the mall thumbnails to the lighter 'white' (as I'm calling it) we have on the nav bar. Apply this to the bg of the selected card as well and back and forth nav buttons."* PinCallout main box bg stays `v2.surface.warm` — keeps the callout visually warmer than its flanking arrows so the callout reads as the focal entity and arrows read as navigation chrome.

### Dial B — PinCallout typography bump

**Original** (D9 callout typography — implicit, not enumerated as decision): mall name 13.5px Cormorant weight 500 lineHeight 1.2; stat line 11px italic Cormorant lineHeight 1.2.
**Override**:
- Mall name: 18px / weight 600 / lineHeight 1.3
- Stat line: 14px / italic / lineHeight 1.3
- Non-saved copy: `"X finds"` → `"X fresh finds"`
- Saved-state copy: stays `"X saved finds"` (lattice semantic preserved — saved = user's accumulation; fresh = mall inventory currently in stock)

Reason: David's QA: *"Increase font size on the selected pin to 18pt font and 600 weight. Change subtext on pinned card 'x finds' to 14pt font and change to 'x fresh finds'."* Lora-class lineHeight 1.3 floor applies to Cormorant for the same descender-clearance reason (`feedback_lora_lineheight_minimum_for_clamp`).

### Dial C — Peek-state map fly with offset (NEW: card tap also recenters)

**Original** (no D — implementation detail): marker click + arrow tap each call `map.easeTo({ center, duration: 320 })` inline; card tap from carousel does NOT trigger any `easeTo`.
**Override**:
- New module-scope const `MAP_PEEK_OFFSET_Y = -60` (Mapbox easeTo offset shifts target lng/lat 60px above visual container center)
- Single source of truth: new `useEffect` on `peekedMallId` change handles `easeTo` with offset for ALL three peek paths (direct pin tap / carousel card tap / callout arrow tap)
- Marker click handler + `stepTo` helper simplified to `stopPropagation` + `onPinTap` only

Reason: David's QA combined #3 + #6 + #7: pin too close to carousel; card tap should auto-recenter the map. The previous card-tap behavior was a latent bug — `onCardTap` only updated `peekedMallId` so tapping a card with a mall outside the current viewport would leave the callout positioned off-screen. With offset −60: on iPhone SE, callout-to-carousel gap grows from ~86px to ~272px (plenty of breath).

### Dial D — Retire List view affordance + dead-code byproduct

**Original** (D-MapControlPill — implicit): pill dual-state — `scope set → "Reset"`, `all-Kentucky → "List view"` opens `<MallSheet>` picker modal.
**Override**: pill single-state Reset only; renders only when `selectedMallId !== null`. List view branch + `<MallSheet>` render + `sheetOpen` state + `MallSheet` import + `PiList` import all retire.

Reason: David's QA: *"remove list view filter. I don't think we need it anymore."* The `<MapCarousel>` shipped in Arc 2 surfaces the same browse-the-locations affordance more discoverably (photos + distance labels visible directly, not gated behind a tap). `components/MallSheet.tsx` file kept dormant — could be revived as a future list-view primitive on another surface (matches session-152 inverse dead-code-cleanup pattern).

### Tier B headroom items added this dial bundle

- **Saved-state stat copy** — David didn't flag `"X saved finds"`; if "fresh" wording reads aspirational and the user expects to see saved count when applicable, could unify to `"X fresh finds · X saved"` two-line stat.
- **Carousel + callout color hierarchy** — cards/bubbles at `v2.surface.card` (#FFFCF5), callout at `v2.surface.warm` (#FBF6EA). If the brightness difference reads uneven, easy flip to all-three at `v2.surface.card`.
- **`MAP_PEEK_OFFSET_Y` tunable** — currently `-60`. If carousel feels TOO empty above on iPhone 14+ (larger viewport), reduce to `-40` or `-50`. If iPhone SE still feels tight, bump to `-80`.

### Memory firings cumulative through dial bundle

- `feedback_within_session_design_record_reversal` ✅ Promoted — ~6th cumulative firing across project, with 4 distinct reversals captured this dial bundle (Dial A token swap, Dial B typography, Dial C card-tap auto-recenter, Dial D list-view retire).
- `feedback_smallest_to_largest_commit_sequencing` — 4 dial commits sequenced smallest→largest (token swap → typography → map offset → list-view retire).
- `feedback_dead_code_cleanup_as_byproduct` — Dial D retired 4 imports + 1 state + 1 sibling render in the same commit as the feature change.
- `feedback_lora_lineheight_minimum_for_clamp` — Cormorant 1.3 floor applied at 18px name + 14px stat per the post-promotion canonical rule.

---

## Second dial bundle (Dials F–G — post-Dial-bundle-1 iPhone QA)

After Dial bundle 1 (A–E) shipped + iPhone QA on Vercel preview, David surfaced 3 more findings about color treatments + CTA hierarchy on the PinCallout. Same session ship per `feedback_within_session_design_record_reversal` (~7th cumulative firing now). 2 commits sequenced smallest→largest + this amendment.

### Dial F — DistancePill green-on-green + statline label color → green

**Original** (R17 Arc 1 D6): DistancePill renders as a neutral postmark stamp — `bg: v2.surface.warm`, `border: 1px v2.border.light`, `color: v2.text.muted`.
**Override**: green-on-green treatment matching the V1 mockup that shipped in this session — `bg: rgba(46,86,57,0.10)` (translucent green), no border, `color: v2.accent.green`.

**Original** (Dial B): PinCallout stat line `color: v2.text.muted` with green NUMERAL nested inside.
**Override**: outer `color: v2.accent.green` so the entire stat line ("X fresh finds" / "X saved finds") reads in unified brand green.

Reason: David's QA: *"Change the font color of 'fresh finds' to the green color. Also, your mock shows the correct green on green color for the distance pill but that's not reflected on the preview when the mall is selected pin."*

DistancePill is system-wide — change cascades through 1 production consumer (PinCallout) + 1 smoke route (/geolocation-test). Verified via grep audit; SavedMallCardV2 references DistancePill in comments only (renders inline distance label, not the primitive). No collateral damage.

### Dial G — CTA reorder + style swap + "Navigate" → "Directions"

**Original** (R17 Arc 2 D19): `[Explore (outline transparent + green border + green text)]` + `[Navigate (filled green + green border + cream text + Navigation icon)]`.
**Override**: `[Directions (outline)]` + `[Explore (filled green + cream text)]` — reversed order AND swapped styles.

| Slot | Before | After |
|---|---|---|
| Left button | Explore (outline) | Directions (outline) |
| Right button | Navigate (filled green) | Explore (filled green) |
| Copy change | "Navigate" | "Directions" |
| Navigation icon | On Navigate, cream-colored | On Directions, green-colored |

Reason: David's QA: *"Reverse order of Explore and Navigate buttons. Explore should be the dark green color as that's really the action we want them to take here. Change 'Navigate' to 'Directions'."*

Filled-green-on-rightmost is the canonical primary-CTA position; this aligns the visual hierarchy with the product hierarchy (Explore = scope-commit + see all finds at this mall = primary product action; Directions = deep-link to native maps = secondary). `onClick` handlers preserved verbatim — `onBrowse` still commits scope, `onGo` still fires the maps deep-link + analytics — just the button text/style they're attached to swapped.

### Memory firings second dial bundle

- `feedback_within_session_design_record_reversal` ✅ Promoted — 2 distinct reversals (Dial F DistancePill spec + Dial G CTA layout). ~7th cumulative firing across project age.
- `feedback_smallest_to_largest_commit_sequencing` — 2 dial commits sequenced smallest→largest (color treatments → CTA reorder/restyle/recopy).
- `feedback_visibility_tools_first` — DistancePill consumer audit via grep BEFORE editing the system-wide primitive (~5+ cumulative firings).
- `feedback_user_facing_copy_scrub_skip_db_identifiers` ✅ Promoted — analytics event name `find_navigate_tapped` preserved unchanged (DB / event identifier, not user-facing copy). Only the button label changed Navigate → Directions.

### Dial I — statline weight bump to 700 (final pre-close iPhone QA dial)

**Override (Dial B → final)**: PinCallout stat line `fontWeight: 700` on both the outer Cormorant italic label AND the inner FONT_NUMERAL span (was: outer default 400, inner 600). David's QA: *"Change font weight on 'x fresh finds' to 700"* — read as the entire phrase including the number. Unified 700 weight keeps "X fresh finds" reading as one tonal beat rather than mixed weights across font families.

Cumulative typography spec for PinCallout stat line post-Dial-I:
  - `fontFamily`: Cormorant Garamond italic (label) / Times New Roman (number)
  - `fontWeight`: 700 (both)
  - `fontSize`: 14
  - `color`: v2.accent.green
  - `lineHeight`: 1.3

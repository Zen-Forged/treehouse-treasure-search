# /shelf/[slug] refinement — design record

**Status:** 🟢 Ready (V1 approved by David)
**Locked session:** 128 (2026-05-08)
**Surfaces affected:** `/shelf/[slug]` (primary) + `/my-shelf` (D6 + D7 only via shared primitive)
**Mockup:** [shelf-slug-refinement-v1.html](mockups/shelf-slug-refinement-v1.html)

## Premise

Shopper-facing booth detail page consolidates around a tighter "scout this place, save what you want, then go visit" reading flow:

1. Hero with bookmark in canonical top-right slot (system-wide consistency)
2. Centered booth identity (name + mall + address)
3. Window-view-only finds (drop the dual-view affordance — window is canonical)
4. Save bubble on each tile in the canonical top-right slot (consistent with Home + /flagged)
5. LocationActions row anchored to page bottom — frames the "now I want to visit" moment

David's MVP-phase guidance drove D4: **"keep icon in the same upper right corner as all the others for consistency. At this phase I'm really working on functionality and I don't want too many outlier decisions to work for an MVP phase."** System-wide consistency overrides local-feel optimization.

## Reversals surfaced (per `feedback_surface_locked_design_reversals`, >30 firings)

| # | Prior decision | This session | Reason |
|---|----------------|--------------|--------|
| R1 | Session 80 D2 → session 89: hero bookmark moved to bottom-left for stamp-balance | **Returns to top-right** (session 80 placement) | David's "consistency with other surfaces" — bookmark/save = top-right is the system rule |
| R2 | Session 119 D19 (R17 Arc 2): LocationActions twin-button row directly below BoothHero, above BoothTitleBlock | **Moves to page bottom** above BoothCloser | Footer placement frames the "go visit" moment; current placement reads as "scoping the booth" |
| R3 | ViewToggle + ShelfView (long-standing dual-view affordance) | **Retired wholesale** | Window view (polaroid tiles from session 83) is canonical; ShelfView is a redundant alternate that adds learning cost without payoff |
| R4 | Initial within-session lean toward "save flag on polaroid frame bottom-right" (NEW pattern) | **Reverses to canonical top-right photo overlay** (existing `PolaroidTile.topRight` slot used by Home + /flagged) | David: "minimize outlier decisions for MVP phase" — system consistency wins over per-surface optimization. **2nd firing of session-122's "within-session design-record reversal — refinement-of-just-shipped is real-time design loop"** — Tech Rule promotion-ready on next firing. |

## Frozen decisions

### D1 — Hero bookmark position
**Top-right of `BoothHero` photograph.** 36×36 frosted-paper bubble (`BookmarkBoothBubble` "hero" size variant from session 80). Reverses session 89's bottom-left placement.

### D2 — `ViewToggle` retired
Drop `<ViewToggle>` component from `BoothPage.tsx` entirely. Both `/shelf/[slug]` and `/my-shelf` consumers drop the toggle. Page-level `view` state retires (no longer needed).

### D3 — `ShelfView` + `ShelfAddFindTile` retired
`<WindowView>` is the only find-rendering path. Drop `<ShelfView>` + `<ShelfAddFindTile>` exports from `BoothPage.tsx`. `BoothView` type can either retire or stay if other consumers reference it (likely retire — single-rendering surfaces don't need a discriminator).

### D4 — Save flag uses canonical `PolaroidTile.topRight` slot on /shelf/[slug] tiles
28×28 frosted-paper bubble overlaid on photo top-right (existing slot used by Home heart + /flagged unsave bubble). Filled green leaf when saved, outline when unsaved. **No new primitive contract** — existing `PolaroidTile.topRight` prop is already wired for this exact pattern. Tap fires `find_saved` / `find_unsaved` per existing R3 event vocabulary.

`/my-shelf` does NOT pass save state to its tiles (vendor-self surface; vendors don't save their own finds).

### D5 — LocationActions footer placement
Twin-button row (`<LocationActions>` from session 118) anchored at page bottom, **above `<BoothCloser>`**, below the WindowView grid. Reverses session 119 D19's "directly below BoothHero" placement.

DistancePill (R17 D18) — open question: does the pill move with LocationActions to the footer, or stay in its current position below the BoothHero photograph? **Implementation-time call**: keep DistancePill in its current position (above BoothTitleBlock as a hero-anchored data point) since it reads as "this is where you are relative to the booth" — context for the page, not action invitation. LocationActions are the action invitation.

### D6 — BoothTitleBlock + MallBlock centered
**Currently left-aligned in prod**; David flagged during V1 review.

- `BoothTitleBlock`: `textAlign: "center"` on wrapper. Eyebrow + h1 + picker chevron + edit-pencil all center. Picker `textAlign: "left"` button override removed.
- `MallBlock`: drop the grid-with-pin-left-column layout. Center mall name + address. **Implementation-time call**: PinGlyph renders inline before mall name (visual anchor) OR retires entirely. Default: render inline before mall name to preserve the place-marker semantic; flip to retire if it reads cluttered on real content.

Affects **both /shelf/[slug] AND /my-shelf** via the shared primitive.

### D7 — BoothCloser text
**From:** `"The shelf ends here. More booths await you."`
**To:** `"That's everything we've gathered from this booth today — check back as new finds arrive."`

Affects both surfaces. Single string change in `BoothCloser` component.

## Component contracts

### `components/BoothPage.tsx`
- **`<ViewToggle>`** (lines ~558–619) — DELETE.
- **`<ShelfView>`** + **`<ShelfAddFindTile>`** — DELETE export + render path.
- **`<BoothTitleBlock>`** (line 313+) — add `textAlign: "center"` to wrapper; remove `textAlign: "left"` from picker button override; center the inline picker chevron + edit-pencil flex row.
- **`<MallBlock>`** (line 462+) — drop grid layout; center mall name + address. Decide: PinGlyph inline before mall name OR retire.
- **`<BoothHero>`** — bookmark prop's render position changes from bottom-left (session 89) to top-right (session 80 placement). `BookmarkBoothBubble` "hero" size variant unchanged.
- **`<BoothCloser>`** (line 1139+) — replace closer text per D7.
- **`BoothView` type** — retire (single-rendering means no discriminator needed).

### `components/PolaroidTile.tsx`
**No changes.** Existing `topRight` slot is the canonical placement and is already wired for filled-vs-outline saved-state rendering on Home + /flagged. /shelf/[slug] consumer simply starts passing the bubble.

### `app/shelf/[slug]/page.tsx`
- Drop `ViewToggle` + `ShelfView` imports + render (lines ~509, ~526+).
- Move `<DistancePill>` placement: keep below BoothHero photograph (D5 implementation-time call).
- Move `<LocationActions>` from above BoothTitleBlock (lines ~493–505) to below WindowView grid + above BoothCloser.
- WindowView consumer: pass per-tile save state via the existing `topRight` slot. Likely shape: `<WindowView>` accepts an `onToggleSave?: (postId: string) => void` + `savedIds?: Set<string>` prop pair, OR consumer wraps each tile with the bubble itself. Implementation choice deferred to Arc 3.

### `app/my-shelf/page.tsx`
- Drop `ViewToggle` + `ShelfView` imports + render.
- Drop `view` page-level state.
- D6 + D7 inherit automatically via the shared primitive — no /my-shelf-specific code change.
- No save-bubble plumbing (vendor-self).

## R3 events
**No new events.** Existing `find_saved` / `find_unsaved` (from R1 Arc 4 session 112) fire from the save-bubble taps. Verify event names + payload includes `post_id` during Arc 3.

## Implementation arcs (sequenced smallest→largest)

### Arc 1 — Primitive changes (~3 commits)
1. `BoothTitleBlock` + `MallBlock` centering (D6) — affects both /shelf/[slug] + /my-shelf via shared primitive.
2. `BoothCloser` text (D7) — single string change.
3. `BoothHero` bookmark position (D1) — single style change.

Build clean at each commit boundary. Both surfaces visually verifiable in Vercel preview.

### Arc 2 — View-toggle retirement (~1 commit)
Drop `<ViewToggle>`, `<ShelfView>`, `<ShelfAddFindTile>` from `BoothPage.tsx`. Drop imports + render path from both consumers. Drop `view` page-level state. Drop `BoothView` type if unused. **Single coupled commit** because the deletions cascade cleanly.

Net runtime change: substantial deletion (likely −150 to −300 lines).

### Arc 3 — Save bubble + LocationActions footer (~2 commits)
1. `/shelf/[slug]` consumer: pass save state to WindowView tiles via `topRight` slot. Wire `find_saved` / `find_unsaved` event taps. (D4)
2. `/shelf/[slug]` consumer: relocate `<LocationActions>` from above-title to below-grid above-closer. (D5)

DistancePill stays in current position per D5 implementation-time call.

## Verification
- `tsc` + `npm run build` clean at every commit boundary.
- iPhone QA on production after merge (Vercel Preview env vars now scope-correct per session 127):
  - /shelf/[slug] cold load: bookmark top-right, centered identity, window-only grid, save bubbles on tiles, LocationActions at bottom, new closer text
  - /my-shelf cold load: centered identity, window-only grid, new closer text, no save bubbles, no LocationActions

## Carry forward
- **Session-122 "within-session design-record reversal" pattern fires 2nd time** at R4 (Frame B/C lean → Frame C accept). Tech Rule promotion-ready on 3rd firing.
- **PinGlyph in MallBlock**: implementation-time call between inline-before-mall-name and retire. Default to inline; flip during iPhone QA if cluttered.
- **`BoothView` type retirement**: verify no external consumers before deleting.
- **DistancePill placement**: stays below BoothHero photograph for now; if iPhone QA reads it as orphaned context, candidate for moving with LocationActions to the footer.

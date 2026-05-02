# `/flagged` destination redesign — design record

> **Status:** 🟢 Ready for implementation. Mockup approved session 99 (2026-05-01). Frame C from V2 picked.
>
> **Mockups:** [`flagged-destination-v1.html`](mockups/flagged-destination-v1.html) (structural exploration — per-find vs grouped-by-booth, retired) · [`flagged-destination-v2.html`](mockups/flagged-destination-v2.html) (booth-container fill, 3-frame CTA-placement axis, **Frame C picked**)
>
> **Implementation session:** size M, ~45–60 min including iPhone QA.

## Why this redesign

The current `/flagged` page reads as ecommerce — a 3-column polaroid grid with a `BoothLockupCard` section header above each booth's saves. David's session-99 framing: *"It doesn't quite carry the story forward in terms of digital window to physical store, it reads as ecommerce page still to me. So conceptually I'm trying to figure out how to make this page feel more like an elevated experience, a destination to travel to and it feels like a checklist of items thrown on a page."*

The redesign reframes the page from "list of saved finds" to "**a return visit to physical places where you saved things**." Each booth becomes a self-contained destination unit; the saved finds are its inventory.

Reference: AirBnB Wishlists pattern — saved listings as a destination/trip, not a queue. David called out the AirSplit-style two-button card footer specifically as the missing weight. Frame C carries that forward in the Treehouse aesthetic.

---

## Frozen decisions

### D1 — Mall scope OUTSIDE the booth containers (page-level)
Existing `MallScopeHeader` pattern is preserved unchanged: mall picker title (`Bluegrass Antique Mall ▾`) + scope eyebrow `Saved finds` + save count chip on the right. The mall identifies the page; booth containers below are scoped to the picked mall. No change to mall picker behavior.

### D2 — Booth-as-container framing
Each booth-group renders as a bounded card:
- Background: `v1.paperWarm` (`#f5f2eb`)
- Border: `1px solid v1.inkHairline`
- Radius: `12px`
- Subtle shadow: `0 1px 3px rgba(42, 26, 10, 0.05)`
- Overflow hidden so the inner hairlines align with the rounded corner

Containers are stacked on a slightly darker scrim (`rgba(0,0,0,0.04)`) with `14px` outer padding and `14px` gap between containers. The scrim establishes "these are discrete destinations, not a continuous list."

### D3 — Booth header at top of container (no chevron, no inline action)
Padding: `13px 16px 12px`. Bottom border: `1px solid v1.inkHairline`.
- **Booth name** — Lora 500, 21px, `v1.inkPrimary`, line-height 1.2, single-line ellipsis on overflow.
- **Booth pill** — TNR (Times New Roman), 19px, `v1.green`, prefixed with `· ` (e.g. `· C-12`).
- No chevron. No inline action. Header is informational; the destination affordance lives at the footer.

### D4 — Horizontal find rows inside the container
Each saved find is one row:
- Padding: `12px 16px`
- Layout: flex row, `align-items: center`, `gap: 12px`
- Hairline divider between rows; none after the last row before the CTA

Three slots:
- **Left — polaroid thumbnail (62px wide).** Same `PolaroidTile` shape as Home masonry but at thumbnail scale. `4:5` aspect, `v1.paperCream` background, `4px 4px 6px` mat padding, dimensional shadow `0 3px 8px rgba(42, 26, 10, 0.18) + 0 1px 2px rgba(42, 26, 10, 0.10)`, radius 3px outer / 1px inner.
- **Middle — title.** Lora 400, 14px, line-height 1.4, `v1.inkPrimary`, 3-line clamp via `-webkit-line-clamp: 3`. Title is allowed to extend across the full middle width.
- **Right — price.** Lora 500, 14px, `v1.priceInk`, right-aligned, top-aligned to title's first line (`align-self: flex-start`, `padding-top: 1px`).

### D5 — Leaf bubble follows polaroid shape
On the polaroid thumbnail, top-right corner:
- 18×18 frosted bubble, `rgba(245,242,235,0.88)` background, circular, `box-shadow: 0 1px 2px rgba(42,26,10,0.12)`
- Contains the `FlagGlyph` leaf icon at `v1.green`
- **Functions as unsave tap target** — preserves current `/flagged` behavior (tap removes from saves, list refreshes).
- Visual register matches Home masonry / `/find/[id]` polaroid corner bubble (sessions 81 + 87).

### D6 — "Explore the booth →" outlined green button at footer
Inside the booth container, under the last find row:
- Margin: `12px` (all sides)
- Padding: `11px`
- Width: `calc(100% - 24px)`
- Border: `1px solid v1.green`
- Background: `v1.paperWarm`
- Color: `v1.green`
- Lora 500, 14px
- Radius: 8px
- Content: `Explore the booth →` (text + arrow as separate `<span>` for kerning control)
- Routes to `/shelf/[slug]` (shopper-facing booth window) on tap. Admin-mode users still go to `/shelf/[slug]` (admin doesn't get a different routing target from `/flagged`).

This is the AirSplit-style move: an explicit outlined CTA beneath the inventory. **Quiet but unmistakably a button**, not a link. One per booth-container; no per-find CTAs.

### D7 — Grouping by booth (not chronological)
Consecutive same-booth saves are grouped under one booth container. Within a container, find rows are ordered by save date (most-recent first). No interleaving across booths even if save-time ordering would otherwise interleave — booth-grouping wins over save-time ordering.

### D8 — Empty-state unchanged
The existing `<EmptyState>` primitive (session 96) renders when no saves exist on the picked scope. No change to its content or chrome.

### D9 — Per-find unsave bubble on thumbnail (NOT a row-swipe gesture)
Tap-to-unsave stays on the leaf bubble itself. Row-swipe / long-press patterns are out of scope — they'd require gesture training the user doesn't have on the rest of the app.

### D10 — Mall filter behavior unchanged
The existing mall picker filter (`Bluegrass Antique Mall ▾` / `All Kentucky Locations`) still scopes which booth-containers render. No change to filter chrome.

---

## What this replaces

The current `/flagged` rendering chain:
1. `MallScopeHeader` (kept — D1)
2. Filter chip row (kept — D10)
3. **For each booth:** `<BoothLockupCard>` section header *(replaced — booth header now lives inside container, D3)*
4. **For each booth:** 3-col grid of `<PolaroidTile>` saved finds *(replaced — horizontal find rows inside container, D4)*
5. `<EmptyState>` when filter hides everything (kept — D8)

`BoothLockupCard` is **NOT retired globally** — it's still used at `/shelves` (the booth directory). The `/flagged` page just stops importing it.

---

## Implementation notes

### Files touched

| File | Change |
|---|---|
| [`app/flagged/page.tsx`](../app/flagged/page.tsx) | Rewrite the render path. Drop `BoothLockupCard` import. Drop 3-col grid markup. Add booth-container wrapper + horizontal find row markup inline. |
| [`lib/tokens.ts`](../lib/tokens.ts) | (Possibly) add `v1.shadow.boothContainer` if the subtle shadow value (`0 1px 3px rgba(42,26,10,0.05)`) doesn't already exist as a token. Audit first. |
| `components/PolaroidTile.tsx` | **No change.** Component already supports thumbnail-scale rendering via `width` prop / wrapper sizing. Caller passes 62px wrapper. |
| `components/FlagGlyph.tsx` | **No change.** Existing leaf glyph + frosted bubble pattern is reused at smaller scale. |

### Inline-vs-extract decision

**Don't extract a `<BoothDestinationContainer>` primitive yet.** /flagged is the only callsite. Per project pattern (`feedback_verify_primitive_contract_via_grep.md` + sessions 83 + 95), extract on second-callsite, not on first. Keep the JSX inline in `app/flagged/page.tsx`.

If a future surface adopts the booth-container pattern (most likely candidate: `/shelves` if the booth directory ever gets per-booth saved-finds previews), revisit extraction then.

### "Explore the booth →" CTA — inline button, not `FormButton`

`FormButton` (session 96) currently has `size: 'page' | 'compact'` + `variant: 'primary' | 'link'`. The outlined-green-on-paper-warm shape this CTA needs doesn't match either existing variant cleanly. Options:
- **(a) Inline the CTA** in `/flagged` for v1. ~10 lines of JSX. Quickest.
- **(b) Add a new `FormButton` variant** (`outline`?) for outlined buttons. Would benefit any future "secondary CTA" but currently has only this one callsite.

**Pick (a) for v1.** If a second outlined-CTA surface lands (most likely Wave 2 — R10 mall map "Get directions" or R1 shopper-account "Save for later"), revisit. This honors the "extract on 2nd callsite" rule.

### Routing

CTA `onClick` → `router.push('/shelf/' + vendor.slug)` per the existing booth-window routing. No URL parameter changes. No new routes.

### Telemetry

Add R3 event `flagged_booth_explored` fire-and-forget on CTA tap, payload `{ vendor_id, vendor_slug, mall_id, save_count_at_tap }`. Lets us measure whether the destination CTA is doing its job vs. shoppers just unsaving from the page.

(R3 events already wired in `/flagged` for `post_unsaved` on heart tap; this is one additional event.)

### Existing patterns reused

- `MallScopeHeader` — unchanged
- `<EmptyState>` primitive — unchanged for filterHidesAll case
- `<PolaroidTile>` — used at thumbnail scale via wrapper sizing
- `<FlagGlyph>` — existing leaf glyph
- `v1` design tokens — paperWarm, paperCream, postit, ink-primary/mid/muted/hairline, green, priceInk, lora font

---

## Out of scope

- **Mall hero photo treatment.** Mall hero relocation work shipped session 92; the mall scope header on `/flagged` doesn't render a hero photo today. Don't add one in this session.
- **Booth hero photo on the container.** The booth header is text-only (D3). Adding the booth's `vendor.hero_image_url` as a banner inside the container would visually compete with the find row polaroids. Future revisit if "destination" feel still reads thin after iPhone QA.
- **Map view.** R10 (location map nav) is parked. Don't add map controls here.
- **Per-find CTAs** (e.g. "View this find" link on each row). The polaroid + title row is already tappable → routes to `/find/[id]`. No additional CTA needed.
- **Vendor-side booth-of-mine surfacing on `/flagged`.** Vendors who have saved their own finds (rare) still see those saves; no special-casing.
- **Animation / motion.** None added. The page is static-by-design after session 88's "pull out all the animations" total strip.
- **Pagination cap.** Existing 30-day window from R5a remains; no change to cutoff or pagination.

---

## Verification gate

1. `npm run build` clean
2. **iPhone QA on Vercel preview** — open `/flagged` with realistic seed data:
   - Single mall with 3+ booths and ≥2 saves per booth
   - At least one find with a long title that hits the 3-line clamp
   - At least one find with a short title (1-line) for visual rhythm verification
   - Save / unsave a find and confirm the row leaves the container; container disappears if it was the last save
   - Tap "Explore the booth →" and confirm `/shelf/[slug]` loads
3. **Compare visually against Frame C** of [`flagged-destination-v2.html`](mockups/flagged-destination-v2.html).
4. **Empty state** — filter to a mall with zero saves; confirm `<EmptyState>` renders.
5. **All-Kentucky-Locations scope** — pick `All Kentucky Locations` on the mall picker; confirm booth containers from multiple malls render correctly stacked, with the mall name visible somewhere (the booth header pill alone may not surface mall — flag if so during iPhone QA).

### Watch-items for iPhone QA

- **Thumbnail size** at 62px on a real device — may want 70px (more visual weight to match polaroid identity) or 56px (more title space).
- **Title 3-line clamp** vs. uncapped — 3-line cap might truncate plausible antique-mall titles awkwardly. Test with real seed data.
- **Container outer scrim** at `rgba(0,0,0,0.04)` may be too subtle on iPhone in daylight. May want darker (0.06) or none.
- **CTA button visual weight** — outlined green at the bottom of every booth-container could read as repetitive. If so, dial down to italic Lora link (Frame B from mockup) as the fallback.

---

## Risks

- **Low.** Single-page rewrite, no schema changes, no new components, no new routes, no new tokens needed (audit confirms).
- **Medium-low risk:** the All-Kentucky-Locations scope renders booth-containers across malls without surfacing which mall each is in. If iPhone QA reveals this is confusing, add a small italic mall-name eyebrow above the booth header (`at Bluegrass Antique Mall`) or show the mall name in the cartographic block of the header. Captured as iPhone QA watch-item, not pre-decided.

---

## Decision provenance

| # | Decision | Origin |
|---|---|---|
| D1 | Mall scope outside | David sketch + V2 mockup |
| D2 | Booth-as-container | David sketch ("Booth Name + B15 inside box") |
| D3 | Booth header no chevron | V2 Frame C picked over Frame A |
| D4 | Horizontal find rows | David's session-99 spec ("polaroid + title next to it + price") |
| D5 | Leaf bubble polaroid-shape | David's "saved/leaf icon follows the same shape as the other images" |
| D6 | Footer outlined button | V2 Frame C (AirSplit reference) |
| D7 | Group by booth | David's session-99 spec (booth-as-container) |
| D8 | EmptyState unchanged | Session 96 primitive remains canonical |
| D9 | Unsave on bubble | Preserves current /flagged behavior |
| D10 | Mall filter unchanged | Existing pattern remains canonical |

---

*This is the dev-handoff doc. The mockup is the visual contract; this doc is the implementation contract. If they disagree, the mockup wins. Implementation session executes against this doc + Frame C of the V2 mockup file.*

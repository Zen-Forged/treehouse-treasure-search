---
status: Ready
session: 80
mockup: docs/mockups/wordmark-and-booths-tile-v2.html (no dedicated mockup — pattern derived from /find/[id] flag, session 78)
---

# Bookmark relocation — masthead → BoothHero photo corner

Item 4 of David's session 80 redirect bundle. Frozen decisions D1–D7 below;
approved 2026-04-28 in session 80 redirect.

## Why

The "save a vendor's booth" affordance currently lives in the right slot of
`/shelf/[slug]`'s masthead, paired with the share airplane. Two issues:

1. **Masthead chrome doubled-up.** Session 78 established on `/find/[id]` that
   the share airplane is the masthead's only right-slot icon — flag (the find-
   level save) lives on the photograph corner. `/shelf/[slug]` is the booth-
   level analog and should follow the same pattern: share is masthead, the
   save affordance is on the photo.
2. **"Flag a find / bookmark a booth" mental model is split across surfaces.**
   On a find detail page the flag sits on the photo. On a booth detail page
   the bookmark sits in the masthead. Different rules for visually similar
   surfaces. Moving the bookmark to the BoothHero photo corner reunifies
   the rule: **the save affordance always sits on the corner of the entity
   you're saving.**

## Frozen decisions

| ID | Decision | Choice |
|----|----------|--------|
| **D1** | Bookmark moves from `/shelf/[slug]` masthead right slot → BoothHero photograph top-right corner. Masthead right slot becomes share-airplane-only. | Per item 4 spec. Mirrors session 78 `/find/[id]` flag-on-photo pattern. |
| **D2** | Bubble is a SIBLING of the photo's `motion.div layoutId`, not a child. | Per session 78's hard-won `feedback_preview_cache_for_shared_element_transitions.md` lesson — `layoutId` children inside `layoutId` parents drop frames mid-flight under cross-route shared-element transitions. Sibling pattern keeps the morph stable. |
| **D3** | Position `top: 8, right: 8`, bubble 36×36, glyph 18px, frosted formula. | Position + bubble size identical to `/find/[id]` flag (session 78 `b95bec0`). Glyph 18px (one px over the flag's 17px) because the Bookmark icon shape is more compact and reads slightly under-weighted at 17. |
| **D4** | NO `layoutId` on the bookmark bubble. Static fade-in only — no shared-element morph between `/shelves` tile bookmark and BoothHero bookmark. | Adding `bookmark-${vendor.id}` would extend the `layoutId` namespace exactly where session 79 imploded (cross-page namespace collisions, conditional-layoutId timing fights React batching + framer projection + Next.js Link). Sticking to a single `booth-${vendor.id}` photo morph; bookmark is just a static affordance on the destination. If future sessions want the bookmark to morph too, that's a separate `/transition-test`-first session. |
| **D5** | `BookmarkBoothBubble` gains a `"hero"` size variant alongside existing `"tile"` (28px) and `"masthead"` (38px). Hero is 36×36 frosted, 18px glyph — same frosted-paper formula as tile, sized to match `/find/[id]` flag rect for visual sibling rhythm. | Single primitive owns all three contexts; consumer picks via `size` prop. |
| **D6** | Bubble only mounts when caller passes `saved` + `onToggleBookmark` props. `/my-shelf` (owner view) omits the props; bookmark hidden — owners cannot bookmark their own booth. | Mirrors session 67 rule: admin tiles already carry Pencil + Trash bubbles; bookmark hidden on owner surfaces to avoid self-bookmark UX nonsense. |
| **D7** | Track D phase 5 photograph `motion.div layoutId` is preserved. Bubble does NOT participate in the booth tile → BoothHero shared-element transition. | Photo morph from `/shelves` tile to BoothHero stays as session 78 `b95bec0` shipped. The bookmark is a static destination affordance that simply appears on the BoothHero after morph completes. |

## Implementation

### `components/BookmarkBoothBubble.tsx`

New `"hero"` size variant. Bubble 36, glyph 18, frosted-paper formula
(matches `"tile"` formula, not the masthead wash).

```ts
const bubble = isHero ? 36 : isMasthead ? 38 : 28;
const glyph  = isHero ? 18 : isMasthead ? 18 : 14;
const bg = isMasthead
  ? v1.iconBubble
  : "rgba(232,221,199,0.78)"; // both hero + tile
```

aria-label semantics unchanged: `"Bookmark this booth"` / `"Remove booth bookmark"`.

### `components/BoothPage.tsx` — `<BoothHero>`

Two new optional props on `BoothHero`:

```ts
saved?:             boolean;
onToggleBookmark?:  () => void;
```

When both are set, render the bubble as a sibling of the photograph
`<motion.div layoutId>` (D2):

```tsx
{saved !== undefined && onToggleBookmark && (
  <div style={{ position: "absolute", top: 8, right: 8, zIndex: 11 }}>
    <BookmarkBoothBubble
      saved={saved}
      size="hero"
      onClick={(e) => {
        e.stopPropagation();
        onToggleBookmark();
      }}
    />
  </div>
)}
```

z-index sits between the lightbox overlay (z 5) and the post-it (z 12) so
the bookmark stays interactive without obstructing the post-it tap target.

### `app/shelf/[slug]/page.tsx`

- `Masthead` component drops `showBookmark`, `saved`, `onToggleBookmark`
  props from its API.
- Right slot in `<StickyMasthead>` collapses to share airplane only (when
  `canShare`). When share is hidden (no available finds), right slot is empty.
- `boothBookmarked` state + `handleToggleBoothBookmark` handler stay; pass
  to `<BoothHero>` via the new props instead of the masthead.
- `<BoothHero>` callsite gains `saved={boothBookmarked}` and
  `onToggleBookmark={handleToggleBoothBookmark}` (both gated on `!isOwner`
  via existing `showBookmark` derivation).

### `app/my-shelf/page.tsx`

No changes. Owner view never wired bookmark to masthead in the first place
and continues to omit the new BoothHero props (D6).

## What we're NOT doing

- **Not adding a layoutId for the bookmark.** D4 hard rule. Future session
  with `/transition-test` validation can add it if the static fade-in feels
  insufficient.
- **Not adding bookmark to admin /shelves tiles.** Spec deviation captured
  session 67 — admin tiles already carry Pencil + Trash; bookmark would be
  the fourth bubble. Admin can bookmark via `/shelf/[slug]` BoothHero (now
  on the photo, formerly in masthead).
- **Not changing the `/shelves` tile bookmark.** Tile bookmark stays at
  `top: 6, right: 6` with the existing 28px tile variant. The relocation
  is masthead-only.

## Carry-forward

- **Bookmark-on-photo is now the universal save-affordance pattern across
  ecosystem detail surfaces.** `/find/[id]` flag, `/shelf/[slug]` bookmark.
  Mall pages don't have a save-mall affordance; if one is added later, it
  follows the same pattern (corner of the mall hero photo).
- **Masthead right slot's only right-side icon is share airplane** on every
  detail surface that has share. Bookmarks, flags, edits all live on the
  photograph.

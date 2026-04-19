# Treehouse — v1.2 Build Spec (Post-flow trilogy)
> Status: APPROVED — David signed off via mockups session 28 (2026-04-19)
> Scope: retire `/post`, refresh `/post/preview`, build new `/find/[id]/edit`
> Source of truth: the three approved mockups in `docs/mockups/` (links below)

This is a build document. It captures what was approved and tells the next code session what to build. It is NOT the decision doc — every decision here was locked through mockup review, not through prose review. If a future session wants to deviate from anything in this file, it has to go back to David with a new mockup, not a revised spec.

---

## Approved mockups (the source of truth)

- `docs/mockups/add-find-sheet-v1-2.html` — Add Find Sheet on `/my-shelf` (Frame 3, stripped version)
- `docs/mockups/review-page-v1-2.html` — Review Your Find page (formerly `/post/preview`)
- `docs/mockups/edit-listing-v1-2.html` — Edit Your Find page (new route)

**If any mockup and this document disagree, the mockup wins.** This document's job is to translate the visuals into build tasks; it does not add constraints the vendor didn't see and approve.

---

## What's being built

### 1. `<AddFindSheet>` primitive (NEW)

New file: `components/AddFindSheet.tsx`. Models structurally on `<MallSheet>` — paperCream bg, 20px top radius, drag handle, backdrop dismiss, framer-motion y-slide with `left:0 right:0 margin:0 auto` centering (NOT translateX).

Content:
- Header: IM Fell 22px "Add a find" — no italic subhead (stripped variant)
- Hairline divider
- Two rows, each a button. Grid `24px 1fr auto`, 24px left glyph column:
  - Row 1: Camera glyph (22px, stroke 1.6, `v1.inkPrimary`) + IM Fell 18px "Take a photo"
  - Row 2: ImagePlus glyph (22px, stroke 1.6, `v1.inkPrimary`) + IM Fell 18px "Choose from library"
- No sub-labels on rows, no trailing content — clean single-line rows, `min-height: 64px`
- Row border-bottom: hairline between, none on last row

Props contract:
```ts
interface AddFindSheetProps {
  open: boolean;
  onClose: () => void;
  onTakePhoto: () => void;       // triggers hidden camera input
  onChooseFromLibrary: () => void; // triggers hidden gallery input
}
```

The sheet itself doesn't manage the `<input type="file">` elements — it calls back to the parent which owns them. Keeps the sheet stateless.

### 2. `/my-shelf` — wire the sheet

`app/my-shelf/page.tsx` gains:
- Two hidden `<input type="file">` refs: one for camera (`capture="environment"`), one for gallery
- State: `showAddSheet: boolean`
- `?openAdd=1` URL param auto-opens the sheet on mount (supports redirect shim from old `/post`)
- `?vendor=id` URL param (admin-only — gated by `isAdmin(user)`) resolves a different vendor's identity into `postStore` context before the sheet opens; admin can post on behalf of any vendor from `/my-shelf?vendor=[id]`
- `<AddFindTile>` (and `<ShelfAddFindTile>`) in `components/BoothPage.tsx` change from `<Link href="/post?vendor=...">` to a button that calls `onAddClick()` passed down as prop; `/my-shelf` wires that to `setShowAddSheet(true)`

Flow after photo picked:
1. Read file → `FileReader.readAsDataURL` → compressed data URL via `compressImage()`
2. Stash in `postStore` (in-memory, matches current `/post/preview` handoff)
3. `setShowAddSheet(false)`
4. `router.push("/post/preview")`

### 3. `/post` — retire as page, keep as redirect shim

`app/post/page.tsx` becomes ~15 lines:
```tsx
"use client";
export const dynamic = "force-dynamic";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PostRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const vendor = searchParams.get("vendor");
    const qs = vendor ? `?vendor=${vendor}&openAdd=1` : "?openAdd=1";
    router.replace(`/my-shelf${qs}`);
  }, [router, searchParams]);
  return null;
}

export default function PostPage() {
  return <Suspense><PostRedirect /></Suspense>;
}
```

Preserves inbound links from emails, bookmarks, docs. Can retire entirely in a post-beta cleanup after inbound references are audited.

### 4. `/post/preview` — refresh to v1.2

Full rewrite of `app/post/preview/page.tsx`. Imports from `@/lib/tokens` (`v1`, `FONT_IM_FELL`, `FONT_SYS`, `FONT_POSTIT_NUMERAL`) — no inlined `C` palette. Retires Georgia serif entirely.

Structure (see `docs/mockups/review-page-v1-2.html`):

**Masthead (Mode C):** 38px back-bubble (paper variant, `v1.inkBubble` bg) + stacked title block. IM Fell 24px "Review your find" + IM Fell italic 14px muted "Here's how shoppers will see it."

**Photograph:** `<PhotographPreview>` primitive — see #6 below. Post-it with vendor's booth number pinned bottom-right, +6deg, Times New Roman 36px numeral per `FONT_POSTIT_NUMERAL`. Same primitive is reused on `/find/[id]/edit`.

**Posting-as attribution row:** 22px margin from post-it bottom (accounts for -14px overhang), horizontal flex-wrap row. 14px pin glyph in `v1.inkMuted` + IM Fell 16px primary vendor name + system-ui 13px muted booth + mall + city, separated by `·` in `v1.inkFaint`. 0.5px `v1.inkHairline` border-bottom. Single-line attribution on wide screens, wraps on narrow.

**Fields section:** 18px 22px padding, 16px gap between field groups. Order: **Title → Caption → Price**.
- Labels: IM Fell italic 13px `v1.inkMuted`, sentence case, optional indicator in `v1.inkFaint` italic
- Inputs: `v1.inkWash` style — `rgba(255,253,248,0.70)` bg, 1px `v1.inkHairline` border (1.5px `v1.inkPrimary` on focus), 14px radius, 14px padding, `FONT_SYS` 16px `v1.inkPrimary`
- Price has `$` prefix absolutely-positioned, `padding-left: 28px` on input
- NO Edit/Done pill pattern — fields are always editable (retires the existing `EditableLabel` component)
- NO `<ItemImage>` component — replaced by `<PhotographPreview>`

**Save bar (sticky):** fixed bottom, `rgba(232,221,199,0.96)` bg with `backdrop-filter: blur(24px)`, 1px top hairline. Single filled-green CTA: **"Publish"** (not "Save to Shelf" — vendor approved "Publish" in session 28).
- White `FONT_SYS` 15px 500 weight
- 14px radius, 15px vertical padding
- Disabled state when `!title.trim()` — muted surface bg, muted text color
- Publishing state: IM Fell italic "Publishing…" with opacity pulse animation

**Behavior (preserved from current):**
- AI caption auto-generation on mount via `/api/post-caption` — unchanged from session 27 (`source: "claude" | "mock"` check stays)
- Amber notice via new `<AmberNotice>` primitive when AI returns non-Claude source
- On Publish: upload image via `uploadPostImageViaServer()` → `createPost()` → `postStore.clear()` → success screen
- Success screen: paper-wash 60px check bubble (primitive from v1.1k, reused) + IM Fell 22px "Saved to shelf." + IM Fell italic 13px "It's live in the Treehouse feed." + three stacked actions: filled green "View my shelf" / surface "Visit us on Facebook" / text link "Add another find"

### 5. `/find/[id]/edit` — new page

New file: `app/find/[id]/edit/page.tsx`. Structure deliberately parallels `/post/preview` — this is the point. See `docs/mockups/edit-listing-v1-2.html` for all three states.

**Auth gate (on mount):**
1. `getSession()` → if no user, `router.replace("/login?next=" + encodeURIComponent("/find/" + id + "/edit"))`
2. `getPost(id)` → if not found, `router.replace("/find/" + id)` (Find Detail's own 404 behavior handles the rest)
3. `getVendorByUserId(user.id)` → verify `post.vendor_id === vendor.id`. If mismatch AND not admin, `router.replace("/find/" + id)` silently (no error UI — shopper lands on public view)
4. Admin bypass: if `isAdmin(user)`, allow edit regardless of ownership

**Masthead (Mode C):** same pattern as Review. Title: "Edit your find" / subhead: "Changes save as you type."

**Photograph:** `<PhotographPreview>` primitive — same as Review. With two additions:
- **Replace photo button** — dark-translucent pill top-left (10px inset), `rgba(20,18,12,0.58)` bg, `backdrop-filter: blur(8px)`, 1px `rgba(255,255,255,0.14)` border, 999px radius, 7px 11px 7px 9px padding. RefreshCw icon 12px + FONT_SYS 12px "Replace photo" inline, 6px gap. Tap → opens hidden camera/gallery picker input (same pattern as Add sheet handoff). On pick: cross-fade new image in place, show inline confirmation bar below photo with "New photo picked. Save replacement?" + filled green "Save" + text-link "Cancel". On Save: compressed upload via `uploadPostImageViaServer`, PATCH to `/api/my-posts/[id]` with new `image_url`.
- **If `status === "sold"`:** photo gets `filter: grayscale(100%) brightness(0.92); opacity: 0.88` — matches how shoppers see sold finds on Find Detail. Post-it is unaffected.

**Posting-as row:** identical to Review.

**Fields section:** identical to Review for Title / Caption / Price. Then one additional field group:

**Status field** (new — Edit only):
- Label: IM Fell italic 13px muted "Status"
- Two-pill segmented control, `grid-template-columns: 1fr 1fr`, 8px gap
- Pill: 12px 14px padding, 999px radius, IM Fell 16px
- Inactive pill: `v1.inkMuted` text, `v1.inkWash` bg, transparent border
- Active pill: `v1.inkPrimary` text, `v1.inkWash` bg, 1.5px `v1.inkPrimary` border, 500 weight
- Labels: "Available" / "Sold"
- Tap flips toggle immediately + fires PATCH to `/api/my-posts/[id]` with new status
- On successful flip: inline confirmation below, 10px 14px padding, `v1.inkWash` bg, 10px radius, 0.5px `v1.inkHairline` border. 13px green check + IM Fell italic 13px `v1.inkMuted` text
  - When flipping to sold: "Marked sold. Shoppers will see this as 'Found a home.'"
  - When flipping back to available: "Marked available again."
- Confirmation fades after ~3 seconds

**Autosave behavior:**
- Per-field: on change, debounce 800ms, PATCH `/api/my-posts/[id]` with only changed fields
- On success: inline "Saved" check glyph appears in `field-label-row` right side for 2 seconds then fades. Green check 11px + FONT_SYS italic 11px `v1.green` "Saved"
- On failure: `<AmberNotice>` primitive above the field: "Couldn't save that change — retry?" with dotted-underline retry link. Same amber pattern as the AI-caption failure notice on Review.
- Status toggle and photo replace are IMMEDIATE writes, not debounced (explicit user gestures; different UX contract).

**Destructive action (bottom):**
- 28px 22px 40px padding wrapper, flex center
- IM Fell italic 14px `v1.red`, dotted underline with `rgba(139,32,32,0.38)` color, 3px underline offset
- Text: "Remove from shelf"
- Tap fires immediate delete via `deletePost(id)` from `lib/posts.ts` + `router.replace("/my-shelf")`. No confirmation sheet — David approved the quiet-link treatment as sufficient. Future sprint can add a confirmation if on-device QA reveals accidental taps.

### 6. `<PhotographPreview>` primitive (NEW)

New file: `components/PhotographPreview.tsx`. Shared between Review and Edit.

```ts
interface PhotographPreviewProps {
  imageUrl: string;           // can be object URL, data URL, or public URL
  boothNumber: string | null; // drives the post-it; if null, no post-it renders
  sold?: boolean;             // if true, applies grayscale/opacity to image only
  topLeftAction?: ReactNode;  // optional — used by Edit for the Replace button
}
```

Composition:
- Outer wrapper: 18px 22px padding (page margin)
- `.photo` container: 100% width, `aspect-ratio: 4/5`, 6px radius, 1px `v1.inkHairline` border, `v1.paperCream` bg (paper fills letterbox areas), `overflow: visible` (for post-it overhang), `box-shadow: 0 2px 10px rgba(42,26,10,0.1)`
- `.photo-inner`: absolute inset 0, 6px radius, `overflow: hidden`, `v1.paperCream` bg, flex center
- `<img>`: `max-width: 100%`, `max-height: 100%`, `width: auto`, `height: auto`, `object-fit: contain`. This is the truth rule: image renders at its natural aspect, paper fills whatever's left. No crop, ever.
- `topLeftAction` slot: absolutely positioned top-left at 10px 10px, z-index 12
- Post-it: identical to Find Detail post-it — see `app/find/[id]/page.tsx` for the canonical treatment. Uses `boothNumeralSize(boothNumber)` from `lib/utils.ts` for auto-scale.
- When `sold === true`: `.photo-inner img` gets `filter: grayscale(100%) brightness(0.92); opacity: 0.88`. Post-it unaffected.

### 7. `<PostingAsBlock>` primitive (NEW)

New file: `components/PostingAsBlock.tsx`.

```ts
interface PostingAsBlockProps {
  vendor: Vendor; // resolved via getVendorByUserId or getVendorById
}
```

Under the hood reads `vendor.display_name`, `vendor.booth_number`, `vendor.mall.name`, `vendor.mall.city`. No auth-optional fallback — this component only renders when vendor identity is resolved. Both `/post/preview` and `/find/[id]/edit` guard on this upstream.

Composition:
- 16px 22px 14px padding
- Flex wrap row, 8px gap, align-items center
- 14px muted pin glyph (flex-shrink: 0)
- IM Fell 16px `v1.inkPrimary` vendor name
- `·` separator in `v1.inkFaint`
- system-ui 13px `v1.inkMuted` for "Booth {N}" / mall name / city
- 0.5px `v1.inkHairline` border-bottom
- All within `flex-wrap: wrap` so narrow screens break to multiple lines cleanly

### 8. `<AmberNotice>` primitive (NEW)

New file: `components/AmberNotice.tsx`. Formalizes the v1.1l amber pattern.

```ts
interface AmberNoticeProps {
  children: ReactNode;
  action?: ReactNode; // optional retry link, appears inline
}
```

Composition:
- 10px 12px padding, 10px radius
- `v1.amberBg` (`rgba(122,92,30,0.08)`) background
- 1px `v1.amberBorder` (`rgba(122,92,30,0.22)`) border
- Flex row, 9px gap, align-items flex-start
- 13px `AlertCircle` glyph in `v1.amber` (`#7a5c1e`), flex-shrink 0, margin-top 1
- 12px `v1.amber` body text, line-height 1.55

Consumers in v1.2:
- Review page: AI caption failure notice (already exists inline — refactor to use primitive)
- Edit page: autosave failure notice
- Future: any graceful-collapse-failure visible signal

### 9. `PATCH /api/my-posts/[id]` route (NEW)

New file: `app/api/my-posts/[id]/route.ts`.

```ts
// POST /api/my-posts/[id] — partial update of vendor's own post
// Auth: requireAuth + server-side ownership check
// Body: { title?, caption?, price_asking?, status?, image_url? }
// Returns: updated post row
// Rate limit: 20/60s per user
```

Implementation outline:
1. `const auth = await requireAuth(req); if (!auth.ok) return auth.response;`
2. Read post id from route params
3. Fetch post; get `post.vendor_id`
4. Fetch `getVendorByUserId(auth.user.id)`; verify `vendor.id === post.vendor_id` (allow admin bypass via `isAdmin(auth.user)`)
5. Parse body; whitelist only `title`, `caption`, `price_asking`, `status`, `image_url`
6. Coerce types (`price_asking` as number|null, `status` as "available"|"sold")
7. Update via `updatePost(id, updates)` or `updatePostStatus(id, status)` (both already in `lib/posts.ts`, currently unused — finally wired)
8. Return updated row

### 10. Find Detail (`/find/[id]`) — one-line addition

Owner-only edit affordance. When viewer is the post's owner (existing `isMyPost && isCurator` check), the save-heart bubble in the photograph's top-right corner is replaced by a **Pencil icon edit bubble** — same frosted paperCream treatment, same dimensions, routes to `/find/[id]/edit` on tap.

Share bubble unchanged.

Non-owners continue to see Save (heart) + Share (send) as today.

---

## Component + token changes summary

**New files:**
- `components/AddFindSheet.tsx`
- `components/PhotographPreview.tsx`
- `components/PostingAsBlock.tsx`
- `components/AmberNotice.tsx`
- `app/find/[id]/edit/page.tsx`
- `app/api/my-posts/[id]/route.ts`

**Full rewrites:**
- `app/post/page.tsx` → ~15-line redirect shim
- `app/post/preview/page.tsx` → v1.2 chrome, retires `<ItemImage>` + `<EditableLabel>`

**Modified:**
- `app/my-shelf/page.tsx` — wires sheet, hidden file inputs, `?openAdd=1` handler, `?vendor=id` admin path
- `components/BoothPage.tsx` — `<AddFindTile>` and `<ShelfAddFindTile>` change from `<Link>` to `<button>` with `onAddClick` prop
- `app/find/[id]/page.tsx` — owner-only edit bubble replaces save bubble when `isMyPost && isCurator`
- `lib/tokens.ts` — add `amberBg`, `amberBorder`, `amber`, `inkWash` if not present (confirm during code sprint)

**Retired:**
- `/post` as a standalone page (kept as redirect shim)
- `<ItemImage>` component (replaced by `<PhotographPreview>`)
- `<EditableLabel>` / Edit-Done pill pattern (fields always editable)
- Inline `C` palette objects in `app/post/page.tsx` and `app/post/preview/page.tsx`
- Georgia serif across all three surfaces
- Posting tips block on `/post` (gone with the page)
- "Save to Shelf" copy → "Publish" everywhere in the post flow

---

## Build-order recommendation for code session

1. `components/AmberNotice.tsx` (smallest, no dependencies)
2. `components/PostingAsBlock.tsx` (small, uses `v1` tokens)
3. `components/PhotographPreview.tsx` (medium, depends on post-it treatment from Find Detail)
4. `app/post/preview/page.tsx` rewrite (consumes the three primitives)
5. `components/AddFindSheet.tsx` (modeled on MallSheet)
6. `app/my-shelf/page.tsx` wiring (sheet + URL params + file inputs)
7. `app/post/page.tsx` redirect shim
8. `components/BoothPage.tsx` AddFindTile props change
9. `app/api/my-posts/[id]/route.ts` (backend — before the UI that calls it)
10. `app/find/[id]/edit/page.tsx` (depends on everything above)
11. `app/find/[id]/page.tsx` owner-edit bubble

Estimated total: 3–4 hours for a focused code session.

**Pre-deploy checklist:**
- [ ] 🟢 `npm run build` green against committed state
- [ ] 🖐️ Verify every new file declared in session close exists on disk (file-creation verify Tech Rule, session 25)
- [ ] 🖐️ `git add -A && git commit -m "..." && git push`
- [ ] 🖐️ On-device QA: Add flow (camera + gallery both), Publish flow, Edit flow (all fields, status toggle, replace photo, remove), Find Detail owner-edit bubble

---

## What this spec explicitly does NOT commit

- No changes to `/vendor-request` (its MallSheet migration is still deferred from v1.1k)
- No changes to Find Detail beyond the owner-edit bubble replacement
- No changes to Feed, Find Map, Booth pages, admin surfaces
- No mall-transfer feature (a find's mall is fixed at post time)
- No bulk-edit or multi-select on the vendor's shelf
- No confirmation sheet on "Remove from shelf" (quiet link treatment approved)
- No Find Map crop visibility (named as post-beta backlog, not v1.2)
- No "Published" / "Draft" states — posts are always published; Edit is live-edit

---

## Process note (session 28)

This spec is short because the three mockups carry the design decisions. Previous design-system versions (v1.1h, v1.1k, v1.1l) lived in `docs/design-system.md` as ~14-paragraph textual commitments; David's feedback this session was that that format requires executive-level fluency in design-system vocabulary and creates expensive revision costs. The v1.2 process reversed that: mockup-first review, plain-English decisions via structured select questions, build spec written AFTER approval as a dev-handoff doc rather than a decision doc. This spec should not need David to review it; its readers are future Claude sessions and any dev handoff. If the mockups and this document ever disagree, the mockups are truth.

The v1.2 commitments can transplant into `docs/design-system.md` during the code sprint (session 29 open) as a condensed Status block — Design agent decides how much to carry forward based on what proves load-bearing during build.

---
> Build spec authored session 28.
> Pairs with the three approved mockups in `docs/mockups/` (add-find-sheet, review-page, edit-listing).

# Booths public + booth bookmarks — Design record

> **Status:** 🟢 Ready (frozen session 67, 2026-04-26).
> **Mockup:** [`docs/mockups/booths-bookmarks-v1.html`](mockups/booths-bookmarks-v1.html).
> **Effort:** S (1 session — straight sprint against this spec).
> **Purpose of this doc:** Freeze the design decisions so the implementation session can run as a straight sprint against a spec. David has approved the mockup; this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

Open the `/shelves` (Booths) page from admin-only to every visitor and add a "bookmark a booth" affordance that mirrors — but is verbally distinct from — the existing find-save flag (`<FlagGlyph>` / `treehouse_bookmark_{postId}`).

The shipped behavior:

1. **Booths tab visible to everyone.** Guest, vendor, and admin see a 4-tab (or 3-tab guest) bottom nav with Booths between Home and Find Map.
2. **`/shelves` is a public booth browser.** No `<AddBoothInline>` form; no admin "Manage" labels for non-admins; admin pill remains in the masthead for admins only (existing `<AdminOnly>` wrapper).
3. **Each booth tile carries a bookmark bubble** — Lucide `Bookmark` glyph, 28px frosted bubble, top-right of the square hero, cream-outlined unsaved → green-filled saved. Same green-fill saved-state vocabulary as `<FlagGlyph>`, distinct shape.
4. **Filter chip row** above the first mall section: `All booths · Bookmarked (n)`. Bookmarked chip + count are hidden when count = 0.
5. **`/shelf/[slug]` masthead** gains the same bookmark glyph in a 32px wash bubble next to the existing share airplane. Hidden when viewing your own booth.
6. **`/my-shelf` is untouched.** Vendors discover their bookmarks via the Booths tab + chip like everyone else (deliberate scope cut — see D12).

The verbal mapping: **flag a find, bookmark a booth.** Two save vocabularies for two object classes, both green-on-cream, both localStorage-persisted, no backend change.

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Route + label naming. | **Keep `/shelves` route, "Booths" nav label.** Renaming the route is a redirect-shim job for zero user-facing benefit; the URL is rarely seen and `/shelf/[slug]` already exists for the singular case. | David, session 67. |
| D2 | Tab order for the now-public Booths tab. | **`Home · Booths · Find Map · [My Booth]`.** Browsing/discovery sits next to Home; Find Map is personal-saves territory and reads better near My Booth. | David, session 67. |
| D3 | Glyph: reuse `<FlagGlyph>` or a new icon? | **New icon — Lucide `Bookmark`** (corner-ribbon shape). Reusing FlagGlyph would dilute the find-save vocabulary session 61 just standardized. Same green-fill-when-saved behavior. | David, session 67. |
| D4 | Persistence: localStorage or Supabase? | **localStorage.** Key prefix `treehouse_booth_bookmark_` mirroring the find-save pattern. Works for guests; no auth gate; no migration. Promote to Supabase post-beta if cross-device sync becomes a real ask. | David, session 67. |
| D5 | Where does the bookmark surface? | **Tile bubble on `/shelves` + filter chip on `/shelves` only.** (Originally also a `/my-shelf` strip — see D12 reversal.) | David, session 67. |
| D6 | Bookmark glyph on `/shelf/[slug]`? | **Yes — masthead top-right wash bubble.** A shopper landing from a window-share email is the highest-value bookmark moment. | David, session 67. |
| D7 | Grid grouping for non-admins. | **Mall-grouped, same as today's admin grid** ("Treehouse Antique Mall" header → tiles → next mall). Scannable, tells the geography story. | David, session 67. |
| D8 | Filter chip placement. | **Above the first mall section, scrolls with content.** Keeps masthead clean; chips fall off-screen when scrolling, return on scroll-up. | David, session 67. |
| D9 | Zero-bookmarks state. | **Hide the `Bookmarked` chip entirely** (chip row collapses). Not shown disabled — empty teaching surfaces clutter the chrome. | David, session 67. |
| D10 | Self-bookmark gate on `/shelf/[slug]`. | **Hide the bookmark glyph when the viewer's `user_id` matches the vendor's `user_id`.** Same vendor edits their own booth via `/my-shelf`; the bookmark is for *other* booths. | David, session 67. |
| D11 | Nav icons. | **Unchanged.** Booths = `LayoutGrid`, My Booth = `Store`. New bookmark glyph (corner ribbon) does not collide with either. | David, session 67. |
| D12 | `/my-shelf` "Bookmarked Booths" strip? | **Removed from scope.** Vendors will use the Booths tab + Bookmarked chip like everyone else. Reconsider only if vendors specifically request it post-beta. Frame 3 of the mockup is preserved as design history with a REJECTED stamp. | David, session 67. |

**All twelve decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

---

## File-level changes

### New primitives

#### `lib/utils.ts` — booth bookmark helpers

Add three exports parallel to the existing find-save helpers (`flagKey`, `loadFollowedIds`, `loadBookmarkCount`):

```ts
const BOOTH_BOOKMARK_PREFIX = "treehouse_booth_bookmark_";

export function boothBookmarkKey(vendorId: string): string {
  return `${BOOTH_BOOKMARK_PREFIX}${vendorId}`;
}

export function loadBookmarkedBoothIds(): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(BOOTH_BOOKMARK_PREFIX) && safeStorage.getItem(k) === "1") {
      ids.add(k.slice(BOOTH_BOOKMARK_PREFIX.length));
    }
  }
  return ids;
}

export function loadBookmarkedBoothCount(): number {
  return loadBookmarkedBoothIds().size;
}
```

Use `safeStorage` (existing wrapper at `lib/storage.ts`) for reads/writes — handles Safari ITP localStorage clearing.

**Why `"1"` as the value (not `true`, not a JSON object)?** Mirrors the find-save pattern. Single-character payload, atomic write, no parse step on read.

#### `components/BookmarkBoothBubble.tsx` — new primitive

Wraps the Lucide `Bookmark` icon in the frosted-bubble shape used across the app (matches `<FlagGlyph>` callsite shape: same bubble dimensions, same fill semantics).

```tsx
"use client";
import { Bookmark } from "lucide-react";
import { v1 } from "@/lib/tokens";

interface Props {
  saved:  boolean;
  size?:  "tile" | "masthead";  // tile = 28px bubble / 14px glyph; masthead = 32px / 15px
  onClick: (e: React.MouseEvent) => void;
}

export default function BookmarkBoothBubble({ saved, size = "tile", onClick }: Props) {
  const dims = size === "tile"
    ? { bubble: 28, glyph: 14 }
    : { bubble: 32, glyph: 15 };

  // Tile variant uses frosted-paper bubble (matches feed-tile FlagGlyph bubble shape).
  // Masthead variant uses iconBubble wash (matches Find Detail back / share buttons).
  const bubbleStyle: React.CSSProperties = size === "tile"
    ? {
        width: dims.bubble, height: dims.bubble, borderRadius: "50%",
        background: "rgba(232,221,199,0.78)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        border: "0.5px solid rgba(42,26,10,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", WebkitTapHighlightColor: "transparent",
      }
    : {
        width: dims.bubble, height: dims.bubble, borderRadius: "50%",
        background: v1.iconBubble,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", WebkitTapHighlightColor: "transparent",
        color: saved ? v1.green : v1.inkPrimary,
      };

  return (
    <button onClick={onClick} aria-label={saved ? "Remove bookmark" : "Bookmark this booth"} style={bubbleStyle}>
      <Bookmark
        size={dims.glyph}
        strokeWidth={1.8}
        style={{
          color:  saved ? v1.green : (size === "tile" ? v1.inkPrimary : "inherit"),
          fill:   saved ? v1.green : "none",
        }}
      />
    </button>
  );
}
```

**Why a single primitive with a `size` prop, not two separate components?** Tile and masthead use the same glyph + same saved-state semantics; only the bubble chrome differs. One primitive keeps the saved-state behavior in one place; if D9-style behavior shifts, it shifts in one file.

### Modified files

| File | Change |
|------|--------|
| [`components/BottomNav.tsx`](../components/BottomNav.tsx) | Tab visibility flip. Replace lines 79–83. New tab order: guest → `[homeTab, boothsTab, findsTab]`; vendor → `[homeTab, boothsTab, findsTab, myBoothTab]`; admin → same as vendor (admin no longer gets a special tab list — they get the Booths tab via the same path everyone does). Update file-header comment to reflect the new gate. |
| [`app/shelves/page.tsx`](../app/shelves/page.tsx) | Three changes: (1) Remove `<AddBoothInline>` block at lines 402–416 entirely + remove the `addBoothOpen` state + the `AddBoothInline` import. The component file itself stays in tree (admin tooling). (2) Add filter chip row between subtitle and main grid; chips control a `filter: "all" \| "bookmarked"` state. (3) On each `<VendorCard>` hero, render `<BookmarkBoothBubble size="tile" saved={bookmarkedIds.has(vendor.id)} onClick={…toggle…} />` at top-right (same z-layer as existing admin Trash/Pencil bubbles). When `filter === "bookmarked"`, filter `vendors` to `bookmarkedIds.has(v.id)` *before* `groupByMall`. Keep the existing admin-only `Manage` label, edit, delete affordances behind their existing `<AdminOnly>` wrappers. |
| [`app/shelf/[slug]/page.tsx`](../app/shelf/[slug]/page.tsx) | Add `<BookmarkBoothBubble size="masthead" />` to the masthead right slot, sitting between any existing left-of-airplane affordance and the existing share airplane. Hide via `vendor.user_id !== currentUser?.id` check (D10 self-bookmark gate). The `currentUser` is already loaded by the page for the share-button gate; reuse that. |
| [`app/my-shelf/page.tsx`](../app/my-shelf/page.tsx) | **Untouched.** D12 — vendors use the Booths tab like everyone else. |

### Untouched / explicitly out of scope

- **`components/AddBoothInline.tsx`** — file stays in tree as future admin tooling (the component is well-tested; no reason to delete). Just no longer rendered on `/shelves`.
- **`components/FlagGlyph.tsx`** — find-save glyph is unchanged. The two glyphs coexist by deliberate visual distinction (corner ribbon vs. flag-on-pole).
- **Admin pill at top of `/shelves`** — already wrapped in `<AdminOnly>`; no change.
- **Admin grid affordances** (`Manage` label, edit Pencil, delete Trash bubble) — already wrapped in `<AdminOnly>`; no change.
- **Mall grouping logic** (`groupByMall`) — applies the same way for non-admins. Section headers, hairline rule, "N booths" right-aligned count: all unchanged.
- **`/vendor/[slug]`** — legacy v0.2 page, separate from `/shelf/[slug]`. Not touched.
- **No DB migration. No RLS change. No new API endpoint.**

---

## State matrix

Who sees what across the three relevant surfaces, post-implementation:

| Surface | Guest | Vendor (signed-in, not admin) | Admin |
|---|---|---|---|
| **`/shelves` Booths tab in nav** | ✅ Visible | ✅ Visible | ✅ Visible |
| **`/shelves` admin pill in masthead** | ❌ Hidden | ❌ Hidden | ✅ Visible |
| **`/shelves` Add a booth form** | ❌ Removed for everyone | ❌ Removed for everyone | ❌ Removed for everyone (use Admin pill → /admin) |
| **`/shelves` filter chips (All / Bookmarked)** | ✅ Visible (Bookmarked hidden if count=0) | ✅ Visible (Bookmarked hidden if count=0) | ✅ Visible (Bookmarked hidden if count=0) |
| **`/shelves` tile bookmark bubble** | ✅ Tap to save | ✅ Tap to save | ✅ Tap to save |
| **`/shelves` tile Manage / edit / delete affordances** | ❌ Hidden | ❌ Hidden | ✅ Visible |
| **`/shelf/[slug]` masthead bookmark glyph** | ✅ Visible | ✅ Visible (✅ also when viewing other booths; ❌ when viewing own) | ✅ Visible (✅ also for booths admin owns? — admin doesn't own vendor rows; treated as guest for self-gate purposes) |
| **`/my-shelf` Bookmarked Booths strip** | n/a | ❌ Not added (D12) | ❌ Not added (D12) |

**Self-bookmark gate detail (D10):** the check is `vendor.user_id !== currentUser?.id`. If `currentUser` is null (guest), the glyph shows — guests have no "own booth" notion. If `currentUser.id === vendor.user_id`, the glyph is hidden for that vendor's view of their own public booth.

---

## Visual specs

Pulled from `lib/tokens.ts` and the mockup. Implementation MUST match these — drift comes back to the mockup, not to a per-screen judgment call.

### Bookmark bubble — tile variant (on `/shelves`)

- Bubble: 28×28, 50% radius
- Background: `rgba(232,221,199,0.78)` (matches `--pill-bg-frost` from mockup, mirrors the FlagGlyph feed-tile bubble formula at smaller scale)
- Backdrop filter: `blur(8px)` + `-webkit-backdrop-filter: blur(8px)`
- Border: `0.5px solid rgba(42,26,10,0.12)`
- Position: `top: 6px; right: 6px` on the hero (admin Pencil/Trash bubbles share this layer; admin tile reads `top:7 right:8` already — this layer is fine sitting one pixel inside that)
- Z-index: 3
- Glyph: 14×14, `strokeWidth={1.8}`
- Unsaved: `stroke=v1.inkPrimary`, `fill="none"`
- Saved: `stroke=v1.green`, `fill=v1.green`

### Bookmark bubble — masthead variant (on `/shelf/[slug]`)

- Bubble: 32×32, 50% radius
- Background: `v1.iconBubble` (`rgba(42,26,10,0.06)` — same wash as Back, Share)
- Position: in the right-slot grid cell, sitting before the existing share airplane (gap: 8px)
- Glyph: 15×15, `strokeWidth={1.8}`
- Unsaved: `color: v1.inkPrimary`, `fill="none"`
- Saved: `color: v1.green`, `fill: v1.green`

### Filter chip row (on `/shelves`)

- Container: `display: flex; gap: 8px; padding: 10px 14px 0;`
- Chip default: `font-family: FONT_SYS; font-size: 11px; font-weight: 500; padding: 5px 11px 5px 9px; border-radius: 999px; background: rgba(42,26,10,0.04); border: 1px solid v1.inkHairline; color: v1.inkMid;`
- Chip active: `background: v1.green; border-color: v1.green; color: #fff;`
- Chip count badge (inside chip): `font-family: ui-monospace; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 999px;` — bg `rgba(255,255,255,0.18)` on active, `rgba(42,26,10,0.10)` on inactive
- Bookmarked chip glyph (10×10 leading the chip): `Bookmark`, `strokeWidth={2}`, color matches chip text
- Hide entire `Bookmarked` chip when `bookmarkedIds.size === 0`

### `BottomNav` tab order (post-change)

- **Guest** (no user): `Home · Booths · Find Map`
- **Vendor** (user, not admin): `Home · Booths · Find Map · My Booth`
- **Admin**: same as Vendor — `Home · Booths · Find Map · My Booth` (admin pill on masthead provides admin entry; bottom nav stops being a special-case)

This is a meaningful simplification — the admin/vendor `tabs` arrays converge after this change. Update the file-header comment in `components/BottomNav.tsx` to reflect the new shape.

---

## Implementation order

1. **`lib/utils.ts`** — add `boothBookmarkKey`, `loadBookmarkedBoothIds`, `loadBookmarkedBoothCount`. No consumers yet.
2. **`components/BookmarkBoothBubble.tsx`** — new primitive. No consumers yet. Build clean.
3. **`components/BottomNav.tsx`** — gate flip + tab-order change + file-header comment. Visible regression: every user now sees Booths tab. Build clean.
4. **`app/shelves/page.tsx`** — remove AddBoothInline; add filter chips; wire BookmarkBoothBubble onto each card; add `bookmarkedIds` state + filter logic. Build clean.
5. **`app/shelf/[slug]/page.tsx`** — add masthead bookmark bubble with self-gate. Build clean.
6. **iPhone QA walk** — five flows: (a) guest opens `/shelves`, taps three booth bubbles, navigates to Booths tab, filters Bookmarked → only those three show; (b) vendor signs in, sees Booths tab, taps own booth via Booths grid → lands on `/shelf/[slug]` with NO bookmark glyph in masthead; (c) vendor taps another vendor's booth → bookmark glyph IS present; (d) admin signs in, sees Admin pill + admin "Manage" labels + bookmark bubble (admin can bookmark too); (e) localStorage clears → bookmarked chip disappears, all tiles return to unsaved.
7. **Commit shape:** one runtime commit `feat(booths): open shelves to all + booth bookmarks`. Plus the design-record commit (this doc + mockup) which lands BEFORE implementation per the same-session rule.

---

## Out of scope (parked for later)

- **Bookmarked Booths strip on `/my-shelf`.** D12 reversal. Reconsider only if vendors specifically ask.
- **Cross-device bookmark sync.** Requires Supabase `booth_bookmarks` table. Post-beta only.
- **Bookmark count + analytics events** (`booth_bookmarked` / `booth_unbookmarked`). Worth wiring once R3 stale-data mystery resolves so we can measure adoption.
- **`/mall/[slug]` parity.** Mall page is still on v0.2 dark theme; lensless per session 66 deviation. When the v1.x ecosystem migration runs there, consider whether mall-bookmarks become a concept too. Not a R12-class addition.
- **Search / sort beyond the chip filter.** `groupByMall` keeps the geography story; no alphabetical or activity-sorted variants this pass.
- **Empty-state copy on `/shelves` when bookmarked filter shows zero results despite count > 0.** Edge case (would require a stale localStorage entry pointing to a deleted vendor). Defer until observed.

---

## Why this design

Three load-bearing rationales worth preserving for future sessions:

1. **Glyph divergence is deliberate.** Session 61 just standardized FlagGlyph for find-saves across four callsites. Reusing it for booths would say "saving a find = saving a booth," which it isn't (a booth is a place; a find is an object). The corner-ribbon `Bookmark` icon carries the "saved for later, not commerce" signal that already worked for the heart→flag arc — without diluting the flag vocabulary.

2. **localStorage matches the find-save pattern.** Two object classes (finds, booths), two parallel persistence layers, one mental model. When R10 (cross-device sync via Supabase) lands, both classes migrate together. Splitting them now (Supabase for booths, localStorage for finds) creates a cross-cutting concern.

3. **D12 surface-cut keeps responsibility clean.** Adding a /my-shelf strip would mean two surfaces answer the question "where are my bookmarked booths" — the Booths tab + chip, and the strip. With one surface (Booths tab + chip), there is one source of truth, one place to look, and one fewer place to keep in visual sync if the bookmark vocabulary evolves. If vendors actually request the strip post-beta, the cost of adding it then is a single component import and 30 lines of JSX — cheaper than maintaining the redundancy speculatively.

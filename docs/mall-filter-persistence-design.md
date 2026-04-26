# Persist mall filter across Home / Booths / Find Map — Design record

> **Status:** 🟢 Ready (frozen session 68, 2026-04-26).
> **Mockup:** [`docs/mockups/mall-filter-persistence-v1.html`](mockups/mall-filter-persistence-v1.html).
> **Effort:** S (1 session — straight sprint against this spec).
> **Purpose of this doc:** Freeze design decisions so the implementation session runs as a straight sprint. David has approved the approach; this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

The Home tab today carries a tappable mall picker (`<FeedHero>` → `<MallSheet>` → `treehouse_saved_mall_id` localStorage). The Booths tab (newly public as of session 67) and the Find Map tab have no picker UI today.

This change adds the same picker affordance to Booths and Find Map and has all three tabs read/write the same localStorage key. Picking a mall on any tab persists across tabs on next mount.

The shipped behavior:

1. **Three tabs share one persisted mall filter** — `treehouse_saved_mall_id` localStorage key (already used by Home; reused as-is, zero migration).
2. **Same picker idiom on all three** — italic eyebrow + tappable bold name + chevron-down. Tapping opens the existing `<MallSheet>` bottom sheet.
3. **Per-tab eyebrow text** — Home: "Finds from across" / "Finds from"; Booths: "Booths across" / "Booths at"; Find Map: "Saves across" / "Saves at".
4. **Booths flat-grid when filtered** — per-mall section headers drop. Just one grid of booths in the picked mall. Bookmarked-chip filter from session 67 composes (intersect when both active).
5. **Find Map filter as intent** — visible saves narrow to picked mall. Empty state when no overlap: "No saved finds at [MallName]. *Show all malls* to see them."
6. **One clear-filter affordance** — the "All malls" row at the top of `<MallSheet>` (already shipped).

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Per-tab picker UI vs. one global picker. | **Each tab has its own picker affordance** (Home keeps its FeedHero; Booths + Find Map each gain the same idiom). All three share the same localStorage key — picking on any tab updates the others on next mount. | David, session 68. |
| D2 | What does "persist" mean? | **Once user picks a mall on any tab, all three tabs default to that mall.** This is the actual ask; otherwise the feature is just three independent filters. | David, session 68. |
| D3 | Booths picker placement. | **Mirror Home's pattern — section header text "Booths at [Mall]" / "Booths across Kentucky" + chevron, opens `<MallSheet>`.** Keeps the Bookmarked chip row reserved for the orthogonal personal-state axis (mall × saved-state are independent dimensions). | David, session 68. |
| D4 | Booths grouping when filtered to one mall. | **Drop the per-mall `<mall-section>` headers — render a flat booth grid.** When filter is `null` (All), preserve the existing grouped-by-mall behavior. | David, session 68. |
| D5 | Find Map picker placement. | **Same header pattern above the map. Tapping opens `<MallSheet>`.** | David, session 68. |
| D6 | Find Map behavior under filter. | **Filter narrows visible saves to picked mall. Empty state when no saves at picked mall: "No saved finds at [MallName]. *Show all malls* to see them."** Link calls `setSavedMallId(null)`. | David, session 68. |
| D7 | Clear-filter affordance. | **Use existing "All malls" row at top of `<MallSheet>` (already shipped).** No second clear-glyph next to picker text. | David, session 68. |
| D8 | Storage key. | **Reuse existing `treehouse_saved_mall_id`.** Zero migration; existing Home users keep their selection. | David, session 68. |
| D9 | Cross-tab sync timing. | **Read on tab-page mount only.** Bottom-nav tab switches in App Router unmount/remount the page, so this is sufficient. No `storage`-event subscription, no custom in-app event bus. | David, session 68. |
| D10 | Vendor self-view on Booths under filter. | **If a vendor's own booth is in a different mall than the active filter, hide it from the Booths grid.** Filter applies uniformly. My Booth nav tab is unaffected — it's the personal escape hatch. | David, session 68. |

**All ten decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

---

## File-level changes

### New primitive

#### `components/MallScopeHeader.tsx` — three-callsite mall picker header

Pure presentational component used 3× (Home, Booths, Find Map). Content-agnostic — consumer supplies eyebrow strings.

```tsx
type Props = {
  // "Finds from across" / "Booths across" / "Saves across" when null
  eyebrowAll: string;
  // "Finds from" / "Booths at" / "Saves at" when one mall picked
  eyebrowOne: string;
  // null = "All malls" / "Kentucky & Southern Indiana"; else the mall name
  mallName: string | null;
  // Optional line below the name: address (Home), count (Booths/Find Map), or null
  geoLine?: { kind: "address"; text: string } | { kind: "italic"; text: string } | null;
  onTap: () => void;
};
```

Visual spec mirrors the existing FeedHero block:
- Eyebrow: IM Fell italic, 13px, `var(--ink-muted)`.
- Mall name: IM Fell, 26px, `var(--ink-primary)`. Tappable. Chevron-down (Lucide `ChevronDown`, 18px, `var(--ink-mid)`) baseline-aligned to the right.
- Geo line: 12px sys for `address` kind (with dotted-underline link to map); 12px IM Fell italic for `italic` kind (booth count, save count).
- Container: 14px top padding / 18px sides / 8px bottom; 1px hairline bottom border; subtle `rgba(232, 221, 199, 0.40)` wash so it reads as a distinct band against the masthead and content below.

### New hook

#### `lib/useSavedMallId.ts` — saved-mall-id read/write

```ts
const SAVED_MALL_KEY = "treehouse_saved_mall_id";

export function useSavedMallId(): [string | null, (id: string | null) => void] {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    setId(safeStorage.getItem(SAVED_MALL_KEY));
  }, []);

  const update = useCallback((next: string | null) => {
    setId(next);
    if (next == null) safeStorage.removeItem(SAVED_MALL_KEY);
    else safeStorage.setItem(SAVED_MALL_KEY, next);
  }, []);

  return [id, update];
}
```

Mount-time read only (D9). No `storage`-event subscription. No cross-tab in-app sync (App Router unmount/remount handles it).

### Page touches

#### `app/page.tsx` (Home) — refactor only

Swap the inline FeedHero scope block (currently lines ~460–540 per session-67-vintage code) to `<MallScopeHeader>`. Behavior unchanged — same persistence key, same `<MallSheet>` open/close, same eyebrow strings ("Finds from across" / "Finds from"), same address line. This is a pure refactor — extract-to-primitive — to support callsites 2 + 3.

#### `app/shelves/page.tsx` (Booths) — add picker, conditional flat grid

1. Replace `<savedMallId>` derivation with `useSavedMallId()` hook.
2. Render `<MallScopeHeader eyebrowAll="Booths across" eyebrowOne="Booths at" mallName={mallById(savedMallId)?.name ?? null} geoLine={{ kind: "italic", text: \`${visibleBoothCount} booths\` }} onTap={...} />` directly below the masthead.
3. When `savedMallId !== null`, filter the vendor list to `vendor.mall_id === savedMallId` AND skip the per-mall section header rendering — render a single flat booth grid.
4. When `savedMallId === null`, preserve current grouped-by-mall behavior unchanged.
5. **Bookmarked-chip composition (D3 from session 67):** when both `effectiveFilter === "bookmarked"` AND `savedMallId !== null`, intersect — show only booths that are both bookmarked AND in the picked mall. The chip-row hide-when-zero rule (D9 from session 67) applies after intersection: hide the Bookmarked chip if zero bookmarked booths exist in the active mall scope.
6. **D10 self-vendor gate:** if `savedMallId !== null` AND viewer is a vendor whose own `vendor.mall_id !== savedMallId`, omit the viewer's own tile from the grid. My Booth nav tab is unaffected.

#### `app/flagged/page.tsx` (Find Map) — add picker, filter-as-intent

1. Add `useSavedMallId()` hook.
2. Render `<MallScopeHeader eyebrowAll="Saves across" eyebrowOne="Saves at" mallName={mallById(savedMallId)?.name ?? null} geoLine={{ kind: "italic", text: \`${filteredSaves.length} saved finds at this mall\` }} onTap={...} />` directly below the masthead.
3. Filter `posts` query by `post.mall_id === savedMallId` when `savedMallId !== null`.
4. **Empty-state markup** when `filteredSaves.length === 0 && allSaves.length > 0`:

```tsx
<EmptyCallout>
  <h>No saved finds at <strong>{mallName}</strong>.</h>
  <body>Saves at other malls are hidden by the active filter. <a onClick={() => setSavedMallId(null)}>Show all malls</a> to see them.</body>
</EmptyCallout>
```

5. The current "single mall derivation from saves" line (today's `/flagged` chrome) goes away — it's now driven by the picker, not by save-pin extraction.

### `<MallSheet>` reuse

Untouched. Same component with same `onSelect(mallId | null)` contract serves all three callsites. Each consumer:
- Reads `savedMallId` on mount via `useSavedMallId()`.
- Opens `<MallSheet>` with `activeMallId={savedMallId}` on header-tap.
- On `onSelect`: writes via `setSavedMallId`, calls `onClose()`, re-filters its own data.

The per-mall counts shown in the sheet adapt to the consumer:
- Home: post counts (existing — `findCounts` from posts query).
- Booths: booth counts (`countBy(vendor.mall_id)` over the active vendor list).
- Find Map: saved-find counts at each mall (`countBy(savedPost.mall_id)`).

---

## State matrix

| State | Home (`/`) | Booths (`/shelves`) | Find Map (`/flagged`) |
|---|---|---|---|
| `savedMallId === null` | "Finds from across · Kentucky & Southern Indiana" + grouped-by-mall feed | "Booths across · Kentucky & Southern Indiana" + grouped-by-mall booth grid (current session-67 behavior) + Bookmarked chip | "Saves across · Kentucky & Southern Indiana" + map with all save-pins + saves list across all malls |
| `savedMallId === <mall>` | "Finds from · [Mall]" + address line + feed filtered to mall | "Booths at · [Mall]" + booth count + flat grid (no section headers) + Bookmarked chip (intersected) + own-vendor tile hidden if vendor's mall ≠ picked | "Saves at · [Mall]" + map zoomed to mall + saves list filtered to mall; empty-state callout if filter excludes all current saves |

---

## Out of scope (intentional)

- **Cross-tab sync via `storage` event** — D9. The user picks mall on one tab, navigates to another via bottom nav; mount-time read picks up the change. No multi-window sync (rare on mobile PWA).
- **A separate clear-filter glyph** — D7. The "All malls" row in `<MallSheet>` is the only clear-filter UI. Two clear affordances would dilute the pattern.
- **Mall picker on `/mall/[slug]` mall profile** — that page IS a mall, so a picker would be circular. Out of scope.
- **Mall picker on `/shelf/[slug]` booth detail** — the detail page is one specific booth at one specific mall; no picker. The breadcrumb up to Booths page carries the active mall filter via persistence on next visit.
- **Migration of existing Home users' `treehouse_saved_mall_id`** — D8. Same key, same shape, no migration.
- **Server-side persistence (Supabase per-user `saved_mall_id`)** — out of scope for this pass. Same rationale as the find-save flag and the booth bookmark: localStorage is sufficient for guest + auth'd. Promote to Supabase post-beta if cross-device sync becomes a real ask.

---

## Live discoveries / patterns this design surfaces

1. **`<MallScopeHeader>` extraction is the actual refactor** — Home's existing inline scope block becomes the third callsite of a new primitive, not the first. The cost of extracting is paid once (refactor Home's inline block, lift behavior unchanged); Booths + Find Map become near-trivial consumers of the primitive.
2. **"Filter as intent" empty-states require a clear-filter inline link** — Find Map's empty-state isn't just "no saves" copy; it's "your filter is hiding them, here's how to see them." This is generally true any time we hide content behind a persisted user filter; worth surfacing as a candidate principle if it fires again.
3. **Mount-time read is the SPA equivalent of cross-tab persistence** — bottom-nav tab switches unmount/remount in App Router, so `useEffect`-on-mount → read storage IS the cross-tab sync. No event bus, no Context provider. Worth knowing as a pattern for any future "persist X across tabs" feature where the tabs are bottom-nav routes.

---

## Acceptance criteria (for implementation session sign-off)

1. Pick a mall on Home → navigate to Booths via bottom nav → Booths header shows the same mall, grid filtered.
2. Pick a different mall on Booths → navigate to Find Map → Find Map header shows the new mall, saves filtered.
3. Pick "All malls" on Find Map (via MallSheet) → navigate back to Home → Home header shows "Finds from across · Kentucky & Southern Indiana".
4. On Booths with a mall picked, the per-mall section headers are gone — flat grid.
5. On Booths with a mall picked AND Bookmarked chip active, the grid intersects (only bookmarked booths in that mall).
6. On Find Map with a mall that has zero saves, empty-state callout renders with working "Show all malls" inline link.
7. On Booths, vendor's own booth is hidden from the grid if their `mall_id` ≠ picked mall (D10). My Booth nav tab still works.
8. No DB/RLS/API/migration changes. All persistence is localStorage.

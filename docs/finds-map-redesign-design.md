# Finds Map redesign — Design record

> **Status:** 🟢 Ready (frozen session 70, 2026-04-26).
> **Mockup:** [`docs/mockups/finds-map-redesign-v1.html`](mockups/finds-map-redesign-v1.html).
> **Effort:** M (1 session — the page structurally simplifies; existing primitives carry the new shape).
> **Purpose of this doc:** Freeze design decisions so the implementation session runs as a straight sprint. David approved on iPhone (with one carry-forward limitation flagged); this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

Redesign `/flagged` (the page chromed as "Find Map" in BottomNav) to retire its cartographic spine vocabulary in favor of a flat sectioned-list pattern that carries the session-69 Option B booth-identity treatment per booth section.

The shipped behavior:

1. **Cartographic spine retired** — `XGlyph` at each stop, hairline tick connecting stops, and the closer "circle + tagline" footer are all removed. The 26px spine column itself goes away.
2. **Each booth becomes a content section.** Section header is a tappable inkWash card carrying the small-caps `BOOTH NN` eyebrow + IM Fell 18px vendor name treatment from session-69 Option B. Whole card navigates to `/shelf/[vendorSlug]` when slug exists.
3. **Tiles per section unchanged.** 2-up grid + horizontal-scroll fallback rendering preserved. Tile caption treatment (session 69 unified card) stays as-is.
4. **Mall name appears as small subtitle in section header card ONLY when MallScopeHeader scope = "All malls."** When filtered to a specific mall, the subtitle line is omitted (redundant with the eyebrow above).
5. **Empty-state copy unchanged from session 69** — "No finds flagged yet" / "Tap the flag on any find to add it to your find map."
6. **Page ends naturally below the last section** — no closer, no footer flourish, parallel to Home feed's bottom-of-page treatment.

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Cartographic spine retirement scope. | **Retire all of it — XGlyph at each stop, hairline tick, closer "circle + tagline" footer.** Removing the spine is the whole point; partial retirement leaves dead vocabulary on the page. | David, session 70 (Q1 = Hybrid). |
| D2 | Replacement structure — sectioned list vs flat tile-grid. | **Sectioned list grouped by booth.** Switching to flat tile-grid (like Home) would scramble booth grouping which is the page's primary organizing principle. | Claude recommendation, David approval. |
| D3 | Booth-info presentation per section. | **inkWash card matching session-69 Booths VendorCard treatment.** Small-caps `BOOTH 42` eyebrow + IM Fell 18px vendor name. Whole card tappable → `/shelf/[vendorSlug]` when slug exists. | Claude recommendation, David approval. |
| D4 | Tile treatment per booth section. | **Unchanged — keep current 2-up grid + horizontal-scroll fallback.** Tile rendering itself isn't broken; only the chrome around it changes. FindTile keeps session-69 unified caption treatment. | Claude recommendation, David approval. |
| D5 | Mall name in booth section header. | **Surface as small subtitle below vendor name, ONLY when MallScopeHeader scope = "All malls."** Hidden when filtered to a specific mall (redundant with the eyebrow above). | Claude recommendation, David approval (with carry-forward limitation, see below). |
| D6 | Empty-state copy. | **Unchanged from session 69 wording.** Copy is fine; only the layout shell around it changes. | Claude recommendation, David approval. |
| D7 | Closer "circle + tagline" footer. | **Retired with the spine (folds into D1).** Page just ends, like Home feed. | David, session 70. |

**All seven decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

---

## ⚠️ Known limitation (session 70 carry-forward)

**All-malls scope mall-subtitle separator is weak.** When MallScopeHeader = "All malls," the small mall subtitle (`{mallName} · {city}, {state}`) sits at sans 11.5px / inkMuted under the IM Fell 18px vendor name in each booth section card. On iPhone review David flagged that booths from different malls don't separate enough — without paying close attention to the filter eyebrow, the list reads as one long sequence of booths regardless of mall.

**Decision:** Ship the design as-is for now. The all-malls scope is the less common usage (most users will filter to a specific mall via session 68's persistence). Strong separation between malls would require either: (a) a section break + mall-name banner between mall groups, (b) a stronger visual treatment on the subtitle line, or (c) reverting to MallScopeHeader-mandatory behavior.

**Future iteration trigger:** if beta-feedback shows confusion in the all-malls scope, revisit this. Likely treatment: mall-grouped section breaks with a small all-caps mall eyebrow before the booth list resumes — parallel to how `/shelves` Booths page handled mall grouping in session 68 (before that page collapsed grouping when filtered).

This limitation is captured in CLAUDE.md known-gaps as a session-70 carry note.

---

## File-level changes

### [`app/flagged/page.tsx`](../app/flagged/page.tsx) — full redesign

The page is currently structured around the `Stop` component (line 332–470) which renders the 26px spine column + content column for each booth grouping. This entire pattern goes away.

#### What's removed

1. **`XGlyph`** rendering inside `Stop` (line 350) — the glyph definition itself can stay in case it's used elsewhere; verify with grep before deletion.
2. **Hairline tick** (`<div style={{ width: 1, flex: 1, ...background: v1.inkHairline }} />` at line 351–359).
3. **Spine column wrapper** (`<div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 6 }}>` at line 349) — entire 26px column retired.
4. **`Stop` grid template** — `gridTemplateColumns: "26px 1fr"` becomes a normal block layout.
5. **Closer block** (the circle + tagline pattern around line 795–840) — entire block removed.
6. **`BoothPill`** usage inside `Stop` (line 380, 394) — replaced by small-caps eyebrow.
7. **Inline `Booth` label + pill row** (line 363–409) — replaced by the card-header treatment.

#### What's added

A new `BoothSection` component (or reshape of `Stop` if cleaner) rendering:

```jsx
<section style={{ padding: "18px 18px 0" }}>
  {/* Card header */}
  {group.vendorSlug ? (
    <Link
      href={`/shelf/${group.vendorSlug}`}
      style={{
        display: "block",
        background: v1.inkWash,
        border: "1px solid var(--ink-hairline)",
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{
        fontFamily: FONT_SYS,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: v1.inkMuted,
        marginBottom: 2,
      }}>
        Booth {group.boothNumber}
      </div>
      <div style={{
        fontFamily: FONT_IM_FELL,
        fontSize: 18,
        color: v1.inkPrimary,
        lineHeight: 1.25,
        letterSpacing: "-0.005em",
      }}>
        {group.vendorName}
      </div>
      {scopeIsAllMalls && group.mallName ? (
        <div style={{
          fontFamily: FONT_SYS,
          fontSize: 11.5,
          color: v1.inkMuted,
          marginTop: 3,
        }}>
          {group.mallName}{group.mallCity ? ` · ${group.mallCity}, ${group.mallState}` : ""}
        </div>
      ) : null}
    </Link>
  ) : (
    /* Same card visual but as a non-tappable <div> when slug is missing */
  )}

  {/* Saved-count label */}
  <div style={{
    fontFamily: FONT_SYS,
    fontSize: 11.5,
    color: v1.inkMuted,
    margin: "0 0 10px 2px",
  }}>
    {savedLabel}
  </div>

  {/* Tiles — UNCHANGED (existing 2-up grid / horizontal-scroll logic) */}
  {useScroll ? <HorizontalTileRail .../> : <TileGrid .../>}
</section>
```

**Notes:**
- `scopeIsAllMalls` is a boolean derived from comparing the page's current `MallScopeHeader` selection to "All malls." Where this state lives today: check `useSavedMallId` hook output + the page's local mall-filter state. The page already has the data needed; the boolean is a derived check.
- Group data (`mallName`, `mallCity`, `mallState`) — confirm fields exist on the booth-grouping shape. If `mallCity` / `mallState` aren't in the current grouping, fall back to `mallName` alone (the city/state suffix is enhancement, not requirement).
- Section spacing — `padding-top: 22px` between sections (CSS `+` selector or marginTop on subsequent sections).

#### Page-level cleanup

- Closer JSX block (around line 795–840) — delete entirely.
- Any state, refs, or helpers used only by the closer (e.g., `circleColRef` if it exists) — clean up alongside.
- `Stop` component definition (line 332–470) — replace with `BoothSection` per above, OR refactor in place. Either works; pick the path that keeps the diff smaller.

### `lib/tokens.ts` — verify orphaned tokens

Session 69 carry note flagged `v1.pillBg` / `v1.pillBorder` / `v1.pillInk` may be orphaned post-Pill-deletion on `/find/[id]`. If `BoothPill` import on `/flagged` is also dropped, run `grep -r "v1.pill" --include="*.tsx" --include="*.ts"` to verify zero callsites remain. Delete the tokens if orphaned. Out of scope as a *required* change for this record, but a natural cleanup moment if the grep comes back empty.

---

## Surface × treatment matrix

| Element | Before (session-69 ship state) | After (this record) |
|---|---|---|
| Page-level spine column | 26px + XGlyph at each stop + hairline tick | Removed |
| Closer footer | Circle + IM Fell italic tagline | Removed |
| Per-booth header | Inline `Booth` label + `BoothPill` numeric + IM Fell 18px vendor name | inkWash card with small-caps `BOOTH NN` eyebrow + IM Fell 18px vendor name + optional mall subtitle |
| Per-booth tap target | Vendor name only (Link wrapping name + pill) | Whole card |
| Mall name on tiles | Absent | Absent |
| Mall name in section header | Absent | Present **only when scope = All malls** |
| FindTile rendering | Session-69 unified card treatment | Unchanged |
| 2-up grid / horizontal-scroll fallback | Existing logic | Unchanged |
| Empty-state copy | "No finds flagged yet" / "Tap the flag on any find..." | Unchanged |
| MallScopeHeader (above stops) | Renders when posts.length > 0 | Unchanged |
| FeaturedBanner | Renders when imageUrl exists | Unchanged |

---

## Out of scope

- **MallScopeHeader behavior** — session 68 shipped this; not changing scope-pick UX in this pass.
- **Filter chips** (`Bookmarked` etc) — page doesn't have them today; not adding them in this pass.
- **FindTile structure** — session 69 unified the caption; tile rendering is settled.
- **Data fetching / RLS / save-flag logic** — pure presentational change. No data model touch.
- **Closer-block tagline copy** — block is being deleted entirely; no need to revisit.
- **Mall page (`/mall/[slug]`)** — separate v1.x ecosystem migration deferred per CLAUDE.md.
- **Mall-grouped section breaks for all-malls scope** — captured as future-iteration carry-forward (see "Known limitation" above).

---

## Acceptance criteria (6)

1. Loading `/flagged` with one or more saved finds renders no XGlyph, no hairline tick, no spine column, no closer circle/tagline.
2. Each booth section renders an inkWash card header containing small-caps `BOOTH NN` eyebrow + IM Fell 18px vendor name. Card is tappable when `vendorSlug` exists; falls back to non-tappable card visual when not.
3. Tiles per section render in the existing 2-up grid (or horizontal-scroll fallback for many tiles) with session-69 unified caption treatment unchanged.
4. With MallScopeHeader filtered to a specific mall, no mall subtitle appears in any section header card.
5. With MallScopeHeader = "All malls" and at least two saved finds across different malls, each section card shows a sans 11.5px inkMuted mall subtitle below the vendor name.
6. Empty state (no saved finds) renders the existing session-69 copy, no other layout change.

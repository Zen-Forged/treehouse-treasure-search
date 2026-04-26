# Masthead lock — Design record

> **Status:** 🟢 Ready (frozen session 70, 2026-04-26).
> **Mockup:** [`docs/mockups/masthead-lock-v1.html`](mockups/masthead-lock-v1.html).
> **Effort:** M (1 session — touches `StickyMasthead` + every page that calls it; D16 booth-page scroll flatten is the load-bearing structural change).
> **Purpose of this doc:** Freeze design decisions so the implementation session runs as a straight sprint. David approved on iPhone (Q2 = visual stability with affordances); this is the dev handoff. David does not read this — future Claude sessions do.

---

## Scope

Lock the Masthead so its rendered height + the `Treehouse Finds` wordmark X-coordinate are identical across every page that renders it. Right slot continues to accept variable affordances (sign-in icon, sign-out text, Admin pill, bookmark + share bubbles) as long as they fit within a fixed-width column that doesn't push the wordmark.

Three composing causes drive the current drift, all addressed by this record:

1. **Inner grid varies by page** — Mode B (centered wordmark + absolute right slot) on Home + Booths; Mode A (`auto 1fr` back button + wordmark) on Find Map + Find Detail; `38px 1fr 38px` on `/my-shelf`; `1fr auto 1fr` on `/shelf/[slug]` (session 67 change). Wordmark center-axis drifts with each grid.
2. **Booth pages wrap masthead in an internal `overflow-auto` scroll container** (`/my-shelf`, `/shelf/[slug]`) — sticky behavior is relative to that container, not the document. Different scroll context = different perceived stickiness.
3. **`/post/preview` reimplements masthead as a custom sticky div** — same colors/blur but stacks a 24px title + italic subhead inside the sticky region, doubling the apparent height.

The shipped behavior:

1. **Single grid: `1fr auto 1fr`** on every Masthead instance. Wordmark sits in the `auto` middle column, always visually centered between two equal `1fr` columns regardless of left/right content.
2. **Wordmark vocabulary**: IM Fell italic 22px on `inkPrimary`, single render — no per-page variant.
3. **Left slot rules**: back button (12px chevron + 28×28 tap target) ONLY on detail/leaf pages (`/find/[id]`, `/shelf/[slug]`, `/post/preview`, `/post/edit/*`). Empty on root tabs (`/`, `/shelves`, `/flagged`, `/my-shelf`).
4. **Right slot rules**: variable content allowed (sign-in icon / sign-out text / Admin pill / bookmark + share bubbles). Locked to `min-width: 80px` (the heaviest case — multi-bubble on `/shelf/[slug]`). Lighter slots render right-aligned within that width; empty slots reserve the same column width so the wordmark cannot shift.
5. **Booth-page scroll flatten**: `/my-shelf` + `/shelf/[slug]` drop their internal `overflow-auto` containers. Masthead becomes sticky against document scroll like every other page.
6. **`/post/preview` unification**: custom sticky div replaced with `StickyMasthead`. Stacked "Review your find" title + italic subhead moves to a content block BELOW the masthead.
7. **Locked total height**: `max(14px, env(safe-area-inset-top, 14px)) + 40px content + 12px bottom`. Per-device variance (notch vs no-notch) preserved; within a single device, every page renders the masthead at identical baseline height.

---

## Design decisions (frozen 2026-04-26)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D13 | Inner grid pattern. | **`1fr auto 1fr`** on every Masthead instance. Wordmark in `auto` middle column always visually centered between two equal `1fr` columns regardless of slot content. | Claude recommendation, David approval. |
| D14 | Wordmark treatment. | **Single render: IM Fell italic 22px on `v1.inkPrimary`.** No per-page variant. | Claude recommendation, David approval. |
| D15 | Left slot rules. | **Back button (12px chevron + 28×28 tap target) ONLY on detail/leaf pages** (`/find/[id]`, `/shelf/[slug]`, `/post/preview`, `/post/edit/*`). Empty on root tabs. | Claude recommendation, David approval. |
| D16 | Right slot rules. | **Variable content allowed; `min-width: 80px` lock matching heaviest case.** Lighter slots right-align within that width. Empty slots reserve the same column width. | Claude recommendation, David approval. |
| D17 | Booth-page internal scroll container. | **Flatten to document scroll** — drop `overflow-auto` + `height: 100%` containers on `/my-shelf` + `/shelf/[slug]`. Masthead behaves identically across all pages. | Claude recommendation, David approval. Highest-effort + highest-risk decision in the batch; David accepted the structural change. |
| D18 | `/post/preview` custom masthead. | **Replace with `StickyMasthead`.** Stacked title + subhead moves to a content block below the masthead. | Claude recommendation, David approval. |
| D19 | Locked total height. | **`max(14px, env(safe-area-inset-top, 14px)) + 40px content + 12px bottom`.** Single locked computation across all pages. | Claude recommendation, David approval. |

**All seven decisions are frozen.** Implementation can proceed as a straight sprint against this spec.

(Note: original Q2 decision pre-batch numbered as D12; with Record 2's late D12 addition, Record 3 D's renumber to D13–D19 to keep the batch globally unique.)

---

## File-level changes

### [`components/StickyMasthead.tsx`](../components/StickyMasthead.tsx) — locked grid

Today the component renders sticky `top: 0` chrome and accepts arbitrary children that compose their own grid (the `style` prop passes through). After: `StickyMasthead` itself owns the inner grid; consumers pass three named slots (`left`, `wordmark`, `right`) instead of arbitrary children.

```tsx
type StickyMastheadProps = {
  left?: React.ReactNode;        // back button or empty
  wordmark?: React.ReactNode;    // defaults to "Treehouse Finds"
  right?: React.ReactNode;       // empty / icon / text / pill / bubbles
  scrollTarget?: React.RefObject<HTMLElement>; // remove or simplify post-D17
  // ...other existing props
};
```

Inner render becomes:

```tsx
<div
  style={{
    position: "sticky",
    top: 0,
    zIndex: 40,
    background: "rgba(232,221,199,0.96)",
    backdropFilter: "blur(24px)",
    paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
    paddingBottom: 12,
    paddingLeft: 18,
    paddingRight: 18,
    borderBottom: scrolled ? "1px solid var(--ink-hairline)" : "1px solid transparent",
    transition: "border-color 200ms ease",
  }}
>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      minHeight: 40,
    }}
  >
    <div
      style={{
        justifySelf: "start",
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 80,
      }}
    >
      {left}
    </div>
    <div
      style={{
        fontFamily: FONT_IM_FELL,
        fontStyle: "italic",
        fontSize: 22,
        color: v1.inkPrimary,
        textAlign: "center",
        lineHeight: 1,
      }}
    >
      {wordmark ?? "Treehouse Finds"}
    </div>
    <div
      style={{
        justifySelf: "end",
        display: "flex",
        alignItems: "center",
        gap: 6,
        justifyContent: "flex-end",
        minWidth: 80,
      }}
    >
      {right}
    </div>
  </div>
</div>
```

Key invariants:
- `1fr auto 1fr` outer grid — wordmark `auto` column sits between two equal `1fr` columns. Wordmark is visually centered iff left and right columns are equal width; the `min-width: 80px` lock ensures this.
- Left and right slots BOTH have `min-width: 80px`. An empty slot reserves the column width. Heaviest case (`/shelf/[slug]` multi-bubble) sets the floor.
- Slot content is right-aligned (right slot) / left-aligned (left slot) within their `1fr` column via `justifySelf` + flex `justify-content`.

### Page-level usage updates

#### [`app/page.tsx`](../app/page.tsx) — Home

Today: Mode B (centered wordmark + absolutely-positioned right text). Update to use new slot API:

- Guest: `<StickyMasthead right={<CircleUserIcon />} />`
- Signed-in: `<StickyMasthead right={<SignOutLink />} />`
- Empty `left` slot — wordmark holds.

#### [`app/shelves/page.tsx`](../app/shelves/page.tsx) — Booths

Today: Mode B with Admin pill on right. Update:

- Admin: `<StickyMasthead right={<AdminPill />} />`
- Non-admin: `<StickyMasthead />` (empty `right`)

#### [`app/flagged/page.tsx`](../app/flagged/page.tsx) — Find Map

Today: Mode A with back button. Update:

- `<StickyMasthead left={<BackButton onClick={...} />} />`
- Empty `right` slot.

#### [`app/find/[id]/page.tsx`](../app/find/[id]/page.tsx) — Find Detail

Today: Mode A. Update:

- `<StickyMasthead left={<BackButton ... />} right={<><FlagBubble /><ShareBubble /></>} />`

#### [`components/BoothPage.tsx`](../components/BoothPage.tsx) — Booth Detail (`/shelf/[slug]`, `/my-shelf`)

Two changes here:

1. **Slot API migration** — same as above. Owner view (`/my-shelf`): no right slot. Public view (`/shelf/[slug]`): right slot = `<><BookmarkBoothBubble /><ShareBubble /></>`.
2. **D17 scroll flatten** — drop the outer wrapper div with `overflow: auto` + `height: 100%`. Page content scrolls against document scroll like every other page.

The `scrollTarget` ref pattern that the booth-page Masthead used to track its internal scroll container is now obsolete. Either remove the prop entirely from `StickyMasthead`, or simplify to `useScrollY()` against `window` for the scroll-linked border behavior.

Risk audit during implementation: search BoothPage for any code that observed the inner scroll container directly (e.g. `containerRef.current.scrollTo(...)` for "scroll to top" behavior on bookmark toggle). Replace with `window.scrollTo(0, 0)`. Mall picker sheet anchoring + BoothHero parallax should survive the flatten — confirm on device.

#### [`app/post/preview/page.tsx`](../app/post/preview/page.tsx) — Review Find (D18)

Today: custom sticky `<div>` with stacked "Review your find" title + italic subhead inside the sticky region.

Replace with:

```tsx
<>
  <StickyMasthead left={<BackButton onClick={...} />} />
  <div style={{ padding: "16px 18px 8px" }}>
    <div style={{ fontFamily: FONT_SYS, fontSize: 19, fontWeight: 600, color: v1.inkPrimary, marginBottom: 3 }}>
      Review your find
    </div>
    <div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 12.5, color: v1.inkMuted }}>
      Make sure everything looks right
    </div>
  </div>
  {/* ...rest of page... */}
</>
```

Title + subhead become a normal content block below the masthead.

### Back-button component standardization

Verify `<BackButton>` (or whatever pattern is currently inline-rendered on Mode A pages) is a single component. If multiple inline implementations exist, factor to one — the spec requires identical visual + tap target across all pages where it appears. Glyph: 12px chevron (`‹` or SVG). Tap target: 28×28. Color: `v1.inkPrimary`.

---

## Surface × treatment matrix

| Page | Left slot | Right slot | Inner scroll? | Custom masthead? |
|---|---|---|---|---|
| `/` (Home) | Empty | CircleUser icon (guest) / "Sign out" text (auth) | No (unchanged) | No (unchanged) |
| `/shelves` (Booths) | Empty | Admin pill (admin only) / empty (non-admin) | No (unchanged) | No (unchanged) |
| `/flagged` (Find Map) | Back button | Empty | No (unchanged) | No (unchanged) |
| `/find/[id]` (Find Detail) | Back button | Flag + Share bubbles | No (unchanged) | No (unchanged) |
| `/shelf/[slug]` (Booth Detail) | Back button | Bookmark + Share bubbles | **Was inner; flattens** (D17) | No (unchanged) |
| `/my-shelf` (My Booth) | Empty (root tab) | Empty | **Was inner; flattens** (D17) | No (unchanged) |
| `/mall/[slug]` (Mall) | (See note) | (See note) | (See note) | (See note) |
| `/post/preview` (Review Find) | Back button | Empty | No (unchanged) | **Custom; replaced with StickyMasthead** (D18) |
| `/post/edit/*` (Edit Find) | Back button | (Existing right content if any) | No (unchanged) | No (unchanged) |

**Mall page note:** `/mall/[slug]` is on v0.2 dark theme pending its v1.x ecosystem migration (CLAUDE.md carry). This record does NOT touch its masthead. The migration to the unified masthead vocabulary happens during the mall-page v1.x pass — captured as a follow-on item alongside the lens + caption + MallScopeHeader carry-throughs already queued.

---

## Out of scope

- **`/mall/[slug]` masthead migration** — deferred to the mall-page v1.x ecosystem pass.
- **Bottom nav** — separate component, unaffected.
- **Modal sheet anchoring** (mall picker, etc.) — should survive D17 scroll flatten unchanged. Verify on device, but no design change planned here.
- **Specific tap-target visual treatments** (back button hover, right-bubble pressed states) — existing patterns preserved; this record only standardizes positioning + sizing.
- **Wordmark on the login page** — `/login` is its own surface, not in the primary-tab masthead system. Unchanged.

---

## Acceptance criteria (8)

1. `StickyMasthead` exposes a three-slot API (`left`, `wordmark`, `right`) and renders an inner `1fr auto 1fr` grid.
2. Left and right slots both reserve `min-width: 80px` even when empty; wordmark X-coordinate is identical across pages on the same device.
3. Walking primary tabs (Home → Booths → Find Map → My Booth) on iPhone shows the wordmark holding position with no perceptible drift.
4. Walking detail pages (`/find/[id]`, `/shelf/[slug]`, `/post/preview`) on iPhone shows the back button rendered consistently and the wordmark X-position identical to the root tabs.
5. `/shelf/[slug]` and `/my-shelf` no longer wrap their content in an `overflow-auto` container; document scroll drives masthead stickiness.
6. `/post/preview` no longer renders a custom sticky div; the page uses `StickyMasthead` with the title + subhead as a content block below.
7. Right-slot variants (CircleUser icon, "Sign out" text, Admin pill, multi-bubble groups) all render right-aligned within the `min-width: 80px` column without pushing the wordmark.
8. Locked total height computation `max(14px, env(safe-area-inset-top, 14px)) + 40px content + 12px bottom` produces identical rendered height across all pages on the same device.

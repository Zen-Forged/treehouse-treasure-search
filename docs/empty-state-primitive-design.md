# `<EmptyState>` Primitive — Design Record

> **Status:** DRAFT — decisions D1–D6 awaiting David's mockup review.
> **Phase:** 2 Session C (per [`docs/design-system-phase2-plan.md`](design-system-phase2-plan.md)).
> **Mockup:** [`docs/mockups/empty-state-primitive-v1.html`](mockups/empty-state-primitive-v1.html).
> **Build spec:** TBD — written only after David approves the mockup. Per Design Agent rule, build spec serves the mockup, not the other way around.

This is a **decision doc**, not a build doc. Front-matter must change to "Build doc" when the build spec is added below the design decisions.

---

## Why this primitive

Phase 1 audit (§F-3) found 4 inline empty states drifting on every axis except family (all use `FONT_LORA`):

| Surface | Title size | Subtitle size | paddingTop | maxWidth | lineHeight (sub) |
|---|---|---|---|---|---|
| Home (`app/page.tsx` `EmptyFeed`) | 20 | 14 italic | 72 | 230 | 1.7 |
| /flagged (`app/flagged/page.tsx` `EmptyState`) | 24 | 15 italic | 60 | 280 | 1.65 |
| /shelves (`app/shelves/page.tsx` line 559) | 20 | 14 italic | 80 | 230 | 1.75 |
| /shelf/[slug] (line 476 + 494, ×2 callsites) | — *(none)* | 15 italic | 48 *(nested)* | none | 1.65 |

**4-way drift on paddingTop · 3-way drift on title size · 4-way drift on maxWidth · /shelf/[slug] is structurally subtitle-only and lives mid-page rather than below the masthead.**

The voices ARE deliberately different — "The shelves are quiet." has narrative voice, "No finds saved yet" is functional, "Nothing on the shelf yet" is scenic. We preserve voice; we unify structure.

---

## Decisions to freeze (D1–D6)

| D# | Question | My read |
|---|---|---|
| **D1** | Title font size — converge on what? Currently 20 / 24 / (none). | **22.** Splits the difference. FONT_LORA at 22 reads as journal voice, not display chrome. |
| **D2** | Title required, or optional? `/shelf/[slug]` ships subtitle-only today. | **Optional.** Either-or-both. Lets `/shelf/[slug]` keep its single-line scenic register and lets future surfaces opt in to title+subtitle. |
| **D3** | Voice unification — should I rewrite copy across the 4 surfaces? | **No — preserve per-surface voice.** The primitive enforces structure (size, clearance, centering), not copy. Voice variation is a feature. |
| **D4** | Subtitle line-height — currently 1.65 / 1.7 / 1.75. | **1.7.** Median; balances air without feeling spacy at 14px italic Lora. |
| **D5** | maxWidth on subtitle — currently 230 / 280 / none. | **260.** Wide enough that single-clause subtitles don't wrap awkwardly; narrow enough to read as narrative not paragraph. |
| **D6** | Clearance — paddingTop currently 72 / 60 / 80 (top-level) and 48 (mid-page nested). | **`clearance` prop with two modes:** `"masthead"` default = `MASTHEAD_HEIGHT + 32` (i.e. 135 — clears the fixed masthead with consistent breathing room across Home / /flagged / /shelves), or `number` for nested mid-page contexts (`/shelf/[slug]` passes `48`). |

### Out-of-decision (settled)

- **Family:** `FONT_LORA` — current pattern, no drift.
- **Title color:** `v1.inkPrimary` — no drift.
- **Subtitle color:** `v1.inkMuted` — no drift.
- **Title weight:** 400 — no drift, matches FONT_LORA default.
- **Subtitle style:** italic — current pattern, no drift.
- **Subtitle margin from title:** 10 — Home + /shelves agree at 10; /flagged uses 12. **Pick 10.** Tight rhythm reads as caption, 12 starts to read as paragraph.
- **Centering:** flex column, alignItems center, textAlign center — universal current pattern, no drift.

---

## Proposed primitive shape (post-approval)

```tsx
// components/EmptyState.tsx
type EmptyStateProps = {
  title?: string;
  subtitle?: string;
  cta?: ReactNode;          // optional pass-through (e.g. "Show all malls" link)
  clearance?: "masthead" | number;  // default "masthead"
};
```

Internal layout:
- `display: flex; flexDirection: column; alignItems: center; textAlign: center`
- `paddingTop = clearance === "masthead" ? MASTHEAD_HEIGHT + 32 : clearance`
- Title (if present): FONT_LORA 22, inkPrimary, lineHeight 1.3, marginBottom 10
- Subtitle (if present): FONT_LORA italic 14, inkMuted, lineHeight 1.7, maxWidth 260
- CTA (if present): rendered below subtitle with marginTop 18

---

## Migration map

| Surface | File | Line | Title | Subtitle | clearance |
|---|---|---|---|---|---|
| Home | `app/page.tsx` | 112 | "The shelves are quiet." | "Check back soon — new finds land here the moment a vendor posts them." | `"masthead"` |
| /flagged | `app/flagged/page.tsx` | 365 | "No finds saved yet" | "Tap the leaf on any find to save it here." | `"masthead"` |
| /shelves | `app/shelves/page.tsx` | 559 | "No booths yet" | "Booths will appear here once vendors start posting their finds." | `"masthead"` |
| /shelf/[slug] window | `app/shelf/[slug]/page.tsx` | 476 | — | "Nothing on the shelf yet — check back soon." | `48` |
| /shelf/[slug] shelf | `app/shelf/[slug]/page.tsx` | 494 | — | "Nothing on the shelf yet — check back soon." | `48` |

**`/my-shelf` is not in scope.** It uses AddFindTile (`<WindowView showAddTile={true}>` / `<ShelfView showAddTile={true}>`) as its empty-state affordance — a structurally different pattern (interactive card rather than text block). Not a candidate for this primitive.

---

## Risk

**Low-medium.** Voice retention (D3) is the load-bearing decision. If beta-feedback surfaces drift across the 4 surfaces, easy to revert per-surface to inline copy. The primitive only owns structure.

The other risk is the `/shelf/[slug]` mid-page clearance — nested empty states are a different shape than masthead-clearing top-level empties. The `clearance` prop accommodates both, but the primitive should not silently default to top-level clearance when used mid-page (caller must pass `clearance={number}` explicitly when nested).

---

## What this primitive does NOT do

- **Does not own copy.** Voice + word choice stays per-surface.
- **Does not own skeleton state.** Skeleton (data === undefined) stays a separate primitive.
- **Does not enforce CTA presence.** Surfaces that need a CTA (future R-items) pass one in; surfaces that don't, don't.
- **Does not animate entrance.** Surfaces that want a fade-up wrap the primitive in `<motion.div>` with their own motion tokens (`MOTION_EMPTY_DURATION` is the canonical empty-state ease per session 76).

---

## Adjacent decisions deferred

- **Skeleton-vs-empty unification** — different primitives, deferred to Phase 3+ if patterns drift.
- **Shimmer / pulse animation on empty state** — out of scope; static read is the current pattern.
- **Asymmetric / off-center variants** — none observed; not designed for.

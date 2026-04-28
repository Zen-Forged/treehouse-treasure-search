## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Run `/session-close` — replaces the old `thc` alias with the full close protocol (tombstoning, memory updates, commit + push, PR creation).

---

## DOCUMENT MAP

This file is the **live whiteboard** — only the current session's starting point. Everything else is elsewhere:

| Need | Read |
|---|---|
| Architecture, schema, routes, API table, lib + component catalog, auth pattern, DNS state, known gotchas, debugging commands | `CONTEXT.md` |
| Operating constitution: brand rules, tech rules, risk register, decision gate, agent roster | `docs/DECISION_GATE.md` |
| Session structure, HITL indicator standard, Docs agent + Design agent operating principles, blocker protocol | `MASTER_PROMPT.md` |
| Historical session close summaries (sessions 1–30, growing) | `docs/session-archive.md` |
| Canonical design system v1.1l + v1.2 build spec | `docs/design-system.md` + `docs/design-system-v1.2-build-spec.md` + `docs/mockups/` |
| Canonical vendor onboarding (3 flows) | `docs/onboarding-journey.md` |
| Supabase OTP email templates (HITL paste target) | `docs/supabase-otp-email-templates.md` |
| In-mall SQL triage recipes | `docs/admin-runbook.md` |
| Active bugs + deferred items + resolved history | `docs/known-issues.md` |
| Pre-beta QA walk runbook (T4d) | `docs/pre-beta-qa-walk.md` |
| Window share QA walk runbook (Q-007 session 41) | `docs/share-booth-qa-walk.md` |
| Queued sessions (scoped work sequenced behind something else) + operational backlog | `docs/queued-sessions.md` |
| Roadmap (Beta+) — epic-level captured items not yet scoped | `docs/roadmap-beta-plus.md` |
| Tech Rule candidates queue (firing counts + promotion status) | `docs/tech-rules-queue.md` |

---

## TERMINAL COMMAND FORMATTING CONVENTION
> When Claude surfaces multiple terminal commands to run in sequence, each goes in its own fenced block. This lets David copy one at a time and verify each before running the next.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

**Not this** (chained separate commands in one block that invite blind paste):

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
```

Exception: a single chained command with `&&` stays in one block — that's one atomic action by design.

---

## ✅ Session 80 (2026-04-28) — David 5-item redirect bundle + 2 polish items, shipped end-to-end (7 runtime commits)

Session 80 ran a David-redirect-bundle pattern (same shape as sessions 74–76): mockup-first review of the visual items, then smallest→largest commit sequencing. **Net: 7 runtime commits + close, every item in the bundle landed, two new design records committed in the same session per the rule.** No iPhone-QA cycles yet; David will test against Vercel deploy after close. The session's structural pattern was *redirect → mockup V1 → David asks for structural pivot → mockup V2 → ship in order* — captured in the new memory `feedback_mockup_options_span_structural_axes.md`.

**Beat 1 — Standup + bundle scoping.** Session 79 closed at net-zero (Option A full revert); production was identical to session 78 close (`4bcefeb`). David came in with five items: (1) BottomNav "Find Map" → "Flagged"; (2) Booths page tiles mirror /flagged booth-section header lockup with bookmark on far left; (3) BoothPage eyebrow "a curated shelf from" → "A curated booth from"; (4) bookmark moves from `/shelf/[slug]` masthead → corner of BoothHero photo; (5) wordmark Times New Roman, no italic, ink-black. I scoped each, identified items 2 + 5 as needing mockups before code, items 1 + 3 + 4 as clear-spec. Item 4 also flagged as deserving its own design record (semantic relocation + `BookmarkBoothBubble` API extension).

**Beat 2 — V1 mockups for items 2 + 5.** Built two separate phone-frame HTML mockups in `docs/mockups/`:
- [`booths-tile-redesign-v1.html`](docs/mockups/booths-tile-redesign-v1.html) — three frames: current state, Option A (drop photo), Option B (keep photo + restyled lockup). Both options were grid-based (2-column).
- [`wordmark-redesign-v1.html`](docs/mockups/wordmark-redesign-v1.html) — before/after at 22px in two contexts (Home tab + Find detail with bubbles flanking).

**Beat 3 — David's V2 redirect: structural pivot.** Item 2: "needs another option. I want each booth to account for one row. This changes it from the grid pattern." Item 5: "Wordmark looks good but would like the wordmark to be a bit smaller in size." Both required new mockups; David asked for them on one consolidated document.

**Beat 4 — V2 mockup ([`wordmark-and-booths-tile-v2.html`](docs/mockups/wordmark-and-booths-tile-v2.html)).** Anchored two sections: wordmark size (20px / 18px / 16px in both Home and Find masthead contexts), and booths Option C (C1 with 56×56 thumbnail, C2 text-only row). Each section had its own questions pane.

**Beat 5 — V2 decisions: 18px wordmark / C2 row / green lockup / no bio.** David picked: item 5 → 18px; item 2 → C2; lockup color stays `v1.green`; bio hidden on rows. With those four answers and items 1 + 3 + 4 already clear, the bundle was ready to ship.

**Beat 6 — Item 1 + Item 3 + Item 5 shipped (3 atomic commits, smallest→largest).** Per the now-load-bearing sequencing rule:

| Commit | Item | Change |
|---|---|---|
| `2e40732` | 1 | `components/BottomNav.tsx` — `label: "Find Map"` → `"Flagged"` |
| `cdac99d` | 3 | `components/BoothPage.tsx` — `BoothTitleBlock` eyebrow + 2 comment updates |
| `2efced5` | 5 | `components/StickyMasthead.tsx` — `WORDMARK_DEFAULT` swapped to `FONT_NUMERAL` (TNR), `fontSize: 18`, `color: v1.inkPrimary`, dropped italic + the -1px translateY lift |

Item 5 wordmark audit: scanned 9 files referencing "Treehouse Finds"; 8 were body copy, link text, or HTML metadata. Only `StickyMasthead.tsx` was the styled wordmark surface. Single-component change. Build clean both passes.

**Beat 7 — Item 4 (bookmark relocation).** Wrote design record [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) with D1–D7 frozen. Three primitives changed:
- `BookmarkBoothBubble` gained `"hero"` size variant (36×36 frosted, 18px glyph) alongside existing `"tile"` (28px) and `"masthead"` (38px). Same frosted-paper formula as tile, sized to match `/find/[id]` flag rect for sibling rhythm.
- `<BoothHero>` gained optional `saved` + `onToggleBookmark` props. When both are passed, bubble renders as a SIBLING of the photograph `motion.div layoutId` (D2 — sibling-not-child per session 78 layoutId frame-drop lesson) at `top: 8 right: 8`, NO own layoutId (D4 — avoids the cross-page namespace collisions of session 79). Static fade-in only.
- `app/shelf/[slug]/page.tsx` masthead dropped `BookmarkBoothBubble` + `showBookmark` / `saved` / `onToggleBookmark` props from `<Masthead>`'s API. Right slot collapses to share-airplane-only when `canShare`, null otherwise. The `boothBookmarked` state + `handleToggleBoothBookmark` now flow through to `<BoothHero>` via the new props (gated on `showBookmark = !!vendor && !isOwner`).

Verbal model: **flag a find / bookmark a booth, both on the corner of the entity you're saving.** Mall pages will follow the same pattern if a save-mall affordance is added later. Commit `786de81` (also swept up the 3 V1/V2 mockup files since they were untracked — note in housekeeping below).

**Beat 8 — Item 2 (Booths Option C2 row pattern).** Wrote design record [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) with D1–D9 frozen. Single largest commit:

- `app/shelves/page.tsx` — `VendorCard` rewritten as a single full-width row instead of a 2-col photo+lockup tile. Layout: `[bookmark 22px col]` `[vendor name 18px IM Fell, flex]` `[admin Pencil + Trash inline]` `[BOOTH small-caps + 26px TNR numeral, auto right]`. Mirrors `/flagged` booth-section-header sizing exactly.
- Photo retired entirely from /shelves directory. Hero photo stays on `/shelf/[slug]` BoothHero.
- Bookmark moves from photo top-right corner to far-left of row, inline Lucide icon (no bubble — the row card is the affordance container). `v1.green` fill on saved-state.
- Bio retired (D3 — vendor name only, predictable row height).
- **Track D phase 5 source layoutId RETIRED on /shelves.** No photo means no `<motion.div layoutId={`booth-${vendor.id}`}>`. `/shelf/[slug]` BoothHero destination layoutId preserved; framer-motion gracefully no-ops the morph when source is absent (per session 78 graceful-no-op pattern when source surface drops shared element).
- D8 admin chrome decision (single firing): admin Pencil + Trash inline icons (26px wash bubbles, `v1.inkHairline` border for Pencil, `v1.redBorder` for Trash) sit between vendor name and booth stack. Trash only renders when `!vendor.user_id`. The bookmark column on the left stays empty for admins (preserves session 67 D10 — admin can bookmark via `/shelf/[slug]` BoothHero now that item 4 moved it there).
- `AddBoothTile` rewritten as full-width dashed row (file name kept for callsite stability).
- `SkeletonCard` rewritten as single-row stripe.
- All three list containers (loading, savedMallId flat, group-by-mall) switched from `gridTemplateColumns: "1fr 1fr"` to `flexDirection: "column"` with 8px gap.
- Drop unused imports: `vendorHueBg`, `BookmarkBoothBubble`, `MOTION_SHARED_ELEMENT_EASE`, `MOTION_SHARED_ELEMENT_BACK`.

Commit `895129b`. /shelves bundle dropped 9.86 → 9.39 kB.

**Beat 9 — Two polish redirects (commit `eb6f942`).** David: "1. Animate in the mall location on the booths page to match the animation on the flagged and home pages. 2. on the find page (item), reduce the space between the booth name and the mall location."
- `/shelves` `MallScopeHeader` gained `motion.div` wrapper with `opacity 0→1`, `y 8→0`, `0.34s` duration, `0.04s` delay, `MOTION_EASE_OUT`. Identical to Home's pattern (Home uses `y: 8`; `/flagged` uses `y: 10`; chose Home's spec for the match David asked for).
- `/find/[id]` cartographic block: mall subtitle `marginTop` cut from `4` to `2` below vendor name. Both branches (`<a>` mapLink anchor and plain `<div>`) updated in sync.

**Final state in production (as of `eb6f942`):**

- 5 redirect items + 2 polish items shipped end-to-end. Working tree clean. Build green.
- `/shelves` bundle: 9.86 → 9.39 kB. `/shelf/[slug]` bundle: 3.54 → 3.22 kB.
- Wordmark visible on every screen as TNR upright ink-black 18px. Brand chrome quieter; photos and content lead.
- `/shelves` is now navigation-led (find a known vendor) rather than browse-led (discover photos). Hero photos live only on `/shelf/[slug]`.
- "Flag a find / bookmark a booth, on the corner of the entity you're saving" is the unified verbal model across `/find/[id]` and `/shelf/[slug]`.

**Commits this session (7 runtime + 1 close):**

| Commit | Message |
|---|---|
| `2e40732` | feat(nav): rename 'Find Map' tab label to 'Flagged' |
| `cdac99d` | feat(booth): change BoothTitleBlock eyebrow from 'a curated shelf from' to 'A curated booth from' |
| `2efced5` | feat(masthead): wordmark TNR upright ink-black 18px |
| `786de81` | feat(booth): relocate booth bookmark from masthead to BoothHero photo corner |
| `895129b` | feat(booths): row pattern (Option C2) — single-column rows, no photo |
| `eb6f942` | feat(polish): /shelves MallScopeHeader entrance + tighten /find/[id] vendor/mall gap |
| (session close) | docs: session 80 close — David 5-item redirect bundle + 2 polish shipped |

**What's broken / carried (delta from session 79):**

- 🟢 **All 5 + 2 redirect items shipped**, build green, working tree clean. iPhone QA pending.
- 🟡 **Item 4 BoothHero bookmark needs iPhone QA against banner-shape (16:9-ish) hero photo.** The bubble at `top: 8 right: 8` was sized to match `/find/[id]` flag (36×36) which sits over a 4:5 photo. Banner aspect ratio is wider; the relative-corner offset will read different. Likely fine but worth a check.
- 🟡 **Item 2 row density needs iPhone QA.** ~7-8 booths visible per scroll vs ~4 in old grid. Real-content seeding will stress-test this against varied vendor names — long names with ellipsis, mixed alphanumeric booth IDs, etc.
- 🟡 **Item 5 wordmark 18px against masthead bubbles.** V2 mockup showed both empty-slot and bubble-flanked contexts; David picked 18px. iPhone QA should confirm the wordmark holds visual balance against the 38px share airplane bubble — wordmark may feel slightly under-weighted next to the larger bubbles, was considered acceptable in mockup.
- 🟡 **Item 2 D8 admin chrome (Pencil + Trash inline on rows) is a single-firing decision** that wasn't in the V2 mockup. David should walk through admin /shelves to confirm the 26px wash bubbles between vendor name and booth stack feel right. Easy to revise positioning.
- 🟡 **Track D phase 5 source layoutId retired on /shelves.** /shelves → /shelf/[slug] morph is now a graceful-no-op (destination still has layoutId; source is gone). The `/shelves` → `/shelf/[slug]` transition validation that was a session 78 carry-forward is now MOOT — no morph to validate. Removed from KNOWN GAPS.
- 🟡 **`/my-shelf` back-nav scroll anchor** — still unfilled, carried forward from session 79's primary user ask. Phase 3a + 3b code in git history (commits `71a0555` + `51067b7`) is reusable. Re-attemptable in a focused future session WITHOUT morph changes — strict scope rule.
- 🟡 **V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html), [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html)) became obsolete after V2 superseded them. Kept in git history for audit trail; could be retired in a docs-housekeeping pass. Operational backlog.
- 🟡 **All session 70–78 carry items still hold** unless explicitly resolved above (e.g., D11 + D12 design record overrides; preview cache pattern; sibling-not-child layoutIds).

**Memory updates:** ONE new memory.

- [`feedback_mockup_options_span_structural_axes.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mockup_options_span_structural_axes.md) — when mocking a layout decision, the variants should cover **structural alternatives** (grid vs row, photo vs photoless, single-col vs multi-col), not just style/treatment within one structure. V1 booths mockup spanned the photo axis but assumed grid was settled; David's V2 redirect was the row pivot. Cost a full V2 iteration. Future mockups should pre-cover at least 2 structural shapes.

Existing memories that load-bore the session:
- `feedback_treehouse_no_coauthored_footer.md` — applied to all 7 runtime commits ✅.
- `feedback_ask_which_state_first.md` — applied at item 5 wordmark audit (asked which surfaces are in scope: masthead vs login text vs body copy; auto-decided based on file inspection with mockup question prepared).
- `feedback_visibility_tools_first.md` — N/A this session (no debugging cycles, all clean ships).
- "Smallest→largest commit sequencing" — **fourth firing, third clean execution.** Session 70 first firing, session 77 second-firing-misfire (rework before clean), session 78 first clean execution, session 80 second clean execution. Tech Rule promotion-ready and now load-bearing across the David-redirect-bundle pattern.
- "Design records committed in same session as implementation" — applied for both bookmark-relocation + booths-row-pattern design records, both landed in their feature commits (`786de81` and `895129b`). Eighth+ firing of this rule across project lifetime; promoted long ago.

**Live discoveries (single firings, Tech Rule candidates):**

- **D8 admin chrome inline-icons-between-name-and-stack** — single firing. The decision to place admin Pencil + Trash inline in the row (rather than as a left-edge column or separate row) was implementation-time, not in the mockup. David's spec mentioned bookmark left only; admin chrome was unspecified.
- **"Mockup options should span structural axes"** — first firing this session. New memory captures the rule.
- **"Wordmark brand-mark surface vs body-copy surface" audit pattern** — first firing. The 9-file scan for "Treehouse Finds" found 8 false positives (body copy, link text, metadata) and 1 real wordmark surface. Worth codifying as a rule for any future global brand element changes.

**Operational follow-ups:**
- Session 78 carry-forwards still all hold EXCEPT `/shelves` → `/shelf/[slug]` transition validation, which is now moot (Track D phase 5 source retired).
- **NEW: tidy up V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html) + [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html)) — superseded by V2; could retire in a docs-only sweep. ~5 min.
- **NEW: amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with a "Source side retired on /shelves session 80" addendum.** The design record describes 3 surfaces that received Track D phase 5; one is now off the books. Cheap docs hygiene.
- Existing operational backlog still holds: archive-drift backfill (sessions 54 + 55 + 57–79 missing tombstones in `docs/session-archive.md`), `marketplace-transitions-design.md` D11/D12 runtime-overrides amendment, debug-toast cleanup, OTP template paste, etc.

**Tech Rule candidates (this session):**

- "Mockup options should span structural axes" — first firing. New memory.
- "D8 admin chrome inline-icons-between-name-and-stack" — first firing.
- "Wordmark brand-mark surface vs body-copy surface audit pattern" — first firing.
- **`feedback_mockup_options_span_structural_axes.md`** — single firing this session. Promoted on second firing.
- **"Smallest→largest commit sequencing"** — **third clean execution** (sessions 78 + 80, plus session 70 partial + session 77 misfire-then-rework). Now structurally part of the David-redirect-bundle workflow. Fully load-bearing in practice. Ready for Tech Rule promotion when batch lands.

**Notable artifacts shipped this session:**
- [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) — D1–D7 frozen for item 4.
- [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) — D1–D9 frozen for item 2.
- [`docs/mockups/wordmark-and-booths-tile-v2.html`](docs/mockups/wordmark-and-booths-tile-v2.html) — V2 mockup carrying wordmark size + Option C2 row pattern. Approved by David.
- [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) — gained `"hero"` size variant.
- [`components/BoothPage.tsx`](components/BoothPage.tsx) — `<BoothHero>` gained optional `saved` + `onToggleBookmark` props for the photo-corner bookmark.
- [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) — `WORDMARK_DEFAULT` rewritten as TNR upright ink-black 18px (item 5 brand surface).
- [`app/shelves/page.tsx`](app/shelves/page.tsx) — `VendorCard` rewritten as full-width row, list containers grid → flex column, photo + Track D phase 5 source layoutId retired.
- [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx) — `<Masthead>` API stripped of bookmark props; bookmark passed through to `<BoothHero>`.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — cartographic mall subtitle marginTop 4 → 2.
- [`components/AddBoothTile.tsx`](components/AddBoothTile.tsx) — converted from 1:1 dashed square to full-width dashed row.
- [`components/BottomNav.tsx`](components/BottomNav.tsx) — "Find Map" → "Flagged" (item 1).

---

## ⚠️ Session 79 (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (Option A full revert)

Session 79 attempted to extend session 78's Track D shared-element transition pattern to three additional surfaces — `/find/[id]`'s "More from this shelf" strip (Phase 1), BoothPage `WindowTile`/`ShelfTile` on `/my-shelf` + `/shelf/[slug]` (Phase 2), and back-nav scroll-restore on `/flagged` + `/my-shelf` + `/shelf/[slug]` (Phase 3a + 3b). After four rounds of iPhone-QA cycles surfaced compounding issues that I couldn't diagnose remotely, David elected the clean revert path. **Production state is now identical to session 78 close (`4bcefeb`); the only artifact in main from session 79 is the revert commit `a9dc1bd` itself.**

The session's value is in what it taught about the limits of framer-motion's `layoutId` API as used in Treehouse's ecosystem. Captured below in case future sessions revisit.

**Beat 1 — Phase 1 + 2 + 3 baseline rollout (4 commits, smallest→largest sequencing).** Per the now-promotion-ready Tech Rule, sequenced as:

| Commit | Scope |
|---|---|
| `058f840` | feat(transitions): /find/[id] More-from-shelf shared-element morph (ShelfCard layoutId + preview cache) |
| `27f0fc4` | feat(transitions): BoothPage WindowTile + ShelfTile shared-element morph |
| `71a0555` | feat(transitions): /flagged scroll-restore on back-nav from /find/[id] |
| `51067b7` | feat(transitions): /my-shelf + /shelf/[slug] scroll-restore + post cache |

**Beat 2 — R1 (b5d6925): drop entrance animations on the new surfaces.** First iPhone test: David reported "very disjointed and the tiles keep animating, not just the selected image." Diagnosed as `<motion.div initial={{opacity:0,scale:0.97}} animate={...}>` per-tile entrance fade re-firing on every page mount — same fix pattern as session 78 home feed (`skipTileEntrance=true`). Dropped on 5 BoothPage tile types + the `/find/[id]` More-from-shelf section wrapper.

**Beat 3 — David's screenshot revealed the deeper bug: scattered tiles mid-flight on home back-nav.** This was NOT entrance animations — it was **cross-page layoutId namespace collision**. Phase 1's ShelfCards on `/find/[X]` carried layoutIds `find-Y`, `find-Z`, etc. (other vendor posts). When user navigated back to home, those layoutIds matched home tiles' layoutIds, and framer-motion connected EVERY tile across pages, animating each from its `/find` More-from-shelf rect to its home masonry rect.

**Beat 4 — Reverts of Phase 1 + Phase 2 + R1 (commits `5084787` + `83fe01e` + `7db02c4`).** Cleanly removed the cross-page collisions. Production back to "session 78 + Phase 3 scroll restore." David tested and confirmed the scattered-tiles bug was gone — but reported a NEW issue: tiles still animating in on every page load on home, /shelf, /find. **This was a session-78 latent bug, not introduced by my changes:** when scroll position differs between home unmount (at `Y_saved`) and remount (at `0` before scroll-restore fires in a useEffect), framer-motion's `useLayoutEffect`-time rect measurement sees a `Y_saved`-pixel difference and animates every layoutId tile from "above current" to "current." Not visible at session 78 close because David was tapping near top of scroll.

**Beat 5 — R2 (`a7dfd14`): conditional layoutId via module-scope `lastTappedPostId`.** Created `lib/morphTracker.ts` with `getLastTappedPostId()`/`setLastTappedPostId()`. Tile render uses `layoutId={isMorphTile ? \`find-${id}\` : undefined}`. Only the tapped tile carries layoutId; framer can't connect what isn't there. Also dropped entrance animations on BoothPage tiles for the same reason as R1 (correct fix, just not enough). Plus scheduled clear after 500ms on source page mount.

**Beat 6 — David: "first click no morph; second click works."** Diagnosed as React batching: setting a module-scope variable doesn't trigger React to re-render. The source tile rendered without layoutId before the tap, the tap set the variable, navigation began, but React never re-rendered the tile in time. On the second click the tile retained its layoutId from the prior back-morph render — that's why it worked.

**Beat 7 — R3 (`09d6fef`): refactor morphTracker to `useSyncExternalStore`.** Reactive store: setting now emits to subscribers, every tile re-renders with new value. Also made `layout="position"` conditional alongside `layoutId` (without the gate, framer-motion's per-mount layout tracking animated flag bubbles whenever the page chrome shifted during data load). David reported flags now stable but forward morph still missing on first click.

**Beat 8 — R4 (`7421a43`): wrap `setLastTappedPostId` in `flushSync`.** Forces React to commit the state update synchronously inside the click handler before Link's navigation fires. **Still didn't fix it.** This was the moment to call the question per `feedback_kill_bug_class_after_3_patches.md` — three deploy-and-verify cycles had failed at progressively deeper layers (module variable → reactive store → synchronous flush). I patched once more anyway.

**Beat 9 — R5 (`7870a39`): defer navigation by one `requestAnimationFrame`.** Hypothesis: framer-motion's projection system measures rects after a browser paint, and Next.js Link's navigation is fast enough to unmount the source before that paint completes. preventDefault Link's default + flushSync the state update + `requestAnimationFrame(() => router.push(...))`. **Still missed.** This is the wall I couldn't get past on remote-only iPhone debugging.

**Beat 10 — Option A: full revert to session 78 close (`a9dc1bd`).** David picked the offered revert. Single commit using `git rm lib/morphTracker.ts && git checkout 4bcefeb -- .`. Six files restored, one file deleted. Working tree exactly matches `4bcefeb`. Vercel redeploys to that state.

**Final state in production (as of `a9dc1bd`):**

- Identical to session 78 close. Every shipped surface behaves exactly as it did when David approved session 78.
- 12 commits in the session, but the net diff vs. `4bcefeb` is zero. One revert commit landed; everything else is in the audit trail.
- `/my-shelf` back-nav scroll anchor (the session's primary user ask) remains unfilled.

**Commits this session (12 runtime + 1 close):**

| Commit | Message |
|---|---|
| `058f840` | feat(transitions): /find/[id] More-from-shelf shared-element morph (Phase 1) |
| `27f0fc4` | feat(transitions): BoothPage WindowTile + ShelfTile shared-element morph (Phase 2) |
| `71a0555` | feat(transitions): /flagged scroll-restore on back-nav (Phase 3a) |
| `51067b7` | feat(transitions): /my-shelf + /shelf/[slug] scroll-restore + post cache (Phase 3b) |
| `b5d6925` | fix(transitions): drop tile entrance animations across new surfaces (R1) |
| `7db02c4` | Revert "fix(transitions): drop tile entrance animations across new surfaces (R1)" |
| `83fe01e` | Revert "feat(transitions): BoothPage WindowTile + ShelfTile shared-element morph" |
| `5084787` | Revert "feat(transitions): /find/[id] More-from-shelf shared-element morph" |
| `a7dfd14` | fix(transitions): conditional layoutId + drop BoothPage tile entrance (R2) |
| `09d6fef` | fix(transitions): reactive morph tracker + conditional layout prop (R3) |
| `7421a43` | fix(transitions): flushSync the morph tracker update before navigation (R4) |
| `7870a39` | fix(transitions): defer navigation by one frame so framer captures source rect (R5) |
| `a9dc1bd` ✅ | revert: roll all session 79 changes back to session 78 close (Option A) |

**What this session taught (for the future session that picks this up):**

- **`layoutId` is a global namespace.** ANY pair of `<motion.div>` elements anywhere in the app that share the same `layoutId` will be connected by framer-motion across mount/unmount transitions. Adding new surfaces that share `find-${post.id}` with existing surfaces (home, /flagged) creates cross-page collisions that produce scattered-tile animations on lateral and back-nav. **The session 78 Track D pattern doesn't extend by simply adding more `motion.div`s with `find-${id}`.**

- **Conditional `layoutId` via reactive store CAN solve the namespace collision** but introduces a render-timing fight against React batching + framer-motion's `useLayoutEffect`/projection system + Next.js App Router's Link navigation. R3 + R4 + R5 (reactive store + flushSync + rAF defer) all attempted to make the source tile commit its layoutId to the DOM before unmount. None reliably worked on iPhone in production. There may be a fix possible but it requires on-device debugging I couldn't do remotely.

- **Scroll position mismatch across mount/unmount IS a session-78 latent bug**. Home tiles slide on every back-nav from `/find/[id]` because framer measures rects relative to viewport and viewport-relative position differs when scroll restore fires in a useEffect (after framer's `useLayoutEffect`-time measurement). David was tapping near top of scroll at session 78 close so the difference was small enough to read as "instant snap." With deeper testing this session he started noticing it as "thumbnails animating in." Not introduced by session 79; surfaced by session 79.

- **The scroll-restore work (Phase 3a + 3b) was independent of the morph work and shipped cleanly on its own.** It would have landed the user's primary ask (`/my-shelf` back-nav anchor) without any of the iPhone-QA pain. **Worth re-applying in a focused future session WITHOUT any morph changes.** Module-scope cache + sessionStorage scroll keys are well-tested patterns from session 78's home feed.

- **Use the `/transition-test` testbed for surface extensions, not just initial primitive validation.** Session 77 built `/transition-test` and `feedback_testbed_first_for_ai_unknowns.md` codified the lesson for AI/LLM unknowns. The testbed pattern applies equally to extending an EXISTING shipped primitive to new surfaces — extension introduces NEW cross-surface interactions that haven't been tested. If I'd built a multi-tile-page testbed (two pages with shared `find-${id}` tiles, navigate between them) before touching `/find/[id]/page.tsx`, I would have hit the cross-page collision in the testbed and pivoted before any production code changed.

**Memory updates:** ONE new memory.

- `feedback_extend_existing_primitive_via_testbed.md` — when extending a shipped visual primitive to new surfaces (not just first-time validation), use the existing testbed FIRST to model the cross-surface interaction. Extension introduces new namespace collisions, new timing interactions, new lateral-nav paths that weren't covered by the original primitive's validation. Session 77's `/transition-test` would have caught session 79's cross-page layoutId collision in minutes. Going straight to production cost 12 commits + revert.

Existing memories that should have load-bore the session but didn't fire when they should have:

- `feedback_kill_bug_class_after_3_patches.md` (session 77) — should have fired at R3, definitely by R4. R3 → R4 → R5 was three deploy-and-verify cycles patching the same bug class (source tile not committing layoutId in time). Instead of structural revert at R4, I patched once more at R5. **Lesson re-firing for second time.** Now load-bearing across two sessions; should be promotion-ready as a Tech Rule.

- `feedback_visibility_tools_first.md` (session 78 carry) — should have fired around R3. With repeated remote-iPhone-debug cycles failing, the right move was to build a diagnostic primitive (e.g., a debug overlay that logs layoutId registration timestamps relative to navigation events) before iterating further fix attempts. Did not.

- `feedback_testbed_first_for_ai_unknowns.md` (session 65) — should have fired at session 79 OPENING. Track D extension to new surfaces is exactly the kind of "is the integration shape correct" question the testbed was built for. Did not fire because the rule was framed for AI/LLM unknowns specifically; the new memory below generalizes it.

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 13 commits in this session ✓.

**Live discoveries (single firings, Tech Rule candidates):**

- **framer-motion `layoutId` is a global namespace; cross-page connections fire for ANY pair of motion.divs sharing the same id.** First firing.
- **Conditional `layoutId` via reactive store fights React batching + framer projection + Next.js Link timing.** First firing (and possibly an unfixable interaction without on-device debugging).
- **Scroll position mismatch between unmount and remount triggers layoutId animations on every tile.** First firing (latent in session 78, surfaced in session 79).
- **After 3 deploy-and-verify cycles fail on remote-only iPhone debugging, offer a clean revert path explicitly rather than iterating further.** First firing (variant of `feedback_kill_bug_class_after_3_patches.md` — adds the "remote debug" qualifier).

**Operational follow-ups:**
- No new operational backlog from session 79 (the revert closed all in-flight items).
- Session 78 carry-forwards still all hold (preview cache pattern, `<motion.div role="button">` for nested buttons, `layout="position"` + explicit dimensions, sibling-not-child layoutIds, D11+D12 runtime overrides).
- **NEW: scroll-restore work for /my-shelf + /shelf/[slug] + /flagged** — re-attempt in a focused session WITHOUT morph changes. The Phase 3a + 3b code is in git history (commits `71a0555` + `51067b7`); could be cherry-picked or re-implemented from the pattern.

**Tech Rule candidates (this session):**

- "framer-motion layoutId is global namespace" — first firing. Diagnostic rule.
- "Conditional layoutId is fundamentally fragile" — first firing.
- "Use existing testbed for surface extensions, not just initial primitive validation" — first firing. NEW memory.
- "After 3 remote-debug cycles, offer revert path" — first firing. Variant of existing kill-bug-class rule.
- **`feedback_kill_bug_class_after_3_patches.md`** — second firing. Should have fired at R4; didn't until R5 close. Promote on next firing.

---

## ✅ Session 78 (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles (rotated to tombstone session 80 close)

> Full block rotated out at session 80 close. See tombstone below + the design records this session produced (`docs/marketplace-transitions-design.md`, the `feedback_preview_cache_for_shared_element_transitions.md` memory) for the load-bearing decisions. Session 80 retired the source-side `layoutId` for /shelves → /shelf/[slug] when the photo went away from /shelves; that surface is now a graceful-no-op rather than a shipped morph.

_(Session 78 detailed beat narrative removed at session 80 close — see `docs/marketplace-transitions-design.md` and the memory file for load-bearing decisions.)_

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–79 still missing — operational backlog growing). Session 74 fell off the bottom of last-5 visible tombstones at session 80 close.

- **Session 79** (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (Option A full revert). Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78's Track D shared-element pattern to /find/[id] More-from-shelf strip + BoothPage WindowTile/ShelfTile + add scroll-restore on /flagged + /my-shelf + /shelf/[slug]. Cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store (`useSyncExternalStore`) + `flushSync` + rAF defer fought React batching + framer projection + Next.js Link timing through 4 iPhone-QA cycles. David elected Option A: full revert. ONE new memory (`feedback_extend_existing_primitive_via_testbed.md`). Lessons: framer-motion `layoutId` is a global namespace; conditional layoutId via reactive store may not be reliably solvable without on-device debugging; testbed should be used for surface-extension work, not just initial primitive validation. Phase 3 scroll-restore code preserved in git history (commits `71a0555` + `51067b7`) for re-attempt in a future focused session WITHOUT morph changes. `feedback_kill_bug_class_after_3_patches.md` second firing — should have fired at R4 instead of R5.
- **Session 78** (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles. 11 runtime commits + close. FB Marketplace shared-element transition is now live across three production surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). Critical fix `c3b9541` introduced the **preview-cache pattern**: source surfaces write `image_url` to sessionStorage on tap so destination renders motion node synchronously before async data fetches resolve; module-scope cache (`cachedFeedPosts`) handles the back direction. ONE new memory (`feedback_preview_cache_for_shared_element_transitions.md`). Smallest→largest commit sequencing finally cleanly executed (sessions 70 + 77 firings precede). FIVE new single-firing Tech Rule candidates (preview-cache pattern, sibling-not-child layoutIds, `layout="position"` stabilization, `<motion.div role="button">`, iPhone QA can override design-record motion specs). D11 + D12 design record values overridden by on-device feedback. David: "looks good." **NOTE: at session 80 close, /shelves source-side `layoutId` was retired when the photo went away from /shelves rows — that surface is now a graceful-no-op morph rather than a shipped morph.**
- **Session 77** (2026-04-27) — Track D phases 1–4 + masthead bug 5-attempt arc. Six runtime/docs commits + close. Two parallel arcs that merged at close. **Track D (`d3ddffb` design-to-Ready + `e601db5` testbed + bundled mockup in `c968c1a`):** D1–D14 frozen for FB Marketplace shared-element transitions; design record committed; `/transition-test` testbed validated cross-route framer-motion `layoutId` works in Next.js 14 App Router without explicit `<AnimatePresence>`. Phase 5 rollout queued for session 78. **Masthead bug 5-attempt arc (`361e1de` + `c968c1a` + `d429bbb` + `166ed59` ✅):** sessions 76 + 77 attempts 1–4 all patched the wrong layer (React tree, browser bfcache, iOS PWA event listeners). Attempt 5 replaced `position: sticky` with `position: fixed` + spacer, eliminating the iOS PWA sticky-paint bug class entirely. Less code, structurally correct. ONE new memory (`feedback_kill_bug_class_after_3_patches.md`). "Smallest→largest commit sequencing" — second firing (then session 78 first clean execution). "PWA standalone vs browser Safari is a different render path" — first firing.
- **Session 76** (2026-04-27) — 6-item redirect bundle: bug fix + green tokens + find-title centering + animation consistency. Seven runtime/docs commits + close. **Track A (`b5470da`):** /find/[id] masthead present in loading + !post branches (mirrors /shelf/[slug] pattern — addressed wrong layer; real fix landed session 77). **Track B (`d0c4ce3` + `fd1a874`):** Treehouse Finds wordmark, "Booth" eyebrow, booth numeral all `v1.green` across every applicable surface. **Track C (`a2cf548` + bundled in `fd1a874`):** Find-detail title centered + price 32px IM Fell twin below in priceInk; em-dash retired; Frame B picked. **Track E (`ecb8ef8` + `3832fc1`):** 5 motion tokens added to lib/tokens.ts (`MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION`); Booths VendorCard gains `whileTap: scale 0.97`; empty-state + card-entrance unified across 4 primary tabs. Track D (FB Marketplace shared-element transitions) carried to session 77 as its own session. ZERO new memories. `feedback_ask_which_state_first.md` 10th–13th firings. Same-session design-record-commit rule 11th + 12th firings. "Verify sub-agent claims that contradict known semantic rules" — second firing (now promotion-ready). **NOTE: at session 80, the wordmark token (Track B) was reset from `v1.green` to `v1.inkPrimary` and font swapped from IM Fell italic to Times New Roman upright. Track B's "Treehouse Finds wordmark green" decision is now superseded for the masthead surface specifically; "Booth" eyebrow + booth numerals stay green per session 80 D5.**
- **Session 75** (2026-04-27) — David approved feed seeding then redirected to a 7-item polish + system-rule bundle: admin login redirect, BoothHero lightbox, /vendor-request rewrite, booth-numeral font system swap. Six runtime/docs commits + close shipping all 7 end-to-end. **Track A (`60a7a11` admin redirect + `eef1746` BoothHero lightbox):** `pickDest(user)` helper in /login centralizes admin → `/`; transparent overlay at z-5 sandwiches between photo + pencil + post-it. **Track C (`d747b71` design-to-Ready + `01a6b44` feat):** `FONT_POSTIT_NUMERAL` → `FONT_NUMERAL` (Times New Roman) across 7 surfaces; project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL" frozen; build-error caught the 7th surface (PhotographPreview). **Track B (`a427ee7` design-to-Ready + `fbbba21` feat):** /vendor-request one-screen redesign with owner-ack checkbox gate, hard-required Mall+Booth#, FONT_SYS photo copy, intro paragraph dropped + migration 013 (HITL paste pending). ZERO new memories. ZERO new Tech Rule promotions; four single-firing candidates.
---

## CURRENT ISSUE
> Last updated: 2026-04-28 (session 80 close — David 5-item redirect bundle + 2 polish items shipped end-to-end across 7 runtime commits. Items: nav rename Find Map → Flagged; "curated shelf" → "curated booth"; wordmark TNR upright ink-black 18px; bookmark relocated from /shelf/[slug] masthead → BoothHero photo corner; Booths Option C2 row pattern (no photo, no bio); /shelves MallScopeHeader entrance animation; /find/[id] vendor/mall gap tightened. Two new design records committed in same session per the rule. ONE new memory: `feedback_mockup_options_span_structural_axes.md`. iPhone QA pending.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change:** 7 runtime commits + close, all 5 redirect items + 2 polish items shipped end-to-end. `/shelves` bundle 9.86 → 9.39 kB; `/shelf/[slug]` bundle 3.54 → 3.22 kB. Track D phase 5 source layoutId retired on /shelves (graceful-no-op carries forward). Wordmark visible on every screen as TNR upright ink-black 18px. Feed content seeding remains top of queue — **23× bumped** now (22 at session 79 close; session 80 didn't seed). The `/my-shelf` back-nav scroll anchor (session 79 primary ask) remains an open carry-forward, independent of session 80's work; reattemptable in a focused future session WITHOUT morph changes.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

The single longest-deferred V1 unblocker, now **23× bumped** through sessions 55, 60–80. Migration 013 (owner_acknowledged) ran in session 77; Track D phase 5 transitions polished in session 78; session 80 retired the photo-led /shelves directory in favor of the row pattern, which means the masonry feed (Home) is now even more important as the visual-discovery surface — empty seed photos make Home feel sparse. 10–15 real posts across 2–3 vendors. Zero remaining technical blockers.

**Why now (over the alternatives):**
- Session 80 just shipped 5 items + 2 polish landing on iPhone today. iPhone QA SHOULD happen first, but the natural follow-on is seeding so the Track D transitions and the new /shelves row pattern both get exercised against varied real content.
- Real content makes Home's masonry feed live up to its visual-discovery role now that /shelves is navigation-led rather than browse-led.
- Flag-on-seeded-photos is the first opportunity to validate the saved-state UX against actual marketplace photography (frosted bubble + green fill).
- Bookmark-on-BoothHero is similarly the first chance to QA the new corner-bubble against real banner-aspect hero photos.
- Nothing else in the queue is gating beta. Q-014 (Metabase) is more valuable post-seeding.

**Verify before starting:** the `/transition-test` testbed still works on production (layoutId regression canary). And iPhone-QA the session 80 ships before declaring them landed.

### Alternative next moves (top 3)

1. **iPhone-QA the session 80 ships first.** 5 redirect items + 2 polish items shipped without on-device validation. Particularly: (a) item 4 BoothHero bookmark at `top:8 right:8` over banner-aspect photo (mostly different from /find/[id] flag's 4:5 photo aspect); (b) item 2 row density on real content — long vendor names, mixed alphanumeric booth IDs; (c) item 5 wordmark 18px holds visual balance against masthead bubbles; (d) item 2 D8 admin chrome (Pencil + Trash inline on rows) was a single-firing decision NOT in the V2 mockup — admin walk-through to confirm. ~10–20 min validation pass before committing to seeding.
2. **Re-attempt Phase 3 scroll-restore (NO morph changes).** Carried from session 79. Strict scope: only module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore. Reference commits `71a0555` + `51067b7` in git history. Lands the `/my-shelf` back-nav anchor (session 79's primary user ask). ~30–60 min, size S-M.
3. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — more valuable AFTER feed seeding because more events will be flowing.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 81 opener (pre-filled — Feed content seeding, after iPhone QA pass on session 80)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. Single longest-deferred V1 unblocker, 23× bumped. Goal: 10–15 real posts across 2–3 vendors so the Home masonry feed and the Track D phase 5 transitions land with their full visual punch on real marketplace photography. Session 80 retired the photo-led /shelves directory in favor of a single-column row pattern, which makes Home the primary visual-discovery surface — empty seed photos make it feel sparse. Migration 013 (owner_acknowledged) ran session 77; Track D phase 5 polished session 78; no remaining technical blockers. Walk through the post flow per docs/onboarding-journey.md, fill 2–3 vendor booths with diverse photos. PRE-SESSION: iPhone-QA the session 80 ships if not already done — items 4 (BoothHero bookmark on banner photo), 2 (row density on real content + D8 admin chrome decision), 5 (wordmark 18px against masthead bubbles), and the 2 polish items. ALTERNATIVES IF SEEDING DELAYED: (1) Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged using ONLY the scroll-key + module-cache pattern; commits `71a0555` + `51067b7` are in git history as reference. STRICT SCOPE: NO motion.div or layoutId changes. ~30–60 min. (2) Q-014 Metabase analytics surface. CARRY-FORWARDS FROM SESSIONS 78 + 79 + 80: preview cache pattern (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) is reusable for any future shared-element work; framer-motion layoutId is a global namespace; conditional layoutId via reactive store fights React batching + framer projection + Next.js Link timing; testbed `/transition-test` should be USED for surface-extension work, not just initial primitive validation; D11+D12 design record values were overridden by on-device feedback in session 78; **session 80 retired Track D phase 5 source layoutId on /shelves (graceful-no-op morph from /shelves → /shelf/[slug] now); BookmarkBoothBubble has 3 size variants (tile, hero, masthead); wordmark on every masthead is TNR upright ink-black 18px (FONT_NUMERAL); /shelves is row pattern not grid pattern; bookmark on BoothHero photo corner not in masthead.** /transition-test stays live as the layoutId regression canary.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until admin tab retires post-Q-014. Verbose console.logs in `/api/admin/events/route.ts` are now duplicative; cleanup deferred.
- **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event with `share_method` payload, intent-capture semantic.
- **Items 1 + 5 + 6 + 7 (Gemba polish quartet)** ✅ — **resolved session 74** in `30b9922`. Alphanumeric booth keyboard, FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped.
- **Item 4 (post-publish vendor-param preservation)** ✅ — **resolved session 74** in `d52b149`. Three router.push call sites in /post/preview preserve `?vendor=<id>` so admin lands on booth-of-origin.
- **Items 2 + 3 (booth name + mall edit)** ✅ — **resolved session 74** in `c5437df`. EditBoothSheet + PATCH `/api/admin/vendors` + Pencil bubble rewire on `/shelves`.
- **"Add a booth" affordance restored on /shelves** ✅ — **resolved session 74** in `c5437df`. AddBoothTile + AddBoothSheet (third oscillation, intentional this pass per [`docs/booth-management-design.md`](docs/booth-management-design.md)).
- **Item 1 (session 75) — admin login redirect** ✅ — **resolved session 75** in `60a7a11`. `pickDest(user)` helper routes admins to `/` by default; explicit `?redirect=/foo` still wins.
- **Item 6 (session 75) — BoothHero lightbox on tap** ✅ — **resolved session 75** in `eef1746`. Transparent overlay button at z-5 sandwiched between photo container and pencil/post-it. Mounts only when heroImageUrl present.
- **Item 7 (session 75) — booth-numeral font system** ✅ — **resolved session 75** across `d747b71` + `01a6b44`. `FONT_NUMERAL` (Times New Roman) replaces `FONT_IM_FELL` on Variant B booth lockup numerals + MallScopeHeader count chips. Project-wide rule frozen.
- **Items 2 + 3 + 4 + 5 (session 75) — /vendor-request redesign** ✅ — **resolved session 75** across `a427ee7` + `fbbba21`. One-screen layout, owner-ack checkbox, hard-required Mall+Booth#, FONT_SYS photo dropzone copy, intro paragraph dropped.
- **Item 1 (session 76) — masthead disappears on back-nav** ✅ — **resolved session 76** in `b5470da`. Loading + !post branches now render `StickyMasthead` with back button.
- **Items 3 + 4 (session 76) — green tokens** ✅ — **resolved session 76** in `d0c4ce3` + `fd1a874`. Treehouse Finds wordmark + "Booth" eyebrow + booth numeral all `v1.green` across every applicable surface.
- **Item 2 (session 76) — find-title centered + price below** ✅ — **resolved session 76** across `a2cf548` (record) + `fd1a874` (impl bundle). Frame B picked. Em-dash retired.
- **Item 5 (session 76, E1–E5+E7) — animation consistency** ✅ — **resolved session 76** across `ecb8ef8` + `3832fc1`. 5 motion tokens in [`lib/tokens.ts`](lib/tokens.ts); Booths VendorCard gains tap feedback; empty states unified across 4 primary tabs.
- **Migration 013_owner_acknowledged.sql** ✅ — **resolved session 77** (David ran HITL paste this session per session-77 beat 1).
- **Item 1 (session 76 attempt + session 77 4 attempts) — masthead disappears on PWA back-nav** ✅ — **resolved session 77** in `166ed59` after 5 attempts. Final fix: `position: fixed` + spacer (kills sticky-paint bug class). Earlier 4 attempts (`b5470da`, `361e1de`, `c968c1a`, `d429bbb`) addressed wrong layers — preserved in history as audit trail.
- **Track D phases 1–4** ✅ — **shipped session 77** across `c968c1a` (mockup bundled), `d3ddffb` (design record), `e601db5` (testbed). D1–D14 frozen. Three thumbnail surfaces in scope. **NEW: position:fixed + spacer is masthead's underlying primitive** — `MASTHEAD_HEIGHT` const in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) is single source of truth. **NEW: `/transition-test` is durable diagnostic infrastructure** — keep live for layoutId regressions.
- **Track D phase 5 — surface rollout** ✅ — **shipped session 78** across 11 runtime commits and 6 iPhone-QA cycles. Three surfaces originally live: feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]. **Session 80 retired the /shelves source side** when the photo went away from /shelves rows; that surface is now a graceful-no-op morph rather than a shipped morph (destination layoutId on /shelf/[slug] BoothHero preserved; framer-motion gracefully no-ops when source is absent). Two surfaces still live: feed → /find/[id], /flagged → /find/[id]. Critical fix `c3b9541` introduced the **preview cache pattern** (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) that any future shared-element work will need to reuse. **NEW carry-forward: D11 + D12 design record values overridden by on-device feedback** — all entrance delays compressed to 0; post-it crossfade replaced with zoom-in 1.15→1; bubble timing matches photograph morph. Design record stays as historical reference; runtime values only in CLAUDE.md session 78 block. Operational backlog: amend the design record with a "Runtime Overrides" section + a "Source side retired on /shelves session 80" addendum.
- **Item 5 (session 80) — wordmark TNR upright ink-black 18px** ✅ — **resolved session 80** in `2efced5`. `StickyMasthead.tsx` `WORDMARK_DEFAULT` rewritten: `FONT_NUMERAL` (Times New Roman) + `fontSize: 18` + `color: v1.inkPrimary`, dropped italic + the -1px translateY lift. Visible on every screen that uses StickyMasthead.
- **Item 4 (session 80) — bookmark relocated masthead → BoothHero photo corner** ✅ — **resolved session 80** in `786de81`. Design record at [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7. `BookmarkBoothBubble` gained `"hero"` size variant (36×36 frosted, 18px glyph). `BoothHero` gained optional `saved` + `onToggleBookmark` props; bubble renders as SIBLING of photograph motion.div at top:8 right:8, NO own layoutId. `/shelf/[slug]` masthead right slot collapses to share-airplane-only. **NEW carry-forward: needs iPhone QA against banner-aspect hero photo** (item 4 sized to match /find/[id] flag's 4:5 photo).
- **Item 2 (session 80) — Booths page Option C2 row pattern** ✅ — **resolved session 80** in `895129b`. Design record at [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. `VendorCard` rewritten as full-width row, photo retired, no bio, bookmark on far-left, lockup mirrors /flagged. **D8 admin chrome (Pencil + Trash inline before booth stack) was a single-firing implementation-time decision NOT in the V2 mockup** — needs admin walk-through to confirm. **NEW carry-forward: row density on real content needs iPhone QA.** Old grid was ~4 booths/scroll; row pattern is ~7-8/scroll. Long vendor names + alphanumeric booth IDs will stress-test ellipsis behavior.
- **Item 1 + Item 3 (session 80) — nav rename + curated text** ✅ — **resolved session 80** in `2e40732` + `cdac99d`. Trivial copy changes.
- **Two polish items (session 80)** ✅ — **resolved session 80** in `eb6f942`. /shelves MallScopeHeader gains the same fade-up entrance as Home + /flagged; /find/[id] cartographic mall subtitle marginTop 4 → 2.
- **NEW: Frame C compact-photo alternative parked** (session 75) — [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals 3:2 dropzone still feels overwhelming. CSS-only change.
- **NEW: Project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL"** (session 75) — captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Promote to design-system.md on next consolidation.
- **NEW: BoothHero lightbox z-index sandwich pattern** (session 75) — transparent overlay at z-5 between photo container and pencil/post-it. Reusable when adding tap targets to affordance-rich surfaces. Single firing.
- **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic** (session 75) — photo dropzone copy was the trigger. Single firing. Tech Rule on second firing.
- **NEW: Narrow-named tokens audited for generalization** (session 75) — `FONT_POSTIT_NUMERAL` discovery. Single firing.
- **NEW: Item 6 (session 76) — FB Marketplace shared-element transitions** carried into session 77. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces. Per `feedback_testbed_first_for_ai_unknowns.md`, build `/transition-test` testbed page first to validate cross-route shared-element transitions before touching real surfaces. Size M-L; likely its own session.
- **NEW: E6 (session 76) — scroll-restore safety deferred** — extract `useScrollReveal` from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`; generalize sessionStorage-key + ref machinery so Booths / Find Map / /flagged adopt skip-entrance-on-restore. ~30–60 min in its own session.
- **NEW: Frame C parked on find-title centering** (session 76) — [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) Frame C (22px italic subtitle) ready as CSS-only pivot if 32px twin reads heavy on real vendor content during seeding.
- **NEW: Sheet/modal entrance animation consistency NOT touched** (session 76) — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet etc. carry their own entrance animations. Inventory deferred to a separate consistency pass on overlay primitives.
- **NEW: `app/finds/page.tsx` (dark reseller layer "My Picks") deviates from motion tokens** (session 76) — out-of-scope by design (different theme, different layer). Future cleanup if dark layer ever migrates.
- **NEW: Home MasonryTile bespoke easing intentionally diverges** (session 76) — `cubic-bezier(0.22,1,0.36,1)` for transform + 0.38/0.44s split durations preserved as intentional polish on hero feed grid. Token values centralize but the runtime is forked.
- **NEW: Detail-page render branches must render base chrome in every state** (session 76) — first firing (find/[id] bug). Single firing; Tech Rule on second firing.
- **NEW: Default to stacked over inline for title + secondary value patterns** (session 76) — first firing (find-title em-dash retirement). Single firing.
- **NEW: Audit invariants against sibling pages of the same shape after 3+ recent sessions** (session 76) — first firing (find/[id] masthead invariant existed in /shelf/[slug] but not here despite 3 recent layout sessions). Single firing.
- **Feed content seeding** — rolled forward from sessions 55–80. 10–15 real posts across 2–3 vendors. **Now 23× bumped**. Sessions 61–80 each strengthened the case; session 78 shipped Track D phase 5 (FB Marketplace transitions polished across 6 iPhone-QA cycles); session 79 net-zero; session 80 shipped 5+2 redirect bundle including the /shelves row pattern that retires photo-led discovery there and shifts visual-discovery weight to Home masonry feed. Now top of queue with zero remaining technical blockers — Migration 013 done in session 77, transitions polished in session 78, /shelves redesigned session 80. Real content is more important than ever now that Home is the primary visual-discovery surface.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 30+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready** (session 76 2nd firing), **"smallest→largest commit sequencing" 🟢 promotion-ready** (session 70 1st + session 77 2nd misfire + session 78 1st clean + session 80 2nd clean — load-bearing across the David-redirect-bundle workflow). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it"). Session 70–78 history preserved above. Session 79 — `feedback_extend_existing_primitive_via_testbed.md` memory + `feedback_kill_bug_class_after_3_patches.md` 2nd firing. **Session 80** surfaced THREE new single-firings: (1) "Mockup options should span structural axes" (1st firing — new memory `feedback_mockup_options_span_structural_axes.md`); (2) "D8 admin chrome inline-icons-between-name-and-stack" (1st firing — implementation-time decision); (3) "Wordmark brand-mark surface vs body-copy surface audit pattern" (1st firing — 9-file scan, 8 false positives). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon if a separate visual sweep happens.
- **Tag-extraction analytics events** ✅ — **resolved session 73**. `tag_extracted` (with `has_price` + `has_title`) + `tag_skipped` shipped.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests see a 22px CircleUser glyph in the masthead right slot. Worth checking during beta-feedback.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012.
- **Existing `/api/*` routes are unwrapped re Sentry** (session 65) — ~25 routes silently swallow errors at the framework level. Acceptable for now; auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (session 65, parked) — would auto-fix the Sentry wrap-route requirement and unlock Cache Components.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — one-time fix: add a `.mcp.json` block.
- **`/mall/[slug]` lensless on v0.2 dark theme** (session 66) — known deviation; lens applies cleanly when mall page does its v1.x ecosystem migration.
- **Treehouse Lens constant is provisional** (session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)`; real vendor content this week may reveal it needs tuning.
- **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` with `{vendor_slug}` payload.
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — Pencil + Trash already in top-right; admin can bookmark via `/shelf/[slug]` masthead. Reconsider only if admins want it.
- **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` fires on all three primary tabs with `page` field for per-tab attribution.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70 + 71** via cartographic collapse.
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via collapse.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight`.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — eyebrow now single-line "Booth"; post-it may look slightly tall. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos; real vendor content during the seeding walk is the actual judgment moment.
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid`; implementation kept `v1.priceInk` (established semantic token).
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70**.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (session 70) — captured in Record 1 design record as known-limitation. Likely fix: mall-grouped section breaks with small all-caps mall eyebrow.
- **Booth-page scroll flatten (D17) regression watch** (session 70) — highest-risk decision in Record 3. Watch on iPhone QA.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (session 70) — page may lose the "reviewing" feel against vendors stepping through Add Find. (Note: session 74 touched /post/preview for item 4 but didn't change title placement.)
- **Booths grid lockup numeral size deviates from spec** (session 70) — design record specified 26px; Booths grid implements at 20px to preserve tile proportions. Design-record L3 amended.
- **Item 3 — animation consistency review across pages** ✅ — **resolved session 76** in `ecb8ef8` + `3832fc1`. 5 motion tokens centralized in lib/tokens.ts; Booths VendorCard tap parity shipped; empty states unified. E6 (scroll-restore safety) deferred separately.
- **Item 5 follow-up: B + A parked** (session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready as second pass.
- **Item 6 — shareable filtered-mall link** (session 71) — needs product + URL-param scoping + share UX + mockup pass.
- **Sub-agent claim verification gap** (session 71) — single firing; Tech Rule candidate on second firing.
- **Screenshot-before-scoping discipline for visual fixes** (session 71) — single firing; Tech Rule candidate on second firing.
- **Multi-affordance retirement → single-surface promotion** (session 72) — single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (session 72) — empty-on-purpose is a valid state.
- **Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73) — strategic next step on the analytics arc. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014.
- **Diag strip + raw probe stay as durable visibility tooling** (session 73 decision) — retire automatically when Q-014 lands and admin tab retires.
- **Other supabase-js call sites might have the same latent bug** (session 73) — audit candidates: any inline `createClient` outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent.
- **NEW: Hero photo asymmetry between Add and Edit sheets** (session 74) — Add sheet has hero photo upload; Edit sheet doesn't (per D5, /my-shelf?vendor=<id> is canonical hero-edit surface). Easy expand if asked.
- **NEW: AddBoothInline retained on /admin Vendors tab** (session 74) — duplicate Add UI exists (AddBoothSheet on /shelves + AddBoothInline on /admin). Field shapes match; future cleanup may unify if drift surfaces.
- **NEW: /vendor/[slug] no longer reachable from /shelves Pencil** (session 74) — intentional per D1. Reachable from `/shelf/[slug]` and direct nav. Add a "View profile" eyebrow on EditBoothSheet if surfaced.
- **NEW: Slug-collision shares the BOOTH_CONFLICT path** (session 74) — generic error message says "booth number" but actual cause might be slug uniqueness. Add slug-specific path if surfaced.
- **NEW: Third oscillation of AddBoothInline-on-/shelves** (session 74) — captured in [`docs/booth-management-design.md`](docs/booth-management-design.md) Carry-forward so future sessions don't reflexively retire.
- **NEW: `showPlaceholders` prop infrastructure dormant in BoothPage** (session 74) — unreachable after item 6 dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup pass to reap; deferred.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–73 missing from `docs/session-archive.md`. Pure docs-housekeeping. Worth a single ~15min ops pass at some point.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54 + 55 + 57–79 missing), strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant showPlaceholders prop infrastructure in BoothPage.tsx, **NEW (session 80): tidy V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html) + [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html), superseded by V2), **NEW (session 80): amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with "Source side retired on /shelves" addendum**. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK + Vercel-Sentry integration + source-map upload + PII scrubbing + email alerts. Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations; v4 on-device QA walk **PASSED 4/4 clients session 53**. Loop fully closed.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). **Note: session 74 partially addressed this for admin** via the new EditBoothSheet, which any admin can use to edit any booth's name. Vendor-self-edit is still parked (vendors can't edit their own booth name yet; only admins can).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Sprint 5 polish.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need; session 74 closes the booth-name + mall-edit gap; the 80% case is now covered by /shelves), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` through `v4.html` — design-history reference for Q-011 arc.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002).
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — Q-011 addendums stacked. Post-QA, candidate for consolidation.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot artifact, gitignored, safe to delete anytime).
- Orphaned `dbutler80020@gmail.com` staging auth user (non-admin, non-blocking).
- **NEW: showPlaceholders prop infrastructure in BoothPage.tsx** (session 74) — unreachable after `/my-shelf` dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end — three production surfaces, preview-cache pattern as new reusable infrastructure. Session 79 was net-zero (Track D extension attempt reverted). **Session 80 closed another David-redirect bundle (5 items + 2 polish, 7 runtime commits, two new design records committed in same session per the rule):** nav rename, "curated booth from" eyebrow, wordmark TNR upright ink-black 18px on every screen, bookmark relocated from /shelf/[slug] masthead → BoothHero photo corner (verbal model: "flag a find / bookmark a booth, both on the corner of the entity you're saving"), Booths Option C2 row pattern (photo retired from directory, bookmark on far-left of row, /shelves becomes navigation-led not browse-led), MallScopeHeader entrance animation parity across primary tabs, /find/[id] vendor/mall gap tightened. ONE new memory: **structural mockup axes**. Track D phase 5 source layoutId retired on /shelves alongside the photo (graceful-no-op carries). Smallest→largest commit sequencing fired clean for the 4th time — fully load-bearing in the redirect-bundle workflow. Feed content seeding remains top of queue, **23× bumped**, zero remaining technical blockers. The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) is an open carry-forward — re-attemptable in a focused future session WITHOUT morph changes. **Next natural investor-update trigger point** is still after feed content seeding lands. Q-014 (Metabase) remains the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."

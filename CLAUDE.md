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

## ✅ Session 81 (2026-04-28) — Demo-prep refinement bundle (9 runtime commits), V1 + V2 mockups, end-to-end iPhone QA on Vercel previews

Session 81 ran a David-redirect-bundle pattern (mall demo prep, sequel to sessions 74–76 + 80): V1 mockup → David picks → V2 redirect on one item → ship in smallest→largest order → iPhone QA via Vercel previews → David surfaces 5 follow-up tweaks → ship 4 more commits → one final clarification + bonus tweak. **Net: 9 runtime commits + close, every shipped item validated end-to-end via on-device Vercel preview QA in the same session.** Smallest→largest commit sequencing fired clean for the **5th time** (sessions 70 partial + 77 misfire + 78 + 80 + 81 — fully load-bearing in the redirect-bundle workflow). ONE new memory captured.

**Beat 1 — Standup + 3-item demo bundle scoping.** David opened with three demo-prep items: (1) thicker nav-bar icon strokes; (2) booth lockup feels "out of place" — wants 3 alternative options exploring "dotted line border with same bg as background image" or "masking tape"; (3) photo-overlay icon bubbles get lost on busy photos — want lighter shade. Item 1 trivial-spec; items 2+3 needed mockups. Per `feedback_mockup_options_span_structural_axes.md` (session 80 memory), I built three structurally distinct lockup containers for item 2 rather than three styles within one shape: A perforated dashed card / B masking tape strip / C kraft hanging tag.

**Beat 2 — V1 mockup ([`demo-prep-refinement-v1.html`](docs/mockups/demo-prep-refinement-v1.html)).** Three sections: nav stroke (1.7 / 2.0 / 2.25) on a 4-tab BottomNav; booth lockup (A perforated / B tape / C kraft tag) each across `/shelves` row + `/flagged` section header inside one phone frame; bubble lightness (0.78 paperCream current / 0.85 paperWarm / 0.92 near-white) over a synthetic photo with both unsaved + saved bubbles. Each section had decisions pane + question pane.

**Beat 3 — David's V1 picks: stroke 2.0 / Option A / paper-warm 0.85.** Item 2 with concern: "these are selectable elements and removing the full background border makes it less obvious that it's selectable." Option A's transparent-bg-with-dashed-border read as floating text, not a tap-target card.

**Beat 4 — V2 mockup ([`demo-prep-refinement-v2.html`](docs/mockups/demo-prep-refinement-v2.html)).** Focused single-item refinement of Option A: kept dashed border + green-ink lockup, varied the fill behind. A1 dashed + paper fill (ticket stub) / A2 solid border + paper fill (loses dashes) / A3 dashed + fill + soft drop shadow (lifted ticket).

**Beat 5 — V2 picks: A3 + post-it eyebrow font swap follow-on.** David: "Lets go with A3. For Q2.2 (keep the post-it on the boothHero as is) but format the 'Booth' text the same as the others (all caps, with the same font treatment)." So the BoothHero post-it visual stays (yellow paper, push pin, rotate) but its eyebrow swaps from italic IM Fell 14px → small-caps `FONT_SYS 9px / 0.12em / weight 700 / uppercase` matching the new A3 lockup card. Q2.3 (mall scope-header count chip) stays as-is.

**Beat 6 — Initial 4 commits shipped (smallest→largest).**

| Commit | Item | Change |
|---|---|---|
| `333ea3b` | 1 | `BottomNav.tsx` strokeWidth 1.7 → 2.0 across all 5 icons (Home, Booths, Flagged, My Booth, Admin/FlagGlyph) |
| `79306a0` | 3 | Photo-overlay bubble bg `rgba(232,221,199,0.78)` → `rgba(245,242,235,0.85)` across 5 surfaces: `BookmarkBoothBubble` tile + hero, `app/page.tsx` masonry tile flag, `/flagged` tile flag, `/find/[id]` `frostedBg` constant + bottom flag/edit bubble |
| `846b673` | 2 follow-on | `BoothPage.tsx` BoothHero post-it 'Booth' eyebrow italic IM Fell → small-caps FONT_SYS |
| `ae4593c` | 2 main | A3 lockup card across `/shelves` rows + `/flagged` section headers — `border: 1.5px dashed rgba(30,77,43,0.78)` + `background: rgba(232,221,199,0.55)` + `boxShadow: 0 1px 3px rgba(42,26,10,0.12), 0 1px 1px rgba(42,26,10,0.06)` + numeral 26 → 22 to fit card without breaking row vertical rhythm |

Mockup files V1 + V2 swept into commit #1. Pushed to origin; David QA'd via Vercel preview on iPhone.

**Beat 7 — David's 5 follow-up tweaks after iPhone QA.** (1) `/flagged` vendor/mall gap inconsistent with `/find/[id]` cartographic block (session 80 polish); (2) "the white background on the screenshot" should be slightly warmer; (3) "BOOTH" eyebrow on `/find/[id]` post-it still showing italic IM Fell 14px (separate post-it from BoothHero, not in beat 6 commit); (4) "Mall" → "Location" terminology scrub across the app; (5) location dropdown trigger should read "All Kentucky Locations" when all selected. Items #2 + #4 had ambiguity — captured in beat 9 callout.

**Beat 8 — Follow-up 4 commits shipped.**

| Commit | Tweak | Change |
|---|---|---|
| `a0e2862` | 1 | `/flagged` mall+city subtitle marginTop 6 → 2 (matches `/find/[id]`) |
| `c6e5273` | 2 | `v1.postit` token #fffaea → #fbf3df (warmer cream, less harsh against parchment) — affects BoothHero post-it AND `/find/[id]` post-it |
| `bd0011b` | 3 | `app/find/[id]/page.tsx` post-it eyebrow italic IM Fell → small-caps FONT_SYS (matches BoothHero post-it from beat 6) |
| `0fab4a0` | 4 + 5 | "Mall" → "Location" copy scrub across **13 files**: MallSheet header + "All Kentucky Locations" picker option, MallScopeHeader title (was hard-coded "Kentucky" → "All Kentucky Locations") + aria-labels, BoothFormFields + AddBoothInline form labels, EditBoothSheet error copy, `/shelves` "Unknown location", `/setup` "your location", admin tab label + 6 admin events/toasts/errors, `/mall/[slug]` 404 copy, 4 API error messages. **Internal identifiers untouched** — DB table `malls`, types `Mall`, props `mall_id`/`mallId`/`selectedMall`, event keys `mall_activated`/`mall_deactivated`, route paths `/api/admin/malls`, component names `MallSheet`/`MallScopeHeader`/`MallShape`. Single-firing judgment call: scrub user-facing strings only, leave wire-protocol identifiers alone. |

**Beat 9 — David clarification on tweak 2: cartographic card, not post-it.** David's screenshot annotation showed the `/find/[id]` "Find this item at" cartographic card (white-ish bg with vendor + location + booth lockup) — that was the "white background" he meant. I'd guessed v1.postit (the most white-leaning token I knew) and shipped the wrong layer. The cartographic card's bg was `v1.inkWash` (used on 18+ surfaces — form inputs, tile backgrounds, sheet panels). Global swap would over-broaden; correct fix was inline `background: v1.postit` on just that one card so post-it + cartographic card read as a coordinated warm-cream family. Single commit `154145f`. **NEW memory captured** to formalize the lesson.

**Beat 10 — Test booth cleanup (SQL HITL).** Mid-session David asked how to delete two test booths ("Kentucky Treehouse", "Ella's Finds") since admin Trash on `/shelves` is gated to orphan booths only (session 74 D8) and these were claimed booths with `user_id`. Provided three SQL blocks (inspect → delete posts → delete vendors) with `'Ella''s Finds'` apostrophe-escape note. David's first run missed Ella's Finds; pivoted to `ILIKE '%ella%find%'` fuzzy match — David ran successfully. **No code commits**, but reaffirms the operational gap: claimed-booth deletion still requires SQL in dashboard. Q-005 admin-cleanup tool would close this; deferred per CLAUDE.md backlog.

**Final state in production (as of `154145f`):**

- 9 runtime commits + close. Working tree clean. Build green every pass.
- Demo-ready visual polish landed end-to-end in one session with iPhone QA via Vercel previews.
- Two test booths deleted from production via Supabase dashboard SQL.
- "All Kentucky Locations" wordmark visible on every primary tab masthead trigger; subtitle "Kentucky & Southern Indiana" stays.
- Booth lockup card unified across `/shelves` + `/flagged` (A3 dashed-fill-lift). Post-it eyebrows unified across BoothHero + `/find/[id]` (small-caps FONT_SYS). Post-it color warmer (#fbf3df). Cartographic card now matches post-it warmth.
- "Mall" terminology retired from user-facing UI; internal/wire identifiers preserved.

**Commits this session (9 runtime + 1 close):**

| Commit | Message |
|---|---|
| `333ea3b` | feat(nav): bump BottomNav icon strokeWidth 1.7 → 2.0 |
| `79306a0` | feat(bubbles): photo-overlay bg paper-warm 0.85 across all 5 surfaces |
| `846b673` | feat(booth): BoothHero post-it 'Booth' eyebrow small-caps to match lockup |
| `ae4593c` | feat(booth): lockup A3 dashed-fill-lift card across /shelves + /flagged |
| `a0e2862` | feat(flagged): tighten vendor/mall gap marginTop 6 → 2 to match /find/[id] |
| `c6e5273` | feat(tokens): v1.postit #fffaea → #fbf3df warmer cream |
| `bd0011b` | feat(find): /find/[id] post-it 'Booth' eyebrow small-caps to match BoothHero |
| `0fab4a0` | feat(copy): scrub user-facing 'Mall' → 'Location' (incl. picker 'All Kentucky Locations') |
| `154145f` | feat(find): cartographic 'Find this item at' card bg → v1.postit |
| (session close) | docs: session 81 close — demo-prep refinement bundle (9 runtime commits) |

**What's broken / carried (delta from session 80):**

- 🟢 **All 9 commits validated via Vercel preview iPhone QA in-session** — no regression reports. Live demos can run on the current state.
- 🟡 **"All Kentucky Locations" title fit risk on narrow phones.** "All Kentucky Locations" at 26px IM Fell + chevron + side padding is borderline on a 390px-wide phone. Should fit but tight. If David sees wrap or truncation on narrow devices, options: drop title 26 → 22, abbreviate to "All Locations", or stack on two lines.
- 🟡 **A3 lockup numeral 22 vs old 26 — visual rhythm on real content.** Card-padding consumes the 4px lost. Worth real-content-seeding QA pass but not blocking.
- 🟡 **Post-it color #fbf3df subtle vs the prior #fffaea.** Shift was conservative ((-4, -7, -11) RGB delta). If David finds it still reads white, easy refinement to push warmer (e.g. #f9eed5).
- 🟡 **Cartographic card bg matched via inline `v1.postit` not via global token swap.** If we ever decide we want the cartographic family of cards to use a dedicated token (`v1.cartographicBg` or similar), this is the natural moment to extract. Single firing for now.
- 🟡 **"Mall" → "Location" scrub kept internal identifiers.** Q-014 Metabase analytics will inherit `mall_activated` / `mall_deactivated` event names; if David wants those renamed too, do it as a separate atomic commit (event-key changes affect analytics history).
- 🟡 **Q-005 admin claimed-booth deletion** — gap surfaced again at beat 10. Cleanup tool would resolve. Sprint 6+ candidate.
- 🟡 **All session 79 + 80 carry-forwards still hold** unless explicitly resolved above. `/my-shelf` back-nav scroll anchor (session 79 primary user ask) remains unfilled.

**Memory updates:** ONE new memory.

- [`feedback_visual_reference_enumerate_candidates.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_visual_reference_enumerate_candidates.md) — when the user describes a UI element by visual cue (color, position, prominence in a screenshot) instead of naming a component or token, multiple surfaces may match — enumerate candidates by name and ask which BEFORE shipping. Pairs with `feedback_ask_which_state_first.md` (multi-state components) on a different axis (visual layer instead of state).

Existing memories that load-bore the session:
- `feedback_treehouse_no_coauthored_footer.md` — applied to all 9 runtime commits ✅.
- `feedback_mockup_options_span_structural_axes.md` (session 80) — **second firing.** V1 mockup spanned three structural lockup containers (perforated card / tape strip / kraft tag) instead of three styles within one shape. Now load-bearing across two sessions; promotion-ready.
- `feedback_ask_which_state_first.md` — applied at item 1 nav-stroke scoping (asked whether nav meant BottomNav only or also Find Map filter chips).
- "Smallest→largest commit sequencing" — **5th clean firing.** Sessions 70 partial + 77 misfire + 78 + 80 + 81. Now structurally part of every David-redirect-bundle session. **Promotion-ready** — should land as Tech Rule on next batch.

**Live discoveries (single firings, Tech Rule candidates):**

- **"User-facing copy scrub: skip DB/API/event/type identifiers unless explicitly asked"** — first firing this session. The "Mall" → "Location" scrub touched 13 files of UI copy but deliberately left `Mall` types, `malls` table, `mall_id` props, `mall_activated` event keys, `/api/admin/malls` route paths untouched. Single firing; Tech Rule on second.
- **"Inline bg vs token swap: when token affects too many surfaces, use literal/inline at the named element"** — first firing (cartographic card → `v1.postit` inline rather than a global `v1.inkWash` token swap that would have over-broadened to 18+ form-input/tile/sheet surfaces). Single firing.
- **"Visual reference, enumerate candidates"** — first firing this session. **NEW memory** captures the rule.
- **"V2 mockup as fill-refinement within a picked option"** — first firing. V1 was structural-axis variants (3 container shapes); V2 was within-A fill treatments (3 fill variants). The two-mockup pattern handled the "I picked option A, but with this concern" iteration cleanly. Useful pattern shape for future redirect bundles.
- **"Mid-session iPhone QA on Vercel preview shortens the redirect cycle"** — first firing as a structural pattern (vs ship-then-QA-next-session). David QA'd commits via the deploy preview between beats 6 and 7, surfaced 5 follow-up tweaks in real-time, and beats 8 + 9 shipped them in the same session. Compresses what would have been a 2-session arc into one. Worth memorializing if it fires again.

**Operational follow-ups:**
- **NEW: Q-014 Metabase planning should consider whether to rename `mall_activated` / `mall_deactivated` event keys to `location_*`** — if so, that's a backwards-compat migration (keep old names emitting + old names readable in Metabase), not a flag-day rename. Decision deferred.
- **NEW: Maybe add `v1.cartographicBg` semantic token** if we accumulate more "this element is in the cartographic-card family" surfaces. Not needed yet.
- Session 79 + 80 carry-forwards still all hold. `/my-shelf` back-nav scroll anchor still re-attemptable in a focused future session WITHOUT morph changes. Existing operational backlog still holds: archive-drift backfill (sessions 54 + 55 + 57–80 missing tombstones), `marketplace-transitions-design.md` D11/D12 + "source side retired on /shelves" amendments, debug-toast cleanup, OTP template paste, verbose diag logs in `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant `showPlaceholders` prop infrastructure in BoothPage.tsx, tidy V1 mockup files (now also session 81's V1 — though V1 + V2 from this session are usefully paired in audit trail).
- **NEW: Promote Tech Rule batch.** Smallest→largest commit sequencing now has 5 clean firings + 1 misfire + 1 partial — clear Tech Rule. `feedback_mockup_options_span_structural_axes.md` has 2 firings, also promotion-ready. Worth a 30-min ops pass on a future session to land the batch.

**Notable artifacts shipped this session:**
- [`docs/mockups/demo-prep-refinement-v1.html`](docs/mockups/demo-prep-refinement-v1.html) — V1 mockup carrying nav stroke + lockup options + bubble lightness.
- [`docs/mockups/demo-prep-refinement-v2.html`](docs/mockups/demo-prep-refinement-v2.html) — V2 mockup carrying Option A fill refinement (A1/A2/A3).
- [`components/BottomNav.tsx`](components/BottomNav.tsx) — strokeWidth 2.0.
- [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) — paper-warm 0.85 bg.
- [`components/BoothPage.tsx`](components/BoothPage.tsx) — BoothHero post-it eyebrow swap.
- [`components/MallSheet.tsx`](components/MallSheet.tsx) + [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) — title + picker + aria-labels updated to "Location" terminology.
- [`lib/tokens.ts`](lib/tokens.ts) — `v1.postit` color shift.
- [`app/shelves/page.tsx`](app/shelves/page.tsx) + [`app/flagged/page.tsx`](app/flagged/page.tsx) — A3 lockup wrappers + /flagged spacing fix + "Unknown location" copy.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — bubble bg lighten + post-it eyebrow swap + cartographic card bg → v1.postit.
- 8 additional files touched in the Mall→Location scrub (full list in beat 8).

---

## ✅ Session 80 (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (rotated to tombstone session 81 close)

> Full block rotated out at session 81 close. Net: 7 runtime commits — nav rename, "curated booth" eyebrow, wordmark TNR upright ink-black 18px, bookmark relocated to BoothHero photo corner, Booths Option C2 row pattern (photo retired, rows replace grid), MallScopeHeader entrance animation, /find/[id] vendor/mall gap tightened. Two design records committed: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md). Track D phase 5 source layoutId retired on /shelves alongside the photo (graceful-no-op morph carries forward). ONE new memory: `feedback_mockup_options_span_structural_axes.md`. Smallest→largest commit sequencing 4th clean firing. See tombstone below + the two design records for load-bearing decisions.

_(Session 80 detailed beat narrative removed at session 81 close — see the design records + tombstone below for load-bearing decisions.)_

- [`components/BottomNav.tsx`](components/BottomNav.tsx) — "Find Map" → "Flagged" (item 1).

---

## ⚠️ Session 79 (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (rotated to tombstone session 81 close)

> Full block rotated out at session 81 close. Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78 Track D pattern; cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store fought React batching + framer projection + Next.js Link timing; David elected full revert. ONE memory: `feedback_extend_existing_primitive_via_testbed.md`. `feedback_kill_bug_class_after_3_patches.md` 2nd firing. Phase 3 scroll-restore code preserved in git history (`71a0555` + `51067b7`) for re-attempt WITHOUT morph changes. See tombstone below for full lessons.

_(Session 79 detailed beat narrative removed at session 81 close — see tombstone below + the memory file for load-bearing decisions.)_
---

## ✅ Session 78 (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles (rotated to tombstone session 80 close)

> Full block rotated out at session 80 close. See tombstone below + the design records this session produced (`docs/marketplace-transitions-design.md`, the `feedback_preview_cache_for_shared_element_transitions.md` memory) for the load-bearing decisions. Session 80 retired the source-side `layoutId` for /shelves → /shelf/[slug] when the photo went away from /shelves; that surface is now a graceful-no-op rather than a shipped morph.

_(Session 78 detailed beat narrative removed at session 80 close — see `docs/marketplace-transitions-design.md` and the memory file for load-bearing decisions.)_

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–80 still missing — operational backlog growing). Session 75 fell off the bottom of last-5 visible tombstones at session 81 close.

- **Session 80** (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (7 runtime commits). Items: nav rename Find Map → Flagged; "curated shelf" → "curated booth" eyebrow; wordmark TNR upright ink-black 18px on every screen; bookmark relocated from `/shelf/[slug]` masthead → BoothHero photo corner (verbal model: "flag a find / bookmark a booth, both on the corner of the entity you're saving"); Booths Option C2 row pattern (photo retired from `/shelves` directory; bookmark on far-left of row; `/shelves` becomes navigation-led not browse-led); MallScopeHeader entrance animation parity across primary tabs; `/find/[id]` vendor/mall gap tightened. Two design records committed in same session per the rule: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7 + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. ONE new memory (`feedback_mockup_options_span_structural_axes.md`). Smallest→largest commit sequencing 4th clean firing (now load-bearing). Track D phase 5 source layoutId retired on `/shelves` alongside the photo (graceful-no-op morph carries forward); two surfaces still live (feed → /find/[id], /flagged → /find/[id]). `BookmarkBoothBubble` gained "hero" size variant (36×36 frosted, 18px glyph). Three new single-firings: D8 admin chrome inline-icons, mockup-options-structural-axes, wordmark brand-mark-vs-body-copy audit pattern.
- **Session 79** (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (Option A full revert). Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78's Track D shared-element pattern to /find/[id] More-from-shelf strip + BoothPage WindowTile/ShelfTile + add scroll-restore on /flagged + /my-shelf + /shelf/[slug]. Cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store (`useSyncExternalStore`) + `flushSync` + rAF defer fought React batching + framer projection + Next.js Link timing through 4 iPhone-QA cycles. David elected Option A: full revert. ONE new memory (`feedback_extend_existing_primitive_via_testbed.md`). Lessons: framer-motion `layoutId` is a global namespace; conditional layoutId via reactive store may not be reliably solvable without on-device debugging; testbed should be used for surface-extension work, not just initial primitive validation. Phase 3 scroll-restore code preserved in git history (commits `71a0555` + `51067b7`) for re-attempt in a future focused session WITHOUT morph changes. `feedback_kill_bug_class_after_3_patches.md` second firing — should have fired at R4 instead of R5.
- **Session 78** (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles. 11 runtime commits + close. FB Marketplace shared-element transition is now live across three production surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). Critical fix `c3b9541` introduced the **preview-cache pattern**: source surfaces write `image_url` to sessionStorage on tap so destination renders motion node synchronously before async data fetches resolve; module-scope cache (`cachedFeedPosts`) handles the back direction. ONE new memory (`feedback_preview_cache_for_shared_element_transitions.md`). Smallest→largest commit sequencing finally cleanly executed (sessions 70 + 77 firings precede). FIVE new single-firing Tech Rule candidates (preview-cache pattern, sibling-not-child layoutIds, `layout="position"` stabilization, `<motion.div role="button">`, iPhone QA can override design-record motion specs). D11 + D12 design record values overridden by on-device feedback. David: "looks good." **NOTE: at session 80 close, /shelves source-side `layoutId` was retired when the photo went away from /shelves rows — that surface is now a graceful-no-op morph rather than a shipped morph.**
- **Session 77** (2026-04-27) — Track D phases 1–4 + masthead bug 5-attempt arc. Six runtime/docs commits + close. Two parallel arcs that merged at close. **Track D (`d3ddffb` design-to-Ready + `e601db5` testbed + bundled mockup in `c968c1a`):** D1–D14 frozen for FB Marketplace shared-element transitions; design record committed; `/transition-test` testbed validated cross-route framer-motion `layoutId` works in Next.js 14 App Router without explicit `<AnimatePresence>`. Phase 5 rollout queued for session 78. **Masthead bug 5-attempt arc (`361e1de` + `c968c1a` + `d429bbb` + `166ed59` ✅):** sessions 76 + 77 attempts 1–4 all patched the wrong layer (React tree, browser bfcache, iOS PWA event listeners). Attempt 5 replaced `position: sticky` with `position: fixed` + spacer, eliminating the iOS PWA sticky-paint bug class entirely. Less code, structurally correct. ONE new memory (`feedback_kill_bug_class_after_3_patches.md`). "Smallest→largest commit sequencing" — second firing (then session 78 first clean execution). "PWA standalone vs browser Safari is a different render path" — first firing.
- **Session 76** (2026-04-27) — 6-item redirect bundle: bug fix + green tokens + find-title centering + animation consistency. Seven runtime/docs commits + close. **Track A (`b5470da`):** /find/[id] masthead present in loading + !post branches (mirrors /shelf/[slug] pattern — addressed wrong layer; real fix landed session 77). **Track B (`d0c4ce3` + `fd1a874`):** Treehouse Finds wordmark, "Booth" eyebrow, booth numeral all `v1.green` across every applicable surface. **Track C (`a2cf548` + bundled in `fd1a874`):** Find-detail title centered + price 32px IM Fell twin below in priceInk; em-dash retired; Frame B picked. **Track E (`ecb8ef8` + `3832fc1`):** 5 motion tokens added to lib/tokens.ts (`MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION`); Booths VendorCard gains `whileTap: scale 0.97`; empty-state + card-entrance unified across 4 primary tabs. Track D (FB Marketplace shared-element transitions) carried to session 77 as its own session. ZERO new memories. `feedback_ask_which_state_first.md` 10th–13th firings. Same-session design-record-commit rule 11th + 12th firings. "Verify sub-agent claims that contradict known semantic rules" — second firing (now promotion-ready). **NOTE: at session 80, the wordmark token (Track B) was reset from `v1.green` to `v1.inkPrimary` and font swapped from IM Fell italic to Times New Roman upright. Track B's "Treehouse Finds wordmark green" decision is now superseded for the masthead surface specifically; "Booth" eyebrow + booth numerals stay green per session 80 D5.**
---

## CURRENT ISSUE
> Last updated: 2026-04-28 (session 81 close — demo-prep refinement bundle: 9 runtime commits validated end-to-end via Vercel preview iPhone QA in-session. V1 mockup → V2 mockup pivot for Option A fill → ship 4 commits → David's 5 follow-up tweaks after iPhone QA → ship 4 more → cartographic card bg matched to post-it. Items: nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg → v1.postit. ONE new memory: `feedback_visual_reference_enumerate_candidates.md`. Smallest→largest commit sequencing 5th clean firing — fully load-bearing.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change:** 9 runtime commits + close, every shipped item validated via Vercel preview iPhone QA in-session. Demo-ready visual polish landed end-to-end. Two test booths ("Kentucky Treehouse", "Ella's Finds") deleted from production via Supabase dashboard SQL (HITL, no code commit). "All Kentucky Locations" wordmark visible on every primary tab masthead trigger. Booth lockup A3 card unified across `/shelves` + `/flagged`. Post-it eyebrows unified across BoothHero + `/find/[id]`. Post-it color warmer (#fbf3df). Cartographic card matches post-it warmth. "Mall" terminology retired from user-facing UI; internal/wire identifiers preserved. Feed content seeding remains top of queue — **24× bumped** now (23 at session 80 close; session 81 didn't seed). The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) remains an open carry-forward, re-attemptable in a focused future session WITHOUT morph changes.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

The single longest-deferred V1 unblocker, now **24× bumped** through sessions 55, 60–81. Migration 013 (owner_acknowledged) ran in session 77; Track D phase 5 transitions polished in session 78; session 80 retired the photo-led /shelves directory in favor of the row pattern; session 81 polished the lockup card + bubble bg + post-it color. The masonry feed (Home) is now the primary visual-discovery surface — empty seed photos make it feel sparse, and the new A3 lockup + bubble polish land with full visual impact only against real marketplace photography. 10–15 real posts across 2–3 vendors. Zero remaining technical blockers.

**Why now (over the alternatives):**
- Session 81 just landed demo-ready visual polish that needs real content to fully exercise. The A3 lockup + paper-warm bubbles + warmer post-it all land best on photos that vary in saturation/contrast.
- David has a mall demo today — by next session, real photos will be flowing in.
- Flag-on-seeded-photos validates the saved-state UX against actual marketplace photography (paper-warm 0.85 bubble + green fill).
- Bookmark-on-BoothHero is the first chance to QA the corner-bubble against real banner-aspect hero photos.
- Nothing else in the queue is gating beta. Q-014 (Metabase) is more valuable post-seeding.

**Verify before starting:** the `/transition-test` testbed still works on production (layoutId regression canary).

### Alternative next moves (top 3)

1. **Re-attempt Phase 3 scroll-restore (NO morph changes).** Carried from session 79. Strict scope: only module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore. Reference commits `71a0555` + `51067b7` in git history. Lands the `/my-shelf` back-nav anchor (session 79's primary user ask). ~30–60 min, size S-M.
2. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — more valuable AFTER feed seeding because more events will be flowing. Decision point: rename `mall_activated`/`mall_deactivated` event keys to `location_*` as part of Q-014 (backwards-compat migration), or leave as historical analytics keys.
3. **Tech Rule promotion batch.** Smallest→largest commit sequencing has 5 clean firings + 1 misfire + 1 partial — clear Tech Rule. `feedback_mockup_options_span_structural_axes.md` has 2 firings. ~30 min ops pass to land the batch in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 82 opener (pre-filled — Feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. Single longest-deferred V1 unblocker, 24× bumped. Goal: 10–15 real posts across 2–3 vendors so the Home masonry feed and the session 81 visual polish (A3 lockup card + paper-warm bubbles + warmer post-it + cartographic card) land with full visual punch on real marketplace photography. Session 80 retired the photo-led /shelves directory in favor of single-column rows; session 81 polished the lockup card to A3 dashed-fill-lift across /shelves + /flagged. Migration 013 ran session 77; Track D phase 5 polished session 78; no remaining technical blockers. Walk through the post flow per docs/onboarding-journey.md, fill 2–3 vendor booths with diverse photos. ALTERNATIVES IF SEEDING DELAYED: (1) Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged using ONLY the scroll-key + module-cache pattern; commits `71a0555` + `51067b7` in git history. STRICT SCOPE: NO motion.div or layoutId changes. ~30–60 min. (2) Q-014 Metabase analytics surface. (3) Tech Rule promotion batch (smallest→largest sequencing + structural-mockup-axes both promotion-ready). CARRY-FORWARDS FROM SESSIONS 78 + 79 + 80 + 81: preview cache pattern (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) is reusable for any future shared-element work; framer-motion layoutId is a global namespace; conditional layoutId via reactive store fights React batching + framer projection + Next.js Link timing; testbed `/transition-test` should be USED for surface-extension work, not just initial primitive validation; D11+D12 design record values were overridden by on-device feedback in session 78; session 80 retired Track D phase 5 source layoutId on /shelves (graceful-no-op carries); BookmarkBoothBubble has 3 size variants (tile, hero, masthead); wordmark on every masthead is TNR upright ink-black 18px (FONT_NUMERAL); /shelves is row pattern not grid pattern; bookmark on BoothHero photo corner not in masthead. **NEW from session 81: A3 dashed-fill-lift card is the booth lockup primitive across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows are small-caps FONT_SYS 9px / 0.12em; v1.postit is #fbf3df warmer cream; user-facing copy uses "Location" not "Mall" but internal types/events/routes still say `mall_*`; cartographic card on /find/[id] uses inline `v1.postit` bg; "All Kentucky Locations" is the all-malls picker title (watch tight fit on narrow phones).** /transition-test stays live as the layoutId regression canary.
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
- **Item 1 (session 81) — nav stroke 2.0** ✅ — **resolved session 81** in `333ea3b`. BottomNav 5 icons strokeWidth 1.7 → 2.0.
- **Item 3 (session 81) — photo-overlay bubble bg lighter** ✅ — **resolved session 81** in `79306a0`. `rgba(232,221,199,0.78)` → `rgba(245,242,235,0.85)` across 5 surfaces (BookmarkBoothBubble tile + hero, masonry tile flag, /flagged tile flag, /find/[id] frostedBg + bottom flag/edit). Session 80 BoothHero bookmark iPhone QA carry-forward is now resolved through this lighter bubble shipped at the same time.
- **Item 2 (session 81) — booth lockup A3 dashed-fill-lift card** ✅ — **resolved session 81** in `ae4593c` + `846b673` (BoothHero post-it eyebrow follow-on). A3 wrapper across `/shelves` rows + `/flagged` section headers: dashed green border + paper-cream 0.55 fill + soft drop shadow + numeral 26 → 22. BoothHero + `/find/[id]` post-it eyebrows swapped to small-caps FONT_SYS to match (commits `846b673` + `bd0011b`). Mockup files at [`docs/mockups/demo-prep-refinement-v1.html`](docs/mockups/demo-prep-refinement-v1.html) + [`docs/mockups/demo-prep-refinement-v2.html`](docs/mockups/demo-prep-refinement-v2.html) serve as the design record (no separate `.md` since this was tactical visual polish, not a new structural pattern).
- **Tweak 1 (session 81) — /flagged vendor/mall gap** ✅ — **resolved session 81** in `a0e2862`. marginTop 6 → 2 to match /find/[id] cartographic block.
- **Tweak 2 (session 81) — post-it warmer + cartographic card matched** ✅ — **resolved session 81** in `c6e5273` + `154145f`. v1.postit `#fffaea → #fbf3df`. Cartographic "Find this item at" card on /find/[id] inline `background: v1.postit` (not global `v1.inkWash` swap, which would have over-broadened to 18+ surfaces).
- **Tweak 3 (session 81) — /find/[id] post-it eyebrow** ✅ — **resolved session 81** in `bd0011b`. Italic IM Fell 14px → small-caps FONT_SYS 9px / 0.12em / weight 700 / uppercase to match BoothHero post-it.
- **Tweaks 4 + 5 (session 81) — "Mall" → "Location" copy scrub + "All Kentucky Locations" picker** ✅ — **resolved session 81** in `0fab4a0`. 13 files of user-facing strings updated; internal identifiers (`Mall` types, `malls` table, `mall_id` props, `mall_activated`/`mall_deactivated` event keys, `/api/admin/malls` routes, component names) deliberately preserved. **NEW carry-forward: "All Kentucky Locations" title fit risk on narrow phones** (26px IM Fell + chevron + side padding ~290–330px on a 390px-wide phone). If wraps awkwardly, options: drop to 22px, abbreviate "All Locations", or stack on two lines. Easy to revise.
- **Session 80 carry: Item 4 BoothHero bookmark needs iPhone QA against banner photo** ✅ — **resolved session 81 implicitly**. The session 81 bubble bg lightening (paper-warm 0.85) was shipped + David QA'd via Vercel preview without flagging the BoothHero corner bubble against banner-aspect photos — assumed acceptable.
- **Session 80 carry: Item 2 row density iPhone QA** — **partially addressed session 81**. A3 lockup wrapper added to rows; David QA'd the A3 card without flagging row-density issues. Real-content seeding still the load-bearing test.
- **Session 80 carry: Item 5 wordmark 18px against masthead bubbles** — **session 81 untouched.** No regressions reported during iPhone QA cycle. Likely acceptable.
- **Session 80 carry: Item 2 D8 admin chrome** — **session 81 untouched.** No admin walk-through this session; still a single-firing implementation-time decision worth admin verification.
- **NEW (session 81): "All Kentucky Locations" title fit on narrow phones** — see tweaks 4+5 entry above.
- **NEW (session 81): A3 lockup numeral 22 vs old 26 — visual rhythm on real content** — card-padding consumes the 4px lost. Real-content seeding will stress-test against varied alphanumeric booth IDs.
- **NEW (session 81): Post-it color #fbf3df subtle vs prior #fffaea** — RGB delta (-4, -7, -11). If still reads white in real-content QA, easy refinement to push warmer (e.g. `#f9eed5`).
- **NEW (session 81): Cartographic card bg matched via inline `v1.postit` not via global token swap** — single firing. If we accumulate more "this element is in the cartographic-card family" surfaces, extract a `v1.cartographicBg` semantic token. Not needed yet.
- **NEW (session 81): Q-005 admin claimed-booth deletion gap surfaced again** — beat 10 admin SQL HITL for Kentucky Treehouse + Ella's Finds test booths. Trash on `/shelves` is gated to orphan booths only (session 74 D8). Cleanup tool would resolve. Sprint 6+ candidate.
- **NEW (session 81): "User-facing copy scrub: skip DB/API/event/type identifiers"** — first firing. Tech Rule on second.
- **NEW (session 81): "Inline bg vs token swap when token affects too many surfaces"** — first firing.
- **NEW (session 81): "V2 mockup as fill-refinement within a picked option"** — first firing pattern shape; useful for "I picked option A, but with this concern" iterations.
- **NEW (session 81): "Mid-session iPhone QA on Vercel preview shortens redirect cycle"** — first firing as a structural pattern (vs ship-then-QA-next-session). Compresses 2-session arc into one.
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
- **Feed content seeding** — rolled forward from sessions 55–81. 10–15 real posts across 2–3 vendors. **Now 24× bumped**. Sessions 61–81 each strengthened the case; session 78 shipped Track D phase 5 (FB Marketplace transitions polished across 6 iPhone-QA cycles); session 79 net-zero; session 80 shipped 5+2 redirect bundle including the /shelves row pattern that retires photo-led discovery there and shifts visual-discovery weight to Home masonry feed; session 81 polished the demo-prep visual layer (A3 lockup card, paper-warm bubbles, warmer post-it, cartographic card match). Now top of queue with zero remaining technical blockers — Migration 013 done in session 77, transitions polished in session 78, /shelves redesigned session 80, demo polish session 81. Real content is more important than ever now that Home is the primary visual-discovery surface and the visual polish needs varied photography to land its full impact.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 30+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready** (session 76 2nd firing), **"smallest→largest commit sequencing" 🟢 promotion-ready** (session 70 1st + session 77 2nd misfire + session 78 1st clean + session 80 2nd clean + session 81 3rd clean — fully load-bearing across the David-redirect-bundle workflow), **`feedback_mockup_options_span_structural_axes.md` 🟢 promotion-ready** (session 80 1st firing + session 81 2nd firing). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it"). Session 70–78 history preserved above. Session 79 — `feedback_extend_existing_primitive_via_testbed.md` memory + `feedback_kill_bug_class_after_3_patches.md` 2nd firing. Session 80 surfaced THREE new single-firings: "Mockup options should span structural axes" (1st firing — new memory), "D8 admin chrome inline-icons-between-name-and-stack" (1st firing), "Wordmark brand-mark surface vs body-copy surface audit pattern" (1st firing). **Session 81** surfaced FIVE single-firings: (1) "User-facing copy scrub: skip DB/API/event/type identifiers"; (2) "Inline bg vs token swap when token affects too many surfaces"; (3) "Visual reference, enumerate candidates" (NEW memory `feedback_visual_reference_enumerate_candidates.md`); (4) "V2 mockup as fill-refinement within a picked option"; (5) "Mid-session iPhone QA on Vercel preview shortens redirect cycle". Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
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
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54 + 55 + 57–80 missing), strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant showPlaceholders prop infrastructure in BoothPage.tsx, **session 80: tidy V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html) + [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html), superseded by V2), **session 80: amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with "Source side retired on /shelves" addendum**, **NEW (session 81): Q-014 Metabase planning** — decide whether to rename `mall_activated`/`mall_deactivated` event keys to `location_*` (backwards-compat migration, not flag-day), **NEW (session 81): consider `v1.cartographicBg` semantic token extraction** if more cartographic-card surfaces accumulate. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end — three production surfaces, preview-cache pattern as new reusable infrastructure. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish, 7 runtime commits, two design records): nav rename, "curated booth" eyebrow, wordmark TNR ink-black 18px, bookmark relocated to BoothHero photo corner, Booths Option C2 row pattern, MallScopeHeader entrance animation, /find/[id] vendor/mall gap tightened. **Session 81 closed the demo-prep refinement bundle (9 runtime commits, V1 + V2 mockups, end-to-end iPhone QA via Vercel previews in-session):** nav stroke 2.0, photo-overlay bubble bg paper-warm 0.85 across 5 surfaces, A3 dashed-fill-lift booth lockup card across /shelves + /flagged, BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS, v1.postit warmer #fbf3df, /flagged vendor/mall gap matched to /find/[id], "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"), cartographic "Find this item at" card bg matched to post-it. ONE new memory: **visual reference, enumerate candidates**. Smallest→largest commit sequencing fired clean for the 5th time — now structurally part of every David-redirect-bundle session. Two test booths deleted from production via Supabase dashboard SQL. Feed content seeding remains top of queue, **24× bumped**, zero remaining technical blockers. The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) is an open carry-forward — re-attemptable in a focused future session WITHOUT morph changes. **Next natural investor-update trigger point** is still after feed content seeding lands. Q-014 (Metabase) remains the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."

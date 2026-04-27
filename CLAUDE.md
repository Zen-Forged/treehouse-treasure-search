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

## ✅ Session 77 (2026-04-27) — Track D phases 1–4 + masthead bug 5-attempt arc (6 runtime/docs commits)

David redirected /session-open from feed seeding to Track D (FB Marketplace shared-element transitions, carried from session 76) and reported the session-76 masthead-bug fix had not actually fixed the issue. Session split into two parallel arcs that merged in the closing beat: **Track D phases 1–4 shipped end-to-end** (decisions D1–D14 frozen, mockup approved, design record committed, `/transition-test` testbed validated on iPhone), and **the masthead bug took 5 attempts before landing**. The fifth fix structurally eliminated the bug class instead of patching it — confirmed working on PWA on first try. Session 78 is queued for Track D phase 5 rollout to 3 real surfaces.

**Beat 1 — Initial standup + Track D scoping (6 D-questions answered).** David approved Track D and answered six state-first questions in two messages: D1 (a) photograph only travels (post-it crossfades), D2 (b) both directions, D3 (a) masthead persists, D4 three surfaces (BoothPage shelf rail tiles pulled to v2), D5 (b) universal + `prefers-reduced-motion` gate, D6 (a) same image URL is the layoutId target. Per `feedback_ask_which_state_first.md` (14th–15th firings).

**Beat 2 — Track D phase 2 mockup (`docs/mockups/marketplace-transitions-v1.html`).** Per `feedback_still_frame_before_animation_port.md` (FB Marketplace is iOS native source — port from foreign runtime → static peak-frame mockup first). Three phone frames: pre-tap, mid-flight (~170ms), arrived (~340ms). Eight new decisions surfaced (D7–D14): easing curve cubic-bezier(0.32,0.72,0,1) iOS spring-out, 340ms forward / 300ms back duration, surround-tile fade to 18% over 220ms, photo z-20 passes UNDER masthead z-40, post-it crossfade with 40ms empty handoff, secondary-content stagger reusing session 76 MOTION tokens, `<MotionConfig reducedMotion="user">` gate, same `image_url` morphs aspect via object-fit cover. David approved all 8 in one message: "got it. I was on the wrong page for transitions. good to ship."

**Beat 3 — Masthead bug 5-attempt arc (4 commits over a single bug).**

David's video at frame 11.90 showed the photograph **flush at the top of the viewport with no masthead space at all** in the bug state — confirming the masthead truly had zero height in DOM, not just a paint issue. Earlier in the diagnosis David provided the breakthrough clue: "It only happens when viewed on PWA (home screen). When the page is loaded from the browser on iOS the bug is not present." This narrowed it to iOS PWA standalone-mode bfcache restoration — a different render path from browser Safari.

Five attempts:
1. **Session 76 (`b5470da`):** Masthead in every render branch. Wrong layer — attacks the React tree, not the underlying CSS primitive.
2. **Attempt 1 — `361e1de` bfcache pageshow.** Listen for `pageshow` with `event.persisted === true` and force a 1px scrollBy round-trip. Wrong event semantics — PWA doesn't reliably set `persisted`.
3. **Attempt 2 — `c968c1a` unified return refactor.** Three top-level `return` statements (loading / !post / success) in `app/find/[id]/page.tsx` were each remounting the masthead on state transitions. Refactored to single return mirroring `/shelf/[slug]`'s working pattern (which never had the bug). Genuine React-tree improvement that needed to ship anyway, but did not fix the iOS PWA paint bug — confirmed by David retesting.
4. **Attempt 3 — `d429bbb` aggressive multi-event nudge.** `useLayoutEffect` on mount + `pageshow` regardless of persisted + `visibilitychange` to visible, all firing a fractional-px `top` style mutation (most reliable iOS layout-recompute trigger when scrollBy no-ops). Sound logic but the events themselves don't fire reliably in iOS PWA bfcache restoration.
5. **Attempt 4 — `166ed59` position:fixed + spacer.** Stop fighting `position: sticky`. Replace with `position: fixed` (centered via `left: 50%; transform: translateX(-50%); maxWidth: 430`) plus a layout spacer of `calc(max(14px, env(safe-area-inset-top, 14px)) + 53px)` that reserves the same vertical space. Fixed elements use viewport coords and are always painted regardless of bfcache state — eliminates the bug class entirely. Net result: removed the useLayoutEffect, removed all event listeners, removed the ref. Less code than attempt 3, structurally correct. **David confirmed: "We have a fix. Nice work."**

Bundling note: the marketplace-transitions mockup accidentally got included in `c968c1a` (unified-return commit) because both edits touched the working tree at the same time. Single firing of "smallest→largest commit sequencing" misfire (echoes session 70's first firing). Tech Rule on second firing.

**Beat 4 — Track D phase 3 design record committed (`d3ddffb`).** [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) freezes D1–D14, calls out implementation notes for session 78 (app-shell `<MotionConfig>` first commit; layoutId on tile + detail; tile layout reservations to prevent grid reflow during flight; surround-chrome fade hook; reverse-direction validation), explicit out-of-scope (BoothPage shelf rail tiles → v2; same-route transitions; sheet/modal entrances), and acceptance criteria for session 78 rollout. Per same-session design-record-commit rule (session 56) — 13th firing.

**Beat 5 — Track D phase 4 testbed (`e601db5`).** Four-file testbed at `app/transition-test/` (layout.tsx with `<MotionConfig reducedMotion="user">`, tiles.ts with 6 static color tiles, page.tsx grid view, [id]/page.tsx detail view). Each tile uses `<motion.div layoutId={`tile-${id}`}>` with cubic-bezier easing matching the design record. David validated on iPhone: "good to ship." Confirms framer-motion `layoutId` works cross-route in Next.js 14 App Router without needing explicit `<AnimatePresence>` cross-route plumbing. Phase 5 rollout (3 real surfaces) is queued for session 78.

**Final state in production (as of `166ed59`):**

- Masthead never disappears on back-nav from `/shelf/[slug]` to `/find/[id]` in iOS PWA mode. `position: fixed` + spacer pattern eliminates the iOS PWA sticky-paint bug class entirely. All earlier patches removed.
- `/find/[id]` has a single top-level return; `loading` / `!post` / sold-shopper / normal states swap via inline conditionals. Wrapper, masthead, BottomNav, and PhotoLightbox stay stable across all transitions. Mirrors `/shelf/[slug]`'s pattern.
- `/transition-test` testbed live as a durable validation surface for cross-route layoutId. Useful diagnostic if framer-motion ever breaks under future Next.js upgrades.
- D1–D14 frozen for marketplace transitions. Phase 5 rollout to 3 real surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]) queued for session 78.

**Commits this session (6 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `361e1de` | fix(masthead): iOS bfcache repaint on back-nav (attempt 1, did not fix bug) |
| `c968c1a` | fix(find-detail): unified return — masthead never remounts (attempt 2, fixed React but not the iOS PWA bug; mockup bundled) |
| `d3ddffb` | docs(marketplace-transitions): design-to-Ready |
| `d429bbb` | fix(masthead): aggressive iOS PWA sticky-paint workaround (attempt 3, did not fix bug) |
| `e601db5` | feat(transition-test): minimal layoutId testbed for Track D phase 4 |
| `166ed59` | fix(masthead): position:fixed + spacer (kills sticky-paint bug class) ✅ |
| (session close) | docs: session 77 close — Track D phases 1–4 + masthead 5-attempt arc |

**What's broken / carried (delta from session 76):**

- 🟢 **Masthead-disappears bug on PWA back-nav** ✅ — resolved session 77 in `166ed59` after 5 attempts. Confirmed working by David on iPhone PWA. Session 76's fix (`b5470da`) addressed a different symptom (loading-branch chrome) but not the actual bfcache paint bug.
- 🟢 **Track D phases 1–4** ✅ — decisions D1–D14 frozen, mockup approved, design record committed, testbed validated. Phase 5 rollout to 3 real surfaces queued for session 78.
- 🟡 **Track D phase 5 — surface rollout to session 78.** Three surfaces (feed/ → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). Per design record acceptance criteria: app-shell `<MotionConfig>` first, then per-surface rollout, validate forward + back + reduced-motion on iPhone PWA. BoothPage shelf rail tiles → v2 (parked).
- 🟡 **NEW: position:fixed + spacer pattern is now the masthead's underlying primitive** (session 77) — applies to every page using `<StickyMasthead>`. Component name preserved. Worth noting for any future polish that wants to reach into masthead height calc — single source: `MASTHEAD_HEIGHT` const in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx).
- 🟡 **NEW: `/transition-test` is durable diagnostic infrastructure** (session 77) — keep as long-term diagnostic for any future framer-motion + Next.js layoutId regression. Visible on production but no nav links to it.
- 🟡 **NEW: marketplace-transitions mockup bundled into a runtime fix commit** (session 77) — `c968c1a` carries both the find-detail unified-return runtime fix AND the mockup HTML. Single firing of "smallest→largest commit sequencing" misfire. **Second firing of this pattern** (first was session 70) — Tech Rule candidate now promotion-ready.
- 🟢 **Migration 013 STILL pending** — David has run HITL paste this session per Beat 1. Removed from blocker list. (Confirmed by David: "HITL has been ran.")
- 🟡 All session 75–76 carry items not touched this session remain unchanged: Frame C compact-pill alternative parked on /vendor-request, Frame C parked on find-title, project-wide numeral-font rule, BoothHero lightbox z-index sandwich pattern, long-form helper copy on paper-wash → FONT_SYS rule, narrow-named-tokens rule, trust-the-build rule, sheet/modal entrance consistency pass, dark reseller layer motion deviation, Home MasonryTile bespoke easing, E6 scroll-restore safety hook extraction.
- 🟡 Sessions 70–74 carry items unchanged unless explicitly resolved above.

**Memory updates:** ONE new memory.

- `feedback_kill_bug_class_after_3_patches.md` — when 3+ deploy-and-verify cycles fail at progressively deeper layers above the same bug, stop patching and replace the underlying primitive itself; the structural fix is usually less code, not more. Validated by 5-attempt masthead arc (4 patches + 1 structural switch). David's "Confirmed! We have a fix. Nice work." came on attempt 5, after 4 silent failures.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` — 14th + 15th firings (D-questions in beats 1 + 2).
- `feedback_treehouse_no_coauthored_footer.md` — applied to all 6 runtime/docs commits ✅.
- `feedback_still_frame_before_animation_port.md` — fired in beat 2 (FB Marketplace is iOS native source; static peak-frame mockup first).
- `feedback_testbed_first_for_ai_unknowns.md` — fired in beat 5 (testbed before touching real surfaces).
- Same-session design-record-commit rule (session 56) — 13th firing (`d3ddffb` design record committed before phase 5 implementation).

**Live discoveries:**

- **iOS PWA standalone mode is a separate render path from browser Safari, with its own bfcache rules.** Three earlier patches (sessions 76 + attempt 1 + attempt 3 of session 77) all assumed browser-Safari-style bfcache events would fire in PWA. They don't. PWA's page-restoration model is more aggressive about preserving DOM state but doesn't reliably fire `pageshow`, `popstate`, or `visibilitychange`. **Tech Rule candidate (first firing): "When investigating mobile UX bugs, always ask: PWA standalone or browser Safari? They are different render paths."** Single firing.
- **5-attempt convergence pattern: kill the bug class, don't patch the layer.** Attempts 1–4 added complexity (event listeners, refs, useLayoutEffect, fractional-px mutations) and didn't work. Attempt 5 *removed* code (`position: fixed` + spacer instead of sticky + workarounds) and worked first try. Captured as new memory `feedback_kill_bug_class_after_3_patches.md`.
- **Cross-route framer-motion `layoutId` works in Next.js 14 App Router without explicit `<AnimatePresence>` plumbing.** This was my pre-test hypothesis; testbed confirmed it. Phase 5 rollout can use the simplest pattern. The `<MotionConfig reducedMotion="user">` wrapper at the layout level is sufficient.
- **The "wrong layer" misdiagnosis pattern.** Attempts 1 and 2 were both "wrong layer" fixes — 1 attacked browser bfcache, 2 attacked the React tree. Both look correct in isolation. The signal that it was the wrong layer: the bug persisted unchanged after the deploy. **Compounds with the kill-the-bug-class memory** as a diagnostic heuristic — when a fix lands cleanly but the bug doesn't budge, you patched something but it wasn't the bug.

**Operational follow-ups:**
- Archive-drift accounting: rotated session 76 to tombstone. Session 71 falls off the bottom of last-5 visible tombstones. Archive-drift backfill to session-archive.md (sessions 54 + 55 + 57–76) still on the operational backlog.
- **NEW operational backlog:** the 4 obsolete masthead-fix commits (361e1de + c968c1a + d429bbb) form a clear historical narrative when read sequentially. No squashing recommended — the audit trail of "5 attempts to fix one bug" is the lesson.

**Tech Rule candidates (this session):**

- "When investigating mobile UX bugs, always ask: PWA standalone or browser Safari? They are different render paths." — first firing (masthead bug breakthrough). Single firing. Tech Rule on second firing.
- "Smallest→largest commit sequencing" — second firing (session 70 first firing + session 77 marketplace-transitions mockup bundled into runtime fix `c968c1a`). **Now promotion-ready.**

**Notable artifacts shipped this session:**
- [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) + [`docs/mockups/marketplace-transitions-v1.html`](docs/mockups/marketplace-transitions-v1.html) — D1–D14 frozen, BoothPage shelf rail tiles parked v2.
- `app/transition-test/` (4 files) — durable cross-route layoutId testbed.
- [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) — refactored to position:fixed + spacer; removed useLayoutEffect, refs, event listeners, fractional-px reflow. Less code, structurally correct.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — single top-level return, masthead never remounts. `SoldLandingBody` extracted as body-only component sharing parent chrome.

---


## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–76 still missing — operational backlog growing). Session 71 fell off the bottom of last-5 visible tombstones at session 77 close.

- **Session 76** (2026-04-27) — 6-item redirect bundle: bug fix + green tokens + find-title centering + animation consistency. Seven runtime/docs commits + close. **Track A (`b5470da`):** /find/[id] masthead present in loading + !post branches (mirrors /shelf/[slug] pattern — addressed wrong layer; real fix landed session 77). **Track B (`d0c4ce3` + `fd1a874`):** Treehouse Finds wordmark, "Booth" eyebrow, booth numeral all `v1.green` across every applicable surface. **Track C (`a2cf548` + bundled in `fd1a874`):** Find-detail title centered + price 32px IM Fell twin below in priceInk; em-dash retired; Frame B picked. **Track E (`ecb8ef8` + `3832fc1`):** 5 motion tokens added to lib/tokens.ts (`MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION`); Booths VendorCard gains `whileTap: scale 0.97`; empty-state + card-entrance unified across 4 primary tabs. Track D (FB Marketplace shared-element transitions) carried to session 77 as its own session. ZERO new memories. `feedback_ask_which_state_first.md` 10th–13th firings. Same-session design-record-commit rule 11th + 12th firings. "Verify sub-agent claims that contradict known semantic rules" — second firing (now promotion-ready).
- **Session 75** (2026-04-27) — David approved feed seeding then redirected to a 7-item polish + system-rule bundle: admin login redirect, BoothHero lightbox, /vendor-request rewrite, booth-numeral font system swap. Six runtime/docs commits + close shipping all 7 end-to-end. **Track A (`60a7a11` admin redirect + `eef1746` BoothHero lightbox):** `pickDest(user)` helper in /login centralizes admin → `/`; transparent overlay at z-5 sandwiches between photo + pencil + post-it. **Track C (`d747b71` design-to-Ready + `01a6b44` feat):** `FONT_POSTIT_NUMERAL` → `FONT_NUMERAL` (Times New Roman) across 7 surfaces; project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL" frozen; build-error caught the 7th surface (PhotographPreview). **Track B (`a427ee7` design-to-Ready + `fbbba21` feat):** /vendor-request one-screen redesign with owner-ack checkbox gate, hard-required Mall+Booth#, FONT_SYS photo copy, intro paragraph dropped + migration 013 (HITL paste pending). ZERO new memories. ZERO new Tech Rule promotions; four single-firing candidates.
- **Session 74** (2026-04-27) — Gemba walk follow-up at America's Antique Mall surfaced 7 items; six beats, four runtime/docs commits + close shipping all 7 end-to-end. **Polish quartet (`30b9922`):** AddBoothInline alphanumeric `booth_number`, /post/preview FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped. **Item 4 (`d52b149`):** /post/preview's three router.push call sites preserve `?vendor=<id>` through publish flow. **Booth management (`6d32c9c` design-to-Ready + `c5437df` feat):** D1–D7 frozen for Edit + Add sheets (Pencil bubble repurpose, slug auto-update, no `user_id` safety gate, mall-change conflict path, no hero in Edit, Add tile tail position, hero retained for mall-walk capture). 4 new components (BoothFormFields, EditBoothSheet, AddBoothSheet, AddBoothTile) + PATCH `/api/admin/vendors` with BOOTH_CONFLICT 409. Third oscillation of AddBoothInline-on-/shelves (sessions 37 + 67 retired; 74 restored intentionally per demo-authenticity reasoning). Optimistic `setVendors` on success — no full reload. Same-session design-record-commit rule 8th firing. ZERO new memories. ZERO new Tech Rule firings; one single-firing candidate ("audit existing affordances for semantic drift").
- **Session 73** (2026-04-27) — R3 closed end-to-end in a single-track session. Eight runtime/docs commits + close resolving both halves of the analytics arc. **Write side:** 5 new event types via migration 012 (`booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped`) + `filter_applied` `page` field on Home/Booths/Find Map for per-tab attribution. Closes 4 deferred carries (sessions 59 + 62 + 67 + 68). Decisions D1–D4 frozen in design record §Amendment v1.1. **Read side:** parked-since-session-58 admin Events stale-data mystery resolved at root — Next.js HTTP-level data cache was intercepting `@supabase/supabase-js`'s internal `fetch()` calls; `force-dynamic` only disables route-response caching, doesn't propagate `cache: "no-store"` to inner fetches; two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) via `global.fetch` wrapper benefits every admin route + every `recordEvent` call. Diagnosed in one session via side-by-side probe pattern (built `/api/admin/events-raw` parked since session 60 + inline diag strip in admin Events tab → smoking-gun diff appeared on first reading, 78-min stale snapshot vs fresh raw). **Strategic conversation:** David flagged in-app admin tab is wrong shape for analytics long-term → Q-014 queued (Metabase + read-only Postgres role + 3 starter dashboards + retire admin tab post-Metabase). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until Q-014 lands. Polish: chip wiring for v1.1 types (Bookmarks primary; Find shares + Tag flow overflow). ONE new memory (`feedback_side_by_side_probe_for_divergence.md`). ONE new Tech Rule candidate (TR-q: `force-dynamic` doesn't propagate `cache: "no-store"` to inner fetches; compounds with TR-l).
- **Session 72** (2026-04-26) — Small surgical session. One runtime commit (`27a0439`) rationalizing admin entry: BottomNav 4th slot for admins now carries a dedicated **Admin** tab (Lucide `Shield` 21px → `/admin`) replacing My Booth (admins have no booth assigned). Two redundant affordances retired in same commit: `/shelves` masthead `ADMIN` pill + green `Manage` eyebrow under each booth tile (Pencil + Trash bubbles already signal edit/delete intent). Vendor + Guest BottomNav layouts unchanged. ZERO new memories. ZERO new Tech Rule firings. Live discovery: "multi-affordance retirement → single-surface promotion" pattern echoed session 71's cartographic collapse on `/find/[id]` (parallel two cards → one inkWash card). Single-firing in admin context, single-firing in shopper context, watching for third instance.
---

## CURRENT ISSUE
> Last updated: 2026-04-27 (session 77 close — Track D phases 1–4 shipped end-to-end + masthead-disappears bug resolved at attempt 5 via position:fixed + spacer. David confirmed masthead fix on iPhone PWA: "We have a fix. Nice work." Track D phase 5 rollout queued for session 78.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (six runtime/docs commits, two parallel arcs):** **Masthead bug 5-attempt arc — finally fixed structurally (`166ed59`):** Sessions 76 + 77 attempts 1–4 all patched the wrong layer (React tree, browser bfcache, iOS PWA event listeners). Attempt 5 replaced `position: sticky` with `position: fixed` + layout spacer, eliminating the iOS PWA sticky-paint bug class entirely. Less code, structurally correct. **Track D phases 1–4 shipped (`d3ddffb` design record + `e601db5` testbed + bundled mockup in `c968c1a`):** D1–D14 frozen. Three thumbnail surfaces in scope (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). BoothPage shelf rail tiles pulled to v2. Testbed at `/transition-test` validated by David on iPhone. **`/find/[id]` unified return refactor (`c968c1a`):** Three top-level returns merged to one (loading / !post / sold-shopper / normal). Wrapper, masthead, BottomNav, PhotoLightbox stable across all transitions. Mirrors `/shelf/[slug]`'s pattern. **ONE new memory (`feedback_kill_bug_class_after_3_patches.md`).** "Smallest→largest commit sequencing" — second firing (now promotion-ready). "PWA standalone vs browser Safari is a different render path" — first firing. **Migration 013 ✅ ran by David this session.** **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md).

### 🚧 Recommended next session — Track D phase 5 surface rollout (~60–90 min)

Phase 4 testbed validated cross-route framer-motion `layoutId` works in Next.js 14 App Router without explicit `<AnimatePresence>` plumbing. Three real surfaces remain. Per [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) acceptance criteria:

1. **App-shell `<MotionConfig reducedMotion="user">`** as the first commit (one-line addition to [`app/layout.tsx`](app/layout.tsx) wrapping body content). Establishes the gate before any transition is wired.
2. **Surface 1 — feed → `/find/[id]`.** `<motion.div layoutId={`find-${post.id}`}>` on the feed tile photograph + the same `layoutId` on the detail page photograph. Tile layout reservations to prevent grid reflow during flight (position: relative on tile + position: absolute; inset: 0 on motion image).
3. **Surface 2 — `/shelves` → `/shelf/[slug]`.** Same pattern with `layoutId={`booth-${vendor.id}`}` on vendor hero photograph (booth-tile thumbnail to BoothHero).
4. **Surface 3 — `/flagged` → `/find/[id]`.** Find Map tile photograph to detail; `layoutId` matches surface 1.
5. **Validation per surface (forward + back + reduced-motion on iPhone PWA + browser Safari).**

**Out of scope for session 78:** BoothPage shelf rail tiles → `/find/[id]` (parked v2 per D4); same-route transitions (More from this shelf); sheet/modal entrance unification.

**Verify before starting:** that the `/transition-test` testbed still works on production after any new deploy. It's the canary for the layoutId mechanism.

### Alternative next moves (top 3)

1. **Feed content seeding** — long-deferred V1 unblocker, now **20× bumped** through sessions 55, 60–77. 10–15 real posts across 2–3 vendors. Migration 013 ✅ done; only the seeding walk remains. ~30–60 min. **Real content seeding makes Track D phase 5 testing more meaningful** — empty grids don't exercise the transition pattern realistically. Could batch with phase 5: seed first, then phase 5 rollout, then walk the rolled-out transitions on real content.
2. **E6 — extract `useScrollReveal` hook** (carried from session 76) — Booths / Find Map / /flagged need skip-entrance-on-restore parity with Home. ~30–60 min, size S-M. Decoupled from Track D.
3. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic next step on the analytics arc. More valuable AFTER feed seeding + Track D rollout land. If investor touchpoint imminent, prioritize.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 78 opener (pre-filled — Track D phase 5 surface rollout)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, docs/marketplace-transitions-design.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Track D phase 5 — surface rollout. Session 77 shipped phases 1–4: decisions D1–D14 frozen, mockup approved, design record committed (docs/marketplace-transitions-design.md), and /transition-test testbed validated on iPhone. Phase 5 rolls the FB Marketplace shared-element transition out to 3 real surfaces. ORDER (per design record acceptance criteria): (1) wrap app/layout.tsx body with <MotionConfig reducedMotion="user">; (2) feed → /find/[id] using layoutId={`find-${post.id}`} on the photograph (tile layout reservations: position:relative on tile + position:absolute;inset:0 on motion image); (3) /shelves → /shelf/[slug] with layoutId={`booth-${vendor.id}`} on the hero photograph; (4) /flagged → /find/[id] matching surface 1's layoutId. Validate forward + back + reduced-motion on iPhone PWA + browser Safari per surface before moving to next. OUT OF SCOPE: BoothPage shelf rail tiles (parked v2 per D4); same-route transitions; sheet/modal entrance unification. ALSO carry-forwards from session 77: position:fixed + spacer is now masthead's underlying primitive (no action needed, but worth knowing if iPhone QA on phase 5 surfaces it); /transition-test stays live as durable diagnostic; marketplace-transitions mockup got accidentally bundled into c968c1a (smallest→largest commit sequencing — promotion-ready Tech Rule); 4 obsolete masthead-fix commits (361e1de + c968c1a partial + d429bbb) preserved as audit trail of "5 attempts to fix one bug." ALTERNATIVE NEXT SESSIONS: (1) Feed content seeding — 20× bumped, V1 unblocker, ~30–60 min, would also make phase 5 testing more meaningful on real content; (2) E6 useScrollReveal hook extraction (S-M, decoupled); (3) Q-014 Metabase (more valuable post-seeding). Note: /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. /finds (dark reseller layer "My Picks") out of scope for marketplace transitions per layer-separation rule. /transition-test should stay live on production indefinitely as a layoutId regression canary.
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
- **Track D phases 1–4** ✅ — **shipped session 77** across `c968c1a` (mockup bundled), `d3ddffb` (design record), `e601db5` (testbed). D1–D14 frozen. Three thumbnail surfaces in scope. Phase 5 rollout queued for session 78. **NEW: position:fixed + spacer is masthead's underlying primitive** — `MASTHEAD_HEIGHT` const in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) is single source of truth. **NEW: `/transition-test` is durable diagnostic infrastructure** — keep live for layoutId regressions.
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
- **Feed content seeding** — rolled forward from sessions 55–76, **77**. 10–15 real posts across 2–3 vendors. **Now 20× bumped**. Sessions 61–77 each strengthened the case; session 77 shipped Track D phases 1–4 + masthead fix but real content remains the actual unblocker. **Migration 013 ✅ done this session** so the seeding walk has no remaining blockers.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 23+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready** (session 76 2nd firing), **"smallest→largest commit sequencing" 🟢 promotion-ready** (session 70 1st + session 77 2nd — Track D mockup bundled into runtime fix `c968c1a`). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it"). Session 70 surfaced "smallest→largest commit sequencing" + "italic-ascender 1px lift". Session 71 surfaced "verify sub-agent claims" (now 2nd-fired) + "screenshot before scoping multi-change visual fixes". Session 73 surfaced **TR-q** ("`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches"). Session 74 surfaced "audit existing affordances for semantic drift". Session 75 surfaced four single-firings ("audit existing affordances" 2nd firing — BoothHero z-index, "long-form helper copy on paper-wash → sans", "narrow-named tokens audited for generalization", "trust the build"). Session 76 surfaced three single-firings + 1 second-firing ("Detail-page render branches must render base chrome", "Default to stacked over inline for title + secondary value patterns", "Audit invariants against sibling pages"). **Session 77** surfaced ONE new single-firing: "When investigating mobile UX bugs, always ask: PWA standalone or browser Safari? They are different render paths" (1st firing, masthead breakthrough). And the kill-the-bug-class memory (`feedback_kill_bug_class_after_3_patches.md`). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
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
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, **NEW: reap dormant showPlaceholders prop infrastructure in BoothPage.tsx**. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 was a small surgical session rationalizing admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap with booth Add/Edit sheets + PATCH endpoint; session 75 closed a 7-item David-redirect bundle end-to-end; session 76 closed five of six David-redirect items end-to-end. **Session 77 was a two-arc session**: Track D phases 1–4 shipped (decisions D1–D14 frozen for FB Marketplace shared-element transitions, design record committed, `/transition-test` testbed validated on iPhone) AND a 5-attempt arc on the iOS PWA masthead-disappears bug ending in `position: fixed` + spacer (kills the sticky-paint bug class entirely; David confirmed first try on attempt 5). Phase 5 surface rollout (3 thumbnail surfaces) queued for session 78. Feed content seeding still pending, now **20× bumped** — twenty sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup + image-stabilization + admin-chrome rationalization + R3-closure + booth-management + vendor-request-redesign + numeral-font-system + green-token-unification + animation-token-centralization + masthead-primitive-replacement + Track-D-readiness. **Next natural investor-update trigger point** is now after Track D phase 5 surface rollout + feed content seeding land — the update would report twenty+ shipped capability items plus session 77 demonstrating "kill the bug class" as a debugging primitive (5-attempt arc → structural fix in fewer LOC than any of the patches). Q-014 (Metabase) remains the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."

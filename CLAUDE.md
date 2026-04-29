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

## ✅ Session 85 (2026-04-29) — Phase 3 scroll-restore re-attempt: 2-of-3 surfaces shipped end-to-end; /my-shelf admin path remains broken after 6 rounds of speculative patching, captured as carry-forward + Safari Web Inspector setup as session 86 priority (10 runtime commits + close)

A direct re-attempt of session 79's primary user ask (5-session carry-forward) per session 84's recommendation. Strict scope per the lesson learned: scroll behavior + module-cache only, NO motion.div / layoutId changes. Two of the three target surfaces shipped end-to-end and confirmed via iPhone QA. /my-shelf admin path is the third surface and the one this session burned the most time on without resolving. **Smallest→largest commit sequencing's 9th clean firing on the initial 3-commit run.**

**Arc 1 — Phase 3 strict-scope deploy (3 commits, smallest→largest).** Read commits `71a0555` + `51067b7` from session 79's git history first to understand the original Phase 3 implementation that was reverted in `a9dc1bd`. The primitive: module-scope post cache (survives App Router unmount on SPA back-nav) + sessionStorage scroll key (persists scroll position) + `requestAnimationFrame` scroll restore on mount. Same pattern home (`app/page.tsx`) already had. Applied to:

- `6339f0f` /flagged — single un-keyed cache (simplest). 56 LOC.
- `3966ac8` /my-shelf — vendorId-keyed cache + background refresh on cache hit. 63 LOC.
- `c723792` /shelf/[slug] — slug-keyed cache + co-hydration of vendor + posts + mall. 64 LOC.

Sequencing was load-bearing throughout: each commit independently usable; if /shelf/[slug] regressed, the other two would still ship. Build clean, pushed, on Vercel preview within 60s.

**Arc 2 — iPhone QA round 1, two of three pass.** David tested on iPhone via Vercel preview. ✅ /flagged anchor + no skeleton flash. ✅ /shelf/[slug] anchor for logged-out user. ✅ Track D morph regression canary intact. ✅ /transition-test testbed regression intact. ❌ "/shelf/[slug] anchor" failed when logged in as admin via /shelves Booths tab.

Initial misread: I thought admin /shelves → tile route went to /shelf/[slug]. Correct read after grep on [app/shelves/page.tsx:117](app/shelves/page.tsx:117): admin gets `router.push(/my-shelf?vendor=<id>)`, not /shelf/[slug]. So the failing surface is actually **/my-shelf** (admin impersonation path), not /shelf/[slug]. Phase 3 status was 2-of-3 surfaces working, not the 1-of-3 it first looked like. David also surfaced an out-of-scope finding: `/find/[id]` → "More from this booth" → peer `/find/[id]` → back loses both the flag glyph and the horizontal carousel scroll position. Genuinely separate from Phase 3 scope (peer detail-page navigation, no shared scroll-restore primitive applies). Captured as a follow-up.

**Arc 3 — /my-shelf scroll-restore arc, 6 rounds without resolution.** This was the dominant time sink of the session. Each round shipped a new theory and patch; each round failed iPhone QA:

- `2e9bae1` Round 1 — retry rAF until window.scrollY ≈ targetY (capped 500ms). Theory: layout settles after my single rAF fires. Result: still anchors at top.
- `d633240` Round 2 — comprehensive: disable browser scrollRestoration to "manual", gate save listener on `scrollRestored.current` to suppress reflow events, scrollHeight check, useLayoutEffect, retry budget 3s. Theory: multiple async gates + browser/Next.js fighting our restore. Result: still anchors at top.
- `5e64b7a` Round 3 — added admin back button + visible diagnostic pill (top-right, 8 fields) AND noticed admin /shelves → /my-shelf had no back button; shipped that as a real win. **Diagnostic gave us our first real data: `status: no-target`, `saved: —`.** Read failed because storage was empty.
- `771206c` Round 4 — removed save-listener gate that blocked first-visit saves (chicken-and-egg bug I introduced in round 2 — required `scrollRestored=true` for save, which required prior restore, which required prior save). Result: mixed — sometimes anchors, sometimes shows `no-target` still.
- `4dced72` Round 5 — multi-event save: scroll + click capture + touchend + visibilitychange + pagehide. Theory: iOS Safari de-prioritizes scroll events during transitions; one of these will reliably fire. Result: still mixed, `saved: —` intermittent.
- `3253ef6` Round 6 — BFCache handler via `pageshow` with `persisted=true`. Theory: iOS BFCache restores the page without re-running effects, so mount-time read never refreshes. Result: David's diagnostic showed `bfcache: 0` — BFCache isn't even firing, theory invalidated.
- `1c5e37a` Round 7 — final tactical swing: localStorage + sessionStorage dual-write (iOS persists localStorage more aggressively), `popstate` listener (catches back-nav even when Next.js App Router keeps page cached without unmount), `useSearchParams` reactivity (catches URL transitions even without remount). Theory: Next.js client-side cache. Result: David's diagnostic showed `bfc/pop/url: 0/0/1` (just the initial mount fired, no popstate, no BFCache) AND `saved: —`. **The page IS remounting cleanly on back-nav, but storage is still empty after admin scrolls + taps. Genuinely past the limit of speculative debugging without device-level visibility.**

**The diagnostic was load-bearing in two specific ways but missed the actual layer.** It correctly fingered the bug as "saved storage is empty on back-nav" in one round (status=no-target, saved=—) and forced us to stop iterating on restore-side timing fixes. But it couldn't reach below React/state into iOS Safari's actual storage lifecycle. Multiple plausible theories (BFCache, router cache, localStorage divergence, scroll-event suppression) each fit the symptom at one layer of abstraction; none patched at the right layer. The right tool for this layer is **Safari Web Inspector connected via USB cable** — real-time console, network, storage panel showing actual contents, breakpoints. We don't have that set up yet. **`feedback_kill_bug_class_after_3_patches.md` should have fired louder at round 5 or 6** — speculative patching continued past the diagnostic landing, even though we had visible evidence we weren't reaching the right layer.

**Decision: defer /my-shelf to a focused session 86 with Web Inspector connected.** David: *"What I'd like to get to is where we don't have to run down these rabbit holes when bugs occur. I'll leave it up to you to identify the right approach but once this launches everything downstream becomes 10x more impactful and opens up more risk."* The session 86 plan: 5 minutes connecting iPhone via USB and enabling Web Inspector, then watching Storage panel + console during scroll → tap → back cycle. Should resolve in minutes, not rounds.

**Final state in production (as of `1c5e37a` runtime + close commit):**

- ✅ /flagged scroll-restore working (confirmed iPhone QA).
- ✅ /shelf/[slug] scroll-restore working for guests (confirmed iPhone QA).
- ✅ Admin back button on /my-shelf?vendor=<id> shipped as real independent win — admin tap from /shelves now has a way to return to /shelves without bottom-nav.
- ❌ /my-shelf admin path scroll-restore broken; structural code in place (dual-write storage, popstate handler, useSearchParams reactivity, runRestore retry loop, diagnostic gated behind `?debug=1`).
- 🟢 No regressions to Track D shared-element transitions (feed → /find/[id], /flagged → /find/[id]).
- 🟢 /transition-test testbed canary still passes.
- 🟡 /find/[id] peer-nav flag glyph + horizontal carousel scroll loss — out-of-scope follow-up captured.

**Commits this session (10 runtime + close):**

| Commit | Message |
|---|---|
| `6339f0f` | feat(scroll-restore): /flagged back-nav anchoring (Phase 3 re-attempt) |
| `3966ac8` | feat(scroll-restore): /my-shelf back-nav anchoring + vendorId-keyed post cache |
| `c723792` | feat(scroll-restore): /shelf/[slug] back-nav anchoring + slug-keyed cache |
| `2e9bae1` | fix(scroll-restore): /my-shelf retry scrollTo until layout settles |
| `d633240` | fix(scroll-restore): /my-shelf comprehensive timing + browser cooperation |
| `5e64b7a` | fix(/my-shelf): admin back button + TEMP scroll-restore diagnostic |
| `771206c` | fix(/my-shelf): remove save-listener gate that blocked first-visit saves |
| `4dced72` | fix(/my-shelf): multi-event save for unreliable iOS scroll events |
| `3253ef6` | fix(/my-shelf): handle iOS Safari BFCache restore for scroll-restore |
| `1c5e37a` | fix(/my-shelf): localStorage + popstate + URL-change re-read paths |
| (session close) | docs: session 85 close — Phase 3 2-of-3 + /my-shelf carry-forward + ios-safari-web-inspector setup |

**What's broken / carried (delta from session 84):**

- 🔴 NEW: **/my-shelf admin-path scroll-restore broken** (sessions 79 + 85 attempts). Structural code in place; needs Safari Web Inspector via USB cable for next session. Recommended session 86.
- 🟡 NEW: **/find/[id] peer-nav flag glyph + horizontal carousel scroll loss** (out-of-scope from Phase 3, real bug, separable session).
- 🟢 RESOLVED: Phase 3 scroll-restore on /flagged + /shelf/[slug] (sessions 79–84 carry-forward). Feed already had it; now matches across surfaces.
- 🟢 RESOLVED: Admin back button on /my-shelf?vendor=<id> when via /shelves (was no back button before).
- 🟡 NEW PRIMARY: **Safari Web Inspector via USB cable not yet set up.** Memory entry [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) captures setup steps + when-to-use criteria. **5-minute one-time setup; should be session 86 first task.**
- 🟡 Carry: Diagnostic pill in /my-shelf gated behind `?debug=1` query param — invisible in normal usage, surfaceable by appending `&debug=1` to the URL for next session's investigation.
- 🟡 All session 78–84 carry-forwards still hold unless explicitly resolved above.

**Memory updates:**

- Updated [`feedback_visibility_tools_first.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_visibility_tools_first.md) — 2nd firing with extension rule "match the visibility tool to the bug's layer." On-screen diagnostics work for React-state and DB-layer bugs; they don't reach below React into browser/iOS lifecycle. Right layer for iOS-specific bugs is Web Inspector via USB.
- NEW [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) — project-specific setup for Treehouse Finds (PWA-heavy product). Captures one-time setup steps + when-to-use criteria + carry-forward to /my-shelf scroll-restore investigation.

**Existing memories that load-bore the session:**

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 10 runtime commits + close ✅.
- `feedback_kill_bug_class_after_3_patches.md` — fired implicitly at round 3 of /my-shelf (the visible diagnostic was the structural shift, not another patch). **Should have fired more loudly at round 5 or 6** when speculative patching continued past the diagnostic landing.
- `feedback_visibility_tools_first.md` — fired at round 3 (visible diagnostic shipped). **2nd clean firing.**
- "Smallest→largest commit sequencing" — **9th clean firing.** /flagged → /my-shelf → /shelf/[slug] (56 → 63 → 64 LOC). Rest of the session was patches to /my-shelf which don't follow the same axis. **Promotion severely overdue.**

**Live discoveries (single firings, Tech Rule candidates):**

- **"Match the visibility tool to the bug's layer"** — captured as session-85 extension to existing memory. On-screen diagnostic correctly fingered "saved is empty" but couldn't reach below React. Tech Rule candidate on second firing.
- **"Cap speculative patching at 3 rounds even with diagnostic, then escalate to device-level visibility"** — first firing as a meta-rule. We had a diagnostic by round 3 but kept iterating speculatively for 3 more rounds.
- **"Storage-layer bugs on iOS PWA are below the on-screen-diagnostic ceiling"** — first firing as a class-of-bug observation. Generalized: any bug whose root cause is in browser/OS lifecycle (BFCache, ITP, PWA install, popstate, etc.) needs a tool that can see *into* those layers.

**Operational follow-ups:**

- **NEW PRIMARY: Safari Web Inspector setup** — 5 minutes one-time. Settings → Safari → Advanced → Web Inspector ON; Mac Safari → Develop → [iPhone]. **Recommended session 86 first task.**
- **NEW: /my-shelf admin-path scroll-restore** — actual debug session with Web Inspector connected. Storage panel + console + breakpoints during scroll → tap → back cycle. Should resolve quickly with proper visibility.
- **NEW: /find/[id] peer-nav fix** — flag glyph + horizontal carousel preservation; ~30 min standalone session.
- **Promote Tech Rule batch (severely overdue)** — smallest→largest now **9 firings** (multi-session load-bearing), structural-mockup-axes 4, mid-session-iPhone-QA 3, Lora-lineHeight-1.4-minimum 2, recurring-phrase-signals-system 2, plus session 84's 4 single-firings + session 85's 3 single-firings. ~30 min ops pass.
- All session 78–84 carry-forwards still hold.

**Notable artifacts shipped this session:**

- [`app/flagged/page.tsx`](app/flagged/page.tsx) — Phase 3 scroll-restore primitive applied (working).
- [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx) — Phase 3 scroll-restore primitive applied (working for guests).
- [`app/my-shelf/page.tsx`](app/my-shelf/page.tsx) — Phase 3 attempt + 6 rounds of patches + admin back button + diagnostic infrastructure gated behind `?debug=1`. Structural code in place; bug remains.
- Memory: added `reference_ios_safari_web_inspector.md` + extended `feedback_visibility_tools_first.md` with 2nd firing + layer-matching extension.

---

## ✅ Session 84 (2026-04-29) — Security audit infrastructure shipped + `rls_disabled_in_public` exposure closed end-to-end across both Supabase projects (rotated to tombstone session 85 close)

> Full block rotated out at session 85 close. Net: 3 runtime commits — closed `rls_disabled_in_public` Security Advisor finding on `site_settings` + `events` for both Supabase projects via migration 014 (RLS on with policies); built reusable security audit infrastructure: 3 diagnostic scripts under [`scripts/security-audit/`](scripts/security-audit/) + `audit_rls_state()` SECURITY DEFINER RPC (migration 015) + [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) defining cadence + procedure + known gaps. Smallest→largest commit sequencing's 8th clean firing. David confirmed Security Advisor "Security" tab clean post-paste. **NOTE: at session 85 close, audit gap follow-ups (function search_path, role grants, auth.users exposure, OTP/password policy, per-route auth audit) still parked in [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md). Staging missing `events` table + Storage buckets — infrastructure divergence, not security.**

_(Session 84 detailed beat narrative removed at session 85 close — see [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) + the audit scripts for load-bearing decisions.)_

---


## ✅ Session 83 (2026-04-28) — Postcard PoC reverted + Polaroid evolved tile direction shipped end-to-end across 4 surfaces (10 runtime commits + 2 V1 mockups + multi-cycle iPhone QA via Vercel previews in-session, rotated to tombstone session 84 close)

> Full block rotated out at session 84 close. Net: 10 runtime commits — Postcard PoC (paper.png texture overlay on Home) explored across 3 iterations + reverted in full ("texture reads as dust on screen"); Polaroid evolved tile pattern shipped end-to-end across 4 surfaces (Home MasonryTile + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile) — warm cream paper `#faf2e0`, 4px radius, 7px photo mat, dimensional dual-shadow; tile title+price as same-size centered Lora 14px group (matches /find/[id] hero pattern at scale); /find/[id] More-from-shelf strip got centering treatment WITHOUT polaroid wrapper per "browse vs navigate" rule; tile descender clearance lineHeight 1.4 (2nd firing of session 82's vendor-name fix). ONE new memory: [`feedback_revert_to_clean_baseline_before_pivot.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_revert_to_clean_baseline_before_pivot.md). Smallest→largest commit sequencing 7th clean firing. THREE new single-firings: browse-vs-navigate-material-chrome rule + match-primary-page-typographic-pattern + lock-fixed-height-for-row-consistency.

_(Session 83 detailed beat narrative removed at session 84 close — see V1 mockup files + the revert-before-pivot memory file for load-bearing decisions.)_

---

## ✅ Session 82 (2026-04-28) — Massive design-system consolidation: project-wide IM Fell → Lora replacement + form-label primitive sweep + BoothLockupCard extraction (rotated to tombstone session 83 close)

> Full block rotated out at session 83 close. Net: 10 runtime commits + V1/V2 typography mockups across two arcs. **Arc 1 (typography)**: project-wide `FONT_IM_FELL → FONT_LORA` sweep across 29 files (IM Fell completely retired); Option C label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across 5 form surfaces; /vendor-request retitled "Set up your digital booth" + permission/value intro paragraph + booth # optional + Mall → Location. **Arc 2 (booth lockup)**: extracted shared [`<BoothLockupCard>`](components/BoothLockupCard.tsx) component (v1.postit bg + inline lockup matching /find/[id] cartographic), applied to /shelves + /flagged; bookmark filter count fix on /shelves; descender clip fix lineHeight 1.25→1.4 on vendor names. ONE new memory (`feedback_recurring_phrase_signals_system.md`). Smallest→largest commit sequencing 6th clean firing. **NOTE: at session 83 close, IM Fell inline comments scattered ~20 places + new "More from this shelf" comments on /find/[id] — documentation rot, opportunistic cleanup over future sessions.**

_(Session 82 detailed beat narrative removed at session 83 close — see V1/V2 typography mockup files + the recurring-phrase memory file for load-bearing decisions.)_

---


## ✅ Session 81 (2026-04-28) — Demo-prep refinement bundle (9 runtime commits) + V1/V2 mockups + end-to-end iPhone QA (rotated to tombstone session 82 close)

> Full block rotated out at session 82 close. Net: 9 runtime commits — nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85 across 5 surfaces; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg matched to post-it. ONE new memory: `feedback_visual_reference_enumerate_candidates.md`. Smallest→largest commit sequencing 5th clean firing — fully load-bearing. **NOTE: at session 82 close, the A3 dashed-fill-lift booth lockup card was retired in favor of the BoothLockupCard shared primitive (no dashed border, v1.postit bg, inline lockup matching /find/[id] cartographic). Session 81's "Mall → Location" copy scrub on /vendor-request was also fixed at session 82 close (the form was missed in the 13-file scrub).**

_(Session 81 detailed beat narrative removed at session 82 close — see the V1/V2 mockup files for load-bearing decisions.)_

---


## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–84 still missing — operational backlog growing). Session 78 fell off the bottom of last-5 visible tombstones at session 84 close; session 80 mini-block rotated off the visible list at session 85 close (still in this tombstones list as one-line entry).

- **Session 84** (2026-04-29) — First pure-security session since R12 Sentry (session 65). Triggered by Supabase Security Advisor `rls_disabled_in_public` email on `site_settings` + `events`. Closed exposure end-to-end across both Supabase projects via migration 014 (RLS on with policies matching existing access intent: site_settings public-read SELECT, events default-deny + service-role-only). Built reusable security audit infrastructure: 3 diagnostic scripts under [`scripts/security-audit/`](scripts/security-audit/) (inspect-rls + inspect-storage-acls + inspect-keys) + `audit_rls_state()` SECURITY DEFINER RPC (migration 015) + [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) defining cadence + procedure + known gaps (function search_path, role grants, auth.users exposure, OTP/password policy, per-route auth audit — all unbuilt, parked). 3 runtime commits, smallest→largest 8th clean firing — promotion-ready and overdue. David confirmed Security Advisor "Security" tab clean post-paste. **NOTE: at session 85 close, audit gap follow-ups still parked in the runbook; staging missing `events` table + Storage buckets — infrastructure divergence, not security.**
- **Session 83** (2026-04-28) — Postcard PoC explored + reverted (texture read as dust); pivoted to Polaroid evolved tile pattern shipped end-to-end across 4 surfaces (Home MasonryTile + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile): warm cream `#faf2e0` paper, 4px radius, 7px photo mat, dimensional dual-shadow; tile title+price as same-size centered Lora 14px group (matches /find/[id] hero pattern at scale); /find/[id] More-from-shelf strip got centering treatment WITHOUT polaroid wrapper per "browse vs navigate" rule + section eyebrow renamed "shelf" → "booth"; tile descender clearance lineHeight 1.4 (2nd firing of session 82's vendor-name fix). 10 runtime commits + 2 V1 mockups + 6+ in-session iPhone QA cycles. ONE new memory (`feedback_revert_to_clean_baseline_before_pivot.md`). Smallest→largest commit sequencing 7th clean firing. Three new single-firings: browse-vs-navigate-material-chrome rule + match-primary-page-typographic-pattern + lock-fixed-height-for-row-consistency. **NOTE: at session 84 close, paper.png remains in /public (2.7MB cleanup candidate); 3 inline "More from this shelf" comments on /find/[id] stay as documentation-rot cleanup; three near-identical polaroid wrappers across FindTile/WindowTile/ShelfTile/ShelfCard pending shared-primitive extraction trigger.**
- **Session 82** (2026-04-28) — Massive design-system consolidation: project-wide IM Fell → Lora replacement (29-file sweep, IM Fell completely retired from the codebase via `next/font/google` + `FONT_LORA` token) + Option C form-label primitive across 5 form surfaces (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) + BoothLockupCard shared primitive extracted ([`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx)) and applied to /shelves + /flagged + /vendor-request retitled "Set up your digital booth" with permission/value intro paragraph + booth # optional + Mall → Location everywhere user-facing + bookmark filter count fix on /shelves + descender clip fix lineHeight 1.25 → 1.4 on Lora vendor names. 10 runtime commits + V1/V2 typography mockups + 4 in-session iPhone QA cycles. ONE new memory (`feedback_recurring_phrase_signals_system.md`). Smallest→largest commit sequencing 6th clean firing — load-bearing. Feed content seeding LANDED pre-session 82 (15 posts / 2 locations / 3 vendors). **NOTE: at session 83 close, IM Fell inline comments still scattered ~20 places — documentation rot, opportunistic cleanup over future sessions.**
- **Session 81** (2026-04-28) — Demo-prep refinement bundle (9 runtime commits + V1/V2 mockups, end-to-end iPhone QA via Vercel previews in-session). Items: nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85 across 5 surfaces; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg matched to post-it. ONE new memory (`feedback_visual_reference_enumerate_candidates.md`). Smallest→largest commit sequencing 5th clean firing — fully load-bearing across the David-redirect-bundle workflow. Two test booths deleted from production via Supabase dashboard SQL (HITL). **NOTE: at session 82 close, the A3 dashed-fill-lift booth lockup card was retired in favor of the BoothLockupCard shared primitive (no dashed border, v1.postit bg, inline lockup matching /find/[id] cartographic).** Session 81's "Mall → Location" scrub on /vendor-request was also fixed at session 82 close (form was missed in the 13-file scrub).
- **Session 80** (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (7 runtime commits). Items: nav rename Find Map → Flagged; "curated shelf" → "curated booth" eyebrow; wordmark TNR upright ink-black 18px on every screen; bookmark relocated from `/shelf/[slug]` masthead → BoothHero photo corner (verbal model: "flag a find / bookmark a booth, both on the corner of the entity you're saving"); Booths Option C2 row pattern (photo retired from `/shelves` directory; bookmark on far-left of row; `/shelves` becomes navigation-led not browse-led); MallScopeHeader entrance animation parity across primary tabs; `/find/[id]` vendor/mall gap tightened. Two design records committed in same session per the rule: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7 + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. ONE new memory (`feedback_mockup_options_span_structural_axes.md`). Smallest→largest commit sequencing 4th clean firing (now load-bearing). Track D phase 5 source layoutId retired on `/shelves` alongside the photo (graceful-no-op morph carries forward); two surfaces still live (feed → /find/[id], /flagged → /find/[id]). `BookmarkBoothBubble` gained "hero" size variant (36×36 frosted, 18px glyph). Three new single-firings: D8 admin chrome inline-icons, mockup-options-structural-axes, wordmark brand-mark-vs-body-copy audit pattern.
_(Session 79 + 78 mini-blocks rotated off visible tombstones list at session 85 close. Session 79 was the original Track D + scroll-restore attempt that fully reverted in `a9dc1bd`; session 85 successfully re-attempted the scroll-restore portion on 2-of-3 surfaces. Session 78 was the original Track D shared-element ship across feed → /find/[id] + /flagged → /find/[id] + /shelves → /shelf/[slug] surfaces.)_
---

## CURRENT ISSUE
> Last updated: 2026-04-29 (session 85 close — Phase 3 scroll-restore re-attempt: 2-of-3 surfaces shipped clean (/flagged + /shelf/[slug] guest path); /my-shelf admin path remains broken after 6 rounds of speculative patching; 10 runtime commits + close. Defer to session 86 with Safari Web Inspector via USB cable connected as the actual debug tool — captured as new memory `reference_ios_safari_web_inspector.md`.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change this session:** 10 runtime commits + close — Phase 3 scroll-restore primitive applied to 3 surfaces (worked on 2, broken on 1), admin back button shipped on /my-shelf, structural debugging infrastructure in place (dual-write storage, popstate handler, useSearchParams reactivity, retry loop, diagnostic gated behind `?debug=1`). **The new highest-priority operational follow-up is Safari Web Inspector via USB cable setup** — without device-level visibility we burn rounds on speculative patches; with it, iOS-Safari-specific bugs become tractable in minutes. 5-min one-time setup; should be session 86 first task before re-attempting /my-shelf.

### 🚧 Recommended next session — Set up Safari Web Inspector + close /my-shelf admin scroll-restore (~30–45 min)

Two-part session:

**Part A (5 min) — Safari Web Inspector setup:**
1. iPhone: Settings → Safari → Advanced → Web Inspector ON
2. Mac: Safari → Settings → Advanced → "Show features for web developers" ON
3. Connect iPhone via USB cable, trust device when prompted
4. On Mac: Safari → Develop → [iPhone name] → [tab] — Web Inspector opens
5. Verify Storage panel shows localStorage + sessionStorage keys + values, Console pipes through, Sources tab shows breakpoints

Memory entry [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) has full setup + when-to-use criteria.

**Part B (~25–40 min) — /my-shelf admin scroll-restore investigation:**
With Inspector connected, append `?debug=1` to /my-shelf URL to surface the diagnostic pill (already shipped). Then:
- Open Storage panel → localStorage + sessionStorage. Watch in real time during scroll → tap → back cycle.
- Console: `addEventListener("scroll", () => console.log("scroll", window.scrollY))` and similar for click + visibilitychange + popstate to see exactly which events fire and when.
- Sources tab: breakpoint inside `persistScroll()` and `rereadAndRestore()` to see if they're hit.

Whatever the inspector shows will narrow the bug to a specific layer — the structural code (dual-write, popstate, useSearchParams reactivity, retry loop) is already in place; this session is purely about *seeing* what's happening so we can fix at the right layer. Should resolve in minutes once visibility is established.

**Why now (over the alternatives):**
- /my-shelf admin scroll-restore is 6 sessions out (session 79 + session 85 attempts). Sessions can't keep continuing this arc.
- Web Inspector setup is 5-min one-time and unlocks every future iOS-specific bug investigation. ROI compounds.
- David's meta-direction: *"What I'd like to get to is where we don't have to run down these rabbit holes when bugs occur. I'll leave it up to you to identify the right approach but once this launches everything downstream becomes 10x more impactful and opens up more risk."* This is the structural fix to the rabbit-hole problem.
- 2-of-3 Phase 3 surfaces work cleanly — /flagged + /shelf/[slug]-for-guests both confirmed via iPhone QA. Closing the third gives full Phase 3 + frees the longest-standing carry-forward.

**Verify before starting:** the diagnostic pill at `/my-shelf?vendor=<id>&debug=1` still surfaces correctly on production (top-right, mono font, 8 fields). Phase 3 working surfaces (/flagged + /shelf/[slug] for guest) still anchor correctly. /transition-test testbed still passes (layoutId regression canary).

### Alternative next moves (top 3)

1. **/find/[id] peer-nav follow-up** (~30 min standalone). Real bug surfaced session 85 iPhone QA: `/find/[id]` → "More from this booth" → peer `/find/[id]` → back loses (a) the flag glyph on the returned find and (b) the horizontal carousel scroll position in the More-from-this-booth row. Genuinely separate from Phase 3 (peer detail-page navigation; no shared scroll-restore primitive applies). Probably bookmark-state hydration race + DOM-level horizontal scroll preservation. Smaller-scope than the /my-shelf investigation.
2. **Audit gap follow-ups (security continuation).** Runbook from session 84 flagged 5 unbuilt categories: function `search_path` mutability, role-grant drift, `auth.users` exposure, OTP/password policy, per-route `/api/*` auth audit. ~30–60 min standalone or ~2 hrs bundled. Strongly justified now that we're collecting real vendor data. The infrastructure is in place (audit scripts under `scripts/security-audit/`); each follow-up is a probe + migration + runbook update.
3. **Tech Rule promotion batch (severely overdue).** Smallest→largest commit sequencing now **9 firings** (multi-session load-bearing); structural-mockup-axes 4; mid-session-iPhone-QA 3; Lora-lineHeight-1.4-minimum 2; recurring-phrase-signals-system 2; plus 4 session-84 single-firings + 3 session-85 single-firings. ~30 min ops pass to land them in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md). Plus the new candidate "cap speculative patching at 3 rounds + escalate to device-level visibility" from session 85.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 86 opener (pre-filled — Web Inspector setup + /my-shelf scroll-restore close)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Two-part session. PART A (5 min): Set up Safari Web Inspector via USB cable per memory `reference_ios_safari_web_inspector.md`. iPhone Settings → Safari → Advanced → Web Inspector ON; Mac Safari → Settings → Advanced → "Show features for web developers" ON; connect iPhone via USB; verify Develop menu lists the iPhone and Web Inspector opens. PART B (~25–40 min): close /my-shelf admin-path back-nav scroll-restore. Background: Phase 3 scroll-restore re-attempted in session 85 — /flagged + /shelf/[slug] (guest) shipped clean; /my-shelf (admin via /shelves → /my-shelf?vendor=<id>) remains broken after 6 rounds of speculative patches. Structural code already in place ([app/my-shelf/page.tsx](app/my-shelf/page.tsx)): dual-write localStorage + sessionStorage, popstate handler, useSearchParams reactivity, retry-scrollTo loop, diagnostic gated behind `?debug=1`. With Web Inspector connected, append `&debug=1` to URL, watch Storage panel + Console during scroll → tap → back. Whatever inspector reveals points to the layer to fix. Should resolve in minutes once visibility is established. ALTERNATIVES IF /my-shelf DEFERRED: (1) /find/[id] peer-nav fix — flag glyph + horizontal carousel preservation when navigating /find/[id-A] → "More from this booth" → /find/[id-B] → back. ~30 min standalone. (2) Audit gap follow-ups — function search_path, role grants, auth.users exposure, OTP/password policy, per-route /api/* auth. ~30–60 min standalone or ~2 hrs bundled. (3) Tech Rule promotion batch — smallest→largest sequencing (9 firings, severely overdue), structural-mockup-axes (4), mid-session-iPhone-QA (3), Lora-lineHeight-1.4-minimum (2), recurring-phrase-signals-system (2), plus session-84 + session-85 single-firings + new "cap speculative patching at 3 rounds" candidate. ~30 min ops pass. CARRY-FORWARDS FROM SESSIONS 78–85: Phase 3 scroll-restore primitive (module-scope post cache + sessionStorage scroll key + rAF restore) lives on /flagged + /shelf/[slug] guest path + home; preview cache pattern (sessionStorage `treehouse_find_preview:${id}`) is reusable for shared-element work; framer-motion layoutId is a global namespace; testbed `/transition-test` should be USED for surface-extension work; Track D phase 5 source layoutId retired on /shelves session 80; wordmark on every masthead is TNR upright ink-black 18px (FONT_NUMERAL); /shelves is row pattern not grid; bookmark on BoothHero photo corner not in masthead; IM Fell COMPLETELY RETIRED (FONT_LORA token); BoothLockupCard shared primitive owns /shelves + /flagged; Polaroid evolved tile pattern owns Home + /flagged + /shelf/[slug] WindowTile + ShelfTile; Title+price on tiles is centered Lora 14px group, height locked 76 / 56; /find/[id] strip got centering WITHOUT polaroid per browse-vs-navigate rule. From session 84: RLS enabled on every public table (migrations 014+015), audit_rls_state() RPC live; security-audit infrastructure under scripts/security-audit/ + runbook. From session 85: Admin back button shipped on /my-shelf?vendor=<id>; Safari Web Inspector setup is the new institutional debugging primitive captured as memory file; /find/[id] peer-nav flag-glyph + horizontal carousel scroll loss is the new out-of-scope follow-up.
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
- **NEW (session 81): "Mid-session iPhone QA on Vercel preview shortens redirect cycle"** — first firing as a structural pattern (vs ship-then-QA-next-session). Compresses 2-session arc into one. **2nd firing session 82** — promotion-ready.
- **Item 1 (session 82) — booth # optional** ✅ — **resolved session 82** in `2af064d`. Client-side red-asterisk → `(optional)` badge + drop client validation + drop server-side `!booth_number?.trim()` validation. Server dedup query already handled null booth.
- **Item 2 (session 82) — Mall → Location on /vendor-request** ✅ — **resolved session 82** in `e924664`. Single label swap + validation error string. The form was missed in session 81's 13-file scrub.
- **Item 3 (session 82) — /vendor-request typography pass + system-wide IM Fell retirement + Option C label primitive across 5 form surfaces** ✅ — **resolved session 82** across 4 commits (`08bf5c4` Lora infra + `b444c5e` project-wide font sweep + `6d26df6` /vendor-request page changes + `e446c11` form-label primitive sweep). New title "Set up your digital booth" + permission/value intro paragraph. **IM Fell completely retired from the codebase** — Lora is the project-wide literary serif via `next/font/google` + `FONT_LORA` token. Option C label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across BoothFormFields + AddBoothInline + admin/login + post/preview Field. Photo dropzone + ack-card unified to Lora (was FONT_SYS). Mockup files: [`docs/mockups/vendor-request-typography-v1.html`](docs/mockups/vendor-request-typography-v1.html) + [`docs/mockups/vendor-request-typography-v2.html`](docs/mockups/vendor-request-typography-v2.html).
- **/shelves bookmark filter count bug (session 82)** ✅ — **resolved session 82** in `dfed189`. Chip rendered `bookmarkedIds.size` (global localStorage set) instead of `bookmarkedInScopeCount` (already computed at line 523). One-line fix.
- **/shelves rows without booth # are shorter + text cut off (session 82)** ✅ — **resolved session 82** in `f187165`. New BoothLockupCard primitive uses `min-height: 60` to keep rows uniform regardless of booth-number presence. Empty-state hides BOOTH eyebrow entirely (per Q1 = c); name claims full row width.
- **BoothLockupCard shared primitive extraction + applied to /shelves + /flagged (session 82)** ✅ — **shipped session 82** in [`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx) + `f187165` (apply to /shelves) + `bf8ac24` (apply to /flagged + booth bookmark wiring). Visual: v1.postit bg, 1px hairline, 10px radius, 12/14 padding, no shadow. /find/[id] cartographic card stays inline (intentional per David — *"no change to this component card"*) but visually identical. **Session 81's A3 dashed-fill-lift card is RETIRED** in favor of this shared primitive.
- **/flagged section header booth bookmark added (session 82)** ✅ — **resolved session 82** in `bf8ac24`. BoothGroup type gained `vendorId` field. State + handler mirror /shelves (boothBookmarkKey + R3 v1.1 booth_bookmarked / booth_unbookmarked events). Synced on mount + focus.
- **Descender clip on Lora vendor names (session 82)** ✅ — **resolved session 82** in `a045058`. lineHeight 1.25 → 1.4 across BoothLockupCard primitive AND /find/[id] inline (had the same bug, just hadn't been caught in QA because David's seed data lacked descender-heavy vendor names).
- **NEW (session 82): IM Fell inline comments are documentation rot.** ~20 references across 15 files ("italic IM Fell vocabulary," "matches IM Fell italic," etc.). Functional sweep was clean; comments lag. Opportunistic cleanup over future sessions.
- **NEW (session 82): Form-label sweep skipped non-`<label>`-tag form chrome** on AddFindSheet, post/preview body, setup page. Section headers in italic Lora may want similar Option C treatment if they fire as recurring readability concerns. Defer.
- **NEW (session 82): BoothLockupCard primitive could extend to /shelf/[slug] BoothHero** if David ever wants the post-it to match the card primitive. Currently intentionally NOT matched.
- **NEW (session 82): "Bug surfaced in extracted primitive AND inline copy of same primitive — fix both in same commit"** — first firing (descender clip in BoothLockupCard + /find/[id] inline simultaneously). Single firing.
- **NEW (session 82): "Per-context sizing on a swept primitive"** — first firing (Option C label at 15px on full pages, 13px on sheets — label sized relative to its input). Single firing.
- **NEW (session 82): "User-facing copy scrub: skip DB/API/event/type identifiers"** — **2nd firing.** Promotion-ready.
- **NEW (session 82): "V2 mockup as fill-refinement within a picked option"** — **2nd firing** (V1 = 3 label primitives within IM Fell / V2 = 3 fonts within picked Option C). Promotion-ready on a 3rd firing.
- **NEW (session 82): "We continue to run into this issue" / "Every time I see X" signals system-level concern** — first firing as a memory ([`feedback_recurring_phrase_signals_system.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_recurring_phrase_signals_system.md)). Pattern fired 2× in session 82 (typography + booth lockup). Memory captures the rule.
- **Postcard PoC reverted (session 83)** ✅ — explored postcard/paper visual language as session opener. V1 mockup (3 additive frames: texture / +frame / +stamp) → David picked Frame A → 3 implementation iterations on Home — David's verdict after iPhone QA: *"the background is subtly distracting as it almost feels like there is dust on the screen due to the texture."* Full revert (`c3d5528`) returned to session 82 close baseline. Mockup retained as exploration record. paper.png in /public retained (David-uploaded; cleanup candidate).
- **Polaroid evolved tile pattern (session 83)** ✅ — **shipped end-to-end across 4 surfaces.** Home MasonryTile (`55d9c77` + `2df6a78`) + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile (`6152511`). Warm cream paper `#faf2e0`, 4px radius, dimensional dual-shadow (`0 6px 14px 0.20` far + `0 1.5px 3px 0.10` close), 7px photo mat top/sides. Three near-identical wrappers — did NOT extract shared `<FindTile>` primitive (premature abstraction). If a fourth surface adopts polaroid OR all need to evolve in lockstep, refactor candidate.
- **Tile title+price centering treatment (session 83)** ✅ — `b8c8e67` David iPhone QA redirect. Title+price center-aligned horizontally, vertically grouped via flex column + justify-center + items-center within metadata block. Price `FONT_SYS 12 → FONT_LORA 14` matching title size — same-size-different-color pattern lifted from /find/[id] hero (Lora 32px both, only color differs between `inkPrimary` and `priceInk`). marginTop 3 → 4 for tighter "locked together" rhythm. Applied to FindTile + WindowTile + ShelfTile.
- **Tile metadata block height-locking (session 83)** ✅ — `e19e9fe` David iPhone QA redirect on /flagged. `minHeight: 76` → `height: 76` (locked) + bottom padding 11 → 4 to fit 2-line title + price worst case exactly (39.2 + 4 + 19.6 + 13 padding = 76). Heterogeneous title content (1-line vs 2-line) no longer breaks row consistency. Applied to FindTile + WindowTile + ShelfTile.
- **/find/[id] strip centering + "shelf" → "booth" rename (session 83)** ✅ — `b804ee6`. Centering format applied to ShelfCard metadata block (textAlign center, lineHeight 1.4, width 100%, flex column + justify-center + items-center, height locked at 56, bottom padding 11→4). **Did NOT** apply polaroid wrapper styling — kept inkWash + hairline + 6px radius + subtle shadow per "polaroid skips navigate/detail surfaces" rule. Section eyebrow rendered text "More from this shelf…" → "More from this booth…".
- **Tile title descender clearance (session 83)** ✅ — title lineHeight 1.2 → 1.4 across FindTile + WindowTile + ShelfTile + ShelfCard. **2nd firing of session 82's vendor-name fix** — Lora descenders extend ~5px below baseline; at 14px text + 1.2 lineHeight + overflow:hidden + WebkitLineClamp:2, descenders ('g', 'y', 'p') clipped on line 2.
- **NEW (session 83): paper.png in /public** — 2.7MB unused asset David uploaded for postcard PoC. Cleanup candidate; left in place per "don't presume to delete user-uploaded assets" instinct.
- **NEW (session 83): 3 inline "More from this shelf" code comments** in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) (lines 14, 31, 1224) — documentation rot. Same pattern as session 82's IM Fell comments. Opportunistic cleanup.
- **NEW (session 83): Three near-identical polaroid wrappers across FindTile + WindowTile + ShelfTile + ShelfCard** — shared `<FindTile>` primitive extraction trigger if a fourth surface adopts polaroid OR all need to evolve in lockstep. Don't extract until that trigger fires.
- **NEW (session 83): "Browse vs navigate/detail rule for material chrome"** — first firing as a system rule. Polaroid (heavy material chrome) belongs on browse/collect surfaces (Home, /flagged, /shelf/[slug] grid). Light card chrome stays on navigate/detail surfaces (/find/[id] strip). BoothPage post-it hero counts as "anchor" not "tile" — no polaroid there. Tech Rule candidate on second firing.
- **NEW (session 83): "Match a primary-page typographic pattern when extending visual identity to tiles"** — first firing. Lifted /find/[id]'s hero title+price treatment (Lora 32px both, same weight, marginTop 2, only color differs) to 14px tiles (same family, same weight, marginTop 4, only color differs). Brand-anchoring at scale. Tech Rule candidate.
- **NEW (session 83): "Lock fixed-height + reduce padding to fit worst case for row consistency"** — first firing for heterogeneous-content tiles (1-line vs 2-line titles). Tech Rule candidate.
- **NEW (session 83): "Lora needs lineHeight 1.4 minimum when overflow:hidden + ≤14px text + line-clamp"** — **2nd firing** (session 82 vendor names + session 83 tile titles). Promotion-ready as concrete typography rule.
- **NEW (session 83): "Revert to clean baseline before pivoting directions"** — captured as new memory ([`feedback_revert_to_clean_baseline_before_pivot.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_revert_to_clean_baseline_before_pivot.md)). Don't carry abandoned changes into a pivot.
- **Phase 3 scroll-restore on /flagged + /shelf/[slug] (guest path)** ✅ — **resolved session 85** in commits `6339f0f` + `c723792`. Module-scope post cache + sessionStorage scroll key + `requestAnimationFrame` restore. Same primitive home page already had. Confirmed via iPhone QA in-session.
- **Admin back button on /my-shelf?vendor=<id>** ✅ — **resolved session 85** in `5e64b7a`. Admin tap on /shelves now has a way to return to /shelves without bottom-nav. Conditional on `adminOverride` (URL has `?vendor=<id>`); vendor self-view unchanged.
- 🔴 **NEW (session 85): /my-shelf admin scroll-restore broken** — sessions 79 + 85 attempts. 6 rounds of speculative patches (timing → BFCache → router cache → dual-write storage → popstate → useSearchParams reactivity); none landed. Diagnostic pill (gated behind `?debug=1`) confirmed `bfc/pop/url: 0/0/1` + `saved: —` — page IS remounting cleanly but storage is empty after admin scrolls + taps. Root cause is below the on-screen-diagnostic ceiling — needs Safari Web Inspector via USB cable. Structural code already in place ([app/my-shelf/page.tsx](app/my-shelf/page.tsx)); next session investigates with proper visibility.
- 🟡 **NEW (session 85): Safari Web Inspector via USB cable not yet set up** — captured as new memory ([`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md)). 5-minute one-time setup; unlocks every future iOS-specific bug investigation. Recommended session 86 first task.
- 🟡 **NEW (session 85): /find/[id] peer-nav flag glyph + horizontal carousel scroll loss** — out-of-scope from Phase 3. Navigating /find/[id-A] → "More from this booth" → /find/[id-B] → back loses (a) the flag glyph on /find/[id-A] and (b) horizontal scroll position in the More-from-this-booth row. Probably bookmark-state hydration race + DOM-level horizontal scroll preservation. ~30 min standalone session.
- **NEW (session 85): "Match the visibility tool to the bug's layer"** — captured as 2nd-firing extension to [`feedback_visibility_tools_first.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_visibility_tools_first.md). On-screen diagnostics work for React-state and DB-layer bugs; they don't reach below React into browser/iOS lifecycle. Right tool for iOS-Safari-specific bugs is Web Inspector via USB. Tech Rule candidate on second firing.
- **NEW (session 85): "Cap speculative patching at 3 rounds even with diagnostic, then escalate to device-level visibility"** — first firing as a meta-rule. Had a diagnostic by round 3 but kept iterating speculatively for 3 more rounds. Tech Rule candidate.
- **NEW (session 85): "Storage-layer bugs on iOS PWA are below the on-screen-diagnostic ceiling"** — first firing as a class-of-bug observation. Generalized: any bug whose root cause is in browser/OS lifecycle (BFCache, ITP, PWA install, popstate, etc.) needs a tool that can see *into* those layers.
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
- **Feed content seeding** ✅ — **resolved pre-session 82** (David completed seeding before session 82 standup). 15 posts across 2 mall locations and 3 vendors. The 24× bumped item finally came off the queue. Real-content QA loop now possible.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch — badly overdue** — 30+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready**, **"smallest→largest commit sequencing" 🟢 promotion-ready and overdue** (sessions 70 1st + 77 2nd misfire + 78 1st clean + 80 2nd clean + 81 3rd clean + 82 6th clean + 83 7th clean — fully load-bearing across every David-redirect-bundle session), **`feedback_mockup_options_span_structural_axes.md` 🟢 promotion-ready** (sessions 80 + 81 + 82 + 83 — 4 firings), **"Mid-session iPhone QA on Vercel preview shortens redirect cycle" 🟢 promotion-ready** (sessions 81 + 82 + 83 — 3 firings), **"Lora needs lineHeight 1.4 minimum when overflow:hidden + ≤14px text + line-clamp" 🟢 promotion-ready** (session 82 BoothLockupCard vendor names + session 83 tile titles — 2 firings, concrete typography rule). **Session 83** surfaced THREE new single-firings: (1) "Browse vs navigate/detail rule for material chrome"; (2) "Match a primary-page typographic pattern when extending visual identity to tiles" (Lora-14px tile pattern lifted from /find/[id] 32px hero); (3) "Lock fixed-height + reduce padding to fit worst case for row consistency in heterogeneous-content tiles". Plus the new memory `feedback_revert_to_clean_baseline_before_pivot.md`. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle (9 runtime commits, V1 + V2 mockups). Session 82 closed the largest design-system consolidation pass since the v1.x layer was named (project-wide IM Fell → Lora; Option C form-label; BoothLockupCard). Session 83 closed the polaroid evolved tile direction end-to-end across 4 surfaces. Session 84 was the first pure-security session since R12 Sentry — closed `rls_disabled_in_public` exposure end-to-end + built reusable security audit infrastructure. **Session 85 closed Phase 3 scroll-restore on 2 of 3 surfaces (/flagged + /shelf/[slug] guest path) — the 5-session carry-forward came down by 2/3.** /my-shelf admin path remains broken after 6 rounds of speculative patching; defer to session 86 with Safari Web Inspector via USB cable connected — the new institutional debugging primitive captured as memory file [`reference_ios_safari_web_inspector.md`](file:///Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md). Smallest→largest commit sequencing now **9 firings**, severely promotion-overdue. **Next natural investor-update trigger point** is after /my-shelf scroll-restore closes + Q-014 Metabase analytics land — turns "data flowing + secure + UX-anchored" into "investor-ready dashboards on a vetted security posture with tile-level navigation polish."

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
| Queued sessions (scoped work sequenced behind something else) | `docs/queued-sessions.md` |
| Roadmap (Beta+) — epic-level captured items not yet scoped | `docs/roadmap-beta-plus.md` |

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

## 🟡 Session 58 (2026-04-25) — R3 design-to-Ready + implementation + extended QA loop with two unresolved display bugs

Eight commits on main (counting the close commit). Largest commit count of any single session, and the first time the design-to-Ready and implementation phases of a roadmap item ran in the same session. R3 is functionally shipped on prod — events table created, instrumentation captures all 8 v1 event types correctly, admin Events tab renders for most filters, diagnostic script + visibility tooling in place — but two display-layer bugs in the admin tab remain unresolved at session close. Beta invites still technically unblocked; R3 is Horizon 1 infrastructure, not a beta gate.

**Commits landed:**

1. `ba888b3` **docs(r3): design-to-Ready — analytics event capture** — three artifacts in one commit per the (session 56) Design Agent rule: full design record [`docs/r3-analytics-design.md`](docs/r3-analytics-design.md) with all six decisions D1–D6 frozen + Terminology subsection locking heart/save/bookmark/flagged → canonical event name `post_saved`/`post_unsaved`; mockup [`docs/mockups/r3-admin-analytics-v1.html`](docs/mockups/r3-admin-analytics-v1.html) (two phone frames — stream view + filtered/expanded view); R3 promoted 🟡 Captured → 🟢 Ready in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md). Second roadmap item to graduate after R4c.
2. `2839d28` **feat(r3): events table + capture + admin Events tab** — migration `010_events.sql` (event_type enum + events table + 3 indexes + jsonb payload), `lib/events.ts` server helper (`recordEvent`), `lib/clientEvents.ts` client helper (`track` with sessionStorage session_id), `POST /api/events` (60/min rate limit, validates client-allowable event types), `GET /api/admin/events` (paginated stream + counter strip + filter alias resolution for saves/views/shares), inline `recordEvent` calls in 4 existing handlers (share-booth, vendor-request, admin/vendor-requests, admin/malls), client instrumentation: `page_viewed` × 5 pages + `post_saved`/`post_unsaved` in `/find/[id]` `handleToggleSave` + `filter_applied` in `/page.tsx` `handleMallSelect`, admin Events tab as new 5th tab (icon-stacked layout shift, summary strip, filter chips with `+ more` overflow, day-grouped list, expand-row JSON, 50/page pagination). 15 files, +973 lines.
3. `2245ce5` **fix(r3): admin events display + lock down anon read** — three bugs surfaced via [`scripts/inspect-events.ts`](scripts/inspect-events.ts) (script-first rule). (a) Counter strip showed planner estimates not exact counts (24h/7d/all = 40/40/2 — impossible math). Cause: `head: true` + fresh table = `pg_class.reltuples` instead of real `COUNT(*)`. Fix: drop `head: true`, add `.limit(1)`. (b) Saves filter chip returned empty even when `post_saved`/`post_unsaved` rows existed. Cause: `.in("event_type", […])` against enum column doesn't always cast cleanly via PostgREST's `=in.(…)` operator. Fix: switch to `.or()` for multi-value, `.eq()` for single-value. (c) Anon role had SELECT on events (Supabase default public-schema grants). Fix: migration `011_events_anon_revoke.sql` revokes SELECT from anon + authenticated.
4. `73653ca` **fix(r3): instrument feed-card + saved-list unsave + share log** — original instrumentation only covered `/find/[id]` `handleToggleSave`. Real shopper unsaves go through `/page.tsx` feed-card handler and `/flagged/page.tsx` `handleUnsave` — both missed. Added `track()` to both. Plus a verification log in share-booth before `recordEvent` to help diagnose the share_sent count staying at 0.
5. `3de1f45` **chore(r3): visibility tooling for QA — client toast + admin route log** — David explicitly asked mid-session "is there a better way to set ourselves up for this type of testing." Answer: yes, and it was already overdue. Shipped (a) opt-in client debug toast (`localStorage.setItem("th_track_debug", "1")`) — every `track()` call surfaces a transient bottom-left toast showing the event name + payload preview; (b) verbose server log on `/api/admin/events` GET showing `filterRaw=… typeIn=… before=… rows=N`. Together they collapse "click → guess → ship → wait" into "click → see toast → check Vercel logs → know exactly which layer is broken." Pattern memorized as `feedback_visibility_tools_first.md`.
6. `15d49da` **chore(r3): surface insert errors — toast shows status, recordEvent logs Postgres detail** — toast extended to also show the `/api/events` HTTP response status (✓ 204 in green / ✗ 400 in red / ✗ network error). `recordEvent` now logs both success ("ok user_id=… session=…") and failure with full Postgres context (`code=… details=… hint=…`). `/api/events` POST now logs every received event_type. Made the click→DB chain fully visible.
7. `f1e1fd5` **fix(r3): always use .or() for typeIn — single-value .eq() flaky on Vercel** — discovered during QA: server log shows `[admin/events GET] filterRaw=shares typeIn=[share_sent] before=— rows=0` while local repro of the **exact same query against the same DB** returns the 3 expected rows. `.eq()` works fine for `page_viewed` (returns 38), `mall_activated` (1), `mall_deactivated` (2) — but not `share_sent`. Vercel-vs-local discrepancy not root-caused. Workaround: drop the length===1 `.eq()` branch and always use `.or()` since it's verified working for both single- and multi-value filters across every event_type.

**What works end-to-end on prod:**

- Events table created (migration 010 applied via HITL on prod)
- Anon read locked down (migration 011 applied via HITL on prod)
- Client `track()` fires correctly across all instrumented pages — confirmed via debug toast on iPhone
- Server `recordEvent()` inserts correctly across all 4 handlers — confirmed via Vercel runtime logs ("ok user_id=… session=…")
- DB grew from 0 → 175+ events captured during QA across all 8 v1 event types except `vendor_request_submitted` (David didn't submit during QA) and `vendor_request_approved` (didn't approve during QA)
- Admin Events tab summary cards show consistent 24h ≤ 7d ≤ all-time counts
- Filter chips: All / Saves / Views / Mall activated / Mall deactivated all render correctly
- Counter strip works
- Day-grouped list, tap-to-expand JSON, refresh button all functional

**What's still broken at session close — open for session 59:**

- 🟡 **Shares filter doesn't reflect new shares.** Historical `share_sent` rows visible in Events tab after the `f1e1fd5` `.or()` workaround, BUT new shares David sent after the fix don't appear under the Shares filter even after Refresh. Not a recordEvent failure (Vercel logs still show `[events] recordEvent(share_sent) ok`). Possibly a Vercel deploy-cache issue, possibly admin tab fetch staleness. Needs fresh-eyes investigation.
- 🟡 **Unsaved events not loading in admin tab** despite `recordEvent(post_unsaved) ok` lines visible in Vercel logs. Diagnostic confirms post_unsaved count grew to 31+ in DB. Display bug, not capture bug. Same fresh-eyes investigation.
- 🟡 **`filter_applied` count = 0 in DB.** Either David didn't trigger the mall picker change during QA, or the `track("filter_applied", …)` call in `/page.tsx` `handleMallSelect` isn't firing. Single-test verification needed.

**Tooling shipped this session that stays as institutional infrastructure:**

- [`scripts/inspect-events.ts`](scripts/inspect-events.ts) — read-only diagnostic mirroring the admin route's count + filter logic. Runs in 5 sec, prints DB ground truth + per-type counts + 10 most-recent + anon read attempt. The kind of script that makes future event-table investigations a single `npx tsx` command.
- Client debug toast in [`lib/clientEvents.ts`](lib/clientEvents.ts) — opt-in via `localStorage.setItem("th_track_debug", "1")`. Shows track() calls + HTTP response status in real-time. Stays disabled by default for non-debug users.
- Verbose server logging on `/api/events` POST + `recordEvent` + `/api/admin/events` GET — minimal one-liners visible in Vercel runtime logs. Never caused noise, only signal during the QA loop.

**Memory update this session:** Added `feedback_visibility_tools_first.md` — when prod QA bugs aren't isolated by the second test cycle, build visibility tooling before round 3 instead of continuing to guess. Validated empirically this session: rounds 3–5 of guess-and-ship without visibility tools cost ~2 hours; one round with toast + server logs in place isolated the bug to a specific layer.

**Tech Rule candidates surfaced this session — single-firing, not yet promoted:**

- **Vercel-runtime-vs-local PostgREST quirks must be reproduced from a Vercel function before declaring a fix.** Local diagnostic + manual route reproduction agreed (`.eq("event_type", "share_sent")` returns 3 rows), but Vercel's runtime returned 0 for the same query. The bug existed only on Vercel. If this recurs on another route, the meta-rule is: when local-vs-Vercel diverge on identical Supabase queries, suspect Vercel's runtime or build cache before suspecting query syntax — and consider deploying a known-good fallback pattern (e.g., `.or()`) rather than the textbook-correct one.
- **For QA-heavy multi-round debug loops: ship visibility tooling on round 3, not round 5.** Captured as feedback memory above. Promoted-ready after one more session-level firing.

**Live discoveries this session:**

- **The design record's RLS-on spec for `events` referenced an `admin_emails` table that doesn't exist in this project.** Admin gating uses `NEXT_PUBLIC_ADMIN_EMAIL` env var matched in `requireAdmin()`, not a Postgres-side allowlist. Migration 010 deviated from the design record to match the established pattern (RLS off, admin reads via service-role API route). Documented inline in the migration file's RLS note. The design record itself wasn't updated mid-stream — but the deviation should propagate back to the design record retroactively if R3 ever has a follow-up design pass.
- **PWA cache + Vercel webhook reliability is a real recurring frustration during prod QA.** Per `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS, the GitHub→Vercel webhook can lag; David ran `vercel --prod` multiple times this session to force fresh deploys. The PWA on iPhone also held stale bundles across pushes. Together these account for at least one of the 5 debug rounds — fixes that worked locally appeared "still broken" on device because the device hadn't loaded the fix yet. Worth promoting "always force `vercel --prod` after a routing/route-handler change during prod QA" as a Tech Rule candidate if it recurs.
- **The `share_sent` Vercel-vs-local mystery was never root-caused.** All other single-value `.eq()` queries worked. Only `share_sent` failed on Vercel. Local reproduction with identical client/query/DB worked. Workaround landed (always `.or()`); root cause unknown. Would not surprise me if a future session re-hits this pattern with a different enum value. The diagnostic script is positioned to be useful then.

**Layman framing delivered this session:** Before session 58, R3 was a frozen design on paper. After today, R3's plumbing is live — 175+ events captured, admin Events tab visible, debug tooling in place. Two of the eight visualizations in the admin tab don't yet display correctly under all filters; that's a finishing-pass for session 59. The session also produced the most institutional QA infrastructure of any single session in the project — debug toast, server logs, diagnostic script. Future debug loops will start with eyes open.

**Operational follow-ups surfaced this session:**

- **R3 finishing pass** (~1 session) — root-cause + fix the two open display bugs (Shares filter not reflecting new shares; Unsaved events not loading despite Vercel logs showing recordEvent ok). With the visibility tooling in place, this should resolve faster than this session's chase.
- **`filter_applied` instrumentation verification** (~5 min HITL) — single test to confirm whether the mall-picker `track()` call fires. If `filter_applied` count grows after a picker change, instrumentation is fine and David just hadn't tested it. If still 0, one inline fix needed.
- **Staging migration 010 + 011 paste** (~5 min HITL) — prod has both; staging is now two migrations behind (009 from session 57 still pending too).
- **Disable debug toast post-stabilization** (~10 sec) — `localStorage.removeItem("th_track_debug")` once display bugs are fixed. Or leave it on — it's opt-in and harmless when disabled.
- **Strip verbose console.logs from `/api/events` + `recordEvent` + `/api/admin/events` GET** — optional, post-stabilization. They're minimal (one line per event) and proved their value; equally valid to leave them as institutional infrastructure.

---

## Archived: prior session tombstones

- **Session 57** (2026-04-24) — R4c shipped end-to-end on prod (commit `ff87047`, on-device QA PASSED 4/4), first-ever Tech Rule promotion batch (3 rules into MASTER_PROMPT.md, commit `6f77065`), Q-002 picker revision (commit `080689a`), `.eslintrc.json` to green the long-red Lint job (commit `d73323f`). CI green across all 3 jobs for the first time. R4c graduated 🟢 → ✅ — first roadmap item shipped end-to-end. Session 58 ran the design-to-Ready → implementation pattern again on R3.

- **Session 56** (2026-04-24) — R4c design-to-Ready, one commit `daca2a5`. Zero runtime code. Shipped [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md) (all 6 decisions D1–D6 frozen), mockup [`docs/mockups/r4c-admin-v1.html`](docs/mockups/r4c-admin-v1.html), roadmap entry rewritten; R4c graduated 🟡 → 🟢, first roadmap item to do so. Session 57 ran the implementation straight against the spec with zero re-scoping — validating the design-to-Ready pattern.

- **Session 55** (2026-04-24) — Roadmap capture + prioritization, three commits `2b9712f` + `40206f9` + `8dca4cc`. Zero runtime code. Shipped [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) (567 lines, 15 items R1–R15, 8 clusters A–H, 3 shipping horizons, dependency graph, decision-urgency callouts). Absorbed 12 parked items from CLAUDE.md into roadmap cross-ref table.

---


## CURRENT ISSUE
> Last updated: 2026-04-25 (session 58 close — R3 design-to-Ready + implementation + extended QA loop with two unresolved display bugs)

**Status:** Eight commits on main this session — `ba888b3` (R3 design-to-Ready), `2839d28` (R3 implementation), `2245ce5` (admin events display fix + anon revoke), `73653ca` (feed-card + flagged-page unsave instrumentation), `3de1f45` (visibility tooling), `15d49da` (insert error surfacing), `f1e1fd5` (always-or workaround), session-close commit to follow. R3 plumbing is live on prod: events table created via migration 010, anon-read locked down via migration 011, 175+ events captured, admin Events tab renders most filters correctly, debug toast + diagnostic script + verbose logs in place. **Two display-layer bugs unresolved at session close:** (a) Shares filter doesn't reflect new shares despite Vercel logs showing recordEvent ok; (b) post_unsaved events don't render in the admin Events tab even though they're in the DB. Beta invites remain technically unblocked — R3 is Horizon 1 infrastructure, not a beta gate.

### 🚧 Recommended for session 59 — R3 finishing pass (~1 session)

Two open display bugs need fresh-eyes investigation. With the visibility tooling now in place (debug toast in `lib/clientEvents.ts`, server logs on `/api/admin/events` GET, `[events] recordEvent(…) ok|failed:` lines, `scripts/inspect-events.ts` for ground truth), the next session should isolate the bug in one or two test cycles instead of the 5+ rounds session 58 took.

Shape:

- 🟢 AUTO — Re-read the session-58 close block + the R3 design record + look at the open-bug list
- 🖐️ HITL (≤5 min) — David enables debug toast, sends one share, taps unsave on one find, screenshots the toast + status. Pastes Vercel log lines for `[admin/events GET]` and `[api/events]` and `[events] recordEvent`
- 🟢 AUTO — From the toast/log evidence, isolate the bug to a specific layer (client render vs API route vs DB) and ship the fix
- 🟢 AUTO — Re-run `scripts/inspect-events.ts` to verify the fix lands
- 🟢 AUTO — Once both bugs resolve: optional cleanup (disable debug toast, decide whether to keep verbose console.logs)

**Hypothesis to test first:** the Shares-filter "new shares not showing" symptom may be a Vercel deploy / PWA cache issue rather than a code bug. The `f1e1fd5` always-`.or()` workaround was deployed at session close; David hasn't run a fresh `vercel --prod` after that commit. First step: force a deploy (`npx vercel --prod`) and retest before assuming a code bug.

**Gate to V1:** Feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### Alternative next sessions (if David wants to redirect from session 59)

- **Feed content seeding** (~30–60 min) — rolled forward from sessions 55 + 56 + 57 + 58. 10–15 real posts across 2–3 vendors. R4c picker is sane (only active malls surface to shoppers); content seeding can run cleanly.
- **R12 Error monitoring** (~1 session) — Sentry setup + source-map upload. Pairs naturally with R3. Could run before the R3 finishing pass since the visibility tooling shipped session 58 covers the immediate "did the event fire" question; Sentry covers the broader "did anything else break."
- **R15 technical-path decision** (~30–60 min, no-code Design) — Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap.
- **Q-002 on-device QA walk** (~5 min HITL) — shipped session 57 `080689a`; single-booth + multi-booth + share-airplane preservation. Pure verification.
- **Staging migration 009 + 010 + 011 paste + seed-staging re-run** (~15 min HITL) — staging is now three migrations behind prod.
- **Staging Supabase OTP email template paste** (~15 min HITL) — paste prod's branded OTP template into staging.
- **Booths view on-device verification on staging** (~5 min HITL) — deferred session 54 Task 10.
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 + 44–58 tombstone-only.
- **Design agent principle addition** (~10 min, docs only) — "reconciliation of a second glyph/affordance is part of the same scope" (session-45 retrospective).
- **MASTER_PROMPT.md KNOWN PLATFORM GOTCHAS update** (~10 min, docs only) — Gmail `position: absolute` (session 52), new-Supabase-project URL-config prereq (session 54), force-`vercel --prod`-during-prod-QA (session 58 lived experience).
- **R3 design-record retroactive update** (~10 min, docs only) — propagate the migration-010 RLS-off deviation back into [`docs/r3-analytics-design.md`](docs/r3-analytics-design.md) so the spec matches what shipped.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min).

### Session 59 opener (pre-filled — R3 finishing pass)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: R3 finishing pass. Two open display bugs from session 58: (1) Shares filter doesn't reflect new shares in admin Events tab despite Vercel logs showing [events] recordEvent(share_sent) ok. (2) post_unsaved events captured in DB but don't render under Saves filter in admin Events tab. Visibility tooling shipped session 58 (debug toast in lib/clientEvents.ts, verbose server logs on /api/admin/events + recordEvent + /api/events, scripts/inspect-events.ts diagnostic) — use it. First step: force `npx vercel --prod` to make sure latest commit f1e1fd5 (always-.or()) is deployed, then retest. Hypothesis is the bugs are PWA cache / deploy lag rather than code, but if a fresh deploy + fresh PWA still shows the bugs, isolate via toast + Vercel logs and fix. Once R3 stabilizes: optionally disable debug toast (localStorage.removeItem("th_track_debug")), decide whether to keep verbose logs as institutional infrastructure or strip them, and consider promoting "Vercel-runtime-vs-local quirks" + "front-load visibility tooling" Tech Rule candidates with one more firing.
```

---

## Archived session summaries

> Sessions 34–46 kept as one-liner tombstones. Full detail in `docs/session-archive.md` (or in session-blocks that are queued for eventual archive-drift cleanup).

- **Session 34** (2026-04-20) — Multi-booth scoping. Option A chosen, mockup approved, Q-001 Path B backup captured. Superseded by session 35.
- **Session 35** (2026-04-20) — Multi-booth rework shipped end-to-end + KI-006 resolved. Six-step QA walk passed.
- **Session 36** (2026-04-20) — Q-003 BottomNav badge resolved across four surfaces + KI-007 edit-page redirect loop fixed.
- **Session 37** (2026-04-20) — Sprint 4 tail closed: T4c confirmed done, T4b `<AddBoothInline>` folded into `/admin`, T4b `/admin/login` locked as Keep Dedicated, T4d runbook written.
- **Session 38** (2026-04-21) — Window Sprint scoping, four-frame mockup + build spec, three queued implementation sessions.
- **Session 39** (2026-04-21) — Q-004 rename + Q-005 tagline + Q-007 Window Sprint backend shipped. TS downlevelIteration rule promoted.
- **Sessions 40–41** (2026-04-21) — Q-007 client shipped + Q-007 + T4d QA walks both PASSED. Beta invites technically unblocked.
- **Session 42** (2026-04-21) — DB test-data wipe. Admin identity confirmed never drifted.
- **Session 43** (2026-04-21) — Anthropic model audit + billing auto-reload at $10/$20. Session-27 rule fired cleanly for the first time since promotion.
- **Session 44** (2026-04-22) — `/shelves` Add-a-Booth restored via `<AddBoothInline>` primitive (partial T4b reversal). Hero-photo field added. Chrome mismatch flagged.
- **Session 45** (2026-04-22) — `/shelves` cross-mall fix + admin booth delete primitive + Q-009 admin Window share bypass + BoothHero URL-share airplane retired (two-airplane cleanup). Four shipments, three commits, all on-device walks passed. Session-45 Supabase nested-select explicit-columns Tech Rule candidate queued (one firing).
- **Session 46** (2026-04-22) — T4d pre-beta QA walk re-passed end-to-end (all five exit criteria clean) + `scripts/qa-walk.ts` QA utility shipped + `docs/pre-beta-qa-walk.md` hero-photo step drift patched + `/session-open` + `/session-close` slash commands added to standardize the Chat→Code workflow. First Claude Code session after 45 in Claude Chat.
- **Session 47** (2026-04-23) — Vendor onboarding hero image gap fixed: `proof_image_url` now transfers to `vendors.hero_image_url` on approval (3 edits + safe-claim path backfill in `app/api/admin/vendor-requests/route.ts`). My Shelf banner no longer blank after sign-in. Forward-only fix; no migration.
- **Session 48** (2026-04-23) — Featured banner RLS drift fixed across Home + Find Map + `/admin` Banners preview. Migration 008 + `scripts/inspect-banners.ts` diagnostic. HITL: David pasted SQL into Supabase editor; anon reads confirmed restored.
- **Session 49** (2026-04-23) — Booths page full v1.2 redesign (2-column grid, StickyMasthead, mall grouping). QR code added to share sheet with logo overlay; confirmed scanning on device. Copy polish: "Invite someone in to" header, "Send the invite" CTA, "Request Digital Booth" green pill on home, "Vendor Sign in" on login.
- **Session 50** (2026-04-23) — Q-008 shopper Window share shipped (`/api/share-booth` branches on Authorization header; anon = 2/10min + no ownership + no sender voice; auth path + Q-009 admin bypass unchanged). Guest edit-pencil hole closed: `signOut()` clears `LOCAL_VENDOR_KEY`, `detectOwnershipAsync` requires a session, Find Detail subscribes to `onAuthChange`. One commit `0d30fa0`; QA walk deferred; verified clean session 51 — 5/5 scenarios PASSED.
- **Session 51** (2026-04-24) — Q-008 shopper-share QA walk PASSED 5/5 scenarios on device (Q-008 QA hold retired). Q-011 scoped as a Design session rather than a patch; first-pass code attempt reverted after David called mockup-first and v2 mockup review surfaced 4-axis brand drift beyond original SVG-stripping diagnosis. v2.2 mockup locked at `docs/mockups/share-booth-email-v2.html`. Zero commits. Email template parity audit Tech Rule candidate queued (first firing).
- **Session 52** (2026-04-24) — Q-011 Window email redesign shipped in 4 iterations / 4 commits (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`). Four mockup artifacts produced; scope pivoted twice; every iteration mockup-mediated. Two Gmail-hostility discoveries (`position: absolute` stripping + SVG-rect filtering). Tech Rule candidates queued: email-template-parity-audit (2nd firing, promotion-ready) + Gmail-hostile-primitives-list (1st firing). Word "Window" retired from user-facing copy. Zero on-device QA (session 53 closed that).
- **Session 53** (2026-04-24) — Q-011 v4 QA walk PASSED 4/4 clients on device (Gmail web, iOS Gmail, iOS Mail, Apple Mail); Q-011 loop fully closed after four iterations + four-client verification. Ladder B first half shipped in one commit `44b4c79`: `.github/workflows/ci.yml` + `package.json` scripts + `docs/beta-plan.md` + `docs/ladder-b-design.md`. Four additive artifacts, zero runtime code. D1(a) / D2(b) / D3(a) / D4(a) decisions locked in the design record. First Claude Code session to exercise `/session-open` + `/session-close` slash commands end-to-end. No memory updates.

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 finishing pass** — two open display bugs from session 58: Shares filter not reflecting new shares; post_unsaved events not rendering in admin Events tab. Both are display-layer bugs (DB has the data, server logs show recordEvent ok). Hypothesis is Vercel deploy lag / PWA cache. Recommended for session 59. ~1 session.
- **`filter_applied` instrumentation verification** — session-58 QA didn't exercise the mall-picker change so `filter_applied` count stayed at 0. Either David didn't trigger it or the `track()` call in `app/page.tsx` `handleMallSelect` is broken. ~5 min HITL.
- **Feed content seeding** — rolled forward from sessions 55 + 56 + 57 + 58. 10–15 real posts across 2–3 vendors.
- **Staging migration 009 + 010 + 011 paste + seed-staging re-run** — staging is now three migrations behind prod (R4c's 009, R3's 010, R3's 011). ~15 min HITL.
- **Staging Supabase OTP email template paste** — session 54 discovered staging is sending generic Supabase emails. HITL paste from `docs/supabase-otp-email-templates.md`. ~15 min. Non-gating.
- **R3 design-record retroactive update** — migration 010 deviated from the design record's RLS-on spec (referenced an `admin_emails` table that doesn't exist). The deviation was documented inline in `010_events.sql`; the design record at `docs/r3-analytics-design.md` should be updated to match what shipped. ~10 min docs only.
- **Disable debug toast post-R3-stabilization** — `localStorage.removeItem("th_track_debug")` once R3 finishing pass closes. Or leave on; harmless when disabled.
- **Strip verbose console.logs from R3 routes** — optional, post-stabilization. They're minimal and proved their value during QA; equally valid to keep them.
- **Error monitoring** — absorbed into [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) as R12 (Horizon 1).
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — **session 57 shipped the first batch**. Fourteen candidates queued, all at single-firing: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding, (f) session-45 Supabase nested-select explicit-columns, (g) session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`, (h) session-52 Gmail-hostile primitives list growing-meta-rule, (i) session-54 capture-initial-schema-as-001-before-claiming-migrations-from-scratch, (j) session-54 env-var-checklist-must-enumerate-every-NEXT_PUBLIC, (k) session-54 new-Supabase-project-must-set-Auth-URL-Configuration-before-first-magic-link, (l) **session-58 Vercel-runtime-vs-local-PostgREST-quirks** — when local-vs-Vercel diverge on identical Supabase queries, suspect Vercel runtime/build cache before query syntax; deploy a known-good fallback pattern (`.or()`) rather than the textbook-correct one if behavior diverges, (m) **session-58 front-load-visibility-tooling-on-debug-round-3** (also captured as feedback memory), (n) **session-58 always-force-`vercel --prod`-after-routing-changes-during-prod-QA** — GitHub→Vercel webhook lag + PWA cache compound during prod QA.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only.
- **Session-archive drift cleanup** — sessions 28–38 + 44–58 tombstone-only. ~30 min batch to backfill detail from git log.
- **Q-002 on-device QA walk** — shipped session 57 in commit `080689a` but not yet walked. ~5 min HITL.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch`. Not beta-gating.
- **`/admin` UI `auth.users` delete reliability** — session 46 observed UI delete didn't stick. Not blocking. ~20–30 min spike.
- **Booths view admin-access verification on staging** — deferred from session 54 Task 10. ~5 min HITL.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`); v4 on-device QA walk **PASSED 4/4 clients session 53** (Gmail web, iOS Gmail, iOS Mail, Apple Mail). Loop fully closed. Final state (v4): shell masthead retired, opener line flowing into IM Fell 34px vendor name, banner + 2-cell info bar as one unified rounded frame, full-width "Explore the booth" green button directly under info bar, naked tile grid, footer. Subject + preheader + opener share the phrase "A personal invite to explore {vendor}". Word "Window" retired from user-facing copy.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57 (`Masthead` center reverted to brand lockup; `<BoothTitleBlock>` gained optional `onPickerOpen` that wraps the 32px booth name in a tap target with inline `▾` when `showPicker`; mockup Frames 2 + 3 revised in same commit).

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. (**Session 49 note:** `/shelves` chrome mismatch is now resolved — v1.2 migration shipped. `/admin` remains on v0.2.)
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49 change); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan added in same session. Items absorbed from this list: "Claim this booth" → R1; "ToS/privacy" → R6; "native app eval" → R9; "vendor directory" → R10; `/welcome` guest landing → R8; "feed pagination + search" → partial overlap with R5a; **"Universal Links (gating Q-006)" → R15**. Also absorbed from pre-beta polish list: Error monitoring → R12; Beta feedback mechanism → R7.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

**Session 45 note on Direction A:** the BoothHero URL link-share bubble that was retired this session was essentially Direction A. If/when a URL-share capability is reintroduced (e.g. native share sheet with OG preview), it should land as a deliberate Design pass, not a quiet restoration of the retired bubble. The masthead airplane is the sole share affordance on Booth pages; a future URL-share primitive is a separate glyph/location decision.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — design-history reference for Q-011 arc.
- `docs/mockups/share-booth-email-v2.html` — design-history reference (session 51 Variant B; superseded twice in session 52).
- `docs/mockups/share-booth-email-v3.html` — design-history reference (session 52 info bar pivot; superseded by v4).
- `docs/mockups/share-booth-email-v4.html` — design-history reference (session 52 v4 simplification; QA PASSED 4/4 clients session 53). Q-011 arc closed.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002). Keep as design-history reference for multi-booth.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — now carries v2 + v3 + v4 addendums stacked. Post-QA (passed session 53), candidate for consolidation (the three addendums are easier to read merged than stacked). ~15 min docs-only pass.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot `pg_dump` pipeline artifact, gitignored, safe to delete anytime; contains prod + staging DB URIs with passwords).
- Orphaned `dbutler80020@gmail.com` staging auth user (created by the first seed-staging run before David chose `david@zenforged.com` as staging admin; non-admin, non-blocking; leave or clean up manually via Supabase dashboard).

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc (DB cleanup, AI model audit, /shelves + admin primitives, Q-007/Q-008/Q-009/Q-011 Window-share work, Ladder B CI + beta plan); session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (15 items + clusters + horizons in `docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod, first roadmap item ✅, plus first Tech Rule promotion batch + CI green; **session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured across 8 v1 event types, admin Events tab functional for most filters, debug toast + diagnostic script + verbose logs as institutional QA infrastructure (commits `ba888b3` → `f1e1fd5`, 7 commits + close). Two display-layer bugs (Shares filter + post_unsaved render) deferred to session 59 finishing pass; not beta-gating since R3 is Horizon 1 infrastructure**. Next natural investor-update trigger point is after R3 stabilizes + feed content seeding lands — the update would then report two roadmap items fully shipped (R4c + R3) on top of the pre-beta polish arc, with staging infra in place, content populated for V1 beta invites, and a documented 15-item roadmap. R3 also represents the first roadmap item to compress design-to-Ready → implementation into one session — a cadence improvement worth highlighting once the finishing pass lands.

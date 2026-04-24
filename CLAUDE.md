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

## ✅ Session 56 (2026-04-24) — R4c design-to-Ready (first roadmap item 🟡 → 🟢)

One content commit on main. Zero runtime code, zero feature work — session was the design-decision pass for R4c (Mall active/inactive), making it the first [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) item to graduate from 🟡 Captured to 🟢 Ready. Pivoted from the originally-queued feed content seeding scope, which rolls forward to session 57 as one alternative behind the R4c implementation sprint itself.

**Commit landed:**

1. `daca2a5` **docs(r4c): design-to-Ready — 3-state mall lifecycle + admin mockup + roadmap promotion** — new doc [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md) (all 6 decisions D1–D6 frozen), new mockup [`docs/mockups/r4c-admin-v1.html`](docs/mockups/r4c-admin-v1.html) (2 phone frames on dark bg — list view with 3 grouped sections + row-tapped view with inline segmented control + activation toast), R4c entry in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) rewritten with decisions-frozen list + cross-refs; summary-table status flipped 🟡 → 🟢. 753 insertions, 10 deletions.

**The six frozen decisions (implementation session 57 runs straight against the spec, no re-scoping needed):**

- **D1** Three-state enum `malls.status = 'draft' | 'coming_soon' | 'active'`, not a bool. `coming_soon` teases mid-onboarding malls on future map surfaces without producing empty booth lists.
- **D2** Vendors attached to inactive (`draft` or `coming_soon`) malls: hidden from shopper picker + feed filter. Still visible to the vendor themselves (`my-shelf`, shelf detail) and to admin (AddBoothInline dropdown, `/shelves` headers, new Malls tab).
- **D3** `malls.activated_at` timestamp captured at first activation — never cleared on deactivation. R3 layers `mall_activated` / `mall_deactivated` events on top when R3 ships; no `deactivated_at` column needed until then.
- **D4** Migration 009 defaults ALL existing malls to `draft`. David activates the 1–2 real malls via admin UI post-deploy (~30 sec). Reveals the pollution problem R4c solves; doesn't paper over it.
- **D5** Admin toggle lives on new `/admin` `Malls` tab (4th position after Requests / Posts / Banners). Keeps schema-editing admin colocated. `/shelves` stays a browser, not an editor.
- **D6** Vendor-request dropdown filters to `active` only. Vendors can't submit a booth request against a `coming_soon` mall — avoids a pending-request queue David can't act on until activation.

**Sprint brief shape for session 57 (from design record §Implementation plan):** migration 009 (+ HITL paste into both staging + prod Supabase SQL editors), `getActiveMalls()` helper in `lib/posts.ts`, rewire `app/page.tsx` + `app/vendor-request/page.tsx` to filter + vendor-request zero-active empty-state copy, new `/admin` `Malls` tab with 3 grouped sections + inline segmented control + status pills on AddBoothInline + `/shelves` mall-group headers, `app/api/admin/malls/route.ts` PATCH handler, build + commit, HITL activation on prod + staging. Estimated ~90 min.

**Live discoveries this session:** None. Pure design-doc + mockup work; zero runtime-code touched. No new Tech Rule candidates. The session-53 commit-design-records-in-same-session candidate saw its **second firing** this session — design record + decisions-freeze both landed in one commit, not split across the next-session implementation commit. Now promotion-ready (two firings outside same context).

**Memory updates this session:** None warranted. David's pattern (quick D1/D2/D3 answers + single-word "approve" on the three tentatives) matched the rapid-async-decision style already captured in `user_code_context.md`; no new feedback to record.

**Layman framing delivered this session:** Before session 56, "29 unactivated malls pollute every picker" was a known UX problem without a spec. After today, there's a fully-specified implementation path — a three-state lifecycle, a clean migration, a mockup David has reviewed, and an 8-task line-item sprint brief. First roadmap item to move from capture to ready, and the anchor of Wave 1 Cluster D (unlocks R10 map + R13 mall-operator accounts downstream).

**Operational follow-ups surfaced this session:** None. Session was docs-only.

---

## Archived: Session 55 tombstone

- **Session 55** (2026-04-24) — Roadmap capture + prioritization, three commits `2b9712f` + `40206f9` + `8dca4cc`. Zero runtime code. Shipped [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) (567 lines, 15 items R1–R15, 8 clusters A–H, 3 shipping horizons, dependency graph, decision-urgency callouts). R15 (app store launch) elevated during cluster/priority review as the major-item gap missed in the initial 11+3 pass; three possible technical paths documented (Capacitor wrapper / Expo rebuild / full native). Absorbed 12 parked items from CLAUDE.md into roadmap cross-ref table. No memory updates.

---


## CURRENT ISSUE
> Last updated: 2026-04-24 (session 56 close — R4c design-to-Ready, first roadmap item 🟡 → 🟢)

**Status:** `daca2a5` on main (session 56 content) + session-close commit to follow. Zero runtime code, zero feature work — session 56 was the design-decision pass for R4c (Mall active/inactive). All 6 decisions D1–D6 frozen. Three artifacts landed: [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md), [`docs/mockups/r4c-admin-v1.html`](docs/mockups/r4c-admin-v1.html), and the roadmap entry rewrite. [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) now shows R4c in 🟢 Ready status; all other items still 🟡 Captured. Beta invites remain technically unblocked from earlier sessions. Staging URL from session 54 still live: `https://treehouse-treasure-search-git-staging-david-6613s-projects.vercel.app`. Feed content seeding (originally queued for sessions 55 + 56) rolls forward again as one of several alternatives behind the obvious next move of implementing R4c.

### 🚧 Queued for session 57 — R4c implementation sprint (~90 min)

First roadmap implementation session. All six decisions frozen session 56; spec is straight. Full detail in [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md) §Implementation plan.

Shape of the session:

- 🟢 AUTO — Task 1: write `supabase/migrations/009_mall_status.sql` (`mall_status` enum + `activated_at` column + hot-path index)
- 🖐️ HITL — Task 1b: David pastes migration 009 into both staging + prod Supabase SQL editors
- 🟢 AUTO — Task 2: add `getActiveMalls()` helper to `lib/posts.ts`
- 🟢 AUTO — Task 3: rewire `app/page.tsx` + `app/vendor-request/page.tsx` to `getActiveMalls()` + vendor-request zero-active empty-state copy
- 🟢 AUTO — Task 4: new `/admin` `Malls` tab (4th position) with 3 grouped sections + inline segmented control + status pills in AddBoothInline dropdown + `/shelves` mall-group headers
- 🟢 AUTO — Task 5: `app/api/admin/malls/route.ts` PATCH handler (updates status + sets `activated_at` on first activation only)
- 🟢 AUTO — Task 6: `npm run build` clean + commit `feat(r4c): mall active/inactive + schema + admin tab`
- 🖐️ HITL — Task 7: David signs into prod `/admin` Malls tab, flips 1–2 real malls to `active`
- 🖐️ HITL — Task 8: Same flip on staging so seed-staging fixture vendors remain discoverable

**Gate to V1:** R4c shipped + feed content seeding + Booths-view verification + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md).

### Alternative next sessions (if David wants to redirect from session 57)

- **Feed content seeding** (~30–60 min) — rolled forward from sessions 55 + 56. 10–15 real posts across 2–3 vendors. Staging (session 54) is the safety net — content drafts there first, reviewed on device, then promoted to prod. R4c implementation landing first makes the picker sane for whichever malls host the initial posts; feed content seeding after R4c is the cleaner sequence, but could run first if David has content prep ready today.
- **R3 Analytics capture** (Horizon 1 kickoff, ~1–2 sessions) — foundational instrumentation. Next logical roadmap item to promote 🟡 → 🟢 via a Design pass on event-table shape + admin surfacing.
- **R12 Error monitoring** (Horizon 1 pair with R3, ~1 session) — Sentry setup + source-map upload. Small, compounds with R3.
- **R15 technical-path decision** (no-code Design session, ~30–60 min) — pick Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap. Worth deciding soon even though shipping is Horizon 3.
- **Tech Rule promotion batch** — **three rules shipped this session** (email-template-parity + commit-design-records-in-same-session into Design Agent; script-first-over-SQL-dump into Working Conventions; see MASTER_PROMPT.md). Next batch opens when another 2nd-firing lands. Twelve single-firing candidates still queued — see "Remaining pre-beta polish" below.
- **Staging Supabase OTP email template paste** (~15 min HITL) — paste prod's branded OTP template into staging Supabase → Authentication → Email Templates for full parity (see [`docs/supabase-otp-email-templates.md`](docs/supabase-otp-email-templates.md)). Closes the visible generic-email gap from session 54.
- **Booths view on-device verification on staging** (~5 min HITL) — the one deferred check from session 54 Task 10. Sign in at staging URL with `david@zenforged.com`, confirm the Booths view unhides.
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision (masthead → inline under hero banner).
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 + 44–55 tombstones only.
- **Design agent principle addition** (~10 min, docs only) — "reconciliation of a second glyph/affordance is part of the same scope." `MASTER_PROMPT.md` Design Agent section (session-45 retrospective).
- **MASTER_PROMPT.md KNOWN PLATFORM GOTCHAS update** (~10 min, docs only) — add session-52 Gmail `position: absolute` stripping + session-54 "new Supabase project requires Authentication → URL Configuration before first magic-link test."
- **[`docs/share-booth-build-spec.md`](docs/share-booth-build-spec.md) consolidation** (~15 min, docs only) — merge v2 + v3 + v4 addendums.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min).

### Session 57 opener (pre-filled — R4c implementation sprint)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: R4c implementation sprint — Mall active/inactive toggle. Session 56 shipped the design-to-Ready pass (docs/r4c-mall-active-design.md + docs/mockups/r4c-admin-v1.html in commit daca2a5); all 6 decisions D1–D6 frozen. Spec is straight — no re-scoping needed. Tasks: migration 009 (mall_status enum + activated_at), getActiveMalls() helper in lib/posts.ts, rewire app/page.tsx + app/vendor-request/page.tsx to filter shopper surfaces to active-only, new /admin Malls tab (3 grouped sections + inline segmented control + status pills in AddBoothInline + /shelves), app/api/admin/malls PATCH route, build + commit, HITL activation on prod + staging. Estimated ~90 min. Full implementation plan at docs/r4c-mall-active-design.md §Implementation plan. After R4c ships, feed content seeding (rolled forward from sessions 55 + 56) remains the V0 → V1 content gate before first beta vendor invites.
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

- **Feed content seeding** — rolled forward from sessions 55 + 56. 10–15 real posts across 2–3 vendors. DB still clean-slate. Staging stood up (session 54) so content drafts on staging first, reviewed on device, then promoted to prod via the same script. Listed in Alternative next sessions above — session 57's queued scope is R4c implementation, not content seeding. Content seeding after R4c ships is the cleaner sequence (picker sanity first, then populate).
- **Staging Supabase OTP email template paste** — session 54 discovered staging is sending Supabase's default generic confirmation emails, not the branded template from `docs/supabase-otp-email-templates.md`. HITL paste into staging Supabase → Authentication → Email Templates for parity. ~15 min. Non-gating; magic-link delivery works either way.
- **Error monitoring** — absorbed into [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) as R12 (Horizon 1).
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — **session 57 shipped the first-ever batch** (email-template-parity-audit + commit-design-records-in-same-session into Design Agent; script-first-over-SQL-dump-first into Working Conventions). Twelve candidates still queued, all at single-firing (waiting for a second observation before promotion): (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding, (f) session-45 Supabase nested-select explicit-columns, (g) session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`, (h) session-52 Gmail-hostile primitives list — the list itself is now folded into MASTER_PROMPT.md's email-parity rule, but the meta-rule about *growing* it is still single-firing until a third primitive lands, (i) session-54 capture-initial-schema-as-001-before-claiming-migrations-from-scratch — any "fresh env bootstrap" claim requires a verified-replayable schema file in `supabase/migrations/001_*.sql`, (j) session-54 env-var-checklist-must-enumerate-every-NEXT_PUBLIC — branch-scoped staging env-var specs must list every `NEXT_PUBLIC_*` the app reads, not just DB + email keys, (k) session-54 new-Supabase-project-must-set-Auth-URL-Configuration-before-first-magic-link — fresh Supabase projects default Site URL to `http://localhost:3000`; belongs in `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS. Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. Next batch opens when another 2nd-firing lands.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail; sessions 44–55 now also tombstone-only in this file. Session-55 tombstone added this session; session-56 block is paste-over-ready until the session-57 close replaces it here. ~30 min batch to backfill archive detail from tombstones + git log.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.
- **`/admin` UI `auth.users` delete reliability** — session 46 observed that David's UI-driven delete of Ella's auth user didn't stick (row persisted until force-deleted via admin API). Not blocking; worth investigating if it recurs. ~20–30 min spike.
- **Booths view admin-access verification on staging** — deferred from session 54 Task 10 behind Supabase's 1-per-hour email cap. When David signs in at staging with `david@zenforged.com` and confirms Booths view unhides, Ladder B second half is fully closed. ~5 min HITL.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`); v4 on-device QA walk **PASSED 4/4 clients session 53** (Gmail web, iOS Gmail, iOS Mail, Apple Mail). Loop fully closed. Final state (v4): shell masthead retired, opener line flowing into IM Fell 34px vendor name, banner + 2-cell info bar as one unified rounded frame, full-width "Explore the booth" green button directly under info bar, naked tile grid, footer. Subject + preheader + opener share the phrase "A personal invite to explore {vendor}". Word "Window" retired from user-facing copy.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). ~20 min.

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
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it.
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

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass; session 46 re-passed T4d QA walk + qa-walk.ts script; session 47 fixed vendor onboarding hero image gap; session 48 fixed featured-banner RLS drift; session 49 shipped /shelves v1.2 redesign + QR code share + copy polish; session 50 shipped Q-008 shopper Window share + guest edit-pencil fix; session 51 PASSED Q-008 QA walk 5/5 + scoped Q-011 as Design session; session 52 shipped Q-011 in 4 iterations; session 53 closed Q-011 loop (4/4 clients PASSED on device) + Ladder B first half shipped (CI + scripts + beta plan + design record in commit `44b4c79`); session 54 shipped Ladder B second half — staging Supabase provisioned, schema captured as `001_initial_schema.sql`, seed script + env template + gitignore shipped in commit `d8a10f9`, staging URL live, on-device sign-in confirmed; session 55 captured the beta-plus roadmap (15 items R1–R15 + 8 clusters + 3 horizons in `docs/roadmap-beta-plus.md`, commits `2b9712f` + `40206f9`, zero runtime code); session 56 promoted R4c (Mall active/inactive) from 🟡 Captured to 🟢 Ready with full design record + admin mockup in commit `daca2a5`, first roadmap item to graduate. Next natural investor-update trigger point is after R4c implementation (session 57) + feed content seeding** — the update would then honestly report the full pre-beta polish arc (sessions 42–5X) as complete, with staging infra in place, the first roadmap item shipped, content populated for V1 beta invites, and a documented 15-item roadmap + 3-horizon shipping plan for what comes after beta.

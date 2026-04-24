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

## ✅ Session 54 (2026-04-24) — Ladder B second half shipped + staging live end-to-end

One commit `d8a10f9` on main + staging. Five artifacts, 1,026 insertions, zero runtime code changes. Staging stack is provisioned, schema-captured, fixture-seeded, Vercel-wired; on-device sign-in confirmed; Booths-view verification deferred behind Supabase's 1-per-hour email rate limit (non-gating). Ladder B second half is complete — code and infra are live; the remaining on-device check is operational, not a code gate. Gate to V1 beta invite opens once David re-signs-in with `david@zenforged.com` on staging and confirms the Booths view renders.

**Commit landed:**

1. `d8a10f9` **chore(ladder-b): session 54 — staging schema + seed script + env template** — five artifacts, 1,026 insertions, zero runtime code:
   - **`supabase/migrations/001_initial_schema.sql`** (520 lines) — captured from prod via `pg_dump --schema-only --schema=public --no-owner --no-privileges`. Full current-state snapshot: 5 tables (`malls`, `posts`, `site_settings`, `vendor_requests`, `vendors`), custom `post_status` ENUM, `is_treehouse_admin()` + `set_updated_at()` functions, all indexes, all constraints (PK/UNIQUE/FK/CHECK), all triggers, all RLS policies. Migrations 002–008 remain in `supabase/migrations/` as historical evolution record, but fresh-env bootstrap only needs 001. D2(b) "migrations-from-scratch" path now genuinely exercisable. Applied clean to staging via `psql` with zero errors.
   - **`scripts/seed-staging.ts`** (466 lines) — `status` / `seed` / `wipe` subcommands mirroring `scripts/qa-walk.ts` shape. Idempotent fixtures via natural-key upserts. Safety rail: refuses to run against any env file without `staging` in path unless `--i-know-this-is-not-staging`. Creates admin auth user, 2 test vendors at booths 901/902, 6 posts (mix of available + sold), 2 `site_settings` rows. Surfaced as `npm run seed-staging`.
   - **`.env.staging.example`** (38 lines) — committable template for `.env.staging.local`. Mirrors `.env.example` with staging-specific commentary.
   - **`.gitignore`** (+1 line) — added `.env.*.local` pattern covering all future env-branch variants (`staging`, `prod-dump`, any future env).
   - **`package.json`** (+1 line) — `npm run seed-staging` script entry.

**Live side-effects of the commit:**

- GitHub Actions `ci.yml` fired on the `main` + `staging` pushes (live first-exercise of the session-53 CI workflow, free validation that the workflow runs against real branches).
- Vercel auto-deployed the `staging` branch on first push, producing the staging URL `https://treehouse-treasure-search-git-staging-david-6613s-projects.vercel.app` (branch alias, stable across commits).

**Ladder B second-half task status (Tasks 5–10 from [docs/ladder-b-design.md](docs/ladder-b-design.md)):**

| # | Status | Notes |
|---|--------|-------|
| 5 | ✅ DONE | Staging Supabase project `treehouse-treasure-search-staging` provisioned, project ID `thaauohvxfrryejmyisv`, `ON / ON / OFF` security settings (Data API on, auto-expose on, auto-RLS off) for prod parity. New-style publishable + secret keys named `treehouse_search_staging_client` / `treehouse_search_staging_server`. |
| 6 | ✅ DONE | Six env vars scoped to Preview + branch=`staging`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_EMAIL`. Existing prod entries narrowed from "All Environments" to Production-only so scopes don't overlap. `NEXT_PUBLIC_ADMIN_EMAIL=david@zenforged.com` on staging (matches the `is_treehouse_admin()` RLS hardcode; David chose business-email consistency over prod-env-pattern matching). |
| 7 | ✅ DONE | `001_initial_schema.sql` + `supabase/seeds/001_mall_locations.sql` + `npm run seed-staging seed` against staging — clean apply, 29 malls + 2 vendors + 6 posts + site_settings rows visible via `npm run seed-staging status`. |
| 8 | ✅ DONE | `scripts/seed-staging.ts` committed, typecheck clean, smoke-executed against staging successfully. |
| 9 | ✅ DONE | `.env.staging.example` committed; `.env.staging.local` created locally (gitignored) + later flipped `NEXT_PUBLIC_ADMIN_EMAIL=david@zenforged.com` for consistency with Vercel. `.gitignore` pattern expanded to `.env.*.local`. |
| 10 | ⏳ PARTIAL | Staging URL loads on iPhone, feed renders with 5 posts (sold-status McCoy planter correctly filtered), post detail opens, sign-in email arrives and magic-link redirect works after staging Supabase Auth URL Configuration was set. **Deferred:** Booths view admin-access verification — rate-limited by Supabase's 1-per-hour email cap while waiting to re-sign-in with `david@zenforged.com`. Non-gating: the infra is live; only the final admin-auth check is outstanding. |

**Live discoveries this session (all first firing — Tech Rule candidates):**

1. **Repo must carry an `001_initial_schema.sql` before claiming any "migration-from-scratch" capability.** Prod's base tables (`malls`, `vendors`, `posts`, `vendor_requests`) were created by hand in the Supabase dashboard on day one and never captured to git. Migrations 002–008 all assumed those tables existed — which worked on prod but silently broke any fresh-env bootstrap. Session 54 captured the base schema via `pg_dump`; 001 is now the canonical bootstrap. D2(b)'s purpose was to surface exactly this kind of beta-readiness gap; it worked.
2. **Branch-scoped staging env-var checklist must enumerate every `NEXT_PUBLIC_*` the app reads, not just DB + email keys.** My Task 6 spec listed four vars (Supabase + Resend) but missed `NEXT_PUBLIC_ADMIN_EMAIL` + `NEXT_PUBLIC_SITE_URL`. Client code fell back to the hardcoded `david@zenforged.com` default in [components/DevAuthPanel.tsx:19](components/DevAuthPanel.tsx:19), and the Booths view admin gate triggered unexpectedly. Cost: one redeploy. Avoidable with a complete var-list audit before branching env work.
3. **New Supabase project HITL checklist must include Authentication → URL Configuration (Site URL + Redirect URLs) before the first magic-link test.** Fresh Supabase projects default Site URL to `http://localhost:3000`; the first magic-link email thus fails with "site can't be reached" unless Site URL is pointed at the actual deploy URL. Missing from my Task 5 spec.

**Operational follow-ups surfaced (non-gating, captured in KNOWN GAPS):**

- **Staging Supabase OTP email templates missing** — Supabase sent the default generic confirmation email instead of the branded OTP template from [docs/supabase-otp-email-templates.md](docs/supabase-otp-email-templates.md). Template paste into staging Supabase → Authentication → Email Templates needed for full prod parity. HITL-only.
- **`.env.prod-dump.local` is on disk, one-shot artifact** — used for `pg_dump` pipeline; safe to delete after session closes (gitignored via `.env.*.local` pattern, never committed). Contains both prod + staging DB URIs with passwords.
- **Orphaned `dbutler80020@gmail.com` staging auth user** — created by the first seed-staging run before David chose `david@zenforged.com` as staging admin email. Non-admin session; leave or clean up manually.
- **Seed script produces posts with no images** (`image_url: null` on all 6 fixtures). Feed renders with empty image panes. Cosmetic. One-line patch to add placeholder URLs would improve visual fidelity.

**Memory updates this session:** none warranted. Admin-email consistency is documented in env files + `is_treehouse_admin()` in 001; Claude Code + automation-preference memories from session 46 continue to be load-bearing and unchanged.

**Layman framing delivered this session:** Before Ladder B, every push to main was live for real users; the only "staging" was `npm run dev` on laptop. After today, a second URL backed by a second Supabase project exists — features can land, be reviewed on device, even shared with beta vendors, before merging to prod. Disaster recovery went from "call Supabase support and pray" to "point psql at 001_initial_schema.sql." See [docs/ladder-b-design.md](docs/ladder-b-design.md) for the decision record.

---

## Archived: Session 53 tombstone

- **Session 53** (2026-04-24) — Q-011 v4 QA walk PASSED 4/4 clients on device (Gmail web, iOS Gmail, iOS Mail, Apple Mail); Q-011 loop fully closed after four iterations + four-client verification. Ladder B first half shipped in one commit `44b4c79`: `.github/workflows/ci.yml` + `package.json` scripts + `docs/beta-plan.md` + `docs/ladder-b-design.md`. Four additive artifacts, zero runtime code. D1(a) / D2(b) / D3(a) / D4(a) decisions locked in the design record. First Claude Code session to exercise `/session-open` + `/session-close` slash commands end-to-end. No memory updates.

---


## CURRENT ISSUE
> Last updated: 2026-04-24 (session 54 close — Ladder B second half shipped, staging live end-to-end)

**Status:** `d8a10f9` on main + staging. Session 54 landed five artifacts in one commit with zero runtime code changes. Staging stack is provisioned, schema-captured, fixture-seeded, Vercel-wired; on-device sign-in confirmed; Booths-view admin-access verification deferred behind Supabase's 1-per-hour email rate limit (non-gating). Staging URL: `https://treehouse-treasure-search-git-staging-david-6613s-projects.vercel.app`. Beta invites remain technically unblocked. Gate to V1 invite per `docs/beta-plan.md` opens once Booths verification lands + one quiet week elapses.

### 🚧 Queued for session 55 — Feed content seeding (~30–60 min)

10–15 real posts across 2–3 vendors. Prod DB is clean-slate (wiped session 42, re-confirmed session 46 QA walk). Staging now exists as a safety net — content can be drafted on staging first, walked through on device, then promoted to prod. This is the natural V0 → V1 content arc.

Shape of the session:

- 🟢 AUTO — write `scripts/seed-content.ts` helper (mirrors `seed-staging.ts` shape; idempotent upserts; accepts `--env-file` flag to point at staging vs prod)
- 🖐️ HITL — David supplies photos + copy for ~10–15 fixture posts
- 🟢 AUTO — draft against staging first, review on device
- 🟢 AUTO — after approval, seed prod via the same script pointed at `.env.local`
- 🖐️ HITL — on-device review of the populated feed on prod

**Gate to V1:** after content lands + Booths view verification closes + one quiet week, the V1 beta invite per `docs/beta-plan.md` can go out.

### Alternative next sessions (if David wants to redirect from session 55)

- **Tech Rule promotion batch** (~40 min) — **fourteen candidates queued** (session-54 adds three first-firing candidates — see KNOWN GAPS). Two promotion-ready: email-template-parity-audit (2nd firing session 52) + script-first-over-SQL-dump (2nd firing session 48). Plus session-52 Gmail-hostile primitives list (1st firing) and session-54's three new candidates (all 1st firing).
- **Staging Supabase OTP email template paste** (~15 min HITL) — paste prod's branded OTP template into staging Supabase → Authentication → Email Templates for full parity (see `docs/supabase-otp-email-templates.md`). Closes the visible generic-email gap David flagged session 54.
- **Booths view on-device verification** (~5 min HITL) — the one deferred check from session 54. Sign in at staging URL with `david@zenforged.com`, confirm the Booths view unhides. Technically closes Task 10 even if folded into session 55's workflow.
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision (masthead → inline under hero banner).
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 + 44–53 tombstones only; session-54 block paste-over-ready.
- **Design agent principle addition** (~10 min, docs only) — "reconciliation of a second glyph/affordance is part of the same scope." `MASTER_PROMPT.md` Design Agent section (session-45 retrospective).
- **MASTER_PROMPT.md KNOWN PLATFORM GOTCHAS update** (~10 min, docs only) — add session-52 Gmail `position: absolute` stripping + session-54 "new Supabase project requires Authentication → URL Configuration before first magic-link test."
- **`docs/share-booth-build-spec.md` consolidation** (~15 min, docs only) — merge v2 + v3 + v4 addendums.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min).
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).

### Session 55 opener (pre-filled — Feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding — populate 10–15 real posts across 2–3 vendors, drafted on staging first, then promoted to prod. Session 54 stood up a staging environment end-to-end (`d8a10f9`); staging is the safety net for this content pass. Shape: build `scripts/seed-content.ts` helper (mirrors `seed-staging.ts` shape, accepts `--env-file` to target staging or prod), David supplies photos + copy for fixtures, review on staging device-first, then promote to prod. This is the final V0 → V1 prep piece before the first beta vendor invite. Estimated 30–60 min depending on David's photo/copy prep velocity. Fold in the deferred Booths-view verification from session 54 if the email rate-limit has cleared.
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

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — *explicit next session (55)*. 10–15 real posts across 2–3 vendors. DB still clean-slate. Staging now stood up (session 54) so content can be drafted there first, reviewed on device, then promoted to prod via the same script. See CURRENT ISSUE above for session-55 shape.
- **Staging Supabase OTP email template paste** — session 54 discovered staging is sending Supabase's default generic confirmation emails, not the branded template from `docs/supabase-otp-email-templates.md`. HITL paste into staging Supabase → Authentication → Email Templates for parity. ~15 min. Non-gating; magic-link delivery works either way.
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — fourteen candidates queued, two promotion-ready: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding (one firing), (f) session-45 Supabase nested-select explicit-columns (one firing), (g) **session-46 script-first over SQL-dump-first in Claude Code — second firing session 48 (promotion-ready)**, meta-workflow rule, may belong in `MASTER_PROMPT.md`, (h) **session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`** (one firing), (i) **session-51 email template parity audit — second firing session 52 (promotion-ready)**, belongs in `MASTER_PROMPT.md` under Design Agent or a new Docs Agent section, (j) **session-52 Gmail-hostile primitives list** (one firing) — running list: `position: absolute`, `position: relative` with `overflow: hidden` clipping, SVG `<rect>`/`<circle>` tracking-pixel-shaped children, CSS `transform: rotate` (stripped by Outlook); belongs in `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS, (k) **session-53 commit-design-records-in-same-session** (one firing) — when a sprint-sized infra/architecture decision is made in a review pass, commit the decision record in the session that executes the first task, not later. Meta-workflow rule. (l) **NEW session-54 capture-initial-schema-as-001-before-claiming-migrations-from-scratch** (one firing) — D2(b) was designed to surface exactly this and did; prod's base tables were hand-created in Supabase dashboard on day one and never committed. Going forward: any "fresh env bootstrap" claim requires a verified-replayable schema file in `supabase/migrations/001_*.sql`. (m) **NEW session-54 env-var-checklist-must-enumerate-every-NEXT_PUBLIC** (one firing) — branch-scoped staging env-var specs must list every `NEXT_PUBLIC_*` the app reads, not just DB + email keys. I missed `NEXT_PUBLIC_ADMIN_EMAIL` + `NEXT_PUBLIC_SITE_URL` in session 54's Task 6 spec; fallback-to-hardcoded-default caused the Booths view admin gate to trip unexpectedly. (n) **NEW session-54 new-Supabase-project-must-set-Auth-URL-Configuration-before-first-magic-link** (one firing) — fresh Supabase projects default Site URL to `http://localhost:3000`; first magic-link test fails with "site can't be reached" unless Site URL + Redirect URLs are configured first. Belongs in any future "new Supabase project HITL checklist" + `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS. Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. ~40 min.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail; sessions 44–53 now also tombstone-only in this file. Session-53 tombstone added this session; session-54 block is paste-over-ready until the session-55 close replaces it here. ~30 min batch to backfill archive detail from tombstones + git log.
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

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass; session 46 re-passed T4d QA walk + qa-walk.ts script; session 47 fixed vendor onboarding hero image gap; session 48 fixed featured-banner RLS drift; session 49 shipped /shelves v1.2 redesign + QR code share + copy polish; session 50 shipped Q-008 shopper Window share + guest edit-pencil fix; session 51 PASSED Q-008 QA walk 5/5 + scoped Q-011 as Design session; session 52 shipped Q-011 in 4 iterations; session 53 closed Q-011 loop (4/4 clients PASSED on device) + Ladder B first half shipped (CI + scripts + beta plan + design record in commit `44b4c79`); session 54 shipped Ladder B second half — staging Supabase provisioned, schema captured as `001_initial_schema.sql`, seed script + env template + gitignore shipped in commit `d8a10f9`, staging URL live, on-device sign-in confirmed. Next natural investor-update trigger point is after feed content seeding (session 55)** — the update would then honestly report the full pre-beta polish arc (sessions 42–55) as complete, with staging infra in place and content populated for a first V1 beta invite.

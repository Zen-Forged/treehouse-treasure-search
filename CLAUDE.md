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

## ✅ Session 53 (2026-04-24) — Q-011 v4 QA walk PASSED + Ladder B first half shipped

Two loops closed. Q-011 moved from "shipped but unverified" to "verified on device across every client that mattered"; Ladder B moved from "design discussion stuck in session-51 chat" to "decision record + CI + package scripts + beta plan committed to main." One commit `44b4c79` landed — the Q-011 walk was verification and produced no code. First Claude Code session to exercise the session-open + session-close slash commands end-to-end.

**Q-011 v4 on-device QA walk — CLOSED (4/4 clients PASS):**

- Gmail web (proven v2.0 / v2.1 failure client) — PASS
- iOS Gmail (proven v2.0 / v2.1 failure client) — PASS
- iOS Mail (baseline) — PASS
- Apple Mail (macOS desktop, baseline) — PASS

v4 design verified faithful in the wild: no shell masthead, invite line + IM Fell 34px vendor name flow as one phrase, banner + 2-cell info bar render as one unified rounded frame, "Explore the booth" full-width green button directly under info bar, tile grid naked (no "THE WINDOW" eyebrow), no orphan closer, subject + preheader + opener all share the phrase "A personal invite to explore {vendor}". The Q-011 arc that started session 41 Scenario 1 QA walk (original post-it diagnosis) and re-expanded session 51 Design review (4-axis brand drift) is now fully closed after four code iterations + four-client on-device verification. Q-011 moves to ⏸️ Superseded; `docs/mockups/share-booth-email-v4.html` transitions from "current mockup" to "design-history reference."

**Commit landed:**

1. `44b4c79` **chore(ladder-b): session 53 — CI workflow + package scripts + beta plan + design record** — four additive artifacts, zero code or runtime changes. Build + typecheck both clean pre-commit.
   - **`.github/workflows/ci.yml`** — typecheck + lint + build on every PR + push to `main`/`staging`. Complements the path-gated `comp-eval.yml` (reseller pipeline only). No secrets needed — `lib/supabase.ts` has placeholder fallbacks and `adminAuth.getServiceClient` reads env at function scope, so build-time static generation succeeds with an empty env. Live side-effect: the workflow triggers on this very commit, giving it a free first live-test against main before session 54 opens.
   - **`package.json` scripts** — adds `typecheck`, `qa-walk`, `inspect-banners`, `test:filters`, `test:query-builder`, `test:comps`. Surfaces existing utilities without adding a `tsx` devDependency (keeps the `npx tsx` convention from the existing comp-eval workflow).
   - **`docs/beta-plan.md`** (thin, per D4-a) — V0→V1→V2→V3 rollout cadence, severity-tiered rollback criteria (🔴 halt + revert / 🟡 halt invites + investigate / 🟢 log + fix forward), direct-to-David feedback loop at N=1–5 with a Tally upgrade trigger at N≥3.
   - **`docs/ladder-b-design.md`** — decision record for D1(a) + D2(b) + D3(a) + D4(a), session 53 shipped task table, session 54 queued task table (Tasks 5–10, ~60 min HITL-heavy), non-goals table. Prevents re-deriving Ladder B if session 54 opens cold.

**Ladder B design decisions locked (`docs/ladder-b-design.md`):**

- **D1(a)** — classic promotion ladder. Feature → PR to `staging` → merge → staging URL; staging → PR to `main` → merge → production. Matches David's mental model + gives a stable staging URL for beta-vendor dry-runs.
- **D2(b)** — fresh staging Supabase project; replay migrations forward; seed via script. Exercises the migrations-from-scratch path as a beta-readiness check. True isolation from day one. Trade-off accepted: no real-data edge cases until V1.
- **D3(a)** — minimum CI: typecheck + lint + build on every PR/push. E2E deferred until a regression motivates it. Existing path-gated `comp-eval.yml` still runs; two typechecks on comp-pipeline PRs is cheap insurance.
- **D4(a)** — thin beta plan. One page, three sections. Upgrade trigger: first time the thin plan is insufficient in a specific, not drifty, moment.

**Session 54 queued (Ladder B second half, HITL-heavy, ~60 min):**

- Task 5 🖐️ HITL — create staging Supabase project in dashboard (name: `treehouse-treasure-search-staging`)
- Task 6 🖐️ HITL — wire staging env to `staging` branch in Vercel dashboard (URL + anon + service role + site URL scoped to Preview + branch filter)
- Task 7 🟢 AUTO — replay migrations against staging
- Task 8 🟢 AUTO — write `scripts/seed-staging.ts` (mirrors `qa-walk.ts` shape)
- Task 9 🟢 AUTO — write `.env.staging.example`
- Task 10 🖐️ HITL — smoke-test the staging deploy

**Key working-pattern observation (not promoted this session):**

The session-51 chat Ladder B discussion was never committed — it lived only in Claude Chat conversation history, which is why session 53's sprint brief opened with "I don't have that context" as an open question. `docs/ladder-b-design.md` corrects that: when a sprint-sized infra decision is made in a review pass, the decision record gets committed in the SAME session that executes the first task. Otherwise a future Claude (or David in 3 months) opens cold with "what was decided?" and has to reconstruct. Not promoted as a Tech Rule this session (needs a second firing), but worth remembering: infra design that lives only in chat is a liability.

**Tech Rule promotion state unchanged this session:** email template parity audit still promotion-ready (second firing session 52, no new firing this session since Q-011 closed clean); script-first rule still promotion-ready; Gmail-hostile primitives list still at first firing. Batch is the same ~40 min exercise it was at session 52 close.

**No memory updates this session.** David's Claude Code + automation-preference memories remained load-bearing; no new user / feedback / project facts surfaced that weren't already captured in `docs/ladder-b-design.md` or `docs/beta-plan.md`.

---

## Archived: Session 52 tombstone

- **Session 52** (2026-04-24) — Q-011 Window email redesign shipped in 4 iterations / 4 commits (`5c21b90` v2 banner redesign per mockup v2.2 → `efbf222` fix Gmail `position:absolute` strip → `1abcba2` v3 info bar pivot retiring the post-it → `d9279e9` v4 simplified button-forward with masthead retired and full-width green CTA). Four mockup artifacts produced; scope pivoted twice (medium-change + content-change); every iteration was mockup-mediated before code touched disk (session-28 rule confirmed 4×). Two Gmail-hostility discoveries: `position: absolute` stripping (stronger than session-51's SVG-rect filtering). Tech Rule candidates queued: email template parity audit (2nd firing, promotion-ready), Gmail-hostile primitives list (1st firing). Word "Window" retired from user-facing copy (internal identifiers only). Zero on-device QA that session — that's what session 53 closed.

---


## CURRENT ISSUE
> Last updated: 2026-04-24 (session 53 close — Q-011 v4 QA PASSED 4/4 + Ladder B first half shipped)

**Status:** `44b4c79` on main. Session 53 landed two things: (1) Q-011 v4 on-device QA walk PASSED 4/4 clients (Gmail web, iOS Gmail, iOS Mail, Apple Mail) — Q-011 loop fully closed after four iterations + four-client verification. (2) Ladder B first half shipped — one commit, four additive artifacts (`ci.yml` + `package.json` scripts + `docs/beta-plan.md` + `docs/ladder-b-design.md`). DB clean-slate persists; beta invites remain technically unblocked. Vercel CLI still not globally installed; workaround `npx vercel@latest --prod` still standing.

### 🚧 Queued for session 54 — Ladder B second half (HITL-heavy, ~60 min)

Execute Tasks 5–10 from `docs/ladder-b-design.md` §Session 54 task list:

**Task 5 🖐️ HITL — Create staging Supabase project.** David in Supabase dashboard. Name: `treehouse-treasure-search-staging`. Region: match prod. Copy URL + anon key + service role key into a scratchpad for Task 6.

**Task 6 🖐️ HITL — Wire staging env to `staging` branch in Vercel.** David in Vercel dashboard → Project → Settings → Environment Variables. Scope `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (staging URL), and `RESEND_API_KEY` (reuse prod — Resend sends work the same) to `Preview` env with branch filter `staging`. Admin + other vars unchanged across envs.

**Task 7 🟢 AUTO — Replay migrations against staging.** Run migrations in `migrations/` in order against staging via SQL editor or a helper script. Flag any drift.

**Task 8 🟢 AUTO — Write `scripts/seed-staging.ts`.** Reusable fixture seed. Creates 1–2 test vendors, 1 admin user, 5–10 posts, 1 featured banner. Mirrors `scripts/qa-walk.ts` shape (service role client + console tables). Idempotent.

**Task 9 🟢 AUTO — Write `.env.staging.example`.** Mirrors `.env.example` with staging-specific commentary. `.env.staging.local` gitignored.

**Task 10 🖐️ HITL — Smoke-test staging deploy.** Push to `staging` branch, confirm Vercel auto-deploys, open on device, run `npm run qa-walk -- baseline` against staging env.

**Gate to close Ladder B:** after session 54 passes, V0 → V1 gate in `docs/beta-plan.md` opens (one week of quiet before V1 invite).

### Alternative next sessions (if David wants to redirect from Ladder B session 54)

- **Feed content seeding** (~30–60 min) — carried forward sessions 44–53. DB clean-slate persists. Best AFTER Ladder B second half lands (so seeding exercises the staging environment, not prod).
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision.
- **Tech Rule promotion batch** (~40 min) — **eleven candidates queued** (session-53 adds "commit-design-records-in-same-session" — NEW, first firing). Two promotion-ready: email-template-parity-audit (2nd firing session 52) + script-first-over-SQL-dump (2nd firing session 48). Plus session-52 Gmail-hostile primitives list (1st firing).
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 + 44–52 one-liner only; session-53 block is paste-over-ready after the session-54 close replaces it here.
- **Design agent principle addition** (~10 min, docs only) — "reconciliation of a second glyph/affordance is part of the same scope." `MASTER_PROMPT.md` Design Agent section (session-45 retrospective).
- **MASTER_PROMPT.md KNOWN PLATFORM GOTCHAS update** (~10 min, docs only) — add the session-52 hard-won "Gmail strips `position: absolute` from inline styles (web + iOS); any overlap primitive will die on Gmail" fact alongside existing Safari/ITP, Supabase RLS, Vercel, Next.js 14 gotchas.
- **`docs/share-booth-build-spec.md` consolidation** (~15 min, docs only) — the v2 + v3 + v4 addendums are easier to read merged than stacked now that Q-011 QA is closed.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min).
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).

### Session 54 opener (pre-filled — Ladder B second half)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Ladder B second half per docs/ladder-b-design.md §Session 54 task list (Tasks 5–10). Session 53's first half shipped in 44b4c79 (ci.yml + package scripts + beta-plan.md + ladder-b-design.md). HITL-heavy: David creates staging Supabase project in dashboard (Task 5), wires Preview env vars scoped to `staging` branch in Vercel dashboard (Task 6). Claude handles migration replay (Task 7), writes scripts/seed-staging.ts (Task 8), writes .env.staging.example (Task 9). Close with on-device smoke test: push to staging branch, confirm Vercel auto-deploys, run `npm run qa-walk -- baseline` against staging env (Task 10). Estimated ~60 min if dashboards cooperate. Gate to V1 beta invite opens after this lands cleanly.
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

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — 10–15 real posts across 2–3 vendors. DB is clean-slate after session-46 post-walk cleanup. Natural pairing with beta invite prep. Session 44's `<AddBoothInline>` primitive + session 45's cross-mall fix + delete feature + claimed-vendor safety gate mean admin can now seed + iterate on booths directly from `/shelves` without touching Supabase. Session 46 re-confirmed the onboarding path end-to-end. Session 48 restored Home Featured Find + Find Map hero banner reads, so a populated feed will render with full chrome. *Recommended as session 49.*
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — eleven candidates queued, two promotion-ready: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding (one firing), (f) session-45 Supabase nested-select explicit-columns (one firing), (g) **session-46 script-first over SQL-dump-first in Claude Code — second firing session 48 (promotion-ready)**, meta-workflow rule, may belong in `MASTER_PROMPT.md`, (h) **session-48 RLS-safety-net policy alongside any `DISABLE ROW LEVEL SECURITY`** (one firing), (i) **session-51 email template parity audit — second firing session 52 (promotion-ready)**, belongs in `MASTER_PROMPT.md` under Design Agent or a new Docs Agent section, (j) **session-52 Gmail-hostile primitives list** (one firing) — running list: `position: absolute`, `position: relative` with `overflow: hidden` clipping, SVG `<rect>`/`<circle>` tracking-pixel-shaped children, CSS `transform: rotate` (stripped by Outlook); belongs in `MASTER_PROMPT.md` KNOWN PLATFORM GOTCHAS, (k) **NEW session-53 commit-design-records-in-same-session** (one firing) — when a sprint-sized infra/architecture decision is made in a review pass, commit the decision record in the session that executes the first task, not later. Session 51 chat Ladder B design was never committed; session 53 corrected by writing `docs/ladder-b-design.md` alongside the session-53 code artifacts. Meta-workflow rule, may belong in `MASTER_PROMPT.md`. Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. ~40 min.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail; sessions 44–52 now also tombstone-only in this file. Session-52 tombstone added this session; session-53 block is paste-over-ready until the session-54 close replaces it here. ~30 min batch to backfill archive detail for 28–38 + 44–52 from tombstones + git log.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.
- **`/admin` UI `auth.users` delete reliability** — session 46 observed that David's UI-driven delete of Ella's auth user didn't stick (row persisted until force-deleted via admin API). Not blocking; worth investigating if it recurs. ~20–30 min spike.

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

"Claim this booth," QR-code approval, **Universal Links (gating Q-006 deep-link CTA)**, native app eval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

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

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass; session 46 re-passed T4d QA walk + qa-walk.ts script; session 47 fixed vendor onboarding hero image gap; session 48 fixed featured-banner RLS drift; session 49 shipped /shelves v1.2 redesign + QR code share + copy polish; session 50 shipped Q-008 shopper Window share + guest edit-pencil fix; session 51 PASSED Q-008 QA walk 5/5 + scoped Q-011 as Design session; session 52 shipped Q-011 in 4 iterations — four commits, four mockups, scope pivoted twice (info bar + button-forward simplification); session 53 closed Q-011 loop (4/4 clients PASSED on device) + Ladder B first half shipped (CI + scripts + beta plan + design record in one commit `44b4c79`). Next natural investor-update trigger point is after Ladder B second half lands (session 54: staging Supabase + Vercel env wiring) + feed content seeding (session 55)** — the update would then honestly report the full pre-beta polish arc (sessions 42–55) as complete rather than partial.

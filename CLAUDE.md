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

Tell Claude: "close out the session" then run `thc`.

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

## ✅ Session 46 (2026-04-22) — T4d pre-beta QA walk PASSED end-to-end + `scripts/qa-walk.ts` QA utility shipped + docs drift patched

First Claude Code (terminal) session after 45 sessions in Claude Chat (browser). The context shift changed what "efficient" looks like: the Chat-era workflow had David copy-pasting SQL queries into Supabase SQL Editor and pasting screenshots back into the conversation between every HITL step. Code's direct Bash access eliminates that — so the session's first real shipment was an automation primitive that collapsed ~15 back-and-forth SQL lookups into a single reusable helper.

### Shipment 1 — `scripts/qa-walk.ts` (new durable QA utility)

**Not previously extant.** Subcommands: `baseline` (runs all four T4d-prereq SQL snapshots as a single console-table dump), `check <boothNumber>` (vendors + vendor_requests + posts at that booth), `check-email <email>` (vendor_requests + auth.users + linked vendors for an email), `cleanup <booth1> <booth2> ...` (dry-run default; flags `--confirm` to execute, `--force-claimed` to bypass the user_id safety gate for pre-confirmed test data, `--delete-auth=<email>,<email>` to also remove named auth users — refuses `NEXT_PUBLIC_ADMIN_EMAIL` by hardcoded guard).

Env loading: reads `.env.local` from either cwd or the parent repo path at `/Users/davidbutler/Projects/treehouse-treasure-search/.env.local` (explicit fallback matters because worktrees don't carry gitignored env files). Uses `@supabase/supabase-js` with the service-role key — no new deps. Pattern matches existing `scripts/test-query-builder.ts` (npx tsx invocation).

**Why this was the right shape:** David explicitly asked mid-walk, "How can I automate this more in terms of looking up what's in Supabase etc? There is a lot of back and forth I've been having to do and this is my first session in Claude Code coming from operating in Claude Chat. I know I'll need to do the pre-seeding but it's getting to be a lot." The one-shot instinct was to dump SQL into fenced blocks for manual execution; the right instinct in Claude Code is to write the helper, run it via Bash, report the output. Saved as feedback memory so future sessions default to script-first, not SQL-dump-first, when Supabase/Resend/Anthropic/Vercel SDK access is available locally.

### Shipment 2 — T4d pre-beta QA walk re-executed, all five exit criteria PASSED

Last passed sessions 40–41. Session 44 + 45 touched `/shelves` + `<AddBoothInline>` + `/api/admin/vendors` + `components/BoothPage.tsx` — outside the T4d re-walk trigger list technically (`/vendor-request`, `/api/admin/vendor-requests`, `/api/setup/lookup-vendor`, `/my-shelf`, `lib/activeBooth.ts`), but `<AddBoothInline>` is the Flow 1 landing surface now, so a precautionary re-walk was the right call before feed seeding.

**Pre-walk state audit surfaced three surprises the original baseline CLAUDE.md framing missed:**
1. Session 45 seeded an Ella Butler test vendor at booth 345 (non-AAM mall) with 6 substantive real-Claude-captioned posts live on the feed, unmentioned in CLAUDE.md's "DB is empty and clean-slate safe" framing. Posts were verification artifacts for the session-45 cross-mall fix. Cleaned at walk start.
2. A claimed "Test" vendor at booth 001 linked to David's personal Gmail auth user (`dbutler80020@gmail.com`), created today at 15:03 UTC — leftover from an earlier test sign-in. Personal Gmail auth user preserved per David's explicit call; vendor row cleaned.
3. David's UI attempt to delete Ella's auth user didn't stick — the row persisted in `auth.users`. Force-deleted via Supabase admin API. Root cause not investigated (not session-46 scope).

**Flow results** (all five passed):
- **Flow 1** (admin pre-seed at `/admin`) — booth 999 / `user_id: null` / `slug: qa-walk-booth-999` / AAM mall_id `19a8ff7e-` ✓. David flagged mid-walk that the hero booth photo upload step isn't in the runbook — session-44 addition drift. Patched in Shipment 3.
- **Flow 2** (vendor-present onboarding, `+qa@gmail.com` alias at booth 888) — request → approval → OTP → sign-in → publish in ~5 min (Sprint 4 target: under 10 min). Auth user created on OTP, vendor row linked on `/setup`, post published with caption "Brass bald eagle figurine sculpture" (real-Claude specificity, no mock fallback, no amber "Couldn't read this image" banner). Session-27 `source: "claude"` field is API-response only, not a DB column — verified indirectly via caption specificity.
- **Flow 3** (vendor-initiated, `+qa3@gmail.com` alias at booth 777, booth_name "The Velvet Cabinet" ≠ first+last "Flow Three") — the **critical KI-006 test point**. `/api/setup/lookup-vendor` composite-key `(mall_id, booth_number, user_id IS NULL)` succeeded, no 404, session-35 rewrite held. `display_name` stayed "The Velvet Cabinet" (booth_name priority, session-32).
- **Multi-booth M.1-M.4** (same `+qa3` email, second booth 778 "The Velvet Cabinet - Second Shelf") — dedup landed on "created" state (confirmed per-`(email, mall_id, booth_number)` composite per session-35 migration 007). Second vendor row `user_id` populated on next `/my-shelf` visit (lookup-vendor claim path). `<BoothPickerSheet>` rendered, switching booths re-rendered banner, post from second-booth context landed with `vendor_id = 8bd6f388-` (778), NOT 777 — session-36 `detectOwnershipAsync` multi-booth path held.
- **Ambient clean signals** — zero console errors on any flow, zero RLS silent empty returns, two auto-captions both specific real-Claude output (no mock collapse).

**Walk artifacts at exit** (all subsequently cleaned via `cleanup ... --confirm`):
- 2 posts ("Brass bald eagle figurine sculpture", "Hand-carved wood figural sculpture")
- 4 vendor rows (booths 999, 888, 777, 778)
- 3 vendor_requests
- 2 auth users (`+qa`, `+qa3` aliases)
- Admin (`david@zenforged.com`) + personal Gmail (`dbutler80020@gmail.com`) auth users untouched throughout

### Shipment 3 — Docs drift patches

- `docs/pre-beta-qa-walk.md` §1.1-1.2 updated: hero booth photo dropzone added to the "Expected form shape" list, hero photo upload added as step 4 of the fill sequence (bumping "Tap Add booth" to step 5), two new red flags added (dropzone missing, hero photo upload fails / no 4:3 preview). Header footnote added documenting the session-46 `scripts/qa-walk.ts` automation.
- `CLAUDE.md` this session block + session 45 tombstoned below + CURRENT ISSUE updated + KNOWN GAPS adjusted for T4d re-pass + `scripts/qa-walk.ts` reference added.

### Self-audit against Tech Rules

- **File-creation verify** — `scripts/qa-walk.ts` confirmed on disk via `ls` before edits. ✓
- **Env loading in scripts** — explicit dual-path fallback (cwd + parent repo absolute) handles the worktree case cleanly. ✓
- **Destructive operation safeguards** — cleanup defaults to dry-run, `--confirm` required, `--force-claimed` required to bypass safety gate, `--delete-auth=` hardcoded to refuse `NEXT_PUBLIC_ADMIN_EMAIL`. Three-layer defense against blast radius. ✓
- **Service-role-only access** — script uses `auth: { persistSession: false, autoRefreshToken: false }` on the client builder. ✓
- **Runbook trigger-list drift** — session 46 exposed that session-37's T4d trigger list (`/vendor-request` / `/api/admin/vendor-requests` / `/api/setup/lookup-vendor` / `/my-shelf` / `lib/activeBooth.ts`) doesn't capture `<AddBoothInline>` surface moves between `/admin` and `/shelves`. Not promoted to a Tech Rule yet — one firing, watching for a second.

### Tech Rule candidates queued by this session

1. **Script-first over SQL-dump-first in Claude Code** (session-46 observation, meta-workflow). When working in Claude Code with SDK access to the data source (Supabase, Resend, Anthropic, Vercel), default to writing a small reusable helper script in `scripts/` instead of emitting SQL/commands for manual execution. Reserve SDK-dumping for true one-offs that won't recur. Saved as user-feedback memory. Promotion candidate — but this is more of a Claude Code operating principle than a project Tech Rule.

### Risk Register updates

- T4d pre-beta QA walk staleness — ✅ Re-passed session 46 (refreshes sessions 40–41 pass)
- KI (new) — session 45 seeded test data (Ella booth 345 + 6 posts) went undocumented in CLAUDE.md's clean-slate framing — ✅ Resolved session 46 (cleaned); noted as a rule candidate: when a session seeds content during a shipment, add a one-liner to CLAUDE.md's CURRENT ISSUE so the next session doesn't trip on it
- `/admin` UI delete of `auth.users` rows may not persist — 🟡 Observed session 46 (Ella's delete didn't stick); worth investigating as a session-47+ spike if it happens again
- Runbook drift (hero photo missing in §1.2) — ✅ Resolved session 46

### Session 46 close HITL

Single commit covers all three shipments. Worktree branch: `claude/jovial-mccarthy-69951d`. Push to origin, then decide whether to merge to `main`.

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search/.claude/worktrees/jovial-mccarthy-69951d && git add -A && git commit -m "feat(qa-walk): scripts/qa-walk.ts utility + T4d walk PASSED session 46 + runbook hero-photo patch" && git push
```

After push, merge-to-main HITL is a separate step (worktree branch → main). Not destructive — standard PR merge.

---


## CURRENT ISSUE
> Last updated: 2026-04-22 (session 46 close — T4d walk PASSED end-to-end, `scripts/qa-walk.ts` shipped, docs drift patched)

**Status:** Single session-46 commit pending on worktree branch `claude/jovial-mccarthy-69951d` (see commit command in session-46 close block above). After push, merge-to-main HITL is a separate step. Beta invites remain technically unblocked — session 46's T4d re-walk refreshes the sessions 40–41 pass and confirms session 44–45's `/shelves` + admin-API churn didn't regress anything. DB is clean-slate after post-walk cleanup; no test debris remaining. Feed content seeding carries forward from sessions 43–45 as the highest-leverage remaining pre-beta item.

**Claude Code context note (durable):** David transitioned to Claude Code (terminal) this session after 45 sessions in Claude Chat. `scripts/qa-walk.ts` is the persistence of the automation preference that surfaced mid-session — future Supabase/Resend/Anthropic/Vercel lookups should prefer script-based automation over SQL-dump-for-manual-execution. Saved as user + feedback memory for session 47+ opening-standup awareness.

### Recommended next session — feed content seeding (~30–60 min)

Unchanged from sessions 44–45. Session 46 did not dislodge it; it strengthened the seeding workflow by re-validating the full end-to-end onboarding path.

Seeding scope:
- Create 2–3 real (non-test) vendors via `/shelves` Add-a-Booth (primary path, sessions 44–45). `/vendor-request` → `/admin` approve flow remains available for Flow 3 if desired.
- Seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home."
- Photos should be real items, ideally spanning a few material categories (glass, ceramic, brass, wood) to make the feed feel varied on first scroll.
- Verify the feed, Find Map, and mall pages all render well with the new population.
- Light QA: ensure the session-27 `source: "claude" \| "mock"` field returns `"claude"` for all auto-caption calls. (Session 46 verified this via caption specificity — "Brass bald eagle figurine sculpture" and "Hand-carved wood figural sculpture" were both real Claude output. Seeded real finds should look similar.)

This session is likely to first trip session-43 Anthropic auto-reload (threshold $10 / reload $20). Expected and non-blocking. Session 46 made 2 caption API calls (Flow 2.4 + M.4 posts), each ~1¢ — basically noise against the balance.

**When a session seeds content during a shipment, add a one-liner to CLAUDE.md's CURRENT ISSUE so the next session doesn't trip on it** — session-46 audit rule candidate (the Ella Butler / booth 345 surprise). Not promoted as a Tech Rule yet, but the next seeding session should honor this.

### Alternative next sessions

- **Q-008** 🟢 (~90–120 min) — Open Window share to unauthenticated shoppers. Scope-expansion sibling to Q-009 (shipped session 45).
- **Q-011** 🟢 (~60–90 min) — Window email banner post-it missing/misplaced (email-rendering diagnostic).
- **Q-002** 🟢 (~20 min) — Picker affordance placement revision.
- **Tech Rule promotion batch** (~40 min) — now **seven** candidates queued:
  - sessions 33, 35, 36, 38 dependency-surface family
  - session-40 React 19 ref-forwarding (one firing)
  - session-45 Supabase nested-select explicit-columns (one firing)
  - **session-46 script-first over SQL-dump-first in Claude Code** (one firing, NEW — but this is a meta-workflow rule, may belong in `MASTER_PROMPT.md` rather than `DECISION_GATE.md`)
  - session-42 verify-remaining-count (still below two-firings-outside-same-context bar)
- **Session-archive drift cleanup** (~30 min) — sessions 28–38 carry one-liner summaries but no archive detail. Session 45's block was folded into its tombstone at session-46 close; the block-as-paste-over option is no longer available for 45 specifically, so its archive entry needs to be written from the tombstone + git log. Session 46's detail is in this whiteboard block above and is paste-over-ready.
- **Design agent principle addition** (~10 min, docs only) — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. Would go in `MASTER_PROMPT.md`'s Design Agent section.
- **`/admin` UI `auth.users` delete reliability spike** (~20–30 min) — session 46 observed that David's UI-driven delete of an `auth.users` row didn't stick. Not blocking, but worth investigating if it recurs.
- **Error monitoring** (Sentry or structured logs) — Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **`/admin` v0.2 → v1.2 redesign pass** (Sprint 5+, size L) — still queued; needs design scope first.

### Session 47 opener (pre-filled for feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Working directory: /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding per CLAUDE.md recommendation. Scope: (1) create 2–3 real (non-test) vendors via /shelves Add-a-Booth (session 44+45 primary path) or /vendor-request → /admin approve flow (Flow 3); (2) seed 10–15 finds across those vendors, mostly available status with 1–2 "found a home"; (3) verify feed, Find Map, mall pages render well with new population; (4) light QA that session-27 `source: "claude"` field returns clean on all auto-caption calls (session-46 precedent: "Brass bald eagle figurine sculpture" quality bar). This session will likely first trip session-43 auto-reload (threshold $10 / reload $20); expected and non-blocking. ~30–60 min. Session 46 shipped scripts/qa-walk.ts — use `npx tsx scripts/qa-walk.ts baseline` at open if any pre-existing test debris suspected.
```

---

## Archived session summaries

> Sessions 34–45 kept as one-liner tombstones. Full detail in `docs/session-archive.md` (or in session-blocks that are queued for eventual archive-drift cleanup).

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

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. No code-level regressions. Beta invites remain technically unblocked after session 46.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **Feed content seeding** — 10–15 real posts across 2–3 vendors. DB is clean-slate after session-46 post-walk cleanup. Natural pairing with beta invite prep. Session 44's `<AddBoothInline>` primitive + session 45's cross-mall fix + delete feature + claimed-vendor safety gate mean admin can now seed + iterate on booths directly from `/shelves` without touching Supabase. Session 46 re-confirmed the onboarding path end-to-end. *Recommended as session 47.*
- **Error monitoring** (Sentry or structured logs). Sprint 3 carryover.
- **Beta feedback mechanism** (Tally.so link).
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — seven candidates queued: (a) session-33 dependent-surface audit, (b) session-35 half-migration audit, (c) session-36 new-consumer-on-old-select audit, (d) session-38 verify-landing-surface-before-declaring-scope-closed, (e) session-40 React 19 ref-forwarding (one firing), (f) session-45 Supabase nested-select explicit-columns (one firing), (g) **session-46 script-first over SQL-dump-first in Claude Code** (one firing, NEW — meta-workflow, may belong in `MASTER_PROMPT.md`). Session-42 verify-remaining-count still below the two-firings-outside-same-context bar. ~40 min.
- **Design agent principle addition** — "When a second instance of a glyph/affordance is introduced, the reconciliation is part of the same scope, not a later cleanup." Session-45 retrospective. ~10 min docs only. Goes in `MASTER_PROMPT.md` Design Agent section.
- **Session-archive drift cleanup** — sessions 28–38 carry one-liners but no archive detail; sessions 44–45 now also tombstone-only in this file. Session-46's block was paste-over-ready at close but is still in this whiteboard pending eventual archive migration. ~30 min batch to backfill archive detail for 28–38 + 44–45 from tombstones + git log; 46 stays ready-to-paste until the session-47 close replaces it here.
- **`/api/suggest` SDK migration or delta note** — session 43 confirmed this route is the only AI route still on raw `fetch` rather than the Anthropic SDK. Not beta-gating; reseller-intel only. Optional future cleanup.
- **`/admin` UI `auth.users` delete reliability** — session 46 observed that David's UI-driven delete of Ella's auth user didn't stick (row persisted until force-deleted via admin API). Not blocking; worth investigating if it recurs. ~20–30 min spike.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** 🟢 — Open share to unauthenticated shoppers (scope expansion). ~90–120 min.
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** 🟢 — Window email banner post-it placement (email-rendering bug). ~60–90 min.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). ~20 min.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. **Session 45 note:** `/shelves` still has the session-44 chrome mismatch (v1.1k `<AddBoothInline>` primitive inside v0.2 Georgia + legacy `colors.*` surface). Same Sprint 5+ redesign that folds `/admin` should fold `/shelves`.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence.
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
- `docs/mockups/share-booth-email-v1.html` — reference for Q-011 if post-it bug needs mockup diff.
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — keep until Q-008/Q-011 ship (each references it). Q-009 shipped session 45 so its reference weight dropped.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; session 42 cleared DB test data; session 43 audited AI model surface + locked in billing safeguards; session 44 restored `/shelves` Add-a-Booth primitive; session 45 shipped the cross-mall fix + admin delete + Q-009 admin share bypass + retired the BoothHero URL share to resolve the two-airplane confusion; session 46 shipped `scripts/qa-walk.ts` + re-passed T4d pre-beta QA walk end-to-end. Next natural investor-update trigger point is after feed content seeding (session 47)** — the update would then honestly report the full pre-beta polish arc (sessions 42–47) as complete rather than partial.

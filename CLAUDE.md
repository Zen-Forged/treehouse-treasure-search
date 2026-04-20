## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
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
| Multi-booth rework — dev handoff (archived after session 35 shipped) | `docs/multi-booth-build-spec.md` (mockup at `docs/mockups/my-shelf-multi-booth-v1.html`) |
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

## ✅ Session 34 (2026-04-20) — multi-booth scoping: mockup approved, Path A committed

Scoping session. Option A (drop `vendors_user_id_key`) chosen over Option B (`vendor_memberships` join table). Mockup approved at `docs/mockups/my-shelf-multi-booth-v1.html`. Build spec written at `docs/multi-booth-build-spec.md` as explicit dev-handoff doc. Q-001 (KI-006 Path B surgical hotfix) captured in `docs/queued-sessions.md` as the backup plan. No code; session-32 v1.2 code remained uncommitted on disk, to be bundled with session 35.

Full session notes archived. Superseded by session 35 ship.

---

## ✅ Session 35 (2026-04-20) — multi-booth rework shipped + KI-006 resolved

Shipped. Everything from the session-34 build spec executed end-to-end, with two mid-session follow-up fixes for the same class of bug (half-migration return-shape cardinality). Session-32 v1.2 onboarding backlog bundled into the push. Six-step on-device QA walk passed fully.

### What shipped

**Schema (2 migrations, both 🖐️ HITL applied):**

- `supabase/migrations/006_multi_booth.sql` — drops `vendors_user_id_key`. One auth user can now own N vendor rows. Three unique constraints remain on `vendors`: `vendors_pkey`, `vendors_slug_key`, `vendors_mall_booth_unique`.
- `supabase/migrations/007_multi_booth_vendor_request_dedup.sql` — rekeys the session-32 dedup partial unique index from `(lower(email))` to composite `(lower(email), mall_id, booth_number)`, `WHERE status = 'pending'`.

**New lib + component:**

- `lib/activeBooth.ts` (NEW) — resolver module. Exports `getActiveBoothId`, `setActiveBoothId`, `clearActiveBoothId`, `resolveActiveBooth(vendors)`. Uses `safeStorage` key `treehouse_active_vendor_id`. Deterministic fallback: stored id match → else `vendors[0]` (oldest-by-created_at) with storage rewrite.
- `components/BoothPickerSheet.tsx` (NEW) — bottom-sheet picker inheriting `<MallSheet>` motion/chrome. Booth name leads (IM Fell 17px bold), mall + booth number subtitle (FONT_SYS 13px). X-glyph per locked hierarchy. Active row paper-wash bg + green ✓. Dashed "+ Add another booth" routes to `/vendor-request?email=<encoded>`.

**`lib/posts.ts`:**

- `getVendorsByUserId(userId): Promise<Vendor[]>` — array return, ordered `created_at ASC`. Authoritative auth-linked lookup for multi-booth.
- `getVendorByUserId` kept as `@deprecated` shim returning `rows[0] ?? null` with a `console.warn`. Retirement scheduled after one full session with no warn hits during QA.

**`/api/setup/lookup-vendor` full rewrite — this is where KI-006 dies:**

Composite-key lookup on `(mall_id, booth_number, user_id IS NULL)` across every non-rejected `vendor_requests` row for the authenticated user's email. Links all unlinked matches in one UPDATE + returns the full linked set. Response shape: `{ ok, vendors: Vendor[], alreadyLinked? }`. Idempotent — safe to call every `/my-shelf` load. The stale `display_name == vendor_requests.name` join is gone entirely.

**Surface updates:**

- `app/setup/page.tsx` — handles array response, writes `treehouse_active_vendor_id` to `vendors[0].id`, preserves 401 retry+backoff (session 10), adapts copy singular↔plural ("your shelf" / "your shelves") + quiet FONT_SYS booth list.
- `app/my-shelf/page.tsx` — list-aware via `getVendorsByUserId` + `resolveActiveBooth`. When `vendors.length > 1`: masthead renders "Viewing · [Booth Name] ▾" variant, `<BoothPickerSheet>` instantiated. Self-heal runs on **every non-admin load** — `getVendorsByUserId` + `/api/setup/lookup-vendor` raced via `Promise.allSettled` and merged by vendor id, so newly-approved unlinked booths get linked automatically on the next visit.
- `app/post/preview/page.tsx` — identity resolves via `getVendorsByUserId + resolveActiveBooth`. No in-flow picker (single-path for the 99% case). Admin `?vendor=id` impersonation preserved. LOCAL_VENDOR_KEY unauth fallback preserved.
- `app/api/vendor-request/route.ts` — dedup pre-check widened from `(lower(email), status)` to `(lower(email), mall_id, booth_number, status)`. Same email + different booth now proceeds correctly.

### Session-32 v1.2 onboarding backlog (bundled into the session-35 push)

All of session 32's uncommitted code pushed alongside session 35: `lib/email.ts` rewrite, `/api/vendor-request` full route rewrite, `/vendor-request` page split-name + booth-name + proof-photo form, `/api/admin/vendor-requests` display_name priority, `/admin` VendorRequest interface + thumbnail, `docs/supabase-otp-email-templates.md`, `docs/onboarding-journey.md` v1.2 update, `docs/mockups/email-v1-2.html`. No split commit — one unit per the session-34 build spec's instruction.

### Three commits, bisectable

- `54ba898` — session 35: multi-booth rework (option A) + KI-006 fix + session 32 v1.2 onboarding backlog
- `aa94656` — session 35 fix: self-heal runs for all signed-in non-admin users on /my-shelf
- (third SHA) — session 35 fix 2: remove lookup-vendor short-circuit so multi-booth add-on approvals link

### On-device QA walk — all six steps passed

1. ✅ Single-booth unchanged (masthead reads "Treehouse Finds", no chevron, identical to pre-session-35)
2. ✅ KI-006 verified (fresh Flow 3 with `booth_name` set links cleanly, `/my-shelf` shows correct display_name)
3. ✅ Multi-booth appearance (picker masthead renders when `vendorList.length > 1`, sheet shows both rows)
4. ✅ Switch persistence (picker tap → page re-renders against new booth; navigating away and back stays on the switched booth)
5. ✅ Post inherits active booth (add-find → `/post/preview` PostingAsBlock reflects currently-active booth)
6. ✅ Composite dedup (same email+mall+booth → "We already have you"; same email+different booth → proceeds to "You're on the list")

### Mid-session debugging — lessons

Two follow-up fixes were needed before the walk passed clean. Both were the **same class of bug**:

- `/my-shelf` resolver short-circuited on `vendors.length > 0` → self-heal never fired for users with one linked + one newly-approved-unlinked booth. Fix: always run the self-heal for non-admin users; merge with direct DB read.
- `/api/setup/lookup-vendor` short-circuited on "any already-linked vendor row" → steps 2–5 of the pipeline (which do the composite-key match + link) never executed for multi-booth add-on. Fix: remove the step-1 short-circuit; let the pipeline run idempotently (steps 3–4 naturally skip already-linked rows via `.is("user_id", null)`; step 5 returns the full set).

Both bugs were vestiges of the single-vendor-per-user mental model. The array-return shape was migrated correctly; the control-flow assumptions around "any result = fully resolved" were not. Queued as Tech Rule candidate **"half-migration audit when changing return-shape cardinality"** in `docs/DECISION_GATE.md`. Natural batch-mate with the session-33 **"dependent-surface audit when changing a field's semantic source"** candidate (the original KI-006 cause). Both pending promotion in a dedicated Tech Rule batch session.

### Non-gating follow-ups captured (not blocking beta)

**Q-002** 🟢 — **Picker affordance placement revision.** On-device David surfaced that the masthead center slot reads as app branding ("Treehouse Finds") and the picker affordance should be inline with the booth name under the hero banner instead. This is a mockup revision per the session-28 mockup-wins rule — the session-34 mockup put the affordance in the masthead, we built to that, now it's a directional refinement with low cost. Runnable session scoped in `docs/queued-sessions.md`.

**Q-003** 🟢 — **BottomNav `flaggedCount` missing on `/my-shelf`, `/flagged`, `/shelves`.** Prop defaults to 0; only Home wires it. Two-line fix per page, reference implementation is `app/page.tsx`. Natural batch-mate with Q-002 — one combined session, ~30 min.

Both captured in `docs/queued-sessions.md`, logged on the Risk Register, noted in `docs/known-issues.md` Deferred. Multi-booth is a minority use case in beta, David confident both can wait.

### Session 35 close HITL

1. 🖐️ **Commit doc sweep:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "docs: session 35 close — multi-booth rework shipped, KI-006 resolved, Q-002/Q-003 logged" && git push
```

This picks up CLAUDE.md, CONTEXT.md, `docs/DECISION_GATE.md`, `docs/known-issues.md`, `docs/queued-sessions.md`. The three code commits already pushed during the session.

2. 🟢 **Post-push sanity:** Vercel dashboard shows the docs commit landed (no-op deploy is fine; docs don't affect the build).

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 35 close — multi-booth shipped, KI-006 resolved)

**Status:** Session 35 ships. Sprint 4 tail batch is the longest-parked pre-beta item. Q-002 and Q-003 are small, scoped, and ready to run. Next session picks one or batches them.

### Recommended next session — Sprint 4 tail (T4c + T4b + T4d)

The longest-parked pre-beta item, untouched since session 26. Now cleaner to run than before because `/admin/login` is a dedicated real route (session 23/25) and the multi-booth rework absorbed `/setup` copy polish as part of its `/api/setup/lookup-vendor` rewrite (T4c orphan partially done).

**Remaining T4c copy polish:**
- Minor `/api/setup/lookup-vendor` error copy review (session-35 rewrite may already have this — re-read before editing)
- `/vendor-request` v1.2 success-screen copy review (sessions 32 + 35 changed the surrounding behavior; verify the copy still fits)

**T4b admin surface consolidation:**
- Fold `/shelves` `AddBoothSheet` into `/admin` Vendors tab (or retire — remaining decision)
- Retire the public `/login` page admin PIN affordance leftover (already done in v1.1k session 23?) — verify
- Decide `/admin/login` disposition (keep dedicated / fold into `/admin` unauth gate) — documented as T4b open decision

**T4d pre-beta QA pass:**
- End-to-end dry run of all three onboarding flows (Flow 1 pre-seeded, Flow 2 demo, Flow 3 vendor-initiated) against session-35 schema
- Test data cleanup — multiple "David Butler" variants + test booths in DB from session 30+ testing

### Alternative next sessions (if Sprint 4 tail isn't the right call)

- **Q-002 + Q-003 batch** — ~30 min total. Picker placement inline refinement + BottomNav badge propagation. Low-cost polish, feels satisfying to ship.
- **Tech Rule promotion batch** — ~25 min. Two queued candidates (session-33 dependent-surface audit + session-35 half-migration audit) ready for prose treatment and block insertion in `docs/DECISION_GATE.md`. Natural moment because both landed this week.
- **Anthropic model audit + billing safeguards (33B)** — ~30 min. Grep for stale model strings; verify Anthropic account auto-reload is on.

### Session 36 opener (pre-filled for whichever direction picks up)

If Sprint 4 tail:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Sprint 4 tail batch — T4c remainder (copy polish on /api/setup/lookup-vendor error states + /vendor-request success screens, re-read session-35 changes first), T4b admin surface consolidation (fold /shelves AddBoothSheet, verify /admin/login disposition, retire the legacy public /login admin PIN affordance if still present), T4d pre-beta QA walk of all three onboarding flows (Flow 1 pre-seeded, Flow 2 demo, Flow 3 vendor-initiated) against the session-35 schema. Also clean up test data (multiple "David Butler" variants + test booths from session 30+ on). This is the longest-parked pre-beta item.
```

If Q-002 + Q-003 batch:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Running queued batch — Q-002 (picker affordance placement: masthead reverts to "Treehouse Finds" single-variant, chevron moves inline next to the IM Fell 28px booth name under the hero banner on /my-shelf when vendorList.length > 1; also update docs/mockups/my-shelf-multi-booth-v1.html) + Q-003 (pass flaggedCount to BottomNav on /my-shelf, /flagged, /shelves per the app/page.tsx reference pattern). Both defined in docs/queued-sessions.md. One combined session, ~30 min. No server/schema changes.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty at session 35 close. Multi-booth data model and KI-006 both resolved this session.)*

### 🟡 Remaining pre-beta tech work

- **Sprint 4 tail batch** (longest-parked): T4c remainder (copy polish — partly absorbed by session-35 rewrites, re-verify), T4b (admin surface consolidation + `/admin/login` disposition decision), T4d (pre-beta QA walk).
- **Test data cleanup** — multiple "David Butler" variants + test booths in production DB.
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotion batch** — two queued candidates ready for prose: (a) session-33 "dependent-surface audit when changing a field's semantic source" (original KI-006 cause), (b) session-35 "half-migration audit when changing return-shape cardinality" (the two short-circuit bugs this session). ~25 min. Block location in `docs/DECISION_GATE.md` > The Tech Rules section.

### 🟡 Session 35 non-gating follow-ups (captured in `docs/queued-sessions.md`)

- **Q-002** 🟢 — Picker affordance placement revision (masthead → inline under hero banner). Mockup update + surgical `/my-shelf` edit. ~20 min.
- **Q-003** 🟢 — `<BottomNav>` `flaggedCount` prop on `/my-shelf`, `/flagged`, `/shelves`. Two-line fix per page. ~15 min. Natural batch-mate with Q-002.

### 🟡 Sprint 5 + design follow-ons

- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). Multi-booth makes this richer — per-booth editing possible now.
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB).

### 🟡 Sprint 3 leftovers pending beta invites

- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage across upload surfaces
- Feed content seeding (10–15 real posts)
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, Universal Links, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration** (if/when co-ownership or role-based permissions become a real roadmap item — multi-vendor-per-booth rather than multi-booth-per-vendor). Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal, Find Map crop visibility on post-publish surfaces.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim (loud `console.warn`, no callers expected). Schedule cleanup pass after N+1 sessions confirm no warn hits during QA.
- Cloudflare nameservers dormant (no cost)
- `/shelves` AddBoothSheet — retire decision lives in T4b
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- `docs/design-system-v1.2-draft.md` (tombstone; retire now that v1.2 shipped)
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`, `email-v1-2.html` — can retire now that v1.2 polish + onboarding are in ✅
- `docs/mockups/my-shelf-multi-booth-v1.html` — keep until Q-002 updates it (then retire)
- `docs/multi-booth-build-spec.md` — archived reference; consider folding key decisions into CONTEXT.md and retiring the file post-Q-002
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- `/post` redirect shim — can delete entirely post-beta once inbound references are audited
- `docs/queued-sessions.md` Q-001 — already retired as ⏸️ Superseded (session 35 close)

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

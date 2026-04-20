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
| **Multi-booth rework — dev handoff spec for session 35** | `docs/multi-booth-build-spec.md` (mockup at `docs/mockups/my-shelf-multi-booth-v1.html`) |
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

## ✅ Session 32 (2026-04-20) — v1.2 onboarding refresh shipped

Full rework of Flow 3 (`/vendor-request`) and all three onboarding emails. Triggered by David's on-device test observations: (1) vendor requests were getting an email template on v0.2 card chrome, (2) Email #2's clickable CTA broke PWA session continuity because iOS Safari opens the link outside the installed PWA, (3) the vendor's full name was showing as their booth name with no choice at request time and no post-approval edit, (4) no protection against duplicate email requests (bad-actor surface + ops confusion), (5) IM Fell English editorial font was too ornate to read cleanly, especially at small sizes. Session addressed 1-4 directly; 5 logged as a dedicated Sprint 5 item and retired from the emails as a first step.

**What changed:**

1. **Name split + booth name.** `/vendor-request` now captures `first_name` + `last_name` (side-by-side) and an optional `booth_name` field (helper: "Leave blank to use your name"). At approval, `vendors.display_name` resolves via priority: `booth_name` → `first_name + ' ' + last_name` → legacy `name`. Schema migration `supabase/migrations/005_vendor_request_onboarding_refresh.sql` adds the three new columns + `proof_image_url`.

2. **Booth photo required (Model B).** New field on `/vendor-request`: "Show us your booth — a photo of your sign, your name tag, or anything with your booth number visible." Wide-shot commitment + verification gesture. Uploaded to `site-assets` bucket under `booth-proof/<timestamp>-<random>.<ext>`, URL stored on `vendor_requests.proof_image_url`. Admin UI renders a 56×56 thumbnail on each request row, tap opens full photo in new tab. Serves three purposes: (a) bad-actor defense (requires physical booth access), (b) real commitment gesture from the vendor, (c) Day-1 content against the empty-shelf problem David noticed in the wild.

3. **Email dedup.** `POST /api/vendor-request` pre-checks `lower(email)` against existing `pending`/`approved` rows before insert. Structured status response lets the client render in-place warm states without duplicate inserts or duplicate emails:
   - `status: "created"` → check glyph, "You're on the list."
   - `status: "already_pending"` → clock glyph, "We already have you."
   - `status: "already_approved"` → clock glyph, "You're already in." + "Sign in to your booth →" link
   DB safety net: partial unique index `ON (lower(email)) WHERE status='pending'`. 23505 race between pre-check and insert caught in-route and normalized to `already_pending` response.

4. **Emails on v1.1l paper + all-Georgia.** All three templates moved off v0.2 white-card chrome onto paper-as-surface (`#e8ddc7`). **IM Fell English retired from every email template** — brand lockup, eyebrows, signatures now all Georgia. Safest across every mail client (Outlook/Gmail strip external font loads), zero external font request, fastest render. Paired with a Sprint 5 typography reassessment for the rest of the app.

5. **Email #1 copy refreshed.** Salutes by `first_name` ("Hi Sarah" vs "Hi Sarah Morrison"). Acknowledges the photo ("Thanks — we got your booth photo and details."). Drops the visit implication from the old "We'll take a look at your booth at X" copy.

6. **Email #2 CTA retired (PWA session-continuity fix).** Old `[Sign in to your booth →]` link opened a Safari tab on iPhones with the PWA installed, breaking session continuity. New copy: "To sign in, open **Treehouse** on your phone, tap **Sign In**, and enter this email:" with the email address echoed in a copyable `<span>` pill. Vendor opens the PWA themselves — no cross-context redirect.

7. **Email #3 (Supabase OTP) template refreshed.** Same paper-surface shell as #1 and #2. `{{ .Token }}` in a selectable pill, `user-select: all` for iOS long-press-to-copy. Canonical HTML lives in `docs/supabase-otp-email-templates.md`. 🖐️ HITL: paste into both Supabase Dashboard → Auth → Email Templates → Magic Link AND Confirm Signup.

**Files touched:**
- `supabase/migrations/005_vendor_request_onboarding_refresh.sql` (NEW)
- `lib/email.ts` (rewrite — all-Georgia, paper surface, `firstName` payload, Email #2 de-linked)
- `app/api/vendor-request/route.ts` (rewrite — dedup, photo upload, split fields, structured status response)
- `app/vendor-request/page.tsx` (rewrite — split name row, booth name, photo field, three done states)
- `app/api/admin/vendor-requests/route.ts` (updated — booth_name priority in display_name, first_name salutation to approval email)
- `app/admin/page.tsx` (updated — VendorRequest interface gains new fields, 56×56 photo thumbnail in request rows, booth_name priority in card rendering)
- `docs/supabase-otp-email-templates.md` (NEW — canonical OTP template HTML with HITL paste instructions)
- `docs/onboarding-journey.md` (updated — Flow 3 diagram rewritten for v1.2, Email matrix copy refreshed, data-shape decisions revised, Sprint 5 items logged)
- `docs/mockups/email-v1-2.html` (NEW — approved mockup)

**Note (added session 34):** Session-32 code is still uncommitted on disk. Session 35 will bundle the v1.2 onboarding commit with the multi-booth rework commit in a single push. No separate session-32 close required.

### Session 32 Tech Rule candidates (unchanged)

**Hallucinated-state pattern when files have session markers.** I opened this session certain the files were in pre-v1.2 state; when I read them they already had session-32 headers. Two possible causes: (a) prior work in a parallel session, (b) model confabulation of what I "expected" to see. Either way, the mitigation is the same: **before writing any file in a session, re-read with a small `head` or narrow `view_range` rather than trusting earlier in-session reads.** Session-25's file-creation-verify rule already covers new-file writes; this pair-rule covers edits of existing files. Log as a promotion candidate for session 33's Tech Rule batch.

**MCP `filesystem:read_text_file` `view_range` is sometimes ignored.** Observed session 32: requested range `[195, 215]` returned the entire file. Not a blocker — just know that `head`/`tail` are reliable but `view_range` isn't. Prefer `head` + second read with `tail` when you need a middle slice. Minor ergonomics note, not a Tech Rule.

---

## 📍 Session 33 (2026-04-20) — v1.2 QA walk, two findings, pivot point

**Intent:** QA walk on session-32 v1.2 onboarding refresh.

**What went well:**
- Session-32 close HITL fully landed (migration 005 applied, Supabase OTP templates pasted into both Magic Link + Confirm Signup). Confirmed at standup.
- Walk steps 1–5 all passed: fresh Flow 3 submission with all fields including booth_name + photo, Email #1 receipt on v1.2 paper+Georgia template, dedup resubmit showed "We already have you" correctly, admin approval showed 56×56 photo thumbnail tappable to full photo, Email #2 approval arrived with no clickable CTA and the email echo pill rendering correctly.
- v1.2 onboarding refresh infrastructure is confirmed working end-to-end through admin approval.

**What didn't — two findings logged, neither fixed this session:**

**KI-005 (Low severity, deferred to Sprint 5):** Pre-approval sign-in signaling gap. Pending vendor taps Sign In at `/login` before admin approval — page doesn't recognize the in-flight request, sends an unnecessary OTP, vendor lands on `/my-shelf` `<NoBooth>` state. Soft recovery, not a flow failure. Predates session 32 (not a regression). `/login` is a 🔴 STOP surface per Decision Gate so the fix needs its own session. Natural Sprint 5 batch-mate to "Curator Sign In" rename + `/welcome` landing. Full scope + fix shape in `docs/known-issues.md` → KI-005.

**KI-006 (HIGH severity, pre-beta blocker, open):** Session-32 regression in `/api/setup/lookup-vendor`. The route matches `vendor_requests.name` against `vendors.display_name`. These no longer match after the session-32 approval priority change (`booth_name → first+last → name`) — so any Flow 3 vendor who fills in `booth_name` cannot complete `/setup` linkage. OTP verifies cleanly, session establishes, lookup-vendor returns 404, `/my-shelf` renders `<NoBooth>`. Vendor is stranded. **Walk step 6 caught this on-device.** Currently half of all new v1.2 vendors cannot onboard.

**What David named at session close (BIGGER than KI-006):**

Multi-booth vendors. Real reseller operations — same person holds Booth 369 at America's Antique Mall AND Booth 42 at Peddlers Mall AND potentially a third location. Current data model forbids this via `vendors.user_id UNIQUE`. David's proposed composite identity: **`email + mall_id + booth_number`**.

**Critical observation:** fixing KI-006 in isolation would paper over the wrong model. The right sequence is scope-multi-booth-first, then KI-006 becomes a natural sub-fix of that larger rework rather than a patch on an obsolete model.

### Session 33 Tech Rule candidate

**Dependent-surface audit when changing a field's semantic source.** Session 32 changed the resolution priority for `display_name` (booth_name → first+last → legacy name). Every consumer of the old `name == display_name` equality should have been audited at the time; that didn't happen, and `/api/setup/lookup-vendor` kept the stale join. Rule candidate: when a session changes how a canonical field is derived, grep for every read of the old source field and every write that assumed the old equality, and add those audit hits to the session close HITL.

Log as promotion candidate for session 34 or 35 Tech Rule batch. Sits alongside the session-32 "re-read files before writing" and session-27 "graceful-collapse observability" rules in the same family.

---

## ✅ Session 34 (2026-04-20) — multi-booth scoping: mockup approved, Path A committed

**Intent:** Scope the multi-booth data-model rework per the Path A recommendation from session 33. Joint Product + Design + Dev scoping session; mockup-first per the session 28 Tech Rule.

**Two-path decision at session open.** David confirmed Path A (multi-booth scope first) over Path B (KI-006 surgical hotfix). Before pivoting, his Path B instinct was captured as a runnable queued session — `docs/queued-sessions.md` Q-001 — in case multi-booth scoping later exposes a blocker and we need to buy back v1.2 onboarding for single-booth vendors while the rework continues. Q-001 is currently 🟡 Ready but waiting; it auto-retires as ⏸️ Superseded when session 35 ships.

**Four prior-session decisions confirmed at open:**
- Per-booth `display_name`
- Per-booth picker on `/my-shelf` (not stacked)
- Per-booth bio and hero
- Multiple pending `vendor_requests` per email OK if `(mall_id, booth_number)` differs

**Three scoping-session decisions made before mockup build:**
- Schema mockup shows **both paths side-by-side** (drop UNIQUE vs `vendor_memberships` join table), David decides at review
- Picker style: **bottom sheet** matching `<MallSheet>` primitive (no new pattern invented)
- Single-booth vendors (99% of current users): **picker hidden entirely** — identical to today's UX

**Mockup built — `docs/mockups/my-shelf-multi-booth-v1.html`:**
- Three phone frames: single-booth (unchanged) · multi-booth with active booth in masthead · picker sheet open
- Decisions pane at top (the session 28 Tech Rule pattern — plain-English commitment surface)
- Schema comparison section — Option A (drop UNIQUE, 1 SQL line, ~8 call sites, 1 sprint) vs Option B (`vendor_memberships`, ~40 lines, ~15 files + RLS, 2 sprints) with migration cost + call-site count + session estimate per option
- Surface impact table — every file/route that changes, per-option cost
- Five review questions at the bottom

**Mockup review — David's five answers locked the design:**

1. **Schema path: Option A.** Drop `vendors_user_id_key`. Co-ownership / role-based work not on the roadmap; Option B solves a problem we don't have yet. A→B migration later is known-weight, not a trap.
2. **Masthead affordance approved as drawn** — "Viewing · [Booth Name] ▾" in the center slot, entire block is the tap target.
3. **Sheet row hierarchy good as drawn** — booth name leads (bold), mall + booth number as subtitle. David's reframe: "This page is for the Booth owners. It should feel like their page, not the malls page." Booth identity centers the hierarchy.
4. **"Add another booth" inside the sheet** — not a separate settings screen. Keeps the add-flow close to the list.
5. **Pending booths hidden** from the picker until approved. Reversed from Frame 3's "Small Town Finds · Pending" row — final behavior filters unapproved requests out before they reach the sheet.

**Build spec written — `docs/multi-booth-build-spec.md`:**

Per the session 28 mockup-first Tech Rule, the build spec is an explicit dev-handoff document, not a decision document. Front-matter states so: *"If this spec and the mockup ever disagree, the mockup wins."* David doesn't read the build spec; session 35 Claude does.

The spec covers:
- Migration 006 (drop `vendors_user_id_key`) + Migration 007 (rekey session-32 dedup to `(lower(email), mall_id, booth_number) WHERE status='pending'`)
- `lib/posts.ts` rename: `getVendorByUserId` → `getVendorsByUserId` (array return) with deprecated wrapper during transition
- `lib/activeBooth.ts` (NEW) — active-booth resolver via `safeStorage` key `treehouse_active_vendor_id`
- `/my-shelf` list-aware rewrite with conditional masthead + sheet when `vendors.length > 1`
- `<BoothPickerSheet>` (NEW) inheriting `<MallSheet>` motion + chrome
- `/api/setup/lookup-vendor` full rewrite to composite-key lookup with array return — **this is where KI-006 dies as a natural sub-fix**
- `/setup` client page handles array response
- `/post` + `/post/preview` read active booth via resolver (no in-flow picker — single-path for the 99% case)
- `/api/vendor-request` dedup widens to `(lower(email), mall_id, booth_number, status)`
- 15-step execution order with 🖐️ HITL markers for build check, both migrations, commit, and on-device QA walk
- Rollback plan documented — migration 006 becomes destructive once a vendor has a second approved row

### Files touched this session

- `docs/queued-sessions.md` (NEW) — register for scoped-but-sequenced work. Q-001 = Path B hotfix.
- `docs/mockups/my-shelf-multi-booth-v1.html` (NEW) — three-frame mockup, schema comparison, surface impact, review questions.
- `docs/multi-booth-build-spec.md` (NEW) — dev handoff for session 35.

**No code written.** Per Path A, this was a scoping session. Session-32 code remains on disk uncommitted; session 35 bundles it with the multi-booth commit in one push.

### Session 34 close HITL

1. 🖐️ **Commit + push all scoping docs:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "session 34: multi-booth scoping — mockup approved, path A committed, Q-001 path B captured" && git push
```

2. 🖐️ **Optional — skim the build spec** (`docs/multi-booth-build-spec.md`) once before session 35 opens. Focus on the execution order (15 steps) and out-of-scope list so you know what's landing. The per-file details are for Claude.

### Session 34 Tech Rule observations (no new candidates)

The session-28 mockup-first pattern continues to pay. Three UI surfaces, one schema decision, and a full build spec produced in one session with zero spec-doc reopens. David's iPhone review took minutes, not hours. Worth noting in the next Tech Rule promotion batch that this pattern has now landed cleanly across sessions 28 (`v1.2` surfaces) and 34 (multi-booth) — strong enough signal to stay the default.

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 34 — multi-booth scoped, Path A committed, build spec ready)

**Status:** Session 35 opens as the multi-booth code sprint. The plan is committed in `docs/multi-booth-build-spec.md` and the mockup at `docs/mockups/my-shelf-multi-booth-v1.html` is the approved source of truth for any UI disagreement.

### Session 35 opener

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Run the session 35 code sprint from docs/multi-booth-build-spec.md. This is the multi-booth data-model rework (Option A — drop vendors_user_id_key). KI-006 dies as a natural sub-fix of the /api/setup/lookup-vendor rewrite. Session-32 v1.2 onboarding code is still uncommitted on disk — bundle it with the session-35 commit and push as one unit. Mockup approval surface: docs/mockups/my-shelf-multi-booth-v1.html. If the mockup and the build spec ever disagree, the mockup wins.
```

### What session 35 will ship (per build spec)

- **2 migrations** — `006_multi_booth.sql` (drop `vendors_user_id_key`) and `007_multi_booth_vendor_request_dedup.sql` (rekey session-32 dedup to composite). Both 🖐️ HITL runs in Supabase Dashboard → SQL Editor.
- **1 new lib module** — `lib/activeBooth.ts` (resolver via `safeStorage`).
- **1 new component** — `<BoothPickerSheet>` inheriting `<MallSheet>` motion/chrome.
- **1 API route rewrite** — `/api/setup/lookup-vendor` full rewrite to composite-key lookup with array return. This is where KI-006 goes away.
- **1 lib rename + shape change** — `getVendorByUserId` → `getVendorsByUserId` (array). Deprecated wrapper during transition.
- **Surface updates** — `/my-shelf` (conditional masthead + sheet when N>1), `/post` + `/post/preview` (active-booth resolver), `/setup` (array response), `/api/vendor-request` (widen dedup).
- **Bundled commit** — session-32 v1.2 onboarding backlog pushes alongside the session-35 multi-booth code. One push, one deploy.

Estimated: one full code sprint + on-device QA walk. Rollback plan in the build spec; migration 006 becomes destructive once a vendor has a second approved row, so the QA walk is mandatory before push.

### Session 35 queue context

**Not in session 35** — explicitly out of scope per build spec:
- Co-ownership / role-based permissions (Option B territory, deferred until roadmap names it)
- Admin UI grouping of same-email requests (optional polish only)
- Per-booth hero/bio edit surface (session-32 deferral; separate sprint)

**Sprint 4 tail batch** (still longest-parked, not touched since session 26):
- 🟡 T4c remainder — error copy polish (note: collides with session-35 `/setup` work, natural to batch if there's time)
- 🟡 T4b admin surface consolidation (~4 hrs, dedicated session)
- 🟡 T4d pre-beta QA pass (~1–2 hrs, after T4b)

**Doc housekeeping carried:**
- 33A — Promote seven Tech Rule candidates
- 33B — Anthropic model audit + billing safeguards

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

- **Multi-booth data model** — scoped session 34 (Option A). Build spec at `docs/multi-booth-build-spec.md`, mockup at `docs/mockups/my-shelf-multi-booth-v1.html`. Code sprint = session 35.
- **KI-006 — `/api/setup/lookup-vendor` stale join against `vendor_requests.name`.** Resolution sequenced via the multi-booth rework in session 35 — the lookup-vendor rewrite with composite-key matching and array return kills KI-006 as a natural sub-fix. Backup plan captured as Q-001 (`docs/queued-sessions.md`) if multi-booth blocks.

### 🟡 Remaining pre-beta tech work

- **Session-32 commit still pending** — code on disk, not pushed. Will be bundled into the session-35 push per build spec.
- **Sprint 4 tail batch** (T4c remainder, T4b admin consolidation, T4d pre-beta QA pass, test data cleanup).
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotions** (33A — seven rules + session-34 observation on mockup-first landing as reliable default). ~25 min.

### 🟡 Sprint 5 + design follow-ons

- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). Multi-booth makes this richer — per-booth editing becomes possible after session 35 ships.
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB).

### 🟡 Sprint 3 leftovers pending beta invites

- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage across upload surfaces
- Feed content seeding (10–15 real posts)
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, Universal Links, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory, **Option B `vendor_memberships` migration** (if/when co-ownership or role-based permissions become a real roadmap item). Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal, Find Map crop visibility on post-publish surfaces.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` (loud `console.warn`, no callers) — session 35 adds one more deprecated wrapper (`getVendorByUserId`), schedule a cleanup pass after N+1 sessions confirm no callers
- Cloudflare nameservers dormant (no cost)
- `/shelves` AddBoothSheet (orphan after T4b)
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- `docs/design-system-v1.2-draft.md` (tombstone; retire now that v1.2 shipped)
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`, `email-v1-2.html` — can retire now that v1.2 polish + onboarding are in ✅
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- Historical mockup HTML files in `docs/mockups/` (retire as versions ship)
- `/post` redirect shim — can delete entirely post-beta once inbound references are audited
- `docs/queued-sessions.md` Q-001 — retire as ⏸️ Superseded after session 35 ships (KI-006 fixed as sub-fix of the multi-booth rework, as predicted)

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

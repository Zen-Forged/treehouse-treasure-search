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

### Session 32 close HITL (in order)

1. 🖐️ **Run migration** — open Supabase Dashboard → SQL Editor, paste the contents of `supabase/migrations/005_vendor_request_onboarding_refresh.sql`, run. Verify with:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendor_requests'
ORDER BY ordinal_position;
```

Should show `first_name`, `last_name`, `booth_name`, `proof_image_url` columns alongside the existing ones. Then verify the partial unique index:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vendor_requests';
```

Should include `vendor_requests_email_pending_idx` with a definition referencing `lower(email) WHERE status = 'pending'`.

2. 🖐️ **Paste Supabase OTP template** — open `docs/supabase-otp-email-templates.md` on disk. Copy the HTML block under "HTML body" into BOTH Supabase Dashboard → Auth → Email Templates → Magic Link AND Confirm Signup. Both templates are separate saves (session-6 gotcha, still holds).

3. 🖐️ **Build check:**

```bash
npm run build 2>&1 | tail -30
```

4. 🖐️ **On-device QA** — walk full v1.2 Flow 3 on iPhone against clean DB:
   - Submit fresh request with photo → receipt email arrives on all-Georgia paper surface
   - Submit again with same email → "We already have you" state renders, no second insert, no second email (verify in Supabase admin)
   - Admin approval from `/admin` → photo thumbnail renders in request row → approve → approval email arrives WITHOUT a clickable CTA
   - Open PWA manually, sign in with that email → OTP email arrives on refreshed template → enter code → `/setup` → `/my-shelf` → `display_name` matches `booth_name` (or first+last if booth_name was blank)

5. 🖐️ **Commit + push:**

```bash
git add -A && git commit -m "session 32: v1.2 onboarding refresh — booth photo + name split + dedup + all-Georgia emails" && git push
```

### Session 32 Tech Rule candidates

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

Multi-booth vendors. Real reseller operations — same person holds Booth 369 at America's Antique Mall AND Booth 42 at Peddlers Mall AND potentially a third location. Current data model forbids this via `vendors.user_id UNIQUE`. David's proposed composite identity: **`email + mall_id + booth_number`**. This is a schema-level question that collides with multiple surfaces: `vendors_user_id_key` constraint, `/my-shelf` single-vendor resolution, `/api/setup/lookup-vendor`, `/post` identity resolution, `/admin` approval flow, `vendor_requests` (can same email have two pending requests?), and session-32's v1.2 dedup logic (which currently collapses any email match to a single pending).

**Critical observation:** fixing KI-006 in isolation would paper over the wrong model. The right sequence is scope-multi-booth-first, then KI-006 becomes a natural sub-fix of that larger rework rather than a patch on an obsolete model.

### Files touched this session

- `docs/known-issues.md` — KI-005 logged with full context
- `docs/DECISION_GATE.md` — Risk Register row added for KI-005

**No code written.** No commits. No push needed at session close beyond doc updates.

### Session 33 close HITL

1. 🖐️ **Commit + push docs:**

```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search && git add -A && git commit -m "session 33: log KI-005 (pre-approval sign-in signaling) + KI-006 (lookup-vendor regression) + multi-booth pivot" && git push
```

2. 🖐️ **Think on multi-booth scope** between sessions. Four questions to answer before session 34 opens:
   - Do multiple booths share one `display_name`, or can each have its own? (Probably per-booth.)
   - Does the vendor see all their booths at once on `/my-shelf`, or pick one as "active"?
   - Shared bio / hero across booths, or per-booth?
   - Can same email have two pending `vendor_requests` for different booths? (Current v1.2 dedup says no — this is the specific session-32 behavior that needs to change.)

### Session 33 Tech Rule candidate

**Dependent-surface audit when changing a field's semantic source.** Session 32 changed the resolution priority for `display_name` (booth_name → first+last → legacy name). Every consumer of the old `name == display_name` equality should have been audited at the time; that didn't happen, and `/api/setup/lookup-vendor` kept the stale join. Rule candidate: when a session changes how a canonical field is derived, grep for every read of the old source field and every write that assumed the old equality, and add those audit hits to the session close HITL.

Log as promotion candidate for session 34 or 35 Tech Rule batch. Sits alongside the session-32 "re-read files before writing" and session-27 "graceful-collapse observability" rules in the same family.

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 33 — v1.2 QA walk deferred at the multi-booth pivot)

**Status:** Session 34 opens with a strategic question, not a code task. David needs to scope the multi-booth data-model rework before KI-006 can be fixed correctly. v1.2 onboarding is 90% confirmed working; the last 10% (post-approval sign-in for any vendor with a `booth_name`) is blocked behind KI-006, and KI-006 is blocked behind multi-booth scoping.

### Session 34 opener — TWO paths depending on where David's thinking has landed

**Path A — Multi-booth scoping session (probably right):**

If David has thought through the four multi-booth questions and wants to scope the rework, session 34 runs as a joint Product + Design + Dev scoping session:
- Review the four open questions
- Draft the schema migration (likely: drop `vendors_user_id_key`, keep `vendors_mall_booth_unique`, consider adding a `vendor_memberships` join table OR allow many vendors per user_id directly)
- Mockup `/my-shelf` booth-picker UX (per mockup-first rule) — does the user see all booths stacked? A picker chip at the top? A bottom sheet?
- Rewrite `/api/setup/lookup-vendor` to return an array, not a single row
- Update session-32 v1.2 dedup to key on `(email, mall_id, booth_number)` instead of `(email, status)`
- Identify which `vendor_requests` columns/constraints need to change
- **No code written session 34.** Output is a scoping doc + schema mockup + UX mockup for David's approval. Dev sprint comes session 35.

**Path B — KI-006 hotfix first, multi-booth later (backup plan):**

If multi-booth scope is too big and David wants v1.2 onboarding fully working in the meantime, session 34 can surgically fix KI-006 in `/api/setup/lookup-vendor` without touching the schema:
- Rewrite the lookup to join on `mall_id + booth_number + user_id IS NULL` as the primary composite, with name fallback matching the session-32 approval priority
- Still single-vendor-per-user at the data layer — multi-booth remains blocked
- ~30 min surgical fix, on-device verify with a booth_name test request, commit, resume QA walk from step 7

**Recommended:** Path A. KI-006 is a symptom; multi-booth is the cure. Shipping the hotfix without the schema rework leaves us patching on an obsolete model and likely needing to re-hotfix when multi-booth lands.

### Walk progress captured

For session 34+ reference, the session-33 walk got through:

| Step | Status |
|---|---|
| Pre-walk build | 🖐️ HITL pending (David never ran it — bash tool can't reach Mac FS) |
| 1. Flow 3 fresh submission | ✅ |
| 2. Email #1 receipt | ✅ |
| 3. Dedup resubmit "We already have you" | ✅ |
| 4. Admin approval + photo thumbnail | ✅ |
| 5. Email #2 approval (no CTA, echo pill) | ✅ |
| 6. PWA sign-in + OTP verify | ❌ KI-006 surfaced |
| 7. `/setup` link + `/my-shelf` display_name | ⏸️ blocked by KI-006 |
| 8. booth_name priority (second fresh Flow 3) | ⏸️ blocked by KI-006 |
| 9. already_approved state | ⏸️ |
| 10. Commit + push | ⏸️ session-32 code still uncommitted on disk |

**Session-32 code is still uncommitted.** Not pushed to GitHub / Vercel. The live site is running the pre-v1.2 code. On-device QA above was against local dev or against a dev-deployed branch; either way, `git push` from session-32 close HITL step 5 was never completed. This is safe — nothing's lost — but session 34 or the hotfix session needs to commit the session-32 code along with whatever fix it ships.

### Session 34 candidate queue (unchanged from session 33 standup unless Path A consumes the session)

**Sprint 4 tail batch** (longest-parked, still not started):
- 🟡 T4c remainder — `/api/setup/lookup-vendor` error copy polish (note: now also collides with KI-006 fix territory, natural to batch)
- 🟡 T4b admin surface consolidation (~4 hrs, dedicated session)
- 🟡 T4d pre-beta QA pass (~1–2 hrs, after T4b)
- 🟢 Session-13 test data cleanup

**Doc housekeeping:**
- 33A — Promote seven Tech Rule candidates (six carried from session-32 + new one from session-33 on dependent-surface-audit)
- 33B — Anthropic model audit + billing safeguards

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

- **KI-006 — `/api/setup/lookup-vendor` stale join against `vendor_requests.name`.** Blocks any Flow 3 vendor who uses `booth_name` from completing setup. Not a standalone fix; folded into multi-booth rework scoping.
- **Multi-booth data model** — current schema forbids (`vendors.user_id UNIQUE`). Blocks any vendor with multiple booths across one or more malls. Named by David at session-33 close.

### 🟡 Remaining pre-beta tech work (unchanged from session 32)

- **Session-32 commit still pending** — code on disk, not pushed. Will be bundled with session-34 or hotfix commit.
- **Sprint 4 tail batch** (T4c remainder, T4b admin consolidation, T4d pre-beta QA pass, test data cleanup).
- **Anthropic model audit + billing safeguards** (33B). ~30 min.
- **Tech Rule promotions** (33A — now seven rules). ~25 min.

### 🟡 Sprint 5 + design follow-ons

- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB).

### 🟡 Sprint 3 leftovers pending beta invites

- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage across upload surfaces
- Feed content seeding (10–15 real posts)
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, Universal Links, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal, Find Map crop visibility on post-publish surfaces.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` (loud `console.warn`, no callers)
- Cloudflare nameservers dormant (no cost)
- `/shelves` AddBoothSheet (orphan after T4b)
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- `docs/design-system-v1.2-draft.md` (tombstone; retire now that v1.2 shipped)
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html`, `email-v1-2.html` — can retire now that v1.2 polish + onboarding are in ✅
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- Historical mockup HTML files in `docs/mockups/` (retire as versions ship)
- `/post` redirect shim — can delete entirely post-beta once inbound references are audited

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

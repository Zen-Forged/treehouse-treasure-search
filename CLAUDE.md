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

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 32 — v1.2 onboarding refresh shipped; HITL migration + OTP template paste + build + QA pending)

**Status:** ✅ v1.2 onboarding code is on disk and coherent. Four HITL items remain before the session is fully landed (migration, OTP template paste, build, QA). See "Session 32 close HITL" above.

### Session 33 candidate queue

**Strongly recommended opener — finish session-32 HITL if not yet done:**
- 🖐️ Migration 005 applied in Supabase?
- 🖐️ Supabase OTP templates pasted (both Magic Link + Confirm Signup)?
- 🖐️ `npm run build` green?
- 🖐️ On-device Flow 3 walk passed?
- 🖐️ Committed + pushed?

**If all five are ✅, proceed with:**

**Doc housekeeping (cheap opener):**
- **33A — Promote six Tech Rule candidates** into `docs/DECISION_GATE.md`. ~22 min.
  - From session-29: "secrets scan before commit" (per SECURITY-INCIDENT postmortem)
  - From session-30: file-creation verify immediate (read-after-write for every NEW file); `mkdir -p` flagged upfront for bracket-path routes; stage-machine narrowing cast pattern
  - From session-31E: box-drawing anchors → always full rewrite (not surgical edit)
  - From session-32: hallucinated-state pattern — re-read files before writing even when in-session reads already happened
  - **From session-32 (new, added mid-close):** psql meta-commands (`\d`, `\dt`, `\di`, etc.) don't work in Supabase Dashboard SQL Editor — it speaks Postgres wire protocol, not psql CLI. Use `information_schema.columns` / `pg_indexes` / `pg_tables` queries for schema verification anywhere we'd reach for `\d`. Applies to migration comment footers, docs, and any future HITL verification step.
- **33B — Anthropic model audit + billing safeguards.** ~30 min. Swap `/api/suggest` from Opus 4.6 → 4.7, enable Anthropic console auto-reload, add pre-beta credit floor checklist item.

**Main work — Sprint 4 tail batch (unchanged; now more urgent with v1.2 flow live):**
- 🟡 T4c remainder — `/api/setup/lookup-vendor` error copy polish. ~15 min. (Note: `/vendor-request` success screen copy was resolved by session 32's three-done-state rewrite.)
- 🟡 T4b admin surface consolidation — `/admin/login` disposition, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, Add-Vendor sub-flow mirroring the v1.2 `/vendor-request` form (including booth photo capture). ~4 hrs. **Recommend dedicating a full session to T4b.**
- 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs. **Runs after T4b ships.**
- 🟢 Session-13 test data cleanup — 5+ "David Butler" variants via admin-runbook Recipe 4. ~5 min.

**Recommended batch shape for session 33:** 33A + 33B as ~50-min opener → T4c remainder + test data cleanup as ~20-min sub-batch → leave T4b + T4d for dedicated session 34.

**Sprint 5 candidates (logged session 32):**
- **🔲 Typography reassessment.** IM Fell English's readability tax at 13px italic labels is real. Candidates to evaluate in a dedicated design sprint: EB Garamond, Lora, Fraunces, or all-Georgia. Side-by-side mockup on phone frames. Emails already went Georgia this session as a first step.
- **🔲 Post-approval booth-name edit surface.** Vendors can change `display_name` after approval. Needs a dedicated mini-mockup first, then build on `/my-shelf` title block (likely an inline pencil matching the hero-image edit affordance). Also first caller for the dangling `updateVendorBio` in `lib/posts.ts` — worth co-scoping.
- **🔲 PWA install onboarding.** Upgraded to 🟡 Medium priority post-session-32. The Email #2 de-linking makes this more important, not less — a vendor without the PWA installed has nothing to tap from the approval email; they need to know they should install it.

**Other pending (Sprint 5 + Sprint 6):**
- **`<MallSheet>` migration to `/vendor-request`** (last remaining consumer, deferred since v1.1k).
- **Nav Shelf decision + BottomNav rework** (Sprint 5).
- **Guest-user UX batch** (Sprint 5).

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

_None._ All KIs closed. Design debt empty. v1.2 post-flow trilogy shipped session 30. v1.2 polish pass shipped session 31E. v1.2 onboarding refresh shipped session 32. Last tech work before beta-ready is Sprint 4 tail (open, not a blocker for on-device testing).

### 🟡 Remaining pre-beta tech work

- **Session-32 close HITL** — migration, OTP template paste, build, QA, commit. ~30 min combined.
- **Sprint 4 tail batch** — longest-parked pre-beta item.
  - 🟡 T4c remainder — `/api/setup/lookup-vendor` error copy polish. ~15 min.
  - 🟡 T4b admin surface consolidation — Add-Vendor sub-flow now mirrors v1.2 `/vendor-request` (booth photo capture included). ~4 hrs.
  - 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants. ~5 min.
- **Anthropic model audit + billing safeguards** (session-28G/28H, now 33B). ~30 min combined.
- **Tech Rule promotions** (33A — six rules this time). ~22 min.

### 🟡 Sprint 5 + design follow-ons

- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, **PWA install onboarding (upgraded to 🟡 Medium post-session-32)**, vendor onboarding Loom, bookmarks persistence (localStorage → DB).

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

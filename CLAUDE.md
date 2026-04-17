## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## TERMINAL COMMAND FORMATTING CONVENTION
> Whenever Claude surfaces multiple terminal commands that must be run in sequence, they MUST be broken out into separate code blocks — one command per block. This lets David copy each command individually without accidentally running the next one before verifying the previous succeeded. Applies to deploy checklists, QA sequences, debug scripts, and HITL steps.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

```bash
npx vercel --prod
```

**Not this:**

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
npx vercel --prod
```

Exception: A single chained command with `&&` stays in one block (that's one atomic action by design).

---

## CURRENT ISSUE
> Last updated: 2026-04-17 late-night (session 9 — KI-001, KI-002, KI-003 all resolved; Flow 2/3 onboarding end-to-end verified working; KI-004 approve-endpoint 23505 silent-reuse newly logged; session-9 findings surfaced a small 🟡 `/setup` 401 race worth a polish pass)

**Status:** ✅✅✅ **Session 9 unblocked beta onboarding.** All three session-8 QA issues resolved; end-to-end Flow 2 onboarding verified working on David's iPhone (email CTA → OTP → auto-linked vendor → My Booth renders correctly). One new issue logged (KI-004, approve-endpoint 23505 silent-reuse) — intentionally deferred to a dedicated scoping session per David's call.

### What shipped (4 fixes, 1 commit)
1. **KI-001** (admin PIN → `/admin`) — one-line fix in `handlePin()`
2. **KI-002** (toast centering on /admin) — wrapper-div pattern lifted from /post
3. **KI-003** (onboarding journey broken) — three-part fix:
   - `/login` reads `redirect ?? next` in mount effect + `onAuthChange` (param-name mismatch was the root cause)
   - `/post` no longer falls through to localStorage when signed-in + no DB vendor (kills the "posting as Zen · booth 300" class of symptoms permanently)
   - `/my-shelf` self-heals by calling `/api/setup/lookup-vendor` when signed-in + no linked vendor
4. **Diagnostic logging** added to `lib/adminAuth.ts` `requireAuth()` — logs distinguish 'no bearer token' vs 'getUser rejected token' failure modes. Kept in production (low-noise, future-useful).

---

## 🌱 Next session opener — T4b and polish (READ FIRST)

**Session 9 shipped the critical path. Beta onboarding is no longer blocked.** Remaining Sprint 4 work: T4b (admin surface consolidation), T4d (pre-beta QA pass), plus a handful of polish items and a scoping session for KI-004.

### Recommended Session 10 execution order

1. **🟡 `/setup` 401 race polish** (30 min, optional)
   - Session-9 QA showed `/setup` flashes "Setup Incomplete" briefly before `/my-shelf` self-heal catches it and lands the vendor correctly. The underlying cause is a ~500ms race between `verifyOtp` resolving client-side and Supabase's auth server validating the token server-side.
   - Fix: add a single retry-with-backoff to `setupVendorAccount()` in `app/setup/page.tsx` on 401 response. 800ms wait, then retry once. If still 401, fall through to current error state.
   - Worth doing because the brief "Setup Incomplete" flash is bad UX even though it self-corrects.
2. **KI-004 scoping session** — pre-seeding → claim-booth flow. Per David: "Everything is captured that is available (booth #, mall, booth name). Once I speak with the booth owner or they reach out, I'd add their email and initiate the handoff to them." That's a clean mental model. Needs its own scope-out before code — touches Flow 1 and the approve-endpoint 23505 branch.
3. **T4c remainder** — the session-9 fixes resolved the 🔴 blocking item (KI-003) but several 🟢 S orphan-cleanup items are still open. Bundle into T4b or ship as a follow-up:
   - Remove EmptyFeed "Add a Booth" CTA (routes to /shelves)
   - Gate `/my-shelf` NoBooth "Post a find" button behind `activeVendor !== null`
   - Revise `/api/setup/lookup-vendor` error copy
   - Revise `/vendor-request` success screen copy
   - Retire `/api/debug-vendor-requests` (🟡 security)
4. **T4b — admin surface consolidation** (~4 hours)
   - Add Booth tab in /admin (Flow 1 home)
   - Add Vendor in-person flow in /admin (Flow 2 capture)
   - Remove Admin PIN tab from /login (gate moves behind /admin)
   - Remove admin "Booths" BottomNav tab
   - Remove `AddBoothSheet` from /shelves
5. **T4d — pre-beta QA pass** walking all three flows against the mapped journey

### Stale state from session 9

- **DB orphans** (all `user_id=NULL`, `mall_id=d8d0fed1-...` or America's Antique Mall):
  - `John Doe / booth 1234` (created ~16:31)
  - `Claude Code / booth 123` (created ~16:00)
  - `David Butler / booth 123 / AAM` (session 7-8 residue)
  - These are collision hazards for KI-004. Session 10 should either clean them up via SQL or intentionally use non-colliding booth numbers until KI-004 is scoped.
- **Successful session-9 test vendor** (linked): a `+test3`-style email alias from David's Gmail is now an auth.users + vendor_requests(approved) + vendors(linked) chain. Not colliding with anything, can be left alone or cleaned later.
- **David's iPhone:** currently signed in as the session-9 test vendor. `th_vendor_profile` holds that vendor. Sign out and clear Safari data before Session 10 starts if testing onboarding again.

---

## What was done (this session — 2026-04-17, session 9)

### Phase 1 — Warm-up commit: KI-001 + KI-002 (small, surgical)

**KI-001** — `app/login/page.tsx` `handlePin()` final `router.replace("/my-shelf")` → `router.replace("/admin")`. Preserved the public email-OTP branch's `safeRedirect(?redirect=)` logic unchanged. One-line change with 2-line explanatory comment.

**KI-002** — `app/admin/page.tsx` approval toast rewrapped in the known-good centering pattern. The outer non-animated `<div>` does `position:fixed; left:0; right:0; flex justifyContent:center`, and the inner `<motion.div>` animates only opacity+y. Previous version had `left:50%; transform:translateX(-50%)` directly on the `motion.div` and Framer Motion's y-animation overwrote the centering translate.

Shipped as one commit (`fix(admin): KI-001 PIN redirect to /admin + KI-002 toast centering`). QA'd on device: PIN flow lands on /admin, toast centers on approvals.

### Phase 2 — KI-003 diagnosis

Clean-slate Flow 2 repro against a fresh `+test2`-style Gmail alias revealed two cascading bugs:

**Bug A (primary)** — `/login`'s mount useEffect read `searchParams.get("next")` but the approval email CTA (`lib/email.ts` `sendApprovalInstructions`) uses `?redirect=/setup`. When a user arriving via the approval email already had a persisted Supabase session (iPhone PWA, prior test, etc.), the mount effect fired on load, found the existing session, and immediately `router.replace`d to `/my-shelf` — skipping `/setup` entirely. David's QA repro never saw `/setup` flash on screen, confirming the mount effect was eating the redirect before OTP entry even rendered.

**Bug B (secondary, deferred as KI-004)** — `/api/admin/vendor-requests` approve endpoint's 23505 duplicate-key handler silently reuses an existing `vendors` row on `(mall_id, booth_number)` collision without checking whether that row belongs to a different onboarding. Produces ambiguous state where approval succeeds + email sends + a stale vendor exists that doesn't match the new vendor_request's name — so `/api/setup/lookup-vendor` later can't find a matching unlinked row and returns 404.

Diagnostic SQL against the real DB confirmed Bug B was already in play from earlier session residue: three orphan `vendors` rows (`John Doe/1234`, `Claude Code/123`, `David Butler/123 at AAM`), all `user_id=NULL`.

### Phase 3 — KI-003 three-part fix

**Fix 1 — `app/login/page.tsx`** — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`. Added a 9-line comment block explaining the dual-param history (`next` for magic-link round-trip, `redirect` for approval email CTA) so the next person doesn't re-introduce the mismatch.

**Fix 2 — `app/post/page.tsx`** — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is truthy. Unauth users still get the localStorage path (the "post without account" option is preserved). Signed-in users with no DB-linked vendor now render the `!hasValidIdentity` branch ("Set up your vendor profile" form) instead of silently surfacing whatever stale profile was last written to the device. Permanently eliminates the "posting as Zen · booth 300" symptom class.

**Fix 3 — `app/my-shelf/page.tsx`** — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as a self-heal step before falling through to NoBooth. Makes `/my-shelf` a valid Flow 2/3 landing point even if `/setup` was skipped or raced. Idempotent via lookup-vendor's step-0 short-circuit (already-linked users get their existing row back without re-linking). Imported `authFetch` for the call.

### Phase 4 — `/setup` 401 diagnosis → diagnostic logging

Post-deploy QA surfaced a new symptom: `/setup` flashed briefly then showed "Setup Incomplete" with error text "Unauthorized". Fix #3 (my-shelf self-heal) caught and corrected this on second attempt, so the user ultimately landed on `/my-shelf` with the correct vendor — but the flash is visible bad UX.

Root cause: `/api/setup/lookup-vendor`'s `requireAuth()` call to `service.auth.getUser(token)` is rejecting a freshly-issued OTP token because Supabase's auth-server validation has a ~500ms replication window after `verifyOtp` resolves on the client. The token is valid from the client's perspective (stored directly from the verify response) but not yet validatable from a different server.

Added three targeted `console.error` log lines to `lib/adminAuth.ts` `requireAuth()` covering: (a) service client unavailable, (b) no bearer token on the request, (c) getUser rejecting the token. Pure observability change, no behavior impact. Left in production for future 401 debugging.

Deferred fix: a ~10-line retry-with-backoff in `app/setup/page.tsx` `setupVendorAccount()` on 401 response. Scoped as a 🟢 S polish item for Session 10.

### Phase 5 — End-to-end verification

David's final QA: submitted a fresh `/vendor-request`, admin-approved, tapped the approval email on iPhone, entered OTP, saw `/setup` flash briefly, landed on `/my-shelf` showing the new vendor name + booth + mall correctly. **Flow 2 onboarding end-to-end verified working.** KI-003 closed.

### Phase 6 — KI-004 scope handoff

David's human-side product thinking on the pre-seeding → claim-booth flow: *"Everything is captured that is available (booth #, mall, booth name). Once I speak with the booth owner or they reach out etc., I'd just add their email and initiate the handoff to them so they could manage that booth. But trying to keep this simple for MVP."*

Logged as KI-004 for a dedicated scoping session in the near future. Not urgent — the three DB orphans it protects against are known and avoidable with non-colliding booth numbers during testing.

### Files modified this session
- `app/login/page.tsx` — KI-001 one-liner + Fix 1 mount effect & onAuthChange dual-param read
- `app/admin/page.tsx` — KI-002 wrapper-div pattern for toast
- `app/post/page.tsx` — Fix 2 localStorage guard
- `app/my-shelf/page.tsx` — Fix 3 self-heal + authFetch import
- `lib/adminAuth.ts` — diagnostic logging on 401 branches
- `CLAUDE.md` (this file) — session close
- `docs/known-issues.md` — KI-001/002/003 moved to Resolved; KI-004 added
- `docs/DECISION_GATE.md` — Risk Register updates
- `docs/onboarding-journey.md` — T4c status updated

---

## ARCHIVE — What was done earlier (2026-04-17 late-late evening, session 8)
> Onboarding scope-out + T4a email infrastructure shipped end-to-end

### Phase 1 — Onboarding scope-out (Product Agent, no code)

Per session-7 flag from David: *"first thing in the standup we need to truly scope out the onboarding journey."* Ran the full Product Agent scope-out before any code.

**Outputs:**
- **`docs/onboarding-journey.md`** — new canonical spec. Three flows documented with state diagrams, email matrix, data shape decisions, orphan inventory, re-scoped T4. ~380 lines.
- **Three flows committed:**
  - **Flow 1 — Pre-Seeded (Admin alone):** David seeds booths at malls he has no relationship with. No vendor contact, no auth, no emails. Creates `vendors` rows with `user_id=NULL`. Future Sprint 6+ hook: "claim this booth."
  - **Flow 2 — Demo (Admin + vendor in-person):** admin captures vendor details + approves in same session. Vendor receives both emails (receipt + approval). OTP sign-in. Lands on /setup → /my-shelf.
  - **Flow 3 — Vendor-initiated (remote, async):** vendor submits `/vendor-request` → gets receipt email → admin approves async → vendor gets approval email → OTP sign-in. Same convergence point as Flow 2.
- **Data shape decisions:**
  - `display_name` = public booth name; `vendor_requests.name` = person's name (today's model stands, no migration)
  - Hero photo on `/vendor-request` = email/booth only, no photo upload on public form (admin captures during Flow 2)
  - "Email must match" enforcement pinned to `/api/setup/lookup-vendor` — if no approved request for signed-in user's email, clear error message
- **Orphan inventory (for T4c implementation):**
  - Remove EmptyFeed "Add a Booth" CTA (routes to /shelves — pure orphan)
  - Remove "Admin PIN" tab from `/login` (moves behind /admin)
  - Remove admin "Booths" BottomNav tab (Add-Booth surface lives inside /admin as third tab)
  - Gate `/my-shelf` NoBooth state "Post a find" button behind `activeVendor !== null`
  - Fix `/post` to prefer DB vendor over localStorage (SESSION 8 UPDATE: this one turned out to already be coded correctly — see KI-003 for what's actually wrong)
  - Revise error copy on `/api/setup/lookup-vendor` and `/vendor-request` success
- **Re-scoped T4** broken into:
  - **T4a** (email infra, 3h) — ✅ **shipped session 8**
  - **T4b** (admin surface consolidation, 4h)
  - **T4c** (orphan cleanup + self-heal, 2h) — **now 🔴 blocking, runs before T4b**
  - **T4d** (pre-beta QA pass against mapped journey, 1-2h)

### Phase 2 — T4a email infrastructure ✅ shipped

**New file: `lib/email.ts`** (~260 lines)
- Resend REST API wrapper (no SDK dependency — uses native `fetch`)
- Two exported functions: `sendRequestReceived(payload)`, `sendApprovalInstructions(payload)`
- Best-effort: returns `{ ok: false, error: string }` on failure but never throws — upstream callers log and continue
- No-ops with warning if `RESEND_API_KEY` unset (keeps local dev frictionless)
- From-address: `Treehouse <hello@kentuckytreehouse.com>` (verified via Shopify DNS from session 4)
- Reply-to set to `NEXT_PUBLIC_ADMIN_EMAIL` for vendor replies
- Inline-styled HTML email shell with brand-appropriate warm copy (Georgia serif, parchment bg, green CTA button)
- HTML-escape helper for user-provided name/mall values
- Email masking helper for log lines (redacts local part)

**Wired into: `app/api/vendor-request/route.ts`**
- Calls `sendRequestReceived()` after successful `vendor_requests` insert
- Best-effort: logs via existing `logError()` helper on email failure, still returns 200 OK (vendor_requests row saved, admin can still approve)
- Removed obsolete TODO comment about Sprint 4 Resend integration

**Wired into: `app/api/admin/vendor-requests/route.ts`**
- Calls `sendApprovalInstructions()` after successful vendor row creation + request status flip
- Surfaces email failures via `warning` field on response (existing admin UI toast already renders warnings)
- Collects multiple warnings if both the status update AND the email fail
- Admin approval never fails due to email — vendor exists, status is approved, admin can reach out manually

**Updated: `.env.example`**
- Added `RESEND_API_KEY=` with detailed comment
- Added `NEXT_PUBLIC_SITE_URL=` (previously undocumented, used by `lib/email.ts` for absolute sign-in URLs)

**HITL steps David completed:**
- Created Resend API key scoped to "Sending access" + `kentuckytreehouse.com` domain
- Added `RESEND_API_KEY` to `.env.local` and Vercel (all three environments)
- Verified `kentuckytreehouse.com` domain in Resend dashboard (SPF/DKIM/DMARC all green from session 4's DNS work)
- `npm run build` clean, committed, `git push` triggered Vercel deploy
- **End-to-end QA verified:** Email #1 (receipt) and Email #2 (approval) both arrived in vendor inbox ✅

### Phase 3 — QA issues logged (not fixed this session)

Three issues surfaced during T4a post-deploy QA. All logged to `docs/known-issues.md` with severity, repro, and recommended sprint.

- **KI-001 🟡** Admin PIN redirects to `/my-shelf` (should be `/admin`)
- **KI-002 🟡** Toast not centered on `/admin` (recurring Framer Motion transform-overwrite issue)
- **KI-003 🔴 High** "Posting as Zen · booth 300" still happens post-approval — original hypothesis was `/post` reading stale localStorage, but `/post` already does `getVendorByUserId()` on mount. Real cause unknown; diagnostic question deferred to next session

### Files modified (session 8)
- `docs/onboarding-journey.md` — new (canonical spec)
- `docs/known-issues.md` — new (three issues logged)
- `lib/email.ts` — new (Resend wrapper)
- `app/api/vendor-request/route.ts` — +email call, removed TODO
- `app/api/admin/vendor-requests/route.ts` — +email call, +warnings array
- `.env.example` — +RESEND_API_KEY, +NEXT_PUBLIC_SITE_URL
- `CLAUDE.md` — session close update
- Vercel env vars: RESEND_API_KEY (external, no code)
- Resend dashboard: API key generated (external, no code)

---

## ARCHIVE — What was done earlier (2026-04-17 late evening, session 7)
> Sprint 4 T3 shipped, onboarding fragility exposed, scope-out flagged

### T3 — `/admin` mobile-first approval polish ✅
Rewrote `app/admin/page.tsx` to polish the in-person approval moment. Removed obsolete copy-paste email template flow (dead code: `generateEmailTemplate`, `copyEmailTemplate`, Copy button, Copy import, clipboard branch). Added structured `Toast` discriminated-union with success/error variants, 6s auto-dismiss, spring animation, eyebrow label, Georgia-serif vendor name. Tightened Approve button to 44px iOS thumb-reach minimum. Mid-session copy fix: toast eyebrow corrected from *"✓ Approved · emailed [name]"* (factually wrong — approve sent no email) to *"✓ Approved · ready to sign in"*. The corrected copy was accurate for session 7 but should be revisited post-session-8 T4a — the approve endpoint now DOES send an email, so *"✓ Approved · emailed [name]"* is again accurate. KI-002 (toast centering) was introduced in this session's toast work.

### Database reset — full clean slate
Executed 7-block SQL cleanup (diagnostic → delete posts → vendor_requests → vendors → auth.users except david@zenforged.com → verify counts → verify auth user). Plus storage pass deleting 25 orphaned image files. Post-reset: 1 auth user, 0 vendor_requests, 0 vendors, 0 posts, empty bucket. Corrected stale "Known vendors" entries in this file that had falsely claimed ZenForged Finds #369 and David Butler #963 were linked to auth.

### QA pass findings — three onboarding failures from one clean slate
1. Approve endpoint sent no email (vendor had no organic way to know they were approved)
2. No organic path to `/setup` from `/login`
3. `/my-shelf` showed stale localStorage identity after device cache survived DB reset

These findings drove the session 8 onboarding scope-out. Items 1 and 2 resolved by T4a (session 8). Item 3 re-diagnosed as KI-003 in session 8 — the bug is not where we thought.

---

## ARCHIVE — What was done earlier (2026-04-17 evening, session 6)
> Biggest session 4 unlock so far — two major Sprint 4 items shipped plus meta-agent activation work

### T1 — Custom domain live
`app.kentuckytreehouse.com` live via Shopify DNS CNAME → Vercel. Supabase Auth Site URL + Redirect URLs aligned. Old `.vercel.app` URL remains as secondary.

### T2 — OTP 6-digit code entry
Rewrote `app/login/page.tsx` to make 6-digit code entry the primary auth path. Magic link in same email still works as fallback. New `enter-code` screen: email echo, monospace input with auto-advance/auto-submit/paste-friendly/`autocomplete="one-time-code"`, clipboard paste button, 30s resend cooldown, smart back-button. Redirect preservation from session 5 intact. Admin PIN flow untouched.

### Supabase configuration updates (dashboard-only)
OTP Length: 8 → 6. Branded email templates for Magic Link + Confirm Signup with `{{ .Token }}` in selectable `<code>` element. Known iOS Mail quirk: code is tap-and-hold copyable, not one-tap — paste button counterweight.

### Meta-agent work
Agent roster formalized: ✅ Dev, Product, Docs active. 🔲 Security Sprint 5, Finance/Brand Phase 2. Standup preamble updated.

### Files modified (session 6)
- `app/login/page.tsx` — full rewrite (OTP code entry)
- `docs/DECISION_GATE.md` — agent roster + risk register
- `CLAUDE.md`
- Supabase dashboard, Shopify DNS, Vercel (external)

---

## ARCHIVE — What was done earlier (2026-04-17 late PM, session 5)
> emailRedirectTo fix + strategic Sprint 4+ scoping

`lib/auth.ts → sendMagicLink(email, redirectTo?)` now accepts optional redirect path, appended as `&next=` to confirm URL. `app/login/page.tsx → safeRedirect(next, fallback)` helper validates same-origin relative paths only (rejects absolute URLs, protocol-relative `//evil.com`). Full vendor onboarding verified end-to-end. Two product conversations produced concrete sprint items for 5/6+.

---

## ARCHIVE — Session 4 (2026-04-17 early AM)
> DNS pivot + Resend SMTP + Yahoo magic link verification

Pivoted from Cloudflare migration (Path B) to direct Shopify DNS Resend records (Path A) after discovering Shopify is actually authoritative. Resend → Supabase native SMTP integration. End-to-end Yahoo magic link test passed. Small mid-session data recovery after accidentally deleting a `vendor_requests` row.

---

## ARCHIVE — Session 3 (2026-04-16 late PM)
> Resend account setup + DNS migration decision (later reversed in session 4)

Created Resend account, chose Path B (Cloudflare) based on the incorrect premise that DNS lived at Google Cloud DNS. Session 4 corrected this. Cloudflare nameservers remain dormant at no cost.

---

## ARCHIVE — Session 2 (2026-04-16 PM)
> Setup flow status-filter bug fix — verified end-to-end in session 4

`/setup` rejected approved vendors because `lookup-vendor` filtered `vendor_requests` with `.eq("status", "pending")`. Rewrote to `.neq("status", "rejected")`.

---

## ARCHIVE — Session 1 (2026-04-16 AM)
> RLS-blocked vendor-request flow fix + admin API hardening

Moved `vendor_requests` access from browser anon client (RLS-blocked) to server API routes using service role + `requireAdmin`. Five functions in `lib/posts.ts` marked `@deprecated`.

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

**Operator note:** David Butler is an **online reseller** (Zen Forged LLC, ZenForged Finds online sales). He is not a physical storefront operator at any mall. In-person vendor onboarding sessions are deliberate scheduled meetups, not incidental. This matters for scoping — "in person" is a product choice, not a default.

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated). All onboarding-adjacent work scopes against that document before code.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid icons in ecosystem UI)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_SITE_URL             https://app.kentuckytreehouse.com (for lib/email.ts absolute URLs)
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request)
RESEND_API_KEY                   Server-only Resend API key for lib/email.ts transactional emails (session 8)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

**SMTP note:** Resend SMTP credentials live in Supabase Auth → SMTP Settings (for OTP emails). Resend API key in Vercel env (for `lib/email.ts` transactional emails). Two separate uses of Resend — one via SMTP (Supabase-managed), one via REST API (our code, session 8).

---

## DNS STATE (as of 2026-04-17)

**Registrar:** Squarespace Domains (inherited from Google Domains acquisition in 2023)
**Authoritative nameservers:** Shopify's default nameservers (Shopify manages DNS)
**DNSSEC:** Off

**Live records (via Shopify DNS):**
- A `kentuckytreehouse.com` → `23.227.38.65` (Shopify)
- AAAA `kentuckytreehouse.com` → `2620:0127:f00f:5::` (Shopify IPv6)
- CNAME `www` → `shops.myshopify.com`
- CNAME `account` → `shops.myshopify.com`
- CNAME `app` → `d21d0d632a8983e0.vercel-dns-017.com.` (Vercel — session 6)
- CNAME `h3f._domainkey` → `dkim1.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 1)
- CNAME `h3f2._domainkey` → `dkim2.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 2)
- CNAME `h3f3._domainkey` → `dkim3.fa0cb6bc6910.p371.email.myshopify.com` (Shopify DKIM 3)
- CNAME `mailerh3f` → `fa0cb6bc6910.p371.email.myshopify.com` (Shopify mail routing)
- MX `@` → `mx.kentuckytreehouse.com.cust.b.hostedemail.com` priority 1 (inbound via HostedEmail)
- TXT `_provider` → `shopify`
- TXT `_dmarc` → `v=DMARC1; p=none`
- TXT `@` → `v=spf1 include:_spf.hostedemail.com ~all` (root SPF for inbound)
- TXT `resend._domainkey` → `v=DKIM1; k=rsa; p=MIGfMA0G...` (Resend DKIM, session 4)
- TXT `send` → `v=spf1 include:amazonses.com ~all` (Resend SPF for `send` subdomain, session 4)
- MX `send` → `feedback-smtp.us-east-1.amazonses.com` priority 10 (Resend MX for `send` subdomain, session 4)

**Dormant:** Cloudflare account has nameservers assigned (`marissa.ns.cloudflare.com`, `vin.ns.cloudflare.com`) but is not authoritative. Leftover from session 3's Path B plan. No cost to leaving it in place.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at ✅
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`, routed through Resend SMTP. 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors (as of session 8 close):**
  - `David Butler / booth 123 / America's Antique Mall` — created via T4a end-to-end QA. `user_id` link state unverified (see KI-003 — diagnostic needed). `dbutlerproductions@yahoo.com` is the auth email.
  - `Claude Code / booth 123 / All Peddlers, Louisville` — appears in session 8 screenshot, approved status. `dbutler80020@gmail.com` is the auth email. Link state also unverified pending KI-003 diagnosis.
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch` instead of calling `fetch()` directly to any gated route
- Server: first line of every `/api/admin/*` handler must be `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes (like `/api/setup/*`), use `requireAuth()` instead

**Redirect-preservation pattern (as of session 5):**
- Clients navigating to `/login?redirect=/some-path` have that path preserved across the magic-link round trip via a `next` query param
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` accepts the path; appends as `&next=<encoded>` to the confirm URL
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only — rejects absolute URLs and protocol-relative (`//evil.com`)

**Email pattern (as of session 8 — T4a):**
- `lib/email.ts` — Resend REST API wrapper, two functions: `sendRequestReceived`, `sendApprovalInstructions`
- Best-effort delivery — callers never fail their HTTP response on email error, just log
- No-ops with warning if `RESEND_API_KEY` unset (local dev friendly)
- Called from `/api/vendor-request` (Email #1) and `/api/admin/vendor-requests` (Email #2)
- Sends from `hello@kentuckytreehouse.com` via verified Resend domain (session 4 DNS records)

**Gated routes:**
- `GET /api/admin/posts` — requireAdmin
- `DELETE /api/admin/posts` — requireAdmin
- `GET /api/admin/vendor-requests` — requireAdmin
- `POST /api/admin/vendor-requests` — requireAdmin (action="approve")
- `POST /api/setup/lookup-vendor` — requireAuth

**Ungated routes (by design):**
- `POST /api/vendor-request` — public submission (rate-limited 3/10min per IP)
- `POST /api/post-caption` — rate-limited 10/60s per IP
- `GET /api/debug`, `GET /api/debug-vendor-requests` — diagnostic (remove later)

---

## HOW TO CLEAR AN EMAIL FROM SUPABASE (for QA iterations)
> Captured from 2026-04-16 session — use when you want to reset a test email's state.
> ⚠️ CAUTION: In session 4 the `vendor_requests` row was accidentally deleted during this cleanup. The SQL pattern below (from diagnostic query) is safer than clicking rows in the dashboard.

Touches up to 3 tables: `auth.users`, `public.vendor_requests`, `public.vendors`.

**Preferred: SQL diagnostic + surgical delete**

```sql
-- Diagnostic: see current state across all 3 tables
SELECT 'vendor_requests' AS tbl, id::text, name AS name_or_display, email, booth_number, status, created_at
FROM public.vendor_requests WHERE email = 'TARGET@example.com'
UNION ALL
SELECT 'vendors', id::text, display_name, NULL, booth_number,
  CASE WHEN user_id IS NULL THEN 'unlinked' ELSE 'linked' END, created_at
FROM public.vendors WHERE display_name = 'TARGET_NAME'
UNION ALL
SELECT 'auth.users', id::text, raw_user_meta_data->>'full_name', email, NULL, 'auth', created_at
FROM auth.users WHERE email = 'TARGET@example.com';
```

**Step 1 — Delete auth user only (safest for re-test)**
```sql
DELETE FROM auth.users WHERE email = 'TARGET@example.com' RETURNING id, email;
```

**Step 2 — Delete vendor_request only if testing a full re-request flow**
```sql
DELETE FROM public.vendor_requests WHERE email = 'TARGET@example.com' RETURNING id, name, status;
```

**Step 3 — Unlink a vendor row without deleting it (for re-testing /setup flow)**
```sql
UPDATE public.vendors SET user_id = NULL WHERE display_name = 'TARGET_NAME' RETURNING id, display_name, user_id;
```

Note: the `admin-cleanup` Sprint 6+ item will collapse this to one click.

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- Magic link delivery via Resend SMTP — verified end-to-end for Yahoo (session 4)
- Magic link `?redirect=` param preserved across round trip (session 5)
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- Vendor account setup — admin approval workflow, setup page
- Vendor-request admin + setup routed through server API with admin gating (session 1)
- `/api/admin/*` server-side admin check via `requireAdmin` (session 1)
- Setup lookup status-filter fix (session 2)
- RLS — 12 policies + vendor_requests (service role only)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min
- PWA manifest
- `.env.example` — all required vars documented
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol
- Notion Roadmap — seeded
- Investor update system — Drive folder + first PDF + Notion process doc
- Custom domain `app.kentuckytreehouse.com` (session 6)
- OTP 6-digit code entry as primary auth path (session 6)
- Clipboard paste button on OTP input (session 6)
- Branded email templates for Magic Link and Confirm Signup (session 6)
- Agent roster formalized: Dev · Product · Docs active (session 6)

### Working ✅ additions (session 9 — 2026-04-17)
- **KI-001, KI-002, KI-003 all resolved** — full diff in `docs/known-issues.md` Resolved section
- **Flow 2 onboarding end-to-end verified working on iPhone** — approval email CTA → OTP → /setup → /my-shelf with correct vendor rendered
- **`/login` redirect-param tolerance** — accepts both `?redirect=` (email CTA path) and `?next=` (magic-link round-trip path) in mount effect + onAuthChange
- **`/post` signed-in localStorage guard** — signed-in users never fall through to stale cache; "posting as Zen · booth 300" symptom class permanently eliminated
- **`/my-shelf` self-heal** — non-admin signed-in users with no linked vendor auto-call lookup-vendor before falling through to NoBooth. Makes /my-shelf a valid Flow 2/3 landing point even if /setup is skipped or raced.
- **`requireAuth` diagnostic logging** — 401 responses now distinguish missing-header vs rejected-token in Vercel function logs

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 9 close._ KI-003 was the last blocker and is resolved.

### 🟡 Sprint 4 remainder
- ✅ Custom domain `app.kentuckytreehouse.com` → Vercel (session 6)
- ✅ OTP 6-digit code entry + clipboard paste (session 6)
- ✅ T3 `/admin` mobile-first approval polish (session 7)
- ✅ Onboarding scope-out + `docs/onboarding-journey.md` (session 8)
- ✅ T4a email infrastructure + Email #1 + Email #2 (session 8)
- ✅ KI-001 admin PIN redirect (session 9)
- ✅ KI-002 toast centering (session 9)
- ✅ KI-003 onboarding journey fix (session 9)
- 🟡 **`/setup` 401 race polish** — new session-9 observation. `/setup` flashes Setup Incomplete briefly before /my-shelf self-heal catches it. ~10-line retry-with-backoff in `setupVendorAccount()`. 🟢 S, ~30 min.
- 🟡 T4c remainder (orphan cleanup — non-critical items) — EmptyFeed CTA removal, NoBooth gate, error copy revisions, retire /api/debug-vendor-requests. Bundle into T4b or ship standalone.
- 🟡 T4b — admin surface consolidation (Add Booth tab in /admin, Add Vendor in-person flow, remove Admin PIN from /login, remove Booths from BottomNav)
- 🟡 T4d — pre-beta QA pass walking all three flows end-to-end
- **KI-004** — approve-endpoint 23505 silent-reuse. Needs a dedicated scoping session per David's call (pre-seeding → claim-booth flow model). Not urgent.
- Sprint 3 leftovers still pending beta invites:
  - Error monitoring (Sentry or structured logs)
  - Vendor bio UI (tap-to-edit + public display)
  - Hero image upload size guard (12MB client check) — actually already present in my-shelf, verify coverage
  - Feed content seeding (10–15 real posts) — required before beta invite
  - Beta feedback mechanism (Tally.so link)

### 🟡 Sprint 5 (guest-user UX + onboarding polish — parked)
- Rename "Sign In" → "Curator Sign In" everywhere + `/welcome` guest-friendly landing for signed-in non-vendors
- PWA install onboarding experience
- Vendor onboarding Loom/doc
- Bookmarks persistence (localStorage → DB-backed, ITP wipe mitigation)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors (Sprint 6+ hook from onboarding-journey.md)
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation (Capacitor/Expo/React Native wrapper)
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, Find Map overhaul

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- `/api/debug-vendor-requests` still in production — flagged 🟡 security in session 8 Risk Register (unauthenticated, exposes vendor_requests data)
- Cloudflare nameservers for `kentuckytreehouse.com` — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships, remove then
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a; automated emails supersede the copy-paste template. Retire in a doc cleanup pass.

---

## DEBUGGING

Run one at a time:

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
```

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug-vendor-requests | python3 -m json.tool
```

```bash
npm run build 2>&1 | tail -30
```

```bash
npx vercel --prod
```

```bash
mkdir -p app/api/your-route-name
```

Commit and push (atomic, keep chained):

```bash
git add -A && git commit -m "..." && git push
```

Source `.env.local` into the current shell for a one-off curl with auth:

```bash
cd ~/Projects/treehouse-treasure-search && set -a && source .env.local && set +a
```

Check Supabase auth logs (magic link dispatch status):

```
https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/logs/auth-logs
```

Check Resend delivery logs:

```
https://resend.com/emails
```

Check Vercel function logs (for lib/email.ts send errors):

```
https://vercel.com/david-6613s-projects/treehouse-treasure-search/logs
```

Check DNS state for `kentuckytreehouse.com`:

```bash
dig kentuckytreehouse.com NS +short
```

```bash
dig kentuckytreehouse.com +short
```

```bash
dig resend._domainkey.kentuckytreehouse.com TXT +short
```

```bash
dig send.kentuckytreehouse.com TXT +short
```

```bash
dig send.kentuckytreehouse.com MX +short
```

---

# Treehouse — Vendor Onboarding Journey
> **Canonical spec.** This document is the single source of truth for how vendors get onto Treehouse.
> Created: 2026-04-17 (session 8) | Owner: Product + Dev agents
> Supersedes: partial descriptions in CLAUDE.md, MASTER_PROMPT.md, and Notion Roadmap.
> When any of those three reference vendor onboarding, they point here.

> **Session 32 (2026-04-20) — v1.2 onboarding refresh.** Flow 3 gained a required booth-proof photo (Model B commitment + verification gesture), name field split into `first_name` + `last_name`, new optional `booth_name` field honored at approval, server-side dedup pre-check with structured `status` response, and the approval email (Email #2) dropped its clickable in-app link in favor of plain instructions (PWA session-continuity fix). Flow 3 diagram + Email matrix copy below are updated accordingly. See CLAUDE.md session-32 close for the full list.

---

## Why this document exists

Session 7 surfaced three separate onboarding failures in a single QA pass after a clean database reset. All three traced back to the same root cause: Sprint 4 had been building against shifting assumptions about who drives onboarding, when emails fire, and where vendors land after approval. Pieces of the flow were built for in-person onboarding, pieces for remote, neither was fully served.

This document commits to three named flows with explicit state transitions, email triggers, and data shape. Any future onboarding-adjacent work gets scoped against this spec before code is written.

---

## The three flows, at a glance

| Flow | Driver | Vendor present? | Vendor auth required? | Email count |
|---|---|---|---|---|
| **1. Pre-Seeded** | Admin alone | No | No | 0 |
| **2. Demo** | Admin + vendor, in-person | Yes | Yes (at end) | 2 (receipt + approval) |
| **3. Vendor-Initiated** | Vendor alone | Yes | Yes (at end) | 2 (receipt + approval) |

Flows 2 and 3 converge at the approval step — from that point forward they are identical.

---

## Flow 1 — Pre-Seeded (Admin)

### Use case

David walks into a mall where he has no vendor relationships, sees booths that would look great on Treehouse, and seeds them to populate the feed. No vendor contact, no vendor login, no claim flow (yet).

### Path

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Admin signs in at /admin                                            │
│    - Email + OTP, or admin PIN (admin-only tab moves from /login to    │
│      /admin — see Orphan Inventory below)                              │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Admin opens the "Add Booth" surface inside /admin (new third tab)   │
│    Captures:                                                           │
│      - Mall Location (dropdown)                                        │
│      - Booth Number                                                    │
│      - Booth Name (public-facing display_name, e.g. "John's Jewelry")  │
│      - Hero photo (optional)                                           │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Submit creates a vendors row                                        │
│    - user_id = NULL (unclaimed)                                        │
│    - display_name = booth name                                         │
│    - booth_number, mall_id set                                         │
│    - hero_image_url set if photo uploaded                              │
│    - NO vendor_requests row                                            │
│    - NO auth.users row                                                 │
│    - NO email sent                                                     │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Admin can post finds for that seeded vendor                         │
│    - Uses existing /post?vendor=<id> admin-impersonation path          │
│    - Posts appear in feed attributed to the seeded booth               │
└────────────────────────────────────────────────────────────────────────┘
```

### Data shape

- `vendors` row: `user_id=NULL`, `display_name=<booth name>`, `booth_number`, `mall_id`, `hero_image_url?`
- No `vendor_requests` row
- No `auth.users` row

### What exists today

- Partial. `/shelves` has an `AddBoothSheet` component (admin-gated) that creates `vendors` rows via `createVendor()`. It captures mall, booth_number, display_name — no hero photo.
- `/post?vendor=<id>` admin-impersonation path works (see `my-shelf/page.tsx` ADMIN_DEFAULT_VENDOR_ID handling).

### What's new for Flow 1

- Move / re-home the Add-Booth surface into `/admin` as a third tab (per Q2 answer).
- Add hero photo field to the Add-Booth form (optional).
- Decide disposition of the `/shelves` AddBoothSheet — remove, or leave as secondary admin entry point.

### Future hook (Sprint 6+, explicitly out of scope now)

"Claim this booth" — when a vendor whose booth was pre-seeded discovers they're on Treehouse and wants to take ownership. Likely flow: vendor submits a `/vendor-request` for that mall + booth; admin sees it's a pre-seeded match; approval links the existing `vendors` row to the vendor's `auth.users.id` instead of creating a new one. Not built. Not designed.

---

## Flow 2 — Demo (In-person, admin-driven with vendor present)

### Use case

David is standing in front of a vendor, showing them the app, and onboarding them live. The "magic moment" of in-person onboarding.

**Session-32 note:** Flow 2's "Add Vendor" admin surface is still on the T4b backlog. Until T4b ships, Flow 2 is executed by pointing the vendor at `/vendor-request` on a shared device and walking them through Flow 3 with the admin present. All v1.2 captures (first/last, booth name, booth photo, dedup) apply in that shared path.

### Path (post-T4b target — admin-side form)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Admin and vendor in conversation                                    │
│    Admin opens /admin → new "Add Vendor" surface (vs. Add Booth)       │
│    Captures (v1.2 shape, mirrors /vendor-request):                     │
│      - First name + Last name                                          │
│      - Email (CRITICAL — becomes auth identity at /setup)              │
│      - Mall, Booth number, Booth name (optional)                       │
│      - Booth photo (required — Model B commitment + verification)      │
│      - Hero photo (optional, admin-only convenience)                   │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Submit creates:                                                     │
│    - vendor_requests row (status=pending, split fields populated)      │
│    - EMAIL #1 sent: "We got your request" (receipt)                    │
│                     — fires consistently for Flows 2 and 3             │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Admin taps Approve (in the same session, right there)               │
│    POST /api/admin/vendor-requests { action: "approve", requestId }    │
│    Server:                                                             │
│      - Resolves display_name: booth_name → first+last → legacy name    │
│      - Creates vendors row (user_id=NULL, display_name resolved)       │
│      - Flips vendor_requests.status = approved                         │
│      - EMAIL #2 sent: "Your booth is ready" with plain-text sign-in    │
│        instructions — NO clickable in-app link (PWA fix)               │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Vendor opens email on their phone                                   │
│    Reads the instructions: "Open Treehouse, tap Sign In, enter the     │
│    email echoed here." No taps on URLs in the email.                   │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 5. Vendor opens the installed PWA directly (home-screen icon)          │
│    Taps Sign In → enters email → Supabase signInWithOtp sends          │
│    EMAIL #3 (6-digit code) → vendor enters code → verifyOtp →          │
│    authenticated → router.replace(safeRedirect("/setup"))              │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 6. /setup calls /api/setup/lookup-vendor                               │
│    Server:                                                             │
│      - Finds vendor_requests row by user.email (lowercase match)       │
│      - Finds matching vendors row (display_name + mall_id, user_id     │
│        NULL)                                                           │
│      - Links vendor.user_id = user.id                                  │
│      - Returns vendor with mall joined                                 │
│    Client:                                                             │
│      - Saves vendor profile to localStorage (LOCAL_VENDOR_KEY)         │
│      - Redirects to /my-shelf                                          │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 7. /my-shelf loads correctly                                           │
│    - getVendorByUserId(user.id) returns linked vendor                  │
│    - Hero image, booth details render                                  │
│    - Post flow works correctly                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Data shape delta vs. session 8

- `vendor_requests` gains `first_name`, `last_name`, `booth_name`, `proof_image_url` (session-32 migration `005`).
- `vendors.display_name` resolves in priority order: `booth_name` → `first_name + ' ' + last_name` → legacy `name`.
- Legacy `name` column stays populated (`first_name + ' ' + last_name`) for backwards compat.

### What's new for Flow 2 (session 32)

- v1.2 captures mirror `/vendor-request` exactly (split name, booth name, booth photo). T4b will build the admin-side sub-flow — until it ships, shared-device Flow 3 covers the use case.
- Approval honors `booth_name` (see admin route session-32 comment header).
- EMAIL #2 is de-linked — no clickable in-app CTA. Vendor opens PWA themselves.

---

## Flow 3 — Vendor-Initiated (Remote, async)

### Use case

Vendor discovers Treehouse organically (feed footer CTA, word of mouth, social post), submits a request on their own. Admin reviews and approves when they get to it. Vendor gets notified.

### Path (v1.2 — session 32)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Vendor hits /vendor-request                                         │
│    Captures:                                                           │
│      - First name + Last name (split)                                  │
│      - Email                                                           │
│      - Mall (optional — select from dropdown)                          │
│      - Booth number (optional)                                         │
│      - Booth name (optional — defaults to first+last at approval)      │
│      - Booth photo (REQUIRED — Model B commitment + verification)      │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 2. POST /api/vendor-request                                            │
│    Server:                                                             │
│      - Dedup pre-check (lower(email) + status):                        │
│          * pending  → return { ok: true, status: "already_pending" }   │
│                       (NO duplicate insert, NO second email)           │
│          * approved → return { ok: true, status: "already_approved" }  │
│                       (NO insert, NO email)                            │
│      - Uploads booth photo to site-assets bucket                       │
│        (booth-proof/<timestamp>-<random>.<ext>)                        │
│      - Inserts vendor_requests row (first_name, last_name, booth_name, │
│        proof_image_url all populated; legacy `name` also populated)    │
│      - Fires EMAIL #1 receipt (salutes by first_name)                  │
│    DB safety net: partial unique index on lower(email) WHERE           │
│    status='pending' (migration 005). 23505 race falls back to          │
│    the already_pending response.                                       │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Vendor sees one of three in-place states                            │
│    - "You're on the list" (created)         → check glyph              │
│    - "We already have you" (already_pending) → clock glyph             │
│    - "You're already in" (already_approved)  → clock glyph + sign-in   │
│    All three echo the email on the surface so the vendor can verify    │
│    the address. Vendor closes tab, goes about their day.               │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Admin reviews at /admin (Vendor Requests tab, pending badge)        │
│    Booth-proof photo renders as 56×56 thumbnail on the row — tap       │
│    opens full image in a new tab. Admin confirms booth legitimacy,     │
│    taps Approve.                                                       │
│    Same server flow as Flow 2 step 3 — vendors row + EMAIL #2          │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 5. Vendor opens approval email                                         │
│    Reads plain-text instructions: "Open Treehouse, tap Sign In,        │
│    enter this email." Email address is echoed in a copyable pill.      │
│    NO clickable in-app link (PWA session-continuity fix — session 32). │
│    Flow continues identical to Flow 2 steps 5–7.                       │
└────────────────────────────────────────────────────────────────────────┘
```

### What's new for Flow 3 (session 32)

- Name split: `first_name` + `last_name` on the form and DB (was a single `name`).
- `booth_name` optional field — honored at approval as `vendors.display_name` fallback priority.
- **Booth photo required** (Model B commitment + verification gesture). Written to `site-assets/booth-proof/…`.
- Server-side dedup pre-check — returns structured `status` so the client renders in-place warm states rather than error toasts.
- Partial unique index on `(lower(email)) WHERE status='pending'` as DB safety net.
- EMAIL #1 copy updated to acknowledge photo and drop visit implication.
- EMAIL #2 de-linked — no `/login?redirect=/setup` CTA. Plain instructions + echoed email.

### Deferred to Sprint 5

- Post-approval booth-name edit surface on `/my-shelf` (there's currently no edit affordance for `display_name`). First solved for at request time via the new `booth_name` field; second-pass edit flow gets its own dedicated mockup in Sprint 5.

---

## Email matrix

| # | Name | Sent by | Fires when | Flows | Status |
|---|---|---|---|---|---|
| 1 | Request received (receipt) | Our server (via Resend API, `lib/email.ts`) | `POST /api/vendor-request` succeeds with status `created` (NOT on `already_pending` or `already_approved` branches) | 2, 3 | ✅ Shipped session 8, refreshed session 32 |
| 2 | Approval + sign-in instructions | Our server (via Resend API, `lib/email.ts`) | `POST /api/admin/vendor-requests action=approve` succeeds | 2, 3 | ✅ Shipped session 8, refreshed session 32 (no clickable link) |
| 3 | OTP 6-digit code | Supabase (`signInWithOtp`) | Vendor enters email at `/login` | 2, 3 (also all auth flows) | ✅ Exists since session 6, template refreshed session 32 (paper surface + Georgia) |

### Implementation (session 32 state)

- `lib/email.ts` — thin wrapper around Resend REST API (native `fetch`, no SDK dependency). All three templates moved onto v1.1l paper surface (`#e8ddc7`). IM Fell English retired from all email templates; Georgia throughout for brand lockup, body, eyebrows, signature.
- `RESEND_API_KEY` in Vercel env vars (set by David during session 8 HITL — unchanged).
- Called from `/api/vendor-request` (POST, `created` branch only) and `/api/admin/vendor-requests` (POST approve). `already_pending` and `already_approved` branches do NOT re-fire EMAIL #1.
- Supabase Auth OTP template (EMAIL #3) edited in Dashboard → Auth → Email Templates. Both Magic Link and Confirm Signup templates use the same paper-surface shell. `{{ .Token }}` rendered in a selectable pill.
- On email failure: log but don't fail the HTTP response. A failed receipt email is bad UX but not a transaction failure.

### Copy (session 32 — current shipped state)

**EMAIL #1 — Request received**

> Subject: We got your Treehouse request, {first_name}
>
> Hi {first_name},
>
> Thanks — we got your booth photo and details.
>
> We'll take a look and be in touch when your shelf is ready to fill.
>
> — Treehouse

**EMAIL #2 — Approval + sign-in instructions (no clickable link)**

> Subject: Your Treehouse booth is ready, {first_name}
>
> Hi {first_name},
>
> Your booth at {mall_name} is ready to start filling with finds.
>
> *(instruction box)*
> To sign in, open **Treehouse** on your phone, tap **Sign In**, and enter this email:
>
> `{email}`
>
> We'll send you a 6-digit code to finish signing in.
>
> Welcome to the search.
>
> — Treehouse

**EMAIL #3 — Supabase OTP (refreshed template)**

> Subject: Your Treehouse sign-in code
>
> Hi there,
>
> Here's your sign-in code. Enter it on the Treehouse sign-in screen to finish.
>
> *(OTP pill — centered, selectable)*
> **{{ .Token }}**
>
> Expires in 10 minutes.
>
> If you didn't ask for this, you can ignore this email.
>
> — Treehouse

All three follow Brand Rules (warm, observational, never transactional).

---

## Data shape decisions

### Booth name vs. person name (session-32 resolution)

Session 8 left this as "today's model stands — revisit if vendor feedback surfaces confusion." Session 32 on-device QA surfaced the confusion (vendor's full name was showing as their booth name with no choice at request time and no post-approval edit). Resolution shipped session 32:

- `vendor_requests.first_name` / `last_name` — captured at request time, used for email salutations.
- `vendor_requests.booth_name` — optional; if set, becomes `vendors.display_name` at approval.
- `vendor_requests.name` — still populated as `first_name + ' ' + last_name` for backwards compat with any downstream reader.
- `vendors.display_name` — resolves at approval time via priority chain: `booth_name` → `first_name + ' ' + last_name` → legacy `name`.
- **Schema migration shipped session 32**: `supabase/migrations/005_vendor_request_onboarding_refresh.sql` adds the three new columns + `proof_image_url`. Applied via Supabase SQL Editor as an 🖐️ HITL at session close.
- **Post-approval edit of `display_name`** is deferred to Sprint 5 with its own dedicated mockup.

### Booth proof photo on request (session-32 addition)

- Required field on `/vendor-request`. Uploaded via `FileReader` → `compressImage` → `POST /api/vendor-request` with a base64 data URL field (`proof_image_data_url`).
- Server writes to Supabase Storage `site-assets` bucket under `booth-proof/<timestamp>-<random>.<ext>` prefix. Uses service-role key so bypasses bucket RLS.
- Public URL stored on `vendor_requests.proof_image_url`. Admin UI renders it as a 56×56 thumbnail on each request row; tap opens full image in a new tab.
- Serves two purposes: (1) bad-actor defense (requires physical booth access), (2) Day-1 content against the empty-shelf problem David observed in the wild.

### Hero photo on request (session-8 decision preserved)

- Not captured on the public `/vendor-request` form. Separate concept from booth proof.
- Hero photo is admin-captured during Flow 2 (post-T4b) or set post-approval by vendor themselves from `/my-shelf`.

### "Email must match" enforcement

The `/api/setup/lookup-vendor` route is the single enforcement point. It looks up `vendor_requests` by `auth.user.email` (exact match, lowercased). If no approved/pending request exists for that email, the vendor gets a clear error: *"We don't see an approved request for this email. Double-check with David."* (Current error copy: "Your vendor account isn't ready yet. An admin needs to approve your request first." — needs revision to be clearer about the failure mode. T4c.)

### Email dedup (session-32 addition)

The `/vendor-request` form re-submit path is handled entirely in `POST /api/vendor-request`:

- Pre-check: `SELECT id, status FROM vendor_requests WHERE email = lower(input) AND status IN ('pending','approved') ORDER BY created_at DESC LIMIT 1`.
- If hit: return `{ ok: true, status: "already_pending" | "already_approved" }` — no insert, no email.
- Client renders a warm in-place state for each (clock glyph, "we already have you" title, echoed email, no panic copy).
- DB safety net: partial unique index `vendor_requests_email_pending_idx ON (lower(email)) WHERE status='pending'`. Race between pre-check and insert caught as `23505` and normalized to the `already_pending` response.

---

## Orphaned-link inventory

### Removals

| Location | Element | Disposition |
|---|---|---|
| `app/page.tsx` — EmptyFeed | "Add a Booth" button → `/shelves` | **Remove entirely.** Empty feed shows copy only, no CTA. Per Q1. |
| `app/login/page.tsx` | "Admin PIN" tab in sign-in page | **Remove.** Admin PIN flow stays, but moves behind `/admin` as the admin-only sign-in path. Public `/login` is curator-only. |
| `components/BottomNav.tsx` | Admin "Booths" tab → `/shelves` | **Remove.** Flow 1's Add-Booth surface lives inside `/admin` as a third tab (per Q2). Admin nav becomes: Home · Find Map · My Booth (same as vendor). |

### Revisions

| Location | Element | Change |
|---|---|---|
| `app/my-shelf/page.tsx` — NoBooth state | "Post a find" button | **Gate:** only show if user is linked to a vendor (`activeVendor !== null`). Today's NoBooth state shows this button unconditionally, which lets a signed-in-but-unlinked user hit `/post` and post against stale localStorage. Per session-7 "posting as Zen · booth 300" bug. |
| `/api/setup/lookup-vendor` | Error copy on "no approved request for this email" | Revise from generic "not ready yet" to specific "We don't see an approved request for this email. Double-check with David." |
| `/vendor-request` success screen | Copy | Update to reinforce that receipt email was sent ("Check your inbox — we just sent you a receipt. We'll be in touch when your booth is ready.") |

### Dispositions to decide during implementation

| Item | Question | Recommendation |
|---|---|---|
| `/shelves` page + its `AddBoothSheet` | Keep as-is, remove `AddBoothSheet`, or retire the whole page? | **Leave the page as-is for now** (it's the public booth directory). **Remove the admin `AddBoothSheet` from it** once `/admin` has the canonical Add-Booth surface, to avoid two entry points for the same action. |
| `/api/debug-vendor-requests` | Still in production | Retire in a cleanup pass — not onboarding-critical, but it's unauthenticated and exposes vendor_requests data. Escalated to 🟡 Medium in session 8 Risk Register. |

### Stale data from session 7 to resolve

| Data | Action |
|---|---|
| `David Butler / booth 123 / America's Antique Mall` vendors row, `user_id=NULL` | Session 8: resolved naturally — new approval flow created a fresh row. Old row state is unverified. |
| David's iPhone stale `th_vendor_profile` for `Zen / booth 300` | **Still open as of session 8 close.** Clear on-device before next QA pass. Sign Out from `/admin` gate or browser data clear. |

---

## The `/my-shelf` self-heal question — answered (with a session-8 correction)

Session 7 flagged `/my-shelf` as having "no self-heal on stale localStorage." Re-reading the code in session 8 showed this was a framing issue.

- `/my-shelf` already loads from DB first: `getVendorByUserId(user.id)`, not from localStorage.
- `/post` also already loads from DB first: `getVendorByUserId(user.id)` on mount, prefers DB over localStorage.
- When either returns a linked vendor, they render correctly and overwrite localStorage.

**But session 8 T4a QA showed "posting as Zen · booth 300" **still happens****. The original predicted fix (add DB lookup to /post) was already in place. So the root cause is something else — tracked as KI-003 in `docs/known-issues.md`. Three candidate causes:

- (A) `/setup`'s `lookup-vendor` link step silently failed → the DB has no vendor row with that user_id
- (B) Session is authed as a different user when `/post` loads → `getVendorByUserId` correctly returns null for that user
- (C) Race in `/post`'s identity resolution → falls through to localStorage before async DB call resolves

**Fix scope:** unknown until diagnosed. Best case ~15 min. Worst case re-work `/setup` linkage. **Scoped as T4c below, elevated to 🔴 blocking.**

---

## Re-scoped Sprint 4 T4

### Original T4 (pre-scope-out)

> `/vendor-request` → post-submission real-time approval state. "Magic moment" of in-person onboarding. Real-time approval poll OR in-person variant of success screen. Est. 2–3 hours.

### Re-scoped T4 (post-scope-out)

T4 was sitting inside the broader scope ambiguity and can't stay as a single ticket. Breaking it into four discrete tickets against the mapped journey:

**T4a — Email infrastructure (foundational) ✅ SHIPPED SESSION 8**
- ✅ Added `lib/email.ts` with `sendRequestReceived` + `sendApprovalInstructions`
- ✅ Added `RESEND_API_KEY` to Vercel env
- ✅ Wired into `/api/vendor-request` POST (EMAIL #1)
- ✅ Wired into `/api/admin/vendor-requests` POST approve (EMAIL #2)
- ✅ Both use warm Brand-Rules copy
- ✅ End-to-end email delivery verified in production

**T4c — Orphan cleanup + KI-003 diagnosis and fix** ✅ **PARTIALLY SHIPPED SESSION 9 — blocking item resolved**

The 🔴 blocking piece (KI-003 — stale vendor identity post-approval) is resolved as of session 9. The remaining orphan-cleanup items are non-critical and can ship with T4b or standalone.

- ✅ **KI-001 fix** — admin PIN → `/admin` (session 9)
- ✅ **KI-002 fix** — toast centering on /admin via wrapper-div pattern (session 9)
- ✅ **KI-003 diagnosis + fix** — three-part fix: `/login` redirect-param unification, `/post` localStorage guard, `/my-shelf` self-heal. Flow 2 onboarding end-to-end verified working (session 9)
- 🟡 Remove "Add a Booth" button from EmptyFeed — still open
- 🟡 Gate "Post a find" in My Shelf NoBooth state behind `activeVendor !== null` — still open
- 🟡 Revise `/api/setup/lookup-vendor` error copy — still open
- ✅ **Revise `/vendor-request` success screen copy** — shipped session 32 as part of v1.2 refresh (three done states: `created`, `already_pending`, `already_approved`)
- 🟡 Retire `/api/debug-vendor-requests` (🟡 security) — still open
- 🟡 **New session-9 polish item:** `/setup` 401 race retry-with-backoff in `setupVendorAccount()` (see docs/known-issues.md) — still open
- **Est for remaining:** 1–1.5 hours total. Bundle into T4b or ship standalone.

**T4b — Admin surface consolidation** (ran *after* T4c)
- Add new "Add Booth" tab to `/admin` (Flow 1 home) — pure vendors row creation, no request/email
- Add new "Add Vendor" sub-flow to `/admin` Vendor Requests tab (Flow 2 — captures full v1.2 data including booth photo; admin taps Approve in the same session)
- Remove "Admin PIN" tab from `/login`; move behind `/admin` gate
- Remove "Booths" tab from admin BottomNav
- Remove admin `AddBoothSheet` from `/shelves`
- **Est:** 4 hours.

**T4d — Pre-beta QA pass against the mapped journey**
- Clean DB reset (follow session 7 pattern)
- Walk Flow 1 end-to-end (admin seeds a booth, posts a find for it, find appears in feed)
- Walk Flow 2 end-to-end (shared-device v1.2 `/vendor-request` with admin present; T4b admin-side form deferred)
- Walk Flow 3 end-to-end (fresh email → /vendor-request → booth photo upload → dedup behaves on re-submit → receipt email → admin approves → approval email no-link → OTP → /my-shelf with booth_name honored)
- Document any gaps found
- **Est:** 1–2 hours.

**Updated total remaining:** T4b + T4c remainder + T4d. Session 32 landed the v1.2 onboarding refresh on the Flow 3 side, so T4d now has a clear reference implementation to measure T4b against.

### Out of scope for T4 (explicitly)

- "Claim this booth" for pre-seeded vendors (Sprint 6+)
- `/welcome` landing for signed-in non-vendors (Sprint 5)
- "Curator Sign In" rename (Sprint 5)
- PWA install onboarding (Sprint 5)
- Real-time approval poll / vendor-side success-screen polling — **eliminated by the decision to auto-email on approve.** Vendor doesn't need to poll because they get an email.
- Post-approval booth-name edit surface (Sprint 5 — session 32 deferral)
- Typography reassessment (Sprint 5 — session 32 deferral, IM Fell readability tax)

---

## Sprint 5 implications (refreshed session 32)

- **`/welcome` landing for signed-in non-vendors.** Unchanged by session-32 refresh.
- **"Curator Sign In" rename.** Unchanged.
- **PWA install onboarding.** 🟡 Medium. Now *especially* important since session-32 removed the in-email CTA link — a vendor without the PWA installed has nothing to tap.
- **Post-approval booth-name edit surface** (session-32 deferral). Mini-mockup first, then build on `/my-shelf` title block. Also first caller for the dangling `updateVendorBio` in `lib/posts.ts` — worth co-scoping.
- **Typography reassessment** (session-32 deferral). IM Fell English vs. EB Garamond / Lora / Fraunces / all-Georgia side-by-side on a phone. Readability tax at 13px italic labels is real; emails already went Georgia this session as a small first step.

---

## Sprint 6+ hooks

- **"Claim this booth" flow** for Flow 1 pre-seeded vendors. Designed as: vendor submits `/vendor-request` for a mall+booth that already has a pre-seeded `vendors` row. Admin sees the match indicator in `/admin`. Approval links the existing row instead of creating a new one. Not built, not designed in detail. The session-32 booth-photo field gives this flow a natural verification surface — a pre-seeded vendor's claim photo can be eye-checked against the empty pre-seeded shelf.

---

## How this document is maintained

- **Any onboarding-related work gets scoped against this document first.** If a proposed change doesn't fit one of the three flows, we pause and re-scope before code.
- **If a flow changes materially, this document updates before implementation.**
- **CLAUDE.md, MASTER_PROMPT.md, and the Notion Roadmap reference this file** for onboarding specifics instead of duplicating the flow diagrams.
- **Owner:** Product + Dev agents jointly. Docs agent verifies drift at each session close.

---

> Last updated: 2026-04-20 (session 32 — v1.2 onboarding refresh: Flow 3 diagram updated, Email matrix copy updated, data-shape decisions revised, Sprint 5 Typography + Post-approval booth-name edit items logged)

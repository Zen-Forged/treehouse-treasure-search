# Treehouse — Vendor Onboarding Journey
> **Canonical spec.** This document is the single source of truth for how vendors get onto Treehouse.
> Created: 2026-04-17 (session 8) | Owner: Product + Dev agents
> Supersedes: partial descriptions in CLAUDE.md, MASTER_PROMPT.md, and Notion Roadmap.
> When any of those three reference vendor onboarding, they point here.

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

### Path

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Admin and vendor in conversation                                    │
│    Admin opens /admin → new "Add Vendor" surface (vs. Add Booth)       │
│    Captures:                                                           │
│      - Vendor name (person's real name — stored on vendor_requests)    │
│      - Email (CRITICAL — must be exact, becomes auth identity)         │
│      - Mall, Booth number, Booth name (optional, defaults to vendor    │
│        name if not provided)                                           │
│      - Hero photo (optional)                                           │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Submit creates:                                                     │
│    - vendor_requests row (status=pending, name, email, mall, booth)    │
│    - EMAIL #1 sent: "We got your request" (receipt)                    │
│                     — fires consistently for Flows 2 and 3             │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Admin taps Approve (in the same session, right there)               │
│    POST /api/admin/vendor-requests { action: "approve", requestId }    │
│    Server:                                                             │
│      - Creates vendors row (user_id=NULL, display_name=booth name,     │
│        hero_image_url if captured)                                     │
│      - Flips vendor_requests.status = approved                         │
│      - EMAIL #2 sent: "Your booth is ready" with sign-in CTA           │
│        pointing to /login?redirect=/setup                              │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Vendor opens email on their phone                                   │
│    Taps "Sign in to your booth" → /login?redirect=/setup               │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 5. Vendor enters their email (must match email on vendor_requests)     │
│    Supabase signInWithOtp sends EMAIL #3: 6-digit code                 │
│    Vendor enters code → verifyOtp → authenticated                      │
│    router.replace(safeRedirect("/setup"))                              │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 6. /setup calls /api/setup/lookup-vendor                               │
│    Server:                                                             │
│      - Finds vendor_requests row by user.email                         │
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

### Data shape delta vs. today

- `vendor_requests` gains implicit "has hero photo" via new admin form (optional).
- `vendors` row seeded with `hero_image_url` at approval time if captured during Demo flow.
- No schema changes required.

### What's new for Flow 2

- New admin "Add Vendor" form inside `/admin` (captures more than public `/vendor-request` form — adds optional hero photo, possibly separate booth-name field).
- Approve endpoint fires `/api/admin/vendor-requests` must send EMAIL #2 (✅ shipped session 8 T4a).
- Vendor-request submission must fire EMAIL #1 (✅ shipped session 8 T4a).

---

## Flow 3 — Vendor-Initiated (Remote, async)

### Use case

Vendor discovers Treehouse organically (feed footer CTA, word of mouth, social post), submits a request on their own. Admin reviews and approves when they get to it. Vendor gets notified.

### Path

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Vendor hits /vendor-request (existing form)                         │
│    Captures: name, email, mall, booth number                           │
│    NO hero photo on request form (kept email/booth only per Q answer)  │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 2. POST /api/vendor-request                                            │
│    Server:                                                             │
│      - Creates vendor_requests row (status=pending)                    │
│      - EMAIL #1 sent: "We got your request" receipt                    │
│        — serves as data-integrity check (catches typo'd emails         │
│          before admin reviews)                                         │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Vendor sees on-screen success state                                 │
│    Copy reinforces the email receipt ("Check your inbox — we'll be     │
│    in touch when your booth is ready").                                │
│    Vendor closes tab, goes about their day.                            │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Admin reviews at /admin (Vendor Requests tab, pending badge)        │
│    Taps Approve on the row                                             │
│    Same server flow as Flow 2 step 3 — vendors row + EMAIL #2          │
└────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────────┐
│ 5. Vendor opens approval email                                         │
│    Taps "Sign in to your booth" → /login?redirect=/setup               │
│    Identical to Flow 2 steps 4–7                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### What's new for Flow 3

- `/api/vendor-request` POST must fire EMAIL #1 (✅ shipped session 8 T4a).
- `/vendor-request` success screen copy updates to match async nature and reinforce that an email was sent (pending T4c).

---

## Email matrix

| # | Name | Sent by | Fires when | Flows | Status |
|---|---|---|---|---|---|
| 1 | Request received (receipt) | Our server (via Resend API, `lib/email.ts`) | `POST /api/vendor-request` succeeds | 2, 3 | ✅ Shipped session 8 |
| 2 | Approval + sign-in instructions | Our server (via Resend API, `lib/email.ts`) | `POST /api/admin/vendor-requests action=approve` succeeds | 2, 3 | ✅ Shipped session 8 |
| 3 | OTP 6-digit code | Supabase (`signInWithOtp`) | Vendor enters email at `/login` | 2, 3 (also all auth flows) | ✅ Exists since session 6 |

### Implementation (shipped session 8)

- `lib/email.ts` — thin wrapper around Resend REST API (uses native `fetch`, no SDK dependency).
- `RESEND_API_KEY` in Vercel env vars (set by David during session 8 HITL).
- Called from `/api/vendor-request` (POST) and `/api/admin/vendor-requests` (POST approve).
- On email failure: log but don't fail the HTTP response. A failed receipt email is bad UX but not a transaction failure.

### Copy (shipped session 8 — may be refined in T4c)

**EMAIL #1 — Request received**

> Subject: We got your Treehouse request, {name}
>
> Thanks for putting your booth forward. We'll take a look and be in touch when your shelf is ready to fill.
>
> — Treehouse

**EMAIL #2 — Approval + sign-in instructions**

> Subject: Your Treehouse booth is ready, {name}
>
> Your booth at {mall_name} is ready to start filling with finds. Tap the link below to sign in — we'll email you a quick 6-digit code.
>
> [Sign in to your booth →] (https://app.kentuckytreehouse.com/login?redirect=/setup)
>
> — Treehouse

Both follow Brand Rules (warm, observational, never transactional).

---

## Data shape decisions

### Booth name vs. person name

Per session-8 scope-out: **today's model stands.**

- `vendors.display_name` is the **public-facing booth name** (e.g. "John's Jewelry" or "David Butler" if the vendor prefers their own name).
- `vendor_requests.name` is the **person's name** (captured at request time, used for email salutations in Emails #1/#2).
- At approval, `display_name` defaults to `vendor_requests.name` unless the admin form supplies a separate booth name during Demo flow.
- **No schema migration required.** We revisit this if vendor feedback surfaces confusion.

### Hero photo on request

Per Q answer: **email/booth only on public `/vendor-request` form**. Hero photo is admin-captured during Demo flow (Flow 2) or set post-approval by vendor themselves from `/my-shelf`.

### "Email must match" enforcement

The `/api/setup/lookup-vendor` route is the single enforcement point. It looks up `vendor_requests` by `auth.user.email` (exact match, lowercased). If no approved/pending request exists for that email, the vendor gets a clear error: *"We don't see an approved request for this email. Double-check with David."* (Current error copy: "Your vendor account isn't ready yet. An admin needs to approve your request first." — needs revision to be clearer about the failure mode. T4c.)

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
- 🟡 Revise `/vendor-request` success screen copy — still open
- 🟡 Retire `/api/debug-vendor-requests` (🟡 security) — still open
- 🟡 **New session-9 polish item:** `/setup` 401 race retry-with-backoff in `setupVendorAccount()` (see docs/known-issues.md) — still open
- **Est for remaining:** 1–1.5 hours total. Bundle into T4b or ship standalone.

**T4b — Admin surface consolidation** (ran *after* T4c)
- Add new "Add Booth" tab to `/admin` (Flow 1 home) — pure vendors row creation, no request/email
- Add new "Add Vendor" sub-flow to `/admin` Vendor Requests tab (Flow 2 — captures full data and immediately creates vendor_requests row; admin taps Approve in the same session)
- Remove "Admin PIN" tab from `/login`; move behind `/admin` gate
- Remove "Booths" tab from admin BottomNav
- Remove admin `AddBoothSheet` from `/shelves`
- **Est:** 4 hours.

**T4d — Pre-beta QA pass against the mapped journey**
- Clean DB reset (follow session 7 pattern)
- Walk Flow 1 end-to-end (admin seeds a booth, posts a find for it, find appears in feed)
- Walk Flow 2 end-to-end (admin + self as vendor: new email, add vendor in /admin, approve, receive Emails #1+#2, OTP, land on /my-shelf)
- Walk Flow 3 end-to-end (fresh email → /vendor-request → receipt email → admin approves → approval email → OTP → /my-shelf)
- Document any gaps found
- **Est:** 1–2 hours.

**Updated total remaining:** ~5–6.5 hours (T4b → T4c remainder → T4d → KI-004 scoping session). Session 9 landed the blocking critical path; what's left is polish and consolidation.

### Out of scope for T4 (explicitly)

- "Claim this booth" for pre-seeded vendors (Sprint 6+)
- `/welcome` landing for signed-in non-vendors (Sprint 5)
- "Curator Sign In" rename (Sprint 5)
- PWA install onboarding (Sprint 5)
- Real-time approval poll / vendor-side success-screen polling — **eliminated by the decision to auto-email on approve.** Vendor doesn't need to poll because they get an email.

---

## Sprint 5 implications surfaced during scope-out

None of these change, but calling out explicitly:

- **`/welcome` landing for signed-in non-vendors.** Sprint 5 item, unchanged by this scope-out. Still the right fix for shoppers who authenticate and hit `/my-shelf`'s NoBooth state.
- **"Curator Sign In" rename.** Sprint 5 item, unchanged.
- **PWA install onboarding.** Sprint 5 item, unchanged. Upgraded to 🟡 Medium (from 🟢 Low) once remote onboarding goes live via Flow 3 at scale — because remote vendors no longer have David walking them through PWA install in person.

---

## Sprint 6+ hooks surfaced during scope-out

- **"Claim this booth" flow** for Flow 1 pre-seeded vendors. Designed as: vendor submits `/vendor-request` for a mall+booth that already has a pre-seeded `vendors` row. Admin sees the match indicator in `/admin`. Approval links the existing row instead of creating a new one. Not built, not designed in detail. Add to Notion Roadmap as a Sprint 6+ backlog item.

---

## How this document is maintained

- **Any onboarding-related work gets scoped against this document first.** If a proposed change doesn't fit one of the three flows, we pause and re-scope before code.
- **If a flow changes materially, this document updates before implementation.**
- **CLAUDE.md, MASTER_PROMPT.md, and the Notion Roadmap reference this file** for onboarding specifics instead of duplicating the flow diagrams.
- **Owner:** Product + Dev agents jointly. Docs agent verifies drift at each session close.

---

> Last updated: 2026-04-17 (session 9 — T4c's 🔴 blocking piece resolved; KI-001/002/003 all shipped; Flow 2 end-to-end verified working on device; KI-004 logged for dedicated scoping session)

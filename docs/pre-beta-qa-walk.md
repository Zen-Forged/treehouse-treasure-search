# Treehouse — Pre-beta QA Walk (T4d)
> Runbook for end-to-end verification of the three onboarding flows against
> the session-35 schema + session-36 fixes + session-37 T4b fold-in.
>
> Created: 2026-04-20 (session 37, T4d).
> Cadence: before any beta invite, and whenever a session touches
> `/vendor-request`, `/api/admin/vendor-requests`, `/api/setup/lookup-vendor`,
> `/my-shelf`, or `lib/activeBooth.ts`.
>
> Automation: `scripts/qa-walk.ts` (session 46) handles baseline snapshots,
> per-booth spot checks, and post-walk cleanup with a dry-run-default
> destructive flow. On-device tapping is the only manual part.

---

## How to use this doc

David runs the walk on device (iPhone PWA). Claude produces any fixes that
surface mid-walk as session-37-tail or session-38 scope. Each step has:

- **Do** — the exact action to take
- **Expect** — what should happen
- **Red flag** — what would be a regression

Any 🚨 red flag → stop, capture screenshots + console logs, come back to a
session to fix before beta.

---

## Prerequisites

Before starting the walk:

### Environment

- Production build deployed: `app.kentuckytreehouse.com` responds with the
  latest commit on `main`
- Supabase dashboard open in a tab for SQL access + auth user inspection
- iPhone signed out of the Treehouse PWA
- A second email address available (non-admin, non-existing) for Flow 3
- A third email address available for Flow 2 demo

### Baseline data state

Run in Supabase SQL Editor to confirm the current state of the database
before the walk:

```sql
-- Pending vendor requests
SELECT id, email, first_name, last_name, booth_name, booth_number, mall_id, status, created_at
FROM vendor_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Vendors with no linked user_id (claimable)
SELECT id, display_name, booth_number, mall_id, user_id, slug, created_at
FROM vendors
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- "David Butler" test variants (flagged for cleanup)
SELECT id, email, first_name, last_name, booth_name, status, created_at
FROM vendor_requests
WHERE lower(email) LIKE '%david%butler%'
   OR lower(first_name) = 'david'
   OR lower(last_name) = 'butler';

SELECT id, display_name, booth_number, user_id, mall_id, created_at
FROM vendors
WHERE lower(display_name) LIKE '%david%butler%'
   OR lower(display_name) LIKE '%zenforged%';
```

Screenshot the results so the post-walk cleanup (section at bottom) has a
reference for what existed before.

---

## Flow 1 — Pre-seeded (admin-only, session 37 Add-Booth primitive)

This flow is new as of session 37. It replaces the old `/shelves` Add-Booth
sheet, which was retired in the T4b fold-in.

### 1.1 — Admin pre-seeds a booth via /admin Vendors tab

**Do:**
1. Sign in as admin at `/admin/login`
2. Land on `/admin` Vendors tab
3. Tap the "Add a booth" row at the top of the tab

**Expect:**
- Collapsed row renders with paper-wash bubble + plus glyph + "Add a booth" + italic helper "Pre-seed a booth for later vendor claim" + chevron
- Tap expands the row inline (no bottom sheet, no backdrop)
- Expanded form shows: Mall dropdown (defaults to America's Antique Mall), Booth number (optional), Booth name (required), hero booth photo dropzone (session 44 addition)
- Filled green "Add booth" CTA at the bottom

**🚨 Red flag:**
- Form opens as a bottom sheet instead of inline expand
- Chrome is Georgia serif instead of IM Fell italic labels (means v1.1k primitives didn't land)
- Mall dropdown is empty (means `getAllMalls` didn't run — check network)
- Hero photo dropzone is missing (session-44 field didn't land)

### 1.2 — Fill and submit

**Do:**
1. Leave Mall on default (America's Antique Mall)
2. Enter booth number: `999` (or any unused booth)
3. Enter booth name: `QA Walk Booth` + some unique suffix
4. Upload a hero booth photo via the dropzone (session 44 addition) — expect 4:3 preview with Replace button after compression completes
5. Tap "Add booth"

**Expect:**
- Button swaps to "Adding…" with spinner, then "Booth added" with check
- After ~800ms, the form auto-collapses
- Success toast appears at bottom with name, booth number, mall name, and note: "Booth pre-seeded. Ready for vendor claim when they request access."

**🚨 Red flag:**
- 23505 duplicate key error surfaced in toast (check that booth 999 doesn't already exist)
- Toast shows empty email field as a visible line (the `email: ""` in the createdVendor toast payload should render cleanly — verify no empty email line appears)
- Form doesn't reset on success — opening it again shows the previous values
- Hero photo upload fails or doesn't render 4:3 preview

### 1.3 — Verify the row in Supabase

**Do:** Run SQL:
```sql
SELECT id, display_name, booth_number, user_id, slug, mall_id, created_at
FROM vendors
WHERE display_name LIKE 'QA Walk Booth%'
ORDER BY created_at DESC
LIMIT 1;
```

**Expect:**
- One row returned
- `user_id` is NULL (unclaimed)
- `slug` is derived from `display_name` via `slugify` (lowercase, hyphens)
- `mall_id` is America's Antique Mall

**🚨 Red flag:** `user_id` is not null (would mean the admin account got wrongly attached)

---

## Flow 2 — Demo (in-person / vendor present)

The vendor fills `/vendor-request` while David watches, David approves from
`/admin`, vendor signs in — all within one session.

### 2.1 — Vendor submits /vendor-request (first email)

**Do:**
1. Open second device (or second PWA context) to `/vendor-request`
2. Fill: First name, Last name, Email (use the second email), Mall (default), Booth number (use a new one, e.g. `888`), Booth name (optional)
3. Tap the booth-photo dropzone, choose a photo from camera roll (compression should complete to 4:3 preview with Replace button)
4. Tap "Request access"

**Expect:**
- Success screen: "You're on the list." with check glyph in paper-wash bubble
- Email echo line primitive at bottom: "Sent to [email]"
- Receipt email arrives (Resend → inbox). Subject line should be the T4a template.
- No OTP sent yet (approval hasn't happened)

**🚨 Red flag:**
- Submit returns 500 (check `/api/vendor-request` logs)
- Success screen stacks bg check glyph OVER the paper-wash bubble (animation regression)
- Receipt email doesn't arrive within 60s (Resend issue, not blocker but worth noting)

### 2.2 — Admin approves from /admin Vendors tab

**Do:**
1. Back on the admin device at `/admin` Vendors tab, tap Refresh
2. New request row appears at the top — verify the booth photo thumbnail, name (booth_name if set, else first+last), email, booth number, mall
3. Tap "Approve"

**Expect:**
- Button swaps to "…" briefly
- Success toast: "✓ Approved · ready to sign in" with vendor name, email, booth, mall
- Row disappears from pending list (status moved to 'approved')
- Vendor's email receives the approval email with sign-in instructions + `/login?redirect=/setup` link

**🚨 Red flag:**
- Approval fails with 23505 — means the (mall_id, booth_number) pair already has a vendor row (Flow 1 test data collision). Diagnose button should surface the collision details.
- Name mismatch diagnosis — means display_name priority (booth_name → first+last → name) is drifting. Session 32 commitment.
- Approval succeeds but no email arrives (best-effort, logged but non-blocking per session-8 Tech Rule)

### 2.3 — Vendor signs in + /setup completes

**Do:**
1. On vendor device, tap the approval email link → `/login?redirect=/setup`
2. Enter email, request OTP, enter 6-digit code
3. Auto-redirect to `/setup`

**Expect:**
- `/setup` calls `/api/setup/lookup-vendor` — KI-006's composite-key lookup should match on `(mall_id, booth_number, user_id IS NULL)`
- Vendor row is linked (`user_id` updated to the new auth user)
- `/setup` → `/my-shelf` → renders the vendor's empty shelf with their booth name

**🚨 Red flag (KI-006 resurfacing):**
- 404 from `/api/setup/lookup-vendor` → booth row wasn't found by composite key. Regression of session 35's fix.
- `/my-shelf` renders `<NoBooth>` despite vendor_requests showing `approved` → the link step silently failed
- Any error involving `display_name == name` in the route logs → session 35's rewrite didn't fully land

### 2.4 — Vendor posts a find

**Do:**
1. On `/my-shelf`, tap Add Find
2. Upload any photo, accept auto-caption (should come back from real Claude, not mock)
3. Tap through to preview, tap Publish

**Expect:**
- Post appears on Home feed within a few seconds
- Amber "Couldn't read this image" notice does NOT appear (real Claude response, session 27 fix)
- Post vendor display_name shows the booth_name (if set) or first+last (session 32 priority)

**🚨 Red flag:**
- Auto-caption is generic strings like "Beautiful vintage piece" — session 27 graceful-collapse to mock (check Anthropic API credit balance)
- Post has wrong vendor (not the one just approved) — session 36 active-booth resolver regression

---

## Flow 3 — Vendor-initiated (async)

Same shape as Flow 2 but with the vendor physically absent — they request,
David approves later, vendor signs in at their leisure. The critical test
point is the `booth_name` path that drove KI-006.

### 3.1 — Submit with booth_name set

**Do:**
1. Open an incognito PWA context at `/vendor-request`
2. Fill: First name, Last name, Third email, Mall (default), Booth number `777`, **Booth name: `The Velvet Cabinet`** (this is the KI-006 trigger — booth_name takes priority over first+last, so `display_name` won't match `first_name + last_name`)
3. Upload booth photo, submit

**Expect:** Same success screen as 2.1

### 3.2 — Approve as admin

**Do:** Same as 2.2.

**Expect:**
- Approved vendor row's `display_name = "The Velvet Cabinet"` (booth_name priority, session 32)
- Slug = "the-velvet-cabinet" (slugified booth_name)
- vendor_requests.name field may still reference first+last but `display_name` on vendors table must be the booth_name

**SQL check:**
```sql
SELECT v.display_name, v.slug, v.booth_number, v.user_id,
       vr.first_name, vr.last_name, vr.booth_name, vr.email, vr.status
FROM vendors v
JOIN vendor_requests vr ON vr.email = (
  SELECT email FROM auth.users WHERE id = v.user_id
) OR vr.email IN (SELECT email FROM auth.users)
WHERE v.booth_number = '777'
  AND v.mall_id = '19a8ff7e-cb45-491f-9451-878e2dde5bf4';
```

**🚨 Red flag:** `display_name = 'first last'` instead of the booth_name → session 32 priority regression

### 3.3 — Vendor signs in (KI-006 verification path)

**Do:**
1. Tap the approval email link → OTP → `/setup`
2. `/setup` attempts lookup

**Expect:**
- Lookup succeeds on composite key `(mall_id='19a8...', booth_number='777', user_id IS NULL)`
- Vendor row links, `/my-shelf` renders "The Velvet Cabinet" banner

**🚨 Red flag (KI-006):**
- 404 from `/api/setup/lookup-vendor` → the route is reading `display_name` and trying to match against `vendor_requests.name` (the old session-32-broken join). Means session 35's rewrite regressed. This is THE test — don't skip it.

---

## Multi-booth sanity (session 35 schema verification)

Exercise the case that triggered the whole multi-booth rework: one user owns
two vendor rows.

### M.1 — Create a second vendor_request for the Flow 3 email

**Do:**
1. Using the same third email from Flow 3, submit a second `/vendor-request` with a DIFFERENT booth number (e.g. `778`) and different booth_name (`Velvet Cabinet — Second Shelf`)

**Expect:**
- Success screen should render `already_approved` state (session 32 dedup logic — same email, existing approved vendor → warm state nudging to sign in) OR `created` state with a new pending request (if session 32 dedup is per `(email, mall_id, booth_number)` composite, which it should be post-session-35 migration 007)

### M.2 — Approve the second request

**Do:** Same as before.

**Expect:** Second vendor row created, linked on sign-in or on re-signin

### M.3 — Multi-booth picker

**Do:**
1. Sign in as the Flow 3 vendor (or if already signed in, refresh `/my-shelf`)

**Expect:**
- `/api/setup/lookup-vendor` returns `vendors: [vendor1, vendor2]` (array form, session 35)
- `/my-shelf` renders a `<BoothPickerSheet>` affordance (the "Viewing · [Name] ▾" masthead per session-34 mockup, or inline-under-banner per Q-002 if that ships first)
- Tap picker → sheet appears with both booths listed
- Tap the other booth → active booth switches, `/my-shelf` re-renders with that booth's name + hero + posts

**🚨 Red flag:**
- Only one booth returned from lookup-vendor → session 35 half-migration bug regressed (the early-return short-circuit we fixed mid-session)
- Picker doesn't appear → `vendorList.length > 1` check isn't firing

### M.4 — Post inherits active booth

**Do:**
1. Switch to second booth
2. Tap Add Find, upload + publish a post

**Expect:**
- Post's `vendor_id` matches the currently-active booth, not the first-approved one

**🚨 Red flag:** Post lands under the first booth — session 36 `detectOwnershipAsync` path 2 had a related issue (pre-fix, `LOCAL_VENDOR_KEY` was rescuing it for single-booth users). Worth verifying on the multi-booth path specifically.

---

## Post-walk test-data cleanup

After the walk, clean up the production DB so beta invites don't collide
with walk artifacts.

### Identify walk artifacts

```sql
-- Walk booth 999 (Flow 1 pre-seeded)
SELECT id, display_name FROM vendors WHERE display_name LIKE 'QA Walk Booth%';

-- Walk booths 888, 777, 778 (Flow 2 + Flow 3 + multi-booth)
SELECT id, display_name, booth_number FROM vendors WHERE booth_number IN ('888', '777', '778');

-- Walk vendor_requests
SELECT id, email, status FROM vendor_requests WHERE booth_number IN ('999', '888', '777', '778');

-- Walk auth users (the two throwaway emails used)
SELECT id, email, created_at FROM auth.users
WHERE email IN ('<second_email>', '<third_email>')
ORDER BY created_at DESC;
```

### Cleanup order (reverse of creation)

```sql
BEGIN;

-- 1. Delete posts created during the walk (if any were published)
DELETE FROM posts WHERE vendor_id IN (
  SELECT id FROM vendors WHERE booth_number IN ('999', '888', '777', '778')
);

-- 2. Delete vendor rows
DELETE FROM vendors WHERE booth_number IN ('999', '888', '777', '778');

-- 3. Delete vendor_requests
DELETE FROM vendor_requests WHERE booth_number IN ('999', '888', '777', '778');

-- 4. Optionally delete the throwaway auth.users rows (Supabase dashboard)
--    via Auth → Users → select → Delete user. SQL delete cascades cleanly
--    if there are no FK references left.

COMMIT;
```

### Pre-existing "David Butler" variants

Separately, the KNOWN GAPS section in CLAUDE.md flagged pre-existing test
data from sessions 30+ that has been accumulating. This walk is a good time
to clean those up too:

```sql
-- Inspect
SELECT * FROM vendor_requests
WHERE lower(email) LIKE '%david%butler%'
   OR lower(email) LIKE '%test%'
ORDER BY created_at DESC;

SELECT * FROM vendors
WHERE lower(display_name) LIKE '%david butler%'
  AND user_id IS NULL
ORDER BY created_at DESC;
```

Review each row before deleting — some may be David's real ZenForged Finds
booth (#369), which is the canonical test vendor / operator persona and
MUST NOT be deleted. The rule of thumb: `booth_number = '369'` with
`display_name ~ 'ZenForged'` is the real one; everything else is walk-era
debris.

---

## Exit criteria

Walk passes when:

1. ✅ Flow 1 — Admin can pre-seed a booth from `/admin` without touching `/shelves`
2. ✅ Flow 2 — Vendor-present onboarding completes end-to-end in under 10 minutes (target from Sprint 4 theme)
3. ✅ Flow 3 — Vendor-initiated with booth_name set succeeds (KI-006 stays fixed)
4. ✅ Multi-booth — Same user ends up with two vendor rows, picker switches correctly, posts inherit active booth
5. ✅ No console errors, no Supabase RLS silent empty returns, no graceful-collapse-to-mock on `/api/post-caption`

If all five pass → Sprint 4 tail is done and the pre-beta blocker column
stays clean. If any fail → capture the failure, come back in a session-38+
to fix, re-walk the affected flow.

---
> Maintained by Docs agent. Update when any flow changes or a new flow is
> committed to `docs/onboarding-journey.md`.

# Admin Runbook — In-Mall Diagnostic & Recovery SQL
> Created: 2026-04-17 (session 13) as part of KI-004 resolution + in-mall diagnostic tooling.
>
> Purpose: give David a 30-second SQL reference for situations the admin UI's Diagnose panel can't cover. For 95% of issues, the Diagnose panel on `/admin` is the right tool. This file is for the other 5% — when you need to manipulate data, not just inspect it.

---

## How to use this runbook

1. **Try the admin UI first.** On `/admin` → Vendor Requests → tap "Diagnose" on any request. The panel tells you what the problem is and what to do about it.
2. **If the UI diagnosis says "run SQL" or you need to clean up data** — come here.
3. **Run queries in Supabase SQL editor**: https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
4. **Always read the expected output before running destructive SQL.** Every `DELETE` and `UPDATE` in this file is preceded by the `SELECT` that shows what you're about to change.

---

## Recipe 1 — "What's the state of request X?"

**When:** Vendor says "I requested a booth but nothing happened" and you want the full picture.

```sql
-- Replace TARGET_EMAIL — case-insensitive
WITH target AS (
  SELECT lower(trim('TARGET_EMAIL')) AS email
)
SELECT 'vendor_request' AS source,
  id::text, name, email, booth_number, mall_name, status, created_at
FROM public.vendor_requests, target
WHERE lower(vendor_requests.email) = target.email

UNION ALL

SELECT 'vendor (by name)',
  v.id::text, v.display_name, NULL, v.booth_number, m.name,
  CASE WHEN v.user_id IS NULL THEN 'unlinked' ELSE 'linked' END,
  v.created_at
FROM public.vendors v
LEFT JOIN public.malls m ON m.id = v.mall_id
WHERE v.display_name IN (
  SELECT name FROM public.vendor_requests, target
  WHERE lower(vendor_requests.email) = target.email
)

UNION ALL

SELECT 'auth.users',
  u.id::text, u.raw_user_meta_data->>'full_name', u.email, NULL, NULL,
  CASE WHEN u.email_confirmed_at IS NULL THEN 'unconfirmed' ELSE 'confirmed' END,
  u.created_at
FROM auth.users u, target
WHERE lower(u.email) = target.email

ORDER BY created_at DESC;
```

---

## Recipe 2 — "What vendors exist at booth N of mall M?"

**When:** Diagnose panel says a booth is taken and you want to see the full picture of who's there.

```sql
-- Replace TARGET_MALL_SLUG and TARGET_BOOTH
SELECT
  v.id::text,
  v.display_name,
  '['||v.booth_number||']' AS booth_exact,
  length(v.booth_number) AS booth_len,    -- reveals whitespace drift
  v.slug,
  v.user_id::text,
  v.created_at,
  m.name AS mall_name
FROM public.vendors v
JOIN public.malls m ON m.id = v.mall_id
WHERE m.slug = 'TARGET_MALL_SLUG'
  AND v.booth_number = 'TARGET_BOOTH'
ORDER BY v.created_at DESC;
```

---

## Recipe 3 — "Free up booth N at mall M"

**When:** You need to delete a stale unlinked vendor row blocking a legitimate vendor request. **Only run if the Diagnose panel showed `booth_unlinked_name_diff` and you've confirmed the blocking row is stale.**

### Step 1 — SELECT before DELETE (always)

```sql
-- Shows what you're about to delete — confirm this is the stale row
SELECT v.id, v.display_name, v.booth_number, v.slug, v.user_id, v.created_at
FROM public.vendors v
JOIN public.malls m ON m.id = v.mall_id
WHERE m.slug = 'TARGET_MALL_SLUG'
  AND v.booth_number = 'TARGET_BOOTH'
  AND v.user_id IS NULL;  -- safety: only unlinked rows
```

### Step 2 — DELETE (only after Step 1 confirms the right row)

```sql
DELETE FROM public.vendors v
USING public.malls m
WHERE v.mall_id = m.id
  AND m.slug = 'TARGET_MALL_SLUG'
  AND v.booth_number = 'TARGET_BOOTH'
  AND v.user_id IS NULL
RETURNING v.id, v.display_name, v.booth_number;
```

---

## Recipe 4 — "Delete a test vendor cleanly"

**When:** You've been testing with `email+N@domain.com` variants and want to reset to clean state.

⚠️ **This deletes the auth user, the vendor row, and the vendor_request row.** Do not run for real vendors — only test data.

### Step 1 — SELECT to confirm scope

```sql
-- Replace TARGET_EMAIL
SELECT 'vendor_requests' AS tbl, id::text, name, email, status
FROM public.vendor_requests
WHERE email = 'TARGET_EMAIL'

UNION ALL

SELECT 'vendors (by linked user)', v.id::text, v.display_name, u.email, NULL
FROM public.vendors v
JOIN auth.users u ON u.id = v.user_id
WHERE u.email = 'TARGET_EMAIL'

UNION ALL

SELECT 'auth.users', id::text, raw_user_meta_data->>'full_name', email, NULL
FROM auth.users
WHERE email = 'TARGET_EMAIL';
```

### Step 2 — DELETE (run in order, one at a time)

```sql
-- 2a. Unlink vendor rows (preserve them in case they're legitimate)
UPDATE public.vendors SET user_id = NULL
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'TARGET_EMAIL')
RETURNING id, display_name;
```

```sql
-- 2b. Delete auth user
DELETE FROM auth.users WHERE email = 'TARGET_EMAIL' RETURNING id, email;
```

```sql
-- 2c. Delete vendor_request
DELETE FROM public.vendor_requests WHERE email = 'TARGET_EMAIL' RETURNING id, name, status;
```

```sql
-- 2d. If the vendor row was purely test data (no posts, unlinked), delete it
--     Only run if you've confirmed the vendor row is disposable
DELETE FROM public.vendors
WHERE user_id IS NULL
  AND display_name IN ('test', 'Test two', 'David Test 3', 'Claude Code')  -- customize
RETURNING id, display_name;
```

---

## Recipe 5 — "Find all unlinked vendor rows"

**When:** Periodic cleanup. These rows are candidates for either being legitimate pre-seeded content or stale test data.

```sql
SELECT
  v.id::text,
  v.display_name,
  v.booth_number,
  m.name AS mall_name,
  v.slug,
  v.created_at,
  (SELECT count(*) FROM public.posts p WHERE p.vendor_id = v.id) AS post_count
FROM public.vendors v
LEFT JOIN public.malls m ON m.id = v.mall_id
WHERE v.user_id IS NULL
ORDER BY v.created_at DESC;
```

Rows with `post_count > 0` are real content (don't delete). Rows with `post_count = 0` and old `created_at` are probably test residue.

---

## Recipe 6 — "Who is signed into this email?"

**When:** Vendor says "I can't sign in" and you want to see if they have an auth record at all.

```sql
-- Replace TARGET_EMAIL
SELECT
  u.id::text,
  u.email,
  u.email_confirmed_at,
  u.last_sign_in_at,
  u.created_at,
  v.id::text AS linked_vendor_id,
  v.display_name AS linked_vendor_name,
  v.booth_number,
  m.name AS linked_vendor_mall
FROM auth.users u
LEFT JOIN public.vendors v ON v.user_id = u.id
LEFT JOIN public.malls m ON m.id = v.mall_id
WHERE lower(u.email) = lower('TARGET_EMAIL');
```

- `email_confirmed_at` null → they've never completed OTP verification
- `last_sign_in_at` null → they've never successfully signed in
- `linked_vendor_id` null → they have an auth account but no vendor row — `/setup` never ran

---

## Recipe 7 — "Reset a specific vendor to re-test approval"

**When:** You need to run through the approval flow again for the same vendor request without submitting a new one.

### Step 1 — Confirm what exists

```sql
-- Replace TARGET_EMAIL
SELECT
  r.id::text AS request_id, r.status AS request_status,
  v.id::text AS vendor_id, v.user_id::text AS vendor_user,
  u.id::text AS auth_user_id
FROM public.vendor_requests r
LEFT JOIN auth.users u ON lower(u.email) = lower(r.email)
LEFT JOIN public.vendors v ON v.display_name = r.name AND v.mall_id = r.mall_id
WHERE r.email = 'TARGET_EMAIL'
ORDER BY r.created_at DESC
LIMIT 1;
```

### Step 2 — Revert request to pending + delete vendor (only if unlinked)

```sql
-- Revert request status
UPDATE public.vendor_requests SET status = 'pending'
WHERE email = 'TARGET_EMAIL'
  AND status = 'approved'
RETURNING id, name, email;
```

```sql
-- Delete the unlinked vendor row so approval re-runs cleanly
DELETE FROM public.vendors
WHERE display_name = 'TARGET_NAME'
  AND mall_id = 'TARGET_MALL_ID'
  AND user_id IS NULL
RETURNING id, display_name;
```

Now re-approve from `/admin` → watch the flow fresh.

---

## Recipe 8 — "What constraints exist on vendors?"

**When:** You want to confirm schema state before debugging an unusual 23505.

```sql
SELECT
  conname,
  contype,          -- 'u' = unique, 'p' = primary, 'f' = foreign key
  convalidated,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.vendors'::regclass
ORDER BY contype, conname;
```

Current (as of session 13):
- `vendors_pkey` — PRIMARY KEY on `id`
- `vendors_slug_key` — UNIQUE on `slug` (globally unique, per the new auto-suffix policy)
- `vendors_mall_booth_unique` — UNIQUE on `(mall_id, booth_number)`
- `vendors_user_id_key` — UNIQUE on `user_id` (one vendor row per auth user)

---

## Recipe 9 — "Deep diagnostic dump for a single vendor_request"

**When:** The admin UI Diagnose panel shows something unexpected and you need everything.

```sql
-- Replace TARGET_REQUEST_ID
WITH req AS (
  SELECT * FROM public.vendor_requests WHERE id = 'TARGET_REQUEST_ID'
),
booth_rows AS (
  SELECT v.*, m.name AS mall_name
  FROM public.vendors v
  LEFT JOIN public.malls m ON m.id = v.mall_id
  WHERE (v.mall_id, v.booth_number) IN (
    SELECT mall_id, booth_number FROM req WHERE booth_number IS NOT NULL
  )
),
slug_rows AS (
  SELECT v.*, m.name AS mall_name
  FROM public.vendors v
  LEFT JOIN public.malls m ON m.id = v.mall_id
  WHERE v.slug LIKE (
    SELECT lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '%'
    FROM req
  )
),
auth_row AS (
  SELECT u.*
  FROM auth.users u, req
  WHERE lower(u.email) = lower(req.email)
)
SELECT 'request' AS source, row_to_json(req.*) AS detail FROM req
UNION ALL
SELECT 'booth_collision', row_to_json(b.*) FROM booth_rows b
UNION ALL
SELECT 'slug_collision', row_to_json(s.*) FROM slug_rows s
UNION ALL
SELECT 'auth_user', row_to_json(a.*) FROM auth_row a;
```

---

## Links & references

- **Supabase SQL editor:** https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/sql/new
- **Supabase auth logs:** https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/logs/auth-logs
- **Resend delivery logs:** https://resend.com/emails
- **Vercel function logs:** https://vercel.com/david-6613s-projects/treehouse-treasure-search/logs
- **Primary mall ID** (America's Antique Mall): `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Admin page:** https://app.kentuckytreehouse.com/admin

---

## Safety checklist before running destructive SQL in-mall

1. ☐ Did I run the `SELECT` version first to see what I'm about to change?
2. ☐ Am I filtering by `user_id IS NULL` when deleting vendor rows? (Never delete linked rows.)
3. ☐ Is the vendor standing in front of me comfortable with a 60-second data cleanup? (If not, offer to email them in 5 min instead — never make a real person watch you do ops.)
4. ☐ Did I add `RETURNING` to my DELETE/UPDATE so I can see what changed?
5. ☐ If something goes wrong, do I know how to roll back? (Most of these recipes are recoverable; the vendor_request + auth user deletes are not — the vendor will need to resubmit.)

---

> Last updated: 2026-04-17 (session 13)
> Maintained as part of KI-004 resolution. Update this when new recipe-worthy situations arise in-mall.

# Multi-Booth Rework — Build Spec

> **This is a dev-handoff document, not a decision document.**
> Decisions were made at mockup review: `docs/mockups/my-shelf-multi-booth-v1.html`.
> If this spec and the mockup ever disagree, the mockup wins.
>
> **Source of truth:** the approved mockup + the five review answers logged in session 34.
> **Target session:** 35 (code sprint).
> **Created:** 2026-04-20 (session 34 close, pending).
> **Owner:** Dev agent.

---

## What's committed

Five decisions from session 34 review:

1. **Schema — Option A.** Drop `vendors_user_id_key` unique constraint. One auth user can own N vendor rows. `vendors.user_id` stays as a plain FK. No `vendor_memberships` join table.
2. **Masthead affordance** — "Viewing · [Booth Name] ▾" block in the center slot of the `/my-shelf` masthead. Tappable; opens the booth picker sheet.
3. **Sheet row hierarchy** — Booth name leads (bold), mall + booth number as subtitle. X-glyph on left (per glyph hierarchy locked session 17).
4. **"Add another booth"** — dashed affordance inside the sheet, below the active booth list. Routes to `/vendor-request` prefilled with the vendor's email.
5. **Pending booth rows** — **hidden from the picker** until approved. Vendor only sees booths they can post to. (Reversed from mockup Frame 3 — Frame 3 shows "Small Town Finds · Pending" but the final behavior hides that row entirely.)

Four prior-session decisions carried in:

- Per-booth `display_name`
- Per-booth bio and hero
- Multiple pending `vendor_requests` per email allowed if `(mall_id, booth_number)` differs
- Bottom-sheet picker matches `<MallSheet>` primitive

---

## Schema changes

### Migration: `supabase/migrations/006_multi_booth.sql`

```sql
-- Drop the one-vendor-per-user constraint.
-- Allows a single auth.users row to own multiple vendor rows.
ALTER TABLE vendors
  DROP CONSTRAINT vendors_user_id_key;

-- vendors.user_id remains a plain FK to auth.users.
-- vendors_mall_booth_unique (mall_id, booth_number) stays — this is the real natural key.
-- vendors_slug_key stays globally unique.
-- vendors_pkey stays.

-- No data migration needed. Existing rows all satisfy the relaxed constraint.
```

🖐️ HITL at session 35 close: run in Supabase Dashboard → SQL Editor, then verify:

```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'vendors'::regclass
ORDER BY conname;
```

Expected: `vendors_mall_booth_unique`, `vendors_pkey`, `vendors_slug_key`. `vendors_user_id_key` should be absent.

### Migration: `supabase/migrations/007_multi_booth_vendor_request_dedup.sql`

```sql
-- Session-32 email dedup widens: same email CAN submit multiple requests
-- as long as (mall_id, booth_number) differs. Same email + same booth + both pending
-- still collapses via the partial unique index.

DROP INDEX IF EXISTS vendor_requests_email_pending_idx;

CREATE UNIQUE INDEX vendor_requests_email_booth_pending_idx
  ON vendor_requests (lower(email), mall_id, booth_number)
  WHERE status = 'pending';
```

🖐️ HITL at session 35 close: run in Supabase Dashboard → SQL Editor, then verify:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vendor_requests';
```

Expected: `vendor_requests_email_booth_pending_idx` present, old `vendor_requests_email_pending_idx` absent.

---

## Code changes

### `lib/posts.ts`

**Rename and return-shape change:**

```typescript
// OLD
export async function getVendorByUserId(userId: string): Promise<Vendor | null>

// NEW
export async function getVendorsByUserId(userId: string): Promise<Vendor[]>
```

Returns empty array for no matches. Ordered by `created_at ASC` so the first-approved booth is always index 0 (deterministic fallback for active-booth resolution).

Keep the old function name exported as a `@deprecated` wrapper that returns `rows[0] ?? null` for any lingering callers during the transition. Add loud `console.warn`. Remove after session 35 on-device QA confirms no callers hit the deprecation path.

### `lib/activeBooth.ts` (NEW)

Small helper module for active-booth resolution. Uses `safeStorage` wrapper.

```typescript
const ACTIVE_BOOTH_KEY = "treehouse_active_vendor_id";

export function getActiveBoothId(): string | null
export function setActiveBoothId(vendorId: string): void
export function clearActiveBoothId(): void

// Resolves active booth from a list of vendor rows:
// 1. If stored ID matches any row → return that row
// 2. Else → return rows[0] and set storage to rows[0].id
// 3. If rows is empty → return null, clear storage
export function resolveActiveBooth(vendors: Vendor[]): Vendor | null
```

Callers on `/my-shelf`, `/post`, and any page that needs "the current booth" use `resolveActiveBooth(vendors)` on the result of `getVendorsByUserId(userId)`.

### `/my-shelf` (app/my-shelf/page.tsx)

- Resolve `vendors = await getVendorsByUserId(user.id)` instead of single vendor.
- `activeBooth = resolveActiveBooth(vendors)`.
- If `vendors.length === 0` → render existing `<NoBooth>` state unchanged.
- If `vendors.length === 1` → render existing Booth primitive against `activeBooth`. **No masthead chevron, no sheet affordance.** Identical to today.
- If `vendors.length > 1` → render Booth primitive against `activeBooth` PLUS the "Viewing · [name] ▾" masthead affordance that opens `<BoothPickerSheet>`.

Masthead structure (only when `vendors.length > 1`):

```
[⚙]        [Viewing / Booth Name ▾]        [☰]
```

- Left icon: settings gear (unchanged from today)
- Center: stacked `Viewing` (IM Fell italic 11px, `var(--ink-muted)`) over `[Booth Name] ▾` (IM Fell 17px, `var(--ink-primary)`)
- Right icon: hamburger menu (unchanged)
- Entire center block is one tap target → `setOpen(true)` on the sheet

### `<BoothPickerSheet>` (components/BoothPickerSheet.tsx, NEW)

Bottom sheet primitive. Inherits the motion and chrome of `<MallSheet>` — same spring animation, same 22px top radius, same paper surface, same 36×4 handle.

Interior layout:

```
     [ handle ]

        Your booths            ← eyebrow, IM Fell italic 13px muted
         Switch to             ← title, IM Fell 21px primary

  ✕   ZenForged Finds           ✓    ← active row, paperWash bg
        America's Antique Mall · Booth 369

  ✕   Treehouse Pickers
        Peddlers Mall Preston · Booth 42

  ✕   Small Town Finds
        Louisville Antique Mall · Booth 118

  ┌─────────────────────────┐
  │  ＋  Add another booth   │   ← dashed border, routes to /vendor-request
  └─────────────────────────┘
```

Props:

```typescript
interface BoothPickerSheetProps {
  open: boolean;
  onClose: () => void;
  vendors: Vendor[];                  // filtered to approved only (no pending)
  activeVendorId: string;
  onSelect: (vendorId: string) => void;
  vendorEmail: string;                // for "Add another booth" prefill
}
```

- Rows divided by 1px hairlines (top and bottom edges of each row)
- Active row: `var(--ink-wash)` background + green `✓` on the right
- Tap row → `onSelect(vendor.id)` → sheet closes → parent calls `setActiveBoothId` + re-renders against new active booth
- "Add another booth" → `router.push('/vendor-request?email=<encoded>')`

**Pending booths are filtered OUT before the `vendors` prop reaches the sheet.** The `getVendorsByUserId` call only returns rows where `user_id` is linked (which only happens after approval). This is the natural filter — no extra logic needed.

### `/post` (app/post/page.tsx)

- Replace `getVendorByUserId(user.id)` with `getVendorsByUserId(user.id)` + `resolveActiveBooth(vendors)`.
- The post inherits the active booth from storage. Multi-booth vendors who want to post to a different booth switch on `/my-shelf` first, then post.
- **No booth picker in the post flow.** Single-path for the 99% case; the 1% pay a one-extra-tap cost (go to `/my-shelf`, switch, tap Post).

If `resolveActiveBooth` returns null (somehow the storage + vendors list produce no match), fall back to the existing `<NoBooth>` state and route to `/setup`.

### `/api/setup/lookup-vendor` (app/api/setup/lookup-vendor/route.ts)

Full rewrite. This is where KI-006 dies.

**New behavior:**

1. `requireAuth` as today. Get `user.id` and `user.email`.
2. Short-circuit: fetch `vendors` rows where `user_id = user.id`. If `rows.length > 0` → return `{ ok: true, vendors: rows, alreadyLinked: true }`.
3. Fetch ALL `vendor_requests` rows for `lower(email) = lower(user.email)` with `status != 'rejected'`.
4. For each request, find the matching unlinked vendor row via `(mall_id, booth_number, user_id IS NULL)` — the real natural key. This replaces the broken session-32 `display_name == request.name` join.
5. Link every match in parallel: `UPDATE vendors SET user_id = $1 WHERE id = $2 AND user_id IS NULL`. Guard preserves race safety.
6. Return the linked rows as `{ ok: true, vendors: Vendor[] }`.

**What this fixes:**

- KI-006 goes away completely. The new composite lookup doesn't care what `display_name` is set to.
- A single Flow 3 vendor with one booth works identically to today.
- A vendor who submitted three separate `vendor_requests` across three malls gets all three linked in one `/setup` call.
- The vendor lands on `/my-shelf` with `vendors.length === 3` and the picker shows up organically.

**Response shape change:** old returned `{ ok, vendor, alreadyLinked? }`. New returns `{ ok, vendors, alreadyLinked? }`. `/setup` client page must update to handle array.

### `/setup` (app/setup/page.tsx)

- Update to read `data.vendors` (array) instead of `data.vendor` (single).
- Copy: "Found your booth" → "Found your booth" (if `vendors.length === 1`) or "Found your booths" (if > 1).
- Under the hood: set `activeBoothId = vendors[0].id` via `setActiveBoothId`, then proceed to existing 3-second redirect to `/my-shelf`.
- `LOCAL_VENDOR_KEY` — if it's still referenced anywhere, retire it in favor of `treehouse_active_vendor_id`. Audit: `grep -r "LOCAL_VENDOR_KEY" app lib components`.

### `/api/vendor-request` (app/api/vendor-request/route.ts)

- Dedup pre-check widens: instead of `eq('email', email).in('status', ['pending', 'approved'])`, key the collision check on `(lower(email), mall_id, booth_number, status)`.
- Same email + same `(mall_id, booth_number)` + `status='pending'` → `already_pending` response (unchanged).
- Same email + same `(mall_id, booth_number)` + `status='approved'` → `already_approved` response (unchanged).
- Same email + DIFFERENT `(mall_id, booth_number)` → proceeds to insert. This is the session-34 change.
- The DB safety-net index (migration 007) catches any race.

### `/admin` approval flow (app/admin/page.tsx, app/api/admin/vendor-requests/route.ts)

- No data-model change.
- Approval creates a vendor row as today. No longer needs to worry about "this email already has a vendor row" because the unique constraint is gone.
- Rendering: request rows continue to render independently per request. The session-34 call is "list each request independently" (not "group by email").
- Optional polish (SURFACE if time permits): visual grouping hint in the admin UI when multiple requests share an email — a thin hairline or "also requested:" note. Not required for session 35 MVP.

---

## Files touched

| File | Change | Risk |
|---|---|---|
| `supabase/migrations/006_multi_booth.sql` | NEW — drop `vendors_user_id_key` | 🟡 🖐️ HITL migration |
| `supabase/migrations/007_multi_booth_vendor_request_dedup.sql` | NEW — rekey dedup index | 🟡 🖐️ HITL migration |
| `lib/posts.ts` | `getVendorByUserId` → `getVendorsByUserId` (array); deprecation shim | 🟡 Rename touches callers |
| `lib/activeBooth.ts` | NEW — active-booth resolver via safeStorage | 🟢 New file |
| `app/my-shelf/page.tsx` | List-aware; conditional masthead + sheet when N>1 | 🟡 Core surface |
| `components/BoothPickerSheet.tsx` | NEW — inherits `<MallSheet>` motion + chrome | 🟢 New primitive |
| `app/post/page.tsx` | Read active booth via resolver | 🟢 Mechanical |
| `app/post/preview/page.tsx` | Same — read active booth from resolver | 🟢 Mechanical |
| `app/api/setup/lookup-vendor/route.ts` | Full rewrite to array return + composite key | 🔴 Core route — fixes KI-006 |
| `app/setup/page.tsx` | Handle array response | 🟡 Mechanical |
| `app/api/vendor-request/route.ts` | Dedup composite key | 🟡 Core route |
| `app/admin/page.tsx` | No change (maybe polish) | 🟢 |
| `app/api/admin/vendor-requests/route.ts` | No change | 🟢 |

---

## Execution order (session 35)

1. **Migrations first, on disk.** Write both SQL files. Do NOT apply yet.
2. **`lib/posts.ts`** — add `getVendorsByUserId` alongside deprecated `getVendorByUserId` wrapper.
3. **`lib/activeBooth.ts`** — helper module.
4. **`/api/setup/lookup-vendor`** rewrite. This is the KI-006 kill.
5. **`/setup`** client page — handle array.
6. **`/api/vendor-request`** — widen dedup.
7. **`/my-shelf`** — list-aware + conditional masthead.
8. **`<BoothPickerSheet>`** primitive.
9. **`/post` + `/post/preview`** — active-booth resolver.
10. 🖐️ HITL — `npm run build 2>&1 | tail -30` green.
11. 🖐️ HITL — apply migration 006 in Supabase SQL editor, verify constraint list.
12. 🖐️ HITL — apply migration 007, verify index list.
13. 🖐️ HITL — commit bundle:
    ```bash
    git add -A && git commit -m "session 35: multi-booth rework (option A) + KI-006 fix" && git push
    ```
14. 🖐️ HITL — On-device QA walk:
    - Single-booth vendor `/my-shelf` unchanged
    - Fresh Flow 3 request with `booth_name` → sign in → `/setup` → `/my-shelf` works (KI-006 verify)
    - Second Flow 3 from same email to a DIFFERENT mall+booth → approved → sign in → picker appears with 2 booths
    - Switch booths on `/my-shelf` → persists across navigation
    - Post a find → inherits active booth
    - Same email + same (mall, booth) re-request → `already_pending` correctly blocks
15. 🟢 AUTO — Session close updates:
    - `docs/known-issues.md` → KI-006 resolved
    - `docs/DECISION_GATE.md` Risk Register → KI-006 ✅, multi-booth ✅
    - `docs/queued-sessions.md` → Q-001 ⏸️ Superseded (KI-006 fixed as sub-fix of multi-booth rework, as predicted)
    - `CONTEXT.md` → schema section updates (constraint list, `getVendorsByUserId`, `lib/activeBooth.ts`, `<BoothPickerSheet>`)
    - `CLAUDE.md` → session 35 close block

---

## Out of scope for session 35

Explicitly deferred:

- **Co-ownership / role-based permissions** — Option B territory. If/when it becomes a real roadmap item, a future migration adds `vendor_memberships` on top of Option A. Not a trap.
- **Admin UI grouping of same-email requests** — optional polish only. Session 35 MVP renders requests independently.
- **Per-booth hero/bio editing UI** — the data model supports it as of session 35; the edit surface itself is a separate sprint (batch with session-32 "post-approval booth-name edit surface" deferral).
- **Session-32 commit backlog** — session 35 commit bundles everything including the uncommitted session-32 v1.2 onboarding code. This is explicit: one push, one merge, one deploy.

---

## Rollback plan

If something goes sideways during on-device QA:

- **Revert migrations:** drop `vendor_requests_email_booth_pending_idx`, re-create `vendor_requests_email_pending_idx`, re-add `vendors_user_id_key` (will fail if any user already has >1 vendor row — that's the real hazard).
- **Revert code:** `git revert` the session-35 commit. Session-32 code comes along for the ride since they're bundled. Accept this — session 32 can be re-applied cleanly in a follow-up.
- **Rollback boundary:** if migration 006 has been applied and a vendor has already gotten a second approved vendor row, rollback is destructive. This is why the session-35 HITL walk is mandatory before `git push` — verify on-device before committing the schema.

---

## Promotion / retirement

**When this spec is superseded by reality:** after session 35 ships, this doc gets archived (either moved to `docs/archive/` or retired with a tombstone note referencing the session-35 commit SHA). The committed code becomes the source of truth.

**Until session 35 runs:** this is the canonical plan. Any drift belongs either in an update to this doc or in a new queued-sessions entry.

---
> Version: 1.0 | Created: 2026-04-20 (session 34) | Owner: Dev agent
> Approved via mockup review: `docs/mockups/my-shelf-multi-booth-v1.html`

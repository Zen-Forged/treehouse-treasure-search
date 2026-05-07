# Admin Vendors tab — Design record (Arc 4 of login refactor)

> **Status:** 🟢 **Ready** as of session 124 (2026-05-07). Greenlit at session 123 close after the booth-456 Path A SQL repair surfaced the operational gap.
> **Status history:** new this session → 🟢 Ready (124).
> **Roadmap entry:** none — operational admin tooling, not an R-row. Tracked as **Arc 4 of the login refactor** (Arc 1 shipped session 123).
> **Mockups:**
> - [`docs/mockups/admin-vendors-tab-v1.html`](mockups/admin-vendors-tab-v1.html) — V1 (3 structural frames spanning the row-shape + affordance-surfacing axis). **Frame B — expandable accordion — PICKED.** Frame A (compact list w/ overflow menu) explicitly captured as future evolution path.
> **Effort:** M (1–2 sessions: data layer + relink endpoint in Arc 1, UI primitive in Arc 2, integration into admin/page.tsx in Arc 3).
> **Purpose of this doc:** Freeze the decisions so implementation runs against a spec, not a re-scoping pass per `feedback_design_record_as_execution_spec.md`.

---

## Origin (sessions 123 + 124)

**Session 123 close** greenlit Arc 4 after the auto-claim Arc 1 ship surfaced a stale-data state at booth 456 that required a one-shot Path A SQL repair (UPDATE `display_name` + `slug` + `user_id` on a "Testing" row at Phoenix Antiques booth 456). Auto-claim Arc 1 closed the runtime trap (approved-but-unlinked vendors now self-link on first sign-in), but the broader operational gap remained: **every booth rename, force-delete, force-unlink, or relink today still requires a Supabase SQL paste**. David's verbatim ask: *"I don't currently have a way to manage the booths inside of the admin tab to clear out test cases I've been using."*

**Session 124 standup** opened with the recommended verify-+10 + Arc 4 sequence; David confirmed +10 sign-in works post-fix and redirected: *"Lets move to admin page review and redesign. I want you to do an analysis on the current state and recommend improvements."*

**Audit findings** (full report in session 124 transcript) localized 5 structural issues; the load-bearing one was: **vendor management has no UI surface**. `PATCH/DELETE /api/admin/vendors` exist but zero callers in the UI. Vendor concerns are split across [`AddBoothInline`](../app/admin/page.tsx) (Requests tab, pre-seed only) · Diagnose panel (Requests tab, on-demand collision detection) · raw Supabase for everything else.

**Reference scan** compressed to the existing admin patterns in this codebase (no cross-domain references needed — this is operational tooling matching established admin chrome): Linear/Vercel pattern (compact + overflow menu) · Stripe dashboard pattern (expandable accordion) · existing post-it card vocabulary (postcard mall card, BoothLockupCard).

**V1 → David pick:** Frame B — expandable accordion. *"Ideally we get to Frame A but Frame B may help me troubleshoot a bit more if needed for now."* Frame A captured explicitly as future evolution path once David is past the troubleshooting phase.

---

## Scope

### What this ships

1. A **new admin tab "Vendors"** as slot 6 (after Events).
2. A **`<VendorsTab>` component** ([`components/admin/VendorsTab.tsx`](../components/admin/VendorsTab.tsx)) — accordion list, chip filter, `+ Add booth` CTA. Mounted by `app/admin/page.tsx` when activeTab === "vendors".
3. A **new `GET /api/admin/vendors` endpoint** — returns all vendors w/ joined `mall` + `posts_count` + `linked_user_email` + per-row `diagnosis` payload. Server-side fanout to detect display_name collisions for unlinked rows; single round-trip from client.
4. **Two new branches on `PATCH /api/admin/vendors`**: `force-unlink` (clears `user_id`) and `relink` (assigns `user_id` from a `vendor_request` + syncs `display_name` + `slug`).
5. **One new query flag on `DELETE /api/admin/vendors`**: `?force=1` — bypasses the `user_id != null` safety gate while still cascading posts cleanup.
6. **Three new R3 events**: `vendor_force_unlinked_by_admin` · `vendor_relinked_by_admin` · `vendor_force_deleted_by_admin` (the last with `had_user_id` flag in payload).
7. **Edit reuses existing [`<EditBoothSheet>`](../components/EditBoothSheet.tsx)** in admin mode — no new edit primitive.
8. **AddBoothInline retires from Requests tab** — surfaces as `+ Add booth` dashed-pill CTA on the Vendors tab.

### What this does not ship

- **Bulk-delete by name pattern** (`name LIKE 'test%'`). Single-row delete only this Arc; bulk operations deferred.
- **Vendor → posts deep-link.** Posts tab already exists and filters by vendor; no inline drill-down from Vendors tab in this Arc.
- **Audit trail UI** (who approved, when, who unlinked). R3 events table captures this; surfacing it in-tab deferred until Q-014 Metabase work.
- **Frame A row shape.** Captured as evolution path (D7); revisit once David is past the troubleshooting phase.
- **Inline edit fields** inside the accordion detail row. Edit always opens `<EditBoothSheet>` (D8) — no new edit affordance shape.
- **Mall picker as part of Relink.** Relink targets `vendor_request` rows directly (which already carry mall_id + booth_number). Mall reassignment stays an Edit operation.
- **Real-time diagnosis refresh.** Diagnosis is computed once per tab-load fetch. Refresh button or manual re-run if needed.
- **Vendors tab default sort.** List comes back in `created_at DESC` order with problematic rows naturally interleaved; no client-side sort affordance this Arc.

---

## Design decisions (frozen 2026-05-07)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| **D1** | Tab placement | **New "Vendors" tab as slot 6** of admin (after Events). Order: Requests · Posts · Banners · Malls · Events · **Vendors**. | analysis Q1 |
| **D2** | Default scope | **Problematic-only** (unlinked + collision). Chip-toggle to All. Problematic = `user_id IS NULL` OR row has display_name diff vs approved request at same `(mall_id, booth_number)`. | David, session 124 |
| **D3** | Status badges | **Linked** (green `#4a6b3a` on `#e7ecdf` soft) · **Unlinked** (amber `#b6843a` on `#f4ead4` soft) · **Collision** (red `#a8442e` on `#f1dad2` soft). 9px FONT_SYS small-caps, 999px radius, 1px hairline border per pill. | mockup |
| **D4** | Affordances | **Edit · Force-unlink · Force-delete · Relink** available on every row. Some hide conditionally: Force-unlink only renders when `user_id != null`; Relink only renders when `user_id IS NULL` and a matching pending/approved `vendor_request` exists. | mockup |
| **D5** | Proactive collision detection | **Server-side fanout on tab-load.** `GET /api/admin/vendors` runs `diagnose-request`-equivalent logic for every unlinked row inline; client receives diagnosis pre-computed. No on-demand "Diagnose" button. | analysis Q6 |
| **D6** | AddBoothInline placement | **Retires from Requests tab** at session 124 ship; **surfaces as `+ Add booth` dashed-pill CTA top-right of body on Vendors tab**. Sheet implementation reuses existing `<AddBoothSheet>` (no new sheet primitive). | David |
| **D7** | Row shape | **Frame B — expandable accordion.** Tap collapsed row → expand to reveal full metadata grid (display_name, slug, user_id, posts_count, created_at) + 4 inline action buttons. Frame A (compact list w/ overflow menu) explicitly captured as future evolution path once troubleshooting phase ends. | David |
| **D8** | Edit affordance | **Open existing `<EditBoothSheet>` in `mode="admin"`.** No new edit primitive; no inline edit fields. Reuses session-74 work + already supports mall + booth_number + display_name + hero photo. | David |
| **D9** | Add-booth CTA placement | **Dashed-pill `+ Add booth` top-right of body**, ink-green border + label. Triggers existing `<AddBoothSheet>`. | mockup |
| **D10** | Collision row visual | **Red left edge (10px) + tinted bg (`rgba(168,68,46,0.04)` collapsed, `rgba(168,68,46,0.08)` expanded) + red collision pill in row header.** Loud is correct — collision rows are rare and demand attention. | David |
| **D11** | Filter strip | **Pill chips, not segmented control.** Order: `[Problematic]` `[All]` `\|` `[Collision]` `[Unlinked]`. First 2 are exclusive scope toggle (one is "on"); last 2 are within-scope filters (multi-select capable). Each chip carries a count `<span class="chip-count">3</span>`. Matches Saved page chip vocabulary from R18. | David |
| **D12** | Force-delete with posts cascade | **Warn-then-allow.** New `<ForceDeleteConfirm>` modal: shows `"{N} posts will be deleted"` + types-vendor-name-to-confirm input + "Delete N posts + booth" red button. Server cascade order matches existing DELETE: posts → post-images storage → vendor-hero storage → vendor row. | David |
| **D13** | Force-unlink behavior | **Yes, with `"X loses /my-shelf access"` warning.** New `<ForceUnlinkConfirm>` modal: shows current `linked_user_email` + warning copy + "Unlink" amber button. Server clears `user_id`; auth user keeps existing session but loses `/my-shelf` route access (lands on `<NoBooth>` per session-91 routing). | David |
| **D14** | Relink behavior | **Yes — production-clean replacement for SQL pasting.** New `<RelinkSheet>` (bottom sheet): picker over pending+approved `vendor_request` rows matching the vendor's `(mall_id, booth_number)` pair. Each option shows: name diff (current vendor.display_name vs request.name), email, status, created_at. Tap option → server PATCH sets `user_id` from request, syncs `display_name` + `slug` from request name. | David |
| **D15** | Diagnosis collision criterion | **`vendors.display_name !== vendor_request.name`** when an approved/pending request exists at matching `(mall_id, booth_number)` AND `vendors.user_id IS NULL`. The booth-456 case is canonical (vendor row "Testing" exists at the same `(mall_id, booth_number)` as approved request "David Butler"). | session 123 |
| **D16** | Empty-state copy | **Problematic scope, 0 problematic rows:** `"No vendor rows need attention. ✓"` (italicized Lora, ink-muted). **All scope, 0 vendors:** `"No vendors yet."` Both center-aligned in body padding. | mockup convention |
| **D17** | Loading state | **Existing admin loading spinner** (matches Posts/Requests tab pattern). | consistency |
| **D18** | Error state | **Toast** (matches Requests/Malls/Events tab pattern, not Posts' inline `result` string). Per audit recommendation 2 in session 124, full unification of error UX is Tier B — deferred — but Vendors tab uses toast from day one. | analysis Q2 (Tier B headroom) |
| **D19** | Refresh trigger | **Re-fetch on**: tab activation, after every successful mutation (edit/unlink/delete/relink), and on manual pull-down (existing admin tab pattern if any) or filter chip toggle. No polling. | implementation default |
| **D20** | Authorization | **`requireAdmin()` server-side on every endpoint** (existing pattern). Client-side: AdminPage already gates entire route on admin role; no per-tab gate needed. | existing pattern |
| **D21** | Vendor created via AddBoothSheet → list refresh | **AddBoothSheet onSuccess fires re-fetch of vendors list.** Newly-added vendor appears at top of list (created_at DESC). | implementation default |

---

## Component contracts

### `<VendorsTab>` — new

```typescript
interface VendorsTabProps {
  // No props — owns its own state + fetch lifecycle.
}

// Internal state shape:
type VendorRow = {
  id: string;
  display_name: string;
  booth_number: string | null;
  slug: string;
  mall_id: string;
  mall_name: string;          // joined from malls
  user_id: string | null;
  linked_user_email: string | null; // joined from auth.users via service role
  posts_count: number;        // computed via count() join
  created_at: string;
  hero_image_url: string | null;
  // Diagnosis payload — server-computed for unlinked rows
  diagnosis: {
    matchingRequest: {
      id: string;
      name: string;            // vendor_request.name (= "David Butler")
      email: string;
      status: 'pending' | 'approved' | 'denied';
      created_at: string;
    } | null;
    isCollision: boolean;     // true when matchingRequest exists + name diff
  } | null;                   // null when row is linked (diagnosis not run)
};

type ScopeFilter = 'problematic' | 'all';
type StatusFilter = Set<'collision' | 'unlinked'>;  // multi-select
```

**Behavior:**
- Mount: fetch `GET /api/admin/vendors`, set loading. On success: hydrate rows + compute counts.
- Filter chip tap: pure client-side filter on already-fetched rows (no re-fetch).
- Row tap: toggle `expandedRowId` (only one expanded at a time — accordion semantics).
- Action button taps wire to handlers per below.

### `<VendorRow>` — new (or inline in `<VendorsTab>`)

```typescript
interface VendorRowProps {
  vendor: VendorRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;          // opens <EditBoothSheet>
  onForceUnlink: () => void;   // opens <ForceUnlinkConfirm>
  onForceDelete: () => void;   // opens <ForceDeleteConfirm>
  onRelink: () => void;        // opens <RelinkSheet>
}
```

**Visual contract per D7 + D10:**
- Collapsed: 12px vertical padding, leaf-edge stripe (10px wide, transparent except red on collision), name (Lora 14/500), meta (sys 11/inkMuted: `Booth {num} · {mall_name} · {N posts}`), status pill, chevron.
- Expanded: head row stays + detail row reveals: 110px-key/1fr-val grid (Lora val, mono key) + action buttons row (`flex` `gap: 6px` `wrap`).
- Collision row: red left edge bar, red-tinted bg, red name color, red status pill, expanded grid shows display_name in red w/ inline note `(approved request: "David Butler")`.

### `<RelinkSheet>` — new

```typescript
interface RelinkSheetProps {
  vendor: VendorRow;
  onClose: () => void;
  onRelinked: (updatedVendor: Vendor) => void;
}

// Internal: fetches matching vendor_requests on mount via
// GET /api/admin/vendor-requests?mall_id=...&booth_number=...
// (existing endpoint, pass query params for filter)
```

**Behavior:**
- Bottom sheet shell mirrors `<EditBoothSheet>` pattern (backdrop + grabber + motion-y + body-overflow lock).
- Body: list of matching requests. Each option card: name (Lora 15/500), email (sys 12), status pill (pending/approved/denied), created_at. Tap card → confirm step ("Relink to {name}? Vendor row's display_name + slug will update.") → submit.
- Empty state: `"No matching vendor request found at this booth. Use Edit instead, or check the Requests tab."`

### `<ForceDeleteConfirm>` — new

```typescript
interface ForceDeleteConfirmProps {
  vendor: VendorRow;
  onClose: () => void;
  onDeleted: () => void;       // parent re-fetches list
}
```

**Behavior:**
- Modal (centered, not bottom sheet — matches existing critical-confirm pattern).
- Title: `"Delete {display_name}?"` (Lora 18/500, red).
- Body: `"This will delete {N} posts and {has_user_id ? 'unlink the linked user' : 'remove the unclaimed booth'}."`. If `has_user_id`, additional warning line `"User {linked_user_email} will lose /my-shelf access."`.
- Type-to-confirm: input field labeled `Type "{display_name}" to confirm`. Submit button disabled until input matches.
- Submit: `DELETE /api/admin/vendors?id={vendorId}&force=1`.

### `<ForceUnlinkConfirm>` — new

```typescript
interface ForceUnlinkConfirmProps {
  vendor: VendorRow;          // user_id != null guaranteed by D4
  onClose: () => void;
  onUnlinked: (updatedVendor: Vendor) => void;
}
```

**Behavior:**
- Modal (centered).
- Title: `"Unlink {display_name}?"` (Lora 18/500, amber).
- Body: `"User {linked_user_email} will lose /my-shelf access. The booth row stays — re-link a different user via Relink, or delete the booth entirely."`
- Submit button: `"Unlink"` (amber). Single tap, no type-to-confirm — unlink is reversible (delete is not).
- Submit: `PATCH /api/admin/vendors` body `{ vendorId, action: "force-unlink" }`.

### `GET /api/admin/vendors` — new endpoint

**Request:** no query params.

**Response:**
```typescript
{
  ok: true,
  vendors: VendorRow[];        // see VendorRow shape above
  counts: {
    total: number;
    linked: number;
    unlinked: number;
    collision: number;
  };
}
```

**Server logic:**
1. `requireAdmin()` gate.
2. Fetch all `vendors` with joined `malls.name` + count of posts via `posts!vendor_id (count)` shape.
3. For each row with `user_id != null`: lookup `auth.users.email` via service-role admin SDK; populate `linked_user_email`.
4. For each row with `user_id IS NULL`: query `vendor_requests` where `mall_id = row.mall_id AND booth_number = row.booth_number AND status IN ('approved', 'pending')`. If found, populate `diagnosis.matchingRequest` and set `isCollision = (matchingRequest.name !== vendor.display_name)`.
5. Compute counts. Return.

**N+1 concern:** For 50 vendors with 30 unlinked, this is 30 sequential `vendor_requests` queries. Acceptable for current scale (~50 vendors total). If admin tab loads slowly past 200 vendors, refactor to a single bulk-fetch query with composite-key matching client-side.

### `PATCH /api/admin/vendors` — extend existing endpoint

**New request shapes:**

```typescript
// Force-unlink
{ vendorId: string, action: "force-unlink" }
// Server: UPDATE vendors SET user_id = NULL WHERE id = vendorId
// Event: vendor_force_unlinked_by_admin { vendor_id, prev_user_id }

// Relink
{ vendorId: string, action: "relink", vendorRequestId: string }
// Server:
//   1. Fetch vendor_request by id; verify status ∈ {pending, approved}
//   2. Verify request.mall_id === vendor.mall_id AND request.booth_number === vendor.booth_number
//   3. UPDATE vendors SET user_id = request.user_id, display_name = request.name, slug = slugify(request.name)
//   4. If status was 'pending', UPDATE vendor_requests SET status = 'approved', approved_at = now()
// Event: vendor_relinked_by_admin { vendor_id, vendor_request_id, prev_display_name, new_display_name }
```

**Existing PATCH shape preserved unchanged** (mall + booth_number + display_name edit per session 74).

### `DELETE /api/admin/vendors` — extend existing endpoint

**New query flag:** `?force=1`

**Server logic:**
- Without `?force=1`: existing safety gate stays — refuses if `user_id != null` (returns 409).
- With `?force=1`: bypasses gate, performs full cascade (posts → post-images → vendor-hero → vendor row).
- Event: `vendor_force_deleted_by_admin { vendor_id, posts_deleted, had_user_id, prev_user_id?, prev_display_name }` — replaces existing `vendor_deleted_by_admin` event when force flag is set.

---

## Sequenced implementation arcs

Smallest→largest per `feedback_smallest_to_largest_commit_sequencing` (cumulative >126 firings).

### Arc 1 — Data layer (smallest, isolated)

~2-3 commits, ~150 lines net.

1. **Commit `arc1.1` — `GET /api/admin/vendors` endpoint.** New file shape: extends existing route with GET handler. Returns `VendorRow[]` + counts per contract above. Server-side fanout to `vendor_requests` for unlinked rows. ~80 lines.
2. **Commit `arc1.2` — Extend `PATCH /api/admin/vendors`** with `force-unlink` + `relink` action branches. ~50 lines added to existing route.
3. **Commit `arc1.3` — Extend `DELETE /api/admin/vendors`** with `?force=1` query flag bypassing safety gate. ~20 lines.

**Verification:** Each commit is independently testable via curl / Postman against staging. No UI consumers yet — build clean at every commit boundary.

### Arc 2 — UI primitives (moderate, isolated)

~4 commits, ~400 lines net.

1. **Commit `arc2.1` — `<VendorsTab>` component scaffold + GET fetch + chip filter.** Read-only first: list rows + chip filter + counts in chips. No actions yet. Mount on a temporary `/vendors-test` route for isolated iPhone QA per `feedback_testbed_first_for_ai_unknowns.md`.
2. **Commit `arc2.2` — Accordion expand/collapse + status pills + collision visual.** Expanded detail row renders the metadata grid; action buttons render as visual placeholders (no handlers yet).
3. **Commit `arc2.3` — Wire Edit + Force-unlink + Force-delete handlers.** Edit reuses `<EditBoothSheet>`. New `<ForceUnlinkConfirm>` + `<ForceDeleteConfirm>` modals. Toasts on success/error.
4. **Commit `arc2.4` — Wire Relink handler.** New `<RelinkSheet>` with vendor_request picker. Toast on success.

**Verification:** `/vendors-test` smoke route enables iPhone QA against real seeded data before integration. Retire route when Arc 3 ships.

### Arc 3 — Integration into admin/page.tsx (largest)

~2 commits, ~150 lines net + ~40 retire.

1. **Commit `arc3.1` — Add Vendors tab to admin tab strip + mount `<VendorsTab>`.** Tab strip reflows from 5 → 6 tabs. Initial activeTab unchanged ("requests").
2. **Commit `arc3.2` — Retire AddBoothInline from Requests tab + surface `+ Add booth` CTA on Vendors tab.** Move `<AddBoothSheet>` trigger from Requests body into Vendors header. ~40 lines retire from Requests tab; ~10 lines add to Vendors tab.

**Verification:** Single combined iPhone QA pass on Vercel preview validates: (a) Vendors tab loads, (b) all 4 actions work end-to-end, (c) Requests tab still works without AddBoothInline, (d) toast/refetch cycle clean across tab switches.

**Total estimated: 8 commits across 1-2 sessions.** Arc 1 + Arc 2 can ship without touching admin/page.tsx — preserves blast-radius isolation.

---

## Open questions / known limitations

- **`/vendors-test` route lifecycle.** Per `feedback_testbed_first_for_ai_unknowns.md`, ship the smoke-test page in Arc 2; retire post-Arc-3 once integrated. Same lifecycle as `/postcard-test` (R10) + `/search-bar-test` (R16) + `/geolocation-test` (R17) — none of those have been formally retired yet, so retirement decision is implicit-deferred.
- **Diagnosis caching.** First load runs O(unlinked) requests against `vendor_requests`. At ~50 vendors total this is fine; past 200 reconsider single-bulk-query approach.
- **Frame A as evolution path.** D7 explicitly captures Frame A (compact list + overflow menu) as the target row shape once David is past the troubleshooting phase. This document does NOT freeze a Frame B → Frame A timeline; revisit when David surfaces it.
- **Audit trail surfacing.** R3 events table captures every admin action (`vendor_force_unlinked_by_admin`, `vendor_relinked_by_admin`, `vendor_force_deleted_by_admin`). Surfacing the trail in-tab (e.g., expanded detail row shows last-N events) is deferred until Q-014 Metabase work decides whether the admin tab survives or events tab moves to Metabase.
- **Bulk operations** (delete-by-name-pattern, multi-select-and-delete). Captured in mockup Q6; deferred. Single-row at a time covers David's current ops; bulk is post-beta if needed.
- **Mall reassignment via Relink.** Relink targets `vendor_request` at the same `(mall_id, booth_number)`; reassigning a vendor to a different mall stays an Edit operation per D14.

---

## Memory firings expected this Arc

- `feedback_smallest_to_largest_commit_sequencing` — Arc 1 (3 commits) + Arc 2 (4 commits) + Arc 3 (2 commits) all sequenced canonical-smallest-first.
- `feedback_design_record_as_execution_spec` — third firing if Arc 1 ships against this spec without re-scoping. Tech Rule promotion-strength validates further.
- `feedback_testbed_first_for_ai_unknowns` — fourth firing on `/vendors-test` smoke page in Arc 2 (no AI in this Arc, but the testbed-first pattern generalizes to "primitive isolation before integration").
- `feedback_treehouse_no_coauthored_footer` — honored on every commit.
- `feedback_verify_primitive_contract_via_grep` — verified `<EditBoothSheet>` admin-mode contract before locking D8.

---

## Implementation-time notes (forward-looking)

- **`auth.users.email` lookup at scale.** The `linked_user_email` join requires service-role admin SDK (`supabase.auth.admin.getUserById`) per row. At ~50 vendors with ~30 linked, this is 30 sequential calls. Batch via `listUsers` with pagination if scale grows past ~100.
- **Slug regeneration on Relink.** When `display_name` changes via Relink, `slug` regenerates via `slugify(request.name)`. Existing `EditBoothSheet` PATCH already does this for display_name edits — same logic, same `slugify` import.
- **`vendor_requests.status === 'pending'` on Relink.** D14 says: if the matched request is still pending, Relink also marks it approved + sets approved_at. This means Relink can serve as an alternate approval path (admin manually fixes a stale row + approves the request in one operation). The existing approve-flow at `/api/admin/vendor-requests` POST stays the canonical path; Relink is the recovery path for already-stale-row cases.
- **Re-running auto-claim after force-unlink.** After unlinking, the vendor row is back to `user_id IS NULL`. If the original auth user signs in again, `tryAutoClaimVendorRows()` (session 123) will re-claim it on first sign-in. This is correct behavior — the unlink is "free this row for re-claim," not "permanently disconnect this user."
- **`vendors_mall_booth_unique` constraint.** Existing unique constraint on `(mall_id, booth_number)` means Edit can return 23505 on conflict. Existing PATCH already catches this and returns clean 409 with `code: "BOOTH_CONFLICT"`. New action branches inherit the same shape.

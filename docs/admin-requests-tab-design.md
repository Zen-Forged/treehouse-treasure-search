# Admin Requests tab — Design Record

**Status:** 🟢 Ready for implementation
**Session:** 131 (2026-05-08)
**Mockup:** [`docs/mockups/requests-tab-redesign-v1.html`](mockups/requests-tab-redesign-v1.html) — Frame C picked
**Replaces:** Inline implementation at [`app/admin/page.tsx`](../app/admin/page.tsx) lines 678–819 (audit pre-design pass)

---

## Context

The admin Requests tab handles vendor-request moderation. A vendor submits `/vendor-request` → row lands in `vendor_requests` table → admin reviews on `/admin` Requests tab. Pre-session-131 the only action wired was `action: "approve"`; the schema permits `status: "denied"` but no code path writes it. Approved rows lingered in the default view at 0.6 opacity. Session 130 close deferred this to a real design pass; session 131 scoped + designed.

---

## Locked Product Axes (session 131 scoping)

| Q | Axis | Locked |
|---|---|---|
| Q1 | Status action set | **A — Deny only** (no Hold, no Needs-more-info) |
| Q2 | Email on deny | **B — Soft email** (vendor sees "couldn't approve, reach out to discuss"; reason internal-only) |
| Q3 | Denied row persistence | **B — Soft-archive** (status flips to "denied", filter chip surfaces) |
| Q4 | Reason field | **A — Required textarea on Deny** (stored in new `vendor_requests.denial_reason` column) |

---

## Reference scan

6 cross-domain admin moderation patterns considered:

1. **Substack — comment moderation** (inline Approve/Hide pair, hover-secondary on hide)
2. **Stripe — radar review queue** (Review CTA → modal with full context + decision)
3. **Linear — issue triage** (chip-filter-first + inline status mutation + keyboard shortcuts)
4. **Notion — page-request approval** (expand-on-tap row reveals reviewer notes inline)
5. **GitHub PR review** (3-state with required-reason gate on Request changes)
6. **Twitter/X — content moderation** (inline Allow/Hide + dropdown reason picker)

V1 spanned **Frame A** (Substack/GitHub-shape inline buttons + confirm modal), **Frame B** (Notion-shape expand-on-tap accordion + inline textarea — mirrors VendorsTab D7), **Frame C** (Stripe-shape Review CTA → modal-driven decision with full proof image). David picked **Frame C** for proof-image-in-decision-context + lowest accidental-deny risk.

---

## Frozen Decisions

### D1 — Structural shape (Frame C)
Per-row layout: `[thumb 44×44] [vendor name (Lora 14/500) + meta line (sans 11px)] [Review → CTA]`. Tap Review → opens centered modal with full proof image + decision panel. No inline action buttons on rows. Separates list-browse from decide-act.

### D2 — Action set
Two terminal actions: **Approve** (existing) + **Deny** (new). No Hold, no Needs-more-info. Pending → Approved or Denied (terminal). Tier B headroom captured for Hold + NMI in §Tier B Explicit Headroom.

### D3 — Chip filter pattern
Top-of-tab strip: `Pending · Approved · Denied · All` with counts. **Single-select** (mutually exclusive — Linear-style). **Default on mount: `Pending`** (closes the "approved lingers at 0.6 opacity" bug from pre-design state). Counts always visible regardless of which chip is on. Reuses VendorsTab `<Chip>` token shape verbatim.

### D4 — Decision panel inside modal
Side-by-side toggle: `[Approve] [Deny]`. **Initially neither selected** — Submit button disabled until one is picked. Picking Approve dims the textarea (still visible but greyed). Picking Deny enables the textarea + makes it required (Submit disabled until non-whitespace content present). Reason textarea + email preview are **always visible in the modal** (not progressive disclosure) — admin can read the email preview before choosing the action.

### D5 — Reason field shape
Free-text textarea, min-height 62px, Lora 13px. **Required when Deny is the picked action** — empty/whitespace blocks Submit. Stored in new column `vendor_requests.denial_reason text NULL`. **Internal-only** — never exposed to vendor. Persists indefinitely (audit trail). No edit-after-submit (denial reason is immutable post-deny; Tier B headroom).

### D6 — Email on deny
New template `sendDenialNotice(email, name)` in [`lib/email.ts`](../lib/email.ts). Body (locked copy):

> Hi {name},
>
> We weren't able to approve your Treehouse Finds booth request at this time.
>
> If you'd like to discuss, please reach out to dbutler80020@gmail.com.
>
> — Treehouse Finds

Reuses Resend infrastructure (existing `replyTo` set in `sendApprovalInstructions`). **No reason exposed.** Email fires on Deny Submit only (not stored separately — sent at action time).

### D7 — Modal layout
Centered modal, 320px wide (max-width 90vw on narrow screens), max-height 80vh, internally scrollable if content overflows.

Vertical stack:
1. **Header** — vendor name (Lora 16/600 centered) + booth + mall line (Lora 13 ink-mid centered)
2. **Proof image** — 130px tall, full-width inside modal padding, 6px radius, hairline border. Tappable for fullscreen lightbox (Tier B headroom — not V1)
3. **Meta grid** — 80px label / 1fr value, 4-row: Email / Booth name / Submitted / (optionally) Mall slug. Sans 9px uppercase keys, Lora 12px values
4. **Decision panel** — D4 toggle
5. **Reason textarea** — D5
6. **Email preview** — post-it card (`v1.postit` background) showing the locked Deny copy with `Vendor will receive` eyebrow. Always visible.
7. **Action row** — `[Cancel] [Submit]` side-by-side, Submit fills width-1; Submit disabled until D4 conditions met

### D8 — Modal dismiss behavior
- Tap backdrop → dismisses (loses unsaved textarea content; no draft persistence)
- Cancel button → dismisses
- Esc key on desktop → dismisses
- No drag-down sheet (modal vocabulary, not sheet)
- Browser back button on iOS PWA → dismisses (history.pushState pattern from existing modals — match BookmarkBoothBubble pattern)

### D9 — Soft-archive behavior
Denied requests stay in DB with `status = "denied"` + `denial_reason` populated. **Filtered out of default Pending view** (D3 default). Surfaced via Denied chip — clicking shows all denied rows. Denied row variant:
- Photo thumb dimmed to opacity 0.7
- Vendor name in ink-mid (not ink-primary)
- Amber `DENIED` pill in status slot (replaces Review → CTA)
- Meta line includes `Reviewed {relative date}`
- Tappable → opens **read-only review modal** (D10)

### D10 — Read-only review modal (denied + approved rows)
Tapping a denied or approved row opens the same modal layout as D7, but:
- Decision panel **hidden**
- Action row replaced with single `[Close]` button
- Status pill displayed prominently below header (`APPROVED` green / `DENIED` amber)
- For denied rows: `denial_reason` shown in read-only style (italic Lora, paper-warm bg, copy "Admin reason — internal only" eyebrow)
- For approved rows: shows `vendor_slug` + linked vendor row link (jump-to-Vendors-tab affordance — reuses session 126 jump-link pattern)

**Reopening / un-denying** is captured as Tier B headroom (no V1 affordance). Denial is terminal in V1.

### D11 — Toast pattern
Reuses parent `AdminPage` toast (lines 975–1137). Variants:
- **Success on Approve** — "Approved {first_name}. Email sent." (existing — unchanged)
- **Success on Deny** — `"Denied {first_name}. Soft email sent."` (new variant — green check icon, 6s auto-dismiss)
- **Error** — `"Couldn't deny — {error message}. Try again."` (existing red error variant)
- **Email-fail-after-status-flip** — if Resend fails after DB status update succeeds: `"Status saved but email didn't send. Vendor not notified."` (new variant — amber warning icon)

### D12 — R3 events
- **Existing** — `vendor_request_approved` (untouched, payload unchanged)
- **New** — `vendor_request_denied` with payload:
  ```ts
  {
    request_id: string,
    mall_id: string,
    booth_number: string | null,
    denial_reason_length: number,  // length only — text never logged
    actor_email: string,            // admin who denied
  }
  ```
- **New** — `vendor_request_review_modal_opened` (Tier B telemetry — drop if it adds noise; gut-check for whether modal-driven decision feels right at scale)

### D13 — Schema migration

`supabase/migrations/021_vendor_request_denial_reason.sql`:

```sql
-- 021_vendor_request_denial_reason.sql
-- Adds admin-internal denial reason to vendor_requests.
-- Required when status flips to 'denied' (enforced at API layer).

ALTER TABLE vendor_requests
ADD COLUMN denial_reason text NULL;

COMMENT ON COLUMN vendor_requests.denial_reason IS
'Internal admin notes on why request was denied. Never exposed to vendor. Required at API layer when status flips to denied. NULL for pending + approved rows.';
```

No constraint, no check, no index. Free-form text. HITL paste into prod + staging dashboards (project pattern from session 92 onward).

### D14 — API contract changes

**GET `/api/admin/vendor-requests`**
- Add optional query param `?status=pending|approved|denied|all` (default: `pending`)
- Response shape extends with `denial_reason: string | null` per row
- Existing 50-row limit preserved (no pagination — captured as Tier B headroom)

**POST `/api/admin/vendor-requests`**
- Existing approve branch unchanged: `{ action: "approve", requestId }` → `{ ok: true, vendor: {...} }`
- New deny branch: `{ action: "deny", requestId, denial_reason: string }` →
  - Validates `denial_reason.trim().length > 0` else `400 { error: "denial_reason required" }`
  - Updates `vendor_requests` row: `status = "denied"`, `denial_reason = <reason>`, `denied_at = NOW()` (Tier B — defer if migration not run; no column needed for V1 per existing schema)
  - Calls `sendDenialNotice(email, first_name || name)` via Resend
  - Records `vendor_request_denied` R3 event
  - Returns `{ ok: true, request: {...updated} }` or on email failure `{ ok: true, request: {...}, warning: "email_failed" }` (status saved, toast shows the email-fail-after-status-flip variant)

### D15 — Component contracts

**Extract** `<RequestsTab>` from inline `app/admin/page.tsx:678–819` → `components/admin/RequestsTab.tsx`. Mirror `<VendorsTab>` extraction shape (sessions 125–126).

```ts
// components/admin/RequestsTab.tsx
export function RequestsTab({
  requests: VendorRequest[],
  onAction: (action: "approve" | "deny", requestId: string, denialReason?: string) => Promise<void>,
  onRefresh: () => Promise<void>,
}): JSX.Element
```

**New** `<ReviewRequestModal>` in `components/admin/ReviewRequestModal.tsx`:

```ts
export function ReviewRequestModal({
  request: VendorRequest,
  open: boolean,
  mode: "decide" | "readonly",
  onSubmit: (action: "approve" | "deny", denialReason?: string) => Promise<void>,
  onDismiss: () => void,
}): JSX.Element
```

**Type extension** in `types/treehouse.ts`:

```ts
type VendorRequest = {
  // existing fields
  denial_reason: string | null,  // NEW
  // status enum tightened: "pending" | "approved" | "denied"
}
```

---

## Tier B Explicit Headroom

Doors deliberately left open for future arcs without redesign:

1. **Hold + Needs-more-info actions** — POST endpoint can extend with `action: "hold" | "request_info"`; chip strip can grow without re-layout (already overflow-x scrollable). Email on NMI = template variant of D6 with reply-back instructions.
2. **Reopen denied request** — POST endpoint can extend with `action: "reopen"` resetting status → pending + clearing denial_reason. Read-only modal can grow a "Reopen" button when denied row owner is the current admin.
3. **Denial reason category dropdown** — D5 free-text can migrate to enum-with-text-fallback (`denial_category` enum + `denial_notes` free-text). Schema migration adds column; existing rows fall through to "other / see notes."
4. **Bulk approve/deny** — chip strip can grow a multi-select mode + batch endpoint. Cards add checkboxes. No structural redesign needed.
5. **Pagination** — 50-row limit can grow to keyset pagination via `?cursor=<created_at>`; chip strip + counts unchanged.
6. **Proof image lightbox** — D7 modal already shows proof at 130px; tap-to-fullscreen is a bubble-overlay pattern (same shape as session 75 BoothHero lightbox).
7. **Edit denial reason post-submit** — D5 locks denial_reason as immutable. Future edit affordance would extend POST with `action: "update_denial_reason"`.
8. **Soft-archive auto-prune** — denied requests older than N months could auto-hard-delete (configurable). Out of V1 scope; manual SQL cleanup remains as audit-runbook recipe if denied volume grows.

---

## Implementation Arcs (sequenced smallest → largest)

### Arc 1 — Data layer (4 commits)

1. **Migration 021** + HITL paste prod + staging
2. **`lib/events.ts`** — add `vendor_request_denied` event type + payload type
3. **`lib/email.ts`** — add `sendDenialNotice(email, name)` template + Resend send call (~30 lines, mirrors `sendApprovalInstructions` shape)
4. **`app/api/admin/vendor-requests/route.ts`** — extend POST with deny branch + validation + status flip + email + event recording. Extend GET with `?status=` query param. Update VendorRequest type with `denial_reason` field.

### Arc 2 — Component extraction (3 commits)

5. **Extract `<RequestsTab>` read-only** from inline `app/admin/page.tsx` to `components/admin/RequestsTab.tsx`. No behavior changes; pure refactor with build-clean verification.
6. **Add chip filter strip** with counts + `Pending` default + single-select state machine. Wire to GET `?status=` param.
7. **Add per-row Review → CTA** + `<ReviewRequestModal>` placeholder mounted with `mode="decide"` + console.log on submit. Approve still works via existing inline button (kept as fallback during transition).

### Arc 3 — Decision flow (3 commits)

8. **`<ReviewRequestModal>` decide-mode**: full layout per D7 (header + proof + meta + decision panel + textarea + email preview + actions). Wire `onSubmit` to parent action handler. Optimistic UI: row removes from Pending list on success; toast fires.
9. **`<ReviewRequestModal>` readonly-mode**: per D10 — denied/approved rows tap to open. No decision panel, single Close button, denial_reason rendered in read-only style.
10. **Retire inline Approve button**. Approve happens through Review modal only. Final cleanup: remove the `opacity: isPending ? 1 : 0.6` line + the inline approve handler. Build clean + scope-adjacent dead code retired in same commit per `feedback_dead_code_cleanup_as_byproduct`.

**Total: ~10 commits across 3 arcs.** Each commit independently revertable per `feedback_smallest_to_largest_commit_sequencing`. Build green + tsc clean at every commit boundary.

---

## R3 Events Summary

| Event | When fired | Payload |
|---|---|---|
| `vendor_request_approved` | POST action=approve success | `{vendor_slug, mall_id, mall_name, booth_number, had_warnings}` (existing) |
| `vendor_request_denied` | POST action=deny success | `{request_id, mall_id, booth_number, denial_reason_length, actor_email}` (NEW) |
| `vendor_request_review_modal_opened` | Modal opens (tap Review →) | `{request_id, status}` (NEW — Tier B telemetry, drop if noisy) |

---

## Reversal Surfaces

This design pass introduces no reversals of prior locked decisions. The pre-session-131 Requests tab was inline + minimally-shaped; this is a greenfield design pass on top of the audit findings.

The 0.6-opacity-linger behavior (pre-state) is **not surfaced as a reversal** — it was a missing-feature-shape (no chip filter ever existed), not a design call.

---

## Carry-forwards

- 🚧 Arc 1 ships data layer; iPhone QA waits for Arc 3 close (no UX surface until decide-mode wired)
- 🚧 Migration 021 is a HITL gate before Arc 1 commit 4 ships (server endpoint depends on column existing)
- 🚧 Tier B headroom items (Hold / NMI / Reopen / etc.) become candidate sessions only when usage data shows the need
- 🚧 `vendor_request_review_modal_opened` event is Tier B telemetry — keep or drop after first 2 weeks of admin usage (signal-to-noise check)

# Treehouse — Known Issues
> Active bugs, gaps, and deferred items. Referenced by `docs/DECISION_GATE.md`.
> Created: 2026-04-17 (session 8 — logging the three QA issues surfaced during T4a post-deploy).
> Last updated: 2026-04-17 (session 10 — `/setup` 401 race moved to Resolved).

---

## Open issues

### 🟡 KI-004 — Approve endpoint silently reuses stale vendor rows on booth-number collision
**Surfaced:** 2026-04-17 session 9 (during KI-003 diagnosis)
**File:** `app/api/admin/vendor-requests/route.ts` — the 23505 duplicate-key branch (~line 103)
**Behavior:** When `INSERT INTO vendors (mall_id, booth_number, display_name, slug)` hits the `(mall_id, booth_number)` unique constraint, the current handler silently fetches the existing row and returns it as the newly-approved vendor — regardless of whether that existing row is unlinked (`user_id=NULL`), linked to a different user, or has a completely different `display_name` than the incoming request.

**Why this is a problem:**
- If a prior vendor_request was approved for the same (mall, booth) and left its `vendors` row unlinked (e.g. that vendor never completed `/setup`), the new approval will reuse that stale row.
- `/api/setup/lookup-vendor` then can't find a matching row by `(display_name = request.name, mall_id = request.mall_id, user_id IS NULL)` because the existing row's `display_name` doesn't match the new request's name → returns 404 "Your vendor account isn't ready yet."
- Net result: approval succeeds, email fires, user gets the "sign in to your booth" CTA, but the backing vendor row is a ghost.

**Repro (session 9):** DB had three orphan `user_id=NULL` vendors from session 7-8 residue (`John Doe/1234`, `Claude Code/123`, `David Butler/123 at AAM`). Any new vendor_request approved for `(America's Antique Mall, booth 123)` would silently reuse the `David Butler` row instead of creating a new vendor with the new request's name.

**Product scope handoff from David (session 9):** *"Everything is captured that is available — booth number, mall, booth name (if available). Once I speak with the booth owner or they reach out etc., then I'd just add their email and initiate the handoff to them so they could manage that booth. But trying to keep this simple for MVP. Seeding is something that I'll just be doing so I have content."*

That's a clean mental model for the pre-seeded → claim-booth flow. Needs a dedicated scoping session to design:
- The admin-side "add email to a pre-seeded booth" surface (likely lives in `/admin`)
- The data-model implications (does this convert the pre-seeded row into a vendor_request, or link directly?)
- What approve should do with a 23505 collision in the absence of an intentional handoff: reject hard? warn and proceed? allow reuse only if unlinked AND display_name matches? These need product-level answers before code.

**Why not fixed in session 9:** David explicitly called for scoping this separately rather than snap-deciding it during bug-fix work. Correct call — the fix touches Flow 1 semantics and belongs with that work.

**Mitigation while open:** Session 10+ tests should use non-colliding booth numbers (pick booth numbers that aren't present in the three session-9 orphan rows). The orphans can also be cleaned up via SQL if they become annoying:

```sql
-- Only run after confirming none of these should be kept
DELETE FROM public.vendors
WHERE user_id IS NULL
  AND display_name IN ('John Doe', 'Claude Code', 'David Butler');
```

**Fix scope (for the eventual scoping session):** Design the Flow 1 claim-booth model first, then tighten the 23505 branch to reject-on-collision unless it's an intentional handoff (marked via a `claim` flag or by checking for a matching pre-seeded row).
**Recommended sprint:** Sprint 4+ after scoping session, or Sprint 5 depending on urgency.

---

### 🟡 `/setup` 401 race — transient "Setup Incomplete" flash before /my-shelf self-heal catches it
**Surfaced:** 2026-04-17 session 9 (during KI-003 end-to-end QA)
**Files:** `app/setup/page.tsx` `setupVendorAccount()` — and observable via `lib/adminAuth.ts` diagnostic logging (added session 9)
**Behavior:** After OTP verify, `/setup` fires `/api/setup/lookup-vendor` with the bearer token attached by `authFetch`. The token is accepted by the client (stored from the `verifyOtp` response) but Supabase's auth server takes up to ~500ms to make that token validatable via `service.auth.getUser(token)` from a different server. During that replication window, `requireAuth()` returns 401 "Unauthorized" → `/setup` flashes the "Setup Incomplete" error state.

**Why this doesn't break the journey anymore:** Fix #3 from session 9 (the `/my-shelf` self-heal) calls the same endpoint a few hundred ms later when the user navigates to My Booth. By then the token validates cleanly, the self-heal links the vendor, and the page renders correctly. The user ultimately lands in the right place — but sees a brief "Setup Incomplete" flash en route.

**Repro:** Submit a fresh `/vendor-request`, admin-approve, tap the approval email on a device where no Supabase session exists yet (Safari data cleared), enter OTP. `/setup` will flash briefly and show "Setup Incomplete" with text "Unauthorized" before you can navigate away.

**Fix scope:** ~10-line retry-with-backoff around the `authFetch` call in `setupVendorAccount()`. On 401 response, `setTimeout` 800ms, retry once. If still 401 after retry, fall through to the existing error state.

```ts
// Rough sketch:
async function callLookupVendor(): Promise<Response> {
  const res = await authFetch("/api/setup/lookup-vendor", { method: "POST", body: JSON.stringify({}) });
  if (res.status !== 401) return res;
  await new Promise(r => setTimeout(r, 800));
  return authFetch("/api/setup/lookup-vendor", { method: "POST", body: JSON.stringify({}) });
}
```

**Recommended sprint:** Session 10 polish pass (🟢 S, ~30 min).

---

## Deferred items (not bugs — scope-deferred decisions)

### Cloudflare DNS zone orphaned for `kentuckytreehouse.com`
Nameservers assigned but not authoritative. Dormant, no cost. Delete at leisure.

---

## Resolved

### ✅ `/setup` 401 race — transient "Setup Incomplete" flash during Supabase token replication window
**Resolved:** 2026-04-17 session 10
**Root cause:** Supabase's auth server takes ~500ms to make a just-issued OTP token validatable via `service.auth.getUser(token)` from a different server. `requireAuth()` on `/api/setup/lookup-vendor` was 401ing during that replication window even though the token was valid client-side. Session-9's `/my-shelf` self-heal was silently catching and correcting this a few hundred ms later, but `/setup` was visibly flashing the "Setup Incomplete" error state en route.

**Fix:** `app/setup/page.tsx` — in `setupVendorAccount()`, wrapped the single `authFetch` call in a `callLookupVendor()` helper that retries once with 800ms backoff on a 401 response. If the retry also returns 401, falls through to the existing error UI unchanged. 14 lines of new code, one line changed. No new imports. No touch to the error state, localStorage write path, or success flow.

```ts
const callLookupVendor = async (): Promise<Response> => {
  const first = await authFetch("/api/setup/lookup-vendor", { method: "POST", body: JSON.stringify({}) });
  if (first.status !== 401) return first;
  await new Promise(r => setTimeout(r, 800));
  return authFetch("/api/setup/lookup-vendor", { method: "POST", body: JSON.stringify({}) });
};
```

**Commit:** `fix(setup): retry lookup-vendor once on 401 to absorb OTP token replication lag`

**Verified:** QA walkthrough pending on Session 11. If the 800ms window turns out to be insufficient on a real device, expand to 1200ms or add a second retry — but the fallback path is the existing error UI, so there's no regression risk.

### ✅ T4c orphan cleanup — dead-end CTAs removed from shopper path
**Resolved:** 2026-04-17 session 10
**Fix (three surfaces, one commit):**

1. **`app/page.tsx` EmptyFeed** — removed "Add a Booth" button that routed to `/shelves` (dead end). Copy revised for the actual audience (shoppers on an empty feed) from *"Be the first vendor to share a find in your area"* to *"Check back soon — new finds land here the moment a vendor posts them."*

2. **`app/my-shelf/page.tsx` NoBooth** — removed "Post a find" Link that routed to `/post` (dead end post-Session-9 guard). Copy revised from *"No booth set up yet" / "Post your first find to create your booth identity..."* to *"No booth linked to this account" / "If you're a vendor awaiting approval, your booth will appear here once setup is complete. Questions? Reach out to the admin directly."* Cleaned up now-unused `Link` import.

3. **`app/api/debug-vendor-requests/route.ts`** — deleted. Unauthenticated diagnostic endpoint that exposed `vendor_requests` data, 🟡 security item from Session 7. Verified no references in the codebase before deletion.

**Commit:** `chore(ui): orphan cleanup — remove dead-end CTAs + debug endpoint`

### ✅ Three session-9 DB orphan vendors
**Resolved:** 2026-04-17 session 10 (🖐️ HITL)
`John Doe / 1234`, `Claude Code / 123`, `David Butler / 123 at AAM` — all `user_id=NULL`, leftover from session 7-8 test data. Deleted via SQL before Session 10 code work. KI-004 collision hazard surface cleared.

---

### ✅ KI-001 — Admin PIN sign-in redirected to `/my-shelf` instead of `/admin`
**Resolved:** 2026-04-17 session 9
**Fix:** `app/login/page.tsx` `handlePin()` — `router.replace("/my-shelf")` → `router.replace("/admin")`. Left the public email-OTP branch's `safeRedirect(searchParams.get("redirect"))` logic unchanged so vendor sign-ins still honor their `?redirect=` param.
**Commit:** `fix(admin): KI-001 PIN redirect to /admin + KI-002 toast centering`
**Verified:** QA'd on device — signing in via Admin PIN lands on /admin.

### ✅ KI-002 — Toast centering broke on `/admin` (Framer Motion transform overwrite)
**Resolved:** 2026-04-17 session 9
**Fix:** `app/admin/page.tsx` approval toast restructured to the wrapper-div pattern. Outer non-animated `<div>` does `position: fixed; left: 0; right: 0; bottom: env(...); display: flex; justify-content: center; padding: 0 16px; pointer-events: none`. Inner `<motion.div>` animates only opacity + y + scale and carries `pointer-events: auto`. The Framer-animated transform now sits on the inner element while centering lives on the non-animated shell, so they don't fight.
**Commit:** `fix(admin): KI-001 PIN redirect to /admin + KI-002 toast centering`
**Verified:** QA'd on device — approval toast appears horizontally centered at the bottom of /admin.
**Future prevention:** Both `MASTER_PROMPT.md` (KNOWN PLATFORM GOTCHAS) and `docs/DECISION_GATE.md` (Tech Rules) already called this out as a recurring trap. Consider extracting a shared `<CenteredToast>` component if it re-enters the codebase a third time.

### ✅ KI-003 — Post-approval vendor saw stale localStorage identity ("posting as Zen · booth 300")
**Resolved:** 2026-04-17 session 9
**Root cause (primary):** `/login` had two redirect-param names wired to different paths — the magic-link round-trip emitted `?next=`, the approval email CTA emitted `?redirect=`. The mount useEffect only read `next`, so users arriving via the approval email (who already had a persisted Supabase session) were redirected straight to `/my-shelf`, skipping `/setup` entirely. `/setup` never ran, vendor never got linked, and `/post` (before fix #2 below) fell through to whatever stale localStorage profile happened to be on the device.

**Fix (three parts, all in one commit):**

1. **`app/login/page.tsx`** — mount useEffect + `onAuthChange` callback now read `searchParams.get("redirect") ?? searchParams.get("next")`. Accepts both the approval-email path and the magic-link round-trip path without requiring callers to unify. Added an explanatory comment block covering the dual-param history.

2. **`app/post/page.tsx`** — identity resolution useEffect no longer falls through to `safeStorage.getItem(LOCAL_VENDOR_KEY)` when `uid` is set. Unauth users still get the localStorage path (preserved "post without account" option). Signed-in users with no DB-linked vendor render the vendor-setup form instead of silently surfacing whatever stale profile was last cached on the device. Permanently eliminates the "posting as Zen · booth 300" symptom class.

3. **`app/my-shelf/page.tsx`** — non-admin signed-in users with no linked vendor now call `/api/setup/lookup-vendor` as a self-heal step. Imported `authFetch` for the call. Makes `/my-shelf` a valid Flow 2/3 landing point even if `/setup` was skipped or raced. Idempotent via lookup-vendor's step-0 short-circuit.

**Observability addition:** `lib/adminAuth.ts` `requireAuth()` now logs 401 causes distinctly (missing header vs rejected token). Kept in production.

**Commit:** `fix(onboarding): KI-003 — unify redirect param + defensive identity guards + auth diagnostics`

**Verified:** David's iPhone QA — fresh `/vendor-request` → admin approve → email CTA → OTP → /setup flashed briefly → /my-shelf rendered with correct vendor name, booth, mall. Flow 2 onboarding end-to-end working.

**New issue surfaced during resolution:** the brief `/setup` flash is caused by a server-side token-validation race (documented above as the `/setup` 401 race polish item). Not blocking — Fix #3 catches and self-heals — but worth a 30-min polish pass.

---

## How to use this document

- **During sprint planning:** Review open issues, rank by severity, slot into the sprint.
- **During a session:** If you surface a new issue that can't be fixed in-session, add it here with severity + repro + recommended sprint so it doesn't get lost.
- **At session close:** Docs agent verifies any issues surfaced during the session are logged here before closing.
- **When an issue ships a fix:** Move the heading into the "Resolved" section with a one-line resolution note + commit reference. Preserves history without growing the Open section unbounded.

---

> Last updated: 2026-04-17 (session 10)

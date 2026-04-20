# Treehouse — Known Issues
> Active bugs, gaps, and deferred items. Referenced by `docs/DECISION_GATE.md`.
> Created: 2026-04-17 (session 8 — logging the three QA issues surfaced during T4a post-deploy).
> Last updated: 2026-04-20 (session 33 — KI-005 logged: pre-approval sign-in signaling gap).

---

## Open issues

### 🔴 KI-006 — Session-32 regression in `/api/setup/lookup-vendor` (pre-beta blocker)
**Surfaced:** 2026-04-20 session 33 QA walk step 6 (on-device)
**Severity:** High (🔴) — pre-beta blocker
**Status:** Open; fix shape depends on multi-booth scoping (likely session 34)

**Symptom:** Any Flow 3 vendor who fills in `booth_name` cannot complete `/setup` linkage after OTP sign-in. Auth verifies cleanly, session establishes, but `/api/setup/lookup-vendor` returns 404 and `/my-shelf` renders `<NoBooth>`. Vendor is stranded — cannot post finds, cannot reach their shelf.

**Root cause:** `/api/setup/lookup-vendor` step 2 joins `vendor_requests.name` against `vendors.display_name`:

```typescript
const { data: vendor } = await auth.service
  .from("vendors")
  .select("id")
  .eq("display_name", request.name)      // ← stale after session 32
  .eq("mall_id", request.mall_id)
  .is("user_id", null)
  .maybeSingle();
```

Before session 32, these fields always matched (approval set `display_name = name`). Session 32 introduced the new priority `booth_name → first+last → legacy name` for `display_name`, so any request with a non-null `booth_name` produces a `vendors` row whose `display_name` no longer equals `vendor_requests.name`. The join misses; route returns 404.

**Dependent-surface miss:** Session 32 changed how `display_name` was *derived* at write time (in `/api/admin/vendor-requests`) but didn't audit the routes that *read* it. `/api/setup/lookup-vendor` kept the stale equality assumption. This is the Tech Rule candidate ("dependent-surface audit when changing a field's semantic source") named at session-33 close.

**Blast radius:** Every remote Flow 3 vendor who picks a booth name — which is half the v1.2 feature set and explicitly encouraged by the "Leave blank to use your name" copy. Flow 2 (in-person demo) likely still works because admin would be at the device to run manual SQL recovery. Flow 1 unaffected (no `vendor_requests` row involved).

**Why not fixed session 33:** David named a bigger collision at close — the multi-booth data model. Fixing KI-006 in isolation would build on the wrong schema; the right sequence is scope-multi-booth-first, then the lookup rewrite becomes a natural sub-fix.

**Fix shape if multi-booth is deferred (Path B):**

Rewrite the lookup join to use `mall_id + booth_number + user_id IS NULL` as the primary composite (that's canonical — `vendors_mall_booth_unique` enforces it), with a three-way name fallback matching the session-32 approval priority if booth_number is null on the request:

```typescript
// Primary: canonical booth-in-mall composite
let { data: vendor } = request.booth_number
  ? await auth.service
      .from("vendors")
      .select("id")
      .eq("mall_id", request.mall_id)
      .eq("booth_number", request.booth_number)
      .is("user_id", null)
      .maybeSingle()
  : { data: null };

// Fallback for legacy rows / booth-less requests: name-priority match
if (!vendor) {
  const candidates = [
    (request.booth_name as string)?.trim(),
    request.first_name && request.last_name ? `${request.first_name} ${request.last_name}` : null,
    (request.name as string)?.trim(),
  ].filter(Boolean);
  for (const name of candidates) {
    const { data } = await auth.service
      .from("vendors")
      .select("id")
      .eq("display_name", name)
      .eq("mall_id", request.mall_id)
      .is("user_id", null)
      .maybeSingle();
    if (data) { vendor = data; break; }
  }
}
```

**Fix shape if multi-booth ships first (Path A, preferred):**

The route returns an array of linked vendors instead of a single row, composite key becomes `(email, mall_id, booth_number)`, `vendor_memberships` join table likely introduced, `vendors_user_id_key` constraint dropped. KI-006 becomes automatic — the new lookup is booth-explicit by construction.

**Verification when fixed:** Submit a fresh `/vendor-request` with a booth_name set. Approve in `/admin`. Sign in via OTP. `/my-shelf` should load the vendor's shelf, not `<NoBooth>`. The display_name on the shelf should match the booth_name, not first+last.

---

### 🟡 KI-005 — Pre-approval sign-in signaling gap
**Surfaced:** 2026-04-20 session 33 QA walk (step 1→2 gap on v1.2 onboarding refresh)
**Severity:** Low (🟢) — confusion, not flow failure
**Status:** Deferred to Sprint 5 guest-user UX batch

**What a vendor experiences:** Submits `/vendor-request` successfully, sees the v1.2 "You're on the list" receipt screen + Email #1 arrives. Taps Sign In out of curiosity before admin approval. `/login` doesn't recognize the in-flight request — it just asks for an email and sends an OTP. Vendor enters the code, session establishes, lands on `/my-shelf` which renders the `<NoBooth>` state ("No booth linked to this account · If you're a vendor awaiting approval, your booth will appear here once setup is complete"). Soft recovery, not a dead-end — but the signal came at the wrong place: the vendor was already committed to an OTP round trip before finding out nothing new was about to happen.

**What it is NOT:**
- Not a session-32 regression — this behavior predates the v1.2 refresh. Session 32 didn't touch `/login`; the v1.2 walk just exercised pre-approval sign-in for the first time.
- Not a security or data-integrity issue. No exposure; `auth.users` row creation pre-approval is benign (gets linked cleanly at `/setup` via email-match once admin approves).
- Not a flow gap — the `<NoBooth>` state at `/my-shelf` catches the vendor in a brand-appropriate landing.

**What it IS:** A signaling + copy issue at the email-entry step of `/login`, where a pending vendor would benefit from an in-place warm state ("We're still reviewing your request") rather than an OTP they don't need. Same visual vocabulary as `/vendor-request`'s `already_pending` done screen (Clock glyph, paper-wash bubble, email echo pill) — no new primitives required.

**Why deferred, not fixed now:** `/login` is a 🔴 STOP-level surface in `docs/DECISION_GATE.md` (auth flow change). Even a pre-OTP gate qualifies, because it introduces a new branch in the sign-in contract. Deserves a dedicated session, not a QA-walk sidebar.

**Shape of the eventual fix (for Sprint 5 scoping):**
1. New route `POST /api/auth/precheck-email { email }` — service-role read on `vendor_requests` + `vendors`, returns `{ state: "pending_approval" | "linked" | "approved_unlinked" | "unknown" }`.
2. `/login` calls precheck before `sendMagicLink`. On `pending_approval`, renders a warm in-place screen reusing the v1.2 Clock glyph + paper-wash bubble + email echo pill from `/vendor-request` done screens. Copy: *"We're still reviewing your request. We'll send a sign-in email the moment your shelf is ready."*
3. All other states → normal OTP path. Admin, Flow 1 claimants, and unknown emails fall through unchanged.
4. Rate limit the precheck route the same way `/api/auth/admin-pin` is rate-limited (5/min per IP) — new surface, deserves same hygiene.

**Natural batch home:** Sprint 5 guest-user UX ("Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, bookmarks persistence). Same family: onboarding-clarity fixes on shared-audience sign-in surfaces.

**Not blocking:** pre-beta testing. David can explain verbally to any in-person vendor who asks; remote vendors land on `<NoBooth>` with correct copy for the state.

---

## Deferred items (not bugs — scope-deferred decisions)

### Flow 1 "Claim this booth" — pre-seeded → vendor claim
**Context:** David's session-9 product scope: *"Everything is captured that is available — booth number, mall, booth name (if available). Once I speak with the booth owner or they reach out etc., then I'd just add their email and initiate the handoff to them so they could manage that booth."*

The KI-004 resolution in session 13 tightened the approve endpoint to *fail loudly* on a booth collision with a name mismatch. The claim-booth flow can later add an explicit `claim: true` flag on vendor_request to turn that rejection into a deliberate handoff, without changing any of the session-13 code. That is a purely additive future change.

**Not blocked:** admin can still pre-seed booths manually via SQL and hand them off via email today. The flow is just manual.

### Cloudflare DNS zone orphaned for `kentuckytreehouse.com`
Nameservers assigned but not authoritative. Dormant, no cost. Delete at leisure.

---

## Resolved

### ✅ KI-004 — Approve endpoint silent-reuse on booth collision + opaque error on slug collision
**Resolved:** 2026-04-17 session 13
**Surfaced originally:** 2026-04-17 session 9 (booth-collision silent-reuse)
**Additional surface discovered:** 2026-04-17 session 13 live test — same handler was also silently failing on `vendors_slug_key` collisions (not just `vendors_mall_booth_unique`). Two `David Butler` vendor_requests at different booths would both try to create slug `david-butler`, the second would hit 23505 on the slug constraint, and the recovery code (which only checked for booth constraint) would fall through to a booth-by-(mall, booth_number) `.single()` lookup that returned zero rows and threw *"Cannot coerce the result to a single JSON object."* Admin saw the generic *"Vendor exists but couldn't be loaded"* toast.

**Root cause, in full:** The `vendors` table has **four** unique constraints (`vendors_pkey`, `vendors_slug_key`, `vendors_mall_booth_unique`, `vendors_user_id_key`). The previous 23505 handler:
1. Assumed any 23505 was the booth constraint
2. Did a blind lookup by `(mall_id, booth_number).single()` — which fails on zero rows
3. If the lookup succeeded (booth constraint was the actual trigger), silently reused whatever row it found — regardless of whether that row was linked, unlinked, same-name, or different-name

**Fix (one commit, four files):**

1. **`app/api/admin/vendor-requests/route.ts`** — rewritten with constraint-aware handling. Pre-flight booth check runs BEFORE the insert and branches cleanly: safe-claim (unlinked + name match), reject (unlinked + name mismatch, with conflict details in response), hard-reject (already-linked booth, with named detail). Slug collision auto-resolves by appending a suffix (`david-butler` → `david-butler-2` → `-3` ...) up to 20 attempts. Every error response includes `diagnosis` code + `conflict` object so admin UI can render specifics.

2. **`app/api/admin/diagnose-request/route.ts`** (NEW) — admin-gated diagnostic endpoint. Returns the full collision picture for any `requestId`: the request row, booth collisions, slug collisions, auth.users matches, a diagnosis code, and a human-readable suggested action. Exists so admin can self-triage in-mall without running SQL.

3. **`app/admin/page.tsx`** — "Diagnose" link on every pending request row; full diagnosis panel renders inline on tap. Approval error toast now carries diagnosis/conflict fields and exposes a "Run full diagnosis" button that opens the same panel.

4. **`docs/admin-runbook.md`** (NEW) — 9-recipe SQL runbook for in-mall triage. Covers: request state lookup, booth occupancy inspection, freeing a booth, cleaning up test vendors, finding unlinked rows, auth status lookup, request reset, constraint inspection, deep diagnostic dump.

**Policy commits (session 13):**
- Slug collision → auto-append suffix (`-2`, `-3`, ...). Clean URLs for the common case, graceful degradation.
- Booth collision + unlinked + matching name → safe claim (reuse existing row). This is the original KI-004 "safe reuse" branch, now explicitly gated on name match.
- Booth collision + unlinked + different name → reject with named details. Admin renames the request or cleans up the stale row.
- Booth collision + already linked → hard reject with named details. Pick a different booth or unlink the claim via SQL.
- All error paths use `.maybeSingle()` instead of `.single()` so zero-row results return null instead of throwing "Cannot coerce..."

**Verified in repro:** The pending `dbutler80020+4@gmail.com` request (David Butler, All Peddlers, booth 200) will now approve cleanly with auto-assigned slug `david-butler-2`, because the existing David Butler at booth 245 holds `david-butler`.

**Commit:** `fix(admin): KI-004 — constraint-aware vendor approval + in-mall diagnostic tooling`

**Why not a separate claim-booth scoping session anymore:** David's session-9 call was "fix this properly later, not as snap-decision bug-fix work." Session 13's fix preserves all of that optionality — the claim-booth flow can still be built later as an additive `claim: true` flag on vendor_request without touching this code path. Today's fix is the right minimum: fail loudly where we used to corrupt silently.

---

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

> Last updated: 2026-04-17 (session 13)

# Treehouse — Known Issues
> Active bugs, gaps, and deferred items. Referenced by `docs/DECISION_GATE.md`.
> Created: 2026-04-17 (session 8 — logging the three QA issues surfaced during T4a post-deploy).

---

## Open issues

### 🟡 KI-001 — Admin PIN sign-in redirects to `/my-shelf` instead of `/admin`
**Surfaced:** 2026-04-17 session 8 (post-T4a QA)
**File:** `app/login/page.tsx` — `handlePin()` function, hardcoded `router.replace("/my-shelf")`
**Repro:** Sign into `/login` via the Admin PIN tab. Land on `/my-shelf` instead of `/admin`.
**Impact:** Admin-only annoyance. Extra tap to navigate to `/admin` after PIN login.
**Fix scope:** One-line change — `router.replace("/my-shelf")` → `router.replace("/admin")`.
**Related to:** T4b's broader scope (per `docs/onboarding-journey.md`) removes the Admin PIN tab from `/login` entirely and moves it behind `/admin`. This one-line fix is still worth shipping before T4b so PIN users aren't annoyed in the interim.
**Recommended sprint:** Can ship standalone as a 🟢 S item, or bundle into T4b (admin surface consolidation).

---

### 🟡 KI-002 — Toast centering breaks on `/admin` (recurring Framer Motion issue)
**Surfaced:** 2026-04-17 session 8 (post-T4a QA) — confirmed via screenshot, toast rendered flush-right, not centered
**File:** `app/admin/page.tsx` — approval toast `<motion.div>` uses `position: fixed; left: 50%; transform: translateX(-50%)` in `style`, and Framer Motion's `animate={{ y: 0 }}` writes its own `transform` value that overwrites the centering translate.
**Root cause:** Framer Motion does not merge external `transform` CSS with its animated transform — it replaces it wholesale. This is explicitly called out in MASTER_PROMPT.md's "KNOWN PLATFORM GOTCHAS" section: *"motion.div cannot have centering transform — use wrapper div."*
**Repro:** Approve any vendor request in `/admin`. The green toast that appears at the bottom of the screen is not horizontally centered — it drifts to one edge.
**Known-good pattern:** `app/post/page.tsx` solves this with a `<div style={{ position: fixed, inset: 0, display: flex, alignItems: center, justifyContent: center }}>` shell that does the positioning, and an inner `<motion.div>` that only animates opacity/y/scale. Apply the same pattern to the admin toast.
**Why it keeps happening:** The fixed-position-animated-element pattern is copy-pasted across pages. Each new instance reintroduces the bug until someone remembers to use the wrapper. Worth extracting a `<CenteredToast>` component to prevent future drift.
**Fix scope:** ~5 minute patch to `/admin` toast. Consider a shared component extraction in T4c's cleanup pass.
**Recommended sprint:** T4c (orphan cleanup) — bundled with other UI polish.

---

### 🔴 KI-003 — Post-approval vendor still sees stale localStorage identity ("posting as Zen · booth 300")
**Surfaced:** 2026-04-17 session 8 (post-T4a QA)
**Repro steps:**
1. Vendor approved via `/admin` (session 8 sent Email #2 successfully)
2. Vendor opens email on iPhone, taps "Sign in to your booth →"
3. Lands on `/login?redirect=/setup`
4. Enters email, receives OTP, enters code
5. Tapping "Add a photo" from wherever they end up shows **"Zen · booth 300"** — the stale vendor identity from a long-deleted vendor row (session 1 test data, wiped in session 7's DB reset)

**Expected:** After sign-in + `/setup` linking, the device should post against the newly-linked vendor (`David Butler / booth 123 / America's Antique Mall`), not the stale cache.

**Diagnosis (incomplete — needs investigation):** The session-7 scope-out predicted this was `/post` reading localStorage instead of the DB. On re-reading the code in session 8, **`/post` already does the right thing** — it calls `getVendorByUserId(uid)` on mount and prefers DB over localStorage if a vendor is linked. So either:
- (A) `/setup` didn't actually link the vendor on this device's sign-in (`lookup-vendor` error or race condition)
- (B) The session was already authed as a *different* user when `/post` loaded, and `getVendorByUserId` returned null for the wrong user_id
- (C) There's a timing/race in `/post`'s identity resolution that falls through to localStorage before the async DB call resolves

**Outstanding question for next session:** What did `/my-shelf` show the moment before tapping "Add a photo"? If `/my-shelf` showed the correct vendor and only `/post` was wrong → bug is in `/post`. If `/my-shelf` was also stale → bug is in `/setup` or session state.

**Why this is 🔴 High:** This is the session-7 bug the onboarding scope-out was supposed to resolve. The email infrastructure (T4a) shipped successfully, but the end-to-end journey is **still broken** — vendors get the email, sign in, land on the right page, and then still can't post as themselves. For pre-beta this is a blocker: we cannot onboard a real vendor until it's fixed.

**Fix scope:** Depends on the diagnostic. Best case ~15 min (race fix in `/post`). Worst case a few hours (re-work `/setup` linkage).
**Recommended sprint:** **T4c elevated to 🔴 blocking** — runs before T4b (admin surface consolidation) because nothing else in Flow 2/3 matters until a new vendor can actually post as themselves.

**Stale-state callout:** David's iPhone has `th_vendor_profile` for `Zen / booth 300` in localStorage. Needs to be cleared on-device before the diagnostic repro is clean — either via Sign Out from `/admin` gate, or via browser data clear. Otherwise the repro is fighting the stale cache on every attempt.

---

## Deferred items (not bugs — scope-deferred decisions)

### `/api/debug-vendor-requests` still in production
Unauthenticated diagnostic endpoint that exposes `vendor_requests` data. Flagged 🟡 security during session 7. Not blocking beta but worth retiring in a cleanup sprint.

### Cloudflare DNS zone orphaned for `kentuckytreehouse.com`
Nameservers assigned but not authoritative. Dormant, no cost. Delete at leisure.

### Stale vendor row `David Butler / booth 123 / America's Antique Mall` (user_id=NULL)
Created during session 7 QA, never linked. May be resolved naturally once KI-003 is fixed and David signs in fresh. Otherwise, clean up via SQL per `CLAUDE.md` "HOW TO CLEAR AN EMAIL FROM SUPABASE" section.

---

## How to use this document

- **During sprint planning:** Review open issues, rank by severity, slot into the sprint.
- **During a session:** If you surface a new issue that can't be fixed in-session, add it here with severity + repro + recommended sprint so it doesn't get lost.
- **At session close:** Docs agent verifies any issues surfaced during the session are logged here before closing.
- **When an issue ships a fix:** Mark the heading with ✅ and a one-line resolution note, then move it into a "Resolved" section at the bottom (to preserve history without growing the Open section unbounded).

---

> Last updated: 2026-04-17 (session 8)

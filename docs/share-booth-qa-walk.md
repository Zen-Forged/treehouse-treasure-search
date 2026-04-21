# Treehouse — Window Share QA Walk (Q-007 session 41)
> Runbook for on-device verification of the Window email share feature.
>
> Created: 2026-04-21 (session 41).
> Scope: four scenarios covering the fresh-send happy path, per-recipient
> dedup, IP rate-limit, and empty-window guard. Plus three cross-cutting
> smoke checks (masthead layout, CTA states, error copy).
>
> Cadence: once before declaring Q-007 shipped; re-run whenever a session
> touches `/api/share-booth/route.ts`, `components/ShareBoothSheet.tsx`,
> `/my-shelf` masthead, `lib/email.ts:sendBoothWindow`, or
> `lib/posts.ts:getVendorWindowPosts`.

---

## How to use this doc

David runs the walk on iPhone PWA (the vendor-facing surface). Each step has:

- **Do** — the exact action to take
- **Expect** — what should happen
- **Red flag** — what would be a regression

Any 🚨 → stop, capture screenshot + console + network tab if possible, come back to a session to fix before calling Q-007 shipped.

---

## Prerequisites

### Environment

- Production build deployed: `app.kentuckytreehouse.com` responds with the
  latest commit on `main` (session 40 commit, `feat(share): Q-007 session 40`)
- Supabase dashboard open for the server-log tail (Logs → API → filter on `[share-booth]`)
- iPhone signed in to Treehouse PWA as a vendor that owns at least one booth with ≥1 available post
- Two throwaway recipient email addresses (inbox access required — Gmail + Yahoo ideal to catch deliverability)
- The sender must be signed in as the booth's actual owner (ownership check is strict — no impersonation path opens this sheet)

### Baseline data state

Confirm the signed-in vendor has posts the server will actually send:

```sql
-- Replace <vendor_id> with the active vendor's uuid (visible in `localStorage.treehouse_active_vendor_id`
-- on device via Safari Web Inspector, or via: SELECT id, display_name, user_id FROM vendors WHERE user_id = '<auth-user-id>';)
SELECT id, title, status, created_at, image_url IS NULL as missing_image
FROM posts
WHERE vendor_id = '<vendor_id>'
  AND status = 'available'
ORDER BY created_at DESC
LIMIT 6;
```

**Expect:** At least 1 row, at most 6. `missing_image` should be `false` on every row (the PreviewTile null-fallback will render a "no photo" tile if not — the sheet still works, but the recipient sees a degraded tile).

Screenshot if anything looks off.

---

## Scenario 1 — Fresh send (happy path)

The canonical walk-up demo: vendor signed in, booth has finds, sends to a curious shopper.

### 1.1 — Masthead entry point

**Do:**
1. Navigate to `/my-shelf`
2. Scroll to top (the masthead is `position: sticky` so it's always visible, but a clean top-of-page read is easier)

**Expect:**
- Masthead shows three slots: empty 38px spacer on the left, centered title ("Treehouse Finds" for single-booth, or "Viewing / {BoothName} ▾" for multi-booth), and a 38px circular paper-wash bubble on the right containing a small paper-airplane glyph in green (`#1e4d2b`)
- The right-slot airplane is visibly distinct from the BoothHero's share button (which lives further down inside the banner)

**🚨 Red flag:**
- Masthead right slot is empty → `canShare` calc is wrong (vendor has 0 available posts OR the session-40 masthead prop wiring didn't land)
- Airplane in masthead is filled / solid-colored rather than outlined stroke → icon SVG regressed from the `MastheadPaperAirplane` in `app/my-shelf/page.tsx`
- Center column visually off-center → the right slot rendered as `<div />` instead of the bubble, breaking the `38px 1fr 38px` grid balance

### 1.2 — Open the sheet

**Do:** Tap the masthead airplane.

**Expect:**
- Scrim fades in over 220ms (rgba(30,20,10,0.38))
- Sheet slides up from bottom over 340ms, rounded 20px top, paperCream bg
- Handle pill visible at top (44×4, inkFaint)
- Centered IM Fell heading: italic 13px eyebrow "Share the booth" over 21px title "Send a Window into {boothName}"
- Mall + booth subtitle in system-ui 12px beneath ("America's Antique Mall · Booth 369" or equivalent)
- Hairline divider
- 3-tile preview strip (4:5 aspect, 6px radius, 8px gaps) — actual thumbnails of the vendor's 3 most-recent available posts
- Italic body line: "We'll send a small preview of the latest finds — with a link back to the booth."
- Uppercase label "RECIPIENT EMAIL" + input (inkWash bg, ink-primary text, 16px, hairline border)
- Filled green CTA "Send the Window" with inline paper-airplane icon — DISABLED
- Ghost-italic "Not now" link below
- Focus automatically in the email input ~280ms after open (iOS keyboard should rise)

**🚨 Red flag:**
- Sheet slides but also fades in or jerks vertically mid-animation → two `transition` props on the motion.div (DECISION_GATE Tech Rule violation)
- Sheet is not centered horizontally → centering transform reintroduced on the motion element (session-21A rule)
- Preview tiles empty / grey / broken-image icons → `image_url` null on posts (check SQL above) OR the PreviewTile null-fallback regressed
- Preview strip shows 6 tiles or 1 tile → `previewPosts.slice(0, 3)` wiring regressed
- Input won't accept typing → disabled state got stuck on, or focus never landed

### 1.3 — Type and validate

**Do:**
1. Type `notanemail` (no @) — CTA should stay disabled
2. Clear, type `still@bad` (no domain dot) — CTA should stay disabled
3. Clear, type `good@example.com` (replace with real throwaway inbox #1)

**Expect:**
- CTA stays disabled, grey-ish and non-tappable until the input matches `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- At first valid-shape email, CTA snaps to full opacity + becomes tappable
- No inline error copy anywhere (error state is reserved for server responses, not client validation)

**🚨 Red flag:**
- CTA enables on `good@` (no domain) → client regex drifted from the server regex (both should be identical)
- CTA enabled even on empty input → `trimmed` validation isn't firing

### 1.4 — Send

**Do:** Tap "Send the Window" (or press Return on the keyboard — Enter should submit when compose + valid).

**Expect:**
- CTA swaps to "Sending…" with inline spinner (2px ring rotating at 0.7s/rev)
- Input becomes non-editable (opacity drops to 0.6)
- Cancel link becomes non-tappable
- Backdrop tap becomes a no-op (clicking outside the sheet while `sending` does NOT close it)
- After a beat (usually 1–3s), sheet transitions to SENT state:
  - Check glyph in a green-tinted 56px bubble
  - "Window on its way" heading (IM Fell 23px)
  - Italic body line: "A Window into {boothName} is heading to"
  - Email echo pill (inkWash bg, hairline border, system-ui 14px) displaying the exact lowercased email that went to the server
  - Dashed "+ Share with someone else" loopback button
  - "Done" italic ghost link

**🚨 Red flag:**
- Sheet closes instead of transitioning to sent → `open` prop wired wrong
- CTA re-enables before sheet transitions → race between setStatus calls
- Email echo shows the email with original casing (not lowercased) → server lowercases before logging; client displays `trimmed` which is pre-lowercase. This is OK for now, but if the recipient email is mixed-case, the echo and the inbox-that-received may differ visually

### 1.5 — Recipient delivery check

**Do:** Switch to the throwaway inbox, wait up to ~60s for delivery.

**Expect:**
- Email subject: `"A Window into {boothName}"` (mode-neutral per session-38 decision 8)
- Preheader (Gmail preview line): `"{firstName} sent you a Window into {vendorName}."`
- Open the email:
  - "Treehouse Finds" lockup at top in Georgia 26px/600
  - Hairline
  - Vendor name in Georgia 34px/600
  - Sender voice italic line: `"{firstName} sent you a Window into {vendorName}."` — name-based, no pronoun (session-39 decision)
  - Hero banner with pinned post-it at +4° rotation (inline SVG rotation, not CSS)
  - Pin glyph + mall name + underlined Google Maps link
  - 3×2 grid (or fewer tiles if the vendor has <6 available posts — pads with empty cells to multiples of 3 per session-39 `renderWindowGrid`)
  - Italic captions under each tile, truncated via `max-height: 2.7em` if needed
  - "Explore the rest of the booth" closer with green pill CTA "Open in Treehouse Finds"
  - Footer: `"You're receiving this because someone shared a Treehouse Finds Window with you. Reply to this email if anything looks off."`
- Tap the CTA — opens `/vendor/{slug}` in the browser (MVP fallback; Universal Links is Q-006, Sprint 6+)

**🚨 Red flag:**
- Email in spam → Resend deliverability issue, not a code bug. Flag for ops, not a Q-007 blocker
- Post-it rendered horizontal (no rotation) → Outlook/Gmail stripped CSS transform; the inline SVG `transform="rotate(4)"` didn't take. Test specifically in iOS Mail + Gmail web
- Prices visible anywhere in the grid → brand rule violation (session-39 explicitly omits `price_asking` from `ShareBoothWindowPayload`)
- Brand lockup says just "Treehouse" → Q-004 rename sweep didn't land in `lib/email.ts`
- Empty grid cells have visible border/icon → `renderWindowGrid` empty-cell padding regressed
- Hero image shows a solid color instead of the banner photo → vendor's `hero_image_url` is null. Not a bug per se (session-39 graceful fallback), but confirm the SOLID is `#8b7a55` not the page cream

### 1.6 — Server log verification

**Do:** Check Supabase Logs or Vercel function logs for the `[share-booth]` prefix.

**Expect:**
- One success line: `[share-booth] {iso} - Window sent — from={slug} to={masked-email} user={signed-in-email} posts={n}`
- No ERROR lines

**🚨 Red flag:**
- Log shows `Window sent` but with `posts=0` → empty-window guard didn't trip, which means `getVendorWindowPosts` returned 0 but ownership check passed. Shouldn't be possible — investigate.

---

## Scenario 2 — Per-recipient dedup (429)

Exercises the 60-second per-(vendorId, recipient) guard in `dedupBlock()`.

### 2.1 — Second send to same recipient within 60s

**Do:**
1. Still on `/my-shelf` (sheet closed after sent from Scenario 1)
2. Immediately (<60s after Scenario 1's successful send), tap the masthead airplane again
3. Type the SAME throwaway email #1 as Scenario 1
4. Tap "Send the Window"

**Expect:**
- CTA swaps to "Sending…" briefly (<1s — the guard trips before Resend is called)
- Sheet transitions to ERROR state:
  - CTA re-enables
  - Inline red-bg notice above the CTA: `"Already sent to that address a moment ago — give it a minute."`
  - Input retains the typed email (user doesn't have to re-type)
- Recipient inbox receives NO additional email

**🚨 Red flag:**
- Sheet transitions to SENT state → dedup guard didn't fire (cleanup loop pruned the entry early, or the dedup key shape regressed). Critical — this is the double-tap protection.
- Error copy is the generic 429 fallback ("Too many sends — try again in a few minutes.") → `errorCopyFor` logic isn't preferring the server string on 429. Both are 429 status; the dedup copy is distinct and must land.
- Inline notice shown but CTA remains disabled → state got stuck in `sending`

**Server log check:** Expect one line: `[share-booth] {iso} - Per-recipient dedup block ... recipientMasked={masked}`

### 2.2 — Wait out the window

**Do:**
1. Close the sheet (Cancel / Not now / backdrop tap)
2. Wait at least 60 seconds
3. Reopen sheet, retype the same email, send

**Expect:** Full happy-path success as Scenario 1.5. Recipient receives a second email.

**🚨 Red flag:** Second send also blocks → dedup `reset` logic not working; entries never expire.

---

## Scenario 3 — IP rate limit (429)

Exercises `RATE_LIMIT_MAX = 5` / `RATE_LIMIT_WINDOW = 10 * 60_000`. Five sends are allowed in 10 minutes; the 6th triggers the IP-level block.

### 3.1 — Exhaust the limit

**Do:**
1. Send 5 successful Windows in rapid succession using 5 DIFFERENT recipient emails (so dedup doesn't trigger):
   - Email A (throwaway #1)
   - Email B (throwaway #2)
   - Email A+alias (e.g. `yourname+test1@gmail.com`)
   - Email A+alias2 (`yourname+test2@gmail.com`)
   - Email A+alias3 (`yourname+test3@gmail.com`)
2. Open sheet a 6th time, type any NEW valid email, tap Send

**Expect:**
- First 5 all succeed (scenario 1.4 behavior each time)
- 6th send transitions to ERROR state:
  - Inline red-bg notice: `"Too many sends — try again in a few minutes."`
  - CTA re-enabled
- No new email sent for the 6th

**🚨 Red flag:**
- 6th send succeeds → rate limiter not enforcing. Critical abuse lever for pre-beta.
- Rate limit fires before 6th → `RATE_LIMIT_MAX` drifted down from 5 OR the rate limiter counts failed attempts (it shouldn't — the limiter increments on every call pre-auth, so this is fine as long as `MAX=5`)
- Error copy says "Already sent to that address" → error dispatch wrong; the server distinguishes dedup vs. IP-rate-limit via the error string, and `errorCopyFor` preferentially uses the server string

**Server log check:** Expect one line per successful send (`Window sent`), then one `Rate limit exceeded` line on the 6th attempt.

### 3.2 — Cooldown (optional)

This is the one bit of the walk that can't be done in a single sitting — the rate-limit window is 10 minutes. If you want to verify the reset:

**Do:** Wait 10 full minutes. Attempt a 6th send.

**Expect:** Succeeds.

Skipping this is fine. The session-39 rate-limit code is the same pattern as `/api/vendor-request`, which has been in production for weeks with the reset verified.

---

## Scenario 4 — Empty-window guard (409)

Exercises the server's `posts.length === 0` check AND the client's `canShare` gate.

### 4.1 — Client gate (icon hidden)

**Do:**
1. In Supabase SQL Editor, mark all of the signed-in vendor's posts as sold (or delete the available ones temporarily):

```sql
-- SCENARIO 4 — EMPTY WINDOW SETUP. Reversible below.
UPDATE posts
SET status = 'sold'
WHERE vendor_id = '<vendor_id>' AND status = 'available';
```

2. On device, pull-to-refresh `/my-shelf` (or navigate away and back so `getVendorPosts` re-runs)

**Expect:**
- Masthead right slot renders as empty 38px spacer (the `<div />` branch of the `canShare ? ... : <div />` ternary)
- Title column stays centered (grid balance holds)
- WindowView below shows placeholder / add-find tiles only (no available posts to render)

**🚨 Red flag:**
- Airplane still visible → `available.length >= 1` gate isn't firing. Vendor can tap and hit the server 409 — not a security issue but a UX regression.
- Layout shifts / title column drifts left → the fallback isn't a 38px div, it's `null` or missing entirely

### 4.2 — Server gate (direct POST)

Defense-in-depth check. Skip if you don't have `curl` / a REST client handy — not critical because the UI gate is the primary protection.

**Do:** From a terminal with `curl` and the vendor's bearer token:

```bash
# Get the bearer token from Safari Web Inspector on device:
# Application → Local Storage → supabase auth token → copy access_token

curl -i -X POST https://app.kentuckytreehouse.com/api/share-booth \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail":"test@example.com","activeVendorId":"<vendor_id>"}'
```

**Expect:**
- HTTP 409
- Body: `{"ok":false,"error":"empty_window"}`

**🚨 Red flag:**
- 200 OK → empty-window guard regressed in the route
- 403 → ownership check failed (wrong vendor_id OR wrong token)
- Email actually sent → MASSIVE regression, the guard is gone. Escalate immediately.

### 4.3 — Restore posts

**Do:** Revert the SQL from 4.1:

```sql
-- SCENARIO 4 — RESTORE. Only marks rows you changed this session.
-- WARNING: this will also re-surface any genuinely-sold posts modified above.
-- Be surgical if other sessions have touched status in the meantime.
UPDATE posts
SET status = 'available'
WHERE vendor_id = '<vendor_id>'
  AND status = 'sold'
  AND updated_at > now() - interval '1 hour';  -- narrows to the QA-walk modifications
```

Re-check `/my-shelf` — masthead airplane should return.

**🚨 Red flag:** Airplane doesn't return on refresh → `available` state didn't re-read. Pull-to-refresh again or force a navigation round-trip.

---

## Cross-cutting smoke checks

Quick visual confirmations that don't warrant their own scenario.

### A — Masthead balance across both variants

**Do:** Open `/my-shelf` first as a single-booth vendor, then (if possible) as a multi-booth vendor.

**Expect:**
- Single-booth: center label reads "Treehouse Finds" in IM Fell 18px, right-slot airplane visible (assuming posts exist)
- Multi-booth: center label becomes "Viewing / {BoothName} ▾" stacked block (italic eyebrow + main line + chevron), right-slot airplane visible
- In both, the center is horizontally centered (grid columns still `38px 1fr 38px`)

**🚨 Red flag:** Center drifts left when the airplane renders → the right-slot button's width isn't 38px (inspect via Web Inspector, confirm `width: 38px; height: 38px` on the button).

### B — Sheet close paths

**Do:** Open the sheet. Verify each close path works:
1. Tap backdrop (outside the sheet)
2. Tap "Not now" in compose state
3. Tap "Done" in sent state (after a successful send)
4. Swipe down on the handle (OS-level gesture; may not work — framer-motion drag isn't wired on this sheet)

**Expect:** #1–3 close cleanly with slide-down animation. #4 likely doesn't work and that's acceptable for MVP (the BoothPickerSheet doesn't have drag either).

### C — Multiple send cycles without remount

**Do:**
1. Send a Window successfully (Scenario 1)
2. Tap "+ Share with someone else" on the sent screen
3. Sheet should return to compose state with empty input and focus returned
4. Send to a second email successfully

**Expect:** Full round trip, no memory leaks, no stuck sending state between cycles.

**🚨 Red flag:** Second send stays stuck on "Sending…" indefinitely → `status` state didn't reset cleanly.

---

## Exit criteria

Q-007 client walk passes when:

1. ✅ Scenario 1 — Fresh send reaches the recipient inbox, email renders correctly in iOS Mail (minimum) and ideally Gmail web + Yahoo
2. ✅ Scenario 2 — Per-recipient dedup blocks the second send within 60s with the correct copy
3. ✅ Scenario 3 — IP rate-limit blocks the 6th send within 10min with the correct copy
4. ✅ Scenario 4.1 — Masthead airplane hides when the booth has 0 available posts
5. ✅ Scenario 4.2 (optional) — Direct POST returns 409 `empty_window` when vendor has 0 posts
6. ✅ No console errors across any scenario
7. ✅ No graceful-collapse to "Couldn't send" on any scenario where Resend should be reachable (session-27 graceful-collapse-observability watchdog)

If all 5 required (1–4.1) + the two cross-cutting required (6–7) pass → Q-007 is shipped. Update the roadmap, strike it from Known Gaps.

If any fail → capture screenshots + server logs, come back in a session-42+ to fix, re-walk only the failing scenarios.

---

## What this walk deliberately does NOT cover

Consistent with the build spec's out-of-scope list:

- Deep-link-if-installed CTA behavior (Q-006, Sprint 6+)
- Multi-recipient batch sends (MVP is 1 at a time)
- PNG export / story-ready image (Direction C, Sprint 6+)
- Admin moderation queue (rate limit is the MVP abuse lever)
- `share_events` audit table (Sprint 6+)
- Reply-to vendor directly (needs vendor-contact-email pattern; Sprint 5+)
- Scheduled retry on Resend 5xx (MVP is best-effort)

---
> Maintained by Docs agent. Update when `/api/share-booth`, `sendBoothWindow`,
> or the `<ShareBoothSheet>` contract changes.

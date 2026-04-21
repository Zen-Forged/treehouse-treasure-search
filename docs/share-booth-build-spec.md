# Treehouse — Share Your Booth ("Window Email") Build Spec
> Version: 1.0 | Created: 2026-04-21 (session 38 close) | Author: Dev agent, under Design agent supervision
> Status: **Dev-handoff doc.** David does not read this — future Claude sessions do.
> Mockup (source of truth): `docs/mockups/share-booth-email-v1.html`
> **If mockup and spec disagree, the mockup wins** (session-28 Design agent rule).

---

## What this is

The Window email is Treehouse's MVP vendor-share feature. A vendor (or a curious shopper) on `/my-shelf` taps a share icon, types one recipient email, and Treehouse fires a formatted email to the recipient containing a "Window" into the booth — hero image, post-it, location, a 6-tile grid of the most-recent available finds, and an invitation to open the booth in Treehouse Finds.

This is **Direction B** from session 38's scoping brainstorm. Direction A (native share sheet + OG link) and Direction C (shareable PNG) are deferred to Sprint 6+.

## Why it matters (product rationale, for context)

Every vendor's booth is a local secret. Inventory exists, buyers exist, no bridge between them. Treehouse already has the window (the live `/vendor/[slug]` page) — what's missing is the share gesture: the moment a vendor pulls the booth out of the app and drops it into the wild world of email threads. The Window email is that gesture. First recipient is the "vendor walks the mall, runs into a curious shopper" demo beat.

---

## Decisions locked in mockup approval (session 38)

1. **Window = 6 auto-picked tiles.** Most-recent `status='available'` posts for the active booth. No manual picker. No placeholder padding if fewer than 6 — the Window truncates. Empty shelf hides the share entry entirely.
2. **One recipient per send.** Walk-up demo surface. Works whether the sender is a vendor sharing their own booth or a shopper sharing a booth they discovered.
3. **Georgia throughout the email body.** Extends the committed `renderEmailShell()` contract in `lib/email.ts`. No IM Fell in the email, ever. (See `email-v1-2.html` session-32 rationale.)
4. **Hero weight — brand small top, vendor is body hero.** Treehouse Finds lockup at shell-standard Georgia 26px/600; vendor name drops below the hairline at Georgia 34px/600.
5. **Booth banner + pinned post-it mirrors `/my-shelf` BoothHero.** Hero image behind, post-it pinned bottom-right at 6° rotation. Same 196px height, same 86px post-it, same pin. NOT the centered post-it treatment from the first mockup draft.
6. **Captions under Window tiles — keep.** Three-word limit, Georgia 12px italic, no prices.
7. **No "Sent from Treehouse" app-closer block.** The main CTA ("Open in Treehouse Finds") is the install hook. Secondary closer block retired.
8. **Subject line mode-neutral.** `"A Window into {vendorName}"` — works regardless of sender. Sender attribution carried by the in-body italic line.
9. **Sender voice (body only).** `"{firstName} sent you a Window into {pronoun} booth."` — pronoun resolution TBD; see §Unresolved below.

---

## 🚩 Cross-session dependencies (flagged at mockup approval)

Three sweeps that this feature's surfaces preview but does NOT authorize. These are independent sessions queued in `docs/queued-sessions.md` and should be sequenced BEFORE or ALONGSIDE Window implementation, not after.

- **Q-004 — "Treehouse" → "Treehouse Finds" product rename sweep.** The email shell lockup change is part of this. DO NOT ship the Window email with the new lockup while Email #1 / Email #2 still say "Treehouse." Either sequence Q-004 first (sweep everything) or hold the Window lockup at "Treehouse" until Q-004 ships.
- **Q-005 — Email tagline sweep.** `"Kentucky & Southern Indiana"` → `"Embrace the Search. Treasure the Find."` Same sequencing constraint as Q-004 — part of the rename-family batch.
- **Q-006 — Universal Links / deep-link-if-installed CTA behavior.** MVP ships with the browser fallback (`/vendor/[slug]`). Deep-link to PWA is a Sprint 6+ sprint. This is a known limitation, NOT a blocker.

**Recommended sequencing:** Run Q-004 + Q-005 together as the rename batch (one session, two files touched). Then run Window Sprint against the already-renamed shell. That way the Window is the first email to ship under the new name rather than the last email to ship under the old one.

---

## Architecture overview

```
┌──────────────────┐   POST /api/share-booth   ┌────────────────────┐
│  /my-shelf       │ ────────────────────────→ │  route.ts          │
│  <ShareBoothSheet>│                            │  requireAuth()     │
│  (client)        │                            │  rate-limit        │
└──────────────────┘                            │  getActiveVendor   │
                                                │  getVendorPosts(6) │
                                                │  sendBoothWindow() │
                                                └─────────┬──────────┘
                                                          │ Resend REST API
                                                          ▼
                                                ┌────────────────────┐
                                                │  recipient inbox   │
                                                └────────────────────┘
```

### Data flow
1. Client authenticates with Supabase (vendor is already signed in to reach `/my-shelf`).
2. `<ShareBoothSheet>` collects one recipient email, validates RFC shape client-side.
3. `authFetch` POSTs `{ recipientEmail, activeVendorId }` to `/api/share-booth` with bearer token.
4. Server `requireAuth()` validates token, resolves signed-in user, confirms `activeVendorId` belongs to this user via `getVendorsByUserId(user.id)` — reject if not owned.
5. Server loads vendor (with mall joined) + 6 most-recent available posts.
6. Server calls `sendBoothWindow()` which composes HTML via extended `renderEmailShell()` and POSTs to Resend.
7. Server returns `{ ok: true }` or `{ ok: false, error }`. Client renders confirmation or error state.

---

## Component + file changes

### New files

| File | Purpose |
|---|---|
| `app/api/share-booth/route.ts` | POST handler. `requireAuth` + ownership check + rate limit + send. |
| `components/ShareBoothSheet.tsx` | Client component — bottom-sheet compose UI. Mirrors `<BoothPickerSheet>` chrome. |
| `docs/share-booth-build-spec.md` | This document. |

### Modified files

| File | Change |
|---|---|
| `lib/email.ts` | Add `sendBoothWindow(payload)` export + body-composition helpers. |
| `app/my-shelf/page.tsx` | Add share-icon button in masthead right slot. Instantiate `<ShareBoothSheet>`. Hide icon when vendor has no available posts. |
| `lib/posts.ts` | Add `getVendorWindowPosts(vendorId)` — new function, do NOT mutate `getVendorPosts` semantics. |
| `docs/mockups/share-booth-email-v1.html` | Mark mockup as APPROVED once ship confirms. |
| `CLAUDE.md` | Move Window from "next session" to "Sprint 4.5 shipped" on commit. |

---

## Detailed specs

### 1. `POST /api/share-booth`

**Auth:** `requireAuth(req)` — any signed-in user who owns at least one vendor row.

**Request body:**
```ts
{
  recipientEmail: string;   // RFC-validated client-side; server re-validates
  activeVendorId: string;   // UUID of the booth being shared
}
```

**Server flow:**
1. `const auth = await requireAuth(req); if (!auth.ok) return auth.response;`
2. Parse body. Validate `recipientEmail` with the same regex the client uses. Validate `activeVendorId` as UUID.
3. Rate-limit check: 5 sends per 10 minutes per IP. Use the same in-memory limiter pattern as `/api/vendor-request`. Key: `"share-booth:" + ip`.
4. Per-recipient dedup: 60-second in-memory guard keyed on `activeVendorId + recipientEmail`. Prevents accidental double-tap sends.
5. **Ownership check:** `const vendors = await getVendorsByUserId(auth.user.id);` — reject if no vendor in that list has id `=== activeVendorId`.
6. Load vendor (with mall via join or second fetch). Load 6 posts via `getVendorWindowPosts(activeVendorId)`.
7. Guard: if `posts.length === 0`, return `409 Conflict` with `{ ok: false, error: "empty_window" }`. Client should never hit this (entry icon is hidden) but defense in depth.
8. Call `sendBoothWindow({ recipientEmail, vendor, mall, posts, senderFirstName })` — `senderFirstName` comes from `vendor.display_name` OR (if we add it) the sender's own first name from their profile. **See §Unresolved.**
9. Return `{ ok: true }` on Resend success, `{ ok: false, error: string }` on failure.
10. ALL server errors log with context (admin email + vendor slug + truncated recipient) for post-mortem.

**Response:**
```ts
{ ok: true } | { ok: false, error: string }
```

**Rate-limit copy** (returned in error body when 429s): `"Too many sends — try again in a few minutes."`

### 2. `lib/email.ts: sendBoothWindow(payload)`

**New types:**
```ts
export interface ShareBoothWindowPayload {
  recipientEmail: string;
  senderFirstName: string;   // resolves the in-body "{name} sent you..." line
  senderPronoun?: "his" | "her" | "their"; // default "their" — see §Unresolved
  vendor: {
    displayName: string;
    boothNumber: string | null;
    heroImageUrl: string | null;  // null → graceful solid-color fallback
    slug: string;
  };
  mall: {
    name: string;
    address: string | null;
    googleMapsUrl: string | null;
  };
  posts: Array<{
    id: string;
    title: string;        // truncated to ~22 chars for caption
    imageUrl: string;
    priceAsking: number | null;  // IGNORED — brand rule, no prices in Window
  }>;
}
```

**Signature:**
```ts
export async function sendBoothWindow(
  payload: ShareBoothWindowPayload,
): Promise<{ ok: boolean; error?: string }>
```

**Composition (extends `renderEmailShell()`):**
- Shell wrapper unchanged (Treehouse Finds lockup — post-Q-004 — at top, footer at bottom).
- Body HTML built by a new private helper `renderWindowBody(payload)` that composes:
  1. Sender voice italic Georgia 14px: `"{firstName} sent you a Window into {pronoun} booth."`
  2. Vendor name h2 at Georgia 34px/600 centered.
  3. Banner `<table>` (table-based for Outlook compat — see §Email rendering notes) with hero image background + post-it overlay.
  4. Pin glyph row: `⚲` + mall name Georgia 15px/semibold + underlined Google Maps link in system-ui 13px.
  5. Window grid — 6-cell HTML table with 3 cols × 2 rows. Each cell: 4:5 image + 12px italic Georgia caption.
  6. Closer block: Georgia italic 19px "Explore the rest of the booth" + Georgia 13px "More treasures waiting to be discovered." + green pill CTA "Open in Treehouse Finds" linking to `/vendor/{slug}`.
- Footer from shell: `"You're receiving this because someone shared a Treehouse Finds Window with you. Reply to this email if anything looks off."`
- Preheader: `"{firstName} sent you a Window into {vendorName}."`
- Subject: `"A Window into {vendorName}"` (mode-neutral per decision 8).
- `reply_to`: admin email (MVP). Replying to the vendor directly is deferred.

**Post-it rotation in email:**
- CSS `transform` is stripped by Outlook and some Gmail native clients.
- Render the post-it as **inline SVG** with `transform="rotate(4)"` inside the SVG. SVG rotation IS respected by all modern mail clients.
- Mockup uses CSS rotation for review fidelity — do not copy that approach into production.

**Image handling:**
- Post images + hero: use the same Supabase Storage public URLs as the feed. No resizing at send time.
- Fallback for missing hero image: solid `#8b7a55` fill with the scrim gradient simulated via a linear-gradient fallback table cell.
- Alt text required on every `<img>`: `alt="{post.title}"` or `alt="Booth at {mall.name}"` for the hero.

### 3. `<ShareBoothSheet>` component

**Location:** `components/ShareBoothSheet.tsx`

**Props:**
```ts
interface ShareBoothSheetProps {
  open: boolean;
  onClose: () => void;
  vendor: Vendor;
  mall: Mall;
  // Preview posts come pre-loaded from /my-shelf parent to avoid double-fetch
  previewPosts: Post[];
}
```

**States:**
- `compose` — default. Email input, CTA disabled until RFC-valid.
- `sending` — CTA shows spinner, disabled. Fetch in flight.
- `sent` — confirmation screen (paper-wash bubble + check + echoed email + "Share with someone else" loop-back link).
- `error` — error message inline above the CTA, CTA re-enabled. Retry POSTs the same payload.

**Chrome:** Mirror `<BoothPickerSheet>` exactly — same backdrop fade 220ms, same y-slide 340ms, same `[0.25, 0.1, 0.25, 1]` easing, same handle pill, same 22px horizontal padding, body-scroll lock while open. Reuse wherever possible; do not re-invent the motion primitives.

**Share-again loop:** "Share with someone else" clears the email input and returns to `compose` state, preserving the preview frame.

**RFC validation regex:** use the SAME regex as `/vendor-request` client-side validation. Grep for it — don't duplicate.

**Client fetch:** `authFetch("/api/share-booth", { method: "POST", body: JSON.stringify(...) })`.

### 4. `/my-shelf` entry point

- Masthead right slot: share icon replaces `☰`. 36px `ink-bubble` bg with a small paper-airplane SVG in `green` (`#1e4d2b`). Tap opens `<ShareBoothSheet>`.
- **Visibility:** the share button renders only when `activeVendor && previewPosts.length >= 1`. Zero-post vendors see no icon (no empty Window to share).
- **Q-002 coexistence:** the masthead center slot is the brand lockup "Treehouse Finds" (single variant, post-Q-002). Share icon right-slot works with either Q-002-applied or pre-Q-002 mastheads. No ordering dependency.

### 5. `lib/posts.ts: getVendorWindowPosts(vendorId)`

**Why a new function instead of mutating `getVendorPosts(vendorId, limit)`:** session-33 dependent-surface audit lesson. `getVendorPosts` is used across `/my-shelf`, `/vendor/[slug]`, admin. All of those currently filter status at the call site or expect a specific ordering. Changing its semantics would be a dependent-surface mutation. Instead:

```ts
export async function getVendorWindowPosts(vendorId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) { console.error(error); return []; }
  return (data ?? []) as Post[];
}
```

Single-purpose. Explicit semantics. Future callers know exactly what shape to expect.

---

## Email rendering notes

1. **Table-based layout is MANDATORY.** Outlook renders most `div + flexbox` HTML as a disaster. Use `<table role="presentation">` for the Window grid and the banner. Mockup shows the intended visual; production HTML emits tables.
2. **Post-it via inline SVG.** Not CSS. Not PNG (retina concerns + file size). Inline SVG with `transform="rotate(4)"` attribute on the `<g>` wrapping the post-it contents. Test renders in Apple Mail, Gmail native iOS, Gmail web, Outlook web, Yahoo web before declaring shippable.
3. **6-tile grid fallback.** If Outlook misrenders the 3-col table (known risk — Outlook sometimes collapses nested tables), ship a secondary stylesheet hint: the grid collapses to a vertical 2-col (3 rows × 2 cols) stack. This is a graceful degradation, NOT a feature toggle. Test in Outlook web before concluding whether it's needed.
4. **Font stack for email:** `Georgia, 'Times New Roman', serif` — same as `renderEmailShell()` constant `SERIF`. Do not introduce IM Fell or any web font. Zero external font loads in email body.
5. **Colors via hex literals, not CSS vars.** `renderEmailShell()` already uses this pattern. Copy the `INK`, `PAPER`, `HAIR`, `FAINT` constants from the top of `lib/email.ts` — they exist.
6. **Preheader hidden div** — the shell already handles this via `opts.preheader`. Just pass the preheader string.

---

## Rate limiting + abuse

| Lever | Value | Rationale |
|---|---|---|
| Per-IP rate limit | 5 sends / 10 min | Matches `/api/vendor-request`. Tight enough to prevent scripting, loose enough for a vendor at a mall demoing back-to-back. |
| Per-recipient dedup (in-memory) | 60 seconds | Prevents accidental double-tap double-sends if CTA disable timing glitches. |
| Auth gate | `requireAuth` + vendor ownership | Only signed-in users who own the booth can share it. Shoppers cannot share vendor booths in MVP. |
| Empty-window guard | 409 Conflict if `posts.length === 0` | Defense in depth; UI hides the entry but server should not send blank Windows. |
| Admin moderation | NONE in MVP | Rate limit is the abuse lever. Add a `share_events` audit table in Sprint 6+ if abuse surfaces. |

---

## Testing + QA

### Build check
`npm run build 2>&1 | tail -30` before every commit. No new TypeScript errors. Framer Motion rules (one `transition` prop per motion.div) apply to `<ShareBoothSheet>`.

### On-device walk (required before marking feature shipped)

Vendor with ≥6 available posts:
- [ ] Tap share icon → sheet opens with preview
- [ ] Enter valid email → CTA enables, single tap submits
- [ ] Confirmation lands with echoed email
- [ ] "Share with someone else" clears input, returns to compose
- [ ] Recipient inbox: subject line reads `"A Window into {vendor}"`, email renders correctly
- [ ] Open on iPhone Mail, Gmail web, Yahoo (known historical delivery issue)
- [ ] Tap "Open in Treehouse Finds" CTA → lands on `/vendor/{slug}` in browser

Vendor with 1–5 available posts:
- [ ] Window shows actual count (no placeholder tiles)
- [ ] Send + receive verification same as above

Vendor with 0 available posts:
- [ ] Share icon hidden in masthead
- [ ] Direct POST to `/api/share-booth` returns 409

Vendor with multiple booths (multi-booth case):
- [ ] Switch active booth via `<BoothPickerSheet>` → share sends from the CURRENT active booth only
- [ ] Cross-check: `/my-shelf` displayed booth === Window email content

Error paths:
- [ ] Malformed email → CTA stays disabled, inline validation copy
- [ ] Rate-limit hit (submit 6 times in 10 min) → error state with copy
- [ ] Resend API 5xx → error state with retry
- [ ] Network offline → error state with retry

---

## Unresolved — decide during build

1. **Pronoun in the sender voice line.** `"Sarah sent you a Window into her booth."` — what about `his`, `their`, non-binary vendors? MVP options:
   - (a) Always `their` — safe, grammatically correct, slightly less warm than `her/his`.
   - (b) Add a `pronoun` column to `vendors`, let vendor pick at onboarding.
   - (c) Drop the pronoun entirely — rephrase: `"Sarah sent you a Window into ZenForged Finds."` (uses vendor name instead).
   - **Lean: (c).** Cleanest. No schema change. No guessing. Subject line already uses this pattern.
2. **"Sender's first name" source.** The sender is the signed-in user. Where do we read their first name from?
   - Vendors have `first_name` on `vendor_requests` but that row might not exist for Flow 1 pre-seeded vendors.
   - Fallback: use `vendor.display_name` as the sender identity (implies vendor always shares their own booth — fine for MVP since ownership check enforces this).
   - **Lean:** for MVP, use `vendor.display_name` as the sender identity. Revisit in Sprint 5+ if non-vendor shoppers sharing becomes real (Direction A territory).
3. **Truncation of post titles for captions.** Design spec says "three-word limit" (e.g. `"Brass camel figurine"`). Real post titles can be 20+ chars. Do we:
   - (a) Client-truncate at render time (ugly, risks cutting mid-word).
   - (b) Let Georgia italic 12px wrap to 2 lines with `line-clamp: 2` (matches mockup CSS).
   - **Lean: (b).** Already in the mockup. Email clients mostly respect line-clamp via overflow:hidden + max-height trick.

---

## Session estimate (revised post-mockup)

| Session | Work | Est. |
|---|---|---|
| 38 (this session) | Mockup + approval + build spec written | ✅ Done |
| 39 | `lib/email.ts: sendBoothWindow()` + `POST /api/share-booth` + rate limit + ownership check + `getVendorWindowPosts` | 90 min |
| 40 | `<ShareBoothSheet>` component + `/my-shelf` entry point wiring + all 4 states | 90 min |
| 41 | On-device QA walk (all 4 scenarios above) + fixes + commit | 60–90 min |

**Total after 38:** 3 sessions.

**Sequencing note:** Q-004 + Q-005 (rename sweep) should run EITHER immediately before session 39, OR the Window lockup ships as "Treehouse" until the rename batch lands. Mixing lockups across the three emails is worse than any other option.

---

## Out of scope (confirmed at mockup approval)

- Multiple recipients per send — MVP is 1 at a time.
- Direction A (native share sheet + OG link) — Sprint 6+.
- Direction C (shareable PNG / story-ready image) — Sprint 6+.
- Manual find selection (vendor picks which 6) — revisit only if vendors ask.
- Reply-to vendor directly — needs vendor-contact-email pattern; Sprint 5+.
- Scheduled-send retry on Resend failure — MVP is best-effort.
- Admin moderation queue — rate limit is the lever.
- `share_events` audit table — Sprint 6+ if analytics are wanted.
- Deep-link-if-installed CTA — needs Universal Links (Q-006, Sprint 6+).

---

> Mockup approved: 2026-04-21 (session 38).
> Spec authored: 2026-04-21 (session 38 close).
> Ready for implementation: YES, pending Q-004/Q-005 sequencing call.

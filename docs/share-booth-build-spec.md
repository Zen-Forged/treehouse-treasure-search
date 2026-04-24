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

Session 50 (Q-008) opened the share endpoint to unauthenticated shoppers. The server now branches on the `Authorization` header:

| Lever | Auth branch (vendor / admin) | Anon branch (shopper) | Rationale |
|---|---|---|---|
| Per-IP rate limit | 5 sends / 10 min | **2 sends / 10 min** | Two independent buckets by IP so vendor + shopper quotas don't compound. Anon cap is tighter because the anon path has less abuse friction; a shopper typically sends to one friend, not five. |
| Per-recipient dedup (in-memory) | 60 seconds | 60 seconds (shared) | Same dedup map. Prevents accidental double-tap double-sends either way. |
| Auth gate | `requireAuth` + vendor ownership (admin bypass via `NEXT_PUBLIC_ADMIN_EMAIL`) | **No auth. No ownership check.** | Header-presence selects the branch. A malformed/expired token on the auth branch still 401s — we don't silently fall through to the anon path. |
| Sender voice (email body) | `"{vendor.display_name} sent you a Window into {vendor}."` | **Voice line omitted.** Vendor-name hero still leads. | Shoppers aren't the vendor — forging vendor attribution would be dishonest. `senderMode: "anonymous"` on `sendBoothWindow()` drops the line. Preheader + plain-text fallback drop it too. |
| Empty-window guard | 409 Conflict if `posts.length === 0` | 409 Conflict (same) | Defense in depth on both branches. |
| Admin moderation | NONE in MVP | NONE in MVP | Rate limit is the abuse lever. Audit table (`share_events`) is Sprint 6+. |

**Where the shopper entry point lives:** `/shelf/[slug]` masthead airplane. Visible whenever `available.length >= 1` (mirrors the 409 guard). `app/shelf/[slug]/page.tsx` computes `shareMode` per viewer — admin OR booth owner → `"vendor"`; everyone else → `"shopper"`. `<ShareBoothSheet mode="shopper">` uses plain `fetch` (no bearer) so a signed-in non-owner viewing someone else's booth still lands on the anon server branch instead of 403.

**Out of scope (Q-008):** individual `/find/[id]` share-to-friend — separate sprint. Captcha on anon path — rate limit is the abuse lever; revisit if abuse surfaces.

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

---

# v2 addendum — Window email banner redesign (Q-011, session 52)

> Mockup (source of truth): `docs/mockups/share-booth-email-v2.html` (v2.2 final state).
> Mockup approved: 2026-04-24 (session 51).
> Spec addendum: 2026-04-24 (session 52, this session).
> **If v2 mockup and this addendum disagree, the mockup wins.**

## Why this addendum exists

Session 50 shipped Q-008 (shopper share branch). Session 51 QA walk on Q-008 PASSED 5/5. An initial attempt at Q-011 (session 51, first pass) treated it as an SVG-stripping bug on Gmail web and fixed only the post-it rendering. David called mockup-first during review — a v2 mockup surfaced **four-axis brand drift** in the email template, only one axis of which was the original diagnosis:

1. **Post-it SVG stripped by Gmail web** (original diagnosis) — Gmail's anti-tracking defense strips `<rect>` / `<circle>`, leaving the numeric `<text>` rendering as flow content below the banner.
2. **Post-it proportions drifted** — 86×86 + 4° + single-line "BOOTH" vs. the in-app BoothHero's 96×96 + 6° + two-line "Booth Location" + 36px numeral.
3. **Wrong pin glyph** — `⦲` Unicode character violates the session-17 glyph hierarchy lock; the app uses the teardrop SVG from `components/BoothPage.tsx` everywhere else.
4. **Vendor name typography drift** — Georgia 34px/600 in the email vs. IM Fell 32px/400 in the in-app `/shelf` BoothTitleBlock. Georgia-in-email was a session-32 rule for max client compat, but "IM Fell for editorial voice" is also committed. v2.2 resolves by loading IM Fell via Google Fonts `<link>` with Georgia as graceful fallback.

Session-51 design pass also introduced three copy + layout decisions the session-38 spec did not anticipate:

5. **Masthead shrunk** to 13px uppercase wordmark — the 26px/600 lockup was competing with the booth-name hero, not anchoring it.
6. **Opener rewritten** to a universal `"You've received a personal invite."` — retires the broken `"{senderFirstName} sent you a Window into {vendor}."` line (senderFirstName was always vendor.display_name, producing "Kentucky Treehouse sent you a Window into Kentucky Treehouse").
7. **Eyebrow added** — `"Step inside a curated booth from"` echoes `/shelf` BoothTitleBlock voice so recipients hear the same narrator across email and landing.

## v2 decisions locked (supersede v1 where they conflict)

All previous v1 decisions hold unless listed here.

### Masthead (supersedes v1 decision 4 "Hero weight")

- **SMALL masthead.** 13px Georgia 600 **uppercase** "TREEHOUSE FINDS" with `letter-spacing: 0.04em`.
- **Tagline kept.** 10px Georgia italic `"Embrace the Search. Treasure the Find."` — same subtagline Q-005 canonicalized.
- **Thin hairline below** unchanged.
- Rationale: quiet wordmark, booth leads. MEDIUM (17px) and OLD (26px) variants in the mockup are review chrome only — not options.

### Opener copy block (NEW — replaces v1 sender voice line)

Three stacked elements, centered, in order:

1. **Invite line** — Georgia italic 15px, `color: INKMID` (#4a3520), letter-spacing `0.01em`:
   > *You've received a personal invite.*
   Always renders. Does NOT vary by `senderMode`. No sender name.

2. **Vendor eyebrow** — IM Fell English 400 italic 14px, `color: INKMID`:
   > *Step inside a curated booth from*

3. **Vendor name hero** — IM Fell English 400 (non-italic) 32px, `color: INK` (#2a1a0a), `letter-spacing: -0.005em`:
   > {vendorName}

v1 decision: vendor name was Georgia 34px/600. v2 is IM Fell 32px/400 via Google Fonts. Graceful Georgia fallback for Outlook. The `renderWindowBody()` h2 block changes font-family + weight + size accordingly.

### Banner — Variant B (supersedes v1 decision 5)

- **Height 220px** (was 196px). The taller frame seats the embedded post-it without it overhanging.
- **Border-radius 16px** (was 12px).
- **Post-it embedded, no overhang.** Absolutely positioned at `bottom: 12px; right: 12px` inside the banner wrapper. Rotated 6° via CSS `transform` applied to a **styled div**, not SVG.
- **Post-it as styled div (NOT SVG).** This is the core Q-011 fix. Gmail web strips `<rect>` and `<circle>` SVG children (anti-tracking defense). A styled div with a plain background color survives.
  - Dimensions: `width: 86px; min-height: 86px`.
  - Background `var(--postit)` → hex `#fffaea`.
  - Shadow `0 4px 12px rgba(0,0,0,0.35)`.
  - Padding `13px 6px 8px`.
  - Flex column, items + content centered.
  - CSS `transform: rotate(6deg)` — stripped by Outlook but the post-it still reads fine as a non-rotated rectangle in that client (graceful degradation).
- **Pin** — small 8×8 dark disc, absolutely positioned top-center (`top: -3px`), produced with a styled div + `border-radius: 50%`. Same degradation story — Outlook shows it un-positioned; it still reads as a small dot.
- **Eyebrow** — IM Fell italic 12px, two lines: `"Booth"` / `"Location"`. `color: INKMID`. 4px bottom margin.
- **Numeral** — Times New Roman 30px weight 500, `color: INK`. Auto-shrinks by digit count: 30px ≤ 4 digits, 24px = 5 digits, 20px ≥ 6.
- **Banner image** — fallback gradient preserved (`linear-gradient(135deg, #8a7555 0%, #5a4a2e 100%)`) when `heroImageUrl` is null. When present, `background-image` on the wrapper div + an `<img>` fallback for Outlook.
- v1 "post-it only when boothNumber" still holds — if `boothNumber` is null, the post-it is omitted and the banner stands alone.

### Pin glyph on mall location line (supersedes v1 decision 7 / §Email rendering note)

- Retires the `⦲` Unicode character.
- Inlines the same teardrop SVG used by `components/BoothPage.tsx:PinGlyph`:
  ```html
  <svg width="18" height="22" viewBox="0 0 18 22" fill="none" aria-hidden="true">
    <path d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z" stroke="#2a1a0a" stroke-width="1.3" fill="none"/>
    <circle cx="9" cy="8.3" r="2" fill="#2a1a0a"/>
  </svg>
  ```
- Path + circle survive Gmail's SVG filter (they're not tracking-pixel-shaped primitives at 1×1 dimensions; this is an 18×22 SVG with named viewBox). Confirmed in v2 mockup render on Gmail web during session 51 review.
- Stroke color uses the literal `#2a1a0a` (not `v1.inkPrimary` — `lib/email.ts` has no access to the v1 token module).

### IM Fell via Google Fonts `<link>`

Added to `renderEmailShell()`'s `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
```

- Outlook + some Android clients ignore external font loads — the `font-family` declaration includes `Georgia` as the graceful fallback.
- Retires the session-32 "zero external font loads in email body" rule **for the Window email only**. Request-received + approval-instructions emails keep Georgia-only (they never use IM Fell — no change there).

### senderMode retires from email template

- `ShareBoothWindowPayload.senderFirstName` and `ShareBoothWindowPayload.senderMode` stay in the type (non-breaking change) but are marked `@deprecated — display-unused as of session 52 / Q-011 v2`. Safe-delete in a follow-up cleanup session.
- **Server-side still reads `senderMode`** in `app/api/share-booth/route.ts` for rate-limit bucket selection (5/10min auth vs 2/10min anon). That logic is load-bearing and does NOT change.
- `renderWindowBody()` drops the `voiceLineHtml` branch entirely. No more "if vendor mode, show italic line; if anon, hide."
- Preheader simplifies to: `"A personal invite to a curated booth."` — one line, always true, independent of senderMode.
- Plain-text fallback opener simplifies to: `"You've received a personal invite."` followed by `"A curated booth from {vendorName}."`

### Subject line

Unchanged from v1 decision 8: `"A Window into {vendorName}"`.

## Rendering strategy notes (v2-specific)

- **Post-it via styled div, not SVG.** Core Q-011 fix. Supersedes v1 §Email rendering note #2 and the previous `renderPostItSvg()` helper. Gmail web strips `<rect>`/`<circle>` SVG children as part of its anti-tracking-pixel defense — a styled div with `background: #fffaea` survives. CSS `transform: rotate(6deg)` is stripped by Outlook; that's fine — the post-it still reads as a non-rotated rectangle. Graceful degradation.
- **IM Fell graceful fallback.** Outlook + some Android clients ignore external font loads. Every IM Fell declaration includes Georgia as the fallback so the eyebrow + vendor name still render in a serif voice even when IM Fell doesn't load.
- **Pin SVG renders in Gmail web.** Confirmed via the v2 mockup preview during session 51. Path + named viewBox + stroke width 1.3 is not treated as a tracking shape.
- **Preheader + subject line + plain-text fallback** all adopt the simplified v2 copy. A recipient reading only the preview pane (preheader + opener) sees `"A personal invite to a curated booth." → "You've received a personal invite."` with no broken sender attribution.

## File changes (session 52)

| File | Change |
|---|---|
| `lib/email.ts` | `renderEmailShell`: add IM Fell `<link>`, shrink masthead to 13px uppercase + 10px italic tagline. Body wrap increases top padding to account for smaller masthead. `renderWindowBody`: new opener block (invite line + eyebrow + IM Fell vendor name), drop senderMode branching. `renderBanner`: Variant B (220px height, 16px radius, embedded post-it). New `renderPostItDiv` replaces `renderPostItSvg`. `renderLocationLine`: real `<svg>` PinGlyph instead of `⦲`. Preheader + plain-text opener update. Type: mark `senderFirstName`, `senderMode` @deprecated. |
| `app/api/share-booth/route.ts` | No change. `senderMode` still flows through for rate-limit bucket selection. |
| `docs/share-booth-build-spec.md` | This addendum (✅ written first per session-28 rule). |
| `CLAUDE.md` | Session-52 close tombstone. |

## On-device QA walk (session 52)

**Gmail web first** — this is the original failure client David caught pre-session-51.
- [ ] Post-it renders rotated inside banner (not clipped, not collapsed below)
- [ ] Pin glyph on mall line renders as teardrop SVG (not absent, not fallback char)
- [ ] Vendor name reads in IM Fell
- [ ] Masthead is small + subtle; booth dominates
- [ ] No sender attribution line (no "Kentucky Treehouse sent you...")

**iOS Mail** (session-51 scenario-2 re-check surface):
- [ ] Same four checks pass
- [ ] Preheader reads `"A personal invite to a curated booth."` in inbox preview

**Outlook web** (graceful degradation check):
- [ ] Post-it reads as un-rotated rectangle (CSS transform stripped — expected)
- [ ] IM Fell falls back to Georgia (external font stripped — expected)
- [ ] Overall layout still reads editorially despite both degradations

> v2.2 mockup approved: 2026-04-24 (session 51).
> v2 addendum authored: 2026-04-24 (session 52, this session).
> Ready for implementation: YES.

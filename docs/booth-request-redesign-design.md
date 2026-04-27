# Request a booth — redesign — design record

**Status:** Ready (decisions frozen 2026-04-27, session 75).
**Mockup:** [`docs/mockups/request-booth-redesign-v1.html`](mockups/request-booth-redesign-v1.html) — the mockup is the authority. If this doc and the mockup disagree, the mockup wins.

---

## Why this exists

Session 74 Gemba walk surfaced items 2 + 3 + 4 + 5 — all targeting `/vendor-request`:

- **Item 2** — Mall + Booth number labeled `(optional)` in production but should be required; photo dropzone copy is illegible (small + low-contrast IM Fell italic on paper wash); David requested a new high-contrast copy and an "I'm the assigned owner" checkbox to gate submission.
- **Item 3** — Title should read "Request your digital booth" (was "Put your booth forward.").
- **Item 4** — Drop the intro paragraph for now.
- **Item 5** — Form should fit on one screen so it doesn't feel overwhelming.

The redesign tightens the page top-to-bottom, fixes the legibility issue, hardens validation, and adds an audit-trail acknowledgement for the new ownership claim.

---

## Decisions (frozen)

| # | Decision | Choice |
|---|---|---|
| **D1** | Required field set | First name, Last name, Email, Mall, Booth number, Photo. Booth name optional. |
| **D2** | Checkbox copy + behavior | "By submitting this request you are confirming that you are the assigned owner of this booth." Required to submit, gates CTA. Server-side captured as `owner_acknowledged: true`. |
| **D3** | Photo treatment | **3:2 dropzone (Frame B).** Reduces from current 4:3 to 3:2 — saves ~70pt vertical. Compact-pill alternative (Frame C) deferred unless 3:2 still feels overwhelming after iPhone QA. |
| **D4** | Required-field indicator | Red asterisk (`v1.red`) immediately after field name. "(optional)" italic-faint tag preserved on Booth name only. |
| **D5** | Layout cuts | Drop intro h1 + intro paragraph entirely. Drop "Leave blank to use your name" Booth name helper (covered by "(optional)" tag). Pair Mall + Booth number side-by-side. |
| **D6** | Title typography | "Request your digital booth" — IM Fell 22px regular, ink-primary, top of form. No subhead. |
| **D7** | Server payload | Add `owner_acknowledged: true` to POST body. Server requires it (400 if missing/false). New column on `vendor_requests` table via migration `013_owner_acknowledged.sql`. Boolean NOT NULL DEFAULT FALSE — existing rows backfill cleanly. |

---

## Photo dropzone copy — typographic detail

Both lines move from IM Fell italic on paper wash to FONT_SYS at higher contrast. This was David's specific complaint ("almost illegible to read especially with the font style").

| Element | Before | After |
|---|---|---|
| Title | `FONT_IM_FELL` 17px `v1.inkMid` | **`FONT_SYS` 14px 600 `v1.inkPrimary`** |
| Helper | `FONT_IM_FELL` italic 13px `v1.inkFaint` | **`FONT_SYS` 12px `v1.inkMid`** |
| Title text | "Show us your booth" | **"Take a photo of your booth"** |
| Helper text | "A wide shot of your sign, name tag, or anything with your booth number visible. Helps us make sure the shelf is really yours." | **"This will be the main image on your digital booth."** |

The "confirm it's really yours" framing is removed entirely — that role moves to the new ownership-acknowledgement checkbox. Photo's role shifts from *verification gesture* to *hero image source* — which is what `proof_image_data_url` actually does after admin approval (it becomes the booth hero).

> **Field-label voice unchanged.** Form labels ("First name," "Email address," etc.) stay IM Fell italic 13px `v1.inkMuted` — short identifiers handle that voice fine. Only the photo-dropzone *long-form copy* swaps to sans. This is a surface-specific fix, not a system-wide field-label voice flip.

---

## Implementation (after design-to-Ready commit)

### 1. Migration

Create `supabase/migrations/013_owner_acknowledged.sql`:

```sql
ALTER TABLE vendor_requests
  ADD COLUMN owner_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;
```

David runs the migration via Supabase dashboard SQL editor (per the in-mall SQL triage convention).

### 2. Server (`app/api/vendor-request/route.ts`)

- Validate `body.owner_acknowledged === true` — return 400 with `{ error: "Acknowledgement required" }` if missing/false.
- Insert the value into the new column on row create.
- All existing duplicate-handling (`already_pending`, `already_approved`) unchanged.

### 3. Form (`app/vendor-request/page.tsx`)

Concrete edits:

- **Drop the intro `motion.div`** (h1 "Put your booth forward." + intro paragraph) entirely.
- **Title block**: replace with a 22px IM Fell h1 "Request your digital booth," 0/0/18 margin, no subhead.
- **Required asterisk primitive**: small `<span style={{ fontStyle: "normal", color: v1.red, marginLeft: 2 }}>*</span>` after each required field name.
- **Field order + layout**:
  1. First / Last (side-by-side, unchanged)
  2. Email (full width)
  3. **Mall / Booth # (NEW side-by-side row)** — Mall is the existing select; Booth # is the existing text input.
  4. Booth name (full width, "(optional)" tag preserved, helper line dropped)
  5. Booth photo (3:2 aspect, new copy)
- **Photo dropzone**:
  - aspectRatio `4/3` → `3/2`.
  - Title text: "Take a photo of your booth" — FONT_SYS 14px 600 v1.inkPrimary, marginTop 8.
  - Helper text: "This will be the main image on your digital booth." — FONT_SYS 12px v1.inkMid, lineHeight 1.5.
- **Checkbox row** (new component, inline below photo):
  - State: `const [ownerAck, setOwnerAck] = useState(false);`
  - Card primitive: 11px/12px padding, 1px hairline border, 10px radius, `rgba(255,253,248,0.55)` background.
  - Box: 18×18, 4px radius, 1.5px ink-muted border. Checked state: green fill + white ✓.
  - Copy: "By submitting this request you are confirming that you are the assigned owner of this booth." — FONT_SYS 12.5px v1.inkMid, lineHeight 1.45.
  - Tap target: full row (label htmlFor pattern, or onClick on the wrapper).
- **`handleSubmit` validation order**:
  1. firstName trim non-empty
  2. lastName trim non-empty
  3. email trim non-empty + regex
  4. **mallId non-empty** (NEW required check)
  5. **booth.trim() non-empty** (NEW required check, was optional)
  6. proofDataUrl non-null (already required, message reused)
  7. ownerAck === true (NEW final check)
- **CTA**: `disabled={busy || malls.length === 0 || !ownerAck}`. The `malls.length === 0` soft-block stays.
- **Server payload**: add `owner_acknowledged: true` to the JSON body (we send true because submission gate already enforces it).

### 4. What does NOT change

- `Suspense` wrap, mode-C back-arrow header, `getActiveMalls` flow.
- Three DoneScreen variants (created / already_pending / already_approved).
- `compressImage` photo handling, FileReader path, `proofDataUrl` shape.
- CTA color, shape, copy ("Request access"), shadow style.
- Disclaimer line below CTA.
- MallSheet migration to "Your mall" — still deferred per design-system.md v1.1k (h).

---

## Acceptance criteria (iPhone QA)

- [ ] Form fits one screen on iPhone 13 viewport (~750pt usable height).
- [ ] Title reads "Request your digital booth" at IM Fell 22px.
- [ ] No intro paragraph above the form.
- [ ] First / Last side-by-side; Mall / Booth # side-by-side.
- [ ] Required fields show red `*` after their label.
- [ ] Booth name shows "(optional)" italic-faint tag.
- [ ] Photo dropzone is 3:2 aspect.
- [ ] Photo dropzone title reads bold sans, not italic IM Fell.
- [ ] Photo dropzone helper reads sans 12px, comfortably legible against paper wash.
- [ ] Checkbox card sits below photo, above CTA.
- [ ] CTA stays disabled until checkbox is checked.
- [ ] Submit with checkbox unchecked → still disabled (no error needed; just inert).
- [ ] Submit with empty Mall → "Please select a mall." error in red banner.
- [ ] Submit with empty Booth # → "Please enter your booth number." error in red banner.
- [ ] Successful submit → DoneScreen renders unchanged.
- [ ] DB row has `owner_acknowledged = TRUE`.

---

## Carry-forwards

- **Sans high-contrast for long-form helper copy on paper wash.** When future surfaces need 2+ lines of supporting copy on `v1.inkWash` background, default to FONT_SYS 12–13px `v1.inkMid` rather than IM Fell italic. Promote to system-level rule on second firing.
- **`owner_acknowledged` column lives on `vendor_requests`.** When `/admin` Vendor Requests tab is redesigned (Sprint 5+), surface this as a small acknowledgement-glyph next to each pending row so admins can confirm the audit trail before approving. Not in scope this session.
- **MallSheet migration to "Your mall"** still deferred per design-system.md v1.1k (h). The redesign keeps the native `<select>` with the chevron-arrow background-image. If MallSheet eventually replaces it, the layout can absorb the change since Mall + Booth # are already in a `field-row` grid.
- **Compact-photo (Frame C) parked.** If iPhone QA reveals the 3:2 still feels overwhelming, Frame C is ready as a second pass — code path is identical, only the dropzone CSS changes.

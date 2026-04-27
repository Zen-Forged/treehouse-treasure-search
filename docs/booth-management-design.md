# Booth management — design record

> **Status:** Ready (D1–D7 frozen 2026-04-27, mockup approved 2026-04-27)
> **Mockup:** [`docs/mockups/booth-edit-sheet-v1.html`](mockups/booth-edit-sheet-v1.html)
> **Origin:** Session 74 — David's Gemba walk at America's Antique Mall surfaced 7 items; this record covers items #2 + #3 + delete polish + the post-mockup admin-add addition.

## Context

David performed a pre-seeding Gemba walk at America's Antique Mall (real-world admin flow) and surfaced gaps in admin booth management on `/shelves`:

- **#2** — No way to edit a booth's `display_name` after initial setup (he forgot to capture one).
- **#3** — No way to change a booth's `mall_id` after initial setup (he selected the wrong mall on one).
- **Delete** — Already shipped session 45, but still gated on `!user_id` (claimed booths require Supabase access).
- **Post-mockup addition** — David asked to restore an "Add a booth" affordance on `/shelves` for demo flow continuity, on the reasoning that `/admin` is meaningfully "backend" not vendor-presentable. This is the third oscillation of AddBoothInline on `/shelves` (sessions 37 + 67 retired it; session 74 restores it deliberately).

## Frozen decisions

### D1 — Pencil bubble repurposes from "open vendor profile" to "open edit sheet"

**Decision:** The existing Pencil bubble at [`app/shelves/page.tsx:169-175`](../app/shelves/page.tsx) — currently a `<Link href="/vendor/[slug]">` — becomes a `<button>` that opens `EditBoothSheet`.

**Why:** Pencil = edit is the universal mental model. The current behavior (open public vendor profile) was a weak match for the icon and the page is reachable other ways (direct URL, `/shelf/[slug]`). No replacement affordance for "open vendor profile" is needed on `/shelves`.

### D2 — Slug auto-updates on `display_name` change

**Decision:** When `display_name` changes via PATCH, `slug` is re-derived via `slugify(display_name)` server-side.

**Why:** Bookmarks and finds reference `vendor_id`, not slug. URL change is the only consequence and is the expected behavior on rename. Mental model: rename the booth, the URL follows.

**Known edge case:** If the new slug collides with another vendor's slug (rare — slugify produces unique outputs for unique names but spaces/punctuation may degenerate), the database constraint fires 23505 and the PATCH returns the conflict error. Handled by the same conflict pill that catches `(mall_id, booth_number)` collisions.

### D3 — Edit allowed on claimed booths (`user_id != null`)

**Decision:** PATCH has **no** safety gate on `user_id`. Edit any booth regardless of claim status.

**Why:** Editing labels doesn't strand the auth user the way deleting does — it just changes the label they see. David's whole need is editing post-claim. The DELETE safety gate stays in place; PATCH is intentionally less restrictive.

### D4 — Mall change allowed; conflicts surfaced inline

**Decision:** `mall_id` is one of the editable fields. The existing `vendors_mall_booth_unique (mall_id, booth_number)` constraint can fire 23505 on edit; the API catches it and returns `{ error, code: "BOOTH_CONFLICT" }` with HTTP 409.

**UI:** Sheet displays an inline red conflict pill above the Save button when 409 returns. User can adjust booth number or mall and retry without dismissing the sheet.

### D5 — Hero photo NOT in edit sheet

**Decision:** Edit sheet has 3 fields: mall · booth_number · display_name. Hero photo edit stays at `/my-shelf?vendor=<id>` (canonical hero-edit surface).

**Why:** Keeps the Edit sheet tightly scoped, single PATCH call, no upload pipeline branching. Add sheet keeps hero (D7) since mall-walk creation is the natural moment to capture it.

### D6 — Add tile sits at the end of the whole grid

**Decision:** Single admin-only `AddBoothTile` rendered AFTER all mall sections (not per-section). Mirrors `AddFindTile`'s tail position from the #7 fix earlier in session 74.

**Why:** Per-mall-section tiles would multiply the affordance for no benefit and visually associate Add with one mall. Floating-action-button breaks the masthead-anchored chrome pattern. Single tile at grid tail is consistent with `/my-shelf` and unambiguous.

**Pre-fill behavior:** When `savedMallId` is set (filter active), the Add sheet pre-selects that mall in the form. When unfiltered ("all malls"), the form starts with the first available mall as a sensible default.

### D7 — Add sheet uses bottom-sheet pattern matching Edit + Delete

**Decision:** New `AddBoothSheet` component that mirrors `EditBoothSheet`'s shell (backdrop, grabber pill, motion-y bottom-up entry, body-overflow lock). Form has 4 fields: mall · booth_number · display_name · **optional hero photo**. CTA reads "Add booth" not "Save changes."

**Why:** Add + Edit + Delete on `/shelves` share the same sheet ergonomics — coherent admin-management trio. Inline expansion (existing `AddBoothInline` pattern) would create two visual paradigms on one page.

**Hero photo retained:** Unlike Edit (D5), Add keeps the hero photo field because mall-walk creation is the natural moment to capture it (admin is standing at the booth with their phone). Reuses the existing `/api/vendor-hero` upload pipeline.

**`AddBoothInline` retained on `/admin`:** The existing component stays unchanged on `/admin` Vendors tab. Future cleanup may unify if the two surfaces drift; not in scope here.

## Implementation

### New components

| Component | Purpose |
|---|---|
| `components/BoothFormFields.tsx` | Shared 3-field form markup (mall select · booth_number · display_name). Used by both Add and Edit sheets. Avoids drift. |
| `components/EditBoothSheet.tsx` | Bottom sheet wrapper. Pre-fills from vendor object. Save disabled until any field differs from initial. `changed` visual flag on diffed inputs (yellow tint). Submits via `PATCH /api/admin/vendors`. |
| `components/AddBoothSheet.tsx` | Bottom sheet wrapper. Pre-selects mall from `savedMallId`. Includes hero photo upload field (reuses `AddBoothInline`'s pipeline). Submits via `createVendor` + optional `/api/vendor-hero` POST. |
| `components/AddBoothTile.tsx` | Dashed admin-only tile rendered after all mall sections on `/shelves`. Tap opens `AddBoothSheet`. |

### New API surface

**`PATCH /api/admin/vendors`** — extends existing route at [`app/api/admin/vendors/route.ts`](../app/api/admin/vendors/route.ts) (currently DELETE-only).

- Auth gate: `requireAdmin`.
- Body: `{ vendorId, display_name, booth_number, mall_id }`.
- Validates required fields (vendorId, display_name, mall_id).
- Auto-derives `slug` from `display_name` (D2).
- Catches Postgres 23505 → `{ error, code: "BOOTH_CONFLICT" }` with HTTP 409.
- No safety gate on `user_id` (D3).
- Returns updated vendor row on success.

### Page wiring

`app/shelves/page.tsx`:

- Pencil bubble (`/vendor/[slug]` Link) → `<button onClick={() => setEditTarget(vendor)}>`.
- `EditBoothSheet` mounted alongside `DeleteBoothSheet` at page root, controlled by `editTarget` state.
- `AddBoothTile` rendered after `groupByMall` output, gated on `isAdmin(user)`. Sits in its own grid row below all mall sections so it doesn't visually associate with any single mall.
- `AddBoothSheet` mounted similarly, controlled by `addSheetOpen` state.
- Both sheets update local `vendors` state in place on success — no full reload, optimistic.

### Existing primitives reused

- `DeleteBoothSheet` ergonomics — shell pattern (backdrop, grabber, motion-y entry).
- `AddBoothInline.uploadHero` — extract into the new sheet (or import directly if shape matches).
- `createVendor` from `lib/posts.ts` — same path Add already exercises.
- `slugify` from `lib/posts.ts` — used server-side in PATCH.

## Acceptance criteria

- [ ] Admin lands on `/shelves`, sees Pencil + Trash on each tile (Trash hidden on claimed booths) AND a new dashed "+ Add a booth" tile in its own row at the end.
- [ ] Tap Pencil → `EditBoothSheet` slides up with the booth's current values pre-filled. Save disabled. No yellow flags.
- [ ] Edit booth name → field tints yellow, Save enables. Save → sheet animates out, tile re-renders with new name. URL slug updates (verify via direct navigation to `/shelf/<new-slug>`).
- [ ] Edit mall to one where the booth number already exists → Save returns 409 → red conflict pill appears above Save button. Adjust + retry → success.
- [ ] Edit a CLAIMED booth (`user_id != null`) → no safety gate, Save proceeds.
- [ ] Tap "+ Add a booth" tile (admin only) → `AddBoothSheet` slides up. Mall pre-selects current filter (or first mall if unfiltered). All fields empty.
- [ ] Fill name + mall → "Add booth" CTA enables. Add → sheet animates out, new tile appears in correct mall section. Hero photo (optional) uploads in parallel.
- [ ] Same conflict path for Add: existing `(mall_id, booth_number)` collision → 409 → conflict pill.
- [ ] Non-admin users see no Pencil, no Add tile; existing Bookmark + booth-tap-to-shelf behaviors unchanged.
- [ ] iPhone QA: sheet ergonomics native (matches `DeleteBoothSheet`), keyboards behave (alphanumeric on booth_number per session-74 #1 fix), backdrop-tap dismisses, sheet doesn't push BottomNav.

## Carry-forward / known limitations

- **`/vendor/[slug]` no longer reachable from `/shelves` Pencil** — public page still served at the URL; reachable from `/shelf/[slug]` and direct nav. If beta surfacing reveals admins want it back, add a separate "View profile" eyebrow on the Edit sheet (cheap follow-up).
- **`AddBoothInline` retained on `/admin`** — two Add UIs now exist (`AddBoothSheet` on `/shelves`, `AddBoothInline` on `/admin`). Field shapes match. Future cleanup may unify; not in scope.
- **Slug-collision handling is generic** — PATCH catches all 23505 errors and returns `BOOTH_CONFLICT`. If a slug collision is the actual cause (rare), the error message will read as if it's a booth number issue. Add slug-specific path if surfaced in the wild.
- **Optimistic `mall_id` change** — local `setVendors` updates the vendor's `mall_id` AND reads through `groupByMall` to re-bucket the tile. If the old mall section becomes empty, the section header should disappear in the next render (existing `groupByMall` already filters empty groups via Map iteration).
- **Third oscillation of AddBoothInline-on-/shelves** — sessions 37 + 67 retired this affordance; session 74 restores it. Future sessions should NOT reflexively retire again without consulting this design record's reasoning (demo authenticity > admin-page tidiness).

## Open follow-ups

- None blocking. Beta-walk validation will reveal whether the Edit sheet's field rhythm + the conflict-pill copy reads cleanly. Real-content seeding (still pending) will exercise the most common flow: admin-created booth gets edited as content lands.

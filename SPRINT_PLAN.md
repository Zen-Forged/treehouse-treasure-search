# Treehouse Finds — MVP Beta Sprint Plan

Generated from the full app audit. Organized into four sprints, each sized for a focused 1–2 day push. Sprints are ordered by launch risk — Sprint 1 must ship before any external beta users are invited.

---

## Sprint 1 — Blockers (Must ship before beta invite)

These are the items that would break trust or security if a real user hit them.

### 1.1 Remove DevAuthPanel from production
**File:** `app/layout.tsx`
Remove or env-gate the `<DevAuthPanel />` component. It is currently rendered for every user on every page in production.
```tsx
// Wrap with env check or delete entirely
{process.env.NODE_ENV === "development" && <DevAuthPanel />}
```

### 1.2 AI caption failure fallback in post flow
**File:** `app/post/page.tsx`
When the Anthropic caption call fails, the form opens with empty fields and no explanation. Add a visible fallback message so the vendor knows they're in manual mode.
```tsx
// In handleFile(), after generateCaption() returns empty:
if (!title && !caption) {
  setEditTitle("");
  setEditDesc("");
  setSaveError("Couldn't read this image automatically — fill in the details below.");
}
// Clear the error once the user starts typing
```

### 1.3 Seed mall locations into Supabase
**File:** `supabase/seeds/001_mall_locations.sql`

**Step A — Run schema migration in Supabase SQL editor:**
The seed file adds 7 new columns to the `malls` table then upserts all 29 mall locations. It is safe to re-run (ON CONFLICT by slug).

```
supabase/seeds/001_mall_locations.sql
```

**Step B — Confirm `slug` unique constraint exists:**
The seed uses `ON CONFLICT (slug)`. If the constraint doesn't exist yet:
```sql
ALTER TABLE malls ADD CONSTRAINT malls_slug_key UNIQUE (slug);
```

**Step C — Update `Mall` type** ✅ (already done in this session)
`types/treehouse.ts` updated to include `phone`, `website`, `google_maps_url`, `latitude`, `longitude`, `category`, `zip_code`.

### 1.4 Mall selection in vendor post flow
**File:** `app/post/page.tsx`
Currently the mall dropdown in the "Set up your vendor profile" section only appears for vendors with no identity. It works but is not tested with 29 malls. Confirm:
- Dropdown scrolls and is usable on mobile with 29 items
- Selected mall name renders correctly in the "Posting as" identity card
- `mall_id` is correctly passed through to `createPost()`

### 1.5 Admin PIN security check
**File:** `app/api/auth/admin-pin/route.ts`
Confirm the admin PIN is sourced from an env var only (`process.env.ADMIN_PIN`) and is not hardcoded anywhere in the repo or committed to git.

### 1.6 Price field validation
**File:** `app/post/page.tsx` and `app/post/edit/[id]/page.tsx`
Add a guard to reject negative prices and non-numeric strings before save:
```ts
const priceNum = editPrice.trim() ? parseFloat(editPrice.trim()) : null;
if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
  setSaveError("Price must be a positive number.");
  return;
}
```

---

## Sprint 2 — Vendor Onboarding & Core UX Gaps

These items affect the first-run experience for new vendors and the reliability of the primary posting loop.

### 2.1 Dedicated vendor onboarding step
**File:** `app/post/page.tsx`
The inline profile setup form inside the post flow is easy to miss. For beta, add a clear heading and progress indicator when the form appears:
- Heading: "First, set up your booth"
- Progress: Step 1 of 2 / Step 2 of 2
- Consider adding a separate `/onboarding` route for cleaner separation (post-beta scope)

### 2.2 Vendor bio field
**Files:** `app/my-shelf/page.tsx`, `app/shelf/[slug]/page.tsx`
The `bio` column exists in the `vendors` table and is fetched, but there is no UI to set or display it. For beta:
- Add a bio text field to the vendor hero section on My Shelf (edit in place or tap-to-edit)
- Display it on the public shelf under the vendor name

### 2.3 "Add to home screen" nudge
**File:** `app/layout.tsx` or a new `components/InstallBanner.tsx`
The app is PWA-capable but there's no `manifest.json` and no install prompt. For beta, add a `manifest.json`:
```json
{
  "name": "Treehouse Finds",
  "short_name": "Treehouse",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f0ede6",
  "theme_color": "#f0ede6",
  "icons": [{ "src": "/logo.png", "sizes": "192x192", "type": "image/png" }]
}
```
And reference it in `layout.tsx`:
```tsx
<link rel="manifest" href="/manifest.json" />
```

### 2.4 Scroll restore QA
Verify the deferred scroll restore fix (loading → false trigger) works correctly across:
- iPhone Safari (primary target)
- Chrome Android
- Desktop Chrome (secondary)

Edge case to test: returning from a detail page when the feed was loaded with a mall filter active.

### 2.5 Hero image upload size guard
**File:** `app/my-shelf/page.tsx` (`handleHeroImageChange`)
Add a client-side size check before upload attempt:
```ts
if (file.size > 12 * 1024 * 1024) {
  setHeroError("Image too large — please use a photo under 12MB.");
  return;
}
```

---

## Sprint 3 — Admin, Content & Polish

These improve operational control and the experience once real content is in the app.

### 3.1 Vendor bio edit via admin
**Files:** `app/admin/page.tsx` or new `app/vendor/[slug]/page.tsx`
Admin should be able to edit vendor `display_name`, `booth_number`, and `bio` without going to the Supabase dashboard. A simple form on the vendor detail page (`/vendor/[slug]`) is enough.

### 3.2 Feed content seeding
Before beta invite, post 10–15 real items with quality photos across 3–4 vendors. The feed is the first impression — an empty or thin feed kills the experience.

Suggested approach:
- Use your own ZenForged Finds booth (booth 369) as the primary seeded vendor
- Use the admin `?vendor=` param to post on behalf of invited beta vendors before they join

### 3.3 Feedback mechanism
Add a minimal "Report an issue" or "Send feedback" link somewhere in the app — the bottom of My Shelf or the admin page is fine. A Tally.so form link requires zero backend work:
```tsx
<a href="https://tally.so/r/YOUR_FORM_ID" target="_blank">
  Send feedback
</a>
```

### 3.4 Error monitoring
Add Vercel's built-in logging or Sentry (free tier) so silent failures in AI caption generation, image uploads, and Supabase are visible. At minimum, ensure all `console.error` calls in `lib/posts.ts` and the API routes are captured somewhere reviewable.

### 3.5 Rate limiting on `/api/post-caption`
**File:** `app/api/post-caption/route.ts`
Add basic rate limiting to prevent accidental or intentional AI call spam. Vercel's `@vercel/kv` or a simple in-memory counter per IP is sufficient for beta:
```ts
// Simple: reject if more than 20 calls/hour from same IP
// Or use Upstash rate limit with Vercel KV
```

---

## Sprint 4 — Post-Beta Hardening (After first beta cohort)

These are important but can wait until the initial cohort has been onboarded and the core loop is validated.

### 4.1 Row-Level Security (RLS)
Currently disabled on all Supabase tables. For a public-facing app with real vendor data this needs to be addressed. Suggested policy structure:
- `posts`: anyone can SELECT available; only row owner (vendor_id match) can INSERT/UPDATE/DELETE
- `vendors`: anyone can SELECT; only authenticated user whose user_id matches can UPDATE
- `malls`: public read-only

### 4.2 Cross-device bookmark sync
Saved items currently live in `localStorage` only. For beta this is documented behavior. Post-beta: move to a `saved_posts` table keyed by `user_id`.

### 4.3 Pagination / infinite scroll
Current fetch limit is 80 posts flat. As inventory grows past ~200 items this becomes a performance issue. Implement cursor-based pagination in `getFeedPosts()`.

### 4.4 Search
No text search exists. For post-beta: Supabase full-text search on `posts.title` is a one-query addition:
```ts
.textSearch("title", query, { type: "websearch" })
```

### 4.5 Terms of service & privacy policy
Required before any public-facing launch. A simple `/terms` and `/privacy` page with basic boilerplate is sufficient for early beta.

### 4.6 Vendor account management
No way for a vendor to update their own email, delete their account, or change their display name post-creation. Add a settings section to My Shelf.

---

## Mall Seed — How to Run

1. Open Supabase dashboard → SQL Editor
2. First run the unique constraint if needed:
   ```sql
   ALTER TABLE malls ADD CONSTRAINT malls_slug_key UNIQUE (slug);
   ```
3. Copy and run the contents of `supabase/seeds/001_mall_locations.sql`
4. Confirm 29 rows in the `malls` table with `SELECT count(*) FROM malls;`
5. The existing "America's Antique Mall" row will be updated in-place (not duplicated) because it matches on slug `americas-antique-mall`

---

## Summary Table

| Sprint | Focus | Blocking? | Est. effort |
|--------|-------|-----------|-------------|
| 1 | Security, AI fallback, mall seed, validation | ✅ Yes | ~4 hours |
| 2 | Onboarding, bio, PWA, scroll QA | Near-blocking | ~6 hours |
| 3 | Admin tools, content seed, feedback, monitoring | Important | ~4 hours |
| 4 | RLS, sync, pagination, search, legal | Post-beta | ~2 days |

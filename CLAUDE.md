# Treehouse — Claude Working Instructions
> Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app
> Full architecture: CONTEXT.md

---

## HOW TO START A NEW SESSION

1. Start a new chat at claude.ai
2. Run in Terminal: `cat /Users/davidbutler/Projects/treehouse-treasure-search/CLAUDE.md`
3. Paste this into the new chat:

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md and CONTEXT.md before doing anything.

CURRENT ISSUE:
[paste the CURRENT ISSUE section below]
```

## HOW TO END A SESSION

Tell Claude: "update CLAUDE.md with current status" then run:
```bash
cd /Users/davidbutler/Projects/treehouse-treasure-search
git add CLAUDE.md CONTEXT.md && git commit -m "docs: update session context" && git push
```

---

## CURRENT ISSUE
> Last updated: 2026-04-08

**Status:** ⚠️ Admin page deployed, Vercel webhook investigation needed.

**What was done (this session):**

### Back button — Option D (`app/find/[id]/page.tsx`)
- Removed `<BackTab>` fixed left pill entirely
- Back button restored to image overlay bottom-left: 34px frosted circle (`rgba(240,237,230,0.82)`), same row as Follow + Share
- Single bottom row across image: back left, follow + share right (`justifyContent: space-between`)
- "Unavailable" badge moved to `left: 14` (no longer needs to clear overlay btn)

### Admin page (`app/admin/page.tsx` + `app/api/admin/posts/route.ts`)
- `/admin` — local vendor profile inspector + all posts list with bulk delete
- Local profile card: shows `display_name`, `booth_number`, `mall_id`, `vendor_id` (flags ⚠ if missing)
- "Clear local profile" button to reset localStorage and re-trigger vendor setup flow
- Posts list: tap to select, thumbnail + vendor name + `vendor_id` prefix shown per post
- "Delete N selected" — deletes chosen posts + their Supabase Storage images
- "Nuke all" (two-tap confirm) — wipes all posts + all images in bucket
- API: `GET /api/admin/posts` returns all posts; `DELETE` accepts `{ ids }` or `{ deleteAll: true }`

### Vercel deployment issue (UNRESOLVED)
- Commits `3619379` and earlier deploy fine via GitHub webhook
- Commit `bf34e2f` (admin page) pushed to GitHub successfully but Vercel never triggered a build
- Root cause: Vercel project lives under `david-6613s-projects`, NOT `zen-forged` — the `/zen-forged/` dashboard URL returns 404
- The GitHub→Vercel webhook silently dropped the push — no failed build, just no build at all
- **Fix for next session:** Run `npx vercel --prod` from project root to force-deploy, OR go to Vercel dashboard → project → most recent deployment → `···` menu → Redeploy
- After manual deploy succeeds, check Vercel → Settings → Git for webhook health

### Delete button root cause (diagnosed, partially fixed)
- Owner detection now checks `data.vendor_id ?? data.vendor?.id` (was only `data.vendor_id`)
- Real fix requires visiting `/admin` to check if `vendor_id` is present in local profile
- If missing: "Clear local profile" → post something new → `vendor_id` gets stored → delete works on all future posts
- Old posts created before `vendor_id` was reliably stored will still not show delete unless owner match can be made

**Previous sessions:**
- "Follow the Find" rename, feed followed indicators, "Unavailable" status labels
- Orphaned shelf hairline fixed, vendor name + booth inline, scroll restoration

**Next session starting point:**
1. Run `npx vercel --prod` or use Vercel dashboard Redeploy to get admin page live
2. Visit `/admin` on live site to inspect local profile and nuke test posts
3. After clean slate: re-post to establish fresh `vendor_id` in local profile
4. Verify delete button appears on new posts

Good candidates after that:
- Directions affordance under mall address in "Find this here" card
- Pull-to-refresh on feed
- PWA support
- Supabase RLS / auth
- `/enhance-text` real Claude integration
- Verify Facebook page URL — currently `https://www.facebook.com/KentuckyTreehouse`

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, light cream theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage) · SerpAPI · Vercel
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
```

---

## SUPABASE
- **Tables:** malls, vendors, posts — RLS DISABLED on all three
- **Storage bucket:** post-images — PUBLIC
- **Only mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`
- **Known vendor:** ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8`
- **Extra column:** vendors table has `facebook_url text` (added via SQL)
- **Unique constraint:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`

---

## ROUTE MAP

### Ecosystem (light cream theme)
```
/                   Discovery feed — tree masonry, mall dropdown, no filters, no prices
                    Followed items show green BookmarkCheck circle on tile image
/find/[id]          Find detail — full-bleed image, back btn bottom-left of image,
                    follow + share bottom-right of image (visitors), share only (owners),
                    "View the shelf" scroll, "Find this here" card,
                    "Follow the Find" button (visitors) / "Mark the Spot" toggle (owners),
                    booth pill inline, owner section at bottom (mark sold + delete)
/mall/[slug]        Mall profile
/vendor/[slug]      Vendor profile — Facebook link, available/sold grid, "Unavailable" label
/post               Vendor capture — camera/gallery, profile setup, Reset button
/post/preview       Edit title/caption/price → publish → "Back to feed" primary,
                    "Visit us on Facebook" secondary, "Post another find" camera ghost
/admin              Admin: local profile inspector + bulk post/image delete
```

### Reseller intel (dark theme — do not touch)
```
/scan → /discover → /refine → /decide → /intent → /enhance-text → /share
/finds, /finds/[id]
```

### API
```
POST /api/post-caption      Claude → { title, caption } 1-2 sentences, poetic, no filler
POST /api/identify          Claude Vision → { title, description, confidence, searchQuery }
GET  /api/sold-comps        SerpAPI eBay comps, 48h cache
GET  /api/debug             Supabase connectivity + real vendor/post insert test
GET  /api/admin/posts       All posts with vendor info (admin)
DELETE /api/admin/posts     Bulk delete posts + storage images ({ ids } or { deleteAll })
```

---

## KEY FILES
```
lib/supabase.ts           Client with placeholder fallback for build time
lib/posts.ts              getFeedPosts, getPost, getVendorPosts, createPost, createVendor,
                          uploadPostImage, updatePostStatus, deletePost,
                          getAllMalls, getMallBySlug, getVendorBySlug, slugify
                          createVendor + createPost return { data, error }
lib/postStore.ts          In-memory image store for /post → /post/preview flow
lib/safeStorage.ts        localStorage wrapper with sessionStorage + memory fallback
                          API: getItem, setItem, removeItem
types/treehouse.ts        Post, Vendor, Mall, LocalVendorProfile, PostStatus
app/layout.tsx            No max-width wrapper — each page owns its own width
app/admin/page.tsx        Admin UI — profile inspector + bulk delete
app/api/admin/posts/route.ts  Admin API — GET all posts, DELETE by id or all
```

---

## DESIGN SYSTEM

### Ecosystem pages (light cream)
```
bg: #f0ede6  surface: #e8e4db  surfaceDeep: #dedad0  border: rgba(26,26,24,0.1)
text: #1a1a18 / #4a4a42 / #8a8478 / #b0aa9e
green (CTAs): #1e4d2b   greenLight: rgba(30,77,43,0.09)   greenBorder: rgba(30,77,43,0.22)
greenSolid: rgba(30,77,43,0.92)  ← filled/active state
header blur: rgba(240,237,230,0.94)
```

### Reseller pages (dark — do not change)
```
bg: #050f05  text: #f5f0e8  gold: #c8b47e  green: #6dbc6d
```

### Shared
```
Font: Georgia serif (headings/captions/italic labels), monospace (booth/prices), system (body)
Max-width: 430px per page
Safe area: env(safe-area-inset-bottom) on all fixed bars
Animations: opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
```

### Feed grid
```
2-column masonry. Gap: 14px. Tile border-radius: 14px.
Right column offset: 50% of first tile's rendered height (ResizeObserver, live).
Skeleton uses SKELETON_OFFSET = Math.round(SKELETON_HEIGHTS[0] * 0.5) = 65px.
No price badges. Sold items: 0.62 opacity + grayscale + "Unavailable" badge.
Followed items: 22px solid green circle (BookmarkCheck icon) at bottom-right of tile image.
Scroll position saved to sessionStorage ("treehouse_feed_scroll"), restored on mount.
Followed IDs loaded once on mount via loadFollowedIds() — scans localStorage for treehouse_bookmark_* keys.
```

### Detail page layout order
```
1. Full-bleed image
   - "Unavailable" badge top-left (left: 14px) — only when status=sold
   - Back btn bottom-left (34px frosted circle, rgba(240,237,230,0.82))
   - Follow + Share bottom-right row (visitors) / Share only (owners)
   - All three in one justifyContent:space-between row across image bottom
2. Title (Georgia 26px bold)
3. Availability (pulsing dot + "Available" green, or "Unavailable" muted)
4. Caption (italic Georgia) + description
5. [hairline — only if shelf has items] + "View the shelf" horizontal scroll
6. "Find this here" label + card:
     Mall name + address link
     [divider]
     Vendor name + booth pill (inline, same row, right-aligned)
     Facebook link (below vendor name, if present)
     Visitors: "Follow the Find" / "Following" toggle (local only, no DB)
     Owners: "Mark the Spot" / "Mark available" toggle (Supabase write)
7. [hairline separator] Owner actions (owner only):
     "Mark as sold" / "Mark as available" ghost button (Tag icon)
     "Delete post" ghost button (Trash2 icon) → confirmation panel
```

---

## RULES & GOTCHAS
- All ecosystem pages need `export const dynamic = "force-dynamic"` (import supabase at module scope)
- Never use `export const config = {}` — deprecated in Next.js 14 App Router
- Always use `git add -A` — never individual paths (zsh glob-expands `[slug]`)
- `filesystem:write_file` is the ONLY reliable way to write files to disk — bash heredoc writes only to the sandbox container, NOT the real filesystem
- `str_replace` tool fails on bracket-path files (`app/find/[id]/page.tsx`, `app/vendor/[slug]/page.tsx`) — always use `filesystem:write_file` for full rewrites
- New directories must be created with `mkdir -p` in Terminal first — `filesystem:write_file` cannot create missing parent directories
- `uploadPostImage` is non-fatal — post goes through even without image
- vendor_id only carried over in LocalVendorProfile if mall_id unchanged
- Supabase client uses placeholder URL at build time to avoid prerender crash
- `createVendor` handles 23505 duplicate key by fetching existing row — do not revert this
- Always use `safeStorage` (not raw `localStorage`) in ecosystem client components, EXCEPT:
  - Feed's `loadFollowedIds()` reads raw `localStorage` directly (needs key iteration)
  - Feed scroll restoration uses raw `sessionStorage` (ephemeral tab state)
- `ShelfSection` accepts `onReady(hasItems: boolean)` callback — parent uses this to conditionally render the hairline separator
- Follow state uses `safeStorage` with key `treehouse_bookmark_${postId}`. Value "1" = following
- Owner detection checks `data.vendor_id ?? data.vendor?.id` against `profile.vendor_id` — do not simplify
- Vercel project is under `david-6613s-projects` scope, NOT `zen-forged` — use correct dashboard URL
- Vercel GitHub webhook has been unreliable — if push doesn't deploy, use `npx vercel --prod`
- `FACEBOOK_PAGE_URL` constant lives at top of `app/post/preview/page.tsx`

---

## WORKING ✅
- Discovery feed — tree masonry (50% dynamic offset), no prices, no filter pills, mall dropdown
- Feed scroll position saved/restored via sessionStorage on back navigation
- Skeleton loading matches live grid proportions (65px right-column offset)
- Sold items in feed: 0.62 opacity + grayscale + "Unavailable" badge
- Followed items in feed: green BookmarkCheck circle at bottom-right of tile image
- Find detail: full-bleed image, back btn bottom-left of image, availability pulse
- "View the shelf" — horizontal scroll, full-bleed, hides if empty, hairline conditional
- Vendor name + booth number inline on same row in "Find this here" card
- "Follow the Find" / "Following" — local-only toggle, persisted to safeStorage
- Follow + share icons on image bottom-right (visitors) / share only (owners)
- Owner: "Mark the Spot" / "Mark available" toggle in vendor card (Supabase write)
- Owner bottom section: hairline + "Mark as sold" ghost btn + "Delete post" ghost btn
- Delete confirmation panel: red styled, two-button confirm/cancel
- Vendor profile: Facebook link, light theme, available/Unavailable grid
- Mall profile: grid, directions, available/sold split
- Post flow: capture → AI title + caption → preview → publish
- Image upload to Supabase Storage
- safeStorage fallback for Safari private/ITP
- Admin page: local profile inspector, bulk delete, nuke all (PENDING DEPLOY)
- All reseller intel routes (untouched, dark theme)

## KNOWN GAPS ⚠️
- Admin page not yet live — Vercel webhook dropped the push (fix: `npx vercel --prod`)
- Delete button still missing on posts created before `vendor_id` was stored in local profile
- Followed items have no consolidated "saved" list yet
- Directions affordance missing from "Find this here" mall address
- `/enhance-text` is mock (not real Claude)
- No Supabase RLS / auth yet
- No pull-to-refresh on feed
- No PWA support
- `FACEBOOK_PAGE_URL` needs verification — currently `https://www.facebook.com/KentuckyTreehouse`

---

## DEBUGGING
```bash
# Live Supabase test
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool

# Force deploy when webhook fails
npx vercel --prod

# Build check before pushing
npm run build 2>&1 | tail -30

# Always stage everything (filesystem MCP writes to real disk, bash heredoc does NOT)
git add -A && git commit -m "..." && git push

# Create new directories before filesystem:write_file can use them
mkdir -p app/some/new/path
```

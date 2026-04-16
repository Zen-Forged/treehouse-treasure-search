## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## CURRENT ISSUE
> Last updated: 2026-04-16

**Status:** Vendor account setup MVP implemented — admin approval workflow with email templates.

---

## What was done (this session)
> 2026-04-16 — Vendor account setup MVP: admin approval workflow

### **PROJECT STATUS**
- Hero image size guard: ✅ Already implemented (12MB limit in `/app/my-shelf/page.tsx`)
- vendor_requests table: ✅ Confirmed working via successful form submissions
- Mall page vendor CTA: ❌ Confirmed absent (no CTA exists on `/app/mall/[slug]/page.tsx`)

### **MVP IMPLEMENTATION COMPLETED**

**[DECISION]** Implemented recommended MVP scope: admin approval workflow with minimal setup page, tooled admin interface, manual email notification

**Task 1 - Enhanced vendor data functions** ✅
**[CODE]** Added to `/lib/posts.ts`:
- `getVendorByEmail()`: Cross-references vendor_requests table to find vendor accounts by email
- `linkVendorToUser()`: Links existing vendor row to authenticated user_id  
- `getVendorRequests()`: Fetches pending requests for admin review
- `createVendorFromRequest()`: Creates vendor account from approved request
- `markVendorRequestApproved()`: Updates request status after approval

**Task 2 - Setup page** ✅
**[DOCUMENT]** Created `/app/setup/page.tsx`
- Auto-discovery: finds vendor account by email match with vendor_requests
- Auth integration: links user_id to vendor row via `linkVendorToUser()`
- UX flow: Loading → Success (with vendor info card) → Redirect to My Booth
- Error handling: graceful fallback with retry and navigation options
- localStorage integration: saves vendor profile for immediate use

**Task 3 - Enhanced admin tools** ✅  
**[DOCUMENT]** Enhanced `/app/admin/page.tsx`
- Tab interface: "Vendor Requests" (primary) + "Posts" (existing)
- Request management: approve button creates vendor + marks approved
- Email template: auto-generated with setup link, copies to clipboard
- Status tracking: pending requests highlighted, approved requests grayed
- Batch operations: individual approval with busy states

### **VENDOR SETUP FLOW (MVP)**
1. User submits `/vendor-request` → data in vendor_requests table
2. Admin reviews in `/admin` → "Vendor Requests" tab  
3. Admin clicks "Approve" → creates vendor account + copies email template
4. Admin manually sends email with setup link
5. Vendor clicks link → `/setup` page → auto-links account → redirects to My Booth

### **ADMIN EMAIL TEMPLATE** (auto-generated, clipboard-copied)
Subject line, setup URL, vendor details (name/booth/mall), welcome message. Template includes `${baseUrl}/setup` link for account completion.

### **TECHNICAL PATTERNS**
- Enhanced vendor functions preserve existing createVendor() duplicate-key recovery
- Setup page uses Suspense boundary, handles auth redirects with preserved state
- Admin interface maintains existing post management, adds vendor request workflow
- All functions use proper error handling with user-friendly messages

### **FILES MODIFIED**
- `/lib/posts.ts`: Enhanced with vendor request functions
- `/app/setup/page.tsx`: New account setup flow
- `/app/admin/page.tsx`: Added vendor request management

### **PENDING ACTIONS**
🖐️ **HITL** - Test complete vendor-request → admin approval → setup flow on device
🖐️ **HITL** - Deploy: `git add -A && git commit -m "feat: vendor account setup MVP" && git push`
🖐️ **HITL** - QA: Verify vendor_requests SQL table exists via Supabase query if not already confirmed

### **ARCHITECTURE NOTES**
- MVP maintains admin control (manual approval prevents abuse)
- Leverages existing auth system (magic links, no new auth flows)  
- Data continuity preserved (localStorage vendors can be linked retroactively)
- Incremental design (Phase 2 can add Resend automation, batch operations)

### **NEXT SPRINT OPTIONS**
- Priority 1: Mall page vendor CTA (dark theme styling)
- Priority 2: Error monitoring (structured console.error wrapping)  
- Priority 3: Vendor bio field UI (builds on edit-pill pattern)
- Sprint 4: Automated email via Resend, enhanced admin bulk operations

---

## Next session starting point — Sprint 3 (continued)

### Priority 1 — Mall page vendor CTA (S effort, deferred)
- `app/mall/[slug]/page.tsx` uses dark reseller palette — CTA needs dark theme styling
- Pass `?mall_id=&mall_name=` to pre-fill the vendor request form

### Priority 2 — Error monitoring (S effort, High value, 🟢 Proceed)
- Add structured `console.error` wrapping to all API routes
- Evaluate Sentry free tier vs Vercel function logs

### Priority 3 — Vendor bio field (M effort, High value, 🟢 Proceed)
- `bio` column exists in DB + is fetched, no UI to set or display
- Inline tap-to-edit on My Booth hero; display on public `/shelf/[slug]`

### Priority 4 — Hero image upload size guard (S effort, Medium value, ✅ DONE)
- **[COMPLETE]** Already implemented — 12MB limit in `app/my-shelf/page.tsx`

### Priority 5 — Admin PIN production QA (S effort, Medium value, 🟢 Proceed)
- Confirm `ADMIN_PIN` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env
- Test full admin PIN flow on production URL

### Priority 6 — Find Map overhaul (L effort, High value, 🖐️ REVIEW before starting)
- Group saved finds by mall, per-mall route segments
- Plan required before any code

### Sprint 4 (not started)
- Resend email for vendor request notifications
- Feed pagination / infinite scroll
- Search
- Terms of service / privacy policy
- Bookmarks persistence (Supabase)

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid icons in ecosystem UI)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅
- **vendor_requests:** id, name, email, booth_number, mall_id, mall_name, status, created_at ✅
- **Storage bucket:** post-images — PUBLIC
- **Auth:** Magic link (OTP) via email — `supabase.auth.signInWithOtp()`
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Known vendors:**
  - ZenForged Finds, booth 369, id: `65a879f1-c43c-481b-974f-379792a36db8` — user_id SET ✅
  - Zen booth (admin default), id: `5619b4bf-3d05-4843-8ee1-e8b747fc2d81`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraint vendors:** `vendors_mall_booth_unique` on `(mall_id, booth_number)`
- **Unique constraint malls:** `malls_slug_key` on `(slug)`

---

## WORKING ✅
- Discovery feed — masonry, scroll restore, spring-tap, warmth hover, back-nav anchor
- Feed footer — vendor CTA "Request booth access →" → `/vendor-request`
- Magic link auth + Admin PIN login
- My Booth — hero upload, vendor switcher, Send icon
- Post flow — AI caption, price validation, image upload
- Post preview — full image (no crop), edit pill buttons on title/caption/price
- Find detail — layered drift-in, booth LEFT / mall RIGHT, no address underline
- Public shelf — share button always visible (no auth required)
- Vendor request flow — `/vendor-request` form + success screen + API route
- **Vendor account setup MVP** — admin approval workflow, setup page, email templates ✅
- RLS — 12 policies + vendor_requests (service role only) ✅
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min ✅
- PWA manifest ✅
- `.env.example` — all required vars documented ✅
- Session Control Panel (Notion) ✅
- Shell aliases `th` / `thc` ✅
- MASTER_PROMPT.md — HITL standard + Product Agent + Blocker Protocol ✅
- Notion Roadmap — seeded ✅
- Investor update system — Drive folder + first PDF + Notion process doc ✅

## KNOWN GAPS / SPRINT 3 ⚠️
- Mall page vendor CTA — deferred (dark theme)
- No error monitoring — Priority 2
- Vendor bio field — no UI — Priority 3
- Admin PIN not QA'd in production — Priority 5
- Find Map overhaul — needs plan — Priority 6
- Feed content seeding before beta invite (Sprint 4)
- No pagination/infinite scroll (Sprint 4)
- No search (Sprint 4)
- No terms of service / privacy policy (Sprint 4)

---

## DEBUGGING
```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
npx vercel --prod
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
mkdir -p app/api/your-route-name
```

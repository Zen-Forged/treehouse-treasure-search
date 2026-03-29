# Treehouse Treasure Search — Master Context Document
> Last updated: 2026-03-29 | Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app

---

## 1. Product Overview

Treehouse Treasure Search is a mobile-first (iPhone Safari) reseller intelligence app. A user photographs a thrift-store item, the app identifies it via Claude Vision (claude-opus-4-5), fetches real eBay sold comps (via SerpAPI or Apify), and returns a profit/recommendation verdict so the reseller can decide on the spot.

Phase 1-2 of a broader reseller workflow platform. No auth, no database. State lives in sessionStorage (active session) and localStorage (saved finds).

---

## 2. Tech Stack

Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS + inline styles (dark theme)
Animations: framer-motion
Icons: lucide-react
AI: @anthropic-ai/sdk (claude-opus-4-5)
Comps: SerpAPI (eBay) or Apify (eBay sold listings)
State: React Context (FindSessionContext) + hooks
Persistence: sessionStorage (session) + localStorage (finds)
Deployment: Vercel

package.json dependencies:
  @anthropic-ai/sdk ^0.80.0
  clsx ^2.1.1
  framer-motion ^12.38.0
  lucide-react ^0.383.0
  next 14.2.5
  react ^18, react-dom ^18

---

## 3. Environment Variables

ANTHROPIC_API_KEY  Powers Claude Vision. Falls back to mock data if absent.
SERPAPI_KEY        Fetches eBay sold comps via SerpAPI.
COMP_SOURCE        "serpapi" (default) or "apify"
APIFY_TOKEN        Required if COMP_SOURCE=apify

---

## 4. App Routes / Screen Flow

/ (Home) → user captures photo (camera or gallery)
  → /discover   Claude Vision identifies item via POST /api/identify
      → [confidence: low]          → /refine   user confirms or edits item name
      → [confidence: high/medium]  → /decide   price entry + comp analysis + verdict
      → "Share the story"          → /intent   caption + intent chips
          → /enhance-text   mock caption refinement + before/after image slider
              → /share   copy/download/Facebook stub + save to My Finds
/finds        grid of all saved items (localStorage)
/finds/[id]   item detail page

Key routing logic:
- /discover fires POST /api/identify on mount if session.identification is absent
- confidence === "low" routes to /refine; otherwise straight to /decide
- /refine: user can edit the title, sets session.refinedQuery, bumps confidence to "medium", pushes to /decide
- /decide uses: session.refinedQuery ?? session.identification.searchQuery for comp lookups

---

## 5. Data Model

### FindSession (sessionStorage key: tts_active_session)

id: string                     "find_{timestamp}_{random}"
createdAt: string              ISO timestamp
imageOriginal: string          base64 data URL
imageEnhanced?: string         canvas-processed version
identification?: object
  title: string
  description: string
  confidence: "high" | "medium" | "low"
  searchQuery: string          normalized eBay query
refinedQuery?: string          Phase 2: user-confirmed from /refine
intentText?: string            free-text caption from /intent
intentChips?: string[]         "curious" | "selling" | "sharing" | "offers"
captionRefined?: string        mock-AI polished caption
pricePaid?: number
comps?: MockComp[]
pricing?: object
  medianSoldPrice: number
  estimatedFees: number
  estimatedProfitHigh: number
  recommendation: "strong-buy" | "maybe" | "pass"
decision?: "purchased" | "passed" | "shared"

### SavedFind (localStorage key: tts_finds_v2)

id, createdAt, imageOriginal, imageEnhanced?
title?, description?, captionRefined?, intentText?, intentChips?
pricePaid?, decision?, medianSoldPrice?, estimatedProfitHigh?, recommendation?

### MockComp

title: string
platform: string    "ebay", "Poshmark", "StockX", etc.
price: number
condition: string
daysAgo: number
url?: string
imageUrl?: string

---

## 6. Key Files

### Hooks

hooks/useSession.tsx
  FindSessionContext + FindSessionProvider + useFindSession()
  Single source of truth for the active scan.
  Persists to sessionStorage. clearSession() removes it.

hooks/useFinds.ts
  useFinds() — loads/saves/deletes finds from localStorage (tts_finds_v2)
  sessionToFind(session, decision) — converts active session to SavedFind

hooks/useAnalysisFlow.ts
  State machine for the animated analysis feed on /decide.
  Steps: uploading → searching_comps → analyzing_market → finalizing
  Calls GET /api/sold-comps internally. Falls back to mock if no comps returned.

### API Routes

POST /api/identify
  Body: { imageDataUrl: string }
  Returns: { title, description, confidence, searchQuery }
  Uses claude-opus-4-5, max_tokens: 400
  Falls back to 8 deterministic mock items (seeded by imageDataUrl.length % 8) if no ANTHROPIC_API_KEY

GET /api/sold-comps?q=
  Normalizes query, checks in-memory cache (48h TTL)
  Fetches via SerpAPI or Apify based on COMP_SOURCE env var
  Returns: { source: "live"|"cache", normalizedQuery, comps, summary }

GET /api/debug
  Returns env var status: ANTHROPIC_API_KEY present, SERPAPI_KEY length, COMP_SOURCE value

/api/suggest, /api/ebay — legacy, not in active flow

### Lib

lib/serpApiClient.ts
  Calls SerpAPI eBay engine (engine=ebay)
  Filters lot listings via regex: lots/sets/pairs/bundles
  Builds summary: recommendedPrice, priceRangeLow, priceRangeHigh, marketVelocity, demandLevel, quickTake, confidence, avgDaysToSell

lib/apifyClient.ts
  Apify actor for eBay sold listings

lib/cache.ts
  In-memory Map cache with 48h TTL
  Keys are normalizedQuery strings
  Functions: cacheGet, cacheSet, cacheDelete, cacheSize, cachePurgeExpired

lib/pricingLogic.ts
  calculatePricing(comps: MockComp[], enteredCost: number): PricingResult
  Trims outliers (remove prices below 0.3x or above 2.5x of median)
  Fees: medianSoldPrice * 0.13 (eBay ~13%), shipping = 0 (buyer pays)
  Returns: mockCompLow, mockCompHigh, medianSoldPrice, suggestedListPrice, estimatedFees, estimatedProfitHigh, estimatedProfitLow, recommendation

lib/mockIntelligence.ts
  generateMockEvaluation(cost, imageDataUrl) — seeded mock comp data
  Exports: formatCurrency, getRecommendationLabel, getRecommendationCopy

lib/ebayClient.ts, lib/searchCache.ts — legacy

### Utils

utils/normalizeQuery.ts
  Strips filler words (a, the, and, of, etc.)
  Preserves domain vocab: vintage, antique, brass, ceramic, single, pair, etc.
  Max 8 words output
  Used by /api/identify and /api/sold-comps

### Components

components/AnalysisFeed.tsx
  Animated timeline feed of analysis steps on /decide
  StatusDot: waiting (gray) / active (pulsing green) / complete (gold)
  PulsingDots: inline loading dots
  Auto-scrolls as new messages arrive

components/RecommendationMeter.tsx  Visual strong-buy/maybe/pass meter
components/PricingBreakdown.tsx     Collapsible fee breakdown
components/CompCard.tsx             Individual sold comp listing card
components/SavedItemCard.tsx        Card for /finds grid
components/AppHeader.tsx            Shared sticky header with logo
components/PriceInput.tsx           Number input + range slider combo
components/Buttons.tsx              Shared button primitives
components/FlowDiagram.tsx          Dev/debug flow visualization

---

## 7. Pricing Logic

medianSoldPrice = trimmed median of comp prices
  trim rule: remove prices below 0.3x or above 2.5x of raw median
estimatedFees = medianSoldPrice x 0.13   (eBay ~13%)
estimatedShipping = 0                    (buyer pays)
estimatedProfitHigh = medianSoldPrice - cost - fees
estimatedProfitLow  = compLow - cost - fees

Recommendation thresholds:
  strong-buy:  profitHigh >= $20  AND  (profit / cost) >= 1.5
  maybe:       profitHigh >= $8   AND  (profit / cost) >= 0.6
  pass:        everything else

---

## 8. Identification API Detail

POST /api/identify
Model: claude-opus-4-5
Max tokens: 400
Returns raw JSON (no markdown): { title, description, confidence, searchQuery }

Claude prompt rules for searchQuery:
- Be as specific as possible: brand, model, material, type, form
- Include "single" if it's clearly one item (one goblet, one figurine)
- Include full brand+model if present (e.g., "canon eos r50 camera")
- Never use generic terms like "item" or "object"
- Good examples:
    "carnival glass iridescent goblet single"
    "canon eos r50 camera"
    "benjamin franklin brass bookend bank"
    "mid century ceramic vase single"

Query is then run through normalizeQuery() before being used for comps.

---

## 9. Comp Data Pipeline

Step 1: /discover calls POST /api/identify on mount
        → stores result in session.identification.searchQuery

Step 2: (optional) /refine lets user confirm/edit
        → stores session.refinedQuery

Step 3: /decide price-entry → user hits "Look it up"
        → useAnalysisFlow.run({ searchQuery: refinedQuery ?? identification.searchQuery })

Step 4: useAnalysisFlow → GET /api/sold-comps?q={searchQuery}

Step 5: sold-comps route:
  a. normalizeQuery(rawQuery)
  b. cacheGet(rawQuery) — if hit: return { source: "cache", ...data }
  c. if miss: fetchComps(normalized) via SerpAPI or Apify
  d. cacheSet(rawQuery, result)
  e. return { source: "live", normalizedQuery, comps, summary }

Step 6: if comps.length === 0 → fall back to generateMockEvaluation()

SerpAPI lot filter regex (applied to each listing title before including in comps):
/(lot|set|pair|collection|bundle|group)s+(ofs+)?d+|d+s*(x|pc|pcs|piece|pieces)|d{1,2}s*-?s*(goblets?|glasses?|cups?|plates?|bowls?|figurines?|statues?)/i

---

## 10. Design System

### Colors (dark forest theme)

Background:    #050f05
Surface:       rgba(13,31,13,0.5) to rgba(13,31,13,0.6)
Border:        rgba(109,188,109,0.08) to rgba(109,188,109,0.16)  green tint
Text primary:  #f5f0e8  warm white
Text mid:      #d4c9b0  warm gray
Text dim:      #7a6535, #6a5528  bark tones
Text muted:    rgba(46,36,16,0.55)
Accent gold:   #c8b47e, #a8904e  antique gold
Accent green:  #6dbc6d  success / strong-buy
CTA button:    linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))

### Typography

Serif (Georgia, serif):  headings, titles, italic quotes, logo wordmark
Mono (monospace):        all prices and numbers
Body:                    system font (Tailwind default)

### Animations (framer-motion)

Standard entry:  initial={{ opacity: 0, y: 8-16 }} animate={{ opacity: 1, y: 0 }}
Standard ease:   [0.25, 0.1, 0.25, 1]
Tap feedback:    whileTap={{ scale: 0.97 }}

### Mobile Layout Rules

Max width:     430px (home page), max-w-md (layout wrapper)
Safe area:     env(safe-area-inset-bottom) on all fixed bottom bars
Sticky header: backdrop-filter: blur(20px), bg rgba(5,15,5,0.92), border rgba(200,180,126,0.06)
Page pattern:  flex flex-col min-h-screen bg-[#050f05]
Fixed CTAs:    position fixed, bottom-0, left-0, right-0, max-w-md mx-auto

---

## 11. User Flows

### Flow A — Reseller Valuation

1. / — tap "Let's take a look" (camera) or "Choose a photo" (gallery)
2. /discover — /api/identify fires; shows title, description, confidence badge
3. [low confidence] /refine — user edits item name, taps confirm
4. /decide (price-entry) — user sets asking price via input + slider
5. /decide (analyzing) — useAnalysisFlow runs, animated AnalysisFeed
6. /decide (results) — profit estimate, badge (Strong find / Worth a closer look / Marginal),
                       breakdown (expandable), comps list (expandable), scout assessment
7. Tap "Pick it up" → decision: "purchased" → saves to finds → /finds
8. Tap "Leave it"  → decision: "passed"    → saves to finds → /finds

### Flow B — Social Sharing

1. / → /discover (same identification step)
2. Tap "Share the story" → /intent
3. /intent — select intent chips (curious/selling/sharing/offers) + optional free-text
4. /enhance-text — draggable before/after image slider + mock-refined caption
5. /share — post to Facebook (UI stub), copy caption, download image, save to My Finds

---

## 12. Current Development State (2026-03-28)

Latest commit: feat: better search queries, lot filtering, smarter normalizeQuery (356b27a)
72 total commits. 71 Vercel deployments. Deployed at: treehouse-treasure-search.vercel.app

### Working
- Full Claude Vision identification with mock fallback
- Real eBay comp data via SerpAPI (COMP_SOURCE=serpapi, default)
- Real eBay sold listings via Apify (COMP_SOURCE=apify)
- In-memory comp caching (48h TTL)
- Lot filtering from SerpAPI results
- Confidence gate: /refine screen for low-confidence IDs
- Full sharing flow: intent → enhance-text → share
- Finds persistence (localStorage tts_finds_v2)
- All mobile animations and layout

### Known Gaps / Legacy

- /api/suggest route: legacy, not in active flow
- lib/ebayClient.ts, lib/searchCache.ts: legacy files
- /enhance-text caption refinement is mock (not real Claude call yet)
- /app/enhance/page.tsx and /app/flow-test/: likely unused/experimental
- Facebook share is a UI stub (setPosted(true), no real API integration)
- No real PWA/offline support yet
- /finds/[id] detail page exists but not documented in this pass

---

## 13. Roadmap

Real comp APIs (eBay, Poshmark, Mercari) — Partial (eBay done)
Reverse image search integration          — Planned
Label / brand detection via ML            — Planned
Kanban sourcing workflow board            — Future
Listing generator (title, description)   — Future
Inventory stages (sourced/listed/sold)   — Future
Photography workflow                      — Future
Analytics dashboard (ROI, velocity)      — Future
Cloud sync + multi-device                 — Future
PWA / offline mode                        — Future

---

## 14. How to Use This Document

Paste this file as your opening message to give an AI full codebase context. It covers:
- Every route and screen in the app
- The complete data model (FindSession, SavedFind, MockComp)
- All API endpoints and their logic
- The comp data pipeline end-to-end
- Pricing formulas and recommendation thresholds
- Design tokens, typography, animation conventions
- Mobile layout rules
- Both user flows (valuation + sharing)
- Current state and known gaps

For file-level questions, paste the raw source code alongside this document.
For new feature work, reference the roadmap and current gaps sections.

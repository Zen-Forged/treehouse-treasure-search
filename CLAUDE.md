# Treehouse Treasure Search — Claude Working Instructions
> Full context: CONTEXT.md | Repo: Zen-Forged/treehouse-treasure-search | Live: treehouse-treasure-search.vercel.app

## What This App Does
Mobile-first (iPhone Safari) reseller intelligence app. Photo → Claude Vision ID → eBay comps → profit verdict. No auth, no DB. State: sessionStorage (active session) + localStorage (saved finds).

## Stack
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Anthropic SDK (claude-opus-4-5) · SerpAPI (eBay comps) · Vercel

## Key Architectural Rules
- **File edits**: Prefer full file replacements via `filesystem:write_file` over partial patches
- **State**: Single `FindSessionContext` — do NOT create parallel context systems
- **Mobile localStorage bug**: Call `persist()` synchronously *outside* state updaters before navigation (React batching defers setItem past navigation on Safari)
- **SerpAPI**: Does NOT support `_sop` sort param — omit it or you get 400s
- **Env vars**: Read inside serverless function bodies, NOT at module scope
- **zsh**: Quote paths with brackets to prevent glob expansion

## Route Map
```
/           → photo capture
/discover   → POST /api/identify on mount → routes by confidence
/refine     → low-confidence ID correction
/decide     → price entry + comp analysis + verdict (main screen)
/intent     → sharing flow: caption + chips
/enhance-text → before/after slider + mock caption polish
/share      → copy/download/Facebook stub + save to finds
/finds      → saved finds grid (localStorage)
/finds/[id] → item detail
```

## API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| /api/identify | POST | Claude Vision → { title, description, confidence, searchQuery } |
| /api/sold-comps | GET | ?q= → SerpAPI eBay comps, 48h in-memory cache |
| /api/debug | GET | env var status check |

## Data Shape (short form)
```ts
FindSession {
  id, createdAt, imageOriginal, imageEnhanced?
  identification?: { title, description, confidence: "high"|"medium"|"low", searchQuery }
  refinedQuery?: string        // from /refine, used over searchQuery
  pricePaid?, comps?, pricing?: { medianSoldPrice, estimatedFees, estimatedProfitHigh, recommendation }
  decision?: "purchased"|"passed"|"shared"
}
SavedFind  // localStorage tts_finds_v2 — subset of FindSession fields
```

## Key Files Quick Reference
```
hooks/useSession.tsx      FindSessionContext — active session state + sessionStorage
hooks/useFinds.ts         localStorage CRUD for saved finds (tts_finds_v2)
hooks/useAnalysisFlow.ts  State machine: uploading→searching_comps→analyzing_market→finalizing
lib/serpApiClient.ts      SerpAPI eBay fetch + lot-listing filter regex
lib/pricingLogic.ts       calculatePricing() — median, fees, profit, recommendation thresholds
lib/cache.ts              In-memory Map, 48h TTL
lib/mockIntelligence.ts   Mock comp data (fallback when ANTHROPIC_API_KEY absent)
utils/normalizeQuery.ts   Strip filler words, preserve domain vocab, max 8 words
components/AnalysisFeed.tsx   Animated step-by-step analysis timeline
components/RecommendationMeter.tsx / PricingBreakdown.tsx / CompCard.tsx
```

## Pricing Logic
```
medianSoldPrice = trimmed median (drop <0.3x or >2.5x raw median)
estimatedFees   = medianSoldPrice × 0.13
profitHigh      = medianSoldPrice - cost - fees
strong-buy: profitHigh ≥ $20 AND profit/cost ≥ 1.5
maybe:      profitHigh ≥ $8  AND profit/cost ≥ 0.6
pass:       everything else
```

## Design Tokens (essentials)
```
bg:          #050f05
text:        #f5f0e8 (primary), #d4c9b0 (mid)
gold:        #c8b47e
green:       #6dbc6d
font:        Georgia serif (headings/prices), system (body)
max-width:   430px home, max-w-md elsewhere
animations:  opacity 0→1, y 8-16→0, ease [0.25,0.1,0.25,1]
```

## Current State (2026-03-29)
- ✅ Claude Vision ID, SerpAPI comps, lot filtering, comp caching, /refine flow, sharing flow, finds persistence
- ⚠️ Legacy: /api/suggest, lib/ebayClient.ts, lib/searchCache.ts (safe to ignore)
- ⚠️ /enhance-text caption polish is mock (not real Claude call)
- ⚠️ Facebook share is a UI stub

## When You Need More Detail
Paste the relevant section from **CONTEXT.md** or the raw source file. This doc covers 80% of working sessions.

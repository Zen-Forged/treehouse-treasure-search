# New API Route

Add a new Next.js API route.

## Usage
/new-api [route-path] [description]

Example: /new-api /api/price-history Fetch 90-day price trend for a search query

## What to do

1. Create `app/api/[route-path]/route.ts`
2. Read ALL env vars inside the handler body — never at module scope
3. Return `NextResponse.json(...)` with explicit status codes
4. Wrap in try/catch, return `{ error: string }` on failure with status 500
5. Add in-memory cache via `lib/cache.ts` if the endpoint hits an external API
6. Add route to the API table in CLAUDE.md

## Template
```ts
import { NextRequest, NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '@/lib/cache'

export async function GET(req: NextRequest) {
  const apiKey = process.env.YOUR_KEY  // ← inside handler, not module scope
  if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 500 })

  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'Missing q param' }, { status: 400 })

  const cached = cacheGet(q)
  if (cached) return NextResponse.json({ source: 'cache', ...cached })

  try {
    // fetch external data
    const result = { /* ... */ }
    cacheSet(q, result)
    return NextResponse.json({ source: 'live', ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

## SerpAPI reminder
Do NOT include `_sop` sort param — it causes 400 errors.

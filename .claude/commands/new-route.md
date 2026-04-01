# New Route

Add a new page route to the app.

## Usage
/new-route [route-path] [description]

Example: /new-route /scan/results Show eBay comps in a standalone results page

## What to do

1. Create `app/[route-path]/page.tsx` following the mobile layout pattern:
   ```tsx
   // flex flex-col min-h-screen bg-[#050f05]
   // max-w-md mx-auto
   // sticky AppHeader at top
   // safe-area-inset-bottom on any fixed bottom CTA
   ```
2. Use `useFindSession()` for session state — never create new context
3. Add framer-motion entry animation: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
4. If the route needs comps/analysis, wire through `useAnalysisFlow`
5. Update the route map in CLAUDE.md section "Route Map"

## Design rules
- Dark bg: `bg-[#050f05]`
- Text: `text-[#f5f0e8]` primary, `text-[#d4c9b0]` secondary
- Gold accent: `text-[#c8b47e]`
- Green accent: `text-[#6dbc6d]`
- Headings: `font-serif` (Georgia)
- Prices/numbers: `font-mono`

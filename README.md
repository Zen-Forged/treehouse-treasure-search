# 🌲 Treehouse Treasure Search

> Know if it's worth buying before you check out.

A fast, mobile-first purchase decision tool built for resellers sourcing in thrift stores. Scan an item, enter the price, and instantly get mock comp data, fee estimates, profit projections, and a clear Buy / Pass recommendation.

---

## Product Summary

Treehouse Treasure Search is a V1 reseller intelligence app designed to eliminate guesswork at the thrift store. Instead of mentally calculating margin on the spot, you scan the item, enter what it costs, and the app does the math — showing you comparable sales, estimated fees, and a simple recommendation meter.

**This is Phase 1 of a broader reseller workflow platform.**

---

## V1 Scope

- ✅ Mobile-first Next.js web app (works in Safari on iPhone)
- ✅ Camera / photo library image capture
- ✅ Mock comp intelligence layer (deterministic, believable)
- ✅ Pricing breakdown with fees, shipping, profit range
- ✅ Strong Buy / Maybe / Pass recommendation meter
- ✅ Save evaluated items to localStorage
- ✅ Filter saved items by Purchase / Pass
- ✅ Item detail view with delete
- ✅ No auth, no database, no external APIs required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React hooks + Context |
| Persistence | localStorage |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Install

```bash
git clone https://github.com/YOUR_USERNAME/treehouse-treasure-search.git
cd treehouse-treasure-search
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser or on your phone (same network).

> **iPhone testing:** Use your computer's local IP, e.g. `http://192.168.x.x:3000`

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
treehouse-treasure-search/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home screen
│   ├── globals.css         # Global styles
│   ├── scan/
│   │   └── page.tsx        # Camera/upload screen
│   ├── decide/
│   │   └── page.tsx        # Decision screen (core UX)
│   ├── saved/
│   │   └── page.tsx        # Saved items list
│   └── item/
│       └── [id]/
│           └── page.tsx    # Item detail view
├── components/
│   ├── AppHeader.tsx
│   ├── Buttons.tsx
│   ├── CompCard.tsx
│   ├── PriceInput.tsx
│   ├── PricingBreakdown.tsx
│   ├── RecommendationMeter.tsx
│   └── SavedItemCard.tsx
├── hooks/
│   ├── useSavedItems.ts    # localStorage persistence
│   └── useScanSession.tsx  # Cross-page session state
├── lib/
│   └── mockIntelligence.ts # Mock comp + pricing engine
└── types/
    └── index.ts            # TypeScript types
```

---

## Deploying to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect Next.js.

### Option 2: GitHub Integration

1. Push to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Click Deploy

No environment variables required for V1.

---

## Suggested Commit Structure

```bash
# 1
git commit -m "chore: initialize next app with tailwind and typescript"

# 2
git commit -m "feat: add types, mock intelligence layer, and persistence hooks"

# 3
git commit -m "feat: build home screen and mobile scan flow"

# 4
git commit -m "feat: implement decision screen with mock comps and pricing"

# 5
git commit -m "feat: add saved items list and item detail view"

# 6
git commit -m "style: refine dark theme, animations, and recommendation meter"
```

---

## Future Roadmap

| Feature | Phase |
|---|---|
| Real comp APIs (eBay, Poshmark, Mercari) | V2 |
| Reverse image search integration | V2 |
| Label / brand detection via ML | V2 |
| Kanban sourcing workflow board | V3 |
| Listing generator (title, description, tags) | V3 |
| Inventory stages (sourced → listed → sold) | V3 |
| Photography workflow (photo checklist, backgrounds) | V3 |
| Analytics dashboard (ROI, velocity, margin trends) | V4 |
| Cloud sync + multi-device | V4 |
| PWA / offline mode | V4 |

---

## License

MIT

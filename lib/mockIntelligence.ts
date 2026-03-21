import {
  EvaluatedItem,
  MockComp,
  Recommendation,
} from "@/types";

const COMP_POOLS = [
  {
    titles: ["Vintage Levi's 501 Jeans", "Classic Denim Straight Leg", "Retro Levi's Button Fly"],
    platform: "eBay",
    baseRange: [28, 85],
  },
  {
    titles: ["Coach Leather Purse", "Coach Signature Bag", "Coach Mini Crossbody"],
    platform: "Poshmark",
    baseRange: [35, 120],
  },
  {
    titles: ["Ralph Lauren Polo Shirt", "RL Oxford Button Down", "Polo Chino Shorts"],
    platform: "eBay",
    baseRange: [18, 55],
  },
  {
    titles: ["Nike Air Max 90", "Nike Dunk Low", "Air Force 1 White", "Jordan 1 Retro"],
    platform: "StockX",
    baseRange: [70, 220],
  },
  {
    titles: ["Pyrex Vision Hoodie", "Supreme Box Logo Tee", "Palace Tri-Ferg"],
    platform: "Grailed",
    baseRange: [60, 350],
  },
  {
    titles: ["Patagonia Fleece Jacket", "Patagonia Nano Puff", "Synchilla Snap-T"],
    platform: "Poshmark",
    baseRange: [45, 110],
  },
  {
    titles: ["Tommy Hilfiger Windbreaker", "Tommy 90s Jacket", "Hilfiger Colorblock"],
    platform: "eBay",
    baseRange: [25, 75],
  },
  {
    titles: ["Vintage Band Tee", "Nirvana Graphic Tee", "80s Concert Shirt"],
    platform: "Depop",
    baseRange: [20, 90],
  },
];

const CONDITIONS = ["Like New", "Very Good", "Good", "Acceptable", "Good", "Very Good"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickFromSeed<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function generateMockEvaluation(
  enteredCost: number,
  imageDataUrl: string
): Omit<EvaluatedItem, "id" | "createdAt" | "decision"> {
  const seed = Math.floor(
    (imageDataUrl.length * 0.0001 + enteredCost * 37) % 2147483647
  );
  const rand = seededRandom(seed);

  const pool = COMP_POOLS[Math.floor(rand() * COMP_POOLS.length)];
  const [baseMin, baseMax] = pool.baseRange;

  const comps: MockComp[] = Array.from({ length: 4 }, (_, i) => {
    const variance = 0.75 + rand() * 0.55;
    const price = Math.round(baseMin + rand() * (baseMax - baseMin) * variance);
    return {
      title: pool.titles[i % pool.titles.length],
      platform: pool.platform,
      price,
      condition: CONDITIONS[Math.floor(rand() * CONDITIONS.length)],
      daysAgo: Math.floor(rand() * 28) + 1,
    };
  });

  const prices = comps.map((c) => c.price);
  const mockCompLow = Math.min(...prices);
  const mockCompHigh = Math.max(...prices);
  const suggestedListPrice = Math.round(mockCompHigh * 0.85);
  const estimatedFees = Math.round(suggestedListPrice * 0.13);
  const estimatedShipping = 6;

  const profitLow = mockCompLow - enteredCost - estimatedFees - estimatedShipping;
  const profitHigh = suggestedListPrice - enteredCost - estimatedFees - estimatedShipping;

  const estimatedProfitLow = Math.round(profitLow);
  const estimatedProfitHigh = Math.round(profitHigh);

  const margin = profitHigh / (enteredCost || 1);
  let recommendation: Recommendation;

  if (estimatedProfitHigh >= 20 && margin >= 1.5) {
    recommendation = "strong-buy";
  } else if (estimatedProfitHigh >= 8 && margin >= 0.6) {
    recommendation = "maybe";
  } else {
    recommendation = "pass";
  }

  return {
    imageDataUrl,
    enteredCost,
    mockComps: comps,
    mockCompLow,
    mockCompHigh,
    suggestedListPrice,
    estimatedFees,
    estimatedShipping,
    estimatedProfitLow,
    estimatedProfitHigh,
    recommendation,
  };
}

export function getRecommendationLabel(rec: Recommendation): string {
  const map: Record<Recommendation, string> = {
    "strong-buy": "Strong Buy",
    maybe: "Maybe",
    pass: "Pass",
  };
  return map[rec];
}

export function getRecommendationCopy(rec: Recommendation): string {
  const map: Record<Recommendation, string> = {
    "strong-buy": "Margin looks healthy — flip it.",
    maybe: "Could work if comps are strong.",
    pass: "Too tight after fees.",
  };
  return map[rec];
}

export function formatCurrency(val: number): string {
  return `$${Math.abs(val).toFixed(2)}`;
}
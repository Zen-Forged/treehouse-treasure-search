import { MockComp, Recommendation } from "@/types";

export interface PricingResult {
  mockCompLow: number;
  mockCompHigh: number;
  medianSoldPrice: number;
  suggestedListPrice: number;
  estimatedFees: number;
  estimatedShipping: number;
  estimatedProfitLow: number;
  estimatedProfitHigh: number;
  recommendation: Recommendation;
}

function calculateMedian(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function trimOutliers(prices: number[]): number[] {
  if (prices.length <= 2) return prices;

  const median = calculateMedian(prices);

  // Drop anything above 2.5x the median or below 0.3x the median
  const filtered = prices.filter(
    (p) => p <= median * 2.5 && p >= median * 0.3
  );

  // If we filtered too aggressively, return original
  return filtered.length >= 3 ? filtered : prices;
}

export function calculatePricing(
  comps: MockComp[],
  enteredCost: number
): PricingResult {
  const rawPrices = comps.map((c) => c.price).filter((p) => p > 0);

  if (rawPrices.length === 0) {
    return {
      mockCompLow: 0,
      mockCompHigh: 0,
      medianSoldPrice: 0,
      suggestedListPrice: 0,
      estimatedFees: 0,
      estimatedShipping: 0,
      estimatedProfitLow: -enteredCost,
      estimatedProfitHigh: -enteredCost,
      recommendation: "pass",
    };
  }

  const cleanPrices = trimOutliers(rawPrices);
  const medianSoldPrice = Math.round(calculateMedian(cleanPrices) * 100) / 100;
  const mockCompLow = Math.min(...cleanPrices);
  const mockCompHigh = Math.max(...cleanPrices);

  // List at median — conservative and realistic
  const suggestedListPrice = medianSoldPrice;

  // eBay fees ~13%, no shipping (buyer pays)
  const estimatedFees = Math.round(suggestedListPrice * 0.13 * 100) / 100;
  const estimatedShipping = 0;

  const estimatedProfitHigh = Math.round(
    (suggestedListPrice - enteredCost - estimatedFees) * 100
  ) / 100;

  const estimatedProfitLow = Math.round(
    (mockCompLow - enteredCost - estimatedFees) * 100
  ) / 100;

  const margin = estimatedProfitHigh / (enteredCost || 1);
  let recommendation: Recommendation;

  if (estimatedProfitHigh >= 20 && margin >= 1.5) {
    recommendation = "strong-buy";
  } else if (estimatedProfitHigh >= 8 && margin >= 0.6) {
    recommendation = "maybe";
  } else {
    recommendation = "pass";
  }

  return {
    mockCompLow,
    mockCompHigh,
    medianSoldPrice,
    suggestedListPrice,
    estimatedFees,
    estimatedShipping,
    estimatedProfitLow,
    estimatedProfitHigh,
    recommendation,
  };
}
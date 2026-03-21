import { MockComp, Recommendation } from "@/types";

export interface PricingResult {
  mockCompLow: number;
  mockCompHigh: number;
  suggestedListPrice: number;
  estimatedFees: number;
  estimatedShipping: number;
  estimatedProfitLow: number;
  estimatedProfitHigh: number;
  recommendation: Recommendation;
}

export function calculatePricing(
  comps: MockComp[],
  enteredCost: number
): PricingResult {
  const prices = comps.map((c) => c.price).filter((p) => p > 0);

  if (prices.length === 0) {
    return {
      mockCompLow: 0,
      mockCompHigh: 0,
      suggestedListPrice: 0,
      estimatedFees: 0,
      estimatedShipping: 6,
      estimatedProfitLow: -enteredCost - 6,
      estimatedProfitHigh: -enteredCost - 6,
      recommendation: "pass",
    };
  }

  const mockCompLow = Math.min(...prices);
  const mockCompHigh = Math.max(...prices);
  const suggestedListPrice = Math.round(mockCompHigh * 0.85);
  const estimatedFees = Math.round(suggestedListPrice * 0.13);
  const estimatedShipping = 6;

  const estimatedProfitLow = Math.round(
    mockCompLow - enteredCost - estimatedFees - estimatedShipping
  );
  const estimatedProfitHigh = Math.round(
    suggestedListPrice - enteredCost - estimatedFees - estimatedShipping
  );

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
    suggestedListPrice,
    estimatedFees,
    estimatedShipping,
    estimatedProfitLow,
    estimatedProfitHigh,
    recommendation,
  };
}
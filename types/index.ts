export type Recommendation = "strong-buy" | "maybe" | "pass";
export type Decision = "purchased" | "passed" | "pending";

export interface MockComp {
  title: string;
  platform: string;
  price: number;
  condition: string;
  daysAgo: number;
  url?: string;
  imageUrl?: string;
}

export interface EvaluatedItem {
  id: string;
  createdAt: string;
  imageDataUrl: string;
  enteredCost: number;
  mockComps: MockComp[];
  mockCompLow: number;
  mockCompHigh: number;
  medianSoldPrice: number;
  suggestedListPrice: number;
  estimatedFees: number;
  estimatedShipping: number;
  estimatedProfitLow: number;
  estimatedProfitHigh: number;
  recommendation: Recommendation;
  decision: Decision;
}

export interface ScanSessionData {
  imageDataUrl: string;
  enteredCost: number;
}
export type Recommendation = "strong-buy" | "maybe" | "pass";
export type Decision = "purchased" | "passed" | "pending";

// ─── Item Attributes (extracted by Claude Vision) ────────────────────────────

export interface ItemAttributes {
  brand:    string | null;   // e.g. "Wedgwood", "Pyrex", null if unknown
  material: string | null;   // e.g. "Cast iron", "Sterling silver", "Ceramic"
  era:      string | null;   // e.g. "1950s–1960s", "Victorian", "Pre-1900"
  origin:   string | null;   // e.g. "Japan", "USA", "England"
  category: string | null;   // e.g. "Kitchenware", "Figurines", "Jewelry"
}

// ─── Comp (replaces MockComp) ─────────────────────────────────────────────────

export interface Comp {
  title:       string;
  platform:    "ebay";
  price:       number;
  condition:   string;
  daysAgo:     number;       // for sold: days since sale; for active: days listed
  listingType: "sold" | "active";
  url?:        string;
  imageUrl?:   string;
  soldDate?:   string;       // ISO string, only present on sold comps
}

// ─── Legacy alias — keeps existing saved items from breaking ─────────────────

export type MockComp = Comp;

// ─── Evaluated Item ───────────────────────────────────────────────────────────

export interface EvaluatedItem {
  id:                  string;
  createdAt:           string;
  imageDataUrl:        string;
  enteredCost:         number;

  // Item identity
  title?:              string;
  description?:        string;
  attributes?:         ItemAttributes;

  // Comps — split by type
  soldComps:           Comp[];
  activeComps:         Comp[];

  // Legacy fields — kept for backward compat with saved items
  mockComps?:          Comp[];
  mockCompLow?:        number;
  mockCompHigh?:       number;

  // Pricing
  medianSoldPrice:     number;
  suggestedListPrice:  number;
  estimatedFees:       number;
  estimatedShipping:   number;
  estimatedProfitLow:  number;
  estimatedProfitHigh: number;

  // Market intelligence
  avgDaysToSell:       number;
  competitionCount:    number;   // number of active listings found
  competitionLevel:    "low" | "moderate" | "high";

  recommendation:      Recommendation;
  decision:            Decision;
}

export interface ScanSessionData {
  imageDataUrl: string;
  enteredCost:  number;
}

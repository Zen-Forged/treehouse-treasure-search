export type Recommendation = "strong-buy" | "maybe" | "pass";
export type Decision = "purchased" | "passed" | "pending";

// ─── Item Attributes (extracted by Claude Vision) ────────────────────────────

export interface ItemAttributes {
  // Core identity — displayed in UI + saved to finds
  brand:    string | null;
  material: string | null;
  era:      string | null;
  origin:   string | null;
  category: string | null;

  // Visual classification — from refined identification prompt
  objectType?:          string | null;   // "bookend", "table lamp", "drink caddy"
  model?:               string | null;   // "eos r50", "air jordan 1", "stand mixer"
  shape?:               string | null;   // "tall cylindrical", "low round", "rectangular tray"
  primaryColor?:        string | null;   // normalized: "brass", "white", "amber"
  secondaryColor?:      string | null;
  pattern?:             string | null;   // "solid", "speckled", "etched", "painted"
  condition?:           string | null;   // "new" | "like new" | "good" | "worn" | "damaged"
  setType?:             string | null;   // "single" | "pair" | "set" | "unknown"
  sizeEstimate?:        string | null;   // "small (under 6 inches)", "unknown"
  distinctiveFeatures?: string[];        // ["handles on both sides", "gold rim"]
  visualConfidence?:    number;          // overall 0.0–1.0
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

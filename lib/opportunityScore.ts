// lib/opportunityScore.ts
// Treehouse Decision Meter — scoring engine.
//
// Converts 4 market signals into a single Opportunity Score (0–100)
// and a recommendation: Strong Buy / Maybe / Pass.
//
// SIGNAL MAP:
//   Profit    (35%) — derived from median sold price and price spread
//   Speed     (25%) — how fast items move (market velocity)
//   Confidence(25%) — how much data we have; low confidence pulls score toward neutral
//   Effort    (15%) — inverted competition; high competition = more effort to sell
//
// All weights are defined as constants below for easy tuning.
// ─────────────────────────────────────────────────────────────────────────────

// ── Weights (must sum to 1.0) ────────────────────────────────────────────────
const W_PROFIT     = 0.35;
const W_SPEED      = 0.25;
const W_CONFIDENCE = 0.25;
const W_EFFORT     = 0.15; // negative drag — high effort lowers score

// ── Thresholds ───────────────────────────────────────────────────────────────
export const THRESHOLD_STRONG_BUY = 75;
export const THRESHOLD_MAYBE      = 50;
// Below THRESHOLD_MAYBE → Pass

// ── Types ────────────────────────────────────────────────────────────────────

export type Recommendation = "Strong Buy" | "Maybe" | "Pass";

export interface OpportunitySignals {
  // Raw values (0–100) for each of the 4 signals — used for bar rendering
  profit:     number;
  speed:      number;
  confidence: number;
  effort:     number;   // 0 = low effort (good), 100 = high effort (bad)
}

export interface OpportunityScore {
  score:          number;          // 0–100 overall
  recommendation: Recommendation;
  signals:        OpportunitySignals;
  microcopy:      string;
  // Debug detail for "Why this score?" section
  detail: {
    profitLabel:     string;
    speedLabel:      string;
    confidenceLabel: string;
    effortLabel:     string;
  };
}

// ── Input shape — everything the page already has ────────────────────────────

export interface ScoringInput {
  // From SoldSummary (serpApiClient)
  demandLevel:      string;   // "High" | "Moderate" | "Low"
  marketVelocity:   string;   // "fast" | "moderate" | "slow"
  confidence:       string;   // "High" | "Moderate" | "Low"
  competitionLevel: string;   // "low" | "moderate" | "high"
  competitionCount: number;
  avgDaysToSell:    number;
  priceRangeLow:    number;
  priceRangeHigh:   number;
  // From calculatePricing
  medianSoldPrice:  number;
  compCount:        number;   // number of sold comps used
}

// ── Normalizer ───────────────────────────────────────────────────────────────

function norm(val: string): "high" | "moderate" | "low" {
  const v = val.toLowerCase();
  if (v === "high" || v === "fast") return "high";
  if (v === "moderate")             return "moderate";
  return "low";
}

// ── Signal scorers (each returns 0–100) ─────────────────────────────────────

// PROFIT: uses actual price data when available, falls back to demand signal.
// A wide price range = more variance = slightly lower profit confidence.
// TODO: when pricePaid is available, use actual margin % instead of median proxy.
function profitSignal(input: ScoringInput): number {
  if (input.medianSoldPrice > 0) {
    // Scale: $0 median → 0, $100+ median → 100 (capped at 100)
    // Assumption: items over $100 median are clearly worthwhile from a profit standpoint.
    // Items under $15 are generally not worth thrift resale effort.
    const priceScore  = Math.min(100, (input.medianSoldPrice / 100) * 100);

    // Range penalty: if spread > 50% of median, price is volatile → reduce confidence
    const spread      = input.priceRangeHigh - input.priceRangeLow;
    const spreadRatio = input.medianSoldPrice > 0 ? spread / input.medianSoldPrice : 0;
    const spreadPenalty = Math.min(20, spreadRatio * 20); // max 20pt penalty

    return Math.round(Math.max(0, priceScore - spreadPenalty));
  }

  // Fallback to demand level when no price data
  const demandFallback: Record<string, number> = { high: 75, moderate: 50, low: 20 };
  return demandFallback[norm(input.demandLevel)] ?? 50;
}

// SPEED: how quickly items move. avgDaysToSell is the primary signal.
// Falls back to marketVelocity string when no date data.
// TODO: incorporate sell-through rate if available from future API integrations.
function speedSignal(input: ScoringInput): number {
  if (input.avgDaysToSell > 0) {
    // Score: sells in 1 day = 100, sells in 60+ days = ~0
    const score = Math.max(0, 100 - (input.avgDaysToSell / 60) * 100);
    return Math.round(score);
  }

  // Fallback to velocity string
  const velocityFallback: Record<string, number> = { high: 85, moderate: 50, low: 15 };
  return velocityFallback[norm(input.marketVelocity)] ?? 50;
}

// CONFIDENCE: how much data backs this score. Fewer comps = less certain.
// This also acts as a global multiplier that pulls the final score toward 50.
function confidenceSignal(input: ScoringInput): number {
  // Primary: number of sold comps
  const compScore = Math.min(100, (input.compCount / 15) * 100); // 15 comps = max confidence

  // Secondary: serpAPI confidence level string (used when compCount not available)
  const levelBonus: Record<string, number> = { high: 10, moderate: 0, low: -15 };
  const bonus = levelBonus[norm(input.confidence)] ?? 0;

  return Math.round(Math.max(0, Math.min(100, compScore + bonus)));
}

// EFFORT: how much work is required to sell this. High competition = high effort.
// Higher effort score = harder to sell = more drag on opportunity.
// Returned as 0–100 where 100 = max effort (bad). Inverted before applying weight.
function effortSignal(input: ScoringInput): number {
  const competitionDrag: Record<string, number> = { low: 15, moderate: 50, high: 85 };
  const base = competitionDrag[norm(input.competitionLevel)] ?? 50;

  // Extra penalty if active listing count is very high
  const countPenalty = Math.min(15, (input.competitionCount / 30) * 15);

  return Math.round(Math.min(100, base + countPenalty));
}

// ── Confidence multiplier ─────────────────────────────────────────────────────
// When data is thin, we pull the final score toward neutral (50).
// This prevents a "High" verdict from thin data.
function confidenceMultiplier(confScore: number): number {
  // confScore 0 → multiplier 0.5 (score pulled 50% toward 50)
  // confScore 100 → multiplier 1.0 (score used as-is)
  return 0.5 + (confScore / 100) * 0.5;
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export function computeOpportunityScore(input: ScoringInput): OpportunityScore {
  const profit     = profitSignal(input);
  const speed      = speedSignal(input);
  const confidence = confidenceSignal(input);
  const effort     = effortSignal(input); // higher = more work = bad

  // Raw weighted score
  // Effort is a drag: we subtract its weighted contribution
  const raw =
    (profit     * W_PROFIT) +
    (speed      * W_SPEED) +
    (confidence * W_CONFIDENCE) -
    (effort     * W_EFFORT);

  const clamped = Math.max(0, Math.min(100, raw));

  // Apply confidence multiplier — uncertain data pulls score toward 50
  const mult     = confidenceMultiplier(confidence);
  const adjusted = 50 + (clamped - 50) * mult;
  const score    = Math.round(Math.max(0, Math.min(100, adjusted)));

  // Recommendation thresholds
  const recommendation: Recommendation =
    score >= THRESHOLD_STRONG_BUY ? "Strong Buy" :
    score >= THRESHOLD_MAYBE      ? "Maybe"      : "Pass";

  // Signal labels for UI
  const profitLabel     = profit >= 70     ? "Strong"   : profit >= 40    ? "Moderate" : "Weak";
  const speedLabel      = speed >= 70      ? "Fast"     : speed >= 40     ? "Moderate" : "Slow";
  const confidenceLabel = confidence >= 70 ? "High"     : confidence >= 40 ? "Moderate" : "Low";
  const effortLabel     = effort <= 30     ? "Low"      : effort <= 60    ? "Moderate" : "High";

  // Microcopy
  const microcopy = buildMicrocopy(recommendation, profit, speed, confidence, effort);

  return {
    score,
    recommendation,
    signals: { profit, speed, confidence, effort },
    microcopy,
    detail: { profitLabel, speedLabel, confidenceLabel, effortLabel },
  };
}

// ── Microcopy ────────────────────────────────────────────────────────────────

function buildMicrocopy(
  rec:        Recommendation,
  profit:     number,
  speed:      number,
  confidence: number,
  effort:     number,
): string {
  if (rec === "Strong Buy") {
    if (speed >= 70 && profit >= 60) return "This one checks out. Worth picking up.";
    if (profit >= 70)                return "Good price potential. Worth grabbing.";
    return "This one checks out. Worth picking up.";
  }

  if (rec === "Maybe") {
    if (confidence < 40) return "Not enough data to be sure. Proceed carefully.";
    if (effort >= 70)    return "There's something here — but expect some competition.";
    if (speed < 40)      return "There's something here. It may just take a while to move.";
    return "There's something here. Take a closer look.";
  }

  // Pass
  if (effort >= 70)    return "Too much competition. Margins will be thin.";
  if (speed < 30)      return "Slow market. Might not be worth the wait.";
  if (profit < 30)     return "Price point doesn't leave much room. Might not be worth the effort.";
  return "Might not be worth the effort.";
}

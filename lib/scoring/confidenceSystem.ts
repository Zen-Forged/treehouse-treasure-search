// lib/scoring/confidenceSystem.ts
//
// Computes two independent confidence scores:
//
//   identification_confidence (0–1):
//     How confident are we that Claude correctly identified the item?
//     Source: Claude's own visualConfidence + structural signals
//     (did we get a subject? a material? a style descriptor?)
//     This is cheap to compute — no network calls.
//
//   pricing_confidence (0–1):
//     How confident are we that the pricing output is reliable?
//     Source: quantity of usable comps, score distribution, price spread
//     This runs after scoring, from the ranked comp pool.
//
// Both scores feed into the Scout Analysis copy and the UI confidence badge.

import { ItemAttributes } from "@/types";
import { RankedComps } from "@/lib/scoring/scoreComp";
import { extractStyleDescriptor } from "@/lib/queryBuilder";

export type ConfidenceOutput = {
  identification_confidence: number;   // 0–1
  pricing_confidence:        number;   // 0–1
  identification_label:      "High" | "Moderate" | "Low";
  pricing_label:             "High" | "Moderate" | "Low";
  pricing_note:              string;   // human-readable explanation for scout copy
};

// ── Identification confidence ────────────────────────────────────────────────
// Combines Claude's visual confidence with structural completeness.
// A high-confidence ID has: visual score ≥ 0.8 AND object type AND material.
// A low-confidence ID has: visual score < 0.55 OR no object type.

export function computeIdentificationConfidence(
  attributes:     ItemAttributes,
  isNamedProduct: boolean,
): number {
  const visual = attributes.visualConfidence ?? 0;

  // Structural signal bonuses — reward completeness of extraction
  let structural = 0;

  if (attributes.objectType)    structural += 0.10;
  if (attributes.material)      structural += 0.08;
  if (attributes.brand)         structural += 0.08;   // named products
  if (attributes.subject)       structural += 0.10;   // portrait items
  if (extractStyleDescriptor(attributes.distinctiveFeatures)) structural += 0.06;
  if (attributes.era)           structural += 0.04;
  if (isNamedProduct && attributes.brand && attributes.model) structural += 0.10;

  // Blend: visual confidence is the dominant signal (70%), structural is bonus (30%)
  // Cap structural at 0.30 to prevent it from overwhelming a weak visual signal
  const blended = (visual * 0.70) + (Math.min(structural, 0.30));

  return Math.max(0, Math.min(1, Math.round(blended * 100) / 100));
}

// ── Pricing confidence ────────────────────────────────────────────────────────
// Based on the quantity and quality of comps after scoring.
// Key factors:
//   - Number of usable comps (score ≥ 45)
//   - Number of high-confidence comps (score ≥ 70)
//   - Price spread (tight = confident, wide = uncertain)
//   - Average score of usable comps

export function computePricingConfidence(ranked: RankedComps): number {
  const usable = ranked.usable;
  const high   = ranked.highConfidence;

  if (usable.length === 0) return 0;

  // Quantity factor: 0 → 0, 5 → 0.5, 10+ → 1.0
  const quantityFactor = Math.min(1, usable.length / 10);

  // Quality factor: average score of usable comps, normalised
  const avgScore = usable.reduce((s, c) => s + c.score, 0) / usable.length;
  const qualityFactor = avgScore / 100;

  // High-confidence ratio: what fraction of usable comps are high confidence
  const highRatio = usable.length > 0 ? high.length / usable.length : 0;

  // Price spread factor: tight spread = more confident pricing
  const prices     = usable.map(c => c.item.price).filter((p): p is number => p !== null);
  const sorted     = [...prices].sort((a, b) => a - b);
  const priceRange = sorted.length >= 2 ? sorted[sorted.length - 1] - sorted[0] : 0;
  const median     = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 1;
  const spreadRatio = median > 0 ? priceRange / median : 1;
  // Spread < 0.5x median = tight (factor 1.0), spread > 2x median = wide (factor 0.3)
  const spreadFactor = Math.max(0.3, 1 - Math.min(1, (spreadRatio - 0.5) / 1.5));

  // Weighted blend
  const confidence =
    (quantityFactor * 0.35) +
    (qualityFactor  * 0.30) +
    (highRatio      * 0.20) +
    (spreadFactor   * 0.15);

  return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
}

// ── Label mapping ─────────────────────────────────────────────────────────────

function toLabel(score: number): "High" | "Moderate" | "Low" {
  return score >= 0.72 ? "High" : score >= 0.45 ? "Moderate" : "Low";
}

function toPricingNote(pricingConf: number, ranked: RankedComps): string {
  const usable = ranked.usable.length;
  const high   = ranked.highConfidence.length;

  if (pricingConf >= 0.72) {
    return `${high} strong comp matches — pricing is reliable.`;
  }
  if (pricingConf >= 0.45) {
    return `${usable} usable comps found — pricing is directional.`;
  }
  if (usable > 0) {
    return `Only ${usable} low-quality comp${usable === 1 ? "" : "s"} found — price with caution.`;
  }
  return "No reliable comps found — price estimate is speculative.";
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeConfidence(
  attributes:     ItemAttributes,
  isNamedProduct: boolean,
  ranked:         RankedComps,
): ConfidenceOutput {
  const idConf      = computeIdentificationConfidence(attributes, isNamedProduct);
  const priceConf   = computePricingConfidence(ranked);

  return {
    identification_confidence: idConf,
    pricing_confidence:        priceConf,
    identification_label:      toLabel(idConf),
    pricing_label:             toLabel(priceConf),
    pricing_note:              toPricingNote(priceConf, ranked),
  };
}

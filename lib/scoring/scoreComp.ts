// lib/scoring/scoreComp.ts
//
// Scores a single normalised comp against the extracted item attributes.
// Returns a 0–100 score with a full breakdown for debugging.
//
// Scoring philosophy:
//   - Positive signals stack additively up to their weight ceiling
//   - Hard penalties (lot, parts, repro) are multiplicative — they tank the score
//   - Soft penalties (incomplete, material mismatch) reduce score proportionally
//   - Recency bonus rewards fresh data without punishing older listings too hard
//   - No single signal should dominate — robustness over precision
//
// Score interpretation:
//   80–100  Strong match — use in pricing with high confidence
//   60–79   Good match — include but note in scout analysis
//   40–59   Weak match — include only if pool is thin
//   0–39    Poor match — exclude from pricing, may show as reference

import { ItemAttributes } from "@/types";
import { NormalizedMarketplaceItem } from "@/lib/search/retrievalOrchestrator";
import { parseListingSignals } from "@/lib/scoring/parseListingSignals";
import { extractStyleDescriptor } from "@/lib/queryBuilder";

export type ScoreBreakdown = {
  objectType:       number;   // 0–20: title mentions correct object type
  subject:          number;   // 0–25: title mentions correct subject (portrait items)
  material:         number;   // 0–15: title mentions correct material
  styleDescriptor:  number;   // 0–10: title mentions style form (lily, gooseneck, etc.)
  brand:            number;   // 0–15: title mentions correct brand (named products)
  era:              number;   // 0–5:  title mentions correct era
  titleQuality:     number;   // 0–5:  title length and specificity signal
  recency:          number;   // 0–10: how recent the sale was
  hasImage:         number;   // 0–3:  listing has an image (higher quality listing)
  penalties:        number;   // ≤0:   lot / parts / repro / material mismatch deductions
};

export type ScoredComp = {
  item:      NormalizedMarketplaceItem;
  score:     number;           // 0–100, rounded
  breakdown: ScoreBreakdown;
};

// ── Weight allocation (must sum to ~100 before penalties) ────────────────────
// Weights are tuned for thrift/vintage items — not electronics.
// For named products (isNamedProduct=true) brand weight dominates;
// for unbranded vintage items subject/material/style dominate.

const WEIGHTS = {
  // Identity signals
  objectType:       20,
  subject:          25,    // highest weight — most specific identifier
  material:         15,
  styleDescriptor:  10,
  brand:            15,
  era:               5,
  // Quality signals
  titleQuality:      5,
  recency:          10,
  hasImage:          3,
  // Penalties (applied as reductions)
  lotPenalty:       -60,   // hard: kills the comp
  partsPenalty:     -50,   // hard: kills the comp
  reproPenalty:     -40,   // hard: kills the comp
  incompletePenalty: -20,  // soft: significant reduction
  materialMismatch:  -25,  // soft: significant reduction
};

const MAX_DAYS_FOR_RECENCY = 90;

export function scoreComp(
  item:       NormalizedMarketplaceItem,
  attributes: ItemAttributes,
  isNamedProduct: boolean,
): ScoredComp {
  const styleDescriptor = extractStyleDescriptor(attributes.distinctiveFeatures);
  const signals = parseListingSignals(
    item.title,
    item.imageUrl,
    item.soldDate,
    item.daysAgo,
    attributes.material,
    attributes.subject,
    attributes.objectType,
    attributes.brand,
    styleDescriptor,
    attributes.era,
  );

  // ── Positive signals ───────────────────────────────────────────────────────

  // Object type: score based on mention. For named products, this matters less
  // because the brand/model uniquely identifies it.
  const objectTypeScore = signals.mentionsObjectType
    ? (isNamedProduct ? WEIGHTS.objectType * 0.7 : WEIGHTS.objectType)
    : 0;

  // Subject: only meaningful for portrait/figural items.
  // If item has a subject, not mentioning it is a strong negative signal.
  let subjectScore = 0;
  if (attributes.subject) {
    subjectScore = signals.mentionsSubject ? WEIGHTS.subject : 0;
  } else {
    // No subject expected — this signal doesn't apply, redistribute weight
    // by treating it as neutral (no contribution)
    subjectScore = 0;
  }

  // Material: straightforward mention check
  const materialScore = attributes.material && signals.mentionsMaterial
    ? WEIGHTS.material
    : 0;

  // Style descriptor (lily, gooseneck, hobnail etc.)
  const styleScore = styleDescriptor && signals.mentionsStyleDescriptor
    ? WEIGHTS.styleDescriptor
    : 0;

  // Brand: full weight for named products, partial for vintage with known maker
  const brandScore = attributes.brand && signals.mentionsBrand
    ? (isNamedProduct ? WEIGHTS.brand : WEIGHTS.brand * 0.6)
    : 0;

  // Era: small bonus — sellers often omit era even on correct items
  const eraScore = attributes.era && signals.mentionsEra
    ? WEIGHTS.era
    : 0;

  // Title quality: longer, more specific titles correlate with better data
  // < 20 chars: junk listing; 20–40: sparse; 40+: good
  const titleQuality =
    signals.titleLength >= 40 ? WEIGHTS.titleQuality :
    signals.titleLength >= 20 ? WEIGHTS.titleQuality * 0.5 : 0;

  // Recency: linear decay from 0 days (full) to 90 days (zero)
  // Items older than 90 days get 0 recency points but aren't excluded
  const recencyScore = signals.daysAgo === 0
    ? WEIGHTS.recency                                                    // sold date unknown — don't penalise
    : Math.max(0, WEIGHTS.recency * (1 - signals.daysAgo / MAX_DAYS_FOR_RECENCY));

  const imageScore = signals.hasImage ? WEIGHTS.hasImage : 0;

  // ── Penalties ──────────────────────────────────────────────────────────────
  let penalties = 0;

  // Hard penalties — any one of these makes the comp unreliable for pricing
  if (signals.isLot)      penalties += WEIGHTS.lotPenalty;
  if (signals.isPartsOnly) penalties += WEIGHTS.partsPenalty;
  if (signals.isRepro)    penalties += WEIGHTS.reproPenalty;

  // Soft penalties — reduce score but don't necessarily exclude
  if (signals.isIncomplete)    penalties += WEIGHTS.incompletePenalty;
  if (signals.isMaterialMismatch) penalties += WEIGHTS.materialMismatch;

  // ── Compute raw score ──────────────────────────────────────────────────────
  // For items without a subject, we need to renormalise the weights.
  // When subject doesn't apply, redistribute its 25pts proportionally
  // to the remaining signals so the max is still ~100.
  const hasSubject = !!attributes.subject;
  const rawMax     = hasSubject
    ? (WEIGHTS.objectType + WEIGHTS.subject + WEIGHTS.material + WEIGHTS.styleDescriptor +
       WEIGHTS.brand + WEIGHTS.era + WEIGHTS.titleQuality + WEIGHTS.recency + WEIGHTS.hasImage)
    : (WEIGHTS.objectType + WEIGHTS.material + WEIGHTS.styleDescriptor +
       WEIGHTS.brand + WEIGHTS.era + WEIGHTS.titleQuality + WEIGHTS.recency + WEIGHTS.hasImage);

  const positiveRaw =
    objectTypeScore + subjectScore + materialScore + styleScore +
    brandScore + eraScore + titleQuality + recencyScore + imageScore;

  // Normalise to 0–100 scale
  const normalised = rawMax > 0 ? (positiveRaw / rawMax) * 100 : 0;

  // Apply penalties (can drive score negative — clamp to 0)
  const final = Math.max(0, Math.min(100, Math.round(normalised + penalties)));

  const breakdown: ScoreBreakdown = {
    objectType:      Math.round(objectTypeScore),
    subject:         Math.round(subjectScore),
    material:        Math.round(materialScore),
    styleDescriptor: Math.round(styleScore),
    brand:           Math.round(brandScore),
    era:             Math.round(eraScore),
    titleQuality:    Math.round(titleQuality),
    recency:         Math.round(recencyScore),
    hasImage:        Math.round(imageScore),
    penalties:       Math.round(penalties),
  };

  return { item, score: final, breakdown };
}

// ── Batch scoring and ranking ─────────────────────────────────────────────────

export type RankedComps = {
  scored:             ScoredComp[];     // all comps, sorted score desc
  highConfidence:     ScoredComp[];     // score >= 70
  usable:             ScoredComp[];     // score >= 45
  excluded:           ScoredComp[];     // score < 45
};

export function rankComps(
  items:      NormalizedMarketplaceItem[],
  attributes: ItemAttributes,
  isNamedProduct: boolean,
): RankedComps {
  const scored = items
    .map(item => scoreComp(item, attributes, isNamedProduct))
    .sort((a, b) => b.score - a.score);

  return {
    scored,
    highConfidence: scored.filter(c => c.score >= 70),
    usable:         scored.filter(c => c.score >= 45),
    excluded:       scored.filter(c => c.score < 45),
  };
}

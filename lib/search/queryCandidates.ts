// lib/search/queryCandidates.ts
//
// Generates 3–5 query candidates from extracted ItemAttributes.
// Each candidate has a distinct strategy so parallel retrieval covers
// different slices of eBay's result space, maximising recall before
// scoring and reranking narrow results down.
//
// Design principles:
//   - P1 (primary) always matches the existing queryBuilder waterfall — no regression
//   - P2–P4 are intentionally broader / alternative cuts
//   - Never generate a candidate that is a superset of a higher-ranked one
//     (that would just duplicate results with worse precision)
//   - Max 5 candidates — beyond that, SerpAPI cost and latency outweigh benefit

import { ItemAttributes } from "@/types";
import { buildSearchQuery, extractStyleDescriptor } from "@/lib/queryBuilder";
import { normalizeQuery } from "@/utils/normalizeQuery";

export type QueryCandidate = {
  query:             string;
  strategy:          string;
  rank:              number;             // 1 = highest priority, run first
  expectedPrecision: "high" | "medium" | "low";
};

function clean(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .map(p => p.trim().toLowerCase())
    .join(" ");
}

// ── Known materials that are query-worthy ────────────────────────────────────
const QUERY_WORTHY_MATERIALS = new Set([
  "brass", "bronze", "copper", "silver", "gold", "cast iron", "wrought iron",
  "ceramic", "porcelain", "stoneware", "glass", "crystal",
  "wood", "mahogany", "walnut", "oak",
  "sterling", "pewter", "enamel", "bakelite",
]);

function goodMat(material: string | null | undefined): string | null {
  if (!material) return null;
  return QUERY_WORTHY_MATERIALS.has(material.toLowerCase().trim()) ? material.toLowerCase().trim() : null;
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function generateQueryCandidates(
  attributes:     ItemAttributes,
  isNamedProduct: boolean,
): QueryCandidate[] {
  const candidates: QueryCandidate[] = [];

  const {
    brand, model, objectType, material, era, subject,
    primaryColor, distinctiveFeatures, category,
  } = attributes;

  const mat             = goodMat(material);
  const styleDescriptor = extractStyleDescriptor(distinctiveFeatures);
  const subj            = subject?.toLowerCase().trim() || null;

  // ── Candidate 1: Primary — mirrors existing queryBuilder output ────────────
  // This is always included and preserves backward compatibility.
  const primaryQuery = buildSearchQuery(attributes, isNamedProduct);
  candidates.push({
    query:             primaryQuery,
    strategy:          "primary-waterfall",
    rank:              1,
    expectedPrecision: isNamedProduct || subj || (mat && styleDescriptor) ? "high" : "medium",
  });

  // ── Candidate 2: Strategy varies by item type ──────────────────────────────

  if (isNamedProduct && brand && model) {
    // Named product → try model-only (catches listings that omit brand)
    const modelOnly = normalizeQuery(clean(model, primaryColor));
    if (modelOnly && modelOnly !== primaryQuery) {
      candidates.push({
        query:             modelOnly,
        strategy:          "model-only",
        rank:              2,
        expectedPrecision: "medium",
      });
    }
    // Named product → try brand + category (broader)
    if (category) {
      const brandCat = normalizeQuery(clean(brand, category));
      if (brandCat && brandCat !== primaryQuery) {
        candidates.push({
          query:             brandCat,
          strategy:          "brand-category-broad",
          rank:              3,
          expectedPrecision: "low",
        });
      }
    }

  } else if (subj && objectType) {
    // Portrait/figural item → try subject without material (catches all materials)
    const subjectBroad = normalizeQuery(clean(subj, objectType));
    if (subjectBroad && subjectBroad !== primaryQuery) {
      candidates.push({
        query:             subjectBroad,
        strategy:          "subject-broad",
        rank:              2,
        expectedPrecision: "medium",
      });
    }
    // Portrait/figural → try subject alone (catches coins, plates, misc)
    const subjectOnly = normalizeQuery(subj);
    if (subjectOnly && subjectOnly !== primaryQuery && subjectOnly !== subjectBroad) {
      candidates.push({
        query:             subjectOnly,
        strategy:          "subject-only",
        rank:              3,
        expectedPrecision: "low",
      });
    }

  } else if (mat && styleDescriptor && objectType) {
    // Material + style item (e.g. brass lily lamp):
    // Try style + type without material (catches ceramic/wood variants for price range)
    const styleType = normalizeQuery(clean(styleDescriptor, objectType));
    if (styleType && styleType !== primaryQuery) {
      candidates.push({
        query:             styleType,
        strategy:          "style-type-no-material",
        rank:              2,
        expectedPrecision: "medium",
      });
    }
    // Try material + type without style (broader catch)
    const matType = normalizeQuery(clean(mat, objectType));
    if (matType && matType !== primaryQuery && matType !== styleType) {
      candidates.push({
        query:             matType,
        strategy:          "material-type-broad",
        rank:              3,
        expectedPrecision: "low",
      });
    }

  } else if (mat && objectType) {
    // Material + type only → try with era if present
    if (era) {
      const eraMatType = normalizeQuery(clean(era, mat, objectType));
      if (eraMatType && eraMatType !== primaryQuery) {
        candidates.push({
          query:             eraMatType,
          strategy:          "era-material-type",
          rank:              2,
          expectedPrecision: "medium",
        });
      }
    }
    // Try objectType alone — very broad, last resort for price floor/ceiling
    if (objectType) {
      const typeOnly = normalizeQuery(objectType);
      if (typeOnly && typeOnly !== primaryQuery) {
        candidates.push({
          query:             typeOnly,
          strategy:          "type-only-broad",
          rank:              4,
          expectedPrecision: "low",
        });
      }
    }
  }

  // ── Dedupe — remove exact duplicates ──────────────────────────────────────
  const seen = new Set<string>();
  const deduped = candidates.filter(c => {
    if (!c.query || seen.has(c.query)) return false;
    seen.add(c.query);
    return true;
  });

  // ── Cap at 4 — rank 1 (high precision) always runs; ranks 2–4 run in parallel
  return deduped.slice(0, 4);
}

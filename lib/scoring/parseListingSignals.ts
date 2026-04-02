// lib/scoring/parseListingSignals.ts
//
// Extracts structured signals from a raw eBay listing title.
// This runs on every comp before scoring — it's the bridge between
// a freeform seller title and a structured comparison.
//
// Design: fast, regex-free where possible, no external calls.
// Everything here runs in-memory during the scoring pass.

export type ListingSignals = {
  // Identity signals
  mentionsMaterial:        boolean;
  mentionsSubject:         boolean;
  mentionsObjectType:      boolean;
  mentionsBrand:           boolean;
  mentionsStyleDescriptor: boolean;
  mentionsEra:             boolean;

  // Penalty signals
  isLot:               boolean;
  isMaterialMismatch:  boolean;
  isPartsOnly:         boolean;
  isRepro:             boolean;
  isIncomplete:        boolean;
  isWrongObjectType:   boolean;

  // Quality signals
  titleLength:    number;     // chars — very short titles are low-quality listings
  hasImage:       boolean;
  hasSoldDate:    boolean;
  daysAgo:        number;
};

// ── Penalty keyword sets ─────────────────────────────────────────────────────

const LOT_TERMS = [
  "lot", "set of", "pair of", "collection", "bundle", "group of",
  "qty", "quantity", "x2", "x3", "x4", "x5", "2pc", "3pc", "4pc",
];

const PARTS_TERMS = [
  "parts only", "for parts", "not working", "as-is", "as is",
  "for repair", "broken", "damaged", "cracked", "missing",
];

const REPRO_TERMS = [
  "reproduction", "repro", "replica", "reprint", "copy",
  "fake", "fantasy", "modern", "new made",
];

const INCOMPLETE_TERMS = [
  "no lid", "no base", "no shade", "no stopper", "missing lid",
  "incomplete", "without", "w/o",
];

// ── Known materials (for mismatch detection) ─────────────────────────────────

const KNOWN_MATERIALS = [
  "brass", "bronze", "copper", "cast iron", "wrought iron",
  "tin", "zinc", "pewter", "sterling", "silver plate",
  "ceramic", "porcelain", "stoneware", "terracotta",
  "glass", "crystal",
  "wood", "wooden", "mahogany", "walnut", "oak",
  "plastic", "resin", "bakelite",
  "leather", "fabric",
];

// ── Parse ────────────────────────────────────────────────────────────────────

export function parseListingSignals(
  title:       string,
  imageUrl:    string | undefined,
  soldDate:    string | null | undefined,
  daysAgo:     number,
  // Extracted item attributes for comparison
  targetMaterial?:        string | null,
  targetSubject?:         string | null,
  targetObjectType?:      string | null,
  targetBrand?:           string | null,
  targetStyleDescriptor?: string | null,
  targetEra?:             string | null,
): ListingSignals {
  const lower = title.toLowerCase();

  // ── Identity signals ──────────────────────────────────────────────────────
  const mentionsMaterial = targetMaterial
    ? lower.includes(targetMaterial.toLowerCase())
    : false;

  const mentionsSubject = targetSubject
    ? lower.includes(targetSubject.toLowerCase())
    : false;

  const mentionsObjectType = targetObjectType
    ? lower.includes(targetObjectType.toLowerCase())
    : false;

  const mentionsBrand = targetBrand
    ? lower.includes(targetBrand.toLowerCase())
    : false;

  const mentionsStyleDescriptor = targetStyleDescriptor
    ? lower.includes(targetStyleDescriptor.toLowerCase())
    : false;

  const mentionsEra = targetEra
    ? lower.includes(targetEra.toLowerCase())
    : false;

  // ── Penalty signals ───────────────────────────────────────────────────────
  const isLot = LOT_TERMS.some(t => lower.includes(t));

  // Material mismatch: title mentions a DIFFERENT material and NOT ours
  let isMaterialMismatch = false;
  if (targetMaterial) {
    const target = targetMaterial.toLowerCase();
    if (!lower.includes(target)) {
      isMaterialMismatch = KNOWN_MATERIALS.some(m => m !== target && lower.includes(m));
    }
  }

  const isPartsOnly = PARTS_TERMS.some(t => lower.includes(t));
  const isRepro     = REPRO_TERMS.some(t => lower.includes(t));
  const isIncomplete = INCOMPLETE_TERMS.some(t => lower.includes(t));

  // Wrong object type: title contains a clearly different object type
  // Only fires when we have high confidence in both our type and the conflict
  const isWrongObjectType = false; // reserved for future — complex to implement safely

  // ── Quality signals ───────────────────────────────────────────────────────
  const titleLength = title.length;
  const hasImage    = !!(imageUrl && imageUrl.length > 0);
  const hasSoldDate = !!(soldDate && soldDate.length > 0);

  return {
    mentionsMaterial,
    mentionsSubject,
    mentionsObjectType,
    mentionsBrand,
    mentionsStyleDescriptor,
    mentionsEra,
    isLot,
    isMaterialMismatch,
    isPartsOnly,
    isRepro,
    isIncomplete,
    isWrongObjectType,
    titleLength,
    hasImage,
    hasSoldDate,
    daysAgo,
  };
}

// utils/normalizeQuery.ts
// Normalizes a search query for eBay comp search.
// Strategy: preserve specific nouns and identifiers, only strip true filler words.

const FILLER_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for",
  "with", "by", "from", "is", "it", "as", "be", "this", "that", "was",
  "are", "were", "been", "has", "have", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "very", "also",
  "just", "some", "any", "all", "both", "each", "few", "more", "most",
  "other", "such", "than", "too", "very", "s", "t", "can", "not",
  "no", "so", "up", "out", "if", "about", "into", "then", "there",
  "what", "which", "who", "when", "how", "its", "my", "your",
]);

// Words that should NEVER be stripped — meaningful for eBay search
const PRESERVE_ALWAYS = new Set([
  "single", "pair", "set", "lot", "vintage", "antique", "rare", "original",
  "signed", "numbered", "limited", "edition", "early", "late", "mid",
  "century", "art", "deco", "nouveau", "glass", "brass", "silver", "gold",
  "iron", "cast", "carved", "hand", "painted", "glazed", "porcelain",
  "ceramic", "crystal", "copper", "bronze", "sterling", "pewter",
  "bank", "bookend", "figurine", "statue", "bust", "vase", "pitcher",
  "decanter", "goblet", "plate", "bowl", "tray", "box", "tin", "jar",
  "iridescent", "carnival", "depression", "milk", "slag", "opalescent",
]);

export function normalizeQuery(raw: string): string {
  if (!raw?.trim()) return "";

  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")   // remove punctuation
    .replace(/\s+/g, " ")       // collapse spaces
    .trim()
    .split(" ")
    .filter(word => {
      if (!word) return false;
      if (PRESERVE_ALWAYS.has(word)) return true;    // always keep
      if (FILLER_WORDS.has(word)) return false;       // strip filler
      return true;                                     // keep everything else
    })
    .slice(0, 8)                // max 8 words for eBay
    .join(" ");
}

const FILLER_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for",
  "with", "by", "from", "up", "about", "into", "through", "very",
  "vintage", "antique", "nice", "beautiful", "lovely", "great", "good",
  "old", "used", "original", "authentic", "genuine", "real", "true",
  "rare", "unique", "special", "amazing", "excellent", "perfect",
  "stunning", "gorgeous", "wonderful", "incredible", "lot", "set",
  "item", "thing", "piece", "stuff", "found", "thrift", "estate",
]);

export function normalizeQuery(raw: string, maxWords = 5): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !FILLER_WORDS.has(w))
    .slice(0, maxWords)
    .join(" ")
    .trim();
}

export function queriesMatch(a: string, b: string): boolean {
  return normalizeQuery(a) === normalizeQuery(b);
}

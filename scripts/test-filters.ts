// scripts/test-filters.ts
//
// Unit-tests the lot filter, color filter, and price scoring logic
// WITHOUT hitting SerpAPI. Fast — runs in milliseconds.
//
// Usage:
//   npx tsx scripts/test-filters.ts

// ── Inline the logic under test (keep in sync with serpApiClient.ts) ─────────

const LOT_PATTERN =
  /\b(lot|set|pair|collection|bundle|group)\s+(of\s+)?\d+|\d+\s*(x|pc|pcs|piece|pieces)\b|\b\d{1,2}\s*-?\s*(goblets?|glasses?|cups?|plates?|bowls?|figurines?|statues?)\b/i;

const KNOWN_COLORS = [
  "black", "white", "silver", "gold", "red", "blue", "green", "pink",
  "purple", "orange", "yellow", "tan", "brown", "gray", "grey", "copper",
  "bronze", "rose gold", "space gray", "midnight", "starlight",
];

const LENS_BUNDLE_KEYWORDS = [
  "with lens", "w/lens", "w/ lens", "+ lens",
  "18-55mm", "15-45mm", "16-50mm", "18-135mm",
  "zoom lens", "with zoom", "and lens", "lens bundle",
  "twin lens", "double lens", "lens included",
];

const CAMERA_OBJECT_TYPES = ["camera", "mirrorless", "dslr", "slr", "digital camera"];

function isLot(title: string): boolean {
  return LOT_PATTERN.test(title);
}

function hasColorConflict(title: string, targetColor: string): boolean {
  const lower  = title.toLowerCase();
  const target = targetColor.toLowerCase().trim();
  if (lower.includes(target)) return false;
  const containsAnyColor = KNOWN_COLORS.some(c => lower.includes(c));
  if (!containsAnyColor) return false;
  return true;
}

function hasLensBundleConflict(title: string, objectType: string | null): boolean {
  if (!objectType) return false;
  const isCamera = CAMERA_OBJECT_TYPES.some(t => objectType.toLowerCase().includes(t));
  if (!isCamera) return false;
  const lower = title.toLowerCase();
  return LENS_BUNDLE_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Test runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function expect(description: string, actual: boolean, expected: boolean) {
  if (actual === expected) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.log(`  ❌ ${description}`);
    console.log(`     Expected: ${expected}, Got: ${actual}`);
    failed++;
  }
}

// ── Lot filter tests ──────────────────────────────────────────────────────────
console.log("\n🔍 Lot Filter\n");

// Should be filtered (lots)
expect("lot of 6 goblets",            isLot("Vintage Crystal Goblets Lot of 6"), true);
expect("set of 4 plates",             isLot("Blue Willow Plates Set of 4"), true);
expect("collection bundle",           isLot("Pyrex Bowl Collection Bundle of 3"), true);
expect("4 pcs",                       isLot("Brass Candlesticks 4 pcs"), true);
expect("2x figurines",                isLot("Porcelain Figurines 2x"), true);
expect("pair of 2 bookends",          isLot("Brass Owl Bookends Pair of 2"), true);
expect("4 goblets explicit",          isLot("4 Vintage Crystal Goblets Iridescent"), true);
expect("group of 3",                  isLot("Group of 3 Depression Glass Bowls"), true);

// Should NOT be filtered (singles)
expect("single goblet no number",     isLot("Vintage Crystal Goblet Iridescent"), false);
expect("vase no lot language",        isLot("Mid Century Ceramic Vase Blue"), false);
expect("camera body",                 isLot("Canon EOS R50 Mirrorless Camera Body"), false);
expect("set in brand name (Pyrex)",   isLot("Pyrex Cinderella Bowl 1 QT Clear"), false);
expect("numbered edition not lot",    isLot("Hummel Figurine #47 Boy with Toothache"), false);
expect("title with year",             isLot("1960s Brass Bookend Vintage"), false);

// ── Color filter tests ────────────────────────────────────────────────────────
console.log("\n🎨 Color Filter\n");

// Should be filtered (wrong color)
expect("white item, want black",      hasColorConflict("Canon EOS R50 White Camera", "black"), true);
expect("red mixer, want blue",        hasColorConflict("KitchenAid Stand Mixer Red", "blue"), true);
expect("silver tray, want gold",      hasColorConflict("Silver Plate Serving Tray", "gold"), true);

// Should NOT be filtered (correct color or no color in title)
expect("black camera, want black",    hasColorConflict("Canon EOS R50 Black Camera", "black"), false);
expect("no color in title",           hasColorConflict("Canon EOS R50 Mirrorless Camera", "black"), false);
expect("ambiguous title",             hasColorConflict("Vintage Brass Bookend Decorative", "brass"), false);
expect("color match partial",         hasColorConflict("Sony A7 IV Camera Black Body", "black"), false);

// ── Lens bundle filter tests ──────────────────────────────────────────────────
console.log("\n📷 Lens Bundle Filter\n");

// Should be filtered (bundle when we want body)
expect("with lens in title",          hasLensBundleConflict("Canon EOS R50 White With Lens", "camera"), true);
expect("18-55mm kit",                 hasLensBundleConflict("Canon EOS R50 + 18-55mm Kit", "camera"), true);
expect("lens bundle label",           hasLensBundleConflict("Sony A6000 Lens Bundle", "mirrorless"), true);
expect("twin lens",                   hasLensBundleConflict("Canon Rebel T8i Twin Lens Kit", "dslr"), true);

// Should NOT be filtered (body only, or non-camera item)
expect("body only camera",            hasLensBundleConflict("Canon EOS R50 Camera Body Only", "camera"), false);
expect("vase with lens not camera",   hasLensBundleConflict("Art Glass Vase With Lens Effect", "vase"), false);
expect("camera no lens mention",      hasLensBundleConflict("Sony A7 IV Full Frame Camera", "camera"), false);
expect("null objectType",             hasLensBundleConflict("Canon EOS R50 with lens", null), false);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
console.log(`\n  Results: ✅ ${passed} passed  ❌ ${failed} failed\n`);
if (failed > 0) process.exit(1);

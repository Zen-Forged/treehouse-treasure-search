// scripts/test-query-builder.ts
// Unit tests for buildSearchQuery and extractStyleDescriptor.
// No API calls — runs in milliseconds.
//
// Usage: npx tsx scripts/test-query-builder.ts

import { buildSearchQuery, extractStyleDescriptor } from "../lib/queryBuilder";
import type { ItemAttributes } from "../types";

let passed = 0;
let failed = 0;

function base(): ItemAttributes {
  return { brand: null, material: null, era: null, origin: null, category: null };
}

function expect(desc: string, actual: string, expected: string) {
  if (actual === expected) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.log(`  ❌ ${desc}`);
    console.log(`     Expected: "${expected}"`);
    console.log(`     Got:      "${actual}"`);
    failed++;
  }
}

function expectDescriptor(desc: string, features: string[] | undefined, expected: string | null) {
  const actual = extractStyleDescriptor(features);
  if (actual === expected) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.log(`  ❌ ${desc}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Got:      ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── Style descriptor extraction ───────────────────────────────────────────────
console.log("\n🔍 Style Descriptor Extraction\n");

expectDescriptor("lily pad phrase (multi-word wins)", ["lily pad base", "frosted glass shade"], "lily pad");
expectDescriptor("gooseneck single word", ["flexible gooseneck arm", "brass body"], "gooseneck");
expectDescriptor("owl figural", ["owl figural stem", "iridescent finish"], "owl");
expectDescriptor("cinderella bowl", ["cinderella shape with tab handles", "clear glass"], "cinderella");
expectDescriptor("hobnail texture", ["hobnail texture pattern all over"], "hobnail");
expectDescriptor("tulip shade", ["tulip shaped shade", "brass base"], "tulip");
expectDescriptor("no match returns null", ["frosted glass", "adjustable height", "metal base"], null);
expectDescriptor("empty returns null", [], null);
expectDescriptor("undefined returns null", undefined, null);
expectDescriptor("carnival glass", ["carnival glass iridescent finish"], "carnival");

// ── Query builder — named products (P1) ───────────────────────────────────────
console.log("\n🔨 Query Builder — Named Products\n");

expect(
  "P1: brand + model",
  buildSearchQuery({ ...base(), brand: "canon", model: "eos r50", objectType: "camera" }, true),
  "canon eos r50"
);
expect(
  "P1: brand + model + true color",
  buildSearchQuery({ ...base(), brand: "canon", model: "eos r50", objectType: "camera", primaryColor: "white" }, true),
  "canon eos r50 white"
);
expect(
  "P1: material-color NOT appended on named product",
  buildSearchQuery({ ...base(), brand: "canon", model: "eos r50", objectType: "camera", primaryColor: "brass" }, true),
  "canon eos r50"
);

// ── Brand + type (P2) ─────────────────────────────────────────────────────────
console.log("\n🔨 Query Builder — Brand + Type\n");

expect(
  "P2: brand + type",
  buildSearchQuery({ ...base(), brand: "pyrex", objectType: "bowl" }, false),
  "pyrex bowl"
);
expect(
  "P2: brand + style + type (Pyrex Cinderella)",
  buildSearchQuery({ ...base(), brand: "pyrex", objectType: "bowl", distinctiveFeatures: ["cinderella shape"] }, false),
  "pyrex cinderella bowl"
);
expect(
  "P2: brand + type + true color",
  buildSearchQuery({ ...base(), brand: "wedgwood", objectType: "vase", primaryColor: "blue" }, false),
  "wedgwood vase blue"
);

// ── Material + style + type (P4) — the brass lily lamp case ───────────────────
console.log("\n🔨 Query Builder — Material + Style + Type\n");

expect(
  "P4: brass lily lamp (the flagship case)",
  buildSearchQuery({ ...base(), material: "brass", objectType: "lamp", distinctiveFeatures: ["lily pad base", "frosted glass shade"] }, false),
  "brass lily pad lamp"
);
expect(
  "P4: brass gooseneck lamp",
  buildSearchQuery({ ...base(), material: "brass", objectType: "lamp", distinctiveFeatures: ["gooseneck arm", "adjustable"] }, false),
  "brass gooseneck lamp"
);
expect(
  "P4: carnival glass owl compote",
  buildSearchQuery({ ...base(), material: "glass", objectType: "compote", distinctiveFeatures: ["owl figural stem", "carnival glass iridescent"] }, false),
  "glass owl compote"
);
expect(
  "P4: material + type, no style descriptor",
  buildSearchQuery({ ...base(), material: "brass", objectType: "bookend" }, false),
  "brass bookend"
);
expect(
  "P4: brass NOT appended as color (it's a material)",
  buildSearchQuery({ ...base(), material: "brass", objectType: "lamp", primaryColor: "brass" }, false),
  "brass lamp"
);
expect(
  "P4: true color IS appended after type",
  buildSearchQuery({ ...base(), material: "ceramic", objectType: "vase", primaryColor: "blue" }, false),
  "ceramic vase blue"
);
expect(
  "P4: amber appended as true color (not in MATERIAL_COLORS set)",
  buildSearchQuery({ ...base(), material: "glass", objectType: "decanter", primaryColor: "amber" }, false),
  "glass decanter amber"
);

// ── Era handling ──────────────────────────────────────────────────────────────
console.log("\n🔨 Query Builder — Era Handling\n");

expect(
  "Multi-decade era excluded, falls to material+type",
  buildSearchQuery({ ...base(), material: "brass", objectType: "lamp", era: "1980s-1990s" }, false),
  "brass lamp"
);
expect(
  "Material wins over era at P4 — era not included when material present",
  buildSearchQuery({ ...base(), material: "ceramic", objectType: "vase", era: "1960s" }, false),
  "ceramic vase"
);
expect(
  "Material wins over era at P4 — brass inkwell",
  buildSearchQuery({ ...base(), material: "brass", objectType: "inkwell", era: "victorian" }, false),
  "brass inkwell"
);
expect(
  "Era only path (no material) — P6",
  buildSearchQuery({ ...base(), objectType: "inkwell", era: "victorian" }, false),
  "victorian inkwell"
);

// ── Fallback ──────────────────────────────────────────────────────────────────
console.log("\n🔨 Query Builder — Fallbacks\n");

expect(
  "P9: no attributes → fallback",
  buildSearchQuery({ ...base() }, false),
  "vintage item"
);
expect(
  "P8: category only",
  buildSearchQuery({ ...base(), category: "collectibles" }, false),
  "collectibles"
);
expect(
  "P7: object type only",
  buildSearchQuery({ ...base(), objectType: "bookend" }, false),
  "bookend"
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(55));
console.log(`\n  Results: ✅ ${passed} passed  ❌ ${failed} failed\n`);
if (failed > 0) process.exit(1);

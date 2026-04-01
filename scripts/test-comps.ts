// scripts/test-comps.ts
//
// Stress-test the comp analysis pipeline against a batch of known queries.
// Runs against your LOCAL dev server (npm run dev must be running).
//
// Usage:
//   npx tsx scripts/test-comps.ts
//   npx tsx scripts/test-comps.ts --url https://treehouse-treasure-search.vercel.app
//
// Output: scripts/test-results-[timestamp].json
//
// Each result records:
//   - soldComps count + price range
//   - activeComps count
//   - summary fields
//   - whether the query hit mock or live data
//   - any errors
//   - a PASS/WARN/FAIL grade

import fs from "fs";

const BASE_URL = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "http://localhost:3000";

// ── Test cases ────────────────────────────────────────────────────────────────
// Format: { query, color?, objectType?, expectedMinSold, notes }
// expectedMinSold = minimum sold comps you'd consider a passing result
// Set to 0 for items where zero results is acceptable (very niche)
const TEST_CASES = [
  // ── High-confidence branded items (should always have comps) ──
  { query: "canon eos r50 camera",        color: "black",  objectType: "camera",   expectedMinSold: 5, notes: "Popular mirrorless — should have many sold comps" },
  { query: "kitchenaid stand mixer",      color: "red",    objectType: "mixer",    expectedMinSold: 5, notes: "Common appliance" },
  { query: "pyrex cinderella bowl",       color: null,     objectType: "bowl",     expectedMinSold: 4, notes: "Classic vintage collectible" },
  { query: "nike air jordan 1",           color: "white",  objectType: "sneaker",  expectedMinSold: 5, notes: "High-demand footwear" },
  { query: "le creuset dutch oven",       color: "orange", objectType: "dutch oven", expectedMinSold: 4, notes: "Premium cookware" },

  // ── Mid-tier vintage / thrift items ──
  { query: "brass owl bookend",           color: "brass",  objectType: "bookend",  expectedMinSold: 2, notes: "Common thrift find" },
  { query: "mid century ceramic vase",    color: null,     objectType: "vase",     expectedMinSold: 3, notes: "Should have comps — broad category" },
  { query: "cast iron bank figurine",     color: null,     objectType: "bank",     expectedMinSold: 2, notes: "Vintage collectible" },
  { query: "amber glass decanter",        color: "amber",  objectType: "decanter", expectedMinSold: 2, notes: "Color filter should narrow correctly" },
  { query: "carnival glass iridescent goblet", color: null, objectType: "goblet", expectedMinSold: 2, notes: "Tests lot filter (common as sets)" },
  { query: "silver plate serving tray",   color: "silver", objectType: "tray",    expectedMinSold: 3, notes: "Common estate sale item" },
  { query: "porcelain figurine vintage",  color: null,     objectType: "figurine", expectedMinSold: 3, notes: "Broad — should return results" },

  // ── Niche / hard items (low expectations) ──
  { query: "bakelite handled flatware",   color: null,     objectType: "flatware", expectedMinSold: 1, notes: "Niche — may return few results" },
  { query: "art deco brass inkwell",      color: "brass",  objectType: "inkwell",  expectedMinSold: 1, notes: "Very niche — 0-2 results is OK" },
  { query: "enamel trinket box hand painted", color: null, objectType: "box",     expectedMinSold: 1, notes: "Niche collectible" },

  // ── Edge cases / potential problem queries ──
  { query: "vintage item",               color: null,     objectType: null,       expectedMinSold: 0, notes: "FALLBACK QUERY — should never get here in production" },
  { query: "glass vase blue",            color: "blue",   objectType: "vase",     expectedMinSold: 2, notes: "Generic — color filter should help" },
  { query: "ceramic bowl white",         color: "white",  objectType: "bowl",     expectedMinSold: 3, notes: "Very generic — tests that results are relevant" },
  { query: "wood carved folk art",       color: null,     objectType: "figurine",  expectedMinSold: 1, notes: "Handmade items — inconsistent pricing expected" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Comp {
  title: string;
  price: number;
  condition: string;
  daysAgo: number;
  soldDate?: string;
  imageUrl?: string;
  url?: string;
}

interface Summary {
  recommendedPrice:  number;
  priceRangeLow:     number;
  priceRangeHigh:    number;
  marketVelocity:    string;
  demandLevel:       string;
  quickTake:         string;
  confidence:        string;
  avgDaysToSell:     number;
  competitionCount:  number;
  competitionLevel:  string;
}

interface CompResult {
  source:          string;
  normalizedQuery: string;
  soldComps:       Comp[];
  activeComps:     Comp[];
  summary:         Summary | null;
  error?:          string;
}

interface TestResult {
  query:            string;
  color:            string | null;
  objectType:       string | null;
  notes:            string;
  expectedMinSold:  number;
  grade:            "PASS" | "WARN" | "FAIL" | "ERROR";
  source:           string;
  soldCount:        number;
  activeCount:      number;
  priceRangeLow:    number | null;
  priceRangeHigh:   number | null;
  recommendedPrice: number | null;
  avgDaysToSell:    number | null;
  competitionLevel: string | null;
  confidence:       string | null;
  quickTake:        string | null;
  topSoldTitles:    string[];
  errorMessage:     string | null;
  durationMs:       number;
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function runTestCase(tc: typeof TEST_CASES[0]): Promise<TestResult> {
  const start = Date.now();
  const params = new URLSearchParams({ q: tc.query });
  if (tc.color)      params.set("color",      tc.color);
  if (tc.objectType) params.set("objectType", tc.objectType);

  const url = `${BASE_URL}/api/sold-comps?${params.toString()}`;

  try {
    const res  = await fetch(url);
    const data = await res.json() as CompResult;
    const dur  = Date.now() - start;

    if (data.error) {
      return makeErrorResult(tc, data.error, dur);
    }

    const soldCount   = data.soldComps?.length ?? 0;
    const activeCount = data.activeComps?.length ?? 0;
    const summary     = data.summary;

    // ── Grade ──────────────────────────────────────────────────────────────
    let grade: TestResult["grade"];
    if (soldCount >= tc.expectedMinSold) {
      grade = "PASS";
    } else if (soldCount > 0 || tc.expectedMinSold === 0) {
      grade = "WARN";
    } else {
      grade = "FAIL";
    }

    // Warn if recommended price seems unreasonable
    if (summary?.recommendedPrice && summary.recommendedPrice > 10000) {
      grade = "WARN";
    }

    // Warn if spread is absurdly wide (bad lot filtering?)
    if (summary && summary.priceRangeHigh > summary.recommendedPrice * 5) {
      grade = "WARN";
    }

    const topSoldTitles = (data.soldComps ?? [])
      .slice(0, 3)
      .map(c => `$${c.price.toFixed(2)} — ${c.title.slice(0, 60)}`);

    return {
      query:            tc.query,
      color:            tc.color,
      objectType:       tc.objectType,
      notes:            tc.notes,
      expectedMinSold:  tc.expectedMinSold,
      grade,
      source:           data.source,
      soldCount,
      activeCount,
      priceRangeLow:    summary?.priceRangeLow    ?? null,
      priceRangeHigh:   summary?.priceRangeHigh   ?? null,
      recommendedPrice: summary?.recommendedPrice  ?? null,
      avgDaysToSell:    summary?.avgDaysToSell     ?? null,
      competitionLevel: summary?.competitionLevel  ?? null,
      confidence:       summary?.confidence        ?? null,
      quickTake:        summary?.quickTake         ?? null,
      topSoldTitles,
      errorMessage:     null,
      durationMs:       dur,
    };
  } catch (err) {
    return makeErrorResult(tc, String(err), Date.now() - start);
  }
}

function makeErrorResult(tc: typeof TEST_CASES[0], msg: string, dur: number): TestResult {
  return {
    query: tc.query, color: tc.color, objectType: tc.objectType,
    notes: tc.notes, expectedMinSold: tc.expectedMinSold,
    grade: "ERROR", source: "error", soldCount: 0, activeCount: 0,
    priceRangeLow: null, priceRangeHigh: null, recommendedPrice: null,
    avgDaysToSell: null, competitionLevel: null, confidence: null, quickTake: null,
    topSoldTitles: [], errorMessage: msg, durationMs: dur,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌲 Treehouse Comp Analysis Stress Test`);
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Cases:  ${TEST_CASES.length}\n`);
  console.log("─".repeat(70));

  const results: TestResult[] = [];

  for (const tc of TEST_CASES) {
    process.stdout.write(`  Testing: "${tc.query}"... `);
    // Stagger requests — be nice to SerpAPI + cache
    if (results.length > 0) await sleep(1200);
    const r = await runTestCase(tc);
    results.push(r);
    const icon = r.grade === "PASS" ? "✅" : r.grade === "WARN" ? "⚠️ " : r.grade === "FAIL" ? "❌" : "💥";
    console.log(`${icon} ${r.grade}  sold=${r.soldCount} active=${r.activeCount} price=$${r.recommendedPrice?.toFixed(0) ?? "—"} (${r.durationMs}ms)`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const pass  = results.filter(r => r.grade === "PASS").length;
  const warn  = results.filter(r => r.grade === "WARN").length;
  const fail  = results.filter(r => r.grade === "FAIL").length;
  const error = results.filter(r => r.grade === "ERROR").length;

  console.log("\n" + "─".repeat(70));
  console.log(`\n  Results: ✅ ${pass} PASS  ⚠️  ${warn} WARN  ❌ ${fail} FAIL  💥 ${error} ERROR\n`);

  // Print failures + warns for easy review
  const problems = results.filter(r => r.grade !== "PASS");
  if (problems.length > 0) {
    console.log("  Issues to review:");
    for (const r of problems) {
      console.log(`\n  ${r.grade === "WARN" ? "⚠️ " : r.grade === "FAIL" ? "❌" : "💥"} "${r.query}"`);
      console.log(`     Expected ≥${r.expectedMinSold} sold, got ${r.soldCount}`);
      if (r.errorMessage) console.log(`     Error: ${r.errorMessage}`);
      if (r.topSoldTitles.length > 0) console.log(`     Top comps: ${r.topSoldTitles[0]}`);
      console.log(`     Notes: ${r.notes}`);
    }
  }

  // ── Write JSON report ─────────────────────────────────────────────────────
  const ts       = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outPath  = `scripts/test-results-${ts}.json`;
  const report = {
    meta: { timestamp: new Date().toISOString(), baseUrl: BASE_URL, totalCases: TEST_CASES.length, pass, warn, fail, error },
    results,
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n  Full report saved to: ${outPath}\n`);
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(console.error);

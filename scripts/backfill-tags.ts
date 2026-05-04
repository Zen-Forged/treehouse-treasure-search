// scripts/backfill-tags.ts
// R16 Task 7 — backfill posts.tags for rows that predate the enriched
// /api/post-caption (Task 2). Idempotent + resumable: every run picks up
// posts WHERE tags = '{}' (the migration default) and updates them.
//
// Usage:
//   npx tsx scripts/backfill-tags.ts status                  # count posts pending
//   npx tsx scripts/backfill-tags.ts run                     # backfill all pending
//   npx tsx scripts/backfill-tags.ts run --limit=10          # cap batch size (testing)
//   npx tsx scripts/backfill-tags.ts run --env-file=.env.staging.local
//
// Defaults to .env.local (prod). Pass --env-file to switch.
//
// Cost estimate at ~120 prod posts: ~$0.50 in Sonnet 4.6 vision calls.
//
// Why this script bypasses /api/post-caption and calls Anthropic directly:
// the route is rate-limited at 10/min/IP for vendor protection — backfilling
// 120 posts through it would take 12+ minutes minimum. The script uses the
// same prompt + max_tokens + sanitization as the route so backfilled tags
// match newly-published tags exactly.
//
// Safety rails:
//   - Reads service-role key from env file; refuses to run without one.
//   - Prints target URL + post count + cost estimate before mutating.
//   - 500ms sleep between calls (gentle on Anthropic rate limits + image
//     bandwidth from Supabase storage).
//   - Resumable: if interrupted mid-batch, re-running picks up where it
//     left off via the WHERE tags = '{}' filter.

import { createClient } from "@supabase/supabase-js";
import Anthropic        from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { resolve }      from "path";

// ── Args ─────────────────────────────────────────────────────────────────────

interface Args {
  cmd:         "status" | "run";
  envFile:     string;
  limit:       number | null;
  sleepMs:     number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const cmd  = (argv[0] ?? "") as Args["cmd"];
  if (cmd !== "status" && cmd !== "run") {
    console.error(`\nUsage:\n  npx tsx scripts/backfill-tags.ts status\n  npx tsx scripts/backfill-tags.ts run [--limit=N] [--env-file=path] [--sleep-ms=N]\n`);
    process.exit(1);
  }
  const envFileArg = argv.find(a => a.startsWith("--env-file="));
  const envFile    = envFileArg ? envFileArg.slice("--env-file=".length) : ".env.local";
  const limitArg   = argv.find(a => a.startsWith("--limit="));
  const limit      = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) : null;
  const sleepArg   = argv.find(a => a.startsWith("--sleep-ms="));
  const sleepMs    = sleepArg ? parseInt(sleepArg.slice("--sleep-ms=".length), 10) : 500;
  return { cmd, envFile, limit, sleepMs };
}

// ── Env loader ───────────────────────────────────────────────────────────────

function loadEnv(envFile: string): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), envFile),
    resolve("/Users/davidbutler/Projects/treehouse-treasure-search", envFile),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  }
  throw new Error(`No env file found. Tried:\n  ${candidates.join("\n  ")}`);
}

// ── AI call ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a writer for Treehouse, a local discovery app for antique and thrift finds.

Given an image, return a JSON object with exactly three fields:
- "title": A concise, accurate item name (3–6 words). Be specific: material, era, type. E.g. "Mid-century ceramic lamp", "Cast iron skillet", "Art deco brass mirror".
- "caption": One or two sentences, maximum. Notice what is genuinely interesting: the material, age, form, or patina. Write like a thoughtful friend who spotted something worth sharing — warm, brief, never precious. Do not mention price, resale value, or condition assessments. Avoid starting with "This" or the item name. Never use filler phrases like "a wonderful find" or "a must-have".
- "tags": An array of 5–6 lowercase categorical strings drawn from these axes (pick the ones that apply, skip the ones that don't):
  - material (brass, ceramic, wood, glass, cast iron, porcelain, leather, sterling, …)
  - era (victorian, art deco, mid-century, 1970s, …)
  - object_type (lamp, vase, bookend, bowl, painting, bust, mirror, …)
  - color (amber, cobalt, cream, forest green, rust, …)
  - subject (only when applicable — portrait of franklin, horse, eagle, …)
  - category (lighting, kitchenware, decor, art, jewelry, toys, …)
  All tags lowercase. Single words or short phrases. No duplicates. Aim for 5–6, never more than 8.
  CRITICAL: Return ONLY the tag value. Do NOT prefix with the axis name. Correct: "bee". Wrong: "subject: bee" or "color: amber".

Return ONLY valid JSON. No markdown, no code fences.
Example: {"title":"Vintage brass candlestick","caption":"Carries its age quietly. The kind of piece that looks like it was always there.","tags":["brass","candlestick","mid-century","decor","amber"]}`;

type ImageMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

async function fetchImageBase64(imageUrl: string): Promise<{ base64: string; mime: ImageMime } | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`  fetch failed (${res.status}): ${imageUrl}`);
      return null;
    }
    const ct  = res.headers.get("content-type") ?? "image/jpeg";
    const mime = (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(ct) ? ct : "image/jpeg") as ImageMime;
    const buf  = Buffer.from(await res.arrayBuffer());
    return { base64: buf.toString("base64"), mime };
  } catch (err) {
    console.warn(`  fetch threw:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function extractTags(client: Anthropic, imageUrl: string): Promise<string[] | null> {
  const img = await fetchImageBase64(imageUrl);
  if (!img) return null;

  const response = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 320,
    system:     SYSTEM_PROMPT,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: img.mime, data: img.base64 } },
        { type: "text",  text: "Identify this item and write a Treehouse title and caption. Return only JSON." },
      ],
    }],
  });

  const raw = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(raw) as { title?: string; caption?: string; tags?: string[] };
    if (!Array.isArray(parsed.tags)) return [];
    // Sanitize: lowercase, trim, dedupe, drop empties + non-strings, cap at 8.
    // ALSO strip "axis-name: value" prefixes (e.g. "subject: bee" → "bee") —
    // Claude sometimes returns the axis label inline despite the prompt
    // asking for value-only. Splits on ":" and keeps the last chunk; tags
    // without a colon pass through unchanged.
    return Array.from(new Set(
      parsed.tags
        .filter((t): t is string => typeof t === "string")
        .map(t => {
          const stripped = t.includes(":") ? t.split(":").pop()! : t;
          return stripped.trim().toLowerCase();
        })
        .filter(t => t.length > 0)
    )).slice(0, 8);
  } catch (err) {
    console.warn(`  JSON parse failed: ${raw.slice(0, 120)}`);
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function main() {
  const args = parseArgs();
  const env  = loadEnv(args.envFile);

  const url        = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey     = env.ANTHROPIC_API_KEY;

  if (!url || !serviceKey) throw new Error(`Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${args.envFile}`);
  if (!apiKey)             throw new Error(`Missing ANTHROPIC_API_KEY in ${args.envFile}`);

  console.log(`\n━━━ backfill-tags ━━━`);
  console.log(`env file:   ${args.envFile}`);
  console.log(`target URL: ${url}`);
  console.log(`command:    ${args.cmd}`);
  if (args.limit !== null) console.log(`limit:      ${args.limit}`);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Posts that need backfilling: tags is empty array (the migration default)
  // OR tags contain a colon-prefixed value (e.g. "subject: bee" — written by
  // an earlier run before the sanitizer learned to strip axis prefixes).
  // AND image_url is present (no image = nothing to extract from).
  // We pull all tagged + untagged posts in scope, filter colon-tags client-side
  // (Postgres array filter for substring match is awkward via supabase-js; the
  // dataset is small enough for a one-pass JS filter).
  const { data: rawPending, count, error: pendingErr } = await supabase
    .from("posts")
    .select("id, title, image_url, tags", { count: "exact" })
    .not("image_url", "is", null);
  if (pendingErr) throw new Error(`Pending fetch failed: ${pendingErr.message}`);

  const pending = (rawPending ?? []).filter(p => {
    const tags = (p.tags ?? []) as string[];
    if (tags.length === 0) return true;                         // empty
    if (tags.some(t => typeof t === "string" && t.includes(":"))) return true; // colon-prefixed
    return false;                                               // already clean
  });

  const total = pending?.length ?? 0;
  console.log(`\npending posts: ${total}${count !== null ? ` (count check: ${count})` : ""}`);

  if (args.cmd === "status") {
    const estCost = (total * 0.003).toFixed(2);
    console.log(`estimated cost: ~$${estCost} in Sonnet 4.6 vision calls`);
    console.log(`estimated time: ~${Math.ceil(total * (args.sleepMs + 1500) / 1000)}s\n`);
    return;
  }

  // run
  const batch = args.limit !== null ? pending!.slice(0, args.limit) : pending!;
  console.log(`processing ${batch.length} posts (sleep ${args.sleepMs}ms between)\n`);

  const client = new Anthropic({ apiKey });
  let okCount = 0, failCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const post = batch[i];
    const label = `[${i + 1}/${batch.length}] ${post.id} — ${(post.title ?? "(untitled)").slice(0, 40)}`;
    if (!post.image_url) { console.log(`${label}  SKIP (no image_url)`); failCount++; continue; }

    try {
      const tags = await extractTags(client, post.image_url);
      if (tags === null) { console.log(`${label}  FAIL (extraction returned null)`); failCount++; continue; }

      const { error: updErr } = await supabase
        .from("posts")
        .update({ tags })
        .eq("id", post.id);
      if (updErr) { console.log(`${label}  FAIL (update: ${updErr.message})`); failCount++; continue; }

      console.log(`${label}  ok → ${tags.join(", ")}`);
      okCount++;
    } catch (err) {
      console.log(`${label}  FAIL (${err instanceof Error ? err.message : err})`);
      failCount++;
    }

    if (i < batch.length - 1) await sleep(args.sleepMs);
  }

  console.log(`\n━━━ done ━━━`);
  console.log(`ok:      ${okCount}`);
  console.log(`failed:  ${failCount}`);
  console.log(`remaining (re-run to continue): ${total - okCount}\n`);
}

main().catch((err) => {
  console.error(`\nfatal:`, err instanceof Error ? err.message : err);
  process.exit(1);
});

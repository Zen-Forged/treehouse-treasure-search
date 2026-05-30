// app/api/shelf-caption/route.ts
// Session 204 Arc 4 (C2) — Share My Shelf AI caption + hero-hook generator.
//
// Shape C "floor + enrichment" (session-203 pattern): Sonnet writes a
// vendor-tone Story caption + a short hero hook referencing the actual finds.
// When the key is absent or Sonnet fails, we fall back to the SAME
// deterministic builders the client first-paints with (lib/aiShelfCaption) —
// single source of truth for the floor text, flagged source:"mock".
//
// Text-only (not vision): the post titles/captions/tags ARE the vision output
// from the publish-time /api/post-caption call, so we get the finds' content
// without re-uploading 3 photos per generation.
//
// Rate limiting: 10 requests per IP per 60s (in-memory), mirroring
// /api/post-caption. In-memory limits don't share state across Vercel
// instances; upgrade to Upstash Redis if instance count becomes a concern.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { composeStoryCaption, placeholderHeroHook } from "@/lib/aiShelfCaption";

// ---------------------------------------------------------------------------
// Rate limiter — in-memory, per-IP, resets every WINDOW_MS
// ---------------------------------------------------------------------------
const RATE_LIMIT = 10;
const WINDOW_MS  = 60_000;

const ipMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetInMs: WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetInMs: WINDOW_MS - (now - entry.windowStart) };
  }
  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetInMs: WINDOW_MS - (now - entry.windowStart) };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function logError(message: string, context: { ip: string; error?: unknown; details?: Record<string, unknown> }) {
  const { ip, error, details = {} } = context;
  console.error(`[shelf-caption] ${new Date().toISOString()} - ${message}`, {
    ip,
    error: error instanceof Error ? { message: error.message, name: error.name } : error,
    ...details,
  });
}

// ---------------------------------------------------------------------------
// Request shape — minimal context for both the Sonnet prompt + the floor.
// ---------------------------------------------------------------------------
interface ShelfCaptionBody {
  vendorName:   string;
  boothNumber:  string | null;
  mallName:     string | null;
  city:         string | null;
  boothUrl:     string;
  finds:        { title: string; caption: string | null; tags: string[] }[];
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

// Deterministic floor — reuses the client's builders so the text matches.
function buildFloor(body: ShelfCaptionBody, urlPreview: string) {
  const findCount = body.finds.length;
  return {
    storyCaption: composeStoryCaption({
      vendorName: body.vendorName,
      boothNo:    body.boothNumber,
      mallName:   body.mallName,
      city:       body.city,
      findCount,
      urlPreview,
    }),
    heroHook: placeholderHeroHook(findCount, 0),
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining, resetInMs } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(Math.ceil(resetInMs / 1000)),
          "X-RateLimit-Limit":     String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  let body: ShelfCaptionBody;
  try {
    body = (await req.json()) as ShelfCaptionBody;
  } catch (parseError) {
    logError("JSON parse error", { ip, error: parseError });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.vendorName || !Array.isArray(body.finds) || body.finds.length === 0) {
    return NextResponse.json({ error: "Missing vendorName or finds" }, { status: 400 });
  }

  const urlPreview = body.boothUrl ? stripProtocol(body.boothUrl) : "";
  const floor      = buildFloor(body, urlPreview);
  const apiKey     = process.env.ANTHROPIC_API_KEY;

  // No-key → deterministic floor (source:"mock"). Caller renders it as-is.
  if (!apiKey) {
    return NextResponse.json(
      { ...floor, source: "mock" as const, reason: "no-key" },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  try {
    const findList = body.finds
      .map((f, i) => {
        const tagStr = f.tags?.length ? ` [${f.tags.slice(0, 4).join(", ")}]` : "";
        const cap    = f.caption ? ` — ${f.caption}` : "";
        return `${i + 1}. ${f.title}${tagStr}${cap}`;
      })
      .join("\n");

    const venueParts = [body.mallName, body.city].filter(Boolean).join(", ");
    const venueLine  = body.boothNumber && venueParts
      ? `Booth ${body.boothNumber} at ${venueParts}`
      : (venueParts || (body.boothNumber ? `Booth ${body.boothNumber}` : ""));

    const system = `You are a writer for Treehouse, a local discovery app for antique and thrift finds. A vendor is sharing this week's new finds on social media (Instagram / Facebook Story). Write share-worthy copy that makes someone want to visit the booth in person.

Return ONLY valid JSON with exactly two fields:
- "caption": A 2-3 line social caption. Line 1 leads with the 🍃 leaf emoji and names the vendor + nods to the finds collectively (reference the actual items — material, type, or character — not generic "new finds"). Line 2 is a warm visit-the-booth call naming the venue. Keep it brief, genuine, a little poetic — like a friend who spotted something worth sharing. No price, no resale talk, no hashtags, no URL (we append the link separately). Do NOT use em-dashes as sentence joiners.
- "hook": A very short teaser line, 3-6 words max, for a card overlay. Tease what's on the shelf (e.g. "Brass, ceramic & a story", "Three finds worth the trip"). End with " →". No emoji in the hook.

Write ONLY the JSON. No markdown, no code fences.
Example: {"caption":"🍃 New on the shelf at Maple & Main: a brass candlestick, a stoneware bowl, and a little mid-century glass.\\nCome find them at Booth 14, America's Antique Mall in Lexington.","hook":"Brass, ceramic & glass →"}`;

    const userText =
      `Vendor: ${body.vendorName}\n` +
      (venueLine ? `Venue: ${venueLine}\n` : "") +
      `This week's finds:\n${findList}\n\n` +
      `Write the caption and hook. Return only JSON.`;

    const client   = new Anthropic({ apiKey });
    const response = await client.messages.create({
      // Sonnet 4.6 — right tier for a short vendor-tone text task; pinned
      // (not aliased) per DECISION_GATE version-stability preference.
      model:      "claude-sonnet-4-6",
      max_tokens: 320,
      system,
      messages:   [{ role: "user", content: userText }],
    });

    const raw = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");

    const parsed  = JSON.parse(raw) as { caption?: string; hook?: string };
    const aiBody  = (parsed.caption ?? "").trim();
    const aiHook  = (parsed.hook ?? "").trim();

    // Empty/garbled model output → floor (never blank).
    if (!aiBody || !aiHook) {
      return NextResponse.json(
        { ...floor, source: "mock" as const, reason: "empty" },
        { headers: { "X-RateLimit-Remaining": String(remaining) } },
      );
    }

    // Append the URL ourselves — never trust the model to reproduce it exactly.
    const storyCaption = urlPreview ? `${aiBody}\n${urlPreview}` : aiBody;

    return NextResponse.json(
      { storyCaption, heroHook: aiHook, source: "claude" as const },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  } catch (err) {
    logError("Sonnet caption generation failed", { ip, error: err });
    // Emergency fallback — deterministic floor so the vendor still gets copy.
    return NextResponse.json(
      { ...floor, source: "mock" as const, reason: "error" },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }
}

// app/api/post-caption/route.ts
// Generates a Treehouse title AND caption for a vendor find post.
// Captions are short, slightly poetic, never transactional.
//
// Rate limiting: 10 requests per IP per 60s (in-memory).
// Note: in-memory limits don't share state across Vercel instances.
// Upgrade to Upstash Redis when instance count becomes a concern at scale.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Rate limiter — in-memory, per-IP, resets every WINDOW_MS
// ---------------------------------------------------------------------------
const RATE_LIMIT    = 10;   // max requests per window per IP
const WINDOW_MS     = 60_000; // 60 seconds

const ipMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetInMs: WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    const resetInMs = WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetInMs };
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

// ---------------------------------------------------------------------------
// Error logging utility
// ---------------------------------------------------------------------------
function logError(message: string, context: { ip: string; error?: any; details?: Record<string, any> }) {
  const timestamp = new Date().toISOString();
  const { ip, error, details = {} } = context;
  
  console.error(`[post-caption] ${timestamp} - ${message}`, {
    ip,
    userAgent: context.details?.userAgent || 'unknown',
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    ...details
  });
}

// ---------------------------------------------------------------------------
// Mock fallback — used when ANTHROPIC_API_KEY is absent or Claude fails
// ---------------------------------------------------------------------------
const MOCK_RESPONSES = [
  { title: "Mid-century ceramic vase",    caption: "Quietly beautiful. The kind of thing that earns a permanent spot on the shelf.",  tags: ["ceramic",  "mid-century", "vase",        "cream",  "decor"]       },
  { title: "Brass candlestick holder",    caption: "Well-made and unhurried. Still very much at home in the world.",                  tags: ["brass",    "candlestick", "amber",       "lighting","decor"]       },
  { title: "Vintage glass figurine",      caption: "Simple in form, considered in craft. The sort of thing you don't see twice.",     tags: ["glass",    "vintage",     "figurine",    "decor",  "art"]         },
  { title: "Antique wooden side table",   caption: "Classic lines, genuine character. It's been around long enough to have a story.", tags: ["wood",     "antique",     "side table",  "decor",  "furniture"]   },
  { title: "Stoneware pottery bowl",      caption: "Not flashy, but assured. The materials are real and the quality shows.",          tags: ["stoneware","pottery",     "bowl",        "cream",  "kitchenware"] },
];

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // Rate limit check
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  const { allowed, remaining, resetInMs } = checkRateLimit(ip);

  if (!allowed) {
    logError("Rate limit exceeded", { 
      ip, 
      details: { userAgent, rateLimitRemaining: 0, resetInMs } 
    });
    
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After":          String(Math.ceil(resetInMs / 1000)),
          "X-RateLimit-Limit":    String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":    String(Math.ceil((Date.now() + resetInMs) / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json().catch((parseError) => {
      logError("JSON parse error", { 
        ip, 
        error: parseError,
        details: { userAgent, contentType: req.headers.get("content-type") }
      });
      throw new Error("Invalid JSON body");
    });
    
    const { imageDataUrl } = body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      logError("API key not configured, using mock response", { 
        ip,
        details: { userAgent, hasImage: !!imageDataUrl }
      });
      
      const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      // source="mock" + reason="no-key" lets the client distinguish this
      // intentional-mock path from the fallback-on-error path below, and
      // skip populating the form when it fires.
      return NextResponse.json({ ...mock, source: "mock", reason: "no-key" }, {
        headers: { "X-RateLimit-Remaining": String(remaining) },
      });
    }

    const system = `You are a writer for Treehouse, a local discovery app for antique and thrift finds.

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

    const content: Anthropic.MessageParam["content"] = [];

    if (imageDataUrl?.startsWith("data:image/")) {
      const [header, base64] = imageDataUrl.split(",");
      const mime = (header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg") as
        | "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      content.push({ type: "image", source: { type: "base64", media_type: mime, data: base64 } });
    }

    content.push({ type: "text", text: "Identify this item and write a Treehouse title and caption. Return only JSON." });

    const client   = new Anthropic({ apiKey });
    const response = await client.messages.create({
      // Session 27: was "claude-opus-4-5" which was retired on the
      // Anthropic API — the SDK throws, we fall into the catch below,
      // and every vendor post got a random MOCK_RESPONSES string
      // regardless of what was photographed. Sonnet 4.6 is the right
      // tier for a 200-token vision-to-JSON caption task — faster and
      // cheaper than Opus, still excellent on vision. Pinned (not
      // aliased) per DECISION_GATE preference for version stability.
      model:      "claude-sonnet-4-6",
      max_tokens: 320,
      system,
      messages:   [{ role: "user", content }],
    });

    const raw = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "");

    try {
      const parsed = JSON.parse(raw) as { title: string; caption: string; tags?: string[] };
      // Sanitize tags defensively: strip "axis-name: value" prefixes
      // (Claude sometimes returns "subject: bee" despite the prompt asking
      // for value-only — first observed in the R16 backfill, see
      // scripts/backfill-tags.ts), then lowercase, trim, dedupe, drop
      // empties + non-strings, cap at 8 (matches prompt). Empty array on
      // missing/malformed is the right default — search still works
      // against title + caption.
      const tags = Array.isArray(parsed.tags)
        ? Array.from(new Set(
            parsed.tags
              .filter((t): t is string => typeof t === "string")
              .map(t => {
                const stripped = t.includes(":") ? t.split(":").pop()! : t;
                return stripped.trim().toLowerCase();
              })
              .filter(t => t.length > 0)
          )).slice(0, 8)
        : [];
      return NextResponse.json(
        { title: parsed.title ?? "", caption: parsed.caption ?? "", tags, source: "claude" as const },
        { headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    } catch (parseError) {
      logError("Claude response JSON parse error", {
        ip,
        error: parseError,
        details: { userAgent, claudeResponse: raw.slice(0, 200) }
      });
      throw parseError;
    }

  } catch (err) {
    logError("Unexpected error", {
      ip,
      error: err,
      details: { userAgent }
    });
    
    const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    // source="mock" + reason="error" tells the client this is an
    // emergency fallback — NOT a real description of the image — so
    // the client should treat it as a failure and leave the form empty
    // with the amber "Couldn't read this image" notice surfaced.
    return NextResponse.json({ ...mock, source: "mock", reason: "error" });
  }
}

// app/api/extract-tag/route.ts
// Reads a vintage/antique mall booth tag from a photo and extracts
// { title, price } via Claude Sonnet 4.6 vision.
//
// Mirrors /api/post-caption line-by-line — same rate limit, same mock
// fallback structure (source: "claude" | "mock" + reason), same logError
// helper. Diff: tag-specific system prompt + response shape.
//
// Response shape:
//   success: { title: string, price: number | null, source: "claude" }
//   failure: { title: "", price: null, source: "mock", reason: "no-key" | "error" | "parse" }
//
// Why price is `number | null`, not always a number:
//   Tags vary. Printed price = readable. Handwritten "$22.50" = sometimes
//   readable. Faded/torn/missing = null. The prompt instructs Claude to
//   return null rather than inventing a price. Client surfaces a soft
//   amber notice when title prefilled but price is null.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Rate limiter — in-memory, per-IP, resets every WINDOW_MS (matches post-caption)
// ---------------------------------------------------------------------------
const RATE_LIMIT = 10;
const WINDOW_MS  = 60_000;

const ipMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetInMs: number } {
  const now   = Date.now();
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
// Error logging utility (mirrors post-caption)
// ---------------------------------------------------------------------------
function logError(message: string, context: { ip: string; error?: any; details?: Record<string, any> }) {
  const timestamp = new Date().toISOString();
  const { ip, error, details = {} } = context;

  console.error(`[extract-tag] ${timestamp} - ${message}`, {
    ip,
    userAgent: context.details?.userAgent || "unknown",
    error: error instanceof Error ? {
      message: error.message,
      stack:   error.stack,
      name:    error.name,
    } : error,
    ...details,
  });
}

// ---------------------------------------------------------------------------
// Failure response shape
// ---------------------------------------------------------------------------
function failureResponse(reason: "no-key" | "error" | "parse", remaining?: number) {
  const headers: Record<string, string> = {};
  if (typeof remaining === "number") headers["X-RateLimit-Remaining"] = String(remaining);

  return NextResponse.json(
    { title: "", price: null, source: "mock" as const, reason },
    { headers },
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  const { allowed, remaining, resetInMs } = checkRateLimit(ip);

  if (!allowed) {
    logError("Rate limit exceeded", {
      ip,
      details: { userAgent, rateLimitRemaining: 0, resetInMs },
    });

    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(Math.ceil(resetInMs / 1000)),
          "X-RateLimit-Limit":     String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":     String(Math.ceil((Date.now() + resetInMs) / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json().catch((parseError) => {
      logError("JSON parse error", {
        ip,
        error: parseError,
        details: { userAgent, contentType: req.headers.get("content-type") },
      });
      throw new Error("Invalid JSON body");
    });

    const { imageDataUrl } = body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      logError("API key not configured, returning mock fallback", {
        ip,
        details: { userAgent, hasImage: !!imageDataUrl },
      });
      return failureResponse("no-key", remaining);
    }

    const system = `You are reading a printed inventory tag from a vintage / antique mall booth. The tag typically has:
- An item name or description (printed or handwritten)
- A price in US dollars (printed or handwritten, often with $ prefix, sometimes with qualifiers like "firm" or "OBO")
- May include other text: SKU, vendor code, booth number, condition notes, dates — these are NOT the title.

Given the image, return a JSON object with exactly two fields:

- "title": The item name as written on the tag. 3–8 words. Use exactly what the tag says — do not embellish, rephrase, or add detail not present on the tag itself. If the title is in ALL CAPS, normalize to sentence case (e.g. "MID-CENTURY LAMP" becomes "Mid-century lamp"). If the title is partially unreadable but you can recover most of it, return the readable portion. If the title is fully unreadable or absent, return an empty string.

- "price": The price as a number (integer or float, max two decimals). Strip the dollar sign and any qualifiers. Examples:
  - "$22" → 22
  - "$22.50" → 22.50
  - "$22 firm" → 22
  - "$22.00 OBO" → 22
  - handwritten or unreadable → null
  - missing or absent → null
  Do NOT invent a price if you cannot read it. Do NOT guess based on the item.

Return ONLY valid JSON. No markdown, no code fences, no explanation.

Examples:
{"title":"Brass candlestick","price":18}
{"title":"Vintage milk glass vase","price":24.50}
{"title":"Cast iron skillet","price":null}
{"title":"","price":null}`;

    const content: Anthropic.MessageParam["content"] = [];

    if (imageDataUrl?.startsWith("data:image/")) {
      const [header, base64] = imageDataUrl.split(",");
      const mime = (header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg") as
        | "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      content.push({ type: "image", source: { type: "base64", media_type: mime, data: base64 } });
    }

    content.push({ type: "text", text: "Extract the title and price from this inventory tag. Return only JSON." });

    const client   = new Anthropic({ apiKey });
    const response = await client.messages.create({
      // Pinned to claude-sonnet-4-6 per session-27 lesson — never alias.
      model:      "claude-sonnet-4-6",
      max_tokens: 200,
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
      const parsed = JSON.parse(raw) as { title?: string; price?: number | null };
      const title  = typeof parsed.title === "string" ? parsed.title.trim() : "";
      const price  = typeof parsed.price === "number" && isFinite(parsed.price)
        ? Math.round(parsed.price * 100) / 100
        : null;

      return NextResponse.json(
        { title, price, source: "claude" as const },
        { headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    } catch (parseError) {
      logError("Claude response JSON parse error", {
        ip,
        error: parseError,
        details: { userAgent, claudeResponse: raw.slice(0, 200) },
      });
      return failureResponse("parse", remaining);
    }

  } catch (err) {
    logError("Unexpected error", {
      ip,
      error: err,
      details: { userAgent },
    });
    return failureResponse("error", remaining);
  }
}

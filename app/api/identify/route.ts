// app/api/identify/route.ts
// Consolidated identification endpoint.
// Uses Claude vision when ANTHROPIC_API_KEY is present, falls back to mock.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeQuery } from "@/utils/normalizeQuery";

interface IdentifyResult {
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  searchQuery: string;
}

// ── Mock fallback ──────────────────────────────────────────

const MOCK_ITEMS = [
  { title: "Brass Owl Bookend",         description: "A decorative brass piece — possibly a bookend or paperweight. The patina suggests age.",                                        confidence: "medium" as const },
  { title: "Mid-Century Ceramic Vase",  description: "A ceramic vessel with a matte glaze. The form and palette suggest mid-century American or Scandinavian origin.",              confidence: "medium" as const },
  { title: "Cast Iron Bank",            description: "A painted cast iron figurine, likely a still bank. These were popular in the early 20th century.",                            confidence: "high"   as const },
  { title: "Amber Glass Decanter",      description: "A hand-blown amber glass decanter with a ground stopper. The color and weight feel intentional.",                             confidence: "medium" as const },
  { title: "Enamel Trinket Box",        description: "A small enameled box with hand-painted detail. Could be French or English, likely decorative.",                              confidence: "low"    as const },
  { title: "Wooden Carved Figure",      description: "A hand-carved wooden figure with folk art characteristics. The tool marks suggest it wasn't mass produced.",                 confidence: "medium" as const },
  { title: "Silver-Plate Serving Tray", description: "A silver-plated tray with decorative edging. Hallmarks, if present, would narrow the origin.",                              confidence: "medium" as const },
  { title: "Porcelain Figurine",        description: "A small porcelain piece with hand-applied details. The glaze quality and weight suggest it's not modern reproduction.",       confidence: "high"   as const },
];

function mockIdentify(imageDataUrl: string): IdentifyResult {
  const seed = imageDataUrl.length % MOCK_ITEMS.length;
  const item = MOCK_ITEMS[seed];
  return {
    ...item,
    searchQuery: normalizeQuery(item.title),
  };
}

// ── Real Claude identification ─────────────────────────────

async function claudeIdentify(imageDataUrl: string): Promise<IdentifyResult> {
  const client = new Anthropic();

  // Strip the data URL prefix to get raw base64
  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mediaType = (imageDataUrl.match(/^data:(image\/\w+);/) ?? [])[1] as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/gif"
    | undefined;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType ?? "image/jpeg",
              data: base64,
            },
          },
          {
            type: "text",
            text: `Identify this object. Respond ONLY with valid JSON in this exact shape:
{
  "title": "short descriptive name (3-5 words)",
  "description": "one or two calm, observational sentences about what this appears to be",
  "confidence": "high" | "medium" | "low",
  "searchQuery": "3-5 keywords for eBay sold listings search"
}

Be observational, not clinical. Avoid words like "analyze" or "determine". No markdown, no extra text.`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  const parsed = JSON.parse(text.trim()) as IdentifyResult;

  // Normalize the search query through our standard pipeline
  parsed.searchQuery = normalizeQuery(parsed.searchQuery || parsed.title);

  return parsed;
}

// ── Route handler ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 }
      );
    }

    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`[identify] using ${hasKey ? "Claude" : "mock"}`);

    const result = hasKey
      ? await claudeIdentify(imageDataUrl)
      : mockIdentify(imageDataUrl);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[identify] failed:", message);

    // Never hard-fail identification — fall back to mock
    return NextResponse.json(
      mockIdentify("fallback"),
      { status: 200 }
    );
  }
}

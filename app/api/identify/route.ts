// app/api/identify/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery } from "@/utils/normalizeQuery";

interface IdentifyResult {
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  searchQuery: string;
}

const MOCK_ITEMS: IdentifyResult[] = [
  { title: "Brass Owl Bookend",         description: "A decorative brass piece — possibly a bookend or paperweight. The patina suggests age.",           confidence: "medium", searchQuery: "brass owl bookend" },
  { title: "Mid-Century Ceramic Vase",  description: "A ceramic vessel with matte glaze. The form suggests mid-century American or Scandinavian origin.", confidence: "medium", searchQuery: "mid century ceramic vase" },
  { title: "Cast Iron Bank",            description: "A painted cast iron figurine, likely a still bank. Popular in the early 20th century.",             confidence: "high",   searchQuery: "cast iron bank figurine" },
  { title: "Amber Glass Decanter",      description: "A hand-blown amber glass decanter with a ground stopper.",                                          confidence: "medium", searchQuery: "amber glass decanter single" },
  { title: "Enamel Trinket Box",        description: "A small enameled box with hand-painted detail. Could be French or English.",                        confidence: "low",    searchQuery: "enamel trinket box" },
  { title: "Wooden Carved Figure",      description: "A hand-carved wooden figure with folk art characteristics.",                                        confidence: "medium", searchQuery: "carved wooden folk art figurine" },
  { title: "Silver-Plate Serving Tray", description: "A silver-plated tray with decorative edging.",                                                     confidence: "medium", searchQuery: "silver plate serving tray" },
  { title: "Porcelain Figurine",        description: "A small porcelain piece with hand-applied details.",                                                confidence: "high",   searchQuery: "porcelain figurine vintage single" },
];

function mockIdentify(imageDataUrl: string): IdentifyResult {
  const seed = imageDataUrl.length % MOCK_ITEMS.length;
  const item = MOCK_ITEMS[seed];
  return { ...item, searchQuery: normalizeQuery(item.searchQuery) };
}

async function claudeIdentify(imageDataUrl: string): Promise<IdentifyResult> {
  const base64     = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mediaMatch = imageDataUrl.match(/^data:(image\/\w+);/);
  const mediaType  = (mediaMatch?.[1] ?? "image/jpeg") as
    "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const client = new Anthropic();

  const response = await client.messages.create({
    model:      "claude-opus-4-5",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        {
          type: "text",
          text: `Identify this object. Respond ONLY with raw valid JSON, no markdown, no backticks, no explanation.

Rules for searchQuery:
- Be as specific as possible — include brand, model number, material, type, and form
- If this is clearly a single item (one goblet, one figurine, one bookend), include the word "single"
- If it has a specific brand or model (e.g. Canon EOS R50), include the full brand and model
- Never use generic terms like "item" or "object"
- Good examples: "carnival glass iridescent goblet single", "canon eos r50 camera", "benjamin franklin brass bookend bank"

{"title":"descriptive name 3-6 words","description":"one or two calm observational sentences about material era and style","confidence":"high or medium or low","searchQuery":"specific ebay search query following the rules above"}`,
        },
      ],
    }],
  });

  const raw = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  const clean = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(clean) as IdentifyResult;
  parsed.searchQuery = normalizeQuery(parsed.searchQuery || parsed.title);
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json() as { imageDataUrl: string };

    if (!imageDataUrl) {
      return NextResponse.json({ error: "imageDataUrl required" }, { status: 400 });
    }

    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`[identify] source=${hasKey ? "claude" : "mock"}`);

    const result = hasKey ? await claudeIdentify(imageDataUrl) : mockIdentify(imageDataUrl);
    console.log(`[identify] title="${result.title}" query="${result.searchQuery}" confidence=${result.confidence}`);
    return NextResponse.json(result);

  } catch (err) {
    console.error("[identify] error:", err);
    return NextResponse.json(mockIdentify("fallback"));
  }
}

// app/api/identify/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery } from "@/utils/normalizeQuery";
import { ItemAttributes } from "@/types";

export interface IdentifyResult {
  title:       string;
  description: string;
  confidence:  "high" | "medium" | "low";
  searchQuery: string;
  attributes:  ItemAttributes;
}

// ─── Visual classification output from Claude ───────────────────────────────

interface VisualField {
  value:      string | null;
  confidence: number;
}

interface VisualColor {
  primary:    string;
  secondary:  string;
  confidence: number;
}

interface VisualClassification {
  object_type:          VisualField;
  category:             VisualField;
  shape:                VisualField;
  color:                VisualColor;
  material:             VisualField;
  pattern:              VisualField;
  condition:            VisualField;
  set_type:             VisualField;
  size_estimate:        VisualField & { notes?: string };
  distinctive_features: string[];
  era?:                 VisualField;
  origin?:              VisualField;
  brand?:               VisualField;
  search_query:         string;
  notes:                string;
}

const MOCK_ITEMS: Omit<IdentifyResult, "attributes">[] = [
  { title: "Brass Owl Bookend",         description: "A decorative brass piece — possibly a bookend or paperweight. The patina suggests age.",           confidence: "medium", searchQuery: "brass owl bookend" },
  { title: "Mid-Century Ceramic Vase",  description: "A ceramic vessel with matte glaze. The form suggests mid-century American or Scandinavian origin.", confidence: "medium", searchQuery: "mid century ceramic vase" },
  { title: "Cast Iron Bank",            description: "A painted cast iron figurine, likely a still bank. Popular in the early 20th century.",             confidence: "high",   searchQuery: "cast iron bank figurine" },
  { title: "Amber Glass Decanter",      description: "A hand-blown amber glass decanter with a ground stopper.",                                          confidence: "medium", searchQuery: "amber glass decanter single" },
  { title: "Enamel Trinket Box",        description: "A small enameled box with hand-painted detail. Could be French or English.",                        confidence: "low",    searchQuery: "enamel trinket box" },
  { title: "Wooden Carved Figure",      description: "A hand-carved wooden figure with folk art characteristics.",                                        confidence: "medium", searchQuery: "carved wooden folk art figurine" },
  { title: "Silver-Plate Serving Tray", description: "A silver-plated tray with decorative edging.",                                                     confidence: "medium", searchQuery: "silver plate serving tray" },
  { title: "Porcelain Figurine",        description: "A small porcelain piece with hand-applied details.",                                                confidence: "high",   searchQuery: "porcelain figurine vintage single" },
];

const NULL_ATTRIBUTES: ItemAttributes = {
  brand:    null,
  material: null,
  era:      null,
  origin:   null,
  category: null,
};

function mockIdentify(imageDataUrl: string): IdentifyResult {
  const seed = imageDataUrl.length % MOCK_ITEMS.length;
  const item = MOCK_ITEMS[seed];
  return {
    ...item,
    searchQuery: normalizeQuery(item.searchQuery),
    attributes:  NULL_ATTRIBUTES,
  };
}

async function claudeIdentify(imageDataUrl: string): Promise<IdentifyResult> {
  const base64     = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mediaMatch = imageDataUrl.match(/^data:(image\/\w+);/);
  const mediaType  = (mediaMatch?.[1] ?? "image/jpeg") as
    "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const client = new Anthropic();

  const response = await client.messages.create({
    model:      "claude-opus-4-5",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        {
          type: "text",
          text: `You are a product identification and classification engine for a resale pricing application.
Analyze this image and extract ONLY visually observable attributes useful for matching against marketplace listings (eBay sold comps).
DO NOT guess. DO NOT infer beyond what is visually supported. If uncertain, use null and lower confidence.
Respond ONLY with raw valid JSON — no markdown, no backticks, no explanation.

{
  "object_type": {
    "value": "most specific common resale term (e.g. vase, table lamp, drink caddy, bookend). avoid vague terms like decor",
    "confidence": 0.0
  },
  "category": {
    "value": "marketplace category (e.g. home decor, kitchenware, lighting, clothing, electronics)",
    "confidence": 0.0
  },
  "shape": {
    "value": "normalized form factor (e.g. tall cylindrical, low round, rectangular tray, abstract sculptural)",
    "confidence": 0.0
  },
  "color": {
    "primary": "simple normalized color (white, brown, gold, amber, black, etc.)",
    "secondary": "second color or empty string if none",
    "confidence": 0.0
  },
  "material": {
    "value": "only if visually supported (ceramic, glass, wood, brass, cast iron, silver plate, etc.) — null if uncertain",
    "confidence": 0.0
  },
  "pattern": {
    "value": "one of: solid, speckled, etched, painted, gradient, floral, geometric, plain — null if unclear",
    "confidence": 0.0
  },
  "condition": {
    "value": "one of: new, like new, good, worn, damaged — based only on visible surface",
    "confidence": 0.0
  },
  "set_type": {
    "value": "one of: single, pair, set, unknown",
    "confidence": 0.0
  },
  "size_estimate": {
    "value": "estimate only if visual reference exists (e.g. small under 6 inches, medium 6-12 inches) — unknown if no reference",
    "confidence": 0.0,
    "notes": "reference used for estimate or empty string"
  },
  "distinctive_features": ["array of notable details e.g. handles on both sides, gold rim, woven texture, painted scene, embossed logo"],
  "era": {
    "value": "estimated decade or period only if visually supported (e.g. 1950s-1960s, victorian, art deco, 1980s) — null if cannot determine",
    "confidence": 0.0
  },
  "origin": {
    "value": "country of manufacture only if identifiable from markings or unmistakable style (e.g. japan, usa, england, west germany) — null if unknown",
    "confidence": 0.0
  },
  "brand": {
    "value": "manufacturer name only if visible marking exists (e.g. wedgwood, pyrex, levis) — null if not visible",
    "confidence": 0.0
  },
  "search_query": "short optimized eBay search query. format: [shape] [material] [object_type] [color]. example: tall ceramic vase white. all lowercase. no filler words.",
  "notes": "any important observation not captured above or empty string"
}

Rules: all string values lowercase. confidence 0.0-1.0. do not hallucinate brand, era, or origin.`,
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

  const v = JSON.parse(clean) as VisualClassification;

  // Only include fields above confidence threshold
  const THRESHOLD = 0.55;
  const pick = (field: VisualField | undefined): string | null =>
    field && field.confidence >= THRESHOLD && field.value ? field.value : null;

  const objectType = pick(v.object_type);
  const material   = pick(v.material);
  const shape      = pick(v.shape);
  const color      = v.color?.confidence >= THRESHOLD ? v.color.primary || null : null;
  const category   = pick(v.category);

  // Build title from strongest signals
  const titleParts = [shape, material, objectType].filter(Boolean);
  const title = titleParts.length >= 2
    ? titleParts.join(" ")
    : objectType ?? v.search_query ?? "unknown item";

  // Build description
  const descParts: string[] = [];
  if (material) descParts.push(material);
  if (color)    descParts.push(color);
  if (pick(v.pattern)) descParts.push(pick(v.pattern)!);
  if (v.distinctive_features?.length) descParts.push(v.distinctive_features.slice(0, 2).join(", "));
  const description = descParts.length
    ? `A ${descParts.join(", ")} ${objectType ?? "item"}.`
    : v.notes || `A ${objectType ?? "item"}.`;

  // Overall confidence
  const avgConf = [
    v.object_type?.confidence ?? 0,
    v.material?.confidence    ?? 0,
    v.category?.confidence    ?? 0,
  ].reduce((a, b) => a + b, 0) / 3;

  const confidence: "high" | "medium" | "low" =
    avgConf >= 0.8  ? "high" :
    avgConf >= 0.55 ? "medium" : "low";

  const searchQuery = normalizeQuery(v.search_query || title);

  const attributes: ItemAttributes = {
    brand:               pick(v.brand),
    material,
    era:                 pick(v.era),
    origin:              pick(v.origin),
    category,
    objectType,
    shape,
    primaryColor:        color,
    secondaryColor:      v.color?.confidence >= THRESHOLD && v.color.secondary ? v.color.secondary : null,
    pattern:             pick(v.pattern),
    condition:           pick(v.condition),
    setType:             pick(v.set_type),
    sizeEstimate:        pick(v.size_estimate),
    distinctiveFeatures: v.distinctive_features?.length ? v.distinctive_features : undefined,
    visualConfidence:    Math.round(avgConf * 100) / 100,
  };

  console.log(`[identify] obj="${objectType}" material="${material}" shape="${shape}" color="${color}" conf=${confidence} (${avgConf.toFixed(2)}) query="${searchQuery}"`);

  return { title, description, confidence, searchQuery, attributes };
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

    console.log(
      `[identify] title="${result.title}" query="${result.searchQuery}" confidence=${result.confidence}`,
      `brand=${result.attributes.brand} material=${result.attributes.material} era=${result.attributes.era} origin=${result.attributes.origin}`,
    );

    return NextResponse.json(result);

  } catch (err) {
    console.error("[identify] error:", err);
    return NextResponse.json(mockIdentify("fallback"));
  }
}

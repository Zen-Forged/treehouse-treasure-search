// app/api/identify/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery } from "@/utils/normalizeQuery";
import { buildSearchQuery, queryPriority, extractStyleDescriptor } from "@/lib/queryBuilder";
import { ItemAttributes } from "@/types";

export interface IdentifyResult {
  title:          string;
  description:    string;
  confidence:     "high" | "medium" | "low";
  searchQuery:    string;
  attributes:     ItemAttributes;
  isNamedProduct: boolean;
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
  { title: "Brass Owl Bookend",         description: "A decorative brass piece — possibly a bookend or paperweight. The patina suggests age.",           confidence: "medium", searchQuery: "brass owl bookend",           isNamedProduct: false },
  { title: "Mid-Century Ceramic Vase",  description: "A ceramic vessel with matte glaze. The form suggests mid-century American or Scandinavian origin.", confidence: "medium", searchQuery: "mid century ceramic vase",    isNamedProduct: false },
  { title: "Cast Iron Bank",            description: "A painted cast iron figurine, likely a still bank. Popular in the early 20th century.",             confidence: "high",   searchQuery: "cast iron bank figurine",    isNamedProduct: false },
  { title: "Amber Glass Decanter",      description: "A hand-blown amber glass decanter with a ground stopper.",                                          confidence: "medium", searchQuery: "amber glass decanter single", isNamedProduct: false },
  { title: "Enamel Trinket Box",        description: "A small enameled box with hand-painted detail. Could be French or English.",                        confidence: "low",    searchQuery: "enamel trinket box",         isNamedProduct: false },
  { title: "Wooden Carved Figure",      description: "A hand-carved wooden figure with folk art characteristics.",                                        confidence: "medium", searchQuery: "carved wooden folk art figurine", isNamedProduct: false },
  { title: "Silver-Plate Serving Tray", description: "A silver-plated tray with decorative edging.",                                                     confidence: "medium", searchQuery: "silver plate serving tray",  isNamedProduct: false },
  { title: "Porcelain Figurine",        description: "A small porcelain piece with hand-applied details.",                                                confidence: "high",   searchQuery: "porcelain figurine vintage single", isNamedProduct: false },
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
    searchQuery:    normalizeQuery(item.searchQuery),
    attributes:     NULL_ATTRIBUTES,
    isNamedProduct: false,
  };
}

async function claudeIdentify(imageDataUrl: string): Promise<IdentifyResult> {
  const base64     = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mediaMatch = imageDataUrl.match(/^data:(image\/\w+);/);
  const mediaType  = (mediaMatch?.[1] ?? "image/jpeg") as
    "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  // ── DEBUG: image sanity check ──────────────────────────────────────────────
  const base64Length = base64.length;
  const estimatedKB  = Math.round((base64Length * 3) / 4 / 1024);
  console.log(`[identify:debug] mediaType="${mediaType}" base64Length=${base64Length} estimatedSizeKB=${estimatedKB}`);
  if (base64Length < 1000) {
    console.warn(`[identify:debug] WARNING: base64 suspiciously short (${base64Length} chars) — image may be malformed or empty`);
  }
  if (!mediaMatch) {
    console.warn(`[identify:debug] WARNING: could not parse media type from data URL — falling back to image/jpeg`);
  }
  // ── END DEBUG ──────────────────────────────────────────────────────────────

  const client = new Anthropic();

  const response = await client.messages.create({
    model:       "claude-opus-4-5",
    max_tokens:  900,
    temperature: 0,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
        {
          type: "text",
          text: `You are a resale product identification engine. Your job is to identify items for eBay comp matching.

IMPORTANT: You must ALWAYS return valid JSON even if the image is unclear, blurry, or shows a non-resalable item (person, pet, scenery, etc.). Never refuse or add explanation text. If you genuinely cannot identify anything useful, set overall_confidence to 0.1 and use your best guess for object_type.

STEP 1 — IDENTITY CHECK:
First, determine if this is a specific named product (brand + model identifiable from the image itself — e.g. Canon EOS R50, Nike Air Jordan 1, KitchenAid Stand Mixer, Pyrex Cinderella Bowl).

- If YES (branded/named product you can identify with high confidence):
  Set "is_named_product": true
  Fill brand, model, and object_type with precision
  The user-facing title should be: "[Brand] [Model] [Color] [Object Type]" e.g. "Canon EOS R50 White Mirrorless Camera"
  The search_query should be the exact product name: "canon eos r50 white"

- If NO (unbranded, generic, vintage, or ambiguous):
  Set "is_named_product": false
  Use visual classification to describe it accurately
  Build title from strongest visual signals: "[material] [object_type] [color]" e.g. "Brass Owl Bookend" or "Tall Ceramic Vase White"
  Build search_query from visual attributes: "[shape] [material] [object_type] [color]"

STEP 2 — VISUAL ATTRIBUTES (always fill these regardless of Step 1):
Extract all visually observable attributes. Only include what you can actually see.
All string values must be lowercase. Confidence 0.0–1.0.

Respond ONLY with raw valid JSON — no markdown, no backticks, no explanation:

{
  "is_named_product": false,
  "brand": {
    "value": "brand name if identifiable (canon, nike, pyrex, wedgwood) — null if not visible or uncertain",
    "confidence": 0.0
  },
  "model": {
    "value": "specific model name/number if identifiable (eos r50, air jordan 1, stand mixer) — null if unknown",
    "confidence": 0.0
  },
  "object_type": {
    "value": "specific resale term (camera, bookend, vase, sneaker, mixing bowl) — never use 'item' or 'object'",
    "confidence": 0.0
  },
  "category": {
    "value": "marketplace category (electronics, home decor, kitchenware, clothing, collectibles, toys, jewelry)",
    "confidence": 0.0
  },
  "shape": {
    "value": "form factor (tall cylindrical, low round, rectangular, compact rectangular body, abstract sculptural)",
    "confidence": 0.0
  },
  "color": {
    "primary": "dominant color (white, black, brass, amber, red) — empty string if indeterminate",
    "secondary": "second color or empty string",
    "confidence": 0.0
  },
  "material": {
    "value": "primary material if visible (ceramic, glass, brass, plastic, leather, denim) — null if unclear",
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
    "value": "only if visual reference exists: small (under 6in), medium (6-12in), large (over 12in) — otherwise unknown",
    "confidence": 0.0
  },
  "distinctive_features": ["notable details visible in image e.g. flip-out screen, gold trim, woven texture, painted scene"],
  "subject": "the depicted person, character, or subject if this is a portrait/figural item — e.g. 'benjamin franklin', 'abraham lincoln', 'elvis presley', 'betty boop', 'mickey mouse' — null if not a portrait/character item",
  "era": {
    "value": "decade or period only if visually certain (1950s-1960s, victorian, art deco) — null if uncertain",
    "confidence": 0.0
  },
  "title": "user-facing product name following the rules in Step 1 — specific and accurate, 3-7 words, title case",
  "description": "one calm sentence describing what this is, its key visual characteristics, and condition",
  "search_query": "optimized eBay search query following Step 1 rules — all lowercase, no filler words",
  "overall_confidence": 0.0
}`,
        },
      ],
    }],
  });

  const raw = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  // ── DEBUG: log raw Claude response ────────────────────────────────────────
  console.log(`[identify:debug] raw Claude response (first 500 chars): ${raw.slice(0, 500)}`);
  // ── END DEBUG ─────────────────────────────────────────────────────────────

  const clean = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const v = JSON.parse(clean) as VisualClassification & {
    is_named_product: boolean;
    model?:           VisualField;
    subject?:         string | null;
    title:            string;
    description:      string;
    overall_confidence: number;
  };

  // ── DEBUG: log parsed field confidences ───────────────────────────────────
  console.log(`[identify:debug] parsed fields: object_type="${v.object_type?.value}"(${v.object_type?.confidence}) material="${v.material?.value}"(${v.material?.confidence}) category="${v.category?.value}"(${v.category?.confidence}) overall=${v.overall_confidence}`);
  console.log(`[identify:debug] claude title="${v.title}" search_query="${v.search_query}"`);
  // ── END DEBUG ─────────────────────────────────────────────────────────────

  const THRESHOLD = 0.55;
  const pick = (field: VisualField | undefined): string | null =>
    field && field.confidence >= THRESHOLD && field.value ? field.value : null;

  const brand     = pick(v.brand);
  const model     = pick(v.model);
  const objectType = pick(v.object_type);
  const material  = pick(v.material);
  const shape     = pick(v.shape);
  const color     = v.color?.confidence >= THRESHOLD ? v.color.primary || null : null;
  const category  = pick(v.category);

  const title = v.title || [
    brand, model, color, objectType
  ].filter(Boolean).join(" ") || objectType || "unknown item";

  const description = v.description || `A ${[material, color, objectType].filter(Boolean).join(" ") || "item"}.`;

  const overallConf = v.overall_confidence ?? (
    [v.object_type?.confidence ?? 0, v.material?.confidence ?? 0, v.category?.confidence ?? 0]
      .reduce((a, b) => a + b, 0) / 3
  );

  const confidence: "high" | "medium" | "low" =
    overallConf >= 0.8  ? "high" :
    overallConf >= 0.55 ? "medium" : "low";

  const attributes: ItemAttributes = {
    brand,
    material,
    era:                 pick(v.era),
    origin:              null,
    category,
    objectType,
    model,
    shape,
    primaryColor:        color,
    secondaryColor:      v.color?.confidence >= THRESHOLD && v.color.secondary ? v.color.secondary : null,
    pattern:             pick(v.pattern),
    condition:           pick(v.condition),
    setType:             pick(v.set_type),
    sizeEstimate:        pick(v.size_estimate),
    distinctiveFeatures: v.distinctive_features?.length ? v.distinctive_features : undefined,
    subject:             v.subject?.trim() || null,
    visualConfidence:    Math.round(overallConf * 100) / 100,
  };

  const builtQuery   = buildSearchQuery(attributes, v.is_named_product);
  const claudeQuery  = normalizeQuery(v.search_query || "");
  const searchQuery  = builtQuery || claudeQuery || normalizeQuery(title);
  const priority     = queryPriority(attributes, v.is_named_product);

  const styleDescriptor = extractStyleDescriptor(attributes.distinctiveFeatures);

  console.log(`[identify] named=${v.is_named_product} brand="${brand}" model="${model}" title="${title}" conf=${confidence}`);
  console.log(`[identify] query="${searchQuery}" priority=${priority} subject="${attributes.subject ?? "none"}" styleDescriptor="${styleDescriptor ?? "none"}" (claude suggested: "${claudeQuery}")`);
  console.log(`[identify] features=${JSON.stringify(attributes.distinctiveFeatures ?? [])}`);

  return { title, description, confidence, searchQuery, attributes, isNamedProduct: v.is_named_product };
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

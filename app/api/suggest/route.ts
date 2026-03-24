import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl) {
      return NextResponse.json({ error: "Missing imageDataUrl" }, { status: 400 });
    }

    const base64Data = imageDataUrl.split(",")[1];
    const mediaType = imageDataUrl.split(";")[0].split(":")[1];

    // Step 1 — extract structured item data from image
    const extractRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `You are an expert reseller. Analyze this item image and extract structured data.

Respond ONLY with a JSON object, no explanation:
{
  "category": "clothing|shoes|electronics|handbag|jewelry|collectible|other",
  "brand": "brand name or null",
  "model": "specific model or style name or null",
  "color": "primary color or null",
  "size": "size if visible or null",
  "condition": "new|like new|good|fair",
  "keyFeatures": ["up to 3 specific distinguishing features"]
}`,
              },
            ],
          },
        ],
      }),
    });

    if (!extractRes.ok) {
      const text = await extractRes.text();
      throw new Error(`Claude API error: ${extractRes.status} ${text}`);
    }

    const extractData = await extractRes.json();
    const rawText = extractData.content?.[0]?.text?.trim() ?? "";

    // Parse the structured data
    let itemData: any = {};
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        itemData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fall through to basic query
    }

    // Step 2 — build optimized eBay search query from structured data
    const parts: string[] = [];

    if (itemData.brand) parts.push(itemData.brand);
    if (itemData.model) parts.push(itemData.model);
    if (itemData.color && parts.length < 3) parts.push(itemData.color);
    if (itemData.size && parts.length < 4) parts.push(itemData.size);
    if (itemData.keyFeatures?.[0] && parts.length < 3) {
      parts.push(itemData.keyFeatures[0]);
    }

    // Fallback if we couldn't extract much
    if (parts.length === 0) {
      parts.push(itemData.category ?? "item");
    }

    const suggestion = parts.join(" ").trim().slice(0, 80);

    return NextResponse.json({
      suggestion,
      itemData, // pass back for potential future use
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Suggest API]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
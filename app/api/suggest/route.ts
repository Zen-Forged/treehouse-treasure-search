import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();

    if (!imageDataUrl) {
      return NextResponse.json({ error: "Missing imageDataUrl" }, { status: 400 });
    }

    // Strip the data:image/jpeg;base64, prefix
    const base64Data = imageDataUrl.split(",")[1];
    const mediaType = imageDataUrl.split(";")[0].split(":")[1];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 100,
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
                text: `You are a reseller assistant. Look at this item and generate the best eBay search query to find comparable sold listings.

Return ONLY the search query, nothing else. No explanation, no punctuation at the end.

Rules:
- Be specific: include brand, model, size, color if visible
- For electronics: include model number and storage/specs if visible
- For clothing: include brand, style, size if visible
- For shoes: include brand, model, size if visible
- For collectibles: include brand, series, character
- Avoid generic terms like "vintage" or "used" unless clearly relevant
- Keep it under 8 words
- Format it exactly as you would type it into eBay search

Examples:
- Apple iPhone 15 128GB unlocked
- Levi's 501 original fit jeans mens 32x32
- Nike Air Max 90 mens size 10
- Coach leather crossbody bag brown
- Nintendo Switch OLED white console`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Claude API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const suggestion = data.content?.[0]?.text?.trim();

    if (!suggestion) throw new Error("No suggestion returned");

    return NextResponse.json({ suggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Suggest API]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
// app/api/post-caption/route.ts
// Generates a Treehouse title AND caption for a vendor find post.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Increase body size limit for large mobile images
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const MOCK_RESPONSES = [
  { title: "Mid-century ceramic vase", caption: "A quietly beautiful piece that carries its age with dignity. The kind of find that earns a permanent spot on the shelf." },
  { title: "Brass candlestick holder", caption: "There's something understated about this one. Well-made, clearly cared for, and still very much at home in the world." },
  { title: "Vintage glass figurine", caption: "The sort of thing you don't see twice. Simple in form, considered in craft — and honest about what it is." },
  { title: "Antique wooden side table", caption: "Classic lines, genuine character. This one has been around long enough to have a story, and it still looks the part." },
  { title: "Stoneware pottery bowl", caption: "Not flashy, but assured. The materials are real, the quality shows, and it sits just right." },
];

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      return NextResponse.json(mock);
    }

    const system = `You are a writer for Treehouse, a local discovery app for antique and thrift finds.

Given an image, return a JSON object with exactly two fields:
- "title": A concise, accurate item name (3-6 words). Be specific: material, era, type. E.g. "Mid-century ceramic lamp", "Cast iron skillet", "Art deco brass mirror".
- "caption": A warm 2-3 sentence observation. Notice what is genuinely interesting: material, age, form, patina. Help the reader imagine it in a real space. Never mention price, resale, or eBay. Write like a thoughtful friend who just noticed something worth sharing.

Return ONLY valid JSON. No markdown, no code fences. Example:
{"title":"Vintage brass candlestick","caption":"A quietly beautiful piece that carries its age with dignity. Worth a closer look."}`;

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
      model:      "claude-opus-4-5",
      max_tokens: 300,
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

    const parsed = JSON.parse(raw) as { title: string; caption: string };
    return NextResponse.json({ title: parsed.title ?? "", caption: parsed.caption ?? "" });

  } catch (err) {
    console.error("[post-caption]", err);
    const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    return NextResponse.json(mock);
  }
}

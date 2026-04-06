// app/api/post-caption/route.ts
// Generates a Treehouse title AND caption for a vendor find post.
// Returns { title, caption } — both are AI-generated from the image.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MOCK_RESPONSES = [
  { title: "Mid-century ceramic vase", caption: "A quietly beautiful piece that carries its age with dignity. The kind of find that earns a permanent spot on the shelf — not because it demands attention, but because it rewards it." },
  { title: "Brass candlestick holder", caption: "There's something understated about this one. Well-made, clearly cared for, and still very much at home in the world. Worth a closer look before it moves on." },
  { title: "Vintage glass figurine", caption: "The sort of thing you don't see twice. Simple in form, considered in craft — and honest about what it is. It's ready for its next chapter." },
  { title: "Antique wooden side table", caption: "Classic lines, genuine character. This one has been around long enough to have a story, and it still looks the part." },
  { title: "Stoneware pottery bowl", caption: "Not flashy, but assured. The materials are real, the quality shows, and it sits just right. A thoughtful piece for someone who knows what they're looking for." },
];

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const mock = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      return NextResponse.json(mock);
    }

    const system = `You are a writer for Treehouse, a local discovery app connecting buyers with vendors at antique malls, peddler malls, and thrift stores.

Given an image of a find, return a JSON object with exactly two fields:
- "title": A concise, accurate item name (3-6 words). Be specific about what it actually is — material, era, type. Examples: "Mid-century ceramic lamp", "Cast iron skillet", "Art deco brass mirror", "Hand-thrown stoneware vase".
- "caption": A warm 2-3 sentence observation. Notice what is genuinely interesting: material, age, form, character, patina. Help the reader imagine it in a real space. Never mention price, resale, eBay, or flipping. Write like a thoughtful friend who just noticed something worth sharing. Tone: calm, considered, honest.

Return ONLY valid JSON. No markdown, no code fences, no preamble. Example:
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
    const mock = MOCK_RESPONSES[0];
    return NextResponse.json(mock);
  }
}

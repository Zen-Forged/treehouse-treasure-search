// app/api/post-caption/route.ts
// Generates a warm, tasteful Treehouse caption for a vendor find post.
// Tone: a thoughtful friend who noticed something worth sharing —
// NOT a resale analysis, NOT marketing copy.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const MOCK_CAPTIONS = [
  "A quietly beautiful piece that carries its age with dignity. The kind of find that earns a permanent spot on the shelf — not because it demands attention, but because it rewards it.",
  "There's something understated about this one. Well-made, clearly cared for, and still very much at home in the world. Worth a closer look before it moves on.",
  "The sort of thing you don't see twice. Simple in form, considered in craft — and honest about what it is. It's ready for its next chapter.",
  "Classic lines, genuine character. This one has been around long enough to have a story, and it still looks the part.",
  "Not flashy, but assured. The materials are real, the quality shows, and it sits just right. A thoughtful piece for someone who knows what they're looking for.",
];

export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl, title, description } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const caption = MOCK_CAPTIONS[Math.floor(Math.random() * MOCK_CAPTIONS.length)];
      return NextResponse.json({ caption });
    }

    const system = `You write short, warm featured-find captions for a local discovery app called Treehouse.

Treehouse connects buyers with curated vendors at antique malls, peddler malls, and thrift stores.
Your captions help local buyers understand what makes an item special and imagine it in their home.

Style rules:
- 2–3 sentences maximum
- Warm and observational — never salesy or hype
- Notice what is genuinely interesting: material, age, form, character, patina
- Help the reader imagine the object in a real space — on a shelf, in a room
- Never mention price, resale value, eBay, or flipping
- Never use filler like "stunning piece", "don't miss out", "perfect for any home"
- Write like a thoughtful friend who just noticed something worth sharing
- Tone: calm, considered, honest

Return ONLY the caption. No quotes, no preamble, no markdown.`;

    const content: Anthropic.MessageParam["content"] = [];

    if (imageDataUrl?.startsWith("data:image/")) {
      const [header, base64] = imageDataUrl.split(",");
      const mime = (header.match(/data:([^;]+);/)?.[1] ?? "image/jpeg") as
        | "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      content.push({ type: "image", source: { type: "base64", media_type: mime, data: base64 } });
    }

    const ctx = [
      title       ? `Item: ${title}` : "",
      description ? `Details: ${description}` : "",
      "Write a short Treehouse featured-find caption for this item.",
    ].filter(Boolean).join("\n");

    content.push({ type: "text", text: ctx });

    const client   = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model:      "claude-opus-4-5",
      max_tokens: 160,
      system,
      messages:   [{ role: "user", content }],
    });

    const caption = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    return NextResponse.json({ caption });
  } catch (err) {
    console.error("[post-caption]", err);
    const caption = MOCK_CAPTIONS[0];
    return NextResponse.json({ caption });
  }
}

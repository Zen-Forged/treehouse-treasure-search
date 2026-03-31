// app/api/story/route.ts
// Generates a Kentucky Treehouse–style post from item data + user note.
// Uses Claude when ANTHROPIC_API_KEY is set, falls back to a deterministic mock.

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { StoryOutput, StoryPostType } from "@/types/find";

interface StoryRequest {
  itemName:   string;
  material?:  string | null;
  condition?: string | null;
  status:     string;
  userNote?:  string;
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

const SCENES = [
  "tree branch",
  "treehouse interior",
  "forest floor",
  "dirt road",
  "railroad track",
] as const;

const POST_TYPES: StoryPostType[] = [
  "Found in the Wild",
  "From the Treehouse",
  "The Search",
  "Gone, but Kept",
];

function mockStory(req: StoryRequest): StoryOutput {
  const seed     = (req.itemName.length + (req.userNote?.length ?? 0)) % 4;
  const postType = POST_TYPES[seed];
  const scene    = SCENES[seed % SCENES.length];
  const mat      = req.material ? ` ${req.material}` : "";
  const note     = req.userNote ? ` ${req.userNote.slice(0, 60)}` : "";

  const caption = `Found this${mat} piece today.${note} Some things you just have to hold for a while before you know what to do with them.`;
  const altCaption = `Still${mat}. Still here.${req.status === "Available" ? " Open if the right person finds it." : ""}`;

  const imagePrompt = `Photorealistic cinematic still of a ${req.itemName.toLowerCase()}${mat ? ` made of ${mat}` : ""}, resting on a ${scene}. Natural afternoon light, shallow depth of field, earthy tones, no text, no people, documentary feel.`;

  return { postType, caption, altCaption, scene, imagePrompt };
}

// ─── Claude generation ────────────────────────────────────────────────────────

async function claudeStory(req: StoryRequest): Promise<StoryOutput> {
  const client = new Anthropic();

  const prompt = `You are the voice of The Kentucky Treehouse — a sourcing and storytelling brand for thrift and resale.

Your tone is:
- calm and grounded
- visual and specific
- reflective but not sentimental
- never salesy, never cheesy
- like a person who finds things and actually cares about them

You are generating a social post for a found item.

ITEM:
- Name: ${req.itemName}
- Material: ${req.material ?? "unknown"}
- Condition: ${req.condition ?? "unknown"}
- Status: ${req.status}
- User's note: ${req.userNote ? `"${req.userNote}"` : "none provided"}

POST TYPES (choose the best one):
- "Found in the Wild" — something discovered unexpectedly, raw, still in its original context
- "From the Treehouse" — something that has a story, been around, has a life to it
- "The Search" — the process of looking, the hunt itself, patience rewarded
- "Gone, but Kept" — something passed along, sold, shared — but not forgotten

SCENES (choose the most fitting):
- tree branch
- treehouse interior
- forest floor
- dirt road
- railroad track

Respond ONLY with valid raw JSON. No markdown. No explanation.

{
  "postType": "one of the four post types above",
  "caption": "primary caption — 1-3 sentences, grounded and specific, first person or observational, no hashtags",
  "altCaption": "alternate caption — different angle, shorter, could be standalone",
  "scene": "one of the five scene options above",
  "imagePrompt": "photorealistic image generation prompt — describe the item resting in the chosen scene, cinematic lighting, earthy, no people, no text, photographic style, 40-60 words"
}`;

  const response = await client.messages.create({
    model:      "claude-opus-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(raw) as StoryOutput;

  // Validate postType
  const validTypes: StoryPostType[] = ["Found in the Wild", "From the Treehouse", "The Search", "Gone, but Kept"];
  if (!validTypes.includes(parsed.postType)) parsed.postType = "Found in the Wild";

  return parsed;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as StoryRequest;

    if (!body.itemName) {
      return NextResponse.json({ error: "itemName required" }, { status: 400 });
    }

    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`[story] source=${hasKey ? "claude" : "mock"} item="${body.itemName}"`);

    const result = hasKey ? await claudeStory(body) : mockStory(body);

    console.log(`[story] postType="${result.postType}" scene="${result.scene}"`);
    return NextResponse.json(result);

  } catch (err) {
    console.error("[story] error:", err);
    // Return mock on any error so the UI always gets something
    try {
      const body = await req.clone().json() as StoryRequest;
      return NextResponse.json(mockStory(body));
    } catch {
      return NextResponse.json({
        postType:    "Found in the Wild",
        caption:     "Found this today. Something about it stood out.",
        altCaption:  "Still here.",
        scene:       "forest floor",
        imagePrompt: "Photorealistic cinematic still of a found object resting on a forest floor, natural light, earthy tones.",
      } satisfies StoryOutput);
    }
  }
}

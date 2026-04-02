// app/api/report-comps/route.ts
//
// Called when a user taps "Comps were off" in the decide page.
// Creates a record in the Notion "Comp Quality Reports" database.
// Requires NOTION_API_KEY in environment variables.

import { NextRequest, NextResponse } from "next/server";

const NOTION_DATABASE_ID = "1d8a154f62734a5fb963ae235983dc75";
const NOTION_API_VERSION = "2022-06-28";

export interface CompReportPayload {
  itemTitle:            string;
  searchQuery:          string;
  objectType?:          string | null;
  material?:            string | null;
  primaryColor?:        string | null;
  distinctiveFeatures?: string[];
  soldCompsCount:       number;
  activeCompsCount:     number;
  issue:                "No comps returned" | "Wrong items" | "Price range way off" | "Lot filter too aggressive" | "Color filter too aggressive";
}

export async function POST(req: NextRequest) {
  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) {
    // Fail silently — don't block the user if key not configured
    console.warn("[report-comps] NOTION_API_KEY not set — report dropped");
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const body = await req.json() as CompReportPayload;
    const featuresText = body.distinctiveFeatures?.join(", ") ?? "";

    const notionBody = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "Item Title": {
          title: [{ text: { content: body.itemTitle || "Unknown item" } }],
        },
        "Search Query": {
          rich_text: [{ text: { content: body.searchQuery || "" } }],
        },
        "Object Type": {
          rich_text: [{ text: { content: body.objectType || "" } }],
        },
        "Material": {
          rich_text: [{ text: { content: body.material || "" } }],
        },
        "Primary Color": {
          rich_text: [{ text: { content: body.primaryColor || "" } }],
        },
        "Distinctive Features": {
          rich_text: [{ text: { content: featuresText } }],
        },
        "Sold Comps Count":   { number: body.soldCompsCount },
        "Active Comps Count": { number: body.activeCompsCount },
        "Issue":  { select: { name: body.issue } },
        "Status": { select: { name: "New" } },
      },
    };

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization":    `Bearer ${notionKey}`,
        "Notion-Version":   NOTION_API_VERSION,
        "Content-Type":     "application/json",
      },
      body: JSON.stringify(notionBody),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[report-comps] Notion API error:", err);
      return NextResponse.json({ ok: true, notionError: true });
    }

    console.log(`[report-comps] logged: "${body.itemTitle}" — ${body.issue}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[report-comps] error:", err);
    return NextResponse.json({ ok: true }); // always fail silently
  }
}

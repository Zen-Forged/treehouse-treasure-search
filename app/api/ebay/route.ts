import { NextRequest, NextResponse } from "next/server";
import { getEbaySoldComps } from "@/lib/ebayClient";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  const category = req.nextUrl.searchParams.get("category") ?? undefined;

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing query parameter ?q=" },
      { status: 400 }
    );
  }

  try {
    const comps = await getEbaySoldComps(query.trim(), category);
    return NextResponse.json({ comps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[eBay API]", message);
    return NextResponse.json({ error: message, query }, { status: 500 });
  }
}
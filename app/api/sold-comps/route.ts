import { NextRequest, NextResponse } from "next/server";
import { getApifySoldComps } from "@/lib/apifyClient";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing query parameter ?q=" },
      { status: 400 }
    );
  }

  try {
    const result = await getApifySoldComps(query.trim());
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Sold Comps API]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
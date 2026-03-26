import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasApifyToken: !!process.env.APIFY_TOKEN,
    hasApifyActorId: !!process.env.APIFY_ACTOR_ID,
    actorId: process.env.APIFY_ACTOR_ID ?? "not set",
    hasEbayId: !!process.env.EBAY_CLIENT_ID,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  });
}
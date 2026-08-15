import { NextRequest, NextResponse } from "next/server";
import { fetchFoodNews, STATES } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state") ?? "All India";
  const key = STATES[state] !== undefined ? state : "All India";
  try {
    const items = await fetchFoodNews(key, 12);
    return NextResponse.json({ state: key, items, fetchedAt: Date.now() });
  } catch {
    return NextResponse.json({ state: key, items: [], error: "upstream_failed" }, { status: 502 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { fetchFoodNews, STATES } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state") ?? "All India";
  const force = req.nextUrl.searchParams.get("fresh") === "1";
  const key = STATES[state] !== undefined ? state : "All India";
  try {
    const { items, updatedAt } = await fetchFoodNews(key, 12, force);
    return NextResponse.json({ state: key, items, updatedAt });
  } catch {
    return NextResponse.json({ state: key, items: [], error: "upstream_failed" }, { status: 502 });
  }
}
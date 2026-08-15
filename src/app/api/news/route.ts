import { NextRequest, NextResponse } from "next/server";
import { fetchFoodNews, PIPELINE_VERSION, STATES } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state") ?? "All India";
  const key = STATES[state] !== undefined ? state : "All India";
  try {
    const items = await fetchFoodNews(key, 12);
    const probes = {
      strEsc: "\u00E2" === "â",
      reEsc: /\u00E2/.test("\u00E2"),
      reEsc2: /\u00C2-\u00E2/.test("\u00E2"),
      cpCheck: [..."\u00E2"].some((c) => c.codePointAt(0) === 0xE2),
    };
    const hasDirty = (s: string) => {
      for (const c of s) {
        const cp = c.codePointAt(0)!;
        if ((cp >= 0xc2 && cp <= 0xe2) || cp === 0xfffd || (cp >= 0x80 && cp <= 0x9f)) return true;
      }
      return false;
    };
    const dirty = items
      .filter((it) => hasDirty(it.title + it.snippet + it.source))
      .slice(0, 3)
      .map((it) => ({ title: it.title.slice(0, 80), chars: [...new Set(it.title + it.snippet + it.source)].filter((c) => c.codePointAt(0)! > 127).map((c) => "U+" + c.codePointAt(0)!.toString(16).toUpperCase()) }));
    return NextResponse.json({ state: key, pipeline: PIPELINE_VERSION, probes, dirty, items, fetchedAt: Date.now() });
  } catch {
    return NextResponse.json({ state: key, pipeline: PIPELINE_VERSION, items: [], error: "upstream_failed" }, { status: 502 });
  }
}
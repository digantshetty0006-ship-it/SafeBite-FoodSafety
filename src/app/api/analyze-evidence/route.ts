import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_INDICATORS, type AnalysisLevel } from "@/lib/food-image-analysis";

export const dynamic = "force-dynamic";

const PROMPT = `You are an AI assistant supporting Food Safety Officers in India (FSS Act, 2006 context). A citizen has uploaded complaint photos of a food business. Analyse the scene in the photo(s) and respond ONLY with JSON of this exact shape:
{"contamination":"HIGH|MEDIUM|LOW","hygiene":"HIGH|MEDIUM|LOW","evidenceQuality":<integer 0-100>,"indicators":["..."],"rationale":"one short sentence"}
- "contamination": visible contamination (spoiled/rotting food, foreign objects, stains, pests, dirt) in the frame.
- "hygiene": overall hygiene / sanitation of the visible area.
- "evidenceQuality": how useful the photo is as evidence (sharpness, focus, lighting, framing, legibility).
- "indicators": choose ONLY from these exact strings: ${ALLOWED_INDICATORS.join(", ")}. List only what is actually visible or clearly inferable. Empty array is valid.
- If the photo does not show a food-handling scene, use LOW/LOW and say so in the rationale. Do not speculate.`;

interface VisionResult {
  engine: "vision";
  evidenceQuality: number;
  contamination: AnalysisLevel;
  hygiene: AnalysisLevel;
  indicators: string[];
  rationale: string;
  confidence: number;
}

function sanitize(raw: unknown): VisionResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const level = (v: unknown): AnalysisLevel | null => (v === "HIGH" || v === "MEDIUM" || v === "LOW" ? v : null);
  const contamination = level(o.contamination);
  const hygiene = level(o.hygiene);
  const quality = typeof o.evidenceQuality === "number" ? Math.round(Math.max(0, Math.min(100, o.evidenceQuality))) : null;
  if (!contamination || !hygiene || quality === null) return null;
  const indicators = Array.isArray(o.indicators)
    ? o.indicators
        .filter((i): i is string => typeof i === "string")
        .map((i) => i.trim().toLowerCase())
        .filter((i) => (ALLOWED_INDICATORS as readonly string[]).includes(i))
        .slice(0, 6)
    : [];
  const rationale = typeof o.rationale === "string" ? o.rationale.slice(0, 220) : "";
  return {
    engine: "vision",
    contamination,
    hygiene,
    evidenceQuality: quality,
    indicators,
    rationale,
    confidence: 0.92,
  };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callGemini(images: string[]): Promise<VisionResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const parts = [
    { text: PROMPT },
    ...images.slice(0, 4).map((dataUrl) => {
      const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      return { inline_data: { mime_type: mime || "image/jpeg", data: base64 } };
    }),
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) return null;
  const body = await res.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") return null;
  return sanitize(extractJson(text));
}

async function callOpenAI(images: string[]): Promise<VisionResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const content = [
    { type: "text" as const, text: PROMPT },
    ...images.slice(0, 4).map((dataUrl) => ({ type: "image_url" as const, image_url: { url: dataUrl } })),
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      max_tokens: 400,
    }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  return sanitize(extractJson(text));
}

export async function POST(req: NextRequest) {
  let images: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.images)) {
      images = body.images
        .filter((i: unknown): i is string => typeof i === "string" && i.startsWith("data:image/"))
        .slice(0, 4);
    }
  } catch {
    return NextResponse.json({ engine: "on-device", error: "bad_request" }, { status: 400 });
  }
  if (images.length === 0) {
    return NextResponse.json({ engine: "on-device", error: "no_images" }, { status: 400 });
  }

  try {
    const result = (await callGemini(images)) ?? (await callOpenAI(images));
    if (result) return NextResponse.json(result);
    return NextResponse.json({ engine: "on-device", error: "vision_unavailable" });
  } catch {
    return NextResponse.json({ engine: "on-device", error: "vision_failed" });
  }
}
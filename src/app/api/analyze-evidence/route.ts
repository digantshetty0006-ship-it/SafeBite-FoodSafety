import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_INDICATORS, type AnalysisLevel } from "@/lib/food-image-analysis";

export const dynamic = "force-dynamic";

const PROMPT = `You are an experienced Food Safety Officer under the Food Safety and Standards Act, 2006 (India). A citizen has uploaded complaint photos of a food business. Inspect the scene like a trained inspector: identify ONLY what is actually VISIBLE in the photos, never speculate about what is outside the frame, and never overclaim.

Guidance:
- Spoilage: mold (fuzzy green/blue/grey/black growth), rot, slime, off-colour flesh, insects/pests (live or dead), rodent droppings, fly eggs, webbing.
- Foreign matter: hair, plastic, glass shards, insects in food, dirt, unidentified objects in food.
- Hygiene: unclean surfaces, grease/filth build-up, open garbage near food, bare-hand handling of ready-to-eat food, lack of gloves/hairnets where visible, soiled equipment, raw meat near ready-to-eat food.
- Be a good inspector: a busy kitchen, a dirty chopping board, or a rustic dining scene is NOT contamination. Red chutney is not blood; brown dal is not rot; a green garnish is not mold; rice grains are not maggots. Judge like an expert who has seen thousands of kitchens.
- Camera artifacts (blur, darkness, glare, colour cast, motion blur) reduce evidenceQuality but are NOT contamination.
- If no food-handling scene is visible, say so in the rationale and use LOW/LOW.

Respond ONLY with JSON of this exact shape:
{"contamination":"HIGH|MEDIUM|LOW","hygiene":"HIGH|MEDIUM|LOW","evidenceQuality":<integer 0-100>,"indicators":["..."],"rationale":"one short sentence"}
- "contamination": visible contamination in the frame (spoilage, pests, foreign matter, stains, dirt on food).
- "hygiene": overall sanitation of the visible area and food-handling practice.
- "evidenceQuality": usefulness as evidence (sharpness, focus, lighting, framing, legibility).
- "indicators": ONLY from these exact strings: ${ALLOWED_INDICATORS.join(", ")}. List only what is actually visible or clearly inferable; empty array is valid. A HIGH or MEDIUM level must correspond to at least one listed indicator.
- If the photo does not show a food-handling scene, use LOW/LOW and say so in the rationale. Do not speculate.`;

interface VisionResult {
  engine: "vision";
  evidenceQuality: number;
  contamination: AnalysisLevel;
  hygiene: AnalysisLevel;
  indicators: string[];
  rationale: string;
  confidence: number;
  model: string;
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
    model: o.model && typeof o.model === "string" ? o.model.slice(0, 40) : "",
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

async function callGemini(images: string[], model: string): Promise<VisionResult | null> {
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
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
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
  const parsed = extractJson(text);
  const result = sanitize(parsed);
  if (result) result.model = model;
  return result;
}

async function callOpenAI(images: string[]): Promise<VisionResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const content = [
    { type: "text" as const, text: PROMPT },
    ...images.slice(0, 4).map((dataUrl) => ({ type: "image_url" as const, image_url: { url: dataUrl } })),
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      max_tokens: 400,
    }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  const result = sanitize(extractJson(text));
  if (result) result.model = model;
  return result;
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
    // Best available first, cheaper/faster as fallback. All configurable via env.
    const geminiChain = [
      process.env.GEMINI_MODEL || "gemini-2.5-pro",
      "gemini-2.5-flash",
    ];
    let result: VisionResult | null = null;
    for (const model of geminiChain) {
      result = await callGemini(images, model);
      if (result) break;
    }
    result = result ?? (await callOpenAI(images));
    if (result) return NextResponse.json(result);
    return NextResponse.json({ engine: "on-device", error: "vision_unavailable" });
  } catch {
    return NextResponse.json({ engine: "on-device", error: "vision_failed" });
  }
}
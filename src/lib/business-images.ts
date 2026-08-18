import curated from "./business-images-map.json";

type CuratedMap = Record<string, { url: string; title: string }>;

const CURATED = curated as CuratedMap;

function placeholderUrl(name: string): string {
  const initial = (name.trim()[0] ?? "F").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#059669"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="140" font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function getBusinessImage(name: string, district: string): Promise<string> {
  const hit = CURATED[`${name}|${district}`];
  if (hit?.url) return hit.url;
  return placeholderUrl(name);
}
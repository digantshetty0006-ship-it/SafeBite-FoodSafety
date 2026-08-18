import data from "./business-data.json";

type InfoMap = Record<string, { imageUrl?: string; imageCredit?: string; placeId?: string; address?: string; rating?: number | null; userRatingCount?: number | null }>;

const INFO = data as InfoMap;

export interface BusinessInfo {
  imageUrl: string;
  imageCredit?: string;
  placeId?: string;
  googleAddress?: string;
  googleRating?: number | null;
  googleRatingCount?: number | null;
}

function placeholderUrl(name: string): string {
  const initial = (name.trim()[0] ?? "F").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#059669"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="140" font-weight="700" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function getBusinessInfo(name: string, district: string): Promise<BusinessInfo> {
  const hit = INFO[`${name}|${district}`];
  return {
    imageUrl: hit?.imageUrl ?? placeholderUrl(name),
    imageCredit: hit?.imageCredit,
    placeId: hit?.placeId,
    googleAddress: hit?.address,
    googleRating: hit?.rating ?? null,
    googleRatingCount: hit?.userRatingCount ?? null,
  };
}

export function directionsUrl(placeId: string | undefined, name: string, district: string): string {
  const base = "https://www.google.com/maps/dir/?api=1";
  if (placeId) return `${base}&destination=${encodeURIComponent(placeId)}`;
  return `${base}&destination=${encodeURIComponent(`${name}, ${district}`)}`;
}

export function mapsUrl(placeId: string | undefined, name: string, district: string): string {
  const base = "https://www.google.com/maps/search/?api=1";
  if (placeId) return `${base}&query=${encodeURIComponent(placeId)}`;
  return `${base}&query=${encodeURIComponent(`${name}, ${district}`)}`;
}

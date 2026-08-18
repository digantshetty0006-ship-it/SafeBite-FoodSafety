/**
 * Fetches Google Places data (New API) for every business and writes
 * src/lib/business-places.json — keyed by "Name|District".
 *
 * Works on the free tier for: id, displayName, formattedAddress, rating.
 * The `photos` field is only returned when billing is enabled on the
 * GCP project (Place Photos is a paid method); when photos come back,
 * this script also resolves the redirect to a stable googleusercontent
 * URL and stores it as `photoUrl` so the app never needs the key at runtime.
 *
 * Usage: node scripts/fetch-google-places.mjs
 * (reads NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from .env.local)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envRaw = readFileSync(join(root, ".env.local"), "utf8");
const key = envRaw.match(/^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="?([^"\n]+)"?/m)?.[1];
if (!key) {
  console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found in .env.local");
  process.exit(1);
}

const { Client } = (await import("pg")).default ? await import("pg") : await import("pg");
const client = new Client({
  connectionString: envRaw.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1],
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos";

async function searchText(textQuery) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  searchText ${res.status}: ${err.slice(0, 200)}`);
    return [];
  }
  const body = await res.json();
  return body.places ?? [];
}

function normalize(s) {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchScore(query, display) {
  const q = normalize(query);
  const d = normalize(display);
  if (!q || !d) return 0;
  if (d.includes(q) || q.includes(d)) return 1;
  const qt = q.split(" ");
  const dt = d.split(" ");
  const common = qt.filter((t) => dt.includes(t)).length;
  return common / Math.max(qt.length, dt.length);
}

function firstTokensEqual(query, display, n) {
  const q = normalize(query).split(" ");
  const d = normalize(display).split(" ");
  return q.slice(0, n).join(" ") === d.slice(0, n).join(" ");
}

function addressHasDistrict(address, district) {
  const d = normalize(district);
  if (!d) return true;
  const a = normalize(address);
  if (d === "mumbai") return /mumbai|maharashtra/.test(a);
  return a.includes(d);
}

function accepted(query, display, address, district) {
  const score = matchScore(query, display);
  if (score >= 0.75) return addressHasDistrict(address, district);
  if (score >= 0.5 && firstTokensEqual(query, display, 2)) return addressHasDistrict(address, district);
  return false;
}

async function resolvePhotoUrl(placeId, photo) {
  if (!photo?.name) return null;
  try {
    const media = await fetch(
      `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200&key=${key}`,
      { redirect: "manual" }
    );
    const loc = media.headers.get("location");
    if (loc) return loc;
    return null;
  } catch {
    return null;
  }
}

const rows = (await client.query("SELECT name, district FROM \"Business\" ORDER BY name")).rows;
const out = {};
let withPlaceId = 0;
let withPhotos = 0;

for (const b of rows) {
  const keyName = `${b.name}|${b.district}`;
  const query = `${b.name} ${b.district}`;
  const places = await searchText(query);
  let best = null;
  let bestScore = 0;
  for (const p of places) {
    const score = matchScore(b.name, p.displayName?.text ?? "");
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  if (!best || !accepted(b.name, best.displayName?.text ?? "", best.formattedAddress ?? "", b.district)) {
    console.log(`SKIP  ${keyName} (score ${bestScore.toFixed(2)} ${best?.displayName?.text ?? "no match"} / ${best?.formattedAddress?.slice(0, 50) ?? ""})`);
    continue;
  }
  out[keyName] = {
    placeId: best.id,
    address: best.formattedAddress,
    rating: typeof best.rating === "number" ? best.rating : null,
    userRatingCount: typeof best.userRatingCount === "number" ? best.userRatingCount : null,
  };
  withPlaceId++;
  if (Array.isArray(best.photos) && best.photos.length > 0) {
    withPhotos++;
    const url = await resolvePhotoUrl(best.id, best.photos[0]);
    if (url) out[keyName].photoUrl = url;
    console.log(`PHOTO ${keyName} -> ${url ? "resolved googleusercontent" : "media fetch failed"}`);
  } else {
    console.log(`OK    ${keyName} -> ${best.displayName?.text} (${best.formattedAddress?.slice(0, 60)})`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

writeFileSync(join(root, "src/lib/business-places.json"), JSON.stringify(out, null, 2));
console.log(`\nWrote src/lib/business-places.json: ${Object.keys(out).length} entries, ${withPlaceId} with placeId, ${withPhotos} with photoUrl`);
await client.end();
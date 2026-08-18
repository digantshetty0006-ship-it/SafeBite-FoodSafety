/**
 * Fills src/lib/business-places.json using Places API (New) autocomplete +
 * Place Details — endpoints with their own free-tier quotas (searchText quota
 * is tiny; run this after fetch-google-places.mjs hits 429).
 *
 * Usage: node scripts/fill-google-places.mjs
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

const { Client } = await import("pg");
const client = new Client({
  connectionString: envRaw.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1],
  ssl: { rejectUnauthorized: false },
});
await client.connect();

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
  return qt.filter((t) => dt.includes(t)).length / Math.max(qt.length, dt.length);
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

async function autocomplete(textQuery) {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({ input: textQuery, regionCode: "in" }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  autocomplete ${res.status}: ${err.slice(0, 150)}`);
    return [];
  }
  const body = await res.json();
  return body.suggestions ?? [];
}

async function placeDetails(placeId) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,rating,userRatingCount`,
    { headers: { "X-Goog-Api-Key": key } }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error(`  details ${res.status}: ${err.slice(0, 150)}`);
    return null;
  }
  return res.json();
}

let existing = {};
try {
  existing = JSON.parse(readFileSync(join(root, "src/lib/business-places.json"), "utf8"));
} catch {}

const rows = (await client.query("SELECT name, district FROM \"Business\" ORDER BY name")).rows;
let added = 0;
let failed = 0;

for (const b of rows) {
  const keyName = `${b.name}|${b.district}`;
  if (existing[keyName]) continue;
  const query = `${b.name} ${b.district}`;
  const suggs = await autocomplete(query);
  let best = null;
  let bestScore = 0;
  for (const s of suggs) {
    const pred = s.placePrediction;
    if (!pred) continue;
    const main = pred.structuredFormat?.mainText?.text ?? pred.text?.text ?? "";
    const score = matchScore(b.name, main);
    if (score > bestScore) {
      bestScore = score;
      best = pred;
    }
  }
  if (!best) {
    console.log(`FAIL  ${keyName} (no suggestions)`);
    failed++;
    continue;
  }
  const details = await placeDetails(best.placeId);
  if (!details) {
    console.log(`FAIL  ${keyName} (details)`);
    failed++;
    continue;
  }
  if (!accepted(b.name, details.displayName?.text ?? "", details.formattedAddress ?? "", b.district)) {
    console.log(`FAIL  ${keyName} (score ${bestScore.toFixed(2)} ${details.displayName?.text ?? ""} / ${details.formattedAddress?.slice(0, 50) ?? ""})`);
    failed++;
    continue;
  }
  existing[keyName] = {
    placeId: details.id,
    address: details.formattedAddress,
    rating: typeof details.rating === "number" ? details.rating : null,
    userRatingCount: typeof details.userRatingCount === "number" ? details.userRatingCount : null,
  };
  console.log(`OK    ${keyName} -> ${details.displayName?.text} (${details.formattedAddress?.slice(0, 60)})`);
  added++;
  await new Promise((r) => setTimeout(r, 300));
}

writeFileSync(join(root, "src/lib/business-places.json"), JSON.stringify(existing, null, 2));
console.log(`\nDone: +${added} added, ${failed} failed. Total ${Object.keys(existing).length} entries.`);
await client.end();
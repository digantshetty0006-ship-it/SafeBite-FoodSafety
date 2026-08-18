/**
 * Downloads accurate restaurant / signature-dish photos from Wikimedia Commons
 * into public/images/businesses/<slug>.jpg for every business in
 * business-data.json (using curated dish picks for the ones with no real
 * storefront photo, and re-downloading the existing Wikimedia URLs locally so
 * the site is fully self-contained).
 *
 * Usage: node scripts/download-restaurant-images.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(root, "public/images/businesses");
const data = JSON.parse(readFileSync(join(root, "src/lib/business-data.json"), "utf8"));

const ua = "SafeBiteDemo/1.0 (demo@demo.in)";

// Curated Commons file picks for restaurants that only have a food photo available.
const dishPicks = {
  "Copper Chimney - Seawoods": "File:Chicken makhani.jpg",
  "Courtyard Pavilion": "File:2018 SPb Courtyard Marriott Hotel.jpg",
  "Courtyard by Marriott Navi Mumbai": "File:Courtyard by Marriott Thomasville.jpg",
  "Foodway Inn Family Restaurant": "File:North Indian Thali.JPG",
  "Fusion Dine In": "File:Mexican Chicken Sizzler, Lake Mall Food Court, Kolkata.jpg",
  "Grace Restaurant": "File:A Thali, famous South Indian meal served on a banana leaf.jpg",
  "Legends Cafe": "File:Coffee and cake (8400386474).jpg",
  "MAISON DE CAFÉ": "File:Cafe croissant.jpg",
  "MALANG": "File:2020-02-22 20 57 16 Butter chicken in tomato sauce with fenugreek at Karma Modern Indian in Washington, D.C.jpg",
  "Maharashtra Lunch Home - Nerul": "File:Malvani fish thalli.jpg",
  "Masala Central": "File:Naan-and-Curry-1.jpg",
  "NERUL BITES": "File:Burger and fries 2.jpg",
  "Prithvish Restro Bar": "File:Beer and whisky at a hotel bar in Klagenfurt.jpg",
  "Rangoli Family Restaurant & Bar": "File:North Indian Vegetarian Thali-MB51.jpg",
  "Rasoi Restaurant & Bar": "File:Dal Makhani along with Naan.jpg",
  "Shree Nerul Cafe": "File:South Indian Breakfast Idli Vada Sambar Chutney.JPG",
  "The Stone Age Cafe": "File:Starmugs Cafe interior on Lordship Lane Tottenham London England 02.jpg",
  "Vintage Coffee Cafe": "File:A cup of cappuccino at Miettes Bakery, Graceville, Queensland, 2023.jpg",
  "Zaitoon The Restaurant": "File:Hyderabadi Biryani 2.jpg",
};

function slugify(key) {
  const name = key.split("|")[0].trim().toLowerCase();
  return (
    name
      .replace(/[’'&,.]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  ) + ".jpg";
}

async function resolveUrl(title, width = 1200) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=" +
    encodeURIComponent(title) +
    `&prop=imageinfo&iiprop=url|size&iiurlwidth=${width}`;
  const res = await fetch(url, { headers: { "User-Agent": ua } });
  if (!res.ok) throw new Error(`API ${res.status} for ${title}`);
  const body = await res.json();
  const pages = Object.values(body.query?.pages ?? {});
  const info = pages[0]?.imageinfo?.[0];
  if (!info) throw new Error(`no image info for ${title}`);
  return info.thumburl ?? info.url;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": ua } });
  if (!res.ok) throw new Error(`download ${res.status} for ${dest}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

const jobs = [];
for (const key of Object.keys(data)) {
  const name = key.split("|")[0];
  const dest = join(OUT_DIR, slugify(key));
  const existing = data[key].imageUrl;
  if (existing && /upload\.wikimedia\.org/.test(existing)) {
    jobs.push({ key, dest, source: existing });
  } else if (dishPicks[name]) {
    jobs.push({ key, dest, source: "commons:" + dishPicks[name] });
  } else {
    console.log(`KEEP  ${key} -> ${dest.split(/[\\/]/).pop()}`);
  }
}

let ok = 0;
let fail = 0;
for (const job of jobs) {
  try {
    const url = job.source.startsWith("commons:")
      ? await resolveUrl(job.source.slice("commons:".length))
      : job.source;
    const bytes = await download(url, job.dest);
    console.log(`OK    ${job.key} -> ${bytes} bytes (${job.dest.split(/[\\/]/).pop()})`);
    ok++;
  } catch (e) {
    console.log(`FAIL  ${job.key} -> ${e.message}`);
    fail++;
  }
  await new Promise((r) => setTimeout(r, 400));
}
console.log(`\nDone: ${ok} downloaded, ${fail} failed.`);

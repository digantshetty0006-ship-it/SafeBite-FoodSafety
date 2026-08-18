/**
 * Searches Wikimedia Commons for storefront photos of the real restaurants.
 * Dumps candidates for hand-curation.
 *
 * Usage: node scripts/fetch-commons-images.mjs
 */
const names = [
  "Britannia restaurant Mumbai", "Trishna restaurant Mumbai", "Kyani and Co",
  "Mahesh Lunch Home", "Elco Popsicle", "Cafe Mysore Matunga", "Candies Bandra",
  "Sardar Pav Bhaji", "Guru Kripa restaurant", "Jimis Burger", "Louis Burger Mumbai",
  "Gulshan-e-Iran", "Gajalee restaurant", "Cafe Good Luck Pune", "Marz-O-Rin",
  "Haldiram Nagpur", "K Rustom ice cream", "Bademiya", "Leopold Cafe",
  "Barbeque Nation", "Copper Chimney", "Zaitoon restaurant", "Aram vada pav",
  "Sadhana Misal", "Vaishali restaurant Pune", "Hotel Rajdhani Mumbai",
  "Shree Anand", "Cafe Goodluck",
];

const ua = "SafeBiteDemo/1.0 (demo@demo.in)";

async function search(q) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=" +
    encodeURIComponent(q) +
    "&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1200";
  const res = await fetch(url, { headers: { "User-Agent": ua } });
  if (!res.ok) return [];
  const body = await res.json();
  const pages = body.query?.pages ?? {};
  return Object.values(pages).map((p) => ({
    title: p.title,
    thumb: p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url ?? "",
    width: p.imageinfo?.[0]?.thumbwidth ?? 0,
    height: p.imageinfo?.[0]?.thumbheight ?? 0,
    desc: p.imageinfo?.[0]?.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, "").slice(0, 120) ?? "",
  }));
}

for (const n of names) {
  const results = await search(n);
  if (results.length === 0) {
    console.log(`NONE ${n}`);
    continue;
  }
  console.log(`### ${n}`);
  for (const r of results) {
    console.log(`  ${r.title} | ${r.width}x${r.height} | ${r.desc.slice(0, 80)} | ${r.thumb}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}
/**
 * Fetches Wikipedia page-image candidates for real restaurants so the
 * storefront photo can be curated by hand. Dumps a JSON report to stdout.
 *
 * Usage: node scripts/fetch-wiki-images.mjs
 */
const names = [
  "Britannia & Co.", "Trishna", "Kyani & Co.", "Mahesh Lunch Home", "Elco Popsicle",
  "Cafe Mysore", "Candies", "Sardar Pav Bhaji", "Guru Kripa", "Jimi's Burger",
  "Louis Burgers", "Gulshan-e-Iran", "Gajalee", "Cafe Goodluck", "Vaishali",
  "Marz-O-Rin", "Haldiram's", "K. Rustom Ice Cream", "Bademiya", "Leopold Cafe",
  "Barbeque Nation", "Copper Chimney", "Zaitoon", "Malang", "Aram Vada Pav",
  "Sadhana Misal", "Shree Anand", "Hotel Rajdhani", "Cafe Goodluck",
];

const ua = "SafeBiteDemo/1.0 (contact: demo@demo.in)";

async function getPageImage(title) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent(title) +
    "&prop=pageimages&pithumbsize=1200&format=json&redirects=1";
  const res = await fetch(url, { headers: { "User-Agent": ua } });
  if (!res.ok) return null;
  const body = await res.json();
  const pages = body.query?.pages ?? {};
  for (const p of Object.values(pages)) {
    if (p.thumbnail?.source) return { title: p.title, thumb: p.thumbnail.source, desc: p.pageprops?.page_image_free?.split("/").pop() ?? "" };
  }
  return null;
}

async function search(title) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" +
    encodeURIComponent(`${title} restaurant`) +
    "&srlimit=3&format=json";
  const res = await fetch(url, { headers: { "User-Agent": ua } });
  if (!res.ok) return [];
  const body = await res.json();
  return (body.query?.search ?? []).map((s) => s.title);
}

const out = {};
for (const n of names) {
  const direct = await getPageImage(n);
  if (direct) {
    out[n] = direct;
    console.log(`DIRECT ${n} => ${direct.title} | ${direct.thumb}`);
  } else {
    const titles = await search(n);
    for (const t of titles) {
      const img = await getPageImage(t);
      if (img) {
        out[n] = img;
        console.log(`SEARCH ${n} => ${img.title} | ${img.thumb}`);
        break;
      }
    }
    if (!out[n]) console.log(`NONE   ${n}`);
  }
  await new Promise((r) => setTimeout(r, 300));
}
console.log("\n=== JSON ===");
console.log(JSON.stringify(out, null, 2));
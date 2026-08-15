export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  snippet: string;
}

export const STATES: Record<string, string> = {
  "All India": "",
  Maharashtra: "Maharashtra",
  Delhi: "Delhi",
  Gujarat: "Gujarat",
  Karnataka: "Karnataka",
  "Tamil Nadu": "Tamil Nadu",
  Telangana: "Telangana",
  "West Bengal": "West Bengal",
  "Uttar Pradesh": "Uttar Pradesh",
  Punjab: "Punjab",
  Kerala: "Kerala",
  Rajasthan: "Rajasthan",
  "Madhya Pradesh": "Madhya Pradesh",
  Odisha: "Odisha",
  Bihar: "Bihar",
};

const CACHE_TTL = 15 * 60 * 1000;
const cache = new Map<string, { at: number; items: NewsItem[] }>();

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const PUBLISHER_FEEDS: { name: string; url: string }[] = [
  { name: "Indian Express", url: "https://indianexpress.com/feed/" },
  { name: "Times of India", url: "https://timesofindia.indiatimes.com/rssfeeds/1221656.cms" },
  { name: "Hindustan Times", url: "https://www.hindustantimes.com/feeds/rss/top-news/rssfeed.xml" },
  { name: "The Hindu", url: "https://www.thehindu.com/news/national/?service=rss" },
  { name: "BBC News India", url: "https://feeds.bbci.co.uk/news/world/asia/india/rss.xml" },
];

const FOOD_KEYWORDS =
  /fssai|food safety|food poisoning|food adulterat|adulterat|contaminat|hygiene|unhygienic|food recall|recall|expiry|expired|stale|pesticide|insect|rodent|labelling|labeling|licen[cs]e|suspended|sealed|raided|food business|restaurant|hotel|eatery|eateries|swiggy|zomato|street food|mid[- ]day meal|canteen|bakery|confectionery|ghee|paneer|milk|dairy|spice|masala|meat|poultry|seafood|food inspection|food regulator/i;

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function mergeItems(...lists: NewsItem[][]): NewsItem[] {
  const byTitle = new Map<string, NewsItem>();
  for (const it of lists.flat()) {
    const norm = normalizeTitle(it.title);
    if (!norm) continue;
    const cur = byTitle.get(norm);
    if (!cur || Date.parse(it.pubDate) > Date.parse(cur.pubDate)) byTitle.set(norm, it);
  }
  return [...byTitle.values()].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
}

async function fetchPublisherItems(state: string, limit: number): Promise<NewsItem[]> {
  const results = await Promise.all(
    PUBLISHER_FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          headers: { "user-agent": BROWSER_UA, accept: "application/rss+xml, text/xml, */*" },
          signal: AbortSignal.timeout(3000),
          cache: "no-store",
        });
        if (!res.ok) return [];
        const items = parseRss(await res.text(), 30);
        return items.map((it) => (it.source ? it : { ...it, source: f.name }));
      } catch {
        return [];
      }
    })
  );
  const stateLower = state === "All India" ? "" : state.toLowerCase();
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of results.flat()) {
    const hay = `${it.title} ${it.snippet}`.toLowerCase();
    if (!FOOD_KEYWORDS.test(hay)) continue;
    if (stateLower && !hay.includes(stateLower)) continue;
    const norm = normalizeTitle(it.title);
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(it);
  }
  out.sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
  return out.slice(0, limit);
}

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");
}

function repairUtf8(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c1 = s.charCodeAt(i);
    if (c1 === 0xe2 && i + 2 < s.length) {
      const c2 = s.charCodeAt(i + 1);
      const c3 = s.charCodeAt(i + 2);
      if (c2 >= 0x80 && c2 <= 0xbf && c3 >= 0x80 && c3 <= 0xbf) {
        const pair = c2 * 256 + c3;
        const map: Record<number, string> = {
          0x8099: "\u2019",
          0x809c: "\u201c",
          0x809d: "\u201d",
          0x8094: "\u2014",
          0x8093: "\u2013",
          0x80a6: "\u2026",
          0x80a2: "\u2022",
          0x8098: "\u2018",
        };
        out += map[pair] ?? "";
        i += 2;
        continue;
      }
    }
    if (c1 === 0xfffd) {
      out += "\u2019";
      continue;
    }
    out += s[i];
  }
  return out;
}

function cleanSnippet(raw: string): string {
  let s = stripHtml(raw)
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*(\d+\s*min(ute)?s?\s*(read)?\s*)/i, "")
    .trim();
  if (!s) return "";
  const srcIdx = s.search(/—\s*[A-Z][^—]{2,40}$|·\s*[A-Z][^·]{2,40}$/);
  if (srcIdx > 20) s = s.slice(0, srcIdx).trim();
  return s;
}

async function fetchArticleMeta(link: string): Promise<{ snippet: string; date: number }> {
  try {
    const res = await fetch(link, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; FoodShield/1.0)" },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return { snippet: "", date: 0 };
    const html = await res.text();
    const grab = (re: RegExp) => {
      const m = html.match(re);
      return m ? m[1].trim() : "";
    };
    const desc =
      grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      grab(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
      grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      grab(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    const clean = desc.replace(/\s+/g, " ").replace(/&amp;/g, "&").trim();
    let date = 0;
    const dateProbes = [
      /<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:modified_time["']/i,
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
      /"dateModified"\s*:\s*"([^"]+)"/i,
      /"datePublished"\s*:\s*"([^"]+)"/i,
    ];
    for (const re of dateProbes) {
      const raw = grab(re);
      if (!raw) continue;
      const t = Date.parse(raw);
      if (!Number.isNaN(t) && t > date) date = t;
    }
    return { snippet: clean.length > 120 ? clean : "", date };
  } catch {
    return { snippet: "", date: 0 };
  }
}

function parseRss(xml: string, limit: number): NewsItem[] {
  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const b = m[1];
    const grab = (tag: string) => {
      const mm = b.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "is"));
      return mm ? repairUtf8(decodeXml(mm[1].trim())) : "";
    };
    let title = stripHtml(grab("title"));
    const link = grab("link");
    const source = stripHtml(grab("source"));
    const pubDate = grab("pubDate");
    let snippet = cleanSnippet(grab("description"));
    if (!title || !link) continue;
    const srcLower = source.toLowerCase();
    const sepMatch = title.match(/\s-\s([^-]{2,60})$/);
    if (sepMatch && srcLower && sepMatch[1].toLowerCase() === srcLower) {
      title = title.slice(0, sepMatch.index ?? title.length).trim();
    }
    if (srcLower && snippet.toLowerCase().endsWith(srcLower)) {
      snippet = snippet.slice(0, snippet.length - source.length).replace(/[\s…–—-]+$/, "").trim();
    }
    items.push({ title, link, source, pubDate, snippet });
  }
  return items;
}

async function fetchBing(q: string, limit: number): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        accept: "application/rss+xml, text/xml, */*",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return parseRss(await res.text(), limit);
  } catch {
    return [];
  }
}

export async function fetchFoodNews(state: string, limit = 12): Promise<{ items: NewsItem[]; updatedAt: number }> {
  const key = state || "All India";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return { items: hit.items.slice(0, limit), updatedAt: hit.at };

  const q =
    key === "All India"
      ? "(FSSAI OR food safety India OR food poisoning OR food adulteration)"
      : `(${key}) AND (food safety OR FSSAI OR food poisoning OR adulteration OR hygiene)`;

  const bingQ = key === "All India" ? "food safety FSSAI India" : `${key} food safety`;

  let items = mergeItems(await fetchBing(bingQ, limit), await fetchPublisherItems(key, limit));
  if (items.length === 0) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) items = parseRss(await res.text(), limit);
    } catch {
      items = [];
    }
  }
  items = items.slice(0, limit);
  if (items.length === 0) throw new Error("news upstream unreachable");

  for (const it of items) {
    const a = it.title.toLowerCase();
    const b = it.snippet.toLowerCase();
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (i >= 15) {
      if (it.snippet.length - i < 40) {
        it.snippet = "";
      } else {
        it.snippet = it.snippet.slice(i).replace(/^[\s:…–—-]+/, "").trim();
      }
    }
  }

  items.sort((a, b) => {
    const ta = Date.parse(a.pubDate);
    const tb = Date.parse(b.pubDate);
    const A = Number.isNaN(ta) ? 0 : ta;
    const B = Number.isNaN(tb) ? 0 : tb;
    return B - A;
  });

  await Promise.all(
    items.map(async (it) => {
      const probe = await fetchArticleMeta(it.link);
      if (!it.snippet && probe.snippet) it.snippet = probe.snippet;
      if (probe.date > 0) {
        const cur = Date.parse(it.pubDate);
        if (Number.isNaN(cur) || probe.date > cur) it.pubDate = new Date(probe.date).toISOString();
      }
    })
  );

  items.sort((a, b) => {
    const ta = Date.parse(a.pubDate);
    const tb = Date.parse(b.pubDate);
    const A = Number.isNaN(ta) ? 0 : ta;
    const B = Number.isNaN(tb) ? 0 : tb;
    return B - A;
  });

  for (const it of items) {
    it.title = repairUtf8(it.title);
    it.snippet = repairUtf8(it.snippet);
    it.source = repairUtf8(it.source);
  }

  cache.set(key, { at: Date.now(), items });
  return { items, updatedAt: Date.now() };
}
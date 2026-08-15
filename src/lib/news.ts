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
  return s
    .replace(/â€™/g, "’")
    .replace(/â€œ/g, "“")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€¦/g, "…")
    .replace(/â€¢/g, "•")
    .replace(/â€/g, "”")
    .replace(/\u00E2\u0080\u0099/g, "’")
    .replace(/\u00E2\u0080\u009C/g, "“")
    .replace(/\u00E2\u0080\u009D/g, "”")
    .replace(/\u00E2\u0080\u0094/g, "—")
    .replace(/\u00E2\u0080\u0093/g, "–")
    .replace(/\u00E2\u0080\u00A6/g, "…")
    .replace(/\u00E2\u0080\u00A2/g, "•")
    .replace(/\u00E2[\u0080-\u00BF]{2}/g, "")
    .replace(/\uFFFD\?{1,3}/g, "’")
    .replace(/\uFFFD/g, "’");
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

async function fetchSummary(link: string): Promise<string> {
  try {
    const res = await fetch(link, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; FoodShield/1.0)" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return "";
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
    return clean.length > 120 ? clean : "";
  } catch {
    return "";
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

export async function fetchFoodNews(state: string, limit = 12): Promise<NewsItem[]> {
  const key = state || "All India";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.items.slice(0, limit);

  const q =
    key === "All India"
      ? "(FSSAI OR food safety India OR food poisoning OR food adulteration)"
      : `(${key}) AND (food safety OR FSSAI OR food poisoning OR adulteration OR hygiene)`;

  const bingQ = key === "All India" ? "food safety FSSAI India" : `${key} food safety`;

  let items = await fetchBing(bingQ, limit);
  if (items.length === 0) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) items = parseRss(await res.text(), limit);
    } catch {
      items = [];
    }
  }
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
      if (!it.snippet) it.snippet = await fetchSummary(it.link);
    })
  );

  cache.set(key, { at: Date.now(), items });
  return items;
}
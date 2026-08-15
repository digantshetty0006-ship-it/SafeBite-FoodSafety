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

export async function fetchFoodNews(state: string, limit = 12): Promise<NewsItem[]> {
  const key = state || "All India";
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.items.slice(0, limit);

  const q =
    key === "All India"
      ? "(FSSAI OR food safety India OR food poisoning OR food adulteration)"
      : `(${key}) AND (food safety OR FSSAI OR food poisoning OR adulteration OR hygiene)`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`news upstream ${res.status}`);
  const xml = await res.text();

  const items: NewsItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const b = m[1];
    const grab = (tag: string) => {
      const mm = b.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "s"));
      return mm ? decodeXml(mm[1].trim()) : "";
    };
    let title = stripHtml(grab("title"));
    const link = grab("link");
    const source = stripHtml(grab("source"));
    const pubDate = grab("pubDate");
    const snippet = cleanSnippet(grab("description"));
    if (!title || !link) continue;
    const sep = title.lastIndexOf(" - ");
    if (sep > 10 && title.slice(sep + 3) === source) title = title.slice(0, sep);
    items.push({ title, link, source, pubDate, snippet });
  }

  cache.set(key, { at: Date.now(), items });
  return items;
}
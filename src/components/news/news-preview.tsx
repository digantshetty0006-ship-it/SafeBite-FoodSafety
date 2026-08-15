"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { NewsItem } from "@/lib/news";

function relativeTime(pubDate: string): string {
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NewsPreview({ state }: { state: string }) {
  const { t } = useLocale();
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    fetch(`/api/news?state=${encodeURIComponent(state)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => {
      fetch(`/api/news?state=${encodeURIComponent(state)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setItems(d.items ?? []))
        .catch(() => {});
    }, 15.5 * 60 * 1000);
    return () => clearInterval(id);
  }, [state]);

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{t("home.newsTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("home.newsSub")}</p>
          </div>
        </div>
        <Link href="/news" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
          {t("home.viewAllNews")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 divide-y">
        {items === null
          ? [0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)
          : items.slice(0, 5).map((n, i) => (
              <a
                key={`${n.link}-${i}`}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 py-3 transition hover:bg-muted/40"
              >
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t("news.published", { t: relativeTime(n.pubDate) })}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium leading-snug group-hover:text-primary">
                  {n.title}
                </p>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            ))}
        {items !== null && items.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("news.noNews")}</p>
        )}
      </div>
    </div>
  );
}
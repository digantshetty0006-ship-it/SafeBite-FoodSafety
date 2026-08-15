"use client";

import { useEffect, useState, useCallback } from "react";
import { Newspaper, RefreshCw, ArrowUpRight } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { NewsItem } from "@/lib/news";

function relativeTime(pubDate: string): string {
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return "";
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NewsList({ state, initial }: { state: string; initial: NewsItem[] | null }) {
  const { t } = useLocale();
  const [items, setItems] = useState<NewsItem[] | null>(initial);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch(`/api/news?state=${encodeURIComponent(state)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setItems(data.items ?? []);
      if (typeof data.updatedAt === "number") setUpdatedAt(data.updatedAt);
    } catch {
      setError(true);
    }
  }, [state]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 15.5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">{t("news.error")}</p>
        <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <RefreshCw className="h-3.5 w-3.5" /> {t("news.retry")}
        </button>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" /> {t("news.loading")}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        <Newspaper className="mx-auto mb-2 h-6 w-6 opacity-50" />
        {t("news.noNews")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {updatedAt && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("news.updated", { t: relativeTime(new Date(updatedAt).toISOString()) })}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t("news.refresh")}
          </button>
        </div>
      )}
      {items.map((n, i) => (
        <article key={`${n.link}-${i}`} className="group overflow-hidden rounded-2xl border bg-card transition hover:border-primary/40 hover:shadow-md">
          <a href={n.link} target="_blank" rel="noopener noreferrer" className="block p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {t("news.published", { t: relativeTime(n.pubDate) })}
              </span>
              <span>{n.source || "News"}</span>
            </div>
            <h3 className="mt-2.5 text-lg font-bold leading-snug tracking-tight group-hover:text-primary">{n.title}</h3>

            {n.snippet && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.snippet}</p>
            )}

            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {t("news.readMore")}
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </a>
        </article>
      ))}
    </div>
  );
}
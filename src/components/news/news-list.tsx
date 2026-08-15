"use client";

import { useEffect, useState, useCallback } from "react";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
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
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    setItems(null);
    try {
      const res = await fetch(`/api/news?state=${encodeURIComponent(state)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setError(true);
    }
  }, [state]);

  useEffect(() => {
    load();
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
    <div className="grid gap-3">
      {items.map((n, i) => (
        <a
          key={`${n.link}-${i}`}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
        >
          <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {relativeTime(n.pubDate)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug group-hover:text-primary">{n.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              {n.source || "News"}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
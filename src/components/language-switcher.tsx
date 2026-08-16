"use client";

import { cn } from "@/lib/utils";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ current, className }: { current: Lang; className?: string }) {
  const set = (l: Lang) => {
    if (l === current) return;
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    // Full navigation instead of router.refresh(): the language cookie feeds
    // server-rendered layout content (header, sidebar) and client locale
    // providers. router.refresh() can serve stale router-cache or
    // back/forward-cache state, leaving the chrome in the old language.
    const url = window.location.pathname + window.location.search + window.location.hash;
    window.location.href = url;
  };
  return (
    <div className={cn("inline-flex items-center rounded-full border bg-background/80 text-xs font-medium shadow-sm", className)}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            l === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {LANG_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
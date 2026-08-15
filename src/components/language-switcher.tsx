"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ current, className }: { current: Lang; className?: string }) {
  const router = useRouter();
  const set = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
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
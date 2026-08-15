"use client";

import { createContext, useContext, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";

interface LocaleCtx {
  lang: Lang;
  t: (key: string, vars?: Record<string, string>) => string;
}

const Ctx = createContext<LocaleCtx>({ lang: "en", t: (k) => k });

export function LocaleProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const [state] = useState<LocaleCtx>(() => ({ lang, t: (k, vars) => tr(lang, k, vars) }));
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx);
}
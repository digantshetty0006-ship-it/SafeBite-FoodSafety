"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Building2, ShieldCheck, ShieldAlert, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { categoryLabel } from "@/lib/format";
import { tr, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BusinessHit {
  id: string;
  name: string;
  district: string;
  category: string;
  address: string;
  riskScore: number;
  riskTier: string;
}

const TIER_GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  B: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  C: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  D: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const GRADE_NOTE_KEYS: Record<string, string> = {
  A: "lookup.gradeA",
  B: "lookup.gradeB",
  C: "lookup.gradeC",
  D: "lookup.gradeD",
};

export function LookupResults({ businesses, lang }: { businesses: BusinessHit[]; lang: Lang }) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return businesses.slice(0, 12);
    return businesses
      .filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.district.toLowerCase().includes(term) ||
          categoryLabel(lang, b.category).toLowerCase().includes(term)
      )
      .slice(0, 20);
  }, [q, businesses, lang]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("lookup.searchPlaceholder")} className="pl-8" />
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {t("lookup.noResults", { q })}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="truncate font-medium">{b.name}</p>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {b.district}
                    </span>
                    <span>{categoryLabel(lang, b.category)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold",
                        TIER_GRADE_STYLES[b.riskTier]
                      )}
                    >
                      {b.riskTier}
                    </div>
                    <p className="mt-1 text-center text-[10px] text-muted-foreground">{t(GRADE_NOTE_KEYS[b.riskTier] ?? "lookup.gradeD")}</p>
                  </div>
                  <Link
                    href={`/citizen/report?business=${encodeURIComponent(b.name)}`}
                    className="flex h-9 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-muted-foreground transition hover:border-red-300 hover:text-red-600"
                    title={t("lookup.reportTitle")}
                  >
                    <Megaphone className="h-3.5 w-3.5" /> {t("lookup.report")}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        {q ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <ShieldAlert className="h-4 w-4 text-amber-600" />}
        {t("lookup.gradeNote")}
      </div>
    </div>
  );
}

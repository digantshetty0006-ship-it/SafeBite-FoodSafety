"use client";

import { useMemo, useState } from "react";
import { Truck, Search, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tr, type Lang } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

export interface SupplierGroup {
  name: string;
  categories: string[];
  products: string[];
  locations: string[];
  licences: string[];
  lastDeliveries: Date[];
  businesses: { id: string; name: string; district: string }[];
}

const SUPPLIER_CATEGORIES = [
  "Water",
  "Vegetables",
  "Meat",
  "Dairy",
  "Seafood",
  "Grains",
  "Packaged Food",
  "Beverages",
  "Spices",
  "Other",
];

export function SupplierNetwork({
  groups,
  lang,
}: {
  groups: SupplierGroup[];
  lang: Lang;
}) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<SupplierGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => {
      const nameOk = !q || g.name.toLowerCase().includes(q);
      const catOk = category === "all" || g.categories.includes(category);
      return nameOk && catOk;
    });
  }, [groups, query, category]);

  const newestDelivery = (g: SupplierGroup): Date | null => {
    if (g.lastDeliveries.length === 0) return null;
    return g.lastDeliveries.reduce((a, b) => (a.getTime() > b.getTime() ? a : b));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("sn.searchPlaceholder")}
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("sn.allCategories")}</SelectItem>
            {SUPPLIER_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {tr(lang, `scat.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("sn.count", { n: String(filtered.length) })} · {t("sn.notice")}
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <Truck className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">{t("sn.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <button
              key={g.name}
              type="button"
              onClick={() => setSelected(g)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{g.name}</p>
                  {g.categories.map((c) => (
                    <Badge key={c} variant="outline" className="whitespace-nowrap">
                      {tr(lang, `scat.${c}`)}
                    </Badge>
                  ))}
                </div>
                {g.products.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {g.products.join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {t("sn.usedBy", { n: String(g.businesses.length) })}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {selected.name}
                  {selected.categories.map((c) => (
                    <Badge key={c} variant="outline">
                      {tr(lang, `scat.${c}`)}
                    </Badge>
                  ))}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selected.products.length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{t("supp.productsLbl")}: </span>
                    {selected.products.join(" · ")}
                  </p>
                )}
                {selected.locations.length > 0 && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{t("supp.location")}: </span>
                    {selected.locations.join(" · ")}
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{t("supp.licence")}: </span>
                  {selected.licences.length ? selected.licences.join(" · ") : t("supp.licenceNone")}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{t("supp.lastDelivery")}: </span>
                  {newestDelivery(selected)
                    ? formatDate(newestDelivery(selected))
                    : t("supp.deliveryNone")}
                </p>

                <div className="border-t pt-3">
                  <p className="mb-2 flex items-center gap-1.5 font-medium">
                    <Building2 className="h-4 w-4" /> {t("sn.restaurants")}
                  </p>
                  <div className="space-y-1.5">
                    {selected.businesses.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <span className="font-medium">{b.name}</span>
                        <span className="text-xs text-muted-foreground">{b.district}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  {t("supp.cancel")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

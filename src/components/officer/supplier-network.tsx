"use client";

import { useMemo, useState } from "react";
import {
  Truck,
  Share2,
  Building2,
  AlertTriangle,
  Search,
  Download,
  Eye,
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupplierNetworkMap, type MapPoint } from "./supplier-network-map";
import { tr, type Lang } from "@/lib/i18n";
import { formatDate, timeAgo } from "@/lib/format";

export interface SupplierGroup {
  name: string;
  categories: string[];
  products: string[];
  locations: string[];
  licences: string[];
  lastDeliveries: Date[];
  businesses: { id: string; name: string; district: string; lat: number; lng: number }[];
  risk: "high" | "medium" | null;
  issue: string | null;
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

function riskTone(risk: "high" | "medium" | null): string {
  if (risk === "high") return "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300";
  if (risk === "medium") return "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300";
}

export function SupplierNetwork({
  groups,
  alerts,
  stats,
  districts,
  mapPoints,
  lang,
}: {
  groups: SupplierGroup[];
  alerts: SupplierGroup[];
  stats: { total: number; common: number; restaurants: number; highRisk: number };
  districts: string[];
  mapPoints: MapPoint[];
  lang: Lang;
}) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");
  const [district, setDistrict] = useState("all");
  const [selected, setSelected] = useState<SupplierGroup | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => {
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (category !== "all" && !g.categories.includes(category)) return false;
      if (risk !== "all" && g.risk !== risk) return false;
      if (district !== "all" && !g.businesses.some((b) => b.district === district)) return false;
      return true;
    });
  }, [groups, query, category, risk, district]);

  const filteredAlerts = useMemo(() => {
    const names = new Set(filtered.map((g) => g.name.toLowerCase()));
    return alerts.filter((g) => names.has(g.name.toLowerCase()));
  }, [alerts, filtered]);

  const newestDelivery = (g: SupplierGroup): Date | null => {
    if (g.lastDeliveries.length === 0) return null;
    return g.lastDeliveries.reduce((a, b) => (a.getTime() > b.getTime() ? a : b));
  };

  const onExport = () => {
    const header = ["Supplier", "Category", "Products", "Location", "Licence", "Restaurants", "Risk"];
    const lines = filtered.map((g) =>
      [
        g.name,
        g.categories.join(" / "),
        g.products.join(" / "),
        g.locations.join(" / "),
        g.licences.join(" / "),
        String(g.businesses.length),
        g.risk === "high" ? "High" : g.risk === "medium" ? "Medium" : "Low",
      ]
        .map((c) => `"${c.replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supplier-network.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("sn.totalSuppliers")} value={stats.total} icon={Truck} hint={t("sn.acrossAll")} />
        <KpiCard label={t("sn.commonSuppliers")} value={stats.common} icon={Share2} hint={t("sn.sharedBy2")} />
        <KpiCard label={t("sn.restaurantsConnected")} value={stats.restaurants} icon={Building2} hint={t("sn.toThese")} />
        <KpiCard
          label={t("sn.highRiskSuppliers")}
          value={stats.highRisk}
          icon={AlertTriangle}
          tone={stats.highRisk ? "danger" : "default"}
          hint={t("sn.requireAttention")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("sn.searchPlaceholder")}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
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
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("sn.allRiskLevels")}</SelectItem>
              <SelectItem value="high">{t("sn.highRisk")}</SelectItem>
              <SelectItem value="medium">{t("sn.mediumRisk")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("sn.allDistricts")}</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onExport} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" /> {t("sn.exportReport")}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("sn.count", { n: String(filtered.length) })}</p>

      {/* Common suppliers + network map */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>{t("sn.commonTitle")}</CardTitle>
            <CardDescription>{t("sn.sharedByMany")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <Truck className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium">{t("sn.empty")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4">{t("supp.name")}</TableHead>
                    <TableHead>{t("supp.category")}</TableHead>
                    <TableHead className="max-w-40">{t("supp.productsLbl")}</TableHead>
                    <TableHead className="text-right">{t("sn.restaurantsCol")}</TableHead>
                    <TableHead className="w-24 text-right">{t("sn.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.name}>
                      <TableCell className="px-4">
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.locations[0] ? g.locations[0] : ""}
                          {g.licences[0] ? ` · ${t("supp.licence")} ${g.licences[0]}` : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {g.categories.map((c) => (
                            <Badge key={c} variant="outline" className="whitespace-nowrap">
                              {tr(lang, `scat.${c}`)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-muted-foreground">
                        {g.products.join(" · ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {t("sn.usedBy", { n: String(g.businesses.length) })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(g)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> {t("sn.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>{t("sn.networkTitle")}</CardTitle>
            <CardDescription>{t("sn.networkSub")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-72">
              <SupplierNetworkMap points={mapPoints} lang={lang} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t("sn.alertsTitle")}</CardTitle>
          <CardDescription>{t("sn.alertsSub")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAlerts.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium">{t("sn.noAlerts")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">{t("sn.risk")}</TableHead>
                  <TableHead>{t("supp.name")}</TableHead>
                  <TableHead>{t("sn.issue")}</TableHead>
                  <TableHead>{t("sn.lastFlagged")}</TableHead>
                  <TableHead className="w-28 text-right">{t("sn.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((g) => (
                  <TableRow key={g.name}>
                    <TableCell className="px-4">
                      <Badge className={riskTone(g.risk)}>
                        {g.risk === "high" ? t("sn.highRisk") : t("sn.mediumRisk")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {g.issue === "missingLicence" ? t("sn.missingLicence") : t("sn.noRecentDelivery")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {newestDelivery(g) ? timeAgo(newestDelivery(g) as Date) : t("sn.never")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelected(g)}>
                        {t("sn.viewDetails")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
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
                {selected.risk && (
                  <p>
                    <Badge className={riskTone(selected.risk)}>
                      {selected.risk === "high" ? t("sn.highRisk") : t("sn.mediumRisk")}
                    </Badge>
                  </p>
                )}
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

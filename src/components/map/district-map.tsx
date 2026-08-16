"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X, CornerDownLeft, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabel, complaintStatusLabel, formatDate, formatDateTime } from "@/lib/format";
import { tr, type Lang } from "@/lib/i18n";
import { RiskBadge } from "@/components/risk-badge";
import Link from "next/link";

export interface MapBusiness {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskScore: number;
  district: string;
  category: string;
  lastInspection: Date | string | null;
}

export interface DistrictAgg {
  name: string;
  avgScore: number;
  count: number;
  lat: number;
  lng: number;
  critical: number;
}

export interface MapComplaint {
  id: string;
  reference: string;
  status: string;
  description: string;
  lat: number;
  lng: number;
  createdAt: Date | string;
  escalated: boolean;
  businessId: string | null;
  businessName: string | null;
  businessDistrict: string | null;
}

export function riskColor(score: number): string {
  const t = Math.min(100, Math.max(0, score)) / 100;
  const hue = 120 - t * 120; // 120 (green) -> 0 (red)
  return `hsl(${hue}, 72%, 45%)`;
}

export function complaintColor(status: string, escalated: boolean): string {
  if (escalated) return "#dc2626";
  switch (status) {
    case "submitted":
      return "#f59e0b";
    case "under_review":
      return "#3b82f6";
    case "inspection_scheduled":
      return "#8b5cf6";
    case "resolved":
      return "#10b981";
    default:
      return "#f59e0b";
  }
}

const COMPLAINT_STATUSES = ["submitted", "under_review", "inspection_scheduled", "resolved"];

function FlyToController({ target }: { target: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (target && prev.current !== `${target.lat},${target.lng},${target.zoom}`) {
      prev.current = `${target.lat},${target.lng},${target.zoom}`;
      map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

export function DistrictMap({
  businesses,
  districts,
  complaints = [],
  lang,
}: {
  businesses: MapBusiness[];
  districts: DistrictAgg[];
  complaints?: MapComplaint[];
  lang: Lang;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [layer, setLayer] = useState<"business" | "complaints" | "both">("both");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const markerRefs = useRef(new Map<string, LeafletCircleMarker>());
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  useEffect(() => setReady(true), []);

  const visible = useMemo(
    () => (selectedDistrict ? businesses.filter((b) => b.district === selectedDistrict) : businesses),
    [businesses, selectedDistrict]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return businesses
      .filter(
        (b) => b.name.toLowerCase().includes(q) || b.district.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, businesses]);

  const selectBusiness = (b: MapBusiness) => {
    setQuery(b.name);
    setSelectedDistrict(b.district);
    setFlyTarget({ lat: b.lat, lng: b.lng, zoom: 13 });
    setTimeout(() => {
      markerRefs.current.get(b.id)?.openPopup();
    }, 500);
  };

  const clearSearch = () => {
    setQuery("");
    setFlyTarget(null);
  };

  const visibleComplaints = useMemo(() => {
    const inDistrict = selectedDistrict
      ? complaints.filter((c) => c.businessDistrict === selectedDistrict || c.businessDistrict === null)
      : complaints;
    if (statusFilter === "all") return inDistrict;
    return inDistrict.filter((c) => (statusFilter === "escalated" ? c.escalated : c.status === statusFilter));
  }, [complaints, selectedDistrict, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of complaints) {
      if (c.escalated) counts.set("escalated", (counts.get("escalated") ?? 0) + 1);
      else counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    }
    return counts;
  }, [complaints]);

  const layerTabs: Array<{ key: "business" | "complaints" | "both"; label: string }> = [
    { key: "business", label: t("map.layerBusinesses") },
    { key: "complaints", label: t("map.layerComplaints") },
    { key: "both", label: t("map.layerBoth") },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* District list */}
      <div className="space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("map.searchPlaceholder")}
            className="flex h-10 w-full rounded-lg border bg-background pl-8 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {query && matches.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
            {matches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => selectBusiness(b)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: riskColor(b.riskScore) }} />
                  <span className="truncate font-medium">{b.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">{b.district}</span>
                  <CornerDownLeft className="h-3 w-3 text-muted-foreground/60" />
                </span>
              </button>
            ))}
          </div>
        )}
        {query && matches.length === 0 && (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {t("map.noMatch", { q: query })}
          </p>
        )}

        <button
          onClick={() => {
            setSelectedDistrict(null);
            setQuery("");
            setFlyTarget(null);
          }}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border p-3 text-left transition",
            selectedDistrict === null ? "border-primary bg-primary/5" : "hover:bg-accent"
          )}
        >
          <div>
            <p className="font-medium">{t("biz.allDistricts")}</p>
            <p className="text-xs text-muted-foreground">{t("map.businessCount", { n: String(businesses.length) })}</p>
          </div>
          <span className="font-mono text-sm font-semibold">—</span>
        </button>
        {districts
          .slice()
          .sort((a, b) => b.avgScore - a.avgScore)
          .map((d) => (
            <button
              key={d.name}
              onClick={() => {
                setSelectedDistrict(selectedDistrict === d.name ? null : d.name);
                setQuery("");
                setFlyTarget(null);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-3 text-left transition",
                selectedDistrict === d.name ? "border-primary bg-primary/5" : "hover:bg-accent"
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: riskColor(d.avgScore) }} />
                  <p className="font-medium">{d.name}</p>
                </div>
                <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
                  {t("map.districtSummary", { n: String(d.count), m: String(d.critical) })}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums">{Math.round(d.avgScore)}</span>
            </button>
          ))}
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">{t("map.colourScale")}</p>
          <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{t("map.lowRisk")}</span>
            <span>{t("map.highRisk")}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="space-y-2">
        {/* Layer + status controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
            {layerTabs.map((l) => (
              <button
                key={l.key}
                type="button"
                onClick={() => setLayer(l.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 transition",
                  layer === l.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {layer !== "business" && complaints.length > 0 && (
            <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "rounded-md px-2.5 py-1.5 transition",
                  statusFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("map.filterAll")} ({complaints.length})
              </button>
              {COMPLAINT_STATUSES.map((s) => {
                const n = statusCounts.get(s) ?? 0;
                if (n === 0) return null;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition",
                      statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: complaintColor(s, false) }} />
                    {complaintStatusLabel(lang, s)} ({n})
                  </button>
                );
              })}
              {(statusCounts.get("escalated") ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === "escalated" ? "all" : "escalated")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition",
                    statusFilter === "escalated"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: "#dc2626" }} />
                  {t("map.escalatedBadge")} ({statusCounts.get("escalated")})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="h-[520px] overflow-hidden rounded-xl border">
          {ready && (
            <MapContainer
              center={[19.5, 74.5]}
              zoom={7}
              scrollWheelZoom
              className="h-full w-full"
            >
              <FlyToController target={flyTarget} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {layer !== "complaints" &&
                districts
                  .filter((d) => !selectedDistrict || d.name === selectedDistrict)
                  .map((d) => (
                    <CircleMarker
                      key={`d-${d.name}`}
                      center={[d.lat, d.lng]}
                      radius={18 + d.critical * 2}
                      pathOptions={{ color: riskColor(d.avgScore), fillColor: riskColor(d.avgScore), fillOpacity: 0.25, weight: 1 }}
                    >
                      <Tooltip direction="top" opacity={1}>
                        <strong>{d.name}</strong>
                        <br />
                        {t("map.avgRiskTooltip", { r: String(Math.round(d.avgScore)), n: String(d.count) })}
                      </Tooltip>
                    </CircleMarker>
                  ))}
              {layer !== "complaints" &&
                visible.map((b) => (
                  <CircleMarker
                    key={b.id}
                    center={[b.lat, b.lng]}
                    radius={5 + (b.riskScore / 100) * 7}
                    pathOptions={{ color: riskColor(b.riskScore), fillColor: riskColor(b.riskScore), fillOpacity: 0.8, weight: 1 }}
                    ref={(el) => {
                      if (el) markerRefs.current.set(b.id, el);
                      else markerRefs.current.delete(b.id);
                    }}
                  >
                    <Tooltip direction="top" opacity={1}>
                      <strong>{b.name}</strong>
                      <br />
                      {t("map.riskTooltip", { r: String(Math.round(b.riskScore)), cat: categoryLabel(lang, b.category) })}
                    </Tooltip>
                    <Popup>
                      <div className="min-w-40 space-y-1">
                        <p className="font-semibold">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabel(lang, b.category)} · {b.district}
                        </p>
                        <RiskBadge score={b.riskScore} />
                        <p className="pt-1 text-xs text-muted-foreground">{t("map.lastInspection", { d: formatDate(b.lastInspection) })}</p>
                        <Link href={`/officer/business/${b.id}`} className="block pt-1 text-xs font-medium text-primary hover:underline">
                          {t("map.openProfile")}
                        </Link>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              {layer !== "business" &&
                visibleComplaints.map((c) => (
                  <CircleMarker
                    key={`c-${c.id}`}
                    center={[c.lat, c.lng]}
                    radius={c.escalated ? 11 : 8}
                    pathOptions={{
                      color: complaintColor(c.status, c.escalated),
                      fillColor: complaintColor(c.status, c.escalated),
                      fillOpacity: 0.75,
                      weight: c.escalated ? 3 : 1,
                    }}
                  >
                    <Tooltip direction="top" opacity={1}>
                      <strong>{c.reference}</strong>
                      <br />
                      {c.escalated ? t("map.escalatedBadge") : complaintStatusLabel(lang, c.status)}
                    </Tooltip>
                    <Popup>
                      <div className="min-w-44 space-y-1">
                        <p className="flex items-center gap-1.5 font-semibold">
                          <Megaphone className="h-3.5 w-3.5" />
                          {c.reference}
                        </p>
                        <p className="text-xs">{c.description.slice(0, 140)}{c.description.length > 140 ? "…" : ""}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.businessName ?? t("map.unknownBusiness")} · {formatDateTime(c.createdAt)}
                        </p>
                        <p className="text-xs font-medium" style={{ color: complaintColor(c.status, c.escalated) }}>
                          {c.escalated ? t("map.escalatedBadge") : complaintStatusLabel(lang, c.status)}
                        </p>
                        <div className="flex gap-3 pt-1">
                          {c.businessId && (
                            <Link href={`/officer/business/${c.businessId}`} className="text-xs font-medium text-primary hover:underline">
                              {t("map.openProfile")}
                            </Link>
                          )}
                          <Link href="/officer/history" className="text-xs font-medium text-primary hover:underline">
                            {t("map.openHistory")}
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
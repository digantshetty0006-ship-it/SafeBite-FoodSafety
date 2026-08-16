"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabel, formatDate } from "@/lib/format";
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

export function riskColor(score: number): string {
  const t = Math.min(100, Math.max(0, score)) / 100;
  const hue = 120 - t * 120; // 120 (green) -> 0 (red)
  return `hsl(${hue}, 72%, 45%)`;
}

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
  lang,
}: {
  businesses: MapBusiness[];
  districts: DistrictAgg[];
  lang: Lang;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
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
            {districts
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
            {visible.map((b) => (
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
          </MapContainer>
        )}
      </div>
    </div>
  );
}

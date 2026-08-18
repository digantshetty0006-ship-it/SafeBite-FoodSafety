"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { formatRating, riskToRating } from "@/lib/rating";

export interface UnsafeBusiness {
  id: string;
  name: string;
  riskScore: number;
  district: string;
  lat: number;
  lng: number;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function UnsafeSpots({ businesses, limit = 5 }: { businesses: UnsafeBusiness[]; limit?: number }) {
  const { t } = useLocale();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPos(null),
      { timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  const highRisk = useMemo(() => businesses.filter((b) => b.riskScore >= 51), [businesses]);

  const spots = useMemo<(UnsafeBusiness & { dist?: number })[]>(() => {
    if (!pos) return highRisk.slice().sort((a, b) => b.riskScore - a.riskScore).slice(0, limit);
    return highRisk
      .map((b) => ({ ...b, dist: haversineKm(pos.lat, pos.lng, b.lat, b.lng) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, limit);
  }, [highRisk, pos, limit]);

  if (spots.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("news.noUnsafe")}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {spots.map((b, i) => (
        <div key={b.id} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">
              <span className="mr-1.5 text-muted-foreground">#{i + 1}</span>
              {b.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {b.district}
              {pos && b.dist !== undefined ? ` · ${b.dist.toFixed(1)} ${t("news.km")}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
            {formatRating(riskToRating(b.riskScore))}★
          </span>
        </div>
      ))}
      {!pos && (
        <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <Navigation className="h-3 w-3" /> {t("news.shareLoc")}
        </p>
      )}
    </div>
  );
}
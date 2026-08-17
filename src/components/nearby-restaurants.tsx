"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LocateFixed, MapPin, Navigation, RefreshCcw, Utensils, Star } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { findNearbyBusinesses, type NearbyBusiness } from "@/lib/home-actions";

const DEFAULT_LOCATION = { lat: 19.076, lng: 72.8777 };

type Status = "locating" | "denied" | "ready";

export function NearbyRestaurants() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("locating");
  const [usingDefault, setUsingDefault] = useState(false);
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);

  const load = useCallback(async (lat: number, lng: number) => {
    setStatus("locating");
    try {
      const list = await findNearbyBusinesses(lat, lng, 8);
      setBusinesses(list);
      setStatus("ready");
    } catch {
      setStatus("denied");
    }
  }, []);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setUsingDefault(true);
      void load(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUsingDefault(false);
        void load(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setUsingDefault(true);
        void load(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, [load]);

  useEffect(() => {
    locate();
  }, [locate]);

  const tierLabel = (tier: string) => {
    if (tier === "A") return { text: t("home.tierA"), cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" };
    if (tier === "C") return { text: t("home.tierC"), cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" };
    return { text: t("home.tierB"), cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
  };

  return (
    <section id="nearby" className="border-t bg-background py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Utensils className="h-7 w-7 text-primary" />
              {t("home.nearbyTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{t("home.nearbySub")}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/lookup">
              {t("home.viewAll")} <Navigation className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {status === "locating" ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-3 h-4 w-1/2" />
                <Skeleton className="mt-6 h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {usingDefault && (
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300/50 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <LocateFixed className="h-4 w-4 shrink-0" />
                <span className="flex-1">{t("home.nearbyDefault")}</span>
                <Button size="sm" variant="outline" onClick={locate} className="gap-1.5">
                  <RefreshCcw className="h-3.5 w-3.5" /> {t("home.nearbyRetry")}
                </Button>
              </div>
            )}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {businesses.map((b) => {
                const tier = tierLabel(b.riskTier);
                return (
                  <div
                    key={b.id}
                    className="flex flex-col rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug">{b.name}</h3>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tier.cls}`}>
                        {tier.text}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Utensils className="h-3 w-3" /> {b.category}
                      <span className="mx-0.5">·</span>
                      {b.district}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {t("home.distKm", { n: String(b.distanceKm) })}
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <Star className="h-4 w-4 shrink-0 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("home.safetyScore")}</span>
                          <span className="font-bold">{b.safetyScore}/100</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                            style={{ width: `${b.safetyScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                      <Link href="/lookup">{t("home.viewRestaurant")}</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
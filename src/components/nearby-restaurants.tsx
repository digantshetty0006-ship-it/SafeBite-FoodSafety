"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LocateFixed, Navigation, RefreshCcw, Utensils } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantCard } from "@/components/restaurant-card";
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
            <Link href="/restaurants">
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
              {businesses.map((b) => (
                <RestaurantCard
                  key={b.id}
                  name={b.name}
                  category={b.category}
                  district={b.district}
                  address={b.address}
                  googleAddress={b.googleAddress}
                  googleRating={b.googleRating}
                  distanceKm={b.distanceKm}
                  rating={b.rating}
                  riskScore={b.riskScore}
                  imageUrl={b.imageUrl}
                  placeId={b.placeId}
                  href={`/restaurants?q=${encodeURIComponent(b.name)}`}
                  actionLabel={t("home.viewRestaurant")}
                  distLabel={t("home.distKm", { n: String(b.distanceKm) })}
                  ratingLabel={t("home.safeBiteRating")}
                  notRatedLabel={t("home.notRated")}
                  basedOnLabel={t("home.ratingBasedOn")}
                  riskLabels={{
                    low: t("home.lowRisk"),
                    moderate: t("home.moderateRisk"),
                    high: t("home.highRisk"),
                    critical: t("home.criticalRisk"),
                  }}
                  directionsLabel={t("rest.directions")}
                  mapsLabel={t("rest.viewOnMaps")}
                  googleRatingLabel={t("rest.googleRating")}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
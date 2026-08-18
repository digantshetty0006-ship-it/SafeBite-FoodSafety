import Link from "next/link";
import { Store, Utensils, SearchX } from "lucide-react";
import { getLang, tr } from "@/lib/lang";
import { LocaleProvider } from "@/components/locale-provider";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantSearch } from "@/components/restaurant-search";
import { getBusinessInfo } from "@/lib/business-info";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  const businesses = await db.business.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      district: true,
      address: true,
      riskScore: true,
      riskTier: true,
    },
  });

  const matched = businesses
    .filter((b) =>
      needle
        ? [b.name, b.category, b.district, b.address].some((v) => v.toLowerCase().includes(needle))
        : true
    )
    .sort((a, b) => a.riskScore - b.riskScore);

  const items = await Promise.all(
    matched.map(async (b) => {
      const info = await getBusinessInfo(b.name, b.district);
      return {
        ...b,
        safetyScore: Math.max(0, Math.min(100, Math.round(100 - b.riskScore))),
        imageUrl: info.imageUrl,
        placeId: info.placeId,
        googleAddress: info.googleAddress,
        googleRating: info.googleRating,
      };
    })
  );

  return (
    <LocaleProvider lang={lang}>
      <div className="flex-1">
        <PublicHeader lang={lang} />
        <section className="border-b bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{t("rest.title")}</h1>
                  <p className="text-sm text-emerald-50/80">{t("rest.sub")}</p>
                </div>
              </div>
              <RestaurantSearch initial={q ?? ""} placeholder={t("rest.searchPlaceholder")} label={t("rest.search")} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-sm text-muted-foreground">
            {t("rest.count", { n: String(items.length) })}
          </p>
          {items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
              <SearchX className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">{t("rest.empty")}</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/restaurants">{t("rest.clear")}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((b) => (
                <RestaurantCard
                  key={b.id}
                  name={b.name}
                  category={b.category}
                  district={b.district}
                  address={b.address}
                  googleAddress={b.googleAddress}
                  googleRating={b.googleRating}
                  safetyScore={b.safetyScore}
                  riskTier={b.riskTier}
                  imageUrl={b.imageUrl}
                  placeId={b.placeId}
                  href={`/citizen/report?business=${encodeURIComponent(b.id)}`}
                  actionLabel={t("rest.report")}
                  scoreLabel={t("home.safetyScore")}
                  tierA={t("home.tierA")}
                  tierB={t("home.tierB")}
                  tierC={t("home.tierC")}
                  directionsLabel={t("rest.directions")}
                  mapsLabel={t("rest.viewOnMaps")}
                  ratingLabel={t("rest.googleRating")}
                />
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center justify-center gap-2 pb-8 text-xs text-muted-foreground">
          <Utensils className="h-3.5 w-3.5" />
          {t("rest.footnote")}
        </div>
        <PublicFooter lang={lang} />
      </div>
    </LocaleProvider>
  );
}
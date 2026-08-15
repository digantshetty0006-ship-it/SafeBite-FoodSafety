import Link from "next/link";
import { Newspaper, ShieldCheck, ArrowLeft, MapPin } from "lucide-react";
import { getLang, tr } from "@/lib/lang";
import { STATES } from "@/lib/news";
import { NewsList } from "@/components/news/news-list";
import { RecentActions } from "@/components/news/recent-actions";
import { UnsafeSpots } from "@/components/news/unsafe-spots";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocaleProvider } from "@/components/locale-provider";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);
  const { state: rawState } = await searchParams;
  const state = rawState && STATES[rawState] !== undefined ? rawState : "All India";

  const businesses = await db.business.findMany({
    orderBy: { riskScore: "desc" },
    take: 30,
    select: { id: true, name: true, riskScore: true, district: true, lat: true, lng: true },
  });

  return (
    <LocaleProvider lang={lang}>
      <div className="flex-1">
        <section className="border-b bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{t("news.title")}</h1>
                  <p className="text-sm text-emerald-50/80">{t("news.sub")}</p>
                </div>
              </div>
              <LanguageSwitcher current={lang} className="border-white/20 bg-white/10 text-white" />
            </div>
            <p className="mt-4 max-w-3xl text-xs text-emerald-50/70">{t("news.disclaimer")}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {Object.keys(STATES).map((s) => (
              <Link
                key={s}
                href={s === "All India" ? "/news" : `/news?state=${encodeURIComponent(s)}`}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  s === state
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {s === "All India" ? t("news.allIndia") : s}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NewsList state={state} initial={null} />
            </div>
            <div className="space-y-8">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> {t("home.recentActions")}
                </h2>
                <RecentActions limit={5} />
              </div>
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-4 w-4 text-red-600" /> {t("home.unsafeNear")}
                </h2>
                <p className="mb-3 text-xs text-muted-foreground">{t("news.unsafeSub")}</p>
                <UnsafeSpots businesses={businesses} limit={5} />
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t bg-muted/30 py-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:px-6">
            <Link href="/" className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> {t("common.backHome")}
            </Link>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> SafeBite Â· {t("home.footMocked")}
            </span>
          </div>
        </footer>
      </div>
    </LocaleProvider>
  );
}
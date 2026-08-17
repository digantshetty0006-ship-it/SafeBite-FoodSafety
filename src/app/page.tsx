import Link from "next/link";
import {
  ShieldCheck,
  Megaphone,
  ArrowRight,
  PhoneCall,
  ClipboardCheck,
  UserCheck,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLang, tr } from "@/lib/lang";
import { LocaleProvider } from "@/components/locale-provider";
import { NewsPreview } from "@/components/news/news-preview";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { NearbyRestaurants } from "@/components/nearby-restaurants";

const STEPS = [
  { icon: Megaphone, step: "01", k: "home.h1" },
  { icon: ClipboardCheck, step: "02", k: "home.h2" },
  { icon: UserCheck, step: "03", k: "home.h3" },
  { icon: CheckCircle2, step: "04", k: "home.h4" },
];

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);

  return (
    <LocaleProvider lang={lang}>
      <div className="flex-1">
        <PublicHeader lang={lang} />
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.4)_1px,transparent_0)] [background-size:26px_26px]" />
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("home.badge")}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{t("home.sub")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="#nearby">
                  <MapPin className="mr-2 h-4 w-4" />
                  {t("home.heroNearby")}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">
                  <Megaphone className="mr-2 h-4 w-4" />
                  {t("home.heroReport")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Nearby restaurants */}
        <NearbyRestaurants />

        {/* Tagline strip */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-2xl border bg-card px-6 py-8">
            <div className="grid gap-6 text-center sm:grid-cols-4 sm:divide-x sm:divide-border">
              {[
                ["2,400+", t("home.s1l")],
                ["40", t("home.s2l")],
                ["< 24h", t("home.s3l")],
                ["100%", t("home.s4l")],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="text-3xl font-bold text-primary">{n}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("home.howTitle")}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">{t("home.howSub")}</p>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.step} className="relative rounded-xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
                  <span className="absolute right-4 top-4 font-mono text-3xl font-bold text-muted-foreground/15">{s.step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{t(`${s.k}t`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`${s.k}b`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* News */}
        <section className="border-t bg-background py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <NewsPreview state="Maharashtra" />
          </div>
        </section>

        {/* Helpline band */}
        <section className="relative overflow-hidden border-t">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t("home.helpTitle")}</h3>
                <p className="text-sm text-emerald-50/80">{t("home.helpBody")}</p>
              </div>
            </div>
            <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
              <Link href="/login">
                {t("home.reportIssue")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <PublicFooter lang={lang} />
      </div>
    </LocaleProvider>
  );
}
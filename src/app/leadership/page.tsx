import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Landmark, Building2, BadgeCheck } from "lucide-react";
import { getLang, tr } from "@/lib/lang";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocaleProvider } from "@/components/locale-provider";

const PEOPLE = [
  {
    photo: "/images/people/srivastava.jpg",
    name: "Punya Salila Srivastava, IAS",
    roleKey: "lead.chair",
    orgKey: "lead.fssai",
    fact: "2005-batch IAS. Leads FSSAI while also serving as Secretary, Ministry of Health & Family Welfare â€” the highest-ranking official driving India's food safety regulation.",
    factHi: "2005 à¤¬à¥ˆà¤š à¤•à¥€ IASà¥¤ FSSAI à¤•à¥€ à¤…à¤§à¥à¤¯à¤•à¥à¤· à¤¹à¥‹à¤¨à¥‡ à¤•à¥‡ à¤¸à¤¾à¤¥-à¤¸à¤¾à¤¥ à¤¸à¥à¤µà¤¾à¤¸à¥à¤¥à¥à¤¯ à¤à¤µà¤‚ à¤ªà¤°à¤¿à¤µà¤¾à¤° à¤•à¤²à¥à¤¯à¤¾à¤£ à¤®à¤‚à¤¤à¥à¤°à¤¾à¤²à¤¯ à¤•à¥€ à¤¸à¤šà¤¿à¤µ à¤­à¥€ â€” à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¤¾à¤¦à¥à¤¯ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤¨à¤¿à¤¯à¤®à¤¨ à¤•à¥€ à¤¸à¤¬à¤¸à¥‡ à¤µà¤°à¤¿à¤·à¥à¤  à¤…à¤§à¤¿à¤•à¤¾à¤°à¥€à¥¤",
    factMr: "2005 à¤¬à¥…à¤šà¤šà¥à¤¯à¤¾ IAS. FSSAI à¤šà¥à¤¯à¤¾ à¤…à¤§à¥à¤¯à¤•à¥à¤· à¤…à¤¸à¤¤à¤¾à¤¨à¤¾à¤š à¤†à¤°à¥‹à¤—à¥à¤¯ à¤µ à¤•à¥à¤Ÿà¥à¤‚à¤¬ à¤•à¤²à¥à¤¯à¤¾à¤£ à¤®à¤‚à¤¤à¥à¤°à¤¾à¤²à¤¯à¤¾à¤šà¥à¤¯à¤¾ à¤¸à¤šà¤¿à¤µ â€” à¤­à¤¾à¤°à¤¤à¤¾à¤šà¥à¤¯à¤¾ à¤…à¤¨à¥à¤¨ à¤¸à¥à¤°à¤•à¥à¤·à¤¾ à¤¨à¤¿à¤¯à¤®à¤¨à¤¾à¤šà¥à¤¯à¤¾ à¤¸à¤°à¥à¤µà¤¾à¤¤ à¤µà¤°à¤¿à¤·à¥à¤  à¤…à¤§à¤¿à¤•à¤¾à¤°à¥€.",
  },
  {
    photo: "/images/people/punhani.png",
    name: "Rajit Punhani, IAS",
    roleKey: "lead.ceo",
    orgKey: "lead.fssai",
    fact: "1991-batch Bihar cadre. Took charge as FSSAI CEO on 1 September 2025; former Secretary to the Government of India (Skill Development and Rajya Sabha).",
    factHi: "1991 à¤¬à¥ˆà¤š à¤¬à¤¿à¤¹à¤¾à¤° à¤•à¥ˆà¤¡à¤°à¥¤ 1 à¤¸à¤¿à¤¤à¤‚à¤¬à¤° 2025 à¤•à¥‹ FSSAI CEO à¤•à¤¾ à¤•à¤¾à¤°à¥à¤¯à¤­à¤¾à¤° à¤¸à¤‚à¤­à¤¾à¤²à¤¾; à¤ªà¥‚à¤°à¥à¤µ à¤¸à¤šà¤¿à¤µ, à¤­à¤¾à¤°à¤¤ à¤¸à¤°à¤•à¤¾à¤° (à¤•à¥Œà¤¶à¤² à¤µà¤¿à¤•à¤¾à¤¸ à¤”à¤° à¤°à¤¾à¤œà¥à¤¯à¤¸à¤­à¤¾)à¥¤",
    factMr: "1991 à¤¬à¥…à¤š à¤¬à¤¿à¤¹à¤¾à¤° à¤•à¥…à¤¡à¤°. 1 à¤¸à¤ªà¥à¤Ÿà¥‡à¤‚à¤¬à¤° 2025 à¤°à¥‹à¤œà¥€ FSSAI CEO à¤®à¥à¤¹à¤£à¥‚à¤¨ à¤•à¤¾à¤°à¥à¤¯à¤­à¤¾à¤° à¤¸à¥à¤µà¥€à¤•à¤¾à¤°à¤²à¤¾; à¤®à¤¾à¤œà¥€ à¤¸à¤šà¤¿à¤µ, à¤­à¤¾à¤°à¤¤ à¤¸à¤°à¤•à¤¾à¤° (à¤•à¥Œà¤¶à¤²à¥à¤¯ à¤µà¤¿à¤•à¤¾à¤¸ à¤†à¤£à¤¿ à¤°à¤¾à¤œà¥à¤¯à¤¸à¤­à¤¾).",
  },
  {
    photo: "/images/people/mundhe.jpg",
    name: "Tukaram Mundhe, IAS",
    roleKey: "lead.comm",
    orgKey: "lead.maharashtra",
    fact: "2005-batch IAS. As Maharashtra FDA Commissioner he launched a statewide crackdown â€” 1,131 inspections, ~â‚¹50 crore of unsafe food stocks seized, 1.6 lakh litres of adulterated milk stopped, 56 restaurant licences suspended.",
    factHi: "2005 à¤¬à¥ˆà¤š IASà¥¤ à¤®à¤¹à¤¾à¤°à¤¾à¤·à¥à¤Ÿà¥à¤° FDA à¤†à¤¯à¥à¤•à¥à¤¤ à¤•à¥‡ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤°à¤¾à¤œà¥à¤¯à¤µà¥à¤¯à¤¾à¤ªà¥€ à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ â€” 1,131 à¤¨à¤¿à¤°à¥€à¤•à¥à¤·à¤£, à¤²à¤—à¤­à¤— â‚¹50 à¤•à¤°à¥‹à¤¡à¤¼ à¤…à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤–à¤¾à¤¦à¥à¤¯ à¤¸à¥à¤Ÿà¥‰à¤• à¤œà¤¬à¥à¤¤, 1.6 à¤²à¤¾à¤– à¤²à¥€à¤Ÿà¤° à¤®à¤¿à¤²à¤¾à¤µà¤Ÿà¥€ à¤¦à¥‚à¤§ à¤°à¥‹à¤•à¤¾, 56 à¤°à¥‡à¤¸à¥à¤¤à¤°à¤¾à¤‚ à¤²à¤¾à¤‡à¤¸à¥‡à¤‚à¤¸ à¤¨à¤¿à¤²à¤‚à¤¬à¤¿à¤¤à¥¤",
    factMr: "2005 à¤¬à¥…à¤šà¤šà¥‡ IAS. à¤®à¤¹à¤¾à¤°à¤¾à¤·à¥à¤Ÿà¥à¤° FDA à¤†à¤¯à¥à¤•à¥à¤¤ à¤®à¥à¤¹à¤£à¥‚à¤¨ à¤°à¤¾à¤œà¥à¤¯à¤µà¥à¤¯à¤¾à¤ªà¥€ à¤•à¤¾à¤°à¤µà¤¾à¤ˆ â€” 1,131 à¤¤à¤ªà¤¾à¤¸à¤£à¥à¤¯à¤¾, à¤¸à¥à¤®à¤¾à¤°à¥‡ â‚¹50 à¤•à¥‹à¤Ÿà¥€à¤‚à¤šà¤¾ à¤…à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤…à¤¨à¥à¤¨à¤¸à¤¾à¤ à¤¾ à¤œà¤ªà¥à¤¤, 1.6 à¤²à¤¾à¤– à¤²à¤¿à¤Ÿà¤° à¤­à¥‡à¤¸à¤³à¤¯à¥à¤•à¥à¤¤ à¤¦à¥‚à¤§ à¤°à¥‹à¤–à¤²à¥‡, 56 à¤°à¥‡à¤¸à¥à¤Ÿà¥‰à¤°à¤‚à¤Ÿ à¤ªà¤°à¤µà¤¾à¤¨à¥‡ à¤¨à¤¿à¤²à¤‚à¤¬à¤¿à¤¤.",
  },
];

export default async function LeadershipPage() {
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);

  return (
    <LocaleProvider lang={lang}>
      <div className="flex-1">
        <section className="border-b bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{t("lead.title")}</h1>
                  <p className="text-sm text-emerald-50/80">{t("lead.sub")}</p>
                </div>
              </div>
              <LanguageSwitcher current={lang} className="border-white/20 bg-white/10 text-white" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {PEOPLE.map((p) => (
              <div key={p.name} className="flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square overflow-hidden bg-muted">
                  <Image src={p.photo} alt={p.name} width={640} height={640} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" /> {t(p.orgKey)}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">{p.name}</h2>
                  <p className="text-sm font-medium text-muted-foreground">{t(p.roleKey)}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {lang === "hi" ? p.factHi : lang === "mr" ? p.factMr : p.fact}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p>{t("lead.note")}</p>
              <p className="mt-1 text-xs">
                <Building2 className="mr-1 inline h-3 w-3" />
                Maharashtra FDA â€” â€œSafe Food, Safe Drugs, Safe Maharashtraâ€
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t bg-muted/30 py-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:px-6">
            <Link href="/" className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> {t("common.backHome")}
            </Link>
            <Link href="/news" className="font-medium text-primary hover:underline">
              {t("home.newsTitle")}
            </Link>
          </div>
        </footer>
      </div>
    </LocaleProvider>
  );
}
import Image from "next/image";
import { ShieldCheck, Landmark, Building2, BadgeCheck } from "lucide-react";
import { getLang, tr } from "@/lib/lang";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { LocaleProvider } from "@/components/locale-provider";

const PEOPLE = [
  {
    photo: "/images/people/srivastava.jpg",
    name: "Punya Salila Srivastava, IAS",
    roleKey: "lead.chair",
    orgKey: "lead.fssai",
    fact: "2005-batch IAS. Leads FSSAI while also serving as Secretary, Ministry of Health & Family Welfare — the highest-ranking official driving India's food safety regulation.",
    factHi: "2005 बैच की IAS। FSSAI की अध्यक्ष होने के साथ-साथ स्वास्थ्य एवं परिवार कल्याण मंत्रालय की सचिव भी — भारत की खाद्य सुरक्षा नियमन की सबसे वरिष्ठ अधिकारी।",
    factMr: "2005 बॅचच्या IAS. FSSAI च्या अध्यक्ष असतानाच आरोग्य व कुटुंब कल्याण मंत्रालयाच्या सचिव — भारताच्या अन्न सुरक्षा नियमनाच्या सर्वात वरिष्ठ अधिकारी.",
  },
  {
    photo: "/images/people/punhani.png",
    name: "Rajit Punhani, IAS",
    roleKey: "lead.ceo",
    orgKey: "lead.fssai",
    fact: "1991-batch Bihar cadre. Took charge as FSSAI CEO on 1 September 2025; former Secretary to the Government of India (Skill Development and Rajya Sabha).",
    factHi: "1991 बैच बिहार कैडर। 1 सितंबर 2025 को FSSAI CEO का कार्यभार संभाला; पूर्व सचिव, भारत सरकार (कौशल विकास और राज्यसभा)।",
    factMr: "1991 बॅच बिहार कॅडर. 1 सप्टेंबर 2025 रोजी FSSAI CEO म्हणून कार्यभार स्वीकारला; माजी सचिव, भारत सरकार (कौशल्य विकास आणि राज्यसभा).",
  },
  {
    photo: "/images/people/mundhe.jpg",
    name: "Tukaram Mundhe, IAS",
    roleKey: "lead.comm",
    orgKey: "lead.maharashtra",
    fact: "2005-batch IAS. As Maharashtra FDA Commissioner he launched a statewide crackdown — 1,131 inspections, ~₹50 crore of unsafe food stocks seized, 1.6 lakh litres of adulterated milk stopped, 56 restaurant licences suspended.",
    factHi: "2005 बैच IAS। महाराष्ट्र FDA आयुक्त के रूप में राज्यव्यापी कार्रवाई — 1,131 निरीक्षण, लगभग ₹50 करोड़ असुरक्षित खाद्य स्टॉक जब्त, 1.6 लाख लीटर मिलावटी दूध रोका, 56 रेस्तरां लाइसेंस निलंबित।",
    factMr: "2005 बॅचचे IAS. महाराष्ट्र FDA आयुक्त म्हणून राज्यव्यापी कारवाई — 1,131 तपासण्या, सुमारे ₹50 कोटींचा असुरक्षित अन्नसाठा जप्त, 1.6 लाख लिटर भेसळयुक्त दूध रोखले, 56 रेस्टॉरंट परवाने निलंबित.",
  },
];

export default async function LeadershipPage() {
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);

  return (
    <LocaleProvider lang={lang}>
      <div className="flex-1">
        <PublicHeader lang={lang} />
        <section className="border-b bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t("lead.title")}</h1>
                <p className="text-sm text-emerald-50/80">{t("lead.sub")}</p>
              </div>
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
                Maharashtra FDA — “Safe Food, Safe Drugs, Safe Maharashtra”
              </p>
            </div>
          </div>
        </section>

        <PublicFooter lang={lang} />
      </div>
    </LocaleProvider>
  );
}
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck, ArrowLeft, Landmark, Megaphone, Building2, ClipboardEdit, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "../(auth)/actions";
import { DEMO_USERS, getSessionUser, ROLE_HOME } from "@/lib/auth";
import { getLang, tr } from "@/lib/lang";
import { LanguageSwitcher } from "@/components/language-switcher";
import LoginForm from "./login-form";

const ROLE_ICONS: Record<string, React.ElementType> = {
  food_officer: Landmark,
  citizen: Megaphone,
  business_owner: Building2,
};

const TEAM = [
  { name: "Digant Shetty", cit: "citdigantshetty", insp: "inspdigantshetty", biz: "bizdigantshetty" },
  { name: "Sejal Phadtare", cit: "citsejalphadtare", insp: "inspsejalphadtare", biz: "bizsejalphadtare" },
  { name: "Sharanya Shivshankar", cit: "citsharanyashivshankar", insp: "inspsharanyashivshankar", biz: "bizsharanyashivshankar" },
  { name: "Manit Suvarna", cit: "citmanitsuvarna", insp: "inspmanitsuvarna", biz: "bizmanitsuvarna" },
  { name: "Paritosh Bagade", cit: "citparitoshbagade", insp: "inspparitoshbagade", biz: "bizparitoshbagade" },
  { name: "Sarthak Mane", cit: "citsarthakmane", insp: "inspsarthakmane", biz: "bizsarthakmane" },
];

export default async function LoginPage() {
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);
  const roleName = (role: string) =>
    tr(lang, role === "food_officer" ? "role.officer" : role === "citizen" ? "role.citizen" : "role.owner");

  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role] ?? "/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 px-4 py-12">
      <div className="mb-6 flex items-center gap-2 text-white">
        <Image
          src="/logo-white.png"
          alt="SafeBite"
          width={760}
          height={247}
          className="h-8 w-auto drop-shadow-md"
        />
        <LanguageSwitcher current={lang} className="ml-4 border-white/20 bg-white/10 text-white" />
      </div>

      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
        {/* Demo accounts */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-emerald-50/80">{t("login.sub")}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-emerald-50/60">
            {t("login.demoAccounts")}
          </p>
          <div className="mt-3 grid gap-3">
            {DEMO_USERS.map((u) => {
              const Icon = ROLE_ICONS[u.role] ?? ShieldCheck;
              return (
                <a
                  key={u.email}
                  href={`/login?email=${encodeURIComponent(u.email)}&password=${encodeURIComponent(u.password)}`}
                  className="group flex w-full items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 text-left text-white backdrop-blur transition hover:border-white/40 hover:bg-white/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{roleName(u.role)}</p>
                    <p className="truncate font-mono text-xs text-emerald-50/70">{u.email}</p>
                  </div>
                  <ClipboardEdit className="h-4 w-4 shrink-0 text-emerald-50/50 transition group-hover:text-white" />
                </a>
              );
            })}
          </div>

          <details className="group mt-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-white [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-medium">{t("login.teamAccounts")}</p>
                <p className="mt-0.5 text-xs text-emerald-50/70">
                  {t("login.teamHint")} <code className="rounded bg-white/15 px-1">demo1234</code>
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-emerald-50/50 transition group-open:rotate-180" />
            </summary>
            <div className="divide-y divide-white/10 border-t border-white/10">
              {TEAM.map((m) => (
                <div key={m.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs">
                  <p className="w-40 shrink-0 font-medium text-white">{m.name}</p>
                  <span className="text-emerald-50/60">{t("login.idCit")}:</span>
                  <a href={`/login?email=${m.cit}&password=demo1234`} className="font-mono text-emerald-100/80 hover:text-white">
                    {m.cit}
                  </a>
                  <span className="text-emerald-50/60">{t("login.idInsp")}:</span>
                  <a href={`/login?email=${m.insp}&password=demo1234`} className="font-mono text-emerald-100/80 hover:text-white">
                    {m.insp}
                  </a>
                  <span className="text-emerald-50/60">{t("login.idBiz")}:</span>
                  <a href={`/login?email=${m.biz}&password=demo1234`} className="font-mono text-emerald-100/80 hover:text-white">
                    {m.biz}
                  </a>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Manual login */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle>{t("login.manualTitle")}</CardTitle>
            <CardDescription>
              {t("login.manualDesc")} <code className="rounded bg-muted px-1">demo1234</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <Link href="/" className="flex items-center gap-2 text-emerald-50/70 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          {t("common.backHome")}
        </Link>
        <Link href="/judges-guide" className="flex items-center gap-2 text-emerald-50/70 transition hover:text-white">
          {t("home.footGuide")}
        </Link>
      </div>
    </div>
  );
}

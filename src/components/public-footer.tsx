import Link from "next/link";
import Image from "next/image";
import { PhoneCall } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

export function PublicFooter({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex w-fit items-center">
              <Image
                src="/logo.png"
                alt="SafeBite"
                width={760}
                height={247}
                className="h-9 w-auto dark:hidden"
              />
              <Image
                src="/logo-white.png"
                alt="SafeBite"
                width={760}
                height={247}
                className="hidden h-9 w-auto dark:block"
              />
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("home.footMocked")}</p>
          </div>

          <div>
            <p className="text-sm font-semibold">{t("footer.quickLinks")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { href: "/", k: "nav.home" },
                { href: "/news", k: "nav.news" },
                { href: "/leadership", k: "nav.leadership" },
                { href: "/judges-guide", k: "nav.guide" },
                { href: "/login", k: "header.signIn" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground transition hover:text-primary">
                    {t(l.k)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">{t("footer.helpline")}</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border bg-card p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PhoneCall className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold tracking-tight">1800-222-365</p>
                <p className="text-xs text-muted-foreground">24×7 · {t("home.helpBody").split("·").slice(-1)[0].trim()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t("footer.copyright")}</p>
          <p>{t("home.footPrototype")}</p>
        </div>
      </div>
    </footer>
  );
}
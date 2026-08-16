"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/news", key: "nav.news" },
  { href: "/leadership", key: "nav.leadership" },
  { href: "/judges-guide", key: "nav.guide" },
];

export function PublicHeader({ lang }: { lang: Lang }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <span className="flex items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5">
            <Image src="/logo.png" alt="SafeBite" width={760} height={281} className="h-8 w-auto sm:h-9" />
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                isActive(l.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeSwitcher />
          <LanguageSwitcher current={lang} />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("header.signIn")}</span>
          </Link>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-sm font-medium",
              isActive(l.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"
            )}
          >
            {t(l.key)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
import { redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  BarChart3,
  Building2,
  ClipboardList,
  History,
  Megaphone,
  Search,
  FolderOpen,
  Lightbulb,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/auth";
import { getLang, tr } from "@/lib/lang";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { logoutAction } from "@/app/(auth)/actions";
import { ActiveNavLink } from "@/components/nav-link";
import type { NavItem } from "@/components/nav-link";

const NAV: Record<string, { href: string; labelKey: string; icon: React.ReactNode }[]> = {
  food_officer: [
    { href: "/officer/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/officer/queue", labelKey: "nav.queue", icon: <ClipboardList className="h-4 w-4" /> },
    { href: "/officer/history", labelKey: "nav.history", icon: <History className="h-4 w-4" /> },
    { href: "/officer/map", labelKey: "nav.map", icon: <Map className="h-4 w-4" /> },
    { href: "/officer/schedule", labelKey: "nav.schedule", icon: <CalendarDays className="h-4 w-4" /> },
    { href: "/officer/analytics", labelKey: "nav.analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  citizen: [
    { href: "/citizen/report", labelKey: "nav.report", icon: <Megaphone className="h-4 w-4" /> },
    { href: "/citizen/my-complaints", labelKey: "nav.track", icon: <History className="h-4 w-4" /> },
    { href: "/citizen/lookup", labelKey: "nav.lookup", icon: <Search className="h-4 w-4" /> },
  ],
  business_owner: [
    { href: "/owner/dashboard", labelKey: "nav.myBusiness", icon: <Building2 className="h-4 w-4" /> },
    { href: "/owner/documents", labelKey: "nav.documents", icon: <FolderOpen className="h-4 w-4" /> },
    { href: "/owner/suggestions", labelKey: "nav.tips", icon: <Lightbulb className="h-4 w-4" /> },
  ],
};

const ROLE_HEADER: Record<string, string> = {
  food_officer: "shell.hOfficer",
  citizen: "shell.hCitizen",
  business_owner: "shell.hOwner",
};

const ROLE_ACCENT: Record<string, string> = {
  food_officer: "from-emerald-600 to-teal-600",
  citizen: "from-violet-600 to-purple-600",
  business_owner: "from-orange-600 to-amber-600",
};

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const lang = await getLang();
  const items: NavItem[] = (NAV[user.role] ?? []).map((i) => ({
    href: i.href,
    label: tr(lang, i.labelKey),
    icon: i.icon,
  }));
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-screen bg-muted/30">
      <SidebarNav role={user.role} name={user.name} initials={initials} items={items} lang={lang} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header user={user} lang={lang} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  role,
  name,
  initials,
  items,
  lang,
}: {
  role: string;
  name: string;
  initials: string;
  items: NavItem[];
  lang: "en" | "hi" | "mr";
}) {
  return (
    <>
      {/* Mobile drawer toggle */}
      <label
        htmlFor="nav-drawer"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border bg-background shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </label>
      <input id="nav-drawer" type="checkbox" className="peer/nav hidden" />
      {/* Overlay */}
      <div className="pointer-events-none fixed inset-0 z-40 hidden bg-black/40 peer-checked/nav:block lg:hidden" />

      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r bg-background transition-transform peer-checked/nav:translate-x-0 lg:translate-x-0">
        <div className={cn("flex h-16 items-center gap-2 border-b px-5 bg-gradient-to-r text-white", ROLE_ACCENT[role])}>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/5">
            <Image src="/logo-mark.png" alt="SafeBite" width={256} height={256} className="h-full w-full object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">SafeBite</p>
            <p className="text-[11px] text-white/80">{ROLE_LABELS[role]}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {tr(lang, "common.menu")}
          </p>
          {items.map((item) => (
            <ActiveNavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{role.replace("_", " ")}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-1">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              {tr(lang, "common.signOut")}
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

async function Header({ user, lang }: { user: { name: string; role: string; email: string }; lang: "en" | "hi" | "mr" }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:pl-8">
      <div className="ml-10 lg:ml-0">
        <p className="text-sm font-medium text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
        <h2 className="text-sm font-semibold leading-tight">{tr(lang, ROLE_HEADER[user.role] ?? "shell.hOfficer")}</h2>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <ThemeSwitcher />
        <span className="hidden text-xs text-muted-foreground sm:block">{user.email}</span>
      </div>
    </header>
  );
}

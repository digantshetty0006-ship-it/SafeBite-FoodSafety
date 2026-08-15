import { redirect } from "next/navigation";
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
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";
import { ActiveNavLink } from "@/components/nav-link";
import type { NavItem } from "@/components/nav-link";

const NAV: Record<string, NavItem[]> = {
  food_officer: [
    { href: "/officer/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/officer/queue", label: "My Queue", icon: <ClipboardList className="h-4 w-4" /> },
    { href: "/officer/history", label: "Inspection History", icon: <History className="h-4 w-4" /> },
    { href: "/officer/map", label: "District Risk Map", icon: <Map className="h-4 w-4" /> },
    { href: "/officer/schedule", label: "Inspection Schedule", icon: <CalendarDays className="h-4 w-4" /> },
    { href: "/officer/analytics", label: "Analytics & Outbreaks", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  citizen: [
    { href: "/citizen/report", label: "Report Unsafe Food", icon: <Megaphone className="h-4 w-4" /> },
    { href: "/citizen/my-complaints", label: "Track Complaints", icon: <History className="h-4 w-4" /> },
    { href: "/citizen/lookup", label: "Business Lookup", icon: <Search className="h-4 w-4" /> },
  ],
  business_owner: [
    { href: "/owner/dashboard", label: "My Business", icon: <Building2 className="h-4 w-4" /> },
    { href: "/owner/documents", label: "Compliance Documents", icon: <FolderOpen className="h-4 w-4" /> },
    { href: "/owner/suggestions", label: "Improvement Tips", icon: <Lightbulb className="h-4 w-4" /> },
  ],
};

const ROLE_ACCENT: Record<string, string> = {
  food_officer: "from-emerald-600 to-teal-600",
  citizen: "from-violet-600 to-purple-600",
  business_owner: "from-orange-600 to-amber-600",
};

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const items = NAV[user.role] ?? [];
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-screen bg-muted/30">
      <SidebarNav role={user.role} name={user.name} initials={initials} items={items} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header user={user} />
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
}: {
  role: string;
  name: string;
  initials: string;
  items: NavItem[];
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">SafeBite</p>
            <p className="text-[11px] text-white/80">{ROLE_LABELS[role]}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Menu</p>
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
              Sign out
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

async function Header({ user }: { user: { name: string; role: string; email: string } }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur sm:px-6 lg:pl-8">
      <div className="ml-10 lg:ml-0">
        <p className="text-sm font-medium text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
        <h2 className="text-sm font-semibold leading-tight">
          {user.role === "food_officer"
            ? "Food Safety Command Center"
            : user.role === "citizen"
                ? "Citizen Safety Portal"
                : "Business Compliance Portal"}
        </h2>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:block">{user.email}</span>
      </div>
    </header>
  );
}

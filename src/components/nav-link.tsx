"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function ActiveNavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-foreground font-semibold"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("h-4 w-4", active && "text-primary")}>{icon}</span>
      {label}
    </Link>
  );
}

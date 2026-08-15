"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; icon: React.ReactNode; labelKey: string }[] = [
  { value: "light", icon: <Sun className="h-4 w-4" />, labelKey: "theme.light" },
  { value: "dark", icon: <Moon className="h-4 w-4" />, labelKey: "theme.dark" },
  { value: "system", icon: <Monitor className="h-4 w-4" />, labelKey: "theme.system" },
];

export function ThemeSwitcher() {
  const { t } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground"
          aria-label={t("theme.label")}
          title={t("theme.label")}
        >
          {theme === "dark" ? <Moon className="h-4.5 w-4.5" /> : theme === "light" ? <Sun className="h-4.5 w-4.5" /> : <Monitor className="h-4.5 w-4.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("theme.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => setTheme(o.value)}
            className={cn("gap-2", theme === o.value && "bg-accent text-accent-foreground")}
          >
            {o.icon}
            {t(o.labelKey)}
            {theme === o.value && <span className="ml-auto text-xs text-primary">•</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
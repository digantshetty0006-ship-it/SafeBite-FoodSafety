import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  default: "text-primary bg-primary/10",
  danger: "text-red-600 bg-red-100 dark:bg-red-950",
  warning: "text-amber-600 bg-amber-100 dark:bg-amber-950",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "danger" | "warning";
  href?: string;
}) {
  const body = (
    <CardContent className="flex items-start gap-4 p-5">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      )}
    </CardContent>
  );

  if (!href) {
    return <Card>{body}</Card>;
  }

  return (
    <Link href={href} className="group block">
      <Card className="transition hover:border-primary/40 hover:shadow-sm">{body}</Card>
    </Link>
  );
}

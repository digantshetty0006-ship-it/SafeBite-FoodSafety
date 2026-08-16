import { CheckCircle2, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { tr } from "@/lib/lang";
import type { Lang } from "@/lib/i18n";

export async function RecentActions({ limit = 6, lang }: { limit?: number; lang: Lang }) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [inspections, complaints] = await Promise.all([
    db.inspection.findMany({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: limit,
      include: { business: { select: { name: true, district: true } } },
    }),
    db.complaint.findMany({
      where: { status: "resolved" },
      orderBy: { createdAt: "desc" },
      take: Math.max(2, Math.floor(limit / 3)),
      include: { business: { select: { name: true } } },
    }),
  ]);

  const rows = [
    ...inspections.map((i) => ({
      id: i.id,
      kind: "inspection" as const,
      title: t("news.inspected", { name: i.business.name }),
      place: i.business.district,
      date: i.completedAt,
    })),
    ...complaints.map((c) => ({
      id: c.id,
      kind: "complaint" as const,
      title: t("news.resolved", { name: c.business?.name ?? t("news.foodBusiness") }),
      place: "",
      date: c.createdAt,
    })),
  ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("news.noActions")}</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.slice(0, limit).map((r) => (
        <div key={`${r.kind}-${r.id}`} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
          {r.kind === "inspection" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{r.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {r.place ? `${r.place} · ` : ""}
              {formatDate(r.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
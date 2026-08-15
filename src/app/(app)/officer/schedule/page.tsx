import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ScheduleManager } from "@/components/officer/schedule-manager";
import { KpiCard } from "@/components/kpi-card";
import { CalendarClock, ClipboardCheck, AlertTriangle } from "lucide-react";
import { getLang, tr } from "@/lib/lang";

export default async function OfficerSchedulePage() {
  await requireRole("food_officer");
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);

  const [officers, businesses, inspections] = await Promise.all([
    db.user.findMany({ where: { role: "food_officer" } }),
    db.business.findMany({ orderBy: { riskScore: "desc" } }),
    db.inspection.findMany({
      include: { business: true, officer: true },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  const upcoming = inspections.filter((i) => i.status === "scheduled" && i.scheduledAt >= new Date());
  const completed = inspections.filter((i) => i.status === "completed");
  const overdue = inspections.filter(
    (i) => i.status === "scheduled" && i.scheduledAt < new Date()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("schedule.title")}</h1>
        <p className="text-sm text-muted-foreground">
          Assign officers to businesses. Queue is sorted by live risk score.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Scheduled ahead" value={upcoming.length} icon={CalendarClock} />
        <KpiCard label="Completed" value={completed.length} icon={ClipboardCheck} />
        <KpiCard label="Overdue" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "danger" : "default"} />
      </div>

      <ScheduleManager
        officers={officers.map((i) => ({ id: i.id, name: i.name, district: i.district }))}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, district: b.district, riskScore: b.riskScore }))}
        inspections={inspections.map((i) => ({
          id: i.id,
          businessId: i.businessId,
          businessName: i.business.name,
          district: i.business.district,
          riskScore: i.business.riskScore,
          officerName: i.officer.name,
          scheduledAt: i.scheduledAt,
          status: i.status,
        }))}
      />
    </div>
  );
}

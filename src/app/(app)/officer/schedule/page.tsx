import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ScheduleManager } from "@/components/officer/schedule-manager";
import { KpiCard } from "@/components/kpi-card";
import { CalendarClock, ClipboardCheck, AlertTriangle } from "lucide-react";

export default async function OfficerSchedulePage() {
  await requireRole("fda_officer");

  const [inspectors, businesses, inspections] = await Promise.all([
    db.user.findMany({ where: { role: "inspector" } }),
    db.business.findMany({ orderBy: { riskScore: "desc" } }),
    db.inspection.findMany({
      include: { business: true, inspector: true },
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
        <h1 className="text-2xl font-bold tracking-tight">Inspection Scheduling</h1>
        <p className="text-sm text-muted-foreground">
          Assign inspectors to businesses. Queue is sorted by live risk score.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Scheduled ahead" value={upcoming.length} icon={CalendarClock} />
        <KpiCard label="Completed" value={completed.length} icon={ClipboardCheck} />
        <KpiCard label="Overdue" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "danger" : "default"} />
      </div>

      <ScheduleManager
        inspectors={inspectors.map((i) => ({ id: i.id, name: i.name, district: i.district }))}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, district: b.district, riskScore: b.riskScore }))}
        inspections={inspections.map((i) => ({
          id: i.id,
          businessId: i.businessId,
          businessName: i.business.name,
          district: i.business.district,
          riskScore: i.business.riskScore,
          inspectorName: i.inspector.name,
          scheduledAt: i.scheduledAt,
          status: i.status,
        }))}
      />
    </div>
  );
}

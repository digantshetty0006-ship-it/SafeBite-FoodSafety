import Link from "next/link";
import { History, FileText, AlertTriangle, Camera, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/risk-badge";
import { formatDate } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { getLang, tr } from "@/lib/lang";

export default async function OfficerHistoryPage() {
  const officer = await requireRole("food_officer");
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);

  const inspections = await db.inspection.findMany({
    where: { officerId: officer.id, status: { in: ["completed", "missed"] } },
    include: { business: true, violations: true },
    orderBy: { completedAt: "desc" },
  });

  const totalViolations = inspections.reduce((a, i) => a + i.violations.length, 0);
  const criticalFindings = inspections
    .flatMap((i) => i.violations)
    .filter((v) => v.severity === "critical").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("history.title")}</h1>
        <p className="text-sm text-muted-foreground">Past inspections you have conducted.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Inspections conducted" value={inspections.length} icon={History} />
        <KpiCard label="Violations logged" value={totalViolations} icon={AlertTriangle} />
        <KpiCard label="Critical findings" value={criticalFindings} icon={AlertTriangle} tone={criticalFindings ? "danger" : "default"} />
      </div>

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No past inspections</p>
            <p className="text-sm text-muted-foreground">Completed inspections will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => {
            const photos = insp.photos && insp.photos !== "[]" ? JSON.parse(insp.photos) : [];
            return (
              <Link key={insp.id} href={`/officer/inspection/${insp.id}`} className="group block">
                <Card className="transition hover:border-primary/40 hover:shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium group-hover:text-primary">{insp.business.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {insp.business.district} Â· {formatDate(insp.completedAt ?? insp.scheduledAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiskBadge score={insp.business.riskScore} />
                        <Badge variant="outline">{insp.violations.length} violations</Badge>
                        {photos.length > 0 && (
                          <Badge variant="outline">
                            <Camera className="mr-1 h-3 w-3" /> {photos.length}
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </div>
                    {insp.aiSummary && (
                      <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{insp.aiSummary}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { Building2, ShieldCheck, ClipboardList, AlertTriangle, FolderOpen, Lightbulb, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge, RiskScore, RiskScoreBar, TierBadge } from "@/components/risk-badge";
import { formatDate } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { calculateRiskScore } from "@/lib/risk";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function OwnerDashboardPage() {
  const owner = await requireRole("business_owner");

  const businesses = await db.business.findMany({
    where: { ownerId: owner.id },
    include: { inspections: { include: { violations: true }, orderBy: { scheduledAt: "desc" } }, documents: true },
    orderBy: { riskScore: "desc" },
  });

  const totalViolations = businesses.reduce((a, b) => a + b.inspections.reduce((x, i) => x + i.violations.length, 0), 0);
  const expiredDocs = businesses.reduce((a, b) => a + b.documents.filter((d) => d.expiresAt && d.expiresAt < new Date()).length, 0);

  if (businesses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Business</h1>
        <Card>
          <CardContent className="flex h-56 flex-col items-center justify-center text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No businesses linked to your account</p>
            <p className="text-sm text-muted-foreground">
              This demo links your owner account to the registered businesses in the seed data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Business Compliance</h1>
        <p className="text-sm text-muted-foreground">Your safety grade, inspection history, and documents at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Registered businesses" value={businesses.length} icon={Building2} />
        <KpiCard
          label="Violations on record"
          value={totalViolations}
          icon={AlertTriangle}
          tone={totalViolations ? "warning" : "default"}
          href="/owner/suggestions"
        />
        <KpiCard
          label="Expired documents"
          value={expiredDocs}
          icon={ShieldCheck}
          tone={expiredDocs ? "danger" : "default"}
          href="/owner/documents"
        />
      </div>

      {businesses.map((b) => {
        const breakdown = calculateRiskScore(b);
        const nextInspection = b.inspections.find((i) => i.status === "scheduled" && i.scheduledAt >= new Date());
        return (
          <Card key={b.id}>
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{b.name}</h2>
                    <TierBadge tier={b.riskTier} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {b.district} · Lic. {b.licenseNumber}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Risk score</span>
                    <RiskScore score={breakdown.score} className="text-lg" />
                  </div>
                  <RiskScoreBar score={breakdown.score} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-3xl font-bold">{b.riskTier}</span>
                    <span className="text-xs text-muted-foreground">
                      {b.riskTier === "A"
                        ? "Great — keep it up"
                        : b.riskTier === "B"
                          ? "Generally good"
                          : b.riskTier === "C"
                            ? "Needs improvement"
                            : "Act urgently"}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Next inspection</p>
                  <p className="mt-1 font-medium">{nextInspection ? formatDate(nextInspection.scheduledAt) : "Not scheduled"}</p>
                  {nextInspection && (
                    <p className="text-xs text-muted-foreground">Inspector will visit on this date.</p>
                  )}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Past inspections</p>
                  <p className="mt-1 font-medium tabular-nums">{b.inspections.length}</p>
                </div>
              </div>

              {b.inspections.some((i) => i.violations.length > 0) && (
                <div>
                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" /> Recent inspection outcomes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {b.inspections
                      .slice(0, 3)
                      .flatMap((i) => i.violations)
                      .map((v) => (
                        <Badge key={v.id} variant="outline">
                          {v.type.replace(/_/g, " ")}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t pt-4">
                <Link
                  href="/owner/documents"
                  className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
                >
                  <FolderOpen className="h-4 w-4" /> Manage documents
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/owner/suggestions"
                  className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
                >
                  <Lightbulb className="h-4 w-4" /> Get improvement tips
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

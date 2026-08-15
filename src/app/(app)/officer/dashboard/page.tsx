import Link from "next/link";
import { db } from "@/lib/db";
import { BusinessTable } from "@/components/officer/business-table";
import { KpiCard } from "@/components/kpi-card";
import { AlertTriangle, Building2, ClipboardCheck, Megaphone, MessageSquareWarning, MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { COMPLAINT_STATUS_LABELS, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OfficerDashboardPage() {
  await requireRole("food_officer");

  const [
    total,
    highRisk,
    openComplaints,
    scheduled,
    avgScore,
    districts,
    categories,
    businesses,
    latestComplaints,
  ] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { riskScore: { gte: 51 } } }),
    db.complaint.count({ where: { status: { not: "resolved" } } }),
    db.inspection.count({ where: { status: "scheduled", scheduledAt: { gte: new Date() } } }),
    db.business.aggregate({ _avg: { riskScore: true } }),
    db.business.findMany({ select: { district: true }, distinct: ["district"] }),
    db.business.findMany({ select: { category: true }, distinct: ["category"] }),
    db.business.findMany({
      include: {
        inspections: { orderBy: { completedAt: "desc" }, take: 1 },
        complaints: { select: { id: true, status: true } },
      },
    }),
    db.complaint.findMany({
      where: { status: { not: "resolved" } },
      include: { business: { select: { id: true, name: true, district: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regulatory Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live risk picture across Maharashtra — highest-risk businesses first.
          </p>
        </div>
        <Link href="/officer/map" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          Open district heat map
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Registered businesses"
          value={total.toLocaleString("en-IN")}
          icon={Building2}
          hint={`${districts.length} districts`}
        />
        <KpiCard
          label="High-risk (C/D tier)"
          value={highRisk}
          icon={AlertTriangle}
          hint={`${avgScore._avg.riskScore ? Math.round(avgScore._avg.riskScore) : 0} avg score`}
          tone="danger"
          href="/officer/map"
        />
        <KpiCard
          label="Open complaints"
          value={openComplaints}
          icon={Megaphone}
          hint="awaiting action"
          tone="warning"
          href="/officer/map"
        />
        <KpiCard
          label="Upcoming inspections"
          value={scheduled}
          icon={ClipboardCheck}
          hint="scheduled"
          href="/officer/schedule"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareWarning className="h-4 w-4 text-amber-500" />
              Latest open complaints
            </CardTitle>
            <span className="text-xs text-muted-foreground">awaiting action</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {latestComplaints.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No open complaints right now.
            </p>
          )}
          {latestComplaints.map((c) => {
            const biz = c.business;
            const inner = (
              <div className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm">{c.description}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {biz ? (
                      <>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Building2 className="h-3 w-3" /> {biz.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {biz.district}
                        </span>
                      </>
                    ) : (
                      <span className="italic">Not linked to a business</span>
                    )}
                    <span>{formatDateTime(c.createdAt)}</span>
                  </p>
                  {c.photos && c.photos !== "[]" && (
                    <div className="mt-2 flex gap-1.5">
                      {JSON.parse(c.photos).map((p: string) => (
                        <img
                          key={p}
                          src={p}
                          alt="complaint photo"
                          className="h-14 w-20 rounded-md border object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0">
                  {COMPLAINT_STATUS_LABELS[c.status]}
                </Badge>
              </div>
            );
            return biz ? (
              <Link key={c.id} href={`/officer/business/${biz.id}`} className="block">
                {inner}
              </Link>
            ) : (
              <div key={c.id}>{inner}</div>
            );
          })}
        </CardContent>
      </Card>

      <BusinessTable
        businesses={businesses.map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          district: b.district,
          riskScore: b.riskScore,
          riskTier: b.riskTier,
          licenseNumber: b.licenseNumber,
          lastInspection: b.inspections[0]?.completedAt ?? b.inspections[0]?.scheduledAt ?? null,
          openComplaints: b.complaints.filter((c) => c.status !== "resolved").length,
          supplier: b.supplier,
        }))}
        districts={districts.map((d) => d.district)}
        categories={categories.map((c) => c.category)}
      />
    </div>
  );
}

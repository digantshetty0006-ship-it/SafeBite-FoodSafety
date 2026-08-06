import Link from "next/link";
import { ClipboardList, CheckCircle2, MapPin, Megaphone, Clock, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge, RiskScoreBar } from "@/components/risk-badge";
import { categoryLabel, formatDateTime, COMPLAINT_STATUS_LABELS } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateComplaintStatusAction } from "@/app/(app)/officer/complaints-actions";

export default async function OfficerQueuePage() {
  const officer = await requireRole("food_officer");

  const [inspections, assignedComplaints, allComplaints] = await Promise.all([
    db.inspection.findMany({
      where: { officerId: officer.id },
      include: { business: true },
      orderBy: { scheduledAt: "desc" },
    }),
    db.complaint.findMany({
      where: { assignedOfficerId: officer.id, status: { not: "resolved" } },
      include: { business: { select: { name: true, district: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.complaint.findMany({
      where: { status: { not: "resolved" } },
      include: {
        business: { select: { name: true, district: true } },
        assignedOfficer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const open = inspections.filter((i) => i.status === "scheduled" && i.scheduledAt >= new Date());
  const overdue = inspections.filter((i) => i.status === "scheduled" && i.scheduledAt < new Date());
  const completed = inspections.filter((i) => i.status === "completed");

  const queue = [...overdue, ...open].sort((a, b) => b.business.riskScore - a.business.riskScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Inspection Queue</h1>
        <p className="text-sm text-muted-foreground">Assigned to you, prioritised by business risk score.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Awaiting action" value={queue.length} icon={ClipboardList} />
        <KpiCard label="Overdue" value={overdue.length} icon={AlertTriangle} tone={overdue.length ? "danger" : "default"} />
        <KpiCard label="Completed" value={completed.length} icon={CheckCircle2} />
      </div>

      {assignedComplaints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-amber-500" /> Complaints assigned to you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignedComplaints.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.business ? (
                        <h3 className="font-semibold">{c.business.name}</h3>
                      ) : (
                        <h3 className="font-semibold italic">Unlinked report</h3>
                      )}
                      <Badge variant="outline">{COMPLAINT_STATUS_LABELS[c.status]}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {c.business && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.business.district}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> filed {formatDateTime(c.createdAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.status === "submitted" && (
                      <form action={updateComplaintStatusAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value="under_review" />
                        <Button type="submit" size="sm" variant="outline">
                          Start review
                        </Button>
                      </form>
                    )}
                    {c.status !== "resolved" && (
                      <form action={updateComplaintStatusAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value="resolved" />
                        <Button type="submit" size="sm">
                          Mark resolved
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {allComplaints.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-sky-500" /> All open complaints · review everything
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allComplaints.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {c.business ? (
                        <h3 className="font-semibold">{c.business.name}</h3>
                      ) : (
                        <h3 className="font-semibold italic">Unlinked report</h3>
                      )}
                      <Badge variant="outline">{COMPLAINT_STATUS_LABELS[c.status]}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {c.business && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.business.district}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> filed {formatDateTime(c.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {c.assignedOfficer?.name ?? "unassigned"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.status === "submitted" && (
                      <form action={updateComplaintStatusAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value="under_review" />
                        <Button type="submit" size="sm" variant="outline">
                          Start review
                        </Button>
                      </form>
                    )}
                    {c.status !== "resolved" && (
                      <form action={updateComplaintStatusAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value="resolved" />
                        <Button type="submit" size="sm">
                          Mark resolved
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {queue.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No inspections in your queue</p>
            <p className="text-sm text-muted-foreground">New assignments will appear here sorted by risk.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((insp) => {
            const isOverdue = insp.scheduledAt < new Date();
            return (
              <Card key={insp.id} className={cn(isOverdue && "border-red-200 dark:border-red-900")}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{insp.business.name}</h3>
                      <RiskBadge score={insp.business.riskScore} />
                      {isOverdue && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {insp.business.district}
                      </span>
                      <span>{categoryLabel(insp.business.category)}</span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" /> {formatDateTime(insp.scheduledAt)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="w-40">
                      <RiskScoreBar score={insp.business.riskScore} />
                    </div>
                    <Button asChild>
                      <Link href={`/officer/inspection/${insp.id}`}>Start inspection</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { CheckCircle2, Clock, FileSearch, ClipboardCheck, Megaphone, UserCheck, AlertOctagon, PhoneCall, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, COMPLAINT_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { reference } from "@/lib/complaints";
import { getLang, tr } from "@/lib/lang";

const STEPS = ["submitted", "under_review", "inspection_scheduled", "resolved"];
const STEP_ICONS = [Megaphone, FileSearch, ClipboardCheck, CheckCircle2];
const SLA_DAYS = 7;

export default async function CitizenComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const citizen = await requireRole("citizen");
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);
  const { submitted } = await searchParams;

  const [complaints] = await Promise.all([
    db.complaint.findMany({
      where: { citizenId: citizen.id },
      include: {
        business: { select: { name: true, district: true } },
        assignedOfficer: { select: { name: true, district: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {submitted === "1" && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <p className="font-medium">Complaint submitted successfully.</p>
          <p className="mt-1">
            It was auto-assigned to a Food Safety Officer and given a reference number. Track progress, the assigned
            officer, and auto-escalation below.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("my.title")}</h1>
          <p className="text-sm text-muted-foreground">
            Follow each report from submission through resolution — with the officer assigned and SLA clock running.
          </p>
        </div>
        <a
          href="tel:1800222365"
          className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <PhoneCall className="h-4 w-4" /> Helpline 1800-222-365
        </a>
      </div>

      {complaints.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No complaints yet</p>
            <p className="text-sm text-muted-foreground">Reports you submit will appear here with live status.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => {
            const stepIdx = STEPS.indexOf(c.status);
            const resolved = c.status === "resolved";
            const slaDeadline = new Date(c.createdAt.getTime() + SLA_DAYS * 24 * 60 * 60 * 1000);
            const now = new Date();
            const overdue = !resolved && now > slaDeadline;
            const daysLeft = Math.max(0, Math.ceil((slaDeadline.getTime() - now.getTime()) / 86400000));
            const officer =
              c.assignedOfficer ?? { name: "Food Safety Officer", district: null };

            return (
              <Card key={c.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs text-muted-foreground">{reference(c.id)}</p>
                      <Badge variant="outline">{COMPLAINT_STATUS_LABELS[c.status]}</Badge>
                      {overdue && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
                          <AlertOctagon className="mr-1 h-3 w-3" /> Escalated
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</p>
                  </div>

                  <p className="mt-2 text-sm">{c.description}</p>
                  {c.business && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.business.name} ({c.business.district})
                    </p>
                  )}
                  {c.address && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>
                        {c.address}
                        {c.district ? ` (${c.district})` : ""}
                      </span>
                    </p>
                  )}

                  {/* Accountability: officer + SLA */}
                  <div className="mt-4 grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 shrink-0 text-primary" />
                      <div className="text-xs">
                        <p className="text-muted-foreground">Assigned officer</p>
                        <p className="font-medium">
                          {officer.name}
                          {officer.district ? ` · ${officer.district}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className={cn("h-4 w-4 shrink-0", overdue ? "text-red-500" : "text-muted-foreground")} />
                      <div className="text-xs">
                        <p className="text-muted-foreground">SLA deadline</p>
                        <p className={cn("font-medium", overdue && "text-red-600")}>
                          {formatDateTime(slaDeadline)}
                          {!resolved && (overdue ? " · overdue" : ` · ${daysLeft}d left`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {overdue && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
                      <p className="font-medium">Auto-escalated to the Deputy Commissioner</p>
                      <p className="mt-0.5">
                        The SLA for this complaint was exceeded. It has been escalated automatically for accountability —
                        this mirrors the FDA&apos;s auto-escalation policy.
                      </p>
                    </div>
                  )}

                  {/* Progress steps */}
                  <div className="mt-4">
                    <div className="flex items-center">
                      {STEPS.map((s, i) => {
                        const Icon = STEP_ICONS[i];
                        const reached = i <= stepIdx;
                        return (
                          <div key={s} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                                  reached
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-muted-foreground/30 bg-muted text-muted-foreground"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
                                {COMPLAINT_STATUS_LABELS[s]}
                              </span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={cn("mx-1 h-0.5 flex-1", i < stepIdx ? "bg-emerald-500" : "bg-muted-foreground/20")} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {c.photos !== "[]" && (
                    <div className="mt-3 flex gap-2">
                      {JSON.parse(c.photos).map((p: string, i: number) => (
                        <img key={i} src={p} alt="evidence" className="h-16 w-20 rounded-md border object-cover" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

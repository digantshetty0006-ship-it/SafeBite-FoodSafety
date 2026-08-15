import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Phone, FileText, CalendarDays, Megaphone, ClipboardCheck, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { calculateRiskScore } from "@/lib/risk";
import { RiskBreakdownCard } from "@/components/officer/risk-breakdown";
import { RiskBadge, RiskScore, RiskScoreBar } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryLabel, formatDate, formatDateTime, COMPLAINT_STATUS_LABELS, INSPECTION_STATUS_LABELS, SEVERITY_LABELS } from "@/lib/format";

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("food_officer");
  const { id } = await params;
  const business = await db.business.findUnique({
    where: { id },
    include: {
      inspections: { include: { violations: true, officer: true }, orderBy: { scheduledAt: "desc" } },
      complaints: { include: { citizen: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      owner: true,
    },
  });
  if (!business) notFound();

  const breakdown = calculateRiskScore(business);
  const allViolations = business.inspections.flatMap((i) => i.violations);
  const expiredDocs = business.documents.filter((d) => d.expiresAt && d.expiresAt < new Date());
  const openComplaints = business.complaints.filter((c) => c.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/officer/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
              <RiskBadge score={business.riskScore} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {business.address}
              </span>
              <span>{categoryLabel(business.category)}</span>
              <span className="font-mono">Lic. {business.licenseNumber}</span>
            </p>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Live risk score</span>
            <RiskScore score={breakdown.score} className="text-lg" />
          </div>
          <RiskScoreBar score={breakdown.score} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{business.inspections.length}</p>
              <p className="text-xs text-muted-foreground">Inspections on record</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{allViolations.length}</p>
              <p className="text-xs text-muted-foreground">Total violations logged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Megaphone className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{openComplaints}</p>
              <p className="text-xs text-muted-foreground">Open complaints</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-sky-500" />
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {expiredDocs.length}
                <span className="text-sm font-normal text-muted-foreground"> / {business.documents.length}</span>
              </p>
              <p className="text-xs text-muted-foreground">Expired documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <RiskBreakdownCard breakdown={breakdown} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Registration & contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium">{business.owner.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact email</span>
                  <span className="font-medium">{business.owner.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registered</span>
                  <span>{formatDate(business.registeredAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier</span>
                  <span>{business.supplier ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates</span>
                  <span className="font-mono">
                    {business.lat.toFixed(4)}, {business.lng.toFixed(4)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
          {allViolations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">All violations by type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {allViolations.map((v) => (
                    <div key={v.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium">{v.type.replace(/_/g, " ")}</span>
                        <Badge variant="outline" className={SEVERITY_STYLES[v.severity]}>
                          {SEVERITY_LABELS[v.severity]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inspections" className="mt-4 space-y-3">
          {business.inspections.length === 0 && (
            <Empty text="No inspections on record for this business." />
          )}
          {business.inspections.map((insp) => (
            <Card key={insp.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      Inspection by {insp.officer.name}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {formatDateTime(insp.scheduledAt)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {insp.status === "completed" ? "Completed" : INSPECTION_STATUS_LABELS[insp.status]} ·{" "}
                      {insp.violations.length} violation(s) ·{" "}
                      {Array.isArray(insp.photos) ? insp.photos.length : JSON.parse(insp.photos).length} photo(s)
                    </p>
                  </div>
                  <Badge variant="outline">{INSPECTION_STATUS_LABELS[insp.status]}</Badge>
                </div>
                {insp.notes && <p className="mt-2 text-sm text-muted-foreground">{insp.notes}</p>}
                {insp.violations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {insp.violations.map((v) => (
                      <Badge key={v.id} variant="outline" className={SEVERITY_STYLES[v.severity]}>
                        {v.type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
                {insp.aiSummary && (
                  <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">AI report summary</p>
                    <p className="mt-1">{insp.aiSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="complaints" className="mt-4 space-y-3">
          {business.complaints.length === 0 && <Empty text="No complaints have been filed against this business." />}
          {business.complaints.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm">{c.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(c.createdAt)} ·{" "}
                      {c.anonymous || !c.citizen ? "Anonymous" : c.citizen.name}
                    </p>
                    {c.address && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>
                          {c.address}
                          {c.district ? ` (${c.district})` : ""}
                        </span>
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{COMPLAINT_STATUS_LABELS[c.status]}</Badge>
                </div>
                {c.photos !== "[]" && (
                  <div className="mt-3 flex gap-2">
                    {JSON.parse(c.photos).map((p: string) => (
                      <img key={p} src={p} alt="complaint" className="h-20 w-28 rounded-md border object-cover" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-3">
          {business.documents.length === 0 && <Empty text="No documents uploaded by this business." />}
          {business.documents.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium capitalize">{d.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {formatDate(d.uploadedAt)}
                    {d.expiresAt && <> · Expires {formatDate(d.expiresAt)}</>}
                  </p>
                </div>
                {d.expiresAt && d.expiresAt < new Date() ? (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
                    Expired
                  </Badge>
                ) : d.expiresAt ? (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="outline">On file</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}

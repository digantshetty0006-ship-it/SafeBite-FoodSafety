import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { InspectionForm } from "@/components/inspector/inspection-form";
import { RiskBadge } from "@/components/risk-badge";
import { categoryLabel, formatDateTime } from "@/lib/format";

export default async function InspectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const inspector = await requireRole("inspector");
  const { id } = await params;
  const { done } = await searchParams;

  const inspection = await db.inspection.findUnique({
    where: { id },
    include: { business: true, violations: true },
  });
  if (!inspection || inspection.inspectorId !== inspector.id) notFound();

  const completed = inspection.status === "completed" || done === "1";

  let checklist = null;
  if (Array.isArray(inspection.checklist) && inspection.checklist.length > 0) {
    checklist = inspection.checklist as { key: string; label: string; passed: boolean; notes?: string }[];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/inspector/queue"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
        <div className="flex items-center gap-2">
          <RiskBadge score={inspection.business.riskScore} />
          <span className="text-xs text-muted-foreground">
            scheduled {formatDateTime(inspection.scheduledAt)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-4 rounded-xl border bg-card p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{inspection.business.name}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {inspection.business.address}
            </span>
            <span>{categoryLabel(inspection.business.category)}</span>
            <span className="font-mono">Lic. {inspection.business.licenseNumber}</span>
          </p>
        </div>
      </div>

      <InspectionForm
        inspectionId={inspection.id}
        businessName={inspection.business.name}
        currentScore={inspection.business.riskScore}
        initialChecklist={checklist}
        initialNotes={inspection.notes}
        initialPhotos={inspection.photos && inspection.photos !== "[]" ? JSON.parse(inspection.photos) : null}
        initialAiSummary={inspection.aiSummary}
        completed={completed}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Megaphone,
  MapPin,
  Building2,
  User,
  UserCheck,
  Clock,
  AlertOctagon,
  Camera,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { reference } from "@/lib/complaints";
import { complaintStatusLabel, formatDateTime } from "@/lib/format";
import { getLang, tr } from "@/lib/lang";
import { cn } from "@/lib/utils";
import { updateComplaintStatusAction } from "../../complaints-actions";
import { PhotoLightbox } from "@/components/officer/photo-lightbox";

const SLA_DAYS = 7;

export default async function OfficerComplaintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("food_officer");
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const { id } = await params;

  const complaint = await db.complaint.findUnique({
    where: { id },
    include: {
      business: { select: { id: true, name: true, district: true, riskScore: true } },
      citizen: { select: { name: true, email: true } },
      assignedOfficer: { select: { name: true, district: true } },
    },
  });
  if (!complaint) notFound();

  const photos = complaint.photos && complaint.photos !== "[]" ? JSON.parse(complaint.photos) : [];
  const resolved = complaint.status === "resolved";
  const slaDeadline = new Date(complaint.createdAt.getTime() + SLA_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const overdue = !resolved && now > slaDeadline;
  const daysLeft = Math.max(0, Math.ceil((slaDeadline.getTime() - now.getTime()) / 86400000));
  const location = [complaint.address, complaint.district].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/officer/queue"
          className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("complaint.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {complaint.status === "submitted" && (
            <form action={updateComplaintStatusAction}>
              <input type="hidden" name="id" value={complaint.id} />
              <input type="hidden" name="status" value="under_review" />
              <Button type="submit" size="sm" variant="outline">
                <FileSearch className="mr-1.5 h-3.5 w-3.5" /> {t("queue.startReview")}
              </Button>
            </form>
          )}
          {!resolved && (
            <form action={updateComplaintStatusAction}>
              <input type="hidden" name="id" value={complaint.id} />
              <input type="hidden" name="status" value="resolved" />
              <Button type="submit" size="sm">
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> {t("queue.markResolved")}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Megaphone className="h-5 w-5 text-amber-500" />
          <h1 className="font-mono text-xl font-bold tracking-tight">{reference(complaint.id)}</h1>
          <Badge variant="outline">{complaintStatusLabel(lang, complaint.status)}</Badge>
          {overdue && (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
              <AlertOctagon className="mr-1 h-3 w-3" /> {t("my.escalatedBadge")}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("complaint.title")}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("complaint.filedOn")}</p>
                <p className="font-medium">{formatDateTime(complaint.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("complaint.filedBy")}</p>
                <p className="font-medium">
                  {complaint.anonymous || !complaint.citizen
                    ? t("common.anonymous")
                    : `${complaint.citizen.name} <${complaint.citizen.email}>`}
                </p>
              </div>
            </div>
            {complaint.business && (
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("complaint.business")}</p>
                  <Link
                    href={`/officer/business/${complaint.business.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {complaint.business.name} ({complaint.business.district})
                  </Link>
                </div>
              </div>
            )}
            {location && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("complaint.location")}</p>
                  <p className="font-medium">{location}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("complaint.assignedTo")}</p>
                <p className="font-medium">
                  {complaint.assignedOfficer?.name ??
                    `${complaint.assignedOfficer?.district ? `${complaint.assignedOfficer.district} · ` : ""}${t("queue.unassigned")}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className={cn("mt-0.5 h-4 w-4 shrink-0", overdue ? "text-red-500" : "text-muted-foreground")} />
              <div>
                <p className="text-xs text-muted-foreground">{t("my.slaDeadline")}</p>
                <p className={cn("font-medium", overdue && "text-red-600")}>
                  {formatDateTime(slaDeadline)}
                  {!resolved && (overdue ? t("my.overdueSuffix") : t("my.daysLeft", { n: String(daysLeft) }))}
                </p>
              </div>
            </div>
          </div>

          {overdue && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
              <p className="font-medium">{t("my.escalated")}</p>
              <p className="mt-0.5">{t("my.escalatedBody")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <FileSearch className="h-4 w-4 text-primary" /> {t("complaint.description")}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{complaint.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Camera className="h-4 w-4 text-primary" /> {t("complaint.photos")}
            {photos.length > 0 && <span className="text-xs font-normal text-muted-foreground">({photos.length})</span>}
          </h2>
          {photos.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("complaint.noPhotos")}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {photos.map((p: string, i: number) => (
                <PhotoLightbox key={i} src={p} index={i + 1} count={photos.length} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
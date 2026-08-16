"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CalendarClock, CheckCircle2, AlertCircle, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scheduleInspectionAction } from "@/app/(app)/officer/schedule/actions";
import { formatDate, formatDateTime, inspectionStatusLabel } from "@/lib/format";
import { tr, type Lang } from "@/lib/i18n";
import { RiskBadge } from "@/components/risk-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Officer {
  id: string;
  name: string;
  district: string | null;
}

interface BusinessOption {
  id: string;
  name: string;
  district: string;
  riskScore: number;
}

interface ScheduledInspection {
  id: string;
  businessId: string;
  businessName: string;
  district: string;
  riskScore: number;
  officerName: string;
  scheduledAt: Date | string;
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "text-sky-600",
  completed: "text-emerald-600",
  missed: "text-red-600",
};

export function ScheduleManager({
  officers,
  businesses,
  inspections,
  lang,
}: {
  officers: Officer[];
  businesses: BusinessOption[];
  inspections: ScheduledInspection[];
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const upcoming = inspections
    .filter((i) => i.status === "scheduled")
    .sort((a, b) => b.riskScore - a.riskScore);
  const past = inspections
    .filter((i) => i.status !== "scheduled")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const submit = () => {
    const fd = new FormData();
    fd.set("businessId", businessId);
    fd.set("officerId", officerId);
    fd.set("scheduledAt", scheduledAt);
    scheduleInspectionAction(fd);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            {t("schedule.all")}
          </Button>
          <Button
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("upcoming")}
          >
            {t("schedule.upcomingCount", { n: String(upcoming.length) })}
          </Button>
          <Button
            variant={statusFilter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("past")}
          >
            {t("schedule.completedMissed")}
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t("schedule.scheduleBtn")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("schedule.scheduleInspection")}</DialogTitle>
              <DialogDescription>
                {t("schedule.dialogDesc")}
              </DialogDescription>
            </DialogHeader>
            <form
              action={scheduleInspectionAction}
              className="space-y-4"
              onSubmit={() => setOpen(false)}
            >
              <div className="space-y-2">
                <Label>{t("form.business")}</Label>
                <Select value={businessId} onValueChange={setBusinessId} name="businessId">
                  <SelectTrigger>
                    <SelectValue placeholder={t("schedule.selectBusiness")} />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {t("schedule.riskOption", { name: b.name, district: b.district, r: String(Math.round(b.riskScore)) })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form.officer")}</Label>
                <Select value={officerId} onValueChange={setOfficerId} name="officerId">
                  <SelectTrigger>
                    <SelectValue placeholder={t("schedule.selectOfficer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {officers.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} {i.district ? `· ${i.district}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("form.dateTime")}</Label>
                <Input
                  type="datetime-local"
                  name="scheduledAt"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!businessId || !officerId || !scheduledAt}>
                  {t("schedule.submit")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {(statusFilter === "all" || statusFilter === "upcoming") && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CalendarClock className="h-4 w-4" /> {t("schedule.upcomingSorted")}
            </h2>
            <div className="space-y-3">
              {upcoming.length === 0 && (
                <Card>
                  <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    {t("schedule.noUpcoming")}
                  </CardContent>
                </Card>
              )}
              {upcoming.map((i) => (
                <Link key={i.id} href={`/officer/business/${i.businessId}`} className="group block">
                  <Card className="transition hover:border-primary/40 hover:shadow-sm">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            i.riskScore >= 75
                              ? "bg-red-100 text-red-600 dark:bg-red-950"
                              : i.riskScore >= 51
                                ? "bg-orange-100 text-orange-600 dark:bg-orange-950"
                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950"
                          )}
                        >
                          {i.riskScore >= 51 ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary">{i.businessName}</p>
                          <p className="text-xs text-muted-foreground">
                            {i.district} · {t("schedule.officerOf", { name: i.officerName })} · {formatDateTime(i.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiskBadge score={i.riskScore} />
                        <span className={cn("text-xs font-medium", STATUS_STYLE[i.status])}>
                          {inspectionStatusLabel(lang, i.status)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(statusFilter === "all" || statusFilter === "past") && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <XCircle className="h-4 w-4" /> {t("schedule.completedMissed")}
            </h2>
            <div className="space-y-3">
              {past.length === 0 && (
                <Card>
                  <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    {t("schedule.noPast")}
                  </CardContent>
                </Card>
              )}
              {past.map((i) => (
                <Link key={i.id} href={`/officer/business/${i.businessId}`} className="group block">
                  <Card className="transition hover:border-primary/40 hover:shadow-sm">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium group-hover:text-primary">{i.businessName}</p>
                        <p className="text-xs text-muted-foreground">
                          {i.district} · {formatDate(i.scheduledAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("text-xs font-medium", STATUS_STYLE[i.status])}>
                          {inspectionStatusLabel(lang, i.status)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
import { formatDate, formatDateTime, INSPECTION_STATUS_LABELS } from "@/lib/format";
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
}: {
  officers: Officer[];
  businesses: BusinessOption[];
  inspections: ScheduledInspection[];
}) {
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [officerId, setOfficerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
            All
          </Button>
          <Button
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("upcoming")}
          >
            Upcoming ({upcoming.length})
          </Button>
          <Button
            variant={statusFilter === "past" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("past")}
          >
            Completed / missed
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Schedule inspection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule an inspection</DialogTitle>
              <DialogDescription>
                Assign an officer to a business based on risk priority.
              </DialogDescription>
            </DialogHeader>
            <form
              action={scheduleInspectionAction}
              className="space-y-4"
              onSubmit={() => setOpen(false)}
            >
              <div className="space-y-2">
                <Label>Business</Label>
                <Select value={businessId} onValueChange={setBusinessId} name="businessId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} ({b.district}) — risk {Math.round(b.riskScore)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Officer</Label>
                <Select value={officerId} onValueChange={setOfficerId} name="officerId">
                  <SelectTrigger>
                    <SelectValue placeholder="Select officer" />
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
                <Label>Date & time</Label>
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
                  Schedule
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
              <CalendarClock className="h-4 w-4" /> Upcoming — priority sorted
            </h2>
            <div className="space-y-3">
              {upcoming.length === 0 && (
                <Card>
                  <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    No upcoming inspections.
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
                            {i.district} · Officer {i.officerName} · {formatDateTime(i.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <RiskBadge score={i.riskScore} />
                        <span className={cn("text-xs font-medium", STATUS_STYLE[i.status])}>
                          {INSPECTION_STATUS_LABELS[i.status]}
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
              <XCircle className="h-4 w-4" /> Completed & missed
            </h2>
            <div className="space-y-3">
              {past.length === 0 && (
                <Card>
                  <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    No completed inspections yet.
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
                          {INSPECTION_STATUS_LABELS[i.status]}
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

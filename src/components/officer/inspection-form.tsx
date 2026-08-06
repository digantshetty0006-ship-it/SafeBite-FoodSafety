"use client";

import { useRef, useState } from "react";
import { Camera, Sparkles, Check, X, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_CHECKLIST, generateAiReport, type ChecklistItem, type AiReport } from "@/lib/ai-report";
import { uploadInspectionPhotoAction, completeInspectionAction } from "@/app/(app)/officer/inspection/actions";
import { SEVERITY_LABELS } from "@/lib/format";
import { toast } from "sonner";

const SEVERITY_ORDER = ["low", "medium", "high", "critical"] as const;

export function InspectionForm({
  inspectionId,
  businessName,
  currentScore,
  initialChecklist,
  initialNotes,
  initialPhotos,
  initialAiSummary,
  completed,
}: {
  inspectionId: string;
  businessName: string;
  currentScore: number;
  initialChecklist: ChecklistItem[] | null;
  initialNotes: string | null;
  initialPhotos: string[] | null;
  initialAiSummary: string | null;
  completed: boolean;
}) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialChecklist && initialChecklist.length
      ? initialChecklist.map((c) => ({ ...c }))
      : DEFAULT_CHECKLIST.map((c) => ({ ...c }))
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [photos, setPhotos] = useState<string[]>(initialPhotos ?? []);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<AiReport | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const failedCount = checklist.filter((c) => !c.passed).length;

  const toggleItem = (key: string) => {
    setChecklist((prev) => prev.map((c) => (c.key === key ? { ...c, passed: !c.passed, notes: !c.passed ? "Needs corrective action" : c.notes } : c)));
  };

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const r = generateAiReport({ businessName, currentScore, checklist, notes });
      setReport(r);
      setGenerating(false);
    }, 600);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadInspectionPhotoAction(fd);
    setUploading(false);
    if (res.ok && res.url) {
      setPhotos((p) => [...p, res.url!]);
      toast.success("Photo attached");
    } else {
      toast.error(res.error ?? "Upload failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    if (!report) {
      toast.error("Generate the AI report before submitting.");
      return;
    }
    const fd = new FormData();
    fd.set("inspectionId", inspectionId);
    fd.set("checklist", JSON.stringify(checklist));
    fd.set("notes", notes);
    fd.set("photos", JSON.stringify(photos));
    fd.set("aiSummary", report.summary);
    fd.set("riskDelta", String(report.riskDelta));
    fd.set(
      "violations",
      JSON.stringify(
        report.suggestedViolations.map((v) => ({
          type: v.type,
          severity: v.severity,
          description: v.description,
        }))
      )
    );
    setSubmitted(true);
    completeInspectionAction(fd);
  };

  if (completed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Inspection completed</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            The AI report below was generated and the business risk score has been recomputed.
          </p>
          {initialAiSummary && (
            <div className="mt-4 w-full max-w-xl rounded-lg border bg-muted/40 p-4 text-left text-sm">{initialAiSummary}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Checklist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Inspection checklist</CardTitle>
          <Badge variant="outline" className={cn(failedCount > 0 && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}>
            {failedCount} non-compliant
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleItem(item.key)}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition",
                item.passed ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900" : "bg-red-50/60 border-red-200 dark:bg-red-950/40 dark:border-red-900"
              )}
            >
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.passed ? "Compliant" : "Non-compliant"}</p>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  item.passed ? "border-emerald-500 bg-emerald-500 text-white" : "border-red-500 bg-red-500 text-white"
                )}
              >
                {item.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notes + photos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Officer notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record observations, corrective advice given, and any immediate risks…"
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photo evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="group relative">
                      <img src={p} alt={`evidence ${i + 1}`} className="h-24 w-full rounded-lg border object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {uploading ? "Uploading…" : "Capture / upload photo"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Stored on local disk for the demo — would move to S3/GCS in production.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> AI Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              A deterministic, explainable model turns the checklist + notes into a structured report and a recommended
              risk delta for this business.
            </p>
            <Button onClick={generate} disabled={generating} className="w-full">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate AI report
            </Button>

            {report && (
              <div className="space-y-4">
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    report.tone === "critical"
                      ? "border-red-200 bg-red-50 dark:bg-red-950/40"
                      : report.tone === "warning"
                        ? "border-amber-200 bg-amber-50 dark:bg-amber-950/40"
                        : "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40"
                  )}
                >
                  <p className="text-sm font-medium">
                    {report.tone === "positive" ? "Positive result" : report.tone === "warning" ? "Follow-up recommended" : "High-risk finding"}
                  </p>
                  <p className="mt-1 text-sm">{report.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">Checklist {report.checklistScore}</Badge>
                    <Badge variant="outline">Risk delta +{report.riskDelta}</Badge>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Suggested violations to log</p>
                  {report.suggestedViolations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No violations detected. Clean bill of compliance.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.suggestedViolations.map((v, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium capitalize">{v.type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground">{v.description}</p>
                          </div>
                          <SelectSeverity
                            value={v.severity}
                            onChange={(sev) => {
                              setReport((r) =>
                                r
                                  ? {
                                      ...r,
                                      suggestedViolations: r.suggestedViolations.map((sv, idx) =>
                                        idx === i ? { ...sv, severity: sev } : sv
                                      ),
                                    }
                                  : r
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button onClick={submit} disabled={!report || submitted} className="w-full">
              {submitted ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {submitted ? "Submitting…" : "Complete inspection"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SelectSeverity({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
    >
      {SEVERITY_ORDER.map((s) => (
        <option key={s} value={s}>
          {SEVERITY_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

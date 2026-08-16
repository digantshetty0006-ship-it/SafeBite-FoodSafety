"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Camera,
  Loader2,
  Megaphone,
  X,
  Trash2,
  Search,
  MapPin,
  Sparkles,
  Mic,
  MicOff,
  Phone,
  RefreshCcw,
  ScanSearch,
  ShieldAlert,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { uploadComplaintPhotoAction, submitComplaintAction } from "@/app/(app)/citizen/actions";
import { categoryLabel } from "@/lib/format";
import { tr, type Lang } from "@/lib/i18n";
import { draftComplaint } from "@/lib/ai-report";
import { analyzeEvidenceImage, aggregateEvidence, type AnalysisLevel, type EvidenceAnalysis } from "@/lib/food-image-analysis";
import type { PickedPlace } from "@/components/citizen/map-picker";

const MapPicker = dynamic(() => import("@/components/citizen/map-picker").then((m) => m.MapPicker), {
  ssr: false,
});

interface SpeechRecognitionEventLike {
  results: { 0: { 0: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: Lang;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
}

interface BusinessHit {
  id: string;
  name: string;
  district: string;
  category: string;
}

interface AnalysisState extends EvidenceAnalysis {
  rationale?: string;
}

export function ReportForm({ businesses, initialBusiness = "", lang }: { businesses: BusinessHit[]; initialBusiness?: string; lang: Lang }) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lat, setLat] = useState(19.076);
  const [lng, setLng] = useState(72.8777);
  const [picked, setPicked] = useState<Partial<PickedPlace> | null>(null);
  const [query, setQuery] = useState(initialBusiness);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<{ type: string; severity: string } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const analysisToken = useRef(0);

  const runAnalysis = useCallback(async (urls: string[]) => {
    const token = ++analysisToken.current;
    if (urls.length === 0) {
      setAnalysis(null);
      setAnalyzing(false);
      return;
    }
    setAnalyzing(true);
    try {
      const results = await Promise.all(urls.map((u) => analyzeEvidenceImage(u).catch(() => null)));
      const valid = results.filter((r): r is EvidenceAnalysis => r !== null);
      if (token !== analysisToken.current) return;
      const local = aggregateEvidence(valid);
      setAnalysis({ ...local });
      try {
        const res = await fetch("/api/analyze-evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: urls.slice(0, 4) }),
        });
        if (res.ok) {
          const data = (await res.json()) as AnalysisState;
          if (token === analysisToken.current && data?.engine === "vision") setAnalysis(data);
        }
      } catch {
        // keep on-device result
      }
    } catch {
      setAnalysis(null);
    } finally {
      if (token === analysisToken.current) setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    void runAnalysis(photos);
  }, [photos, runAnalysis]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return businesses.filter((b) => b.name.toLowerCase().includes(q) || b.district.toLowerCase().includes(q)).slice(0, 6);
  }, [query, businesses]);

  const selected = businesses.find((b) => b.id === businessId);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("cit.onlyImages"));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await downscaleImage(file, 1280, 0.82);
      if (dataUrl.length > 1_500_000) {
        toast.error(t("cit.imageTooLarge"));
        return;
      }
      const fd = new FormData();
      fd.set("dataUrl", dataUrl);
      const res = await uploadComplaintPhotoAction(fd);
      if (res.ok && res.url) {
        setPhotos((p) => [...p, res.url!]);
      } else {
        toast.error(res.error ?? t("cit.uploadFailed"));
      }
    } catch {
      toast.error(t("cit.readFail"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const draftWithAi = () => {
    if (!description.trim()) {
      toast.error(t("cit.describeFirst"));
      return;
    }
    const d = draftComplaint(description, selected?.name);
    setDescription(d.body);
    setDraft({ type: d.type, severity: d.severity });
    toast.success(t("cit.structured"));
  };

  const startVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      toast.error(t("cit.voiceUnsupported"));
      return;
    }
    const rec = new Ctor();
    (rec as { lang: string }).lang = "en-IN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error(t("cit.voiceFail"));
    };
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      const transcript = e.results[0][0].transcript;
      setDescription((d) => (d ? `${d} ${transcript}` : transcript));
      setDraft(null);
    };
    rec.start();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (photos.length === 0) {
      toast.error(t("cit.photoRequired"));
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("photos", JSON.stringify(photos));
    fd.set("lat", String(lat));
    fd.set("lng", String(lng));
    if (picked?.address) fd.set("address", picked.address);
    if (picked?.district) fd.set("district", picked.district);
    if (businessId) fd.set("businessId", businessId);
    setSubmitting(true);
    await submitComplaintAction(fd);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" /> {t("cit.tellUs")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("cit.whichBusiness")}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (businessId) setBusinessId(null);
                }}
                placeholder={t("cit.businessPlaceholder")}
                className="pl-8"
              />
            </div>
            {query && results.length > 0 && (
              <div className="overflow-hidden rounded-lg border">
                {results.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => {
                      setBusinessId(b.id);
                      setQuery(b.name);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{b.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {categoryLabel(lang, b.category)} · {b.district}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2 text-sm">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {selected.name}
                </span>
                <button type="button" onClick={() => setBusinessId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="description">{t("cit.describe")}</Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={startVoice} disabled={!speechSupported}>
                  {listening ? (
                    <>
                      <MicOff className="mr-1.5 h-3.5 w-3.5 animate-pulse text-red-500" /> {t("cit.listening")}
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1.5 h-3.5 w-3.5" /> {t("cit.speak")}
                    </>
                  )}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={draftWithAi}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> {t("cit.draftAi")}
                </Button>
              </div>
            </div>
            <Textarea
              id="description"
              name="description"
              required
              rows={6}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDraft(null);
              }}
              placeholder={t("cit.descPlaceholder")}
            />
            {draft && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {t("cit.draftNote", { type: draft.type, sev: draft.severity })}
                </span>
                <button type="button" onClick={() => setDraft(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t("cit.languageHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("cit.photoEvidence")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("cit.photoHint")}
            </p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="group relative">
                  <img src={p} alt="evidence" className="h-20 w-24 rounded-lg border object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {uploading ? t("cit.uploading") : t("cit.addPhoto")}
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => void runAnalysis(photos)}
              disabled={analyzing || photos.length === 0}
            >
              {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4 text-primary" />}
              {analyzing ? t("cit.analysing") : t("cit.analyse")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("cit.analyseHint")}
            </p>

            {analysis && !analyzing && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-primary" /> {t("cit.preliminary")}
                  </p>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {analysis.engine === "vision" ? (analysis.model ? analysis.model : t("cit.visionModel")) : t("cit.onDevice")}
                  </span>
                </div>
                {analysis.rationale && (
                  <p className="mt-1 text-xs italic text-muted-foreground">{analysis.rationale}</p>
                )}

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("cit.possibleContamination")}</span>
                    <LevelPill level={analysis.contamination} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("cit.possibleHygiene")}</span>
                    <LevelPill level={analysis.hygiene} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Gauge className="h-3.5 w-3.5" /> {t("cit.evidenceQuality")}
                      </span>
                      <span className="font-semibold">{analysis.evidenceQuality}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${analysis.evidenceQuality}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("cit.indicators")}
                  </p>
                  {analysis.indicators.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("cit.noIndicators")}</p>
                  ) : (
                    <ul className="space-y-1">
                      {analysis.indicators.map((i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span className="capitalize">{i}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" /> {t("cit.advisoryTitle")}
                  </p>
                  <p className="mt-1 text-amber-700 dark:text-amber-300/70">
                    {t("cit.advisoryBody")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("cit.reportAnonymously")}</p>
              <p className="text-xs text-muted-foreground">{t("cit.anonymousHint")}</p>
            </div>
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
          </div>
          <input type="hidden" name="anonymous" value={anonymous ? "on" : "off"} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("cit.location")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MapPicker lat={lat} lng={lng} lang={lang} onPick={(a, b, place) => {
              setLat(a);
              setLng(b);
              setPicked(place && place.address ? place : null);
            }} />
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("cit.helpTitle")}</p>
              <p className="text-xs text-muted-foreground">
                Toll-free helpline{" "}
                <a href="tel:1800222365" className="font-semibold text-primary hover:underline">
                  1800-222-365
                </a>{" "}
                {t("cit.hours")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
          {t("cit.submit")}
        </Button>

        <p className="flex items-center gap-2 text-center text-xs text-muted-foreground">
          <RefreshCcw className="h-3.5 w-3.5" /> {t("cit.trackHint")}
        </p>
      </div>
    </form>
  );
}

function LevelPill({ level }: { level: AnalysisLevel }) {
  const styles: Record<AnalysisLevel, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}>{level}</span>;
}

function downscaleImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!ctx) {
        reject(new Error("canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not decode image"));
    };
    img.src = url;
  });
}

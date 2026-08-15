"use client";

import { useMemo, useRef, useState } from "react";
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
import { draftComplaint } from "@/lib/ai-report";
import type { PickedPlace } from "@/components/citizen/map-picker";

const MapPicker = dynamic(() => import("@/components/citizen/map-picker").then((m) => m.MapPicker), {
  ssr: false,
});

interface SpeechRecognitionEventLike {
  results: { 0: { 0: { transcript: string } } };
}

interface SpeechRecognitionLike {
  lang: string;
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

export function ReportForm({ businesses, initialBusiness = "" }: { businesses: BusinessHit[]; initialBusiness?: string }) {
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
      toast.error("Only image files are allowed.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await downscaleImage(file, 1280, 0.82);
      if (dataUrl.length > 1_500_000) {
        toast.error("Image too large. Try a smaller photo.");
        return;
      }
      const fd = new FormData();
      fd.set("dataUrl", dataUrl);
      const res = await uploadComplaintPhotoAction(fd);
      if (res.ok && res.url) {
        setPhotos((p) => [...p, res.url!]);
      } else {
        toast.error(res.error ?? "Upload failed");
      }
    } catch {
      toast.error("Could not read that image. Try a different photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const draftWithAi = () => {
    if (!description.trim()) {
      toast.error("Describe what happened first, then we'll structure it.");
      return;
    }
    const d = draftComplaint(description, selected?.name);
    setDescription(d.body);
    setDraft({ type: d.type, severity: d.severity });
    toast.success("AI structured your complaint into points.");
  };

  const startVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      toast.error("Voice input is not supported in this browser. Please type your complaint.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error("Could not hear you. Please type your complaint instead.");
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
            <Megaphone className="h-4 w-4 text-primary" /> Tell us what happened
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Which business? (optional)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (businessId) setBusinessId(null);
                }}
                placeholder="Search business name or area…"
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
                      {categoryLabel(b.category)} · {b.district}
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
              <Label htmlFor="description">Describe the issue *</Label>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={startVoice} disabled={!speechSupported}>
                  {listening ? (
                    <>
                      <MicOff className="mr-1.5 h-3.5 w-3.5 animate-pulse text-red-500" /> Listening…
                    </>
                  ) : (
                    <>
                      <Mic className="mr-1.5 h-3.5 w-3.5" /> Speak
                    </>
                  )}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={draftWithAi}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> Draft with AI
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
              placeholder="Speak or type loosely — e.g. 'Ate at the shop last night, got sick, fridge items looked stale and expired' — then tap Draft with AI to structure it."
            />
            {draft && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  AI classified this as <strong>{draft.type}</strong> (severity: {draft.severity}). Edit the draft above if
                  needed.
                </span>
                <button type="button" onClick={() => setDraft(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Type or speak in English, Hindi, or Marathi. Our rule-based assistant structures it for the Food Safety
              Officer.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Photo evidence</Label>
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
              {uploading ? "Uploading…" : "Add photo"}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Report anonymously</p>
              <p className="text-xs text-muted-foreground">We will not share your identity with the business.</p>
            </div>
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
          </div>
          <input type="hidden" name="anonymous" value={anonymous ? "on" : "off"} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <MapPicker lat={lat} lng={lng} onPick={(a, b, place) => {
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
              <p className="text-sm font-medium">Prefer to talk to someone?</p>
              <p className="text-xs text-muted-foreground">
                Toll-free helpline{" "}
                <a href="tel:1800222365" className="font-semibold text-primary hover:underline">
                  1800-222-365
                </a>{" "}
                · 24×7, all days
              </p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
          Submit complaint
        </Button>

        <p className="flex items-center gap-2 text-center text-xs text-muted-foreground">
          <RefreshCcw className="h-3.5 w-3.5" /> Track progress, assigned officer and escalation online after submission.
        </p>
      </div>
    </form>
  );
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

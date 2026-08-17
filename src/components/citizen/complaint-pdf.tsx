"use client";

import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { FileDown, Loader2, ChevronDown } from "lucide-react";
import { tr, LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { EvidenceAnalysis } from "@/lib/food-image-analysis";

export interface ComplaintPdfData {
  reference: string;
  statusLabel: string;
  filedAt: string;
  description: string;
  businessName?: string | null;
  businessDistrict?: string | null;
  address?: string | null;
  district?: string | null;
  officerName: string;
  officerDistrict?: string | null;
  slaDeadline: string;
  slaStatus: "resolved" | "overdue" | "pending";
  slaDaysLeft: number;
  overdue: boolean;
  photos: string[];
  aiAnalysis?: string | null;
  citizenName: string;
  citizenEmail: string;
}

// A4 @ 300 dpi. Drawing directly on canvas means the browser text engine
// shapes Devanagari (conjuncts, matras) accurately — jsPDF's built-in fonts
// cannot render it at all. Supersampled for crisp output.
const W = 2480;
const H = 3508;
const PAD = 120;
const BAND_H = 480;
const CONTENT_TOP = 700;
const FOOTER_H = 240;
const EMERALD = "#047857";
const GOLD = "#f59e0b";
const FONT = "'Noto Sans Devanagari', 'Nirmala UI', 'Segoe UI', system-ui, sans-serif";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    let line = "";
    for (const word of raw.split(" ")) {
      const cand = line ? line + " " + word : word;
      if (ctx.measureText(cand).width <= maxWidth) {
        line = cand;
        continue;
      }
      if (!line) {
        // single word wider than the box — hard-break it so nothing gets clipped
        let chunk = "";
        for (const ch of word) {
          if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
            out.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

function drawField(
  ctx: CanvasRenderingContext2D,
  y: number,
  label: string,
  value: string,
  maxWidth: number
): number {
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = "#6b7280";
  const lw = Math.min(ctx.measureText(label).width, 600);
  ctx.fillText(label, PAD, y);
  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = "#1f2937";
  const lines = wrapLines(ctx, value, maxWidth - lw - 32);
  lines.forEach((ln, i) => ctx.fillText(ln, PAD + lw + 32, y + i * 46));
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y + lines.length * 46 + 14);
  ctx.lineTo(W - PAD, y + lines.length * 46 + 14);
  ctx.stroke();
  return y + lines.length * 46;
}

function drawSection(ctx: CanvasRenderingContext2D, y: number, text: string): number {
  ctx.fillStyle = GOLD;
  roundRect(ctx, PAD, y + 10, 90, 7, 3);
  ctx.fill();
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = "#374151";
  ctx.fillText(text.toUpperCase(), PAD + 124, y);
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y + 44);
  ctx.lineTo(W - PAD, y + 44);
  ctx.stroke();
  return y + 80;
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
): void {
  roundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "#ecfdf5";
  ctx.fill();
  ctx.strokeStyle = "#a7f3d0";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = `700 22px ${FONT}`;
  ctx.fillStyle = EMERALD;
  ctx.fillText(label.toUpperCase(), x + 36, y + 30);
  ctx.font = `400 28px ${FONT}`;
  ctx.fillStyle = "#065f46";
  const lines = wrapLines(ctx, value, w - 72);
  lines.forEach((ln, i) => ctx.fillText(ln, x + 36, y + 82 + i * 46));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ComplaintPdf({ data, label, lang }: { data: ComplaintPdfData; label: string; lang: Lang }) {
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfLang, setPdfLang] = useState<Lang>(lang);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const t = (k: string, vars?: Record<string, string>) => tr(pdfLang, k, vars);

  useEffect(() => setPdfLang(lang), [lang]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogo(img);
    img.src = "/logo-white.png";
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const download = async (langOverride?: Lang) => {
    setMenuOpen(false);
    setBusy(true);
    const dl = langOverride ?? pdfLang;
    const dlT = (k: string, vars?: Record<string, string>) => tr(dl, k, vars);
    try {
      const photos = await Promise.all(
        data.photos.map(
          (src) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error("photo load failed"));
              img.src = src;
            })
        )
      );

      const logoImg = logo ?? (await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = "/logo-white.png";
      }));

      const pages: HTMLCanvasElement[] = [];
      const contexts: CanvasRenderingContext2D[] = [];
      let y = 0;

      const newPage = (withHeader: boolean) => {
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const x = c.getContext("2d")!;
        x.fillStyle = "#ffffff";
        x.fillRect(0, 0, W, H);
        x.textBaseline = "top";
        pages.push(c);
        contexts.push(x);
        y = withHeader ? CONTENT_TOP : 160;

        // subtle page frame
        x.strokeStyle = "#d1fae5";
        x.lineWidth = 4;
        roundRect(x, 24, 24, W - 48, H - 48, 24);
        x.stroke();

        if (!withHeader) return;

        // Header band — emerald gradient, logo top-left with short tagline under it
        const band = x.createLinearGradient(0, 0, 0, BAND_H);
        band.addColorStop(0, "#059669");
        band.addColorStop(1, "#047857");
        x.fillStyle = band;
        x.fillRect(0, 0, W, BAND_H);
        x.globalAlpha = 0.3;
        x.fillStyle = "#a7f3d0";
        x.fillRect(0, BAND_H - 8, W, 8);
        x.globalAlpha = 1;
        const logoX = PAD + 60;
        if (logoImg) {
          const lh = 150;
          const lw = (logoImg.naturalWidth / logoImg.naturalHeight) * lh;
          x.drawImage(logoImg, logoX, 120, lw, lh);
        } else {
          x.fillStyle = "#ffffff";
          x.font = `800 90px ${FONT}`;
          x.fillText("✓", logoX, 130);
        }
        x.font = `400 38px ${FONT}`;
        x.fillStyle = "#d1fae5";
        x.fillText(dlT("pdf.tagline"), logoX, 294);

        // Right-aligned authority block
        x.textAlign = "right";
        x.font = `700 32px ${FONT}`;
        x.fillStyle = "#ffffff";
        x.fillText(dlT("pdf.authority"), W - PAD - 60, 140);
        x.font = `400 30px ${FONT}`;
        x.fillStyle = "#d1fae5";
        x.fillText(dlT("pdf.state"), W - PAD - 60, 212);
        x.font = `400 28px ${FONT}`;
        x.fillStyle = "#a7f3d0";
        x.fillText(dlT("pdf.helpline"), W - PAD - 60, 270);
        x.textAlign = "left";

        // Centred title block below the band
        x.textAlign = "center";
        x.font = `700 44px ${FONT}`;
        x.fillStyle = "#111827";
        x.fillText(dlT("pdf.receipt"), W / 2, BAND_H + 62);
        x.font = `400 28px ${FONT}`;
        x.fillStyle = "#6b7280";
        x.fillText(dlT("pdf.subtitle"), W / 2, BAND_H + 138);
        x.fillStyle = GOLD;
        roundRect(x, W / 2 - 70, BAND_H + 194, 140, 8, 4);
        x.fill();
        x.textAlign = "left";
        y = CONTENT_TOP;
      };

      const fit = (h: number) => {
        if (y + h > H - FOOTER_H - 40) newPage(false);
      };

      newPage(true);
      const ctx = () => contexts[pages.length - 1];
      const fieldWidth = W - 2 * PAD;

      // Ref + status
      fit(120);
      ctx().font = `800 50px 'Consolas', 'Courier New', monospace`;
      ctx().fillStyle = "#171717";
      const refText = `${dlT("pdf.refLabel")}: ${data.reference}`;
      const refW = ctx().measureText(refText).width;
      ctx().font = `700 34px ${FONT}`;
      const statusText = data.statusLabel;
      const sw = ctx().measureText(statusText).width + 84;
      const pillX = W - PAD - sw;
      if (refW > pillX - PAD - 60) {
        // status pill would collide with the ref — move it to its own line
        ctx().font = `800 50px 'Consolas', 'Courier New', monospace`;
        ctx().fillText(refText, PAD, y);
        ctx().font = `700 34px ${FONT}`;
        ctx().fillStyle = data.overdue ? "#dc2626" : EMERALD;
        roundRect(ctx(), W - PAD - sw, y + 100, sw, 74, 37);
        ctx().fill();
        ctx().fillStyle = "#ffffff";
        ctx().textBaseline = "middle";
        ctx().fillText(statusText, W - PAD - sw + 42, y + 100 + 37);
        ctx().textBaseline = "top";
        y += 190;
      } else {
        ctx().font = `800 50px 'Consolas', 'Courier New', monospace`;
        ctx().fillText(refText, PAD, y);
        ctx().font = `700 34px ${FONT}`;
        ctx().fillStyle = data.overdue ? "#dc2626" : EMERALD;
        roundRect(ctx(), pillX, y, sw, 74, 37);
        ctx().fill();
        ctx().fillStyle = "#ffffff";
        ctx().textBaseline = "middle";
        ctx().fillText(statusText, pillX + 42, y + 37);
        ctx().textBaseline = "top";
        y += 110;
      }

      ctx().strokeStyle = "#e5e5e5";
      ctx().lineWidth = 2;
      ctx().beginPath();
      ctx().moveTo(PAD, y);
      ctx().lineTo(W - PAD, y);
      ctx().stroke();
      y += 52;

      // Details
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.details")) - 16;
      const fields: Array<[string, string]> = [
        [dlT("pdf.filedOn"), data.filedAt],
        [dlT("pdf.filedBy"), `${data.citizenName} <${data.citizenEmail}>`],
      ];
      if (data.businessName)
        fields.push([dlT("pdf.business"), data.businessName + (data.businessDistrict ? ` (${data.businessDistrict})` : "")]);
      const location = [data.address, data.district].filter(Boolean).join(", ");
      if (location) fields.push([dlT("pdf.location"), location]);
      ctx().font = `400 30px ${FONT}`;
      for (const [labelText, value] of fields) {
        const lines = wrapLines(ctx(), value, fieldWidth);
        fit(Math.max(60, lines.length * 46));
        y = drawField(ctx(), y, labelText, value, fieldWidth);
        y += 20;
      }

      // Description (boxed — plain light panel, single heading above)
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.description")) - 16;
      ctx().font = `400 30px ${FONT}`;
      const descLines = wrapLines(ctx(), data.description, fieldWidth - 100);
      const boxH = descLines.length * 52 + 80;
      fit(boxH);
      roundRect(ctx(), PAD, y, fieldWidth, boxH, 16);
      ctx().fillStyle = "#fafafa";
      ctx().fill();
      ctx().strokeStyle = "#f0f0f0";
      ctx().lineWidth = 2;
      ctx().stroke();
      ctx().font = `400 30px ${FONT}`;
      ctx().fillStyle = "#374151";
      descLines.forEach((ln, i) => ctx().fillText(ln, PAD + 50, y + 40 + i * 52));
      y += boxH + 36;

      // Photos (rounded, aspect-preserving, captioned)
      if (photos.length) {
        fit(80);
        y = drawSection(ctx(), y, dlT("pdf.evidence", { n: String(photos.length) })) - 16;
        const pw = 680;
        const ph = 495;
        const gap = 40;
        const perRow = 2;
        for (let i = 0; i < photos.length; i++) {
          const col = i % perRow;
          if (col === 0) fit(ph + 70);
          const x = PAD + col * (pw + gap);
          const iw = photos[i].naturalWidth || 1;
          const ih = photos[i].naturalHeight || 1;
          const scale = Math.min(pw / iw, ph / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = x + (pw - dw) / 2;
          const dy = y + (ph - dh) / 2;
          ctx().save();
          roundRect(ctx(), x, y, pw, ph, 12);
          ctx().clip();
          ctx().fillStyle = "#f3f4f6";
          ctx().fillRect(x, y, pw, ph);
          ctx().drawImage(photos[i], dx, dy, dw, dh);
          ctx().restore();
          ctx().strokeStyle = "#e5e5e5";
          ctx().lineWidth = 2;
          roundRect(ctx(), x, y, pw, ph, 12);
          ctx().stroke();
          ctx().font = `400 22px ${FONT}`;
          ctx().fillStyle = "#9ca3af";
          ctx().textAlign = "center";
          ctx().fillText(dlT("pdf.photo", { n: String(i + 1) }), x + pw / 2, y + ph + 26);
          ctx().textAlign = "left";
          if (col === perRow - 1 || i === photos.length - 1) y += ph + 70;
        }
        y += 16;
      }

      // AI evidence analysis
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.aiTitle")) - 16;
      const ai = (() => {
        if (!data.aiAnalysis) return null;
        try {
          const a = JSON.parse(data.aiAnalysis);
          if (typeof a !== "object" || a === null || !("evidenceQuality" in a)) return null;
          return a as EvidenceAnalysis;
        } catch {
          return null;
        }
      })();
      const LEVEL_COLOR: Record<string, string> = { HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#059669" };
      if (!ai) {
        const boxH = 110;
        fit(boxH);
        roundRect(ctx(), PAD, y, fieldWidth, boxH, 16);
        ctx().fillStyle = "#fafafa";
        ctx().fill();
        ctx().strokeStyle = "#f0f0f0";
        ctx().lineWidth = 2;
        ctx().stroke();
        ctx().font = `400 28px ${FONT}`;
        ctx().fillStyle = "#6b7280";
        ctx().fillText(dlT("pdf.aiNone"), PAD + 50, y + 62);
        y += boxH + 36;
      } else {
        const innerW = fieldWidth - 100;
        const rationaleLines = ai.rationale ? wrapLines(ctx(), `"${ai.rationale}"`, innerW) : [];
        const findingLines = (ai.findings ?? []).length
          ? (ai.findings ?? []).flatMap((f) => wrapLines(ctx(), `• ${f}`, innerW))
          : [];
        const indicatorLines = ai.indicators.length
          ? ai.indicators.flatMap((ind) => wrapLines(ctx(), `• ${ind}`, innerW))
          : [];
        const engineText =
          (ai.engine === "vision" ? dlT("pdf.aiEngine") : dlT("pdf.aiOnDevice")) +
          (ai.model ? ` · ${ai.model}` : "");
        const engineLines = wrapLines(ctx(), engineText, innerW);
        const advisoryLines = wrapLines(ctx(), dlT("pdf.aiAdvisory"), innerW);
        const boxH =
          46 + 46 + 64 +
          rationaleLines.length * 42 +
          ((ai.findings ?? []).length ? 30 + findingLines.length * 42 : 0) +
          (ai.indicators.length ? 30 + indicatorLines.length * 42 : 0) +
          engineLines.length * 36 +
          advisoryLines.length * 36 + 70;
        fit(boxH);
        roundRect(ctx(), PAD, y, fieldWidth, boxH, 16);
        ctx().fillStyle = "#fafafa";
        ctx().fill();
        ctx().strokeStyle = "#f0f0f0";
        ctx().lineWidth = 2;
        ctx().stroke();
        let ty = y + 46;
        const row = (label: string, level: string) => {
          ctx().font = `400 28px ${FONT}`;
          ctx().fillStyle = "#6b7280";
          ctx().fillText(label, PAD + 50, ty);
          ctx().textAlign = "right";
          ctx().font = `700 28px ${FONT}`;
          ctx().fillStyle = LEVEL_COLOR[level] ?? "#059669";
          ctx().fillText(dlT("sev." + level.toLowerCase()), PAD + fieldWidth - 50, ty);
          ctx().textAlign = "left";
          ty += 46;
        };
        row(dlT("pdf.aiContamination"), ai.contamination);
        row(dlT("pdf.aiHygiene"), ai.hygiene);
        ctx().font = `400 28px ${FONT}`;
        ctx().fillStyle = "#6b7280";
        ctx().fillText(dlT("pdf.aiQuality"), PAD + 50, ty);
        ctx().textAlign = "right";
        ctx().font = `700 28px ${FONT}`;
        ctx().fillStyle = "#111827";
        ctx().fillText(`${ai.evidenceQuality}%`, PAD + fieldWidth - 50, ty);
        ctx().textAlign = "left";
        ty += 14;
        roundRect(ctx(), PAD + 50, ty, innerW, 12, 6);
        ctx().fillStyle = "#e5e7eb";
        ctx().fill();
        roundRect(ctx(), PAD + 50, ty, Math.max(8, (innerW * ai.evidenceQuality) / 100), 12, 6);
        ctx().fillStyle = "#10b981";
        ctx().fill();
        ty += 50;
        if (rationaleLines.length) {
          ctx().font = `400 26px ${FONT}`;
          ctx().fillStyle = "#4b5563";
          rationaleLines.forEach((ln) => {
            ctx().fillText(ln, PAD + 50, ty);
            ty += 42;
          });
        }
        if ((ai.findings ?? []).length) {
          ctx().font = `600 24px ${FONT}`;
          ctx().fillStyle = "#111827";
          ctx().fillText(dlT("pdf.aiFindings").toUpperCase(), PAD + 50, ty);
          ty += 30;
          ctx().font = `400 26px ${FONT}`;
          ctx().fillStyle = "#b45309";
          findingLines.forEach((ln) => {
            ctx().fillText(ln, PAD + 50, ty);
            ty += 42;
          });
        }
        if (ai.indicators.length) {
          ctx().font = `600 24px ${FONT}`;
          ctx().fillStyle = "#111827";
          ctx().fillText(dlT("pdf.aiIndicators").toUpperCase(), PAD + 50, ty);
          ty += 30;
          ctx().font = `400 26px ${FONT}`;
          ctx().fillStyle = "#374151";
          indicatorLines.forEach((ln) => {
            ctx().fillText(ln, PAD + 50, ty);
            ty += 42;
          });
        }
        ctx().font = `400 22px ${FONT}`;
        ctx().fillStyle = "#9ca3af";
        engineLines.forEach((ln) => {
          ctx().fillText(ln, PAD + 50, ty);
          ty += 36;
        });
        advisoryLines.forEach((ln) => {
          ctx().fillText(ln, PAD + 50, ty);
          ty += 36;
        });
        y += boxH + 36;
      }

      // Accountability (side-by-side boxes)
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.accountability")) - 16;
      const slaNote = dlT(
        data.slaStatus === "resolved"
          ? "my.slaResolved"
          : data.slaStatus === "overdue"
            ? "my.slaOverdue"
            : "my.daysLeft",
        data.slaStatus === "pending" ? { n: String(data.slaDaysLeft) } : undefined
      ).replace(/^ · /, "");
      const officerVal = data.officerName + (data.officerDistrict ? ` (${data.officerDistrict})` : "");
      const slaVal = `${data.slaDeadline}  ·  ${slaNote}`;
      const boxW = (fieldWidth - 40) / 2;
      ctx().font = `400 28px ${FONT}`;
      const officerH = Math.max(190, wrapLines(ctx(), officerVal, boxW - 72).length * 46 + 120);
      const slaH = Math.max(190, wrapLines(ctx(), slaVal, boxW - 72).length * 46 + 120);
      const hh = Math.max(officerH, slaH);
      fit(hh);
      drawBox(ctx(), PAD, y, boxW, hh, dlT("pdf.officer"), officerVal);
      drawBox(ctx(), PAD + boxW + 40, y, boxW, hh, dlT("pdf.sla"), slaVal);
      y += hh + 36;

      if (data.overdue) {
        fit(160);
        roundRect(ctx(), PAD, y, fieldWidth, 140, 16);
        ctx().fillStyle = "#fef2f2";
        ctx().fill();
        ctx().strokeStyle = "#fecaca";
        ctx().lineWidth = 2;
        ctx().stroke();
        ctx().font = `700 26px ${FONT}`;
        ctx().fillStyle = "#be123c";
        ctx().fillText(dlT("pdf.overdueMsg"), PAD + 40, y + 46);
        y += 176;
      }

      // How to track (checklist)
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.howToTrack")) - 16;
      ctx().font = `400 28px ${FONT}`;
      ctx().fillStyle = "#059669";
      ctx().fillText("✓", PAD, y);
      ctx().fillStyle = "#404040";
      const trackLines = wrapLines(ctx(), dlT("pdf.trackBody", { email: data.citizenEmail }), fieldWidth - 100);
      trackLines.forEach((ln, i) => {
        fit(46);
        ctx().fillText(ln, PAD + 100, y + i * 46);
      });
      y += trackLines.length * 46 + 10;

      // Footer on the last page
      if (y > H - FOOTER_H - 40) newPage(false);
      const f = contexts[pages.length - 1];
      f.fillStyle = "#fafafa";
      f.fillRect(0, H - FOOTER_H, W, FOOTER_H);
      f.fillStyle = "#a7f3d0";
      f.fillRect(0, H - FOOTER_H, W, 6);
      f.font = `400 26px ${FONT}`;
      f.fillStyle = "#737373";
      f.textAlign = "left";
      f.fillText(dlT("pdf.helpline"), PAD, H - FOOTER_H + 52);
      f.textAlign = "right";
      f.fillText(dlT("pdf.generated"), W - PAD, H - FOOTER_H + 52);
      f.textAlign = "left";
      f.font = `400 24px ${FONT}`;
      f.fillText(dlT("pdf.disclaimer"), PAD, H - FOOTER_H + 104);
      f.textAlign = "right";
      f.fillText(
        `${dlT("pdf.refLabel")} ${data.reference} · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
        W - PAD,
        H - FOOTER_H + 104
      );
      f.textAlign = "left";
      // bottom accent bar
      const bar = f.createLinearGradient(0, H - 14, W, H);
      bar.addColorStop(0, "#059669");
      bar.addColorStop(1, "#047857");
      f.fillStyle = bar;
      f.fillRect(0, H - 14, W, 14);

      // Assemble PDF — scale the 2480x3508 canvas down to the A4 page
      // (2480/3508 matches 595/842 exactly, so nothing is cropped or stretched).
      const doc = new jsPDF({ orientation: "portrait", unit: "px", format: "a4", hotfixes: ["px_scaling"] });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      pages.forEach((c, i) => {
        if (i > 0) doc.addPage("a4", "portrait");
        doc.addImage(c.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH, undefined, "SLOW");
      });
      doc.save(`${data.reference}-complaint-${dl}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {busy ? t("pdf.downloading") : label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {menuOpen && !busy && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border bg-background shadow-md">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setPdfLang(l);
                void download(l);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition hover:bg-accent",
                l === pdfLang && "font-medium text-primary"
              )}
            >
              {LANG_NAMES[l]} <span className="font-mono text-[10px] text-muted-foreground">{l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
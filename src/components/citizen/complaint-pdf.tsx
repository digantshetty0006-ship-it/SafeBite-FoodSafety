"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { FileDown, Loader2 } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

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
  slaNote: string;
  overdue: boolean;
  photos: string[];
  citizenName: string;
  citizenEmail: string;
}

// A4 @ 150 dpi. Drawing directly on canvas means the browser text engine
// shapes Devanagari (conjuncts, matras) accurately — jsPDF's built-in fonts
// cannot render it at all.
const W = 1240;
const H = 1754;
const PAD = 60;
const CONTENT_TOP = 200;
const FOOTER_H = 120;
const EMERALD = "#047857";
const FONT = "'Noto Sans Devanagari', 'Nirmala UI', 'Segoe UI', system-ui, sans-serif";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const raw of text.split("\n")) {
    const words = raw.split(" ");
    let cur = "";
    for (const w of words) {
      const candidate = cur ? cur + " " + w : w;
      if (ctx.measureText(candidate).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    lines.push(cur);
  }
  return lines;
}

function drawField(
  ctx: CanvasRenderingContext2D,
  y: number,
  label: string,
  value: string,
  maxWidth: number
): number {
  ctx.font = `700 13px ${FONT}`;
  ctx.fillStyle = "#a3a3a3";
  const lw = Math.min(ctx.measureText(label).width, 300);
  ctx.fillText(label, PAD, y);
  ctx.font = `400 16px ${FONT}`;
  ctx.fillStyle = "#262626";
  const lines = wrapLines(ctx, value, maxWidth - lw - 16);
  lines.forEach((ln, i) => ctx.fillText(ln, PAD + lw + 16, y + i * 24));
  return y + lines.length * 24;
}

function drawSection(ctx: CanvasRenderingContext2D, y: number, text: string): number {
  ctx.font = `700 12px ${FONT}`;
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(text.toUpperCase(), PAD, y);
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y + 22);
  ctx.lineTo(W - PAD, y + 22);
  ctx.stroke();
  return y + 36;
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
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const download = async () => {
    setBusy(true);
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
        y = withHeader ? CONTENT_TOP : 80;
        if (!withHeader) return;
        // Header band
        x.fillStyle = EMERALD;
        x.fillRect(0, 0, W, 150);
        x.fillStyle = "#ffffff";
        x.font = `800 34px ${FONT}`;
        x.fillText("SafeBite", PAD, 28);
        x.font = `400 17px ${FONT}`;
        x.fillText(t("pdf.title"), PAD, 72);
        x.font = `400 14px ${FONT}`;
        x.globalAlpha = 0.85;
        x.fillText(t("pdf.subtitle"), PAD, 96);
        x.globalAlpha = 1;
        x.textAlign = "right";
        x.font = `400 14px ${FONT}`;
        x.fillText(data.filedAt, W - PAD, 40);
        x.font = `700 18px ${FONT}`;
        x.fillText(t("pdf.receipt"), W - PAD, 64);
        x.textAlign = "left";
      };

      const fit = (h: number) => {
        if (y + h > H - FOOTER_H - 20) newPage(false);
      };

      newPage(true);
      const ctx = () => contexts[pages.length - 1];
      const fieldWidth = W - 2 * PAD;

      // Ref + status
      fit(50);
      ctx().font = `800 26px 'Consolas', 'Courier New', monospace`;
      ctx().fillStyle = "#171717";
      ctx().fillText(`${t("pdf.refLabel")}: ${data.reference}`, PAD, y);
      ctx().font = `700 16px ${FONT}`;
      const statusText = data.statusLabel;
      const sw = ctx().measureText(statusText).width + 40;
      ctx().fillStyle = data.overdue ? "#dc2626" : EMERALD;
      roundRect(ctx(), W - PAD - sw, y, sw, 38, 19);
      ctx().fill();
      ctx().fillStyle = "#ffffff";
      ctx().textBaseline = "middle";
      ctx().fillText(statusText, W - PAD - sw + 20, y + 19);
      ctx().textBaseline = "top";
      y += 58;

      ctx().strokeStyle = "#e5e5e5";
      ctx().beginPath();
      ctx().moveTo(PAD, y);
      ctx().lineTo(W - PAD, y);
      ctx().stroke();
      y += 26;

      // Details
      fit(40);
      y = drawSection(ctx(), y, t("pdf.details")) - 8;
      const fields: Array<[string, string]> = [
        [t("pdf.filedOn"), data.filedAt],
        [t("pdf.filedBy"), `${data.citizenName} <${data.citizenEmail}>`],
      ];
      if (data.businessName)
        fields.push([t("pdf.business"), data.businessName + (data.businessDistrict ? ` (${data.businessDistrict})` : "")]);
      const location = [data.address, data.district].filter(Boolean).join(", ");
      if (location) fields.push([t("pdf.location"), location]);
      for (const [labelText, value] of fields) {
        const lines = wrapLines(ctx(), value, fieldWidth);
        fit(Math.max(30, lines.length * 24));
        y = drawField(ctx(), y, labelText, value, fieldWidth);
        y += 10;
      }

      // Description
      fit(40);
      y = drawSection(ctx(), y, t("pdf.description")) - 8;
      ctx().font = `400 16px ${FONT}`;
      ctx().fillStyle = "#262626";
      for (const ln of wrapLines(ctx(), data.description, fieldWidth)) {
        fit(26);
        ctx().fillText(ln, PAD, y);
        y += 26;
      }
      y += 6;

      // Photos
      if (photos.length) {
        fit(40);
        y = drawSection(ctx(), y, t("pdf.evidence", { n: String(photos.length) })) - 8;
        const pw = 340;
        const ph = 255;
        const gap = 20;
        const perRow = 2;
        for (let i = 0; i < photos.length; i++) {
          const col = i % perRow;
          if (col === 0) fit(ph);
          const x = PAD + col * (pw + gap);
          ctx().strokeStyle = "#e5e5e5";
          ctx().strokeRect(x, y, pw, ph);
          ctx().drawImage(photos[i], x, y, pw, ph);
          if (col === perRow - 1 || i === photos.length - 1) y += ph + 14;
        }
        y += 10;
      }

      // Accountability
      fit(40);
      y = drawSection(ctx(), y, t("pdf.accountability")) - 8;
      const acc: Array<[string, string]> = [
        [t("pdf.officer"), data.officerName + (data.officerDistrict ? ` (${data.officerDistrict})` : "")],
        [t("pdf.sla"), `${data.slaDeadline}${data.slaNote ? `  ·  ${data.slaNote}` : ""}`],
      ];
      for (const [labelText, value] of acc) {
        const lines = wrapLines(ctx(), value, fieldWidth);
        fit(Math.max(30, lines.length * 24));
        y = drawField(ctx(), y, labelText, value, fieldWidth);
        y += 10;
      }
      if (data.overdue) {
        fit(30);
        ctx().font = `700 15px ${FONT}`;
        ctx().fillStyle = "#be123c";
        ctx().fillText(t("pdf.overdueMsg"), PAD, y);
        y += 34;
      }

      // How to track
      fit(40);
      y = drawSection(ctx(), y, t("pdf.howToTrack")) - 8;
      ctx().font = `400 15px ${FONT}`;
      ctx().fillStyle = "#404040";
      for (const ln of wrapLines(ctx(), t("pdf.trackBody", { email: data.citizenEmail }), fieldWidth)) {
        fit(24);
        ctx().fillText(ln, PAD, y);
        y += 24;
      }

      // Footer on the last page
      if (y > H - FOOTER_H - 20) newPage(false);
      const f = contexts[pages.length - 1];
      f.fillStyle = "#f5f5f5";
      f.fillRect(0, H - FOOTER_H, W, FOOTER_H);
      f.strokeStyle = "#e5e5e5";
      f.beginPath();
      f.moveTo(0, H - FOOTER_H);
      f.lineTo(W, H - FOOTER_H);
      f.stroke();
      f.font = `400 13px ${FONT}`;
      f.fillStyle = "#737373";
      f.textAlign = "left";
      f.fillText(t("pdf.helpline"), PAD, H - FOOTER_H + 24);
      f.textAlign = "right";
      f.fillText(t("pdf.generated"), W - PAD, H - FOOTER_H + 24);
      f.textAlign = "left";
      f.font = `400 12px ${FONT}`;
      f.fillText(t("pdf.disclaimer"), PAD, H - FOOTER_H + 52);
      f.textAlign = "right";
      f.fillText(
        `${t("pdf.refLabel")} ${data.reference} · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
        W - PAD,
        H - FOOTER_H + 52
      );
      f.textAlign = "left";

      // Assemble PDF
      const doc = new jsPDF({ orientation: "portrait", unit: "px", format: "a4", hotfixes: ["px_scaling"] });
      pages.forEach((c, i) => {
        if (i > 0) doc.addPage("a4", "portrait");
        doc.addImage(c.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, W, H, undefined, "FAST");
      });
      doc.save(`${data.reference}-complaint-${lang}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      {busy ? t("pdf.downloading") : label}
    </button>
  );
}
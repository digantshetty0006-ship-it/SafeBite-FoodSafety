"use client";

import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { FileDown, Loader2, ChevronDown } from "lucide-react";
import { tr, LANGS, LANG_NAMES, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  citizenName: string;
  citizenEmail: string;
}

// A4 @ 300 dpi. Drawing directly on canvas means the browser text engine
// shapes Devanagari (conjuncts, matras) accurately — jsPDF's built-in fonts
// cannot render it at all. Supersampled for crisp output.
const W = 2480;
const H = 3508;
const PAD = 120;
const CONTENT_TOP = 380;
const FOOTER_H = 240;
const EMERALD = "#047857";
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
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = "#a3a3a3";
  const lw = Math.min(ctx.measureText(label).width, 600);
  ctx.fillText(label, PAD, y);
  ctx.font = `400 32px ${FONT}`;
  ctx.fillStyle = "#262626";
  const lines = wrapLines(ctx, value, maxWidth - lw - 32);
  lines.forEach((ln, i) => ctx.fillText(ln, PAD + lw + 32, y + i * 48));
  return y + lines.length * 48;
}

function drawSection(ctx: CanvasRenderingContext2D, y: number, text: string): number {
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = "#a3a3a3";
  ctx.fillText(text.toUpperCase(), PAD, y);
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y + 44);
  ctx.lineTo(W - PAD, y + 44);
  ctx.stroke();
  return y + 72;
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
        if (!withHeader) return;
        // Header band
        x.fillStyle = EMERALD;
        x.fillRect(0, 0, W, 300);
        // Logo + brand
        if (logo) {
          const lh = 104;
          const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
          x.drawImage(logo, PAD, 52, lw, lh);
          x.fillStyle = "#ffffff";
          x.font = `800 64px ${FONT}`;
          x.fillText("SafeBite", PAD + lw + 44, 62);
        } else {
          x.fillStyle = "#ffffff";
          x.font = `800 64px ${FONT}`;
          x.fillText("SafeBite", PAD, 62);
        }
        x.font = `400 30px ${FONT}`;
        x.fillText(dlT("pdf.title"), PAD, 150);
        x.font = `400 26px ${FONT}`;
        x.globalAlpha = 0.85;
        x.fillText(dlT("pdf.subtitle"), PAD, 196);
        x.globalAlpha = 1;
        x.textAlign = "right";
        x.font = `400 26px ${FONT}`;
        x.fillText(data.filedAt, W - PAD, 60);
        x.font = `700 34px ${FONT}`;
        x.fillText(dlT("pdf.receipt"), W - PAD, 104);
        x.textAlign = "left";
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
      ctx().font = `700 32px ${FONT}`;
      const statusText = data.statusLabel;
      const sw = ctx().measureText(statusText).width + 80;
      const pillX = W - PAD - sw;
      const refW = ctx().measureText(refText).width;
      ctx().font = `800 50px 'Consolas', 'Courier New', monospace`;
      if (refW > pillX - PAD - 60) {
        // status pill would collide with the ref — move it to its own line
        ctx().fillText(refText, PAD, y);
        ctx().font = `700 32px ${FONT}`;
        ctx().fillStyle = data.overdue ? "#dc2626" : EMERALD;
        roundRect(ctx(), W - PAD - sw, y + 100, sw, 72, 36);
        ctx().fill();
        ctx().fillStyle = "#ffffff";
        ctx().textBaseline = "middle";
        ctx().fillText(statusText, W - PAD - sw + 40, y + 100 + 36);
        ctx().textBaseline = "top";
        y += 190;
      } else {
        ctx().fillText(refText, PAD, y);
        ctx().fillStyle = data.overdue ? "#dc2626" : EMERALD;
        roundRect(ctx(), pillX, y, sw, 72, 36);
        ctx().fill();
        ctx().fillStyle = "#ffffff";
        ctx().textBaseline = "middle";
        ctx().fillText(statusText, pillX + 40, y + 36);
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
      for (const [labelText, value] of fields) {
        const lines = wrapLines(ctx(), value, fieldWidth);
        fit(Math.max(60, lines.length * 48));
        y = drawField(ctx(), y, labelText, value, fieldWidth);
        y += 20;
      }

      // Description
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.description")) - 16;
      ctx().font = `400 32px ${FONT}`;
      ctx().fillStyle = "#262626";
      for (const ln of wrapLines(ctx(), data.description, fieldWidth)) {
        fit(52);
        ctx().fillText(ln, PAD, y);
        y += 52;
      }
      y += 12;

      // Photos (aspect-preserving)
      if (photos.length) {
        fit(80);
        y = drawSection(ctx(), y, dlT("pdf.evidence", { n: String(photos.length) })) - 16;
        const pw = 680;
        const ph = 510;
        const gap = 40;
        const perRow = 2;
        for (let i = 0; i < photos.length; i++) {
          const col = i % perRow;
          if (col === 0) fit(ph);
          const x = PAD + col * (pw + gap);
          const iw = photos[i].naturalWidth || 1;
          const ih = photos[i].naturalHeight || 1;
          const scale = Math.min(pw / iw, ph / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = x + (pw - dw) / 2;
          const dy = y + (ph - dh) / 2;
          ctx().strokeStyle = "#e5e5e5";
          ctx().lineWidth = 2;
          ctx().strokeRect(x, y, pw, ph);
          ctx().drawImage(photos[i], dx, dy, dw, dh);
          if (col === perRow - 1 || i === photos.length - 1) y += ph + 28;
        }
        y += 20;
      }

      // Accountability
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
      const acc: Array<[string, string]> = [
        [dlT("pdf.officer"), data.officerName + (data.officerDistrict ? ` (${data.officerDistrict})` : "")],
        [dlT("pdf.sla"), `${data.slaDeadline}  ·  ${slaNote}`],
      ];
      for (const [labelText, value] of acc) {
        const lines = wrapLines(ctx(), value, fieldWidth);
        fit(Math.max(60, lines.length * 48));
        y = drawField(ctx(), y, labelText, value, fieldWidth);
        y += 20;
      }
      if (data.overdue) {
        fit(60);
        ctx().font = `700 30px ${FONT}`;
        ctx().fillStyle = "#be123c";
        ctx().fillText(dlT("pdf.overdueMsg"), PAD, y);
        y += 68;
      }

      // How to track
      fit(80);
      y = drawSection(ctx(), y, dlT("pdf.howToTrack")) - 16;
      ctx().font = `400 30px ${FONT}`;
      ctx().fillStyle = "#404040";
      for (const ln of wrapLines(ctx(), dlT("pdf.trackBody", { email: data.citizenEmail }), fieldWidth)) {
        fit(48);
        ctx().fillText(ln, PAD, y);
        y += 48;
      }

      // Footer on the last page
      if (y > H - FOOTER_H - 40) newPage(false);
      const f = contexts[pages.length - 1];
      f.fillStyle = "#f5f5f5";
      f.fillRect(0, H - FOOTER_H, W, FOOTER_H);
      f.strokeStyle = "#e5e5e5";
      f.lineWidth = 2;
      f.beginPath();
      f.moveTo(0, H - FOOTER_H);
      f.lineTo(W, H - FOOTER_H);
      f.stroke();
      f.font = `400 26px ${FONT}`;
      f.fillStyle = "#737373";
      f.textAlign = "left";
      f.fillText(dlT("pdf.helpline"), PAD, H - FOOTER_H + 44);
      f.textAlign = "right";
      f.fillText(dlT("pdf.generated"), W - PAD, H - FOOTER_H + 44);
      f.textAlign = "left";
      f.font = `400 24px ${FONT}`;
      f.fillText(dlT("pdf.disclaimer"), PAD, H - FOOTER_H + 92);
      f.textAlign = "right";
      f.fillText(
        `${dlT("pdf.refLabel")} ${data.reference} · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
        W - PAD,
        H - FOOTER_H + 92
      );
      f.textAlign = "left";

      // Assemble PDF
      const doc = new jsPDF({ orientation: "portrait", unit: "px", format: "a4", hotfixes: ["px_scaling"] });
      pages.forEach((c, i) => {
        if (i > 0) doc.addPage("a4", "portrait");
        doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W, H, undefined, "FAST");
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
"use client";

import { jsPDF } from "jspdf";
import { FileDown } from "lucide-react";

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

const EMERALD: [number, number, number] = [4, 120, 87];
const CONTENT_BOTTOM = 262;

function wrap(doc: jsPDF, text: string, x: number, y: number, w: number, size: number, lineH = 4.6): number {
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, w);
  let yy = y;
  for (const line of lines) {
    if (yy > CONTENT_BOTTOM) {
      doc.addPage();
      yy = 22;
    }
    doc.text(line, x, yy);
    yy += lineH;
  }
  return yy;
}

function loadPhoto(src: string): Promise<{ src: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ src, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ src, w: 0, h: 0 });
    img.src = src;
  });
}

export function ComplaintPdf({ data, label }: { data: ComplaintPdfData; label: string }) {
  const download = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;

    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, W, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("SafeBite", 14, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Food Safety Citizen Complaint", 14, 17);
    doc.text("FSSAI  ·  Maharashtra Food & Drug Administration", 14, 22);
    doc.setFontSize(8);
    doc.text(data.filedAt, W - 14, 11, { align: "right" });
    doc.text("Complaint Receipt", W - 14, 17, { align: "right" });

    let y = 40;
    doc.setTextColor(20, 20, 20);
    doc.setFont("courier", "bold");
    doc.setFontSize(17);
    doc.text(`Ref: ${data.reference}`, 14, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(data.overdue ? 220 : 4, data.overdue ? 38 : 120, data.overdue ? 38 : 87);
    const statusW = doc.getTextWidth(data.statusLabel) + 12;
    doc.roundedRect(14, y - 4, statusW, 8, 2, 2, "F");
    doc.text(data.statusLabel, 20, y + 1);
    y += 12;

    doc.setDrawColor(210, 210, 210);
    doc.line(14, y, W - 14, y);
    y += 8;

    const page = () => {
      if (y > CONTENT_BOTTOM) {
        doc.addPage();
        y = 22;
      }
    };

    const field = (labelText: string, value: string) => {
      page();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(labelText.toUpperCase(), 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(value, W - 14 - 62);
      let yy = y;
      for (const line of lines) {
        if (yy > CONTENT_BOTTOM) {
          doc.addPage();
          yy = 22;
        }
        doc.text(line, 62, yy);
        yy += 5.6;
      }
      y = yy + 0.8;
    };

    page();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Complaint Details", 14, y);
    y += 6;

    field("Filed on", data.filedAt);
    field("Filed by", `${data.citizenName} <${data.citizenEmail}>`);
    if (data.businessName) field("Business", `${data.businessName}${data.businessDistrict ? ` (${data.businessDistrict})` : ""}`);
    const location = [data.address, data.district].filter(Boolean).join(", ");
    if (location) field("Location", location);

    page();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text("DESCRIPTION", 14, y);
    y += 5;
    y = wrap(doc, data.description, 14, y, W - 28, 10) + 4;

    if (data.photos.length > 0) {
      const photos = await Promise.all(data.photos.map(loadPhoto));
      page();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`EVIDENCE PHOTOS (${photos.length})`, 14, y);
      y += 5;
      for (const p of photos) {
        if (p.w <= 0 || p.h <= 0) continue;
        const boxW = 86;
        const boxH = 64;
        const scale = Math.min(boxW / p.w, boxH / p.h);
        const w = p.w * scale;
        const h = p.h * scale;
        if (y + h + 6 > 262) {
          doc.addPage();
          y = 22;
        }
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(14, y - 4, w + 4, h + 4, 1, 1, "S");
        doc.addImage(p.src, "JPEG", 16, y - 2, w, h);
        y += h + 8;
      }
      y += 2;
    }

    doc.setDrawColor(210, 210, 210);
    doc.line(14, y, W - 14, y);
    y += 8;

    page();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Accountability", 14, y);
    y += 6;
    field("Assigned officer", `${data.officerName}${data.officerDistrict ? ` (${data.officerDistrict})` : ""}`);
    field("SLA deadline", `${data.slaDeadline}${data.slaNote ? `  ·  ${data.slaNote}` : ""}`);
    if (data.overdue) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(190, 30, 30);
      y += 2;
      doc.text(
        "Auto-escalated to the Deputy Commissioner — this complaint exceeded its SLA window.",
        14,
        y
      );
      y += 8;
    }

    doc.setDrawColor(210, 210, 210);
    doc.line(14, y, W - 14, y);
    y += 8;

    page();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text("HOW TO TRACK", 14, y);
    y += 5;
    y = wrap(
      doc,
      `Sign in to SafeBite as ${data.citizenEmail} and open "Track Complaints". Your complaint moves through Submitted → Under Review → Inspection Scheduled → Resolved, and escalates automatically if the SLA is missed.`,
      14,
      y,
      W - 28,
      9
    ) + 4;

    if (y > 262) {
      doc.addPage();
    }

    doc.setFillColor(244, 244, 244);
    doc.rect(0, 272, W, 25, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Helpline: 1800-222-365", 14, 280);
    doc.text("Generated by SafeBite", W - 14, 280, { align: "right" });
    doc.text("This is a system-generated receipt for citizen reference and is not a legal document.", 14, 285);
    doc.text(`Ref ${data.reference} · ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`, W - 14, 285, { align: "right" });

    doc.save(`${data.reference}-complaint.pdf`);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
    >
      <FileDown className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
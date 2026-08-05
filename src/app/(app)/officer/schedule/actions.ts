"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function scheduleInspectionAction(formData: FormData) {
  await requireRole("fda_officer");
  const businessId = String(formData.get("businessId") ?? "");
  const inspectorId = String(formData.get("inspectorId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  if (!businessId || !inspectorId || !scheduledAt) return;

  await db.inspection.create({
    data: {
      businessId,
      inspectorId,
      scheduledAt: new Date(scheduledAt),
      checklist: [],
      status: "scheduled",
    },
  });
  redirect("/officer/schedule");
}

export async function rescheduleInspectionAction(formData: FormData) {
  await requireRole("fda_officer");
  const id = String(formData.get("id") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  if (!id || !scheduledAt) return;
  await db.inspection.update({ where: { id }, data: { scheduledAt: new Date(scheduledAt), status: "scheduled" } });
  redirect("/officer/schedule");
}

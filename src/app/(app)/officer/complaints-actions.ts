"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const ALLOWED = new Set(["under_review", "resolved"]);

export async function updateComplaintStatusAction(formData: FormData) {
  const officer = await requireRole("food_officer");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !ALLOWED.has(status)) return;

  const complaint = await db.complaint.findUnique({ where: { id }, select: { id: true } });
  if (!complaint) return;

  await db.complaint.update({
    where: { id },
    data: { status, assignedOfficerId: officer.id },
  });

  revalidatePath("/officer/queue");
  revalidatePath("/officer/dashboard");
  revalidatePath("/citizen/my-complaints");
}

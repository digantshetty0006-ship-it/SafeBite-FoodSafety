"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function deleteComplaintAction(formData: FormData) {
  const citizen = await requireRole("citizen");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const complaint = await db.complaint.findFirst({
    where: { id, citizenId: citizen.id },
    select: { id: true },
  });
  if (!complaint) return;

  await db.complaint.delete({ where: { id } });

  revalidatePath("/citizen/my-complaints");
  revalidatePath("/officer/queue");
  revalidatePath("/officer/dashboard");
  revalidatePath("/officer/map");
  redirect("/citizen/my-complaints?deleted=1");
}
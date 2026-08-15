"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assignOfficer } from "@/lib/complaints";

export async function uploadComplaintPhotoAction(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireRole("citizen");
  const dataUrl = String(formData.get("dataUrl") ?? "");
  if (!dataUrl.startsWith("data:image/")) return { ok: false, error: "Invalid image." };
  if (dataUrl.length > 1_500_000) return { ok: false, error: "Image too large. Try a smaller photo." };
  return { ok: true, url: dataUrl };
}

export async function submitComplaintAction(formData: FormData) {
  const citizen = await requireRole("citizen");
  const description = String(formData.get("description") ?? "").trim();
  const businessId = String(formData.get("businessId") ?? "") || null;
  const anonymous = formData.get("anonymous") === "on";
  const photos = JSON.stringify(JSON.parse(String(formData.get("photos") ?? "[]")));
  const lat = String(formData.get("lat") ?? "");
  const lng = String(formData.get("lng") ?? "");
  const address = String(formData.get("address") ?? "").slice(0, 500) || null;
  const district = String(formData.get("district") ?? "").slice(0, 100) || null;

  if (!description) return;

  const complaint = await db.complaint.create({
    data: {
      description,
      businessId,
      citizenId: anonymous ? null : citizen.id,
      anonymous,
      photos,
      status: "submitted",
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      address,
      district,
    },
  });

  await assignOfficer(complaint.id);

  revalidatePath("/citizen/my-complaints");
  redirect("/citizen/my-complaints?submitted=1");
}

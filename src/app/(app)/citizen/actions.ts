"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { assignOfficer } from "@/lib/complaints";

export async function uploadComplaintPhotoAction(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireRole("citizen");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Only image files are allowed." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Image must be under 8 MB." };
  if (process.env.VERCEL) return { ok: false, error: "Photo upload is unavailable on the hosted demo." };
  try {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const name = `cmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, name), Buffer.from(await file.arrayBuffer()));
    return { ok: true, url: `/uploads/${name}` };
  } catch {
    return { ok: false, error: "Photo upload is unavailable on the hosted demo." };
  }
}

export async function submitComplaintAction(formData: FormData) {
  const citizen = await requireRole("citizen");
  const description = String(formData.get("description") ?? "").trim();
  const businessId = String(formData.get("businessId") ?? "") || null;
  const anonymous = formData.get("anonymous") === "on";
  const photos = JSON.stringify(JSON.parse(String(formData.get("photos") ?? "[]")));
  const lat = String(formData.get("lat") ?? "");
  const lng = String(formData.get("lng") ?? "");

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
    },
  });

  await assignOfficer(complaint.id);

  revalidatePath("/citizen/my-complaints");
  redirect("/citizen/my-complaints?submitted=1");
}

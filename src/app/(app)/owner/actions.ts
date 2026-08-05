"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function uploadDocumentAction(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  await requireRole("business_owner");
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (file.size > 15 * 1024 * 1024) return { ok: false, error: "File must be under 15 MB." };
  const ext = file.name.split(".").pop() ?? "pdf";
  const name = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true, url: `/uploads/${name}` };
}

export async function addDocumentAction(formData: FormData) {
  const owner = await requireRole("business_owner");
  const businessId = String(formData.get("businessId") ?? "");
  const type = String(formData.get("type") ?? "");
  const fileUrl = String(formData.get("fileUrl") ?? "");
  const expiresAt = String(formData.get("expiresAt") ?? "");

  const owned = await db.business.findFirst({ where: { id: businessId, ownerId: owner.id } });
  if (!owned || !type || !fileUrl) return;

  await db.document.create({
    data: {
      businessId,
      type,
      fileUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  revalidatePath("/owner/documents");
  redirect("/owner/documents?added=1");
}

export async function deleteDocumentAction(formData: FormData) {
  const owner = await requireRole("business_owner");
  const id = String(formData.get("id") ?? "");
  const doc = await db.document.findUnique({ where: { id }, include: { business: true } });
  if (!doc || doc.business.ownerId !== owner.id) return;
  await db.document.delete({ where: { id } });
  revalidatePath("/owner/documents");
  redirect("/owner/documents");
}

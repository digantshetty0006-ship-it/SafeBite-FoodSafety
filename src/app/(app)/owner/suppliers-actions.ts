"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

function parseSupplierForm(formData: FormData) {
  return {
    businessId: String(formData.get("businessId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    products: String(formData.get("products") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    licenceNumber: String(formData.get("licenceNumber") ?? "").trim() || null,
    lastDeliveryAt: String(formData.get("lastDeliveryAt") ?? "").trim(),
  };
}

export async function addSupplierAction(formData: FormData) {
  const owner = await requireRole("business_owner");
  const { businessId, name, category, products, location, licenceNumber, lastDeliveryAt } = parseSupplierForm(formData);
  if (!name || !category || !products || !location || !businessId) return;

  const owned = await db.business.findFirst({ where: { id: businessId, ownerId: owner.id } });
  if (!owned) return;

  await db.supplier.create({
    data: {
      businessId,
      name,
      category,
      products,
      location,
      licenceNumber,
      lastDeliveryAt: lastDeliveryAt ? new Date(lastDeliveryAt) : null,
    },
  });
  revalidatePath("/owner/suppliers");
  redirect("/owner/suppliers");
}

export async function updateSupplierAction(formData: FormData) {
  const owner = await requireRole("business_owner");
  const id = String(formData.get("id") ?? "");
  const supplier = await db.supplier.findUnique({ where: { id }, include: { business: true } });
  if (!supplier || supplier.business.ownerId !== owner.id) return;

  const { name, category, products, location, licenceNumber, lastDeliveryAt } = parseSupplierForm(formData);
  if (!name || !category || !products || !location) return;

  await db.supplier.update({
    where: { id },
    data: {
      name,
      category,
      products,
      location,
      licenceNumber,
      lastDeliveryAt: lastDeliveryAt ? new Date(lastDeliveryAt) : null,
    },
  });
  revalidatePath("/owner/suppliers");
  redirect("/owner/suppliers");
}

export async function deleteSupplierAction(formData: FormData) {
  const owner = await requireRole("business_owner");
  const id = String(formData.get("id") ?? "");
  const supplier = await db.supplier.findUnique({ where: { id }, include: { business: true } });
  if (!supplier || supplier.business.ownerId !== owner.id) return;

  await db.supplier.delete({ where: { id } });
  revalidatePath("/owner/suppliers");
  redirect("/owner/suppliers");
}

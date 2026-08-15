import { db } from "./db";

export function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33) ^ id.charCodeAt(i);
  return h >>> 0;
}

export function reference(id: string): string {
  return `MH-FDA-${id.slice(-7).toUpperCase()}`;
}

export async function assignOfficer(complaintId: string): Promise<string | null> {
  const complaint = await db.complaint.findUnique({
    where: { id: complaintId },
    include: { business: { select: { district: true } } },
  });
  const officers = await db.user.findMany({
    where: { role: "food_officer" },
    select: { id: true, district: true },
    orderBy: { id: "asc" },
  });
  if (officers.length === 0) return null;

  // Prefer an officer whose jurisdiction covers the complaint's district (from the
  // pinned map location or the linked business), falling back to round-robin.
  let pool = officers;
  const district = complaint?.district ?? complaint?.business?.district ?? null;
  if (district) {
    const d = district.toLowerCase();
    const matches = officers.filter((o) => o.district && d.includes(o.district.toLowerCase()));
    if (matches.length > 0) pool = matches;
  }

  const officerId = pool[hashId(complaintId) % pool.length].id;
  await db.complaint.update({
    where: { id: complaintId },
    data: { assignedOfficerId: officerId },
  });
  return officerId;
}

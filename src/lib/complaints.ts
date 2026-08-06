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
  const officers = await db.user.findMany({
    where: { role: "food_officer" },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  if (officers.length === 0) return null;
  const officerId = officers[hashId(complaintId) % officers.length].id;
  await db.complaint.update({
    where: { id: complaintId },
    data: { assignedOfficerId: officerId },
  });
  return officerId;
}

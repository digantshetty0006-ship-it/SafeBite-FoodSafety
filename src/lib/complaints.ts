import { db } from "./db";

export function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = (h * 33) ^ id.charCodeAt(i);
  return h >>> 0;
}

export function reference(id: string): string {
  return `MH-FDA-${id.slice(-7).toUpperCase()}`;
}

export async function assignInspector(complaintId: string): Promise<string | null> {
  const inspectors = await db.user.findMany({
    where: { role: "inspector" },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  if (inspectors.length === 0) return null;
  const inspectorId = inspectors[hashId(complaintId) % inspectors.length].id;
  await db.complaint.update({
    where: { id: complaintId },
    data: { assignedInspectorId: inspectorId },
  });
  return inspectorId;
}

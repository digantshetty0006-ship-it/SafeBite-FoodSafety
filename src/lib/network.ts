import type { Business, Inspection, Violation } from "@prisma/client";

export interface NetworkClusterInput {
  business: Business;
  violations: (Violation & { inspection: Inspection | null })[];
  recentViolationDays?: number;
}

export interface OutbreakCluster {
  key: string;
  type: "supplier" | "geo_pattern" | "ingredient";
  label: string;
  confidence: number;
  businesses: string[];
  violations: { businessId: string; type: string; severity: string }[];
  description: string;
}

const VIOLATION_TYPE_HINTS: Record<string, string> = {
  expired_stock: "expired / stale stock",
  pest_control: "pest control failures",
  temperature: "refrigeration / temperature abuse",
  licensing: "licensing irregularities",
  hygiene: "poor hygiene / sanitation",
  adulteration: "adulteration",
};

/**
 * PROTOTYPE HEURISTIC — not real ML. Groups businesses into suspected
 * outbreak networks by (a) shared supplier, and (b) geographic + temporal
 * clustering of the same violation type.
 */
export function detectNetworks(
  clusters: NetworkClusterInput[],
  now = new Date()
): OutbreakCluster[] {
  const results: OutbreakCluster[] = [];
  const seenBusinesses = new Set<string>();

  const bySupplier = new Map<string, NetworkClusterInput[]>();
  for (const c of clusters) {
    if (c.business.supplier) {
      const key = c.business.supplier.trim().toLowerCase();
      if (!key) continue;
      const arr = bySupplier.get(key) ?? [];
      arr.push(c);
      bySupplier.set(key, arr);
    }
  }

  for (const [supplier, members] of bySupplier) {
    if (members.length < 2) continue;
    const sharedType = sharedViolationType(members);
    members.forEach((m) => seenBusinesses.add(m.business.id));
    const severity = worstSeverity(members);
    results.push({
      key: `supplier:${supplier}`,
      type: "supplier",
      label: `Shared supplier "${titleCase(supplier)}"`,
      confidence: 0.55 + Math.min(0.35, members.length * 0.08),
      businesses: members.map((m) => m.business.id),
      violations: members.flatMap((m) =>
        (m.violations ?? []).map((v) => ({
          businessId: m.business.id,
          type: v.type,
          severity: v.severity,
        }))
      ),
      description: `${members.length} businesses source from the same supplier${
        sharedType ? ` and ${members.length} log similar "${sharedType}" violations` : ""
      }.${severity === "critical" ? " Includes critical-severity findings." : ""}`,
    });
  }

  const windowDays = 45;
  for (const c of clusters) {
    if (seenBusinesses.has(c.business.id)) continue;
    const recent = (c.violations ?? []).filter(
      (v) => v.inspection?.completedAt && now.getTime() - new Date(v.inspection.completedAt).getTime() <= windowDays * 86400000
    );
    if (recent.length === 0) continue;
    const type = mode(recent.map((v) => v.type));
    const nearby = clusters.filter(
      (o) =>
        o.business.id !== c.business.id &&
        !seenBusinesses.has(o.business.id) &&
        distanceKm(c.business.lat, c.business.lng, o.business.lat, o.business.lng) <= 8 &&
        (o.violations ?? []).some((v) => v.type === type)
    );
    if (nearby.length < 2) continue;
    const members = [c, ...nearby];
    members.forEach((m) => seenBusinesses.add(m.business.id));
    const districtName = c.business.district || "the same area";
    results.push({
      key: `geo:${type}:${c.business.district}:${Math.round(c.business.lat * 10)}`,
      type: "geo_pattern",
      label: `${titleCase(type)} cluster in ${titleCase(districtName)}`,
      confidence: 0.5 + Math.min(0.4, nearby.length * 0.12),
      businesses: members.map((m) => m.business.id),
      violations: members.flatMap((m) =>
        (m.violations ?? [])
          .filter((v) => v.type === type)
          .map((v) => ({ businessId: m.business.id, type: v.type, severity: v.severity }))
      ),
      description: `${members.length} businesses within ~8 km logged the same "${type}" violation type in the last ${windowDays} days. Possible localized outbreak or common root cause.`,
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

function sharedViolationType(members: NetworkClusterInput[]): string | null {
  const counts = new Map<string, number>();
  for (const m of members) {
    const types = new Set((m.violations ?? []).map((v) => v.type));
    for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  for (const [t, n] of counts) {
    if (n >= Math.max(2, Math.ceil(members.length / 2))) return t;
  }
  return null;
}

function worstSeverity(members: NetworkClusterInput[]): string {
  const order = ["critical", "high", "medium", "low"];
  let worst = "low";
  for (const m of members) {
    for (const v of m.violations ?? []) {
      if (order.indexOf(v.severity) < order.indexOf(worst)) worst = v.severity;
    }
  }
  return worst;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

function mode(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const a of arr) counts.set(a, (counts.get(a) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export { VIOLATION_TYPE_HINTS, titleCase };

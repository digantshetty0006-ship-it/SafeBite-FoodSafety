import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { KpiCard } from "@/components/kpi-card";
import { AlertTriangle, Map as MapIcon } from "lucide-react";
import MapView from "@/components/map/map-view";
import { getLang, tr } from "@/lib/lang";
import { reference } from "@/lib/complaints";

export default async function OfficerMapPage() {
  await requireRole("food_officer");
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const businesses = await db.business.findMany({
    include: { inspections: { orderBy: { completedAt: "desc" }, take: 1 } },
  });

  const complaints = await db.complaint.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    include: { business: { select: { id: true, name: true, district: true } } },
    orderBy: { createdAt: "desc" },
    take: 250,
  });

  const points = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    lat: b.lat,
    lng: b.lng,
    riskScore: b.riskScore,
    district: b.district,
    category: b.category,
    lastInspection: b.inspections[0]?.completedAt ?? b.inspections[0]?.scheduledAt ?? null,
  }));

  const SLA_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const complaintPoints = complaints
    .filter((c) => c.lat !== null && c.lng !== null)
    .map((c) => ({
      id: c.id,
      reference: reference(c.id),
      status: c.status,
      description: c.description,
      lat: c.lat as number,
      lng: c.lng as number,
      createdAt: c.createdAt,
      escalated: c.status !== "resolved" && now - c.createdAt.getTime() > SLA_MS,
      businessId: c.business?.id ?? null,
      businessName: c.business?.name ?? null,
      businessDistrict: c.business?.district ?? null,
    }));

  const byDistrict = new Map<string, { total: number; count: number; critical: number; lat: number; lng: number }>();
  for (const b of businesses) {
    const d = byDistrict.get(b.district) ?? { total: 0, count: 0, critical: 0, lat: 0, lng: 0 };
    d.total += b.riskScore;
    d.count += 1;
    d.lat += b.lat;
    d.lng += b.lng;
    if (b.riskScore >= 51) d.critical += 1;
    byDistrict.set(b.district, d);
  }

  const districts = [...byDistrict.entries()].map(([name, d]) => ({
    name,
    avgScore: d.total / d.count,
    count: d.count,
    critical: d.critical,
    lat: d.lat / d.count,
    lng: d.lng / d.count,
  }));

  const highestDistrict = districts.slice().sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("map.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("map.sub")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label={t("map.districtsMapped")}
          value={districts.length}
          icon={MapIcon}
          hint={t("map.maharashtraHint")}
        />
        <KpiCard
          label={t("map.highestAvg")}
          value={highestDistrict?.name ?? "—"}
          icon={AlertTriangle}
          hint={t("map.avgHint", { n: String(highestDistrict ? Math.round(highestDistrict.avgScore) : 0) })}
          tone="danger"
        />
        <KpiCard
          label={t("map.highRiskBusinesses")}
          value={points.filter((p) => p.riskScore >= 51).length}
          icon={AlertTriangle}
          hint={t("map.cdTier")}
          tone="warning"
        />
      </div>

      <MapView businesses={points} districts={districts} complaints={complaintPoints} lang={lang} />
    </div>
  );
}

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { KpiCard } from "@/components/kpi-card";
import { AlertTriangle, Map as MapIcon } from "lucide-react";
import MapView from "@/components/map/map-view";

export default async function OfficerMapPage() {
  await requireRole("food_officer");

  const businesses = await db.business.findMany({
    include: { inspections: { orderBy: { completedAt: "desc" }, take: 1 } },
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
        <h1 className="text-2xl font-bold tracking-tight">District Risk Heat Map</h1>
        <p className="text-sm text-muted-foreground">
          Colour-coded by aggregate risk. Click a district in the list to isolate it on the map.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Districts mapped"
          value={districts.length}
          icon={MapIcon}
          hint="6 Maharashtra districts"
        />
        <KpiCard
          label="Highest average risk"
          value={highestDistrict?.name ?? "—"}
          icon={AlertTriangle}
          hint={`avg ${highestDistrict ? Math.round(highestDistrict.avgScore) : 0}`}
          tone="danger"
        />
        <KpiCard
          label="High-risk businesses"
          value={points.filter((p) => p.riskScore >= 51).length}
          icon={AlertTriangle}
          hint="C/D tier on the map"
          tone="warning"
        />
      </div>

      <MapView businesses={points} districts={districts} />
    </div>
  );
}

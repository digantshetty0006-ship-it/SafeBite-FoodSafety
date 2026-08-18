import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { SupplierNetwork, type SupplierGroup } from "@/components/officer/supplier-network";
import { getLang, tr } from "@/lib/lang";

export default async function OfficerSuppliersPage() {
  await requireRole("food_officer");
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const rows = await db.supplier.findMany({
    include: { business: { select: { id: true, name: true, district: true, lat: true, lng: true } } },
  });

  // Group suppliers by normalized name across all restaurants, keeping the
  // distinct set of businesses per supplier so inspectors see common suppliers.
  const byName = new Map<string, SupplierGroup & { records: number; missingLicence: number }>();
  for (const s of rows) {
    const key = s.name.trim().toLowerCase();
    let g = byName.get(key);
    if (!g) {
      g = {
        name: s.name.trim(),
        categories: [],
        products: [],
        locations: [],
        licences: [],
        lastDeliveries: [],
        businesses: [],
        risk: null,
        issue: null,
        records: 0,
        missingLicence: 0,
      };
      byName.set(key, g);
    }
    g.records++;
    if (!s.licenceNumber) g.missingLicence++;
    if (s.lastDeliveryAt) g.lastDeliveries.push(s.lastDeliveryAt);
    const pushIfMissing = (arr: string[], v: string) => {
      if (v && !arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v);
    };
    pushIfMissing(g.categories, s.category);
    pushIfMissing(g.products, s.products);
    pushIfMissing(g.locations, s.location);
    if (s.licenceNumber) pushIfMissing(g.licences, s.licenceNumber);
    if (!g.businesses.some((b) => b.id === s.business.id)) {
      g.businesses.push({ id: s.business.id, name: s.business.name, district: s.business.district, lat: s.business.lat, lng: s.business.lng });
    }
  }

  const groups: SupplierGroup[] = [...byName.values()]
    .map((g) => {
      // Simple, honest risk heuristic from real fields:
      // - High: most of its records are missing an FSSAI licence number.
      // - Medium: no delivery recorded in the last 14 days.
      let risk: "high" | "medium" | null = null;
      let issue: string | null = null;
      const missingRatio = g.records ? g.missingLicence / g.records : 0;
      if (missingRatio >= 0.5) {
        risk = "high";
        issue = "missingLicence";
      } else {
        const recent = g.lastDeliveries.some((d) => d.getTime() > Date.now() - 14 * 24 * 3600 * 1000);
        if (!recent) {
          risk = "medium";
          issue = "noRecentDelivery";
        }
      }
      return {
        name: g.name,
        categories: g.categories,
        products: g.products,
        locations: g.locations,
        licences: g.licences,
        lastDeliveries: g.lastDeliveries,
        businesses: g.businesses,
        risk,
        issue,
      };
    })
    .sort((a, b) => b.businesses.length - a.businesses.length || a.name.localeCompare(b.name));

  const common = groups.filter((g) => g.businesses.length >= 2).length;
  const highRisk = groups.filter((g) => g.risk === "high").length;
  const alerts = groups
    .filter((g) => g.risk !== null)
    .sort((a, b) => (a.risk === "high" ? -1 : 1) - (b.risk === "high" ? -1 : 1) || a.name.localeCompare(b.name));

  // Map points: every restaurant with suppliers, coloured by connection count.
  const restaurantIds = new Set<string>();
  const mapById = new Map<string, { id: string; name: string; district: string; lat: number; lng: number; count: number }>();
  for (const g of groups) {
    for (const b of g.businesses) {
      restaurantIds.add(b.id);
      const p = mapById.get(b.id) ?? { id: b.id, name: b.name, district: b.district, lat: b.lat, lng: b.lng, count: 0 };
      p.count++;
      mapById.set(b.id, p);
    }
  }

  const districts = [...new Set(rows.map((s) => s.business.district))].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("sn.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("sn.sub")}</p>
      </div>
      <SupplierNetwork
        groups={groups}
        alerts={alerts}
        stats={{ total: groups.length, common, restaurants: restaurantIds.size, highRisk }}
        districts={districts}
        mapPoints={[...mapById.values()]}
        lang={lang}
      />
    </div>
  );
}

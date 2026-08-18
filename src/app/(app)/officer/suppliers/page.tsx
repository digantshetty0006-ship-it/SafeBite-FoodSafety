import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { SupplierNetwork, type SupplierGroup } from "@/components/officer/supplier-network";
import { getLang, tr } from "@/lib/lang";

export default async function OfficerSuppliersPage() {
  await requireRole("food_officer");
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const rows = await db.supplier.findMany({
    include: { business: { select: { id: true, name: true, district: true } } },
  });

  // Group suppliers by normalized name across all restaurants, keeping the
  // distinct set of businesses per supplier so inspectors see common suppliers.
  const byName = new Map<string, SupplierGroup>();
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
      };
      byName.set(key, g);
    }
    const pushIfMissing = (arr: string[], v: string) => {
      if (v && !arr.some((x) => x.toLowerCase() === v.toLowerCase())) arr.push(v);
    };
    pushIfMissing(g.categories, s.category);
    pushIfMissing(g.products, s.products);
    pushIfMissing(g.locations, s.location);
    if (s.licenceNumber) pushIfMissing(g.licences, s.licenceNumber);
    if (s.lastDeliveryAt) g.lastDeliveries.push(s.lastDeliveryAt);
    if (!g.businesses.some((b) => b.id === s.business.id)) {
      g.businesses.push({ id: s.business.id, name: s.business.name, district: s.business.district });
    }
  }

  const groups = [...byName.values()].sort(
    (a, b) => b.businesses.length - a.businesses.length || a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("sn.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("sn.sub")}</p>
      </div>
      <SupplierNetwork groups={groups} lang={lang} />
    </div>
  );
}

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/officer/analytics-dashboard";
import { detectNetworks } from "@/lib/network";
import { categoryLabel } from "@/lib/format";

export default async function OfficerAnalyticsPage() {
  await requireRole("fda_officer");

  const [businesses, complaints, inspections] = await Promise.all([
    db.business.findMany({
      include: { inspections: { include: { violations: { include: { inspection: true } } } }, complaints: true },
    }),
    db.complaint.findMany({ include: { business: { select: { id: true, category: true, name: true } } } }),
    db.inspection.findMany({ include: { violations: true }, orderBy: { completedAt: "desc" } }),
  ]);

  // Monthly activity (last 12 months)
  const months: { month: string; key: string; inspections: number; violations: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString("en-IN", { month: "short" }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      inspections: 0,
      violations: 0,
    });
  }
  for (const insp of inspections) {
    if (!insp.completedAt) continue;
    const key = `${insp.completedAt.getFullYear()}-${insp.completedAt.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (!bucket) continue;
    bucket.inspections += 1;
    bucket.violations += insp.violations.length;
  }

  // Complaints by category
  const catCount = new Map<string, number>();
  for (const c of complaints) {
    if (!c.business) continue;
    const cat = c.business.category;
    catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
  }
  const complaintsByCategory = [...catCount.entries()]
    .map(([category, count]) => ({ category: categoryLabel(category), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Average risk by district
  const byDistrict = new Map<string, { total: number; count: number }>();
  for (const b of businesses) {
    const d = byDistrict.get(b.district) ?? { total: 0, count: 0 };
    d.total += b.riskScore;
    d.count += 1;
    byDistrict.set(b.district, d);
  }
  const riskByDistrict = [...byDistrict.entries()].map(([district, d]) => ({
    district,
    avg: Math.round(d.total / d.count),
    count: d.count,
  }));

  // Tier distribution
  const tiers = ["A", "B", "C", "D"];
  const tierDistribution = tiers
    .map((t) => ({ name: `Tier ${t}`, value: businesses.filter((b) => b.riskTier === t).length }))
    .filter((t) => t.value > 0);

  // Severity by district (stacked)
  const sevByDistrict = new Map<string, { low: number; medium: number; high: number; critical: number }>();
  for (const b of businesses) {
    const d = sevByDistrict.get(b.district) ?? { low: 0, medium: 0, high: 0, critical: 0 };
    for (const insp of b.inspections) {
      for (const v of insp.violations) {
        if (v.severity === "low") d.low++;
        else if (v.severity === "medium") d.medium++;
        else if (v.severity === "high") d.high++;
        else d.critical++;
      }
    }
    sevByDistrict.set(b.district, d);
  }
  const severityByDistrict = [...sevByDistrict.entries()].map(([district, v]) => ({ district, ...v }));

  // Network detection
  const networks = detectNetworks(
    businesses.map((b) => ({
      business: b,
      violations: b.inspections.flatMap((i) => i.violations),
    }))
  );

  const businessNames: Record<string, string> = {};
  for (const b of businesses) businessNames[b.id] = b.name;

  const topRisky = businesses
    .slice()
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map((b) => ({ id: b.id, name: b.name, score: b.riskScore, district: b.district }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics & Outbreak Detection</h1>
        <p className="text-sm text-muted-foreground">
          Trend charts and rule-based network detection across all registered businesses.
        </p>
      </div>
      <AnalyticsDashboard
        data={{
          monthlyActivity: months.map(({ month, inspections, violations }) => ({ month, inspections, violations })),
          complaintsByCategory,
          riskByDistrict,
          tierDistribution,
          severityByDistrict,
          networks,
          businessNames,
          topRisky,
        }}
      />
    </div>
  );
}

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ReportForm } from "@/components/citizen/report-form";
import { getLang, tr } from "@/lib/lang";

export default async function CitizenReportPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  await requireRole("citizen");
  const lang = await getLang();
  const t = (k: string) => tr(lang, k);
  const { business } = await searchParams;
  const businesses = await db.business.findMany({
    select: { id: true, name: true, district: true, category: true },
    take: 400,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("report.title")}</h1>
        <p className="text-sm text-muted-foreground">
          Help keep your community safe. Reports are reviewed by food safety officers and can trigger an inspection.
        </p>
      </div>
      <ReportForm businesses={businesses} initialBusiness={business ?? ""} />
    </div>
  );
}

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
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
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
          {t("report.sub")}
        </p>
      </div>
      <ReportForm businesses={businesses} initialBusiness={business ?? ""} lang={lang} />
    </div>
  );
}

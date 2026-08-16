import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { LookupResults } from "@/components/citizen/lookup-results";
import { getLang, tr } from "@/lib/lang";

export default async function CitizenLookupPage() {
  await requireRole("citizen");
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const businesses = await db.business.findMany({
    select: {
      id: true,
      name: true,
      district: true,
      category: true,
      address: true,
      riskScore: true,
      riskTier: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("lookup.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("lookup.sub")}
        </p>
      </div>

      <LookupResults businesses={businesses} lang={lang} />
    </div>
  );
}

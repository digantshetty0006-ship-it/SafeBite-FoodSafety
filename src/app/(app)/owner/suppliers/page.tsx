import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { SuppliersManager } from "@/components/owner/suppliers-manager";
import { getLang, tr } from "@/lib/lang";

export default async function OwnerSuppliersPage() {
  const owner = await requireRole("business_owner");
  const lang = await getLang();
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  const businesses = await db.business
    .findMany({
      where: { ownerId: owner.id },
      include: { suppliers: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    })
    .then((bs) =>
      bs.map((b) => ({
        id: b.id,
        name: b.name,
        suppliers: b.suppliers.map((s) => ({ ...s, businessName: b.name })),
      }))
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("supp.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("supp.sub")}</p>
      </div>
      <SuppliersManager businesses={businesses} lang={lang} />
    </div>
  );
}

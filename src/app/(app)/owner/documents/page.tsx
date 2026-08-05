import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { DocumentsManager } from "@/components/owner/documents-manager";

export default async function OwnerDocumentsPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const owner = await requireRole("business_owner");
  await searchParams;

  const businesses = await db.business.findMany({
    where: { ownerId: owner.id },
    include: { documents: true },
  });

  const documents = businesses
    .flatMap((b) => b.documents.map((d) => ({ ...d, businessId: b.id, businessName: b.name })))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload renewals, lab certificates, and staff health certificates.
        </p>
      </div>
      <DocumentsManager documents={documents} />
    </div>
  );
}

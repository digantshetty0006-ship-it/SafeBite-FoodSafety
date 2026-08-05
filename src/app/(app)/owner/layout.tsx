import { requireRole } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("business_owner");
  return <>{children}</>;
}

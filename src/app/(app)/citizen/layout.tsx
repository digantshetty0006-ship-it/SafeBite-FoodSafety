import { requireRole } from "@/lib/auth";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  await requireRole("citizen");
  return <>{children}</>;
}

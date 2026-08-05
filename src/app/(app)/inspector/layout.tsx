import { requireRole } from "@/lib/auth";

export default async function InspectorLayout({ children }: { children: React.ReactNode }) {
  await requireRole("inspector");
  return <>{children}</>;
}

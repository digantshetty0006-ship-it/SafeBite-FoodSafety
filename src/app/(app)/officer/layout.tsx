import { requireRole } from "@/lib/auth";

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("food_officer");
  return <>{children}</>;
}

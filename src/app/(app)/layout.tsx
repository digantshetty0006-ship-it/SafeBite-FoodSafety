import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";

export const metadata = {
  title: "BiteSafe",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

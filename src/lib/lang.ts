import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";
export { tr } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  const v = c.get("lang")?.value;
  return v === "hi" || v === "mr" ? v : "en";
}
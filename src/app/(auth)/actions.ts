"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, loginUser, ROLE_HOME } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const user = await loginUser(email, password);
  if (!user) {
    redirect("/login?error=1");
  }

  await createSession(user.id);
  redirect(ROLE_HOME[user.role] ?? "/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

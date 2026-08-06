import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "foodshield_session";
const SECRET = process.env.AUTH_SECRET ?? "foodshield-demo-secret-change-me";

export interface DemoUser {
  email: string;
  password: string;
  role: string;
}

export const DEMO_USERS: DemoUser[] = [
  { email: "officer@demo.in", password: "demo1234", role: "food_officer" },
  { email: "citizen@demo.in", password: "demo1234", role: "citizen" },
  { email: "owner@demo.in", password: "demo1234", role: "business_owner" },
];

export const ROLE_LABELS: Record<string, string> = {
  food_officer: "Food Safety Officer",
  citizen: "Citizen",
  business_owner: "Business Owner",
};

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

function unsign(payload: string, sig: string): boolean {
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(userId: string): Promise<void> {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  const b64 = Buffer.from(payload).toString("base64url");
  const token = `${b64}.${sign(b64)}`;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig || !unsign(payloadB64, sig)) return null;
  let parsed: { uid: string; exp: number };
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed.uid || Date.now() > parsed.exp) return null;
  try {
    const user = await db.user.findUnique({ where: { id: parsed.uid } });
    return user;
  } catch {
    return null;
  }
}

export async function requireRole(...roles: string[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) redirect("/login");
  return user;
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

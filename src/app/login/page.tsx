import Link from "next/link";
import { ShieldCheck, ArrowLeft, Landmark, Megaphone, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoLoginAction, loginAction } from "../(auth)/actions";
import { DEMO_USERS } from "@/lib/auth";

const ROLE_ICONS: Record<string, React.ElementType> = {
  food_officer: Landmark,
  citizen: Megaphone,
  business_owner: Building2,
};

const ROLE_NAMES: Record<string, string> = {
  food_officer: "Food Safety Officer",
  citizen: "Citizen",
  business_owner: "Business Owner",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 px-4 py-12">
      <div className="mb-6 flex items-center gap-2 text-white">
        <ShieldCheck className="h-6 w-6" />
        <span className="text-xl font-semibold">BiteSafe</span>
      </div>

      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
        {/* Role picker */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white">Demo login — pick a role</h1>
          <p className="mt-2 text-sm text-emerald-50/80">
            Role-based access for the demo. Credentials are hardcoded and filled in automatically.
          </p>
          <div className="mt-6 grid gap-3">
            {DEMO_USERS.map((u) => {
              const Icon = ROLE_ICONS[u.role] ?? ShieldCheck;
              return (
                <form key={u.email} action={demoLoginAction}>
                  <input type="hidden" name="email" value={u.email} />
                  <input type="hidden" name="password" value={u.password} />
                  <button
                    type="submit"
                    className="group flex w-full items-center gap-4 rounded-xl border border-white/20 bg-white/10 p-4 text-left text-white backdrop-blur transition hover:border-white/40 hover:bg-white/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{ROLE_NAMES[u.role]}</p>
                      <p className="truncate font-mono text-xs text-emerald-50/70">{u.email}</p>
                    </div>
                    <ArrowLeft className="h-4 w-4 -rotate-180 text-emerald-50/50 transition group-hover:text-white" />
                  </button>
                </form>
              );
            })}
          </div>
        </div>

        {/* Manual login */}
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Sign in with email</CardTitle>
            <CardDescription>
              Use any demo account — password is <code className="rounded bg-muted px-1">demo1234</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm hasError={!!error} />
          </CardContent>
        </Card>
      </div>

      <Link href="/" className="mt-8 flex items-center gap-2 text-sm text-emerald-50/70 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  );
}

function LoginForm({ hasError }: { hasError: boolean }) {
  return (
    <>
      {hasError && (
        <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Invalid credentials. Use a demo account with password <code className="font-mono">demo1234</code>.
        </p>
      )}
      <form action={loginAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="officer@demo.in"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="demo1234"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      </form>
    </>
  );
}

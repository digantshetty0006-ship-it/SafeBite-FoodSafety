"use client";

import { useSearchParams } from "next/navigation";
import { loginAction } from "../(auth)/actions";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const params = useSearchParams();
  const hasError = params.get("error") === "1";
  const prefillEmail = params.get("email") ?? "";
  const prefillPassword = params.get("password") ?? "";
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
            Email or login ID
          </label>
          <input
            id="email"
            name="email"
            type="text"
            placeholder="citdigantshetty or officer@demo.in"
            defaultValue={prefillEmail}
            required
            autoComplete="username"
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
            defaultValue={prefillPassword}
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

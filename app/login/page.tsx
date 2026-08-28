"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60rem 30rem at 20% -10%, color-mix(in oklch, oklch(0.45 0.1 250) 45%, transparent), transparent), radial-gradient(50rem 25rem at 100% 100%, color-mix(in oklch, oklch(0.45 0.1 250) 30%, transparent), transparent), radial-gradient(30rem 16rem at 85% 10%, color-mix(in oklch, var(--sidebar-primary) 12%, transparent), transparent)",
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2.5 text-sidebar-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no benefit from next/image optimization */}
          <img src="/clearflow-mark.svg" alt="ClearFlow AI" className="size-9" />
          <span className="text-lg font-semibold tracking-tight">ClearFlow AI</span>
        </div>

        <Card className="w-full border-white/10 bg-card/95 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to manage your lead pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

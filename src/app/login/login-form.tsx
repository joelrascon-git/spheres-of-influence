"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {});
  if (state.sent) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center text-sm">
        Check <span className="font-medium">{state.email}</span> for a sign-in link.
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3">
      <Input name="email" type="email" required placeholder="you@factory.ai" autoComplete="email" className="h-10" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}

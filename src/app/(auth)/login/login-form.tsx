"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setBusy(false);
      setError(
        error.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : "Invalid email or password.",
      );
      return;
    }
    router.push("/founder");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Sign in</h1>
      <p className="mt-1.5 text-sm text-muted">Welcome back to Vantor.</p>
      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? <Spinner className="border-white/40 border-t-white" /> : null}
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        New to Vantor?{" "}
        <Link href="/signup" className="font-medium text-accent-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

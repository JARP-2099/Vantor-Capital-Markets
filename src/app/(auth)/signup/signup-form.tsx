"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setBusy(true);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? ""),
      password,
    });
    if (error) {
      setBusy(false);
      setError(
        error.status === 422 || error.message?.toLowerCase().includes("exist")
          ? "An account with this email already exists."
          : error.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : "Could not create your account. Check your details and try again.",
      );
      return;
    }
    router.push("/founder");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your Vantor account</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" autoComplete="name" required minLength={2} />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </Field>
          <Field
            label="Password"
            htmlFor="password"
            hint="At least 10 characters."
            required
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
            />
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Spinner className="border-white/40 border-t-white" /> : null}
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink-900 underline decoration-line-strong underline-offset-2 hover:decoration-faint">
            Sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { FounderFormState } from "@/lib/actions/founder-company";

export const IDLE_STATE: FounderFormState = { status: "idle" };

/** Top-of-form outcome banner shared by every founder form. */
export function FormStateAlert({ state }: { state: FounderFormState }) {
  if (state.status === "error" && state.message) {
    return <Alert tone="error">{state.message}</Alert>;
  }
  if (state.status === "success" && state.message) {
    return <Alert tone="success">{state.message}</Alert>;
  }
  return null;
}

export function SubmitButton({
  pending,
  children,
  className,
}: {
  pending: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? <Spinner className="border-white/40 border-t-white" /> : null}
      {children}
    </Button>
  );
}

/** Wires aria-invalid + aria-describedby for a field with a known error id. */
export function invalidProps(id: string, error: string | undefined) {
  return error
    ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` }
    : {};
}

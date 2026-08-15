"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Global error boundary. Never surfaces stack traces or internals. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} variant="secondary" className="mt-6">
        Try again
      </Button>
    </main>
  );
}

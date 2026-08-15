import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or is no longer available.
      </p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        Back to Vantor
      </ButtonLink>
    </main>
  );
}

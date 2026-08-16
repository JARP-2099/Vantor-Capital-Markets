import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/authz";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

/**
 * Admin chrome. The layout gates the whole segment — signed-out users go to
 * login, signed-in non-admins get a 404 (no hint that /admin exists) — but
 * this is defense in depth only: every admin page and every server action
 * calls requireAdmin() itself. Layouts are not a security boundary.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login");
    if (err instanceof ForbiddenError) notFound();
    throw err;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-ink-900 text-white">
        <Container className="flex h-12 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo href="/admin" variant="dark" />
            <span className="rounded-sm border border-white/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/80">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Back to site
          </Link>
        </Container>
        <AdminNav />
      </header>
      <main className="flex-1 bg-canvas">{children}</main>
    </>
  );
}

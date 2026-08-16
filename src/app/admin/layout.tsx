import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ForbiddenError, requireAdmin, UnauthorizedError } from "@/lib/authz";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

const navLinkClass =
  "text-sm font-medium text-slate-650 hover:text-ink-900 transition-colors";

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
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo href="/admin" size="sm" markOnly />
            <span className="rounded-sm bg-ink-900 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-canvas">
              Admin
            </span>
          </div>
          <nav aria-label="Admin" className="flex items-center gap-4 sm:gap-6">
            <Link href="/admin" className={`${navLinkClass} hidden sm:inline`}>
              Queue
            </Link>
            <Link href="/admin/companies" className={`${navLinkClass} hidden sm:inline`}>
              Companies
            </Link>
            <Link href="/admin/users" className={`${navLinkClass} hidden sm:inline`}>
              Users
            </Link>
            <Link href="/admin/verifications" className={`${navLinkClass} hidden sm:inline`}>
              Verifications
            </Link>
            <Link href="/" className={navLinkClass}>
              Back to site
            </Link>
          </nav>
        </Container>
      </header>
      <main className="flex-1 bg-canvas">{children}</main>
    </>
  );
}

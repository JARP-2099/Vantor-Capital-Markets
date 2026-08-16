import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { CompanyTable } from "@/components/admin/company-table";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/cn";
import { COMPANY_STATUSES, STATUS_LABELS, type CompanyStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin — Companies" };

function isCompanyStatus(value: string | undefined): value is CompanyStatus {
  return Boolean(value) && (COMPANY_STATUSES as readonly string[]).includes(value as string);
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium transition-colors sm:h-8",
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-line-strong bg-paper text-slate-650 hover:border-faint hover:text-ink-900",
      )}
    >
      {children}
    </Link>
  );
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPage();
  const { status: rawStatus } = await searchParams;
  const status = isCompanyStatus(rawStatus) ? rawStatus : undefined;

  const rows = await db
    .select()
    .from(companies)
    .where(status ? eq(companies.status, status) : undefined)
    .orderBy(desc(companies.updatedAt));

  return (
    <Container wide className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">All companies</h1>
        <p className="mt-1 text-sm text-muted">
          Every company on the platform, in any lifecycle state.
        </p>
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <FilterLink href="/admin/companies" active={!status}>
          All
        </FilterLink>
        {COMPANY_STATUSES.map((s) => (
          <FilterLink key={s} href={`/admin/companies?status=${s}`} active={status === s}>
            {STATUS_LABELS[s]}
          </FilterLink>
        ))}
      </nav>

      <CompanyTable
        companies={rows}
        emptyTitle={
          status ? `No ${STATUS_LABELS[status].toLowerCase()} companies` : "No companies yet"
        }
        emptyDescription={
          status
            ? "Try a different status filter."
            : "Companies appear here as founders create profiles."
        }
      />
    </Container>
  );
}

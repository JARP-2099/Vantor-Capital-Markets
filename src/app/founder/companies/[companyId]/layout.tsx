import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ManageNav } from "@/components/founder/manage-nav";
import { requireManagerPage } from "@/components/founder/data";
import { StatusBadge } from "@/components/founder/status-badge";
import type { CompanyStatus } from "@/lib/constants";

export default async function ManageCompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireManagerPage(companyId);

  return (
    <>
      <div className="border-b border-line bg-paper">
        <Container className="pt-8">
          <Link href="/founder" className="text-xs font-medium text-slate-650 hover:text-ink-900">
            &larr; Founder dashboard
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{company.name}</h1>
            <StatusBadge status={company.status as CompanyStatus} />
          </div>
          {company.shortDescription ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted">{company.shortDescription}</p>
          ) : null}
          <div className="mt-5">
            <ManageNav companyId={companyId} />
          </div>
        </Container>
      </div>
      <Container className="py-8">{children}</Container>
    </>
  );
}

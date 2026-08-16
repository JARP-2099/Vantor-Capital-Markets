import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ManageNav } from "@/components/founder/manage-nav";
import { requireManagerPage } from "@/components/founder/data";
import { StatusBadge } from "@/components/founder/status-badge";
import { STAGE_LABELS, type CompanyStage, type CompanyStatus } from "@/lib/constants";

export default async function ManageCompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireManagerPage(companyId);

  const meta = [
    company.stage ? STAGE_LABELS[company.stage as CompanyStage] : null,
    company.industry,
    [company.hqCity, company.hqCountry].filter(Boolean).join(", ") || null,
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="border-b border-line bg-paper">
        <Container className="pt-6 sm:pt-8">
          <Link
            href="/founder"
            className="text-xs font-medium text-muted transition-colors hover:text-ink-900"
          >
            &larr; Your companies
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{company.name}</h1>
            <StatusBadge status={company.status as CompanyStatus} dot />
          </div>
          {meta.length > 0 ? (
            <p className="mt-1 text-xs text-muted">
              {meta.map((m, i) => (
                <span key={m}>
                  {i > 0 ? <span className="mx-1.5 text-line-strong">&middot;</span> : null}
                  {m}
                </span>
              ))}
            </p>
          ) : null}
          {company.shortDescription ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {company.shortDescription}
            </p>
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

import Link from "next/link";
import type { ReactNode } from "react";
import type { CompanyRow } from "@/db/queries/companies";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, TBody, TD, TH, THead } from "@/components/ui/table";
import { STAGE_LABELS, type CompanyStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

type CompanyTableProps = {
  companies: CompanyRow[];
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

/**
 * Shared admin companies table (review queue + all-companies list). TableWrap
 * scrolls wide rows inside the card so the page itself never scrolls
 * horizontally on small screens.
 */
export function CompanyTable({
  companies,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: CompanyTableProps) {
  if (companies.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  // `relative` keeps the absolutely-positioned sr-only header text inside
  // the scroll container instead of widening the page.
  return (
    <TableWrap className="relative">
      <Table className="min-w-176">
        <THead>
          <tr>
            <TH dense>Name</TH>
            <TH dense>Industry</TH>
            <TH dense>Stage</TH>
            <TH dense>Status</TH>
            <TH dense numeric>
              Submitted
            </TH>
            <TH dense>
              <span className="sr-only">Actions</span>
            </TH>
          </tr>
        </THead>
        <TBody>
          {companies.map((company) => (
            <tr key={company.id} className="transition-colors hover:bg-mist/40">
              <TD dense className="whitespace-nowrap">
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="font-medium text-ink-900 hover:text-accent-700"
                >
                  {company.name}
                </Link>
                {company.isDemo ? (
                  <span className="ml-2 rounded-sm border border-line px-1 py-px text-[10px] font-medium uppercase tracking-wide text-faint">
                    Demo
                  </span>
                ) : null}
              </TD>
              <TD dense className="whitespace-nowrap">
                {company.industry ?? "—"}
              </TD>
              <TD dense className="whitespace-nowrap">
                {company.stage ? STAGE_LABELS[company.stage] : "—"}
              </TD>
              <TD dense className="whitespace-nowrap">
                <StatusBadge status={company.status as CompanyStatus} />
              </TD>
              <TD dense numeric className="whitespace-nowrap">
                {company.submittedAt ? formatDate(company.submittedAt) : "—"}
              </TD>
              <TD dense numeric className="whitespace-nowrap">
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="inline-flex h-7 items-center rounded-md border border-line-strong bg-paper px-2.5 text-xs font-medium text-ink-900 transition-colors hover:border-faint hover:bg-canvas"
                >
                  Review
                </Link>
              </TD>
            </tr>
          ))}
        </TBody>
      </Table>
    </TableWrap>
  );
}

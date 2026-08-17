import Link from "next/link";
import type { CompanyRow } from "@/db/queries/companies";
import { EmptyState } from "@/components/ui/empty-state";
import { STAGE_LABELS, type CompanyStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

const thClass =
  "px-4 py-2.5 text-left text-xs font-medium text-faint whitespace-nowrap";
const tdClass = "px-4 py-3 text-sm text-slate-650 whitespace-nowrap";

type CompanyTableProps = {
  companies: CompanyRow[];
  emptyTitle: string;
  emptyDescription?: string;
};

/**
 * Shared admin companies table (review queue + all-companies list).
 * Rendered inside overflow-x-auto so wide rows scroll instead of breaking
 * the page on small screens.
 */
export function CompanyTable({ companies, emptyTitle, emptyDescription }: CompanyTableProps) {
  if (companies.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-paper shadow-card">
      <table className="w-full min-w-176 border-collapse">
        <thead className="border-b border-line bg-canvas">
          <tr>
            <th scope="col" className={thClass}>
              Name
            </th>
            <th scope="col" className={thClass}>
              Industry
            </th>
            <th scope="col" className={thClass}>
              Stage
            </th>
            <th scope="col" className={thClass}>
              Submitted
            </th>
            <th scope="col" className={thClass}>
              Status
            </th>
            {/* relative: contains the absolute sr-only text so it cannot
                widen the document beyond the scroll container */}
            <th scope="col" className={`relative ${thClass}`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-canvas/60 transition-colors">
              <td className={tdClass}>
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="font-medium text-ink-900 hover:underline"
                >
                  {company.name}
                </Link>
                {company.isDemo ? (
                  <span className="ml-2 rounded-sm bg-mist px-1.5 py-0.5 text-[10px] font-medium text-muted">
                    Demo
                  </span>
                ) : null}
              </td>
              <td className={tdClass}>{company.industry ?? "–"}</td>
              <td className={tdClass}>{company.stage ? STAGE_LABELS[company.stage] : "–"}</td>
              <td className={tdClass}>
                {company.submittedAt ? formatDate(company.submittedAt) : "–"}
              </td>
              <td className={tdClass}>
                <StatusBadge status={company.status as CompanyStatus} />
              </td>
              <td className={`${tdClass} text-right`}>
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="inline-flex h-8 items-center rounded-md border border-line bg-paper px-3 text-sm font-medium text-ink-900 transition-colors hover:border-faint hover:bg-canvas"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

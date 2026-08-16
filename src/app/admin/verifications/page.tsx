import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { getPendingVerificationRequests } from "@/db/queries/verifications";
import { companies } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { VerificationStatusBadge } from "@/components/admin/verification/verification-status-badge";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import {
  VERIFICATION_CATEGORY_LABELS,
  type VerificationCategory,
  type VerificationStatus,
} from "@/lib/verification/constants";

export const metadata: Metadata = { title: "Admin — Verifications" };

const thClass =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted whitespace-nowrap";
const tdClass = "px-4 py-2.5 text-sm text-slate-650 whitespace-nowrap";

export default async function AdminVerificationsPage() {
  await requireAdminPage();

  const requests = await getPendingVerificationRequests();

  const companyIds = [...new Set(requests.map((r) => r.companyId))];
  const companyRows =
    companyIds.length === 0
      ? []
      : await db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(inArray(companies.id, companyIds));
  const companyNameById = new Map(companyRows.map((c) => [c.id, c.name]));

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Verification queue</h1>
        <p className="mt-1 text-sm text-muted">
          Verification requests that are pending or under review, oldest first.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No verification requests waiting for review."
          description="New requests will appear here as founders submit claims for verification."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper shadow-card">
          <table className="w-full min-w-160 border-collapse">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th scope="col" className={thClass}>
                  Company
                </th>
                <th scope="col" className={thClass}>
                  Category
                </th>
                <th scope="col" className={thClass}>
                  Status
                </th>
                <th scope="col" className={thClass}>
                  Submitted
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className={`${tdClass} font-medium text-ink-900`}>
                    {companyNameById.get(request.companyId) ?? (
                      <span className="font-mono text-xs text-faint">
                        {request.companyId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className={tdClass}>
                    {VERIFICATION_CATEGORY_LABELS[request.category as VerificationCategory]}
                  </td>
                  <td className={tdClass}>
                    <VerificationStatusBadge status={request.status as VerificationStatus} />
                  </td>
                  <td className={tdClass}>{formatDate(request.createdAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <Link
                      href={`/admin/verifications/${request.id}`}
                      className="text-sm font-medium text-accent-600 hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}

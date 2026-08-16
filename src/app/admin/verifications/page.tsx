import type { Metadata } from "next";
import { inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { getPendingVerificationRequests } from "@/db/queries/verifications";
import { companies } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { MonoId } from "@/components/admin/mono-id";
import { VerificationStatusBadge } from "@/components/admin/verification/verification-status-badge";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableWrap, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import {
  VERIFICATION_CATEGORY_LABELS,
  type VerificationCategory,
  type VerificationStatus,
} from "@/lib/verification/constants";

export const metadata: Metadata = { title: "Admin — Verifications" };

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
    <Container wide className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Verification queue
        </h1>
        <p className="mt-1 text-sm text-muted">
          Verification requests that are pending or under review, oldest first.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="The verification queue is clear"
          description="Founder-submitted verification requests land here, oldest first. Each request carries a claim, its evidence, and the decisions available for it."
        />
      ) : (
        <TableWrap className="relative">
          <Table className="min-w-160">
            <THead>
              <tr>
                <TH dense>Company</TH>
                <TH dense>Category</TH>
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
              {requests.map((request) => (
                <tr key={request.id} className="transition-colors hover:bg-mist/40">
                  <TD dense className="whitespace-nowrap font-medium text-ink-900">
                    {companyNameById.get(request.companyId) ?? (
                      <MonoId value={request.companyId} className="text-faint" />
                    )}
                  </TD>
                  <TD dense className="whitespace-nowrap">
                    {VERIFICATION_CATEGORY_LABELS[request.category as VerificationCategory]}
                  </TD>
                  <TD dense className="whitespace-nowrap">
                    <VerificationStatusBadge status={request.status as VerificationStatus} />
                  </TD>
                  <TD dense numeric className="whitespace-nowrap">
                    {formatDate(request.createdAt)}
                  </TD>
                  <TD dense numeric className="whitespace-nowrap">
                    <Link
                      href={`/admin/verifications/${request.id}`}
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
      )}
    </Container>
  );
}

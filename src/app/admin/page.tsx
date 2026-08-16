import type { Metadata } from "next";
import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { getCompaniesAwaitingReview } from "@/db/queries/companies";
import { auditLog, companies } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { CompanyTable } from "@/components/admin/company-table";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { MetricStat } from "@/components/ui/metric-stat";
import { Table, TableWrap, TBody, TD, TH, THead } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Review Queue" };

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const [queue, statusCounts, recentAudit] = await Promise.all([
    getCompaniesAwaitingReview(),
    // One grouped query; totals derived in JS.
    db.select({ status: companies.status, value: count() }).from(companies).groupBy(companies.status),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(20),
  ]);

  const byStatus = new Map(statusCounts.map((r) => [r.status, r.value]));
  const total = statusCounts.reduce((sum, r) => sum + r.value, 0);
  const stats = [
    { label: "Submitted", value: byStatus.get("submitted") ?? 0 },
    { label: "Under review", value: byStatus.get("under_review") ?? 0 },
    { label: "Published", value: byStatus.get("published") ?? 0 },
    { label: "Total companies", value: total },
  ];

  return (
    <Container wide className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Review queue</h1>
        <p className="mt-1 text-sm text-muted">
          Company submissions awaiting review, oldest first.
        </p>
      </div>

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-paper shadow-card lg:grid-cols-4">
        {stats.map((stat) => (
          <MetricStat
            key={stat.label}
            label={stat.label}
            value={String(stat.value)}
            className="-mt-px -ml-px border-t border-l border-line px-5 py-3"
          />
        ))}
      </dl>

      <section aria-labelledby="queue-heading" className="space-y-3">
        <div>
          <h2 id="queue-heading" className="text-lg font-bold tracking-tight text-ink-900">
            Awaiting review
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Ordered oldest first — the longest-waiting submission is at the top.
          </p>
        </div>
        <CompanyTable
          companies={queue}
          emptyTitle="No companies waiting for review"
          emptyDescription="New submissions land here as founders complete their profiles."
          emptyAction={
            <ButtonLink href="/admin/companies" variant="secondary" size="sm">
              View all companies
            </ButtonLink>
          }
        />
      </section>

      <section aria-labelledby="audit-heading" className="space-y-3">
        <h2 id="audit-heading" className="text-lg font-bold tracking-tight text-ink-900">
          Recent activity
        </h2>
        {recentAudit.length === 0 ? (
          <div className="rounded-lg border border-line bg-paper px-5 py-8 text-center shadow-card">
            <p className="text-sm font-medium text-ink-900">No activity recorded yet</p>
            <p className="mt-1 text-sm text-muted">
              Review decisions and lifecycle changes appear here as they happen.
            </p>
          </div>
        ) : (
          <TableWrap>
            <Table className="min-w-160">
              <THead>
                <tr>
                  <TH dense>Action</TH>
                  <TH dense>Entity</TH>
                  <TH dense>Actor</TH>
                  <TH dense numeric>
                    When
                  </TH>
                </tr>
              </THead>
              <TBody>
                {recentAudit.map((entry) => (
                  <tr key={entry.id}>
                    <TD dense className="whitespace-nowrap font-medium text-ink-900">
                      {entry.action}
                    </TD>
                    <TD dense className="whitespace-nowrap">
                      {entry.entityType}{" "}
                      <span className="font-mono text-xs text-faint" title={entry.entityId}>
                        {entry.entityId.slice(0, 8)}…
                      </span>
                    </TD>
                    <TD dense className="whitespace-nowrap">
                      {entry.actorUserId ? (
                        <span className="font-mono text-xs text-muted" title={entry.actorUserId}>
                          {entry.actorUserId.slice(0, 8)}…
                        </span>
                      ) : (
                        <span className="text-faint">system</span>
                      )}
                    </TD>
                    <TD dense numeric className="whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </section>
    </Container>
  );
}

import type { Metadata } from "next";
import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { getCompaniesAwaitingReview } from "@/db/queries/companies";
import { auditLog, companies } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { CompanyTable } from "@/components/admin/company-table";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Review Queue" };

const thClass =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted whitespace-nowrap";
const tdClass = "px-4 py-2.5 text-sm text-slate-650 whitespace-nowrap";

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
    <Container className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Review queue</h1>
        <p className="mt-1 text-sm text-muted">
          Company submissions awaiting review, oldest first.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-5 py-4">
            <dt className="text-xs font-medium uppercase tracking-wider text-muted">
              {stat.label}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-ink-900">{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <section aria-labelledby="queue-heading" className="space-y-3">
        <h2 id="queue-heading" className="text-lg font-semibold text-ink-900">
          Awaiting review
        </h2>
        <CompanyTable
          companies={queue}
          emptyTitle="No companies waiting for review."
          emptyDescription="New submissions will appear here as founders complete their profiles."
        />
      </section>

      <section aria-labelledby="audit-heading" className="space-y-3">
        <h2 id="audit-heading" className="text-lg font-semibold text-ink-900">
          Recent activity
        </h2>
        {recentAudit.length === 0 ? (
          <p className="text-sm text-muted">No audit activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-paper shadow-card">
            <table className="w-full min-w-160 border-collapse">
              <thead className="border-b border-line bg-canvas">
                <tr>
                  <th scope="col" className={thClass}>
                    Action
                  </th>
                  <th scope="col" className={thClass}>
                    Entity
                  </th>
                  <th scope="col" className={thClass}>
                    Actor
                  </th>
                  <th scope="col" className={thClass}>
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentAudit.map((entry) => (
                  <tr key={entry.id}>
                    <td className={`${tdClass} font-medium text-ink-900`}>{entry.action}</td>
                    <td className={tdClass}>
                      {entry.entityType}{" "}
                      <span className="font-mono text-xs text-faint">
                        {entry.entityId.slice(0, 8)}…
                      </span>
                    </td>
                    <td className={tdClass}>
                      {entry.actorUserId ? (
                        <span className="font-mono text-xs" title={entry.actorUserId}>
                          {entry.actorUserId.slice(0, 12)}…
                        </span>
                      ) : (
                        <span className="text-faint">system</span>
                      )}
                    </td>
                    <td className={tdClass}>{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Container>
  );
}

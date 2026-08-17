import type { Metadata } from "next";
import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  getCompaniesAwaitingReview,
  getRecentlyUpdatedPublishedCompanies,
} from "@/db/queries/companies";
import { auditLog, companies } from "@/db/schema";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { getUsageSummary } from "@/lib/product-events";
import { CompanyTable } from "@/components/admin/company-table";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Review Queue" };

const thClass =
  "px-4 py-2.5 text-left text-xs font-medium text-faint whitespace-nowrap";
const tdClass = "px-4 py-2.5 text-sm text-slate-650 whitespace-nowrap";

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const [queue, statusCounts, recentAudit, recentlyEdited, usage] = await Promise.all([
    getCompaniesAwaitingReview(),
    // One grouped query; totals derived in JS.
    db.select({ status: companies.status, value: count() }).from(companies).groupBy(companies.status),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(20),
    getRecentlyUpdatedPublishedCompanies(15),
    getUsageSummary(7),
  ]);

  const byStatus = new Map(statusCounts.map((r) => [r.status, r.value]));
  const total = statusCounts.reduce((sum, r) => sum + r.value, 0);
  const stats = [
    { label: "Submitted", value: byStatus.get("submitted") ?? 0 },
    { label: "Under review", value: byStatus.get("under_review") ?? 0 },
    { label: "Published", value: byStatus.get("published") ?? 0 },
    { label: "Total companies", value: total },
    { label: "Profile views (7 days)", value: usage.profileViews },
    { label: "Discover queries (7 days)", value: usage.discoverQueries },
  ];

  return (
    <Container className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Review queue</h1>
        <p className="mt-1 text-sm text-muted">
          Company submissions awaiting review, oldest first.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-5 py-4">
            <dt className="text-xs font-medium text-faint">
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

      <section aria-labelledby="recently-edited-heading" className="space-y-3">
        <div>
          <h2 id="recently-edited-heading" className="text-lg font-semibold text-ink-900">
            Recently edited published companies
          </h2>
          <p className="mt-1 text-sm text-muted">
            Live profiles changed by their founders after publication. Edits go live without
            re-review, so spot-check anything unexpected here.
          </p>
        </div>
        {recentlyEdited.length === 0 ? (
          <p className="text-sm text-muted">No published companies have been edited recently.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-paper shadow-card">
            <table className="w-full min-w-160 border-collapse">
              <thead className="border-b border-line bg-canvas">
                <tr>
                  <th scope="col" className={thClass}>Name</th>
                  <th scope="col" className={thClass}>Last edited</th>
                  <th scope="col" className={thClass}>Published</th>
                  <th scope="col" className={`relative ${thClass}`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentlyEdited.map((company) => (
                  <tr key={company.id} className="hover:bg-canvas/60 transition-colors">
                    <td className={`${tdClass} font-medium text-ink-900`}>
                      <Link href={`/admin/companies/${company.id}`} className="hover:underline">
                        {company.name}
                      </Link>
                      {company.isDemo ? (
                        <span className="ml-2 rounded-sm bg-mist px-1.5 py-0.5 text-[10px] font-medium text-muted">
                          Demo
                        </span>
                      ) : null}
                    </td>
                    <td className={tdClass}>{formatDate(company.updatedAt)}</td>
                    <td className={tdClass}>
                      {company.publishedAt ? formatDate(company.publishedAt) : "–"}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <Link
                        href={`/companies/${company.slug}`}
                        className="text-sm font-medium text-ink-900 underline decoration-line-strong underline-offset-4 hover:decoration-faint"
                      >
                        View public profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

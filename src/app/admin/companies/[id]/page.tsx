import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompanyByIdUnscoped,
  getCompanyIntents,
  getCompanyMembers,
  getLatestMetrics,
} from "@/db/queries/companies";
import { requireAdminPage } from "@/components/admin/admin-guard";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { Container } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUSINESS_MODEL_LABELS,
  INTENT_LABELS,
  METRIC_LABELS,
  METRIC_TYPES,
  STAGE_LABELS,
  type CompanyStatus,
} from "@/lib/constants";
import { formatDate, formatMetricValue } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Review Company" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Label/value row for identity + lifecycle definition lists. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-ink-900 break-words">
        {children}
      </dd>
    </div>
  );
}

function TextValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="font-normal text-faint">Not provided</span>;
  return <>{value}</>;
}

export default async function AdminCompanyReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const company = await getCompanyByIdUnscoped(id);
  if (!company) notFound();

  const [members, metricsByCompany, intentsByCompany] = await Promise.all([
    getCompanyMembers(id),
    getLatestMetrics([id]),
    getCompanyIntents([id]),
  ]);
  const metrics = metricsByCompany.get(id);
  const intents = intentsByCompany.get(id) ?? [];

  const providedMetrics = METRIC_TYPES.flatMap((type) => {
    const row = metrics?.get(type);
    return row ? [{ type, row }] : [];
  });

  const storySections = [
    { label: "Problem", value: company.problem },
    { label: "Solution", value: company.solution },
    { label: "Market", value: company.market },
    { label: "Competitive position", value: company.competitivePosition },
    { label: "Business model", value: company.businessModelDescription },
    { label: "Traction", value: company.traction },
    { label: "Roadmap", value: company.roadmap },
    { label: "Full description", value: company.fullDescription },
  ];
  const hasStory = storySections.some((s) => Boolean(s.value));

  return (
    <Container className="space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink-900">{company.name}</h1>
            <StatusBadge status={company.status as CompanyStatus} />
            {company.isDemo ? <Badge tone="neutral">Demo data</Badge> : null}
          </div>
          {company.shortDescription ? (
            <p className="mt-1.5 max-w-2xl text-sm text-muted">{company.shortDescription}</p>
          ) : null}
          <p className="mt-1 font-mono text-xs text-faint">
            {company.slug} · {company.id}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-slate-650 transition-colors hover:text-ink-900"
        >
          ← Back to queue
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------------------------ Profile content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-line">
                <Row label="Website">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  ) : (
                    <TextValue value={null} />
                  )}
                </Row>
                <Row label="Headquarters">
                  <TextValue
                    value={
                      [company.hqCity, company.hqCountry].filter(Boolean).join(", ") || null
                    }
                  />
                </Row>
                <Row label="Industry">
                  <TextValue value={company.industry} />
                </Row>
                <Row label="Subindustry">
                  <TextValue value={company.subindustry} />
                </Row>
                <Row label="Stage">
                  <TextValue value={company.stage ? STAGE_LABELS[company.stage] : null} />
                </Row>
                <Row label="Business model">
                  <TextValue
                    value={
                      company.businessModel ? BUSINESS_MODEL_LABELS[company.businessModel] : null
                    }
                  />
                </Row>
                <Row label="Founded">
                  <TextValue value={company.foundedYear ? String(company.foundedYear) : null} />
                </Row>
                <Row label="Created by">
                  <span className="font-mono text-xs">{company.createdBy}</span>
                </Row>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intents</CardTitle>
            </CardHeader>
            <CardBody>
              {intents.length === 0 ? (
                <p className="text-sm text-faint">No intents declared.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {intents.map((intent) => (
                    <li key={intent}>
                      <Badge tone="accent">{INTENT_LABELS[intent]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
            </CardHeader>
            <CardBody>
              {providedMetrics.length === 0 ? (
                <p className="text-sm text-faint">No metrics provided.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-120 border-collapse">
                    <thead className="border-b border-line">
                      <tr>
                        <th scope="col" className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                          Metric
                        </th>
                        <th scope="col" className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                          Latest value
                        </th>
                        <th scope="col" className="py-2 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                          As of
                        </th>
                        <th scope="col" className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {providedMetrics.map(({ type, row }) => (
                        <tr key={type}>
                          <td className="py-2.5 pr-4 text-sm text-muted whitespace-nowrap">
                            {METRIC_LABELS[type]}
                          </td>
                          <td className="py-2.5 pr-4 text-sm font-semibold text-ink-900 whitespace-nowrap">
                            {formatMetricValue(type, Number(row.value), row.currency)}
                          </td>
                          <td className="py-2.5 pr-4 text-sm text-slate-650 whitespace-nowrap">
                            {formatDate(row.asOf)}
                          </td>
                          <td className="py-2.5 text-sm text-slate-650">
                            {row.source ?? <span className="text-faint">Founder-declared</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Story</CardTitle>
            </CardHeader>
            <CardBody className="space-y-5">
              {!hasStory ? (
                <p className="text-sm text-faint">No story sections provided.</p>
              ) : (
                storySections.map((section) =>
                  section.value ? (
                    <section key={section.label}>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {section.label}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                        {section.value}
                      </p>
                    </section>
                  ) : null,
                )
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardBody>
              {members.length === 0 ? (
                <p className="text-sm text-faint">No team members listed.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {members.map((member) => (
                    <li key={member.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">{member.name}</span>
                        <Badge tone={member.role === "founder" ? "ink" : "neutral"}>
                          {member.role === "founder" ? "Founder" : "Team"}
                        </Badge>
                        {member.title ? (
                          <span className="text-sm text-muted">{member.title}</span>
                        ) : null}
                      </div>
                      {member.bio ? (
                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-slate-650">
                          {member.bio}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* ------------------------------------------------ Review sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review actions</CardTitle>
            </CardHeader>
            <CardBody>
              <ReviewActions companyId={company.id} status={company.status as CompanyStatus} />
            </CardBody>
          </Card>

          {company.reviewNotes ? (
            <Alert tone="warn" title="Review notes on file">
              <p className="whitespace-pre-wrap">{company.reviewNotes}</p>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="divide-y divide-line">
                <Row label="Created">{formatDate(company.createdAt)}</Row>
                <Row label="Last updated">{formatDate(company.updatedAt)}</Row>
                <Row label="Submitted">
                  <TextValue
                    value={company.submittedAt ? formatDate(company.submittedAt) : null}
                  />
                </Row>
                <Row label="Published">
                  <TextValue
                    value={company.publishedAt ? formatDate(company.publishedAt) : null}
                  />
                </Row>
                <Row label="Archived">
                  <TextValue
                    value={company.archivedAt ? formatDate(company.archivedAt) : null}
                  />
                </Row>
                <Row label="Reviewed by">
                  {company.reviewedBy ? (
                    <span className="font-mono text-xs">{company.reviewedBy}</span>
                  ) : (
                    <TextValue value={null} />
                  )}
                </Row>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  );
}

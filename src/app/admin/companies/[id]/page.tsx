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
import { MonoId } from "@/components/admin/mono-id";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { Container } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
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

/** Dense label/value row for identity + lifecycle definition lists. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-4 py-2 sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-ink-900 [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

function TextValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="font-normal text-faint">—</span>;
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
      <div>
        <Link
          href="/admin"
          className="text-sm font-medium text-muted transition-colors hover:text-ink-900"
        >
          ← Back to queue
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{company.name}</h1>
          <StatusBadge status={company.status as CompanyStatus} />
          {company.isDemo ? (
            <span className="rounded-sm border border-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">
              Demo data
            </span>
          ) : null}
        </div>
        {company.shortDescription ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{company.shortDescription}</p>
        ) : null}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
          <span className="font-mono">{company.slug}</span>
          <span aria-hidden="true" className="text-faint">
            ·
          </span>
          <MonoId value={company.id} className="text-faint" />
          {company.submittedAt ? (
            <>
              <span aria-hidden="true" className="text-faint">
                ·
              </span>
              <span>Submitted {formatDate(company.submittedAt)}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ------------------------------------------------ Profile content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-1">
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
                      className="text-accent-700 hover:underline"
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
                  <MonoId value={company.createdBy} chars={12} />
                </Row>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-3">
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
            <CardHeader className="pb-3">
              <CardTitle>Metrics</CardTitle>
            </CardHeader>
            <CardBody>
              {providedMetrics.length === 0 ? (
                <p className="text-sm text-faint">No metrics provided.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-line">
                  <Table className="min-w-120">
                    <THead>
                      <tr>
                        <TH dense>Metric</TH>
                        <TH dense numeric>
                          Latest value
                        </TH>
                        <TH dense numeric>
                          As of
                        </TH>
                        <TH dense>Source</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {providedMetrics.map(({ type, row }) => (
                        <tr key={type}>
                          <TD dense className="whitespace-nowrap">
                            {METRIC_LABELS[type]}
                          </TD>
                          <TD dense numeric className="whitespace-nowrap font-semibold text-ink-900">
                            {formatMetricValue(type, Number(row.value), row.currency)}
                          </TD>
                          <TD dense numeric className="whitespace-nowrap">
                            {formatDate(row.asOf)}
                          </TD>
                          <TD dense className="whitespace-nowrap">
                            {row.source ?? <span className="text-faint">Founder-declared</span>}
                          </TD>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Story</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {!hasStory ? (
                <p className="text-sm text-faint">No story sections provided.</p>
              ) : (
                storySections.map((section) =>
                  section.value ? (
                    <section key={section.label}>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                        {section.label}
                      </h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-650">
                        {section.value}
                      </p>
                    </section>
                  ) : null,
                )
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardBody>
              {members.length === 0 ? (
                <p className="pt-2 text-sm text-faint">No team members listed.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {members.map((member) => (
                    <li key={member.id} className="py-3 last:pb-0">
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
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-650">
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

        {/* Review sidebar — ordered first on mobile so review actions are
            reachable without scrolling past the whole profile. */}
        <div className="order-first min-w-0 space-y-6 lg:order-none">
          <Card>
            <CardHeader className="pb-3">
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
            <CardHeader className="pb-1">
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
                    <MonoId value={company.reviewedBy} chars={12} />
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

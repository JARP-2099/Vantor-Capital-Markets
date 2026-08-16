import Link from "next/link";
import type { ReactNode } from "react";
import { WizardShell } from "@/components/founder/wizard-shell";
import { getMetricRows, requireDraftPage } from "@/components/founder/data";
import { SubmitPanel } from "@/components/founder/submit-panel";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyIntents, getCompanyMembers } from "@/db/queries/companies";
import { submitCompany } from "@/lib/actions/founder-company";
import {
  BUSINESS_MODEL_LABELS,
  INTENT_LABELS,
  METRIC_LABELS,
  STAGE_LABELS,
  type BusinessModel,
  type CompanyStage,
  type MetricType,
} from "@/lib/constants";
import { formatDate, formatMetricValue } from "@/lib/format";

function Value({ children }: { children: ReactNode }) {
  if (children === null || children === undefined || children === "") {
    return <span className="text-sm text-faint">Not provided</span>;
  }
  return <span className="text-sm text-ink-900">{children}</span>;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted sm:pt-0.5">
        {label}
      </dt>
      <dd className="min-w-0 break-words">
        <Value>{children}</Value>
      </dd>
    </div>
  );
}

function SectionCard({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link href={editHref} className="text-sm font-medium text-accent-600 hover:underline">
          Edit
        </Link>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

const STORY_SECTIONS = [
  ["problem", "Problem"],
  ["solution", "Solution"],
  ["market", "Market"],
  ["competitivePosition", "Competitive position"],
  ["businessModelDescription", "Business model"],
  ["traction", "Traction"],
  ["roadmap", "Roadmap"],
  ["fullDescription", "Full description"],
] as const;

export default async function OnboardingReviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireDraftPage(companyId);
  const [intents, metrics, members] = await Promise.all([
    getCompanyIntents([companyId]).then((m) => m.get(companyId) ?? []),
    getMetricRows(companyId),
    getCompanyMembers(companyId),
  ]);

  const base = `/founder/onboarding/${companyId}`;

  return (
    <WizardShell
      companyId={companyId}
      step={6}
      title="Review your profile"
      description="This is everything that will become public if your profile is approved. Check each section, then submit for review."
    >
      <div className="space-y-5">
        <SectionCard title="Identity" editHref={`${base}/identity`}>
          <dl className="divide-y divide-line">
            <SummaryRow label="Name">{company.name}</SummaryRow>
            <SummaryRow label="Website">{company.website}</SummaryRow>
            <SummaryRow label="Headquarters">
              {company.hqCity || company.hqCountry
                ? [company.hqCity, company.hqCountry].filter(Boolean).join(", ")
                : null}
            </SummaryRow>
            <SummaryRow label="Industry">
              {company.industry
                ? [company.industry, company.subindustry].filter(Boolean).join(" · ")
                : null}
            </SummaryRow>
            <SummaryRow label="Founded">{company.foundedYear}</SummaryRow>
            <SummaryRow label="Stage">
              {company.stage ? STAGE_LABELS[company.stage as CompanyStage] : null}
            </SummaryRow>
            <SummaryRow label="Business model">
              {company.businessModel
                ? BUSINESS_MODEL_LABELS[company.businessModel as BusinessModel]
                : null}
            </SummaryRow>
            <SummaryRow label="Short description">{company.shortDescription}</SummaryRow>
          </dl>
        </SectionCard>

        <SectionCard title="Goals" editHref={`${base}/goals`}>
          {intents.length === 0 ? (
            <Value>{null}</Value>
          ) : (
            <div className="flex flex-wrap gap-2">
              {intents.map((i) => (
                <Badge key={i} tone="accent">
                  {INTENT_LABELS[i]}
                </Badge>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Metrics" editHref={`${base}/metrics`}>
          {metrics.length === 0 ? (
            <p className="text-sm text-faint">
              No metrics reported — fine for pre-revenue companies.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-96 text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs font-medium uppercase tracking-wider text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">Metric</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Value</th>
                    <th scope="col" className="py-2 font-medium">As of</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {metrics.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-4 text-ink-900">
                        {METRIC_LABELS[m.metricType as MetricType]}
                      </td>
                      <td className="py-2 pr-4 font-medium text-ink-900">
                        {formatMetricValue(m.metricType as MetricType, Number(m.value), m.currency)}
                      </td>
                      <td className="py-2 text-muted">{formatDate(m.asOf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Story" editHref={`${base}/story`}>
          <dl className="divide-y divide-line">
            {STORY_SECTIONS.map(([field, label]) => (
              <SummaryRow key={field} label={label}>
                {company[field] ? (
                  <span className="whitespace-pre-wrap">{company[field]}</span>
                ) : null}
              </SummaryRow>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Team" editHref={`${base}/team`}>
          {members.length === 0 ? (
            <Value>{null}</Value>
          ) : (
            <ul className="divide-y divide-line">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline gap-x-2 py-2">
                  <span className="text-sm font-medium text-ink-900">{m.name}</span>
                  {m.title ? <span className="text-sm text-muted">{m.title}</span> : null}
                  <Badge tone={m.role === "founder" ? "ink" : "neutral"} className="ml-auto">
                    {m.role === "founder" ? "Founder" : "Team"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <Card>
          <CardHeader>
            <CardTitle>Submit for review</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Alert tone="info">
              Your profile stays private until the Vantor team approves it. Signals like
              &ldquo;seeking investment&rdquo; describe openness to conversations — they are not an
              offering of securities.
            </Alert>
            <SubmitPanel action={submitCompany.bind(null, companyId)} />
          </CardBody>
        </Card>
      </div>
    </WizardShell>
  );
}

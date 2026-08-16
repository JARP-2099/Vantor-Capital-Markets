import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { IntentBadges } from "@/components/marketplace/intent-badges";
import {
  metricNumber,
  pickGrowthMetric,
  pickRevenueMetric,
  pickSimpleMetric,
} from "@/components/marketplace/metrics";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MetricStat } from "@/components/ui/metric-stat";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TableWrap } from "@/components/ui/table";
import { ValuationSection } from "@/components/marketplace/valuation-section";
import { VerificationSection } from "@/components/marketplace/verification-section";
import {
  getCompanyIntents,
  getCompanyMembers,
  getCompanyMetricHistory,
  getLatestMetrics,
  type CompanyMetricRow,
} from "@/db/queries/companies";
import {
  getLatestCompletedValuationRun,
  getValuationComponents,
  getValuationHistory,
} from "@/db/queries/valuations";
import { getPublicVerificationSummary } from "@/db/queries/verifications";
import { features } from "@/config/features";
import { METRIC_LABELS, METRIC_TYPES, STAGE_LABELS } from "@/lib/constants";
import { formatDate, formatMetricValue } from "@/lib/format";

import { getCompany } from "./company-lookup";

/**
 * Public company profile. The only data source is the published-only query
 * layer: an unpublished or nonexistent slug both 404 (status enforced in
 * this segment's layout, before streaming), so the two cases are
 * indistinguishable from outside (privacy boundary).
 */

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  // Existence/404 is handled by this segment's layout (pre-stream, real 404
  // status). Throwing notFound() from generateMetadata instead would race
  // the layout and downgrade the response to a streamed 200.
  if (!company) return {};
  return {
    title: company.name,
    description: company.shortDescription ?? undefined,
  };
}

function websiteInfo(website: string): { href: string; label: string } {
  const href = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  try {
    return { href, label: new URL(href).hostname.replace(/^www\./, "") };
  } catch {
    return { href, label: website };
  }
}

function periodLabel(row: CompanyMetricRow): string | null {
  if (row.periodStart && row.periodEnd) {
    return `${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`;
  }
  if (row.periodStart) return `From ${formatDate(row.periodStart)}`;
  if (row.periodEnd) return `Through ${formatDate(row.periodEnd)}`;
  return null;
}

function StoryBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{heading}</h3>
      <p className="mt-1.5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-650">
        {body}
      </p>
    </div>
  );
}

export default async function CompanyProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const [metricsByCompany, intentsByCompany, members, metricHistory, valuationRun, verificationSummary] =
    await Promise.all([
      getLatestMetrics([company.id]),
      getCompanyIntents([company.id]),
      getCompanyMembers(company.id),
      getCompanyMetricHistory(company.id),
      features.valuationsEnabled && company.showPublicValuation
        ? getLatestCompletedValuationRun(company.id)
        : Promise.resolve(null),
      features.verificationEnabled
        ? getPublicVerificationSummary(company.id)
        : Promise.resolve(null),
    ]);
  const [valuationComponents, valuationHistory] = valuationRun
    ? await Promise.all([getValuationComponents(valuationRun.id), getValuationHistory(company.id)])
    : [[], []];
  const byType = metricsByCompany.get(company.id);
  const intents = intentsByCompany.get(company.id) ?? [];

  /* ------------------------------ Header data ----------------------------- */
  const industryLine = [company.industry, company.subindustry].filter(Boolean).join(" · ");
  const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
  const hq = [company.hqCity, company.hqCountry].filter(Boolean).join(", ");
  const website = company.website ? websiteInfo(company.website) : null;
  const metaLine = [
    industryLine || null,
    hq || null,
    company.foundedYear ? `Founded ${company.foundedYear}` : null,
  ].filter(Boolean);

  /* ---------------------------- Key metric tiles --------------------------- */
  const revenue = pickRevenueMetric(byType);
  const growth = pickGrowthMetric(byType);
  const customers = pickSimpleMetric(byType, "customers");
  const employees = pickSimpleMetric(byType, "employees");
  const capitalRaised = pickSimpleMetric(byType, "capital_raised_total");

  const tiles: {
    label: string;
    value: string;
    tone?: "default" | "positive" | "negative";
    size?: "md" | "lg";
  }[] = [];
  if (revenue) tiles.push({ label: revenue.label, value: revenue.value, size: "lg" });
  if (growth) {
    tiles.push({ label: "Growth (YoY)", value: growth.value, tone: growth.tone, size: "lg" });
  }
  if (customers) tiles.push({ label: customers.label, value: customers.value });
  if (employees) tiles.push({ label: employees.label, value: employees.value });
  if (capitalRaised) tiles.push({ label: capitalRaised.label, value: capitalRaised.value });
  if (company.foundedYear) tiles.push({ label: "Founded", value: String(company.foundedYear) });

  /* ------------------------------- Sections ------------------------------- */
  const storyBlocks: { heading: string; body: string }[] = [
    { heading: "Problem", body: company.problem },
    { heading: "Solution", body: company.solution },
    { heading: "Market", body: company.market },
    { heading: "Competitive Position", body: company.competitivePosition },
    { heading: "Business Model", body: company.businessModelDescription },
    { heading: "Traction", body: company.traction },
    { heading: "Roadmap", body: company.roadmap },
  ].filter((entry): entry is { heading: string; body: string } => Boolean(entry.body));

  const hasOverview = Boolean(company.fullDescription) || storyBlocks.length > 0;

  // Full history grouped by metric type in catalog order; rows within each
  // group arrive newest-first from the query layer.
  const historyByType = new Map<CompanyMetricRow["metricType"], CompanyMetricRow[]>();
  for (const row of metricHistory) {
    const group = historyByType.get(row.metricType) ?? [];
    group.push(row);
    historyByType.set(row.metricType, group);
  }
  const metricRows = METRIC_TYPES.flatMap((type) => historyByType.get(type) ?? []);
  const showPeriodColumn = metricRows.some((row) => row.periodStart || row.periodEnd);

  const hasTeam = members.length > 0;

  const showVerification = Boolean(
    verificationSummary && verificationSummary.submittedCount > 0,
  );
  const navItems = [
    ...(hasOverview ? [{ href: "#overview", label: "Overview" }] : []),
    { href: "#financials", label: "Financials" },
    ...(valuationRun ? [{ href: "#valuation", label: "Valuation" }] : []),
    ...(showVerification ? [{ href: "#verification", label: "Verification" }] : []),
    ...(hasTeam ? [{ href: "#team", label: "Team" }] : []),
  ];

  return (
    <>
      {/* ------------------------------ Header ------------------------------ */}
      <div className="border-b border-line bg-paper">
        <Container className="py-10 sm:py-12">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {company.name}
            </h1>

            {(stageLabel || metaLine.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {stageLabel ? <Badge tone="ink">{stageLabel}</Badge> : null}
                {metaLine.length > 0 ? (
                  <p className="text-sm text-muted">{metaLine.join(" · ")}</p>
                ) : null}
              </div>
            )}

            {company.shortDescription ? (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-650">
                {company.shortDescription}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <IntentBadges intents={intents} />
              {website ? (
                <a
                  href={website.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent-700 underline-offset-2 hover:underline"
                >
                  {website.label}
                  <span aria-hidden="true">&#8599;</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </div>
          </header>

          {/* --------------------------- Key metrics --------------------------- */}
          {tiles.length > 0 ? (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="sr-only">Key metrics</h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
                {tiles.map((tile) => (
                  <MetricStat
                    key={tile.label}
                    label={tile.label}
                    value={tile.value}
                    tone={tile.tone}
                    size={tile.size}
                    className="tabular-nums"
                  />
                ))}
              </dl>
            </div>
          ) : null}
        </Container>
      </div>

      {/* ---------------------------- Section nav ---------------------------- */}
      <nav
        aria-label="Profile sections"
        className="sticky top-16 z-30 border-b border-line bg-canvas/95 backdrop-blur"
      >
        <Container>
          <div className="flex gap-6 overflow-x-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-medium text-muted transition-colors hover:border-line-strong hover:text-ink-900"
              >
                {item.label}
              </a>
            ))}
          </div>
        </Container>
      </nav>

      <Container className="pb-16">
        {/* ----------------------------- Overview ----------------------------- */}
        {hasOverview ? (
          <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-32 pt-10">
            <h2 id="overview-heading" className="text-lg font-semibold tracking-tight text-ink-900">
              Overview
            </h2>
            <div className="mt-5 space-y-7">
              {company.fullDescription ? (
                <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-650">
                  {company.fullDescription}
                </p>
              ) : null}
              {storyBlocks.map((block) => (
                <StoryBlock key={block.heading} heading={block.heading} body={block.body} />
              ))}
            </div>
          </section>
        ) : null}

        {/* ---------------------------- Financials ---------------------------- */}
        <section id="financials" aria-labelledby="financials-heading" className="scroll-mt-32 pt-10">
          <h2 id="financials-heading" className="text-lg font-semibold tracking-tight text-ink-900">
            Financials
          </h2>
          <p className="mt-1 text-xs text-muted">
            Self-reported by the company. All reported values, newest first.
          </p>
          {metricRows.length > 0 ? (
            <TableWrap className="mt-5">
              <Table className="min-w-[30rem]">
                <THead>
                  <tr>
                    <TH>Metric</TH>
                    <TH numeric>Value</TH>
                    <TH>As of</TH>
                    {showPeriodColumn ? <TH>Period</TH> : null}
                  </tr>
                </THead>
                <TBody>
                  {metricRows.map((row) => {
                    const n = metricNumber(row);
                    return (
                      <tr key={row.id}>
                        <th
                          scope="row"
                          className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-ink-900"
                        >
                          {METRIC_LABELS[row.metricType]}
                        </th>
                        <TD numeric className="font-semibold text-ink-900">
                          {n === null
                            ? "—"
                            : formatMetricValue(row.metricType, n, row.currency)}
                        </TD>
                        <TD className="whitespace-nowrap text-muted tabular-nums">
                          {formatDate(row.asOf)}
                        </TD>
                        {showPeriodColumn ? (
                          <TD className="whitespace-nowrap text-muted tabular-nums">
                            {periodLabel(row) ?? "—"}
                          </TD>
                        ) : null}
                      </tr>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No published metrics"
                description="This company has not published financial metrics."
              />
            </div>
          )}
        </section>

        {/* ----------------------------- Valuation ----------------------------- */}
        {valuationRun ? (
          <section id="valuation" aria-labelledby="valuation-heading" className="scroll-mt-32 pt-10">
            <h2 id="valuation-heading" className="text-lg font-semibold tracking-tight text-ink-900">
              Estimated Private Market Valuation
            </h2>
            <ValuationSection
              run={valuationRun}
              components={valuationComponents}
              history={valuationHistory}
            />
          </section>
        ) : null}

        {/* ---------------------------- Verification --------------------------- */}
        {showVerification && verificationSummary ? (
          <section
            id="verification"
            aria-labelledby="verification-heading"
            className="scroll-mt-32 pt-10"
          >
            <h2
              id="verification-heading"
              className="text-lg font-semibold tracking-tight text-ink-900"
            >
              Data Verification
            </h2>
            <VerificationSection summary={verificationSummary} />
          </section>
        ) : null}

        {/* ------------------------------- Team ------------------------------- */}
        {hasTeam ? (
          <section id="team" aria-labelledby="team-heading" className="scroll-mt-32 pt-10">
            <h2 id="team-heading" className="text-lg font-semibold tracking-tight text-ink-900">
              Team
            </h2>
            <Card className="mt-5 overflow-hidden">
              <ul className="divide-y divide-line">
                {members.map((member) => (
                  <li key={member.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <h3 className="text-sm font-semibold text-ink-900">{member.name}</h3>
                      {member.title ? (
                        <p className="text-sm text-muted">{member.title}</p>
                      ) : null}
                      {member.role === "founder" ? (
                        <Badge dot tone="accent">
                          Founder
                        </Badge>
                      ) : null}
                    </div>
                    {member.bio ? (
                      <p className="mt-1.5 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-650">
                        {member.bio}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}
      </Container>
    </>
  );
}

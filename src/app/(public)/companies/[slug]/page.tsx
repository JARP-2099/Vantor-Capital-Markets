import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { CompanyMark } from "@/components/marketplace/company-mark";
import { IntentBadges } from "@/components/marketplace/intent-badges";
import {
  metricNumber,
  pickGrowthMetric,
  pickRevenueMetric,
  pickSimpleMetric,
} from "@/components/marketplace/metrics";
import { Badge } from "@/components/ui/badge";
import { TrendLine } from "@/components/ui/charts";
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
import { formatCompactCurrency, formatDate, formatMetricValue } from "@/lib/format";

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

  // Headline band — the research-profile answer to "who / stage / valuation /
  // traction / verification" (V3 §21). Estimated valuation and verification
  // lead when visible; the rest fills from reported metrics.
  const valuationHeadline = (() => {
    if (!valuationRun) return null;
    const low = valuationRun.valuationLow !== null ? Number(valuationRun.valuationLow) : NaN;
    const high = valuationRun.valuationHigh !== null ? Number(valuationRun.valuationHigh) : NaN;
    if (Number.isFinite(low) && Number.isFinite(high)) {
      return `${formatCompactCurrency(low, valuationRun.currency)} – ${formatCompactCurrency(high, valuationRun.currency)}`;
    }
    const mid = valuationRun.valuationMid !== null ? Number(valuationRun.valuationMid) : NaN;
    return Number.isFinite(mid) ? formatCompactCurrency(mid, valuationRun.currency) : null;
  })();

  const tiles: {
    label: string;
    value: string;
    tone?: "default" | "positive" | "negative";
  }[] = [];
  if (valuationHeadline) tiles.push({ label: "Est. Valuation", value: valuationHeadline });
  if (revenue) tiles.push({ label: revenue.label, value: revenue.value });
  if (growth) tiles.push({ label: "Growth (YoY)", value: growth.value, tone: growth.tone });
  if (
    verificationSummary &&
    verificationSummary.submittedCount > 0 &&
    verificationSummary.verifiedPct !== null
  ) {
    tiles.push({ label: "Data Verification", value: `${verificationSummary.verifiedPct}%` });
  }
  if (capitalRaised) tiles.push({ label: capitalRaised.label, value: capitalRaised.value });
  if (customers && tiles.length < 6) tiles.push({ label: customers.label, value: customers.value });
  if (employees && tiles.length < 6) tiles.push({ label: employees.label, value: employees.value });
  if (company.foundedYear && tiles.length < 6)
    tiles.push({ label: "Founded", value: String(company.foundedYear) });

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

  // Compact trend for the primary revenue metric — drawn only when the
  // already-fetched history holds ≥2 parseable points of one monetary type.
  let trend: { type: CompanyMetricRow["metricType"]; rows: CompanyMetricRow[] } | null = null;
  for (const type of ["arr", "revenue_annual", "mrr"] as const) {
    const rows = (historyByType.get(type) ?? []).filter((row) => metricNumber(row) !== null);
    if (rows.length >= 2) {
      trend = { type, rows: [...rows].reverse() }; // newest-first → oldest-first
      break;
    }
  }
  const trendValues = trend ? trend.rows.map((row) => metricNumber(row) as number) : [];
  const trendFirst = trend ? trend.rows[0] : null;
  const trendLast = trend ? trend.rows[trend.rows.length - 1] : null;

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
        <Container wide className="py-10 sm:py-12">
          <header className="flex items-start gap-5">
            <CompanyMark name={company.name} size="lg" className="mt-1 hidden sm:flex" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                {company.name}
              </h1>
              {(stageLabel || metaLine.length > 0) && (
                <p className="mt-1.5 text-sm text-slate-650">
                  {[stageLabel, ...metaLine].filter(Boolean).join(" · ")}
                </p>
              )}
              {company.shortDescription ? (
                <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-650">
                  {company.shortDescription}
                </p>
              ) : null}
              <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2">
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
            </div>
          </header>

          {/* ------------------------- Headline metrics ------------------------- */}
          {tiles.length > 0 ? (
            <div className="mt-7 border-t border-line pt-6">
              <h2 className="sr-only">Key metrics</h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:flex sm:flex-wrap sm:gap-x-12">
                {tiles.map((tile) => (
                  <MetricStat
                    key={tile.label}
                    label={tile.label}
                    value={tile.value}
                    tone={tile.tone}
                    size="lg"
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
        className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur"
      >
        <Container wide>
          <div className="flex gap-6 overflow-x-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-medium text-muted transition-colors hover:border-accent-600 hover:text-ink-900 focus-visible:border-accent-600 focus-visible:text-ink-900"
              >
                {item.label}
              </a>
            ))}
          </div>
        </Container>
      </nav>

      <Container wide className="pb-16">
        {/* ----------------------------- Overview ----------------------------- */}
        {hasOverview ? (
          <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-32 pt-10">
            <h2 id="overview-heading" className="text-lg font-bold tracking-tight text-ink-900">
              Overview
            </h2>
            <div className="mt-5 space-y-7">
              {company.fullDescription ? (
                <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-slate-650">
                  {company.fullDescription}
                </p>
              ) : null}
              {/* Two columns on wide screens so the overview doesn't leave a
                  dead right half (V3 §6 density). */}
              <div className="grid gap-x-16 gap-y-7 lg:grid-cols-2">
                {storyBlocks.map((block) => (
                  <StoryBlock key={block.heading} heading={block.heading} body={block.body} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ---------------------------- Financials ---------------------------- */}
        <section id="financials" aria-labelledby="financials-heading" className="scroll-mt-32 pt-10">
          <h2 id="financials-heading" className="text-lg font-bold tracking-tight text-ink-900">
            Financials
          </h2>
          <p className="mt-1 text-xs text-muted">
            Self-reported by the company. All reported values, newest first.
          </p>
          {metricRows.length > 0 ? (
            <TableWrap className="mt-5">
              {trend && trendFirst && trendLast ? (
                <div className="border-b border-line px-4 py-3.5 sm:px-5">
                  <div className="grid items-center gap-x-8 gap-y-2 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {METRIC_LABELS[trend.type]}
                        <span className="ml-2 font-normal text-muted tabular-nums">
                          {formatMetricValue(trend.type, trendValues[0], trendFirst.currency)} →{" "}
                          <span className="font-semibold text-ink-900">
                            {formatMetricValue(
                              trend.type,
                              trendValues[trendValues.length - 1],
                              trendLast.currency,
                            )}
                          </span>
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted tabular-nums">
                        {formatDate(trendFirst.asOf)} – {formatDate(trendLast.asOf)}
                      </p>
                    </div>
                    <TrendLine
                      values={trendValues}
                      label={`${METRIC_LABELS[trend.type]} moved from ${formatMetricValue(trend.type, trendValues[0], trendFirst.currency)} on ${formatDate(trendFirst.asOf)} to ${formatMetricValue(trend.type, trendValues[trendValues.length - 1], trendLast.currency)} on ${formatDate(trendLast.asOf)}, across ${trendValues.length} reported values.`}
                      height={44}
                      className="sm:max-w-md sm:justify-self-end"
                    />
                  </div>
                </div>
              ) : null}
              <Table className="min-w-[26rem]">
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
            <h2 id="valuation-heading" className="text-lg font-bold tracking-tight text-ink-900">
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
              className="text-lg font-bold tracking-tight text-ink-900"
            >
              Data Verification
            </h2>
            <VerificationSection summary={verificationSummary} />
          </section>
        ) : null}

        {/* ------------------------------- Team ------------------------------- */}
        {hasTeam ? (
          <section id="team" aria-labelledby="team-heading" className="scroll-mt-32 pt-10">
            <h2 id="team-heading" className="text-lg font-bold tracking-tight text-ink-900">
              Team
            </h2>
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {members.map((member) => (
                <li key={member.id} className="py-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <h3 className="text-sm font-semibold text-ink-900">{member.name}</h3>
                    {member.title ? <p className="text-sm text-muted">{member.title}</p> : null}
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
          </section>
        ) : null}
      </Container>
    </>
  );
}

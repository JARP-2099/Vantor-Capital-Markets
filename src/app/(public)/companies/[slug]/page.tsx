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
import {
  getCompanyIntents,
  getCompanyMembers,
  getCompanyMetricHistory,
  getLatestMetrics,
  type CompanyMetricRow,
} from "@/db/queries/companies";
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
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{heading}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-650">{body}</p>
    </div>
  );
}

export default async function CompanyProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const [metricsByCompany, intentsByCompany, members, metricHistory] = await Promise.all([
    getLatestMetrics([company.id]),
    getCompanyIntents([company.id]),
    getCompanyMembers(company.id),
    getCompanyMetricHistory(company.id),
  ]);
  const byType = metricsByCompany.get(company.id);
  const intents = intentsByCompany.get(company.id) ?? [];

  /* ------------------------------ Header data ----------------------------- */
  const industryLine = [company.industry, company.subindustry].filter(Boolean).join(" • ");
  const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
  const hq = [company.hqCity, company.hqCountry].filter(Boolean).join(", ");
  const website = company.website ? websiteInfo(company.website) : null;

  /* ---------------------------- Key metric tiles --------------------------- */
  const revenue = pickRevenueMetric(byType);
  const growth = pickGrowthMetric(byType);
  const customers = pickSimpleMetric(byType, "customers");
  const employees = pickSimpleMetric(byType, "employees");
  const capitalRaised = pickSimpleMetric(byType, "capital_raised_total");

  const tiles: { label: string; value: string; tone?: "default" | "positive" | "negative" }[] = [];
  if (revenue) tiles.push({ label: revenue.label, value: revenue.value });
  if (growth) {
    tiles.push({ label: METRIC_LABELS.revenue_growth_yoy, value: growth.value, tone: growth.tone });
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

  const navItems = [
    ...(hasOverview ? [{ href: "#overview", label: "Overview" }] : []),
    { href: "#financials", label: "Financials" },
    ...(hasTeam ? [{ href: "#team", label: "Team" }] : []),
  ];

  return (
    <>
      {/* ------------------------------ Header ------------------------------ */}
      <div className="border-b border-line bg-paper">
        <Container className="py-10 sm:py-12">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              {company.name}
            </h1>
            {industryLine ? <p className="mt-1 text-sm text-muted">{industryLine}</p> : null}

            {(stageLabel || hq || company.foundedYear) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {stageLabel ? <Badge tone="ink">{stageLabel}</Badge> : null}
                {hq ? <Badge>{hq}</Badge> : null}
                {company.foundedYear ? <Badge>Founded {company.foundedYear}</Badge> : null}
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
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
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
            <Card className="mt-8 p-5">
              <h2 className="sr-only">Key metrics</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
                {tiles.map((tile) => (
                  <MetricStat
                    key={tile.label}
                    label={tile.label}
                    value={tile.value}
                    tone={tile.tone}
                  />
                ))}
              </dl>
            </Card>
          ) : null}
        </Container>
      </div>

      {/* ---------------------------- Section nav ---------------------------- */}
      <nav
        aria-label="Profile sections"
        className="sticky top-16 z-30 border-b border-line bg-canvas/95 backdrop-blur"
      >
        <Container>
          <div className="flex gap-6 overflow-x-auto py-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap text-sm font-medium text-slate-650 transition-colors hover:text-ink-900"
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
            <h2 id="overview-heading" className="text-lg font-semibold text-ink-900">
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
          <h2 id="financials-heading" className="text-lg font-semibold text-ink-900">
            Financials
          </h2>
          <p className="mt-1 text-xs text-faint">
            Self-reported by the company. All reported values, newest first.
          </p>
          {metricRows.length > 0 ? (
            <Card className="mt-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                      <th scope="col" className="px-5 py-3 font-medium">
                        Metric
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-medium">
                        Value
                      </th>
                      <th scope="col" className="px-5 py-3 font-medium">
                        As of
                      </th>
                      {showPeriodColumn ? (
                        <th scope="col" className="px-5 py-3 font-medium">
                          Period
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {metricRows.map((row) => {
                      const n = metricNumber(row);
                      return (
                        <tr key={row.id}>
                          <th
                            scope="row"
                            className="px-5 py-3 text-left font-medium text-ink-900"
                          >
                            {METRIC_LABELS[row.metricType]}
                          </th>
                          <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">
                            {n === null
                              ? "—"
                              : formatMetricValue(row.metricType, n, row.currency)}
                          </td>
                          <td className="px-5 py-3 text-muted tabular-nums">
                            {formatDate(row.asOf)}
                          </td>
                          {showPeriodColumn ? (
                            <td className="px-5 py-3 text-muted tabular-nums">
                              {periodLabel(row) ?? "—"}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-line bg-paper px-6 py-10 text-center">
              <p className="text-sm text-muted">
                This company has not published financial metrics.
              </p>
            </div>
          )}
        </section>

        {/* ------------------------------- Team ------------------------------- */}
        {hasTeam ? (
          <section id="team" aria-labelledby="team-heading" className="scroll-mt-32 pt-10">
            <h2 id="team-heading" className="text-lg font-semibold text-ink-900">
              Team
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {members.map((member) => (
                <li key={member.id}>
                  <Card className="h-full p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink-900">{member.name}</h3>
                      {member.role === "founder" ? <Badge tone="accent">Founder</Badge> : null}
                    </div>
                    {member.title ? <p className="mt-0.5 text-sm text-muted">{member.title}</p> : null}
                    {member.bio ? (
                      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-650">
                        {member.bio}
                      </p>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </>
  );
}

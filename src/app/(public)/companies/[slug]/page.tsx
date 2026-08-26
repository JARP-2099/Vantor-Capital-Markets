import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordProductEvent } from "@/lib/product-events";
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
import { ValuationSection } from "@/components/marketplace/valuation-section";
import { VerificationSection } from "@/components/marketplace/verification-section";
import { SignInToSaveLink, WatchButton } from "@/components/marketplace/watch-button";
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
import { isCompanyWatched } from "@/db/queries/watchlists";
import { features } from "@/config/features";
import { getSessionUser } from "@/lib/authz";
import { METRIC_LABELS, METRIC_TYPES, STAGE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
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
    return `${formatDate(row.periodStart)} to ${formatDate(row.periodEnd)}`;
  }
  if (row.periodStart) return `From ${formatDate(row.periodStart)}`;
  if (row.periodEnd) return `Through ${formatDate(row.periodEnd)}`;
  return null;
}

function StoryBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{heading}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-650">{body}</p>
    </div>
  );
}

export default async function CompanyProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const sessionUser = features.watchlistsEnabled ? await getSessionUser() : null;

  const [metricsByCompany, intentsByCompany, members, metricHistory, valuationRun, verificationSummary, watched] =
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
      sessionUser ? isCompanyWatched(sessionUser.id, company.id) : Promise.resolve(false),
    ]);
  const [valuationComponents, valuationHistory] = valuationRun
    ? await Promise.all([getValuationComponents(valuationRun.id), getValuationHistory(company.id)])
    : [[], []];

  // Beta usage signal, written after the response so it can never slow or
  // break the page. The booleans record whether valuation/verification
  // information was part of this view (nothing about their content).
  after(() =>
    recordProductEvent({
      event: "company.viewed",
      userId: sessionUser?.id ?? null,
      entityId: company.id,
      metadata: {
        demo: company.isDemo,
        valuationShown: Boolean(valuationRun),
        verificationShown: Boolean(verificationSummary && verificationSummary.submittedCount > 0),
      },
    }),
  );
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

  /* --------------------- Financial information band --------------------- */
  // Estimated valuation range for the headline band (public gate applied at
  // fetch time above); "low to high" per copy rules, midpoint as fallback.
  const vLow = valuationRun ? Number(valuationRun.valuationLow) : NaN;
  const vHigh = valuationRun ? Number(valuationRun.valuationHigh) : NaN;
  const vMid = valuationRun ? Number(valuationRun.valuationMid) : NaN;
  const valuationRange = valuationRun
    ? Number.isFinite(vLow) && Number.isFinite(vHigh)
      ? `${formatCompactCurrency(vLow, valuationRun.currency)} to ${formatCompactCurrency(vHigh, valuationRun.currency)}`
      : Number.isFinite(vMid)
        ? formatCompactCurrency(vMid, valuationRun.currency)
        : null
    : null;

  type BandEntry = { label: string; value: string; tone?: "brand" | "positive" | "negative" };
  const bandEntries: BandEntry[] = [];
  if (valuationRange) {
    bandEntries.push({ label: "Estimated valuation", value: valuationRange, tone: "brand" });
  }
  if (revenue) bandEntries.push({ label: revenue.label, value: revenue.value });
  if (growth) {
    bandEntries.push({
      label: METRIC_LABELS.revenue_growth_yoy,
      value: growth.value,
      tone: growth.tone === "default" ? undefined : growth.tone,
    });
  }
  if (capitalRaised) bandEntries.push({ label: "Raised", value: capitalRaised.value });
  if (verificationSummary?.verifiedPct !== null && verificationSummary !== null) {
    bandEntries.push({ label: "Verification", value: `${verificationSummary.verifiedPct}%` });
  }
  if (customers) bandEntries.push({ label: customers.label, value: customers.value });
  if (employees) bandEntries.push({ label: employees.label, value: employees.value });
  if (company.foundedYear) {
    bandEntries.push({ label: "Founded", value: String(company.foundedYear) });
  }

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
      <div className="border-b border-line">
        <Container className="py-10 sm:py-12">
          <header>
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  {company.name}
                </h1>
                {industryLine ? <p className="mt-1 text-sm text-muted">{industryLine}</p> : null}
              </div>
              {features.watchlistsEnabled ? (
                <div className="shrink-0 sm:pt-1">
                  {sessionUser ? (
                    <WatchButton
                      companyId={company.id}
                      companyName={company.name}
                      saved={watched}
                      variant="labeled"
                    />
                  ) : (
                    <SignInToSaveLink next={`/companies/${company.slug}`} variant="labeled" />
                  )}
                </div>
              ) : null}
            </div>

            {(stageLabel || hq || company.foundedYear || company.isDemo) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {company.isDemo ? (
                  <Badge
                    tone="warn"
                    title="Fictional demonstration company created by Vantor for testing. Not a real business."
                  >
                    Demo company
                  </Badge>
                ) : null}
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
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-650 underline decoration-line-strong underline-offset-4 hover:text-ink-900"
                >
                  {website.label}
                  <span aria-hidden="true">&#8599;</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : null}
            </div>
          </header>

          {/* --------------------- Financial information band --------------------- */}
          {bandEntries.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-lg border border-line bg-deep">
              <h2 className="sr-only">Key metrics</h2>
              <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 lg:flex lg:flex-wrap lg:divide-x">
                {bandEntries.map((entry) => (
                  <div key={entry.label} className="min-w-0 px-5 py-4 lg:flex-1">
                    <dt className="text-[11px] font-medium text-faint">
                      {entry.label}
                    </dt>
                    <dd
                      data-metric-value
                      className={cn(
                        "mt-1 truncate text-lg font-bold tracking-tight",
                        entry.tone === "brand" && "text-brand-soft",
                        entry.tone === "positive" && "text-positive-700",
                        entry.tone === "negative" && "text-negative-700",
                        !entry.tone && "text-ink-900",
                      )}
                    >
                      {entry.value}
                    </dd>
                  </div>
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
                    <tr className="border-b border-line text-left text-xs font-medium text-faint">
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
                              ? "–"
                              : formatMetricValue(row.metricType, n, row.currency)}
                          </td>
                          <td className="px-5 py-3 text-muted tabular-nums">
                            {formatDate(row.asOf)}
                          </td>
                          {showPeriodColumn ? (
                            <td className="px-5 py-3 text-muted tabular-nums">
                              {periodLabel(row) ?? "–"}
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

        {/* ----------------------------- Valuation ----------------------------- */}
        {valuationRun ? (
          <section id="valuation" aria-labelledby="valuation-heading" className="scroll-mt-32 pt-10">
            <h2 id="valuation-heading" className="text-lg font-semibold text-ink-900">
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
            <h2 id="verification-heading" className="text-lg font-semibold text-ink-900">
              Data Verification
            </h2>
            <VerificationSection summary={verificationSummary} />
          </section>
        ) : null}

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
                      {member.role === "founder" ? <Badge tone="neutral">Founder</Badge> : null}
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

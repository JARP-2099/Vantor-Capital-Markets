import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { CompanyTable, type CompanyListItem } from "@/components/marketplace/company-table";
import { FilterBar, type MarketplaceFilterValues } from "@/components/marketplace/filter-bar";
import { Pagination } from "@/components/marketplace/pagination";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCompanyIntents,
  getLatestMetrics,
  getMarketplaceFilterOptions,
  getPublishedCompanies,
  type MarketplaceFilters,
} from "@/db/queries/companies";
import { getLatestCompletedValuationRuns } from "@/db/queries/valuations";
import { getPublicVerificationPcts } from "@/db/queries/verifications";
import { features } from "@/config/features";
import {
  COMPANY_STAGES,
  PUBLIC_INTENT_BADGES,
  type CompanyIntent,
  type CompanyStage,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Discover Private Companies",
  description:
    "Browse standardized profiles of private companies on Vantor: story, metrics, and team.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** First value of a possibly-repeated query param, trimmed; undefined when empty. */
function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function isCompanyStage(value: string): value is CompanyStage {
  return (COMPANY_STAGES as readonly string[]).includes(value);
}

/** Only publicly badged intents are filterable; anything else is ignored. */
function isPublicIntent(value: string): value is CompanyIntent {
  return value in PUBLIC_INTENT_BADGES;
}

export default async function CompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const q = first(sp.q);
  const industry = first(sp.industry);
  const country = first(sp.country);
  const stageRaw = first(sp.stage);
  const stage = stageRaw && isCompanyStage(stageRaw) ? stageRaw : undefined;
  const intentRaw = first(sp.intent);
  const intent = intentRaw && isPublicIntent(intentRaw) ? intentRaw : undefined;
  const pageRaw = Number(first(sp.page));
  const requestedPage = Number.isInteger(pageRaw) && pageRaw > 1 ? pageRaw : 1;

  const filters: MarketplaceFilters = { q, industry, stage, country, intent, page: requestedPage };
  const activeCount = [q, industry, stage, country, intent].filter(Boolean).length;

  const [{ companies, total, page, pageSize }, filterOptions] = await Promise.all([
    getPublishedCompanies(filters),
    getMarketplaceFilterOptions(),
  ]);

  // Batched lookups for everything on this page — no per-row queries.
  // Valuations are only fetched for companies that opted into public display.
  const companyIds = companies.map((c) => c.id);
  const valuationEligibleIds = features.valuationsEnabled
    ? companies.filter((c) => c.showPublicValuation).map((c) => c.id)
    : [];
  const [metricsByCompany, intentsByCompany, valuationsByCompany, verificationPcts] =
    await Promise.all([
      getLatestMetrics(companyIds),
      getCompanyIntents(companyIds),
      getLatestCompletedValuationRuns(valuationEligibleIds),
      features.verificationEnabled
        ? getPublicVerificationPcts(companyIds)
        : Promise.resolve(new Map<string, number>()),
    ]);

  const items: CompanyListItem[] = companies.map((company) => ({
    company,
    metrics: metricsByCompany.get(company.id),
    intents: intentsByCompany.get(company.id) ?? [],
    valuation: valuationsByCompany.get(company.id) ?? null,
    verificationPct: verificationPcts.get(company.id) ?? null,
  }));

  const filterValues: MarketplaceFilterValues = { q, industry, stage, country, intent };

  /** Href for a page number, preserving every active filter. */
  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (industry) params.set("industry", industry);
    if (stage) params.set("stage", stage);
    if (country) params.set("country", country);
    if (intent) params.set("intent", intent);
    if (target > 1) params.set("page", String(target));
    const s = params.toString();
    return s ? `/companies?${s}` : "/companies";
  }

  const nothingPublished = total === 0 && activeCount === 0;

  return (
    <Container size="product" className="py-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">
          Discover Private Companies
        </h1>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-faint">
          Company information is provided by the companies themselves unless marked verified.
          Valuations are Vantor model estimates, not traded prices.
        </p>
      </header>

      <div className="mt-5">
        <FilterBar
          values={filterValues}
          industries={filterOptions.industries}
          countries={filterOptions.countries}
          activeCount={activeCount}
        />
      </div>

      <div className="mt-5 space-y-5">
        {items.length > 0 ? (
          <>
            <CompanyTable items={items} />
            <Pagination page={page} pageSize={pageSize} total={total} hrefFor={hrefFor} />
          </>
        ) : nothingPublished ? (
          <EmptyState
            title="No companies published yet"
            description="Published company profiles will appear here as founders complete them. Check back soon."
          />
        ) : (
          <EmptyState
            title="No matching companies"
            description="No published companies match the current filters. Adjust the criteria or clear the filters to see everything."
            action={
              <ButtonLink href="/companies" variant="secondary" size="sm">
                Clear filters
              </ButtonLink>
            }
          />
        )}
      </div>
    </Container>
  );
}

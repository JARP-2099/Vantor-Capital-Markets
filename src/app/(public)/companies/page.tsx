import type { Metadata } from "next";
import { after } from "next/server";
import { Container } from "@/components/layout/container";
import { recordProductEvent } from "@/lib/product-events";
import { CompanyTable, type CompanyListItem } from "@/components/marketplace/company-table";
import {
  FilterBar,
  type MarketplaceFilterValues,
  type SortOption,
} from "@/components/marketplace/filter-bar";
import { Pagination } from "@/components/marketplace/pagination";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DEFAULT_MARKETPLACE_SORT,
  MARKETPLACE_SORTS,
  MARKETPLACE_SORT_LABELS,
  getCompanyIntents,
  getLatestMetrics,
  getMarketplaceFilterOptions,
  getPublishedCompanies,
  type MarketplaceFilters,
  type MarketplaceSort,
} from "@/db/queries/companies";
import { getLatestCompletedValuationRuns } from "@/db/queries/valuations";
import { getPublicVerificationStats } from "@/db/queries/verifications";
import { getWatchedCompanyIds } from "@/db/queries/watchlists";
import { features } from "@/config/features";
import { getSessionUser } from "@/lib/authz";
import {
  COMPANY_STAGES,
  PUBLIC_INTENT_BADGES,
  type CompanyIntent,
  type CompanyStage,
} from "@/lib/constants";
import { computeDiscoverySignals } from "@/lib/discovery/signals";

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

function isMarketplaceSort(value: string): value is MarketplaceSort {
  return (MARKETPLACE_SORTS as readonly string[]).includes(value);
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

  // Sort is user-controlled input: anything outside the whitelist (or a
  // valuation sort while valuations are disabled) falls back to the default.
  const sortRaw = first(sp.sort);
  let sort: MarketplaceSort =
    sortRaw && isMarketplaceSort(sortRaw) ? sortRaw : DEFAULT_MARKETPLACE_SORT;
  if (sort === "valuation" && !features.valuationsEnabled) sort = DEFAULT_MARKETPLACE_SORT;

  const filters: MarketplaceFilters = { q, industry, stage, country, intent, sort, page: requestedPage };
  const activeCount = [q, industry, stage, country, intent].filter(Boolean).length;

  const [{ companies, total, page, pageSize }, filterOptions, user] = await Promise.all([
    getPublishedCompanies(filters),
    getMarketplaceFilterOptions(),
    features.watchlistsEnabled ? getSessionUser() : Promise.resolve(null),
  ]);

  // Beta usage signal for non-default queries only (a plain Discover visit
  // is not a search). Booleans and counts, never the query text itself.
  if (activeCount > 0 || sort !== DEFAULT_MARKETPLACE_SORT) {
    after(() =>
      recordProductEvent({
        event: "discover.queried",
        userId: user?.id ?? null,
        metadata: {
          hasSearch: Boolean(q),
          filterCount: activeCount - (q ? 1 : 0),
          sort,
          results: total,
        },
      }),
    );
  }

  // Batched lookups for everything on this page — no per-row queries.
  // Valuations are only fetched for companies that opted into public display.
  const companyIds = companies.map((c) => c.id);
  const valuationEligibleIds = features.valuationsEnabled
    ? companies.filter((c) => c.showPublicValuation).map((c) => c.id)
    : [];
  const [metricsByCompany, intentsByCompany, valuationsByCompany, verificationStats, watchedIds] =
    await Promise.all([
      getLatestMetrics(companyIds),
      getCompanyIntents(companyIds),
      getLatestCompletedValuationRuns(valuationEligibleIds),
      features.verificationEnabled
        ? getPublicVerificationStats(companyIds)
        : Promise.resolve(new Map<string, { verifiedPct: number; submittedCount: number }>()),
      user ? getWatchedCompanyIds(user.id, companyIds) : Promise.resolve(new Set<string>()),
    ]);

  const now = new Date();
  const items: CompanyListItem[] = companies.map((company) => {
    const stats = verificationStats.get(company.id) ?? null;
    return {
      company,
      metrics: metricsByCompany.get(company.id),
      intents: intentsByCompany.get(company.id) ?? [],
      valuation: valuationsByCompany.get(company.id) ?? null,
      verificationPct: stats?.verifiedPct ?? null,
      signals: computeDiscoverySignals({
        publishedAt: company.publishedAt,
        updatedAt: company.updatedAt,
        verifiedPct: stats?.verifiedPct ?? null,
        submittedCategories: stats?.submittedCount ?? 0,
        now,
      }),
      saved: watchedIds.has(company.id),
    };
  });

  const filterValues: MarketplaceFilterValues = {
    q,
    industry,
    stage,
    country,
    intent,
    sort: sort === DEFAULT_MARKETPLACE_SORT ? undefined : sort,
  };

  // Whitelisted sorts, default first (rendered as the empty value so default
  // URLs stay clean). Valuation sort is omitted while valuations are off.
  const sortOptions: SortOption[] = [
    DEFAULT_MARKETPLACE_SORT,
    ...MARKETPLACE_SORTS.filter(
      (s) => s !== DEFAULT_MARKETPLACE_SORT && (s !== "valuation" || features.valuationsEnabled),
    ),
  ].map((s) => ({ value: s, label: MARKETPLACE_SORT_LABELS[s] }));

  /** Href for a page number, preserving every active filter and the sort. */
  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (industry) params.set("industry", industry);
    if (stage) params.set("stage", stage);
    if (country) params.set("country", country);
    if (intent) params.set("intent", intent);
    if (sort !== DEFAULT_MARKETPLACE_SORT) params.set("sort", sort);
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
          sorts={sortOptions}
          activeCount={activeCount}
        />
      </div>

      <div className="mt-5 space-y-5">
        {items.length > 0 ? (
          <>
            <CompanyTable
              items={items}
              watch={
                features.watchlistsEnabled
                  ? { signedIn: Boolean(user), next: hrefFor(page) }
                  : undefined
              }
            />
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

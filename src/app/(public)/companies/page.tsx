import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CompanyListHeader, CompanyListRow } from "@/components/marketplace/company-card";
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
import {
  COMPANY_STAGES,
  PUBLIC_INTENT_BADGES,
  STAGE_LABELS,
  type CompanyIntent,
  type CompanyStage,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Discover Private Companies",
  description:
    "Browse standardized profiles of private companies — story, metrics, and team — on Vantor.",
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

  // Batched lookups for everything on this page — no per-card queries.
  const companyIds = companies.map((c) => c.id);
  const [metricsByCompany, intentsByCompany] = await Promise.all([
    getLatestMetrics(companyIds),
    getCompanyIntents(companyIds),
  ]);

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

  // Human-readable summary of the active filters, shown beside the count.
  const activeFilterParts = [
    q ? `“${q}”` : null,
    industry ?? null,
    stage ? STAGE_LABELS[stage] : null,
    country ?? null,
    intent ? (PUBLIC_INTENT_BADGES[intent] ?? null) : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <Container className="py-10 sm:py-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Discover Private Companies
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Company information is provided by the companies themselves and has not been
          independently verified by Vantor.
        </p>
      </header>

      <div className="mt-6">
        <FilterBar
          values={filterValues}
          industries={filterOptions.industries}
          countries={filterOptions.countries}
          activeCount={activeCount}
        />
      </div>

      {/* Result count + active filter summary */}
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm text-slate-650">
          <span className="font-semibold text-ink-900 tabular-nums">
            {total.toLocaleString("en-US")}
          </span>{" "}
          {total === 1 ? "company" : "companies"}
        </p>
        {activeFilterParts.length > 0 ? (
          <p className="text-xs text-muted">
            Filtered by {activeFilterParts.join(" · ")} ·{" "}
            <Link
              href="/companies"
              className="font-medium text-accent-700 underline-offset-2 hover:underline"
            >
              Clear
            </Link>
          </p>
        ) : null}
      </div>

      <div className="mt-3 space-y-4">
        {companies.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-lg border border-line bg-paper shadow-card">
              <CompanyListHeader />
              <ul className="divide-y divide-line">
                {companies.map((company) => (
                  <CompanyListRow
                    key={company.id}
                    company={company}
                    metrics={metricsByCompany.get(company.id)}
                    intents={intentsByCompany.get(company.id) ?? []}
                  />
                ))}
              </ul>
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} hrefFor={hrefFor} />
          </>
        ) : nothingPublished ? (
          <EmptyState
            title="No companies published yet"
            description="Published profiles appear here as founders complete them — standardized story, metrics, and team. Check back soon."
          />
        ) : (
          <EmptyState
            title="No matching companies"
            description="Nothing published matches these filters. Broaden the criteria or clear the filters to see every company."
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

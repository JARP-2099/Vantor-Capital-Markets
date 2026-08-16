import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  COMPANY_STAGES,
  PUBLIC_INTENT_BADGES,
  STAGE_LABELS,
  type CompanyIntent,
} from "@/lib/constants";
import { PUBLIC_INTENT_ORDER } from "./metrics";

export type MarketplaceFilterValues = {
  q?: string;
  industry?: string;
  stage?: string;
  country?: string;
  intent?: string;
};

type FilterFieldsProps = {
  idPrefix: string;
  values: MarketplaceFilterValues;
  industries: string[];
  countries: string[];
  activeCount: number;
  /** compact = one-line desktop bar; stacked = mobile sheet layout */
  layout: "compact" | "stacked";
};

/**
 * Plain GET form — filter state lives entirely in the URL, so views are
 * shareable and the whole bar works without JavaScript. Submitting resets
 * pagination because no `page` field is included.
 */
function FilterFields({ idPrefix, values, industries, countries, activeCount, layout }: FilterFieldsProps) {
  const compact = layout === "compact";
  // Field widths are set on wrapper divs: the controls themselves are w-full,
  // so the wrappers decide layout (one flexible search + fixed-width selects
  // in the compact bar; full-width stack in the mobile sheet).
  const searchWrap = compact ? "min-w-52 flex-[2]" : undefined;
  const selectWrap = compact ? "w-44" : undefined;
  return (
    <form
      method="get"
      action="/companies"
      className={compact ? "flex flex-wrap items-center gap-2" : "grid gap-3"}
    >
      <div className={searchWrap}>
        <label htmlFor={`${idPrefix}-q`} className="sr-only">
          Search
        </label>
        <Input
          id={`${idPrefix}-q`}
          type="search"
          name="q"
          defaultValue={values.q ?? ""}
          placeholder="Search companies"
          className={compact ? "h-9" : undefined}
        />
      </div>

      <div className={selectWrap}>
        <label htmlFor={`${idPrefix}-industry`} className="sr-only">
          Industry
        </label>
        <Select
          id={`${idPrefix}-industry`}
          name="industry"
          defaultValue={values.industry ?? ""}
          className={compact ? "h-9" : undefined}
        >
          <option value="">All industries</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </Select>
      </div>

      <div className={selectWrap}>
        <label htmlFor={`${idPrefix}-stage`} className="sr-only">
          Stage
        </label>
        <Select
          id={`${idPrefix}-stage`}
          name="stage"
          defaultValue={values.stage ?? ""}
          className={compact ? "h-9" : undefined}
        >
          <option value="">All stages</option>
          {COMPANY_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </Select>
      </div>

      <div className={selectWrap}>
        <label htmlFor={`${idPrefix}-country`} className="sr-only">
          Country
        </label>
        <Select
          id={`${idPrefix}-country`}
          name="country"
          defaultValue={values.country ?? ""}
          className={compact ? "h-9" : undefined}
        >
          <option value="">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </Select>
      </div>

      <div className={selectWrap}>
        <label htmlFor={`${idPrefix}-intent`} className="sr-only">
          Status
        </label>
        <Select
          id={`${idPrefix}-intent`}
          name="intent"
          defaultValue={values.intent ?? ""}
          className={compact ? "h-9" : undefined}
        >
          <option value="">Any status</option>
          {PUBLIC_INTENT_ORDER.map((intent: CompanyIntent) => (
            <option key={intent} value={intent}>
              {PUBLIC_INTENT_BADGES[intent]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" size="sm">
          Apply
        </Button>
        {activeCount > 0 ? (
          <ButtonLink href="/companies" variant="ghost" size="sm">
            Clear
          </ButtonLink>
        ) : null}
      </div>
    </form>
  );
}

type FilterBarProps = {
  values: MarketplaceFilterValues;
  industries: string[];
  countries: string[];
  activeCount: number;
};

/**
 * Marketplace filter bar. A compact one-line control row on desktop;
 * collapses into a native <details> sheet on mobile (no client JS). The two
 * renders are separate forms with distinct field ids, so labels stay valid.
 */
export function FilterBar({ values, industries, countries, activeCount }: FilterBarProps) {
  return (
    <section aria-label="Filter companies">
      {/* Desktop: always expanded */}
      <div className="hidden md:block">
        <FilterFields
          idPrefix="filters"
          values={values}
          industries={industries}
          countries={countries}
          activeCount={activeCount}
          layout="compact"
        />
      </div>

      {/* Mobile: native disclosure; open by default when filters are active */}
      <details
        className="rounded-lg border border-line bg-paper md:hidden"
        open={activeCount > 0}
      >
        <summary className="cursor-pointer select-none rounded-lg px-4 py-3 text-sm font-medium text-ink-900">
          Filters{activeCount > 0 ? ` (${activeCount} active)` : ""}
        </summary>
        <div className="border-t border-line p-4">
          <FilterFields
            idPrefix="m-filters"
            values={values}
            industries={industries}
            countries={countries}
            activeCount={activeCount}
            layout="stacked"
          />
        </div>
      </details>
    </section>
  );
}

import { Card } from "@/components/ui/card";
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
};

function labelClass() {
  return "block text-xs font-medium uppercase tracking-wider text-muted";
}

/**
 * Plain GET form — filter state lives entirely in the URL, so views are
 * shareable and the whole bar works without JavaScript. Submitting resets
 * pagination because no `page` field is included.
 */
function FilterFields({ idPrefix, values, industries, countries, activeCount }: FilterFieldsProps) {
  return (
    <form method="get" action="/companies" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
        <label htmlFor={`${idPrefix}-q`} className={labelClass()}>
          Search
        </label>
        <Input
          id={`${idPrefix}-q`}
          type="search"
          name="q"
          defaultValue={values.q ?? ""}
          placeholder="Company name, description, or industry"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-industry`} className={labelClass()}>
          Industry
        </label>
        <Select id={`${idPrefix}-industry`} name="industry" defaultValue={values.industry ?? ""}>
          <option value="">All industries</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-stage`} className={labelClass()}>
          Stage
        </label>
        <Select id={`${idPrefix}-stage`} name="stage" defaultValue={values.stage ?? ""}>
          <option value="">All stages</option>
          {COMPANY_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-country`} className={labelClass()}>
          Country
        </label>
        <Select id={`${idPrefix}-country`} name="country" defaultValue={values.country ?? ""}>
          <option value="">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-intent`} className={labelClass()}>
          Status
        </label>
        <Select id={`${idPrefix}-intent`} name="intent" defaultValue={values.intent ?? ""}>
          <option value="">Any status</option>
          {PUBLIC_INTENT_ORDER.map((intent: CompanyIntent) => (
            <option key={intent} value={intent}>
              {PUBLIC_INTENT_BADGES[intent]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
        <Button type="submit" size="sm">
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
 * Marketplace filter bar. Always visible on desktop; collapses into a native
 * <details> disclosure on mobile (no client JS). The two renders are separate
 * forms with distinct field ids, so labels stay valid.
 */
export function FilterBar({ values, industries, countries, activeCount }: FilterBarProps) {
  return (
    <section aria-label="Filter companies">
      {/* Desktop: always expanded */}
      <Card className="hidden p-4 md:block">
        <FilterFields
          idPrefix="filters"
          values={values}
          industries={industries}
          countries={countries}
          activeCount={activeCount}
        />
      </Card>

      {/* Mobile: native disclosure; open by default when filters are active */}
      <details
        className="rounded-lg border border-line bg-paper shadow-card md:hidden"
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
          />
        </div>
      </details>
    </section>
  );
}

import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
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
  /**
   * toolbar = slim single-row desktop bar (labels visually hidden, compact
   * controls); stacked = labelled fields for the mobile disclosure.
   */
  layout: "toolbar" | "stacked";
};

/**
 * Plain GET form — filter state lives entirely in the URL, so views are
 * shareable and the whole bar works without JavaScript. Submitting resets
 * pagination because no `page` field is included.
 */
function FilterFields({
  idPrefix,
  values,
  industries,
  countries,
  activeCount,
  layout,
}: FilterFieldsProps) {
  const toolbar = layout === "toolbar";
  const labelClass = toolbar
    ? "sr-only"
    : "block text-xs font-medium uppercase tracking-wider text-muted";
  const fieldClass = toolbar ? "h-9" : undefined;

  return (
    <form
      method="get"
      action="/companies"
      className={cn(
        toolbar ? "flex flex-wrap items-center gap-2" : "grid gap-3",
      )}
    >
      <div className={cn(toolbar ? "min-w-52 flex-[2]" : "space-y-1.5")}>
        <label htmlFor={`${idPrefix}-q`} className={labelClass}>
          Search
        </label>
        <Input
          id={`${idPrefix}-q`}
          type="search"
          name="q"
          defaultValue={values.q ?? ""}
          placeholder="Company name, description, or industry"
          className={fieldClass}
        />
      </div>

      <div className={cn(toolbar ? "w-40" : "space-y-1.5")}>
        <label htmlFor={`${idPrefix}-industry`} className={labelClass}>
          Industry
        </label>
        <Select
          id={`${idPrefix}-industry`}
          name="industry"
          defaultValue={values.industry ?? ""}
          className={fieldClass}
        >
          <option value="">All industries</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </Select>
      </div>

      <div className={cn(toolbar ? "w-32" : "space-y-1.5")}>
        <label htmlFor={`${idPrefix}-stage`} className={labelClass}>
          Stage
        </label>
        <Select
          id={`${idPrefix}-stage`}
          name="stage"
          defaultValue={values.stage ?? ""}
          className={fieldClass}
        >
          <option value="">All stages</option>
          {COMPANY_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </Select>
      </div>

      <div className={cn(toolbar ? "w-36" : "space-y-1.5")}>
        <label htmlFor={`${idPrefix}-country`} className={labelClass}>
          Country
        </label>
        <Select
          id={`${idPrefix}-country`}
          name="country"
          defaultValue={values.country ?? ""}
          className={fieldClass}
        >
          <option value="">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </Select>
      </div>

      <div className={cn(toolbar ? "w-32" : "space-y-1.5")}>
        <label htmlFor={`${idPrefix}-intent`} className={labelClass}>
          Status
        </label>
        <Select
          id={`${idPrefix}-intent`}
          name="intent"
          defaultValue={values.intent ?? ""}
          className={fieldClass}
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
        <Button type="submit" variant="secondary" size="sm" className={toolbar ? "h-9" : undefined}>
          Apply
        </Button>
        {activeCount > 0 ? (
          <ButtonLink
            href="/companies"
            variant="ghost"
            size="sm"
            className={toolbar ? "h-9" : undefined}
          >
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
 * Marketplace filter bar. A slim always-visible toolbar on desktop; collapses
 * into a native <details> disclosure on mobile (no client JS). The two renders
 * are separate forms with distinct field ids, so labels stay valid.
 */
export function FilterBar({ values, industries, countries, activeCount }: FilterBarProps) {
  return (
    <section aria-label="Filter companies">
      {/* Desktop: always expanded, single slim row */}
      <div className="hidden rounded-lg border border-line bg-paper p-2 shadow-card md:block">
        <FilterFields
          idPrefix="filters"
          values={values}
          industries={industries}
          countries={countries}
          activeCount={activeCount}
          layout="toolbar"
        />
      </div>

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
            layout="stacked"
          />
        </div>
      </details>
    </section>
  );
}

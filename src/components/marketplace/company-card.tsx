import Link from "next/link";
import type { CompanyMetricRow, CompanyRow } from "@/db/queries/companies";
import type { ValuationRunRow } from "@/db/queries/valuations";
import { cn } from "@/lib/cn";
import { STAGE_LABELS, type CompanyIntent, type MetricType } from "@/lib/constants";
import { formatCompactCurrency } from "@/lib/format";
import { CompanyMark } from "./company-mark";
import { pickGrowthMetric, pickPublicIntent, pickRevenueMetric } from "./metrics";

/**
 * Marketplace opportunity rows — V3 (docs/VANTOR_UI_UX_DIRECTION_V3.md §7):
 * a structured result list, not a card grid. Identity + one-line thesis on
 * the left, aligned tabular financial columns (Revenue, Growth, Est.
 * Valuation) on the right, quiet dot status. Mobile collapses to a stacked
 * entry with an inline metric line. Unknown values render as an em dash,
 * never a fabricated zero.
 */

/** Shared desktop column template so the header, rows, and skeletons stay aligned. */
export const ROW_GRID =
  "lg:grid lg:grid-cols-[minmax(0,10fr)_minmax(0,6fr)_5.5rem_4.5rem_7.5rem_10.5rem] lg:items-center lg:gap-x-6";

const HEADER_CELL = "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted";

/** Desktop-only column header for the result list (rows are self-labelled). */
export function CompanyListHeader() {
  return (
    <div aria-hidden="true" className={cn("hidden border-b border-line bg-canvas px-5 py-2.5", ROW_GRID)}>
      <span className={HEADER_CELL}>Company</span>
      <span className={HEADER_CELL}>Industry · Stage</span>
      <span className={cn(HEADER_CELL, "text-right")}>Revenue</span>
      <span className={cn(HEADER_CELL, "text-right")}>Growth</span>
      <span className={cn(HEADER_CELL, "text-right")}>Est. Valuation</span>
      <span className={HEADER_CELL}>Status</span>
    </div>
  );
}

type CompanyListRowProps = {
  company: CompanyRow;
  /** Latest metrics for this company (from batched getLatestMetrics). */
  metrics: Map<MetricType, CompanyMetricRow> | undefined;
  /** Intents this company holds (from batched getCompanyIntents). */
  intents: readonly CompanyIntent[];
  /** Latest completed public valuation run, when visible (batched). */
  valuation?: ValuationRunRow | null;
};

const toneClass = {
  default: "text-ink-900",
  positive: "text-positive-700",
  negative: "text-negative-700",
} as const;

/** Compact "low – high" (or midpoint) from a completed run; null when unparsable. */
function valuationLabel(run: ValuationRunRow | null | undefined): string | null {
  if (!run) return null;
  const low = run.valuationLow !== null ? Number(run.valuationLow) : NaN;
  const high = run.valuationHigh !== null ? Number(run.valuationHigh) : NaN;
  if (Number.isFinite(low) && Number.isFinite(high)) {
    return `${formatCompactCurrency(low, run.currency)}–${formatCompactCurrency(high, run.currency)}`;
  }
  const mid = run.valuationMid !== null ? Number(run.valuationMid) : NaN;
  return Number.isFinite(mid) ? formatCompactCurrency(mid, run.currency) : null;
}

export function CompanyListRow({ company, metrics, intents, valuation }: CompanyListRowProps) {
  const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
  const location = [company.hqCity, company.hqCountry].filter(Boolean).join(", ");
  const classification = [company.industry, stageLabel].filter(Boolean).join(" · ");
  const revenue = pickRevenueMetric(metrics);
  const growth = pickGrowthMetric(metrics);
  const status = pickPublicIntent(intents);
  const valuationText = valuationLabel(valuation);
  const raising = status && status.intent !== "not_raising";

  return (
    <li>
      <Link
        href={`/companies/${company.slug}`}
        aria-label={`View ${company.name}`}
        className={cn("group block px-4 py-4 transition-colors hover:bg-canvas sm:px-5", ROW_GRID)}
      >
        {/* ------------------------------ Identity ------------------------------ */}
        <div className="flex min-w-0 items-center gap-3.5">
          <CompanyMark name={company.name} size="md" />
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink-900 group-hover:text-accent-700">
              {company.name}
            </h2>
            {company.shortDescription ? (
              <p className="mt-0.5 truncate text-sm text-slate-650">{company.shortDescription}</p>
            ) : null}
            {/* Mobile-only classification line (its own column on desktop). */}
            {(classification || location) && (
              <p className="mt-0.5 truncate text-xs text-muted lg:hidden">
                {[classification || null, location || null].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* --------------------------- Desktop columns --------------------------- */}
        <div className="hidden min-w-0 lg:block">
          <span className="sr-only">Industry and stage: </span>
          {classification ? (
            <p className="truncate text-sm text-slate-650">{classification}</p>
          ) : (
            <p className="text-sm text-faint">—</p>
          )}
          {location ? <p className="mt-0.5 truncate text-xs text-muted">{location}</p> : null}
        </div>
        <div className="hidden text-right lg:block">
          <span className="sr-only">Revenue: </span>
          {revenue ? (
            <>
              <p className="text-sm font-semibold text-ink-900 tabular-nums">{revenue.value}</p>
              <p className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-muted">
                {revenue.label}
              </p>
            </>
          ) : (
            <p className="text-sm text-faint">—</p>
          )}
        </div>
        <div className="hidden text-right lg:block">
          <span className="sr-only">Growth (YoY): </span>
          {growth ? (
            <p className={cn("text-sm font-semibold tabular-nums", toneClass[growth.tone])}>
              {growth.value}
            </p>
          ) : (
            <p className="text-sm text-faint">—</p>
          )}
        </div>
        <div className="hidden text-right lg:block">
          <span className="sr-only">Estimated valuation: </span>
          {valuationText ? (
            <p className="text-sm font-semibold text-ink-900 tabular-nums">{valuationText}</p>
          ) : (
            <p className="text-sm text-faint">—</p>
          )}
        </div>
        <div className="hidden min-w-0 lg:block">
          {status ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-650">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  raising ? "bg-accent-600" : "bg-faint",
                )}
              />
              <span className="truncate">{status.label}</span>
            </p>
          ) : null}
        </div>

        {/* ---------------------------- Mobile metrics ---------------------------- */}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 pl-[3.375rem] lg:hidden">
          <span className="text-sm">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              {revenue ? revenue.label : "Revenue"}
            </span>{" "}
            <span className={cn("tabular-nums", revenue ? "font-semibold text-ink-900" : "text-faint")}>
              {revenue ? revenue.value : "—"}
            </span>
          </span>
          <span className="text-sm">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
              Growth
            </span>{" "}
            <span
              className={cn(
                "tabular-nums",
                growth ? cn("font-semibold", toneClass[growth.tone]) : "text-faint",
              )}
            >
              {growth ? growth.value : "—"}
            </span>
          </span>
          {valuationText ? (
            <span className="text-sm">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
                Est. Val
              </span>{" "}
              <span className="font-semibold text-ink-900 tabular-nums">{valuationText}</span>
            </span>
          ) : null}
          {status ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-650">
              <span
                className={cn("size-1.5 rounded-full", raising ? "bg-accent-600" : "bg-faint")}
              />
              {status.label}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

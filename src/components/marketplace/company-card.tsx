import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CompanyMetricRow, CompanyRow } from "@/db/queries/companies";
import { cn } from "@/lib/cn";
import { STAGE_LABELS, type CompanyIntent, type MetricType } from "@/lib/constants";
import { pickGrowthMetric, pickPublicIntent, pickRevenueMetric } from "./metrics";

/**
 * Marketplace result list: one company per row, terminal-style. Desktop rows
 * align identity on the left with right-aligned tabular Revenue / Growth
 * columns and a quiet dot-badge status column; mobile rows collapse into a
 * compact stacked entry. Unknown values render as an em dash, never a
 * fabricated zero.
 */

/** Shared desktop column template so the header and every row stay aligned. */
const ROW_GRID = "md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_7rem_12rem] md:items-center md:gap-x-6";

const HEADER_CELL = "text-xs font-medium uppercase tracking-wider text-muted";

/** Desktop-only column header for the result list (rows are self-labelled). */
export function CompanyListHeader() {
  return (
    <div
      aria-hidden="true"
      className={cn("hidden border-b border-line-strong bg-mist/60 px-5 py-2.5", ROW_GRID)}
    >
      <span className={HEADER_CELL}>Company</span>
      <span className={cn(HEADER_CELL, "text-right")}>Revenue</span>
      <span className={cn(HEADER_CELL, "text-right")}>Growth (YoY)</span>
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
};

const toneClass = {
  default: "text-ink-900",
  positive: "text-positive-700",
  negative: "text-negative-700",
} as const;

export function CompanyListRow({ company, metrics, intents }: CompanyListRowProps) {
  const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
  const location = [company.hqCity, company.hqCountry].filter(Boolean).join(", ");
  const meta = [company.industry, stageLabel, location || null].filter(Boolean).join(" · ");
  const revenue = pickRevenueMetric(metrics);
  const growth = pickGrowthMetric(metrics);
  const status = pickPublicIntent(intents);

  return (
    <li>
      <Link
        href={`/companies/${company.slug}`}
        aria-label={`View ${company.name}`}
        className={cn(
          "group block px-4 py-3.5 transition-colors hover:bg-mist/50 sm:px-5 md:py-3",
          ROW_GRID,
        )}
      >
        {/* ------------------------------ Identity ------------------------------ */}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-ink-900 group-hover:text-accent-700">
            {company.name}
          </h2>
          {company.shortDescription ? (
            <p className="mt-0.5 truncate text-sm text-slate-650">{company.shortDescription}</p>
          ) : null}
          {meta ? <p className="mt-0.5 truncate text-xs text-muted">{meta}</p> : null}
        </div>

        {/* --------------------------- Desktop columns --------------------------- */}
        <div className="hidden text-right md:block">
          <span className="sr-only">Revenue: </span>
          {revenue ? (
            <>
              <p className="text-sm font-semibold text-ink-900 tabular-nums">{revenue.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted">{revenue.label}</p>
            </>
          ) : (
            <p className="text-sm text-faint">—</p>
          )}
        </div>
        <div className="hidden text-right md:block">
          <span className="sr-only">Growth (YoY): </span>
          {growth ? (
            <p className={cn("text-sm font-semibold tabular-nums", toneClass[growth.tone])}>
              {growth.value}
            </p>
          ) : (
            <p className="text-sm text-faint">—</p>
          )}
        </div>
        <div className="hidden min-w-0 md:block">
          {status ? (
            <Badge dot tone={status.intent === "not_raising" ? "neutral" : "accent"}>
              {status.label}
            </Badge>
          ) : null}
        </div>

        {/* ---------------------------- Mobile metrics ---------------------------- */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:hidden">
          <span className="text-sm text-slate-650">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {revenue ? revenue.label : "Revenue"}
            </span>{" "}
            <span
              className={cn(
                "tabular-nums",
                revenue ? "font-semibold text-ink-900" : "text-faint",
              )}
            >
              {revenue ? revenue.value : "—"}
            </span>
          </span>
          <span className="text-sm text-slate-650">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
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
          {status ? (
            <Badge dot tone={status.intent === "not_raising" ? "neutral" : "accent"}>
              {status.label}
            </Badge>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

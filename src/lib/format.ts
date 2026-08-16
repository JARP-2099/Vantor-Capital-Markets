import { MONETARY_METRICS, PERCENT_METRICS, type MetricType } from "@/lib/constants";

/**
 * Display formatting for metrics. Pure functions — shared by cards, tables,
 * and profile pages so every surface renders numbers identically.
 */

/** $1,240 → "$1.2K", $2,400,000 → "$2.4M". Sign preserved for losses. */
export function formatCompactCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    // Currency style would otherwise force a minimum of one fraction digit
    // here, rendering "$580.0K" instead of "$580K".
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** +74% / -12% with explicit sign for growth-style metrics. */
export function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

/**
 * Formats a metric value by type. `null`/unknown must be handled by the
 * caller (render "Not provided" — never a fabricated zero).
 */
export function formatMetricValue(
  type: MetricType,
  value: number,
  currency?: string | null,
): string {
  if (MONETARY_METRICS.has(type)) return formatCompactCurrency(value, currency ?? "USD");
  if (PERCENT_METRICS.has(type)) {
    return type === "revenue_growth_yoy" ? formatSignedPercent(value) : formatPercent(value);
  }
  if (type === "runway_months") {
    const months = Math.round(value);
    return `${months} mo`;
  }
  return formatCompactNumber(value);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

/**
 * Date + time, for histories where multiple entries can share a day
 * (e.g. valuation runs) and date-only rows would be indistinguishable.
 */
export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

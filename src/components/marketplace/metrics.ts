import type { CompanyMetricRow } from "@/db/queries/companies";
import {
  METRIC_LABELS,
  PUBLIC_INTENT_BADGES,
  type CompanyIntent,
  type MetricType,
} from "@/lib/constants";
import { formatMetricValue, formatSignedPercent } from "@/lib/format";

/**
 * Pure display helpers shared by marketplace cards and company profiles so
 * both surfaces pick and format metrics identically. No fabrication: every
 * helper returns null when the underlying data is absent or unparseable.
 */

/** Drizzle numeric columns arrive as strings; parse defensively. */
export function metricNumber(row: CompanyMetricRow): number | null {
  const n = Number(row.value);
  return Number.isFinite(n) ? n : null;
}

const REVENUE_PREFERENCE = ["arr", "revenue_annual", "mrr"] as const satisfies readonly MetricType[];

export type PickedMetric = {
  label: string;
  value: string;
  row: CompanyMetricRow;
};

/** Best available revenue figure: ARR, else annual revenue, else MRR — labeled accordingly. */
export function pickRevenueMetric(
  byType: Map<MetricType, CompanyMetricRow> | undefined,
): PickedMetric | null {
  if (!byType) return null;
  for (const type of REVENUE_PREFERENCE) {
    const row = byType.get(type);
    if (!row) continue;
    const n = metricNumber(row);
    if (n === null) continue;
    return { label: METRIC_LABELS[type], value: formatMetricValue(type, n, row.currency), row };
  }
  return null;
}

export type PickedGrowth = {
  value: string;
  tone: "default" | "positive" | "negative";
  row: CompanyMetricRow;
};

/** YoY revenue growth with sign-driven tone. */
export function pickGrowthMetric(
  byType: Map<MetricType, CompanyMetricRow> | undefined,
): PickedGrowth | null {
  const row = byType?.get("revenue_growth_yoy");
  if (!row) return null;
  const n = metricNumber(row);
  if (n === null) return null;
  return {
    value: formatSignedPercent(n),
    tone: n > 0 ? "positive" : n < 0 ? "negative" : "default",
    row,
  };
}

/** Simple count/monetary metric formatted for a tile, or null when absent. */
export function pickSimpleMetric(
  byType: Map<MetricType, CompanyMetricRow> | undefined,
  type: MetricType,
): PickedMetric | null {
  const row = byType?.get(type);
  if (!row) return null;
  const n = metricNumber(row);
  if (n === null) return null;
  return { label: METRIC_LABELS[type], value: formatMetricValue(type, n, row.currency), row };
}

/**
 * Publicly surfaceable intents, in badge-priority order (the declaration
 * order of PUBLIC_INTENT_BADGES: active signals before "Not Raising").
 */
export const PUBLIC_INTENT_ORDER = Object.keys(PUBLIC_INTENT_BADGES) as CompanyIntent[];

export type PickedIntent = { intent: CompanyIntent; label: string };

/** First publicly badged intent a company holds, or null. */
export function pickPublicIntent(intents: readonly CompanyIntent[]): PickedIntent | null {
  for (const intent of PUBLIC_INTENT_ORDER) {
    if (intents.includes(intent)) {
      const label = PUBLIC_INTENT_BADGES[intent];
      if (label) return { intent, label };
    }
  }
  return null;
}

/** All publicly badged intents a company holds, in priority order. */
export function publicIntentBadges(intents: readonly CompanyIntent[]): PickedIntent[] {
  const out: PickedIntent[] = [];
  for (const intent of PUBLIC_INTENT_ORDER) {
    if (intents.includes(intent)) {
      const label = PUBLIC_INTENT_BADGES[intent];
      if (label) out.push({ intent, label });
    }
  }
  return out;
}

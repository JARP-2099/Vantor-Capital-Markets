import type { BusinessModel, CompanyStage, MetricType } from "@/lib/constants";
import type { MetricPoint, ValuationInputs } from "./types";

/**
 * Pure input assembly from already-fetched rows. Shared by the server-side
 * assembler (src/lib/valuation/inputs.ts) and the seed script, so the
 * snapshot shape has exactly one definition.
 */

export type CompanyFacts = {
  id: string;
  stage: string | null;
  industry: string | null;
  businessModel: string | null;
  foundedYear: number | null;
};

export type MetricRowLike = {
  metricType: string;
  value: string;
  asOf: string;
  currency: string | null;
};

export function buildValuationInputs(
  company: CompanyFacts,
  metricRows: MetricRowLike[],
  verifiedCategories: string[],
  asOfToday: string,
): ValuationInputs {
  // Rows must arrive newest-first per type (order by asOf desc, createdAt desc).
  const series = new Map<MetricType, MetricPoint[]>();
  for (const row of metricRows) {
    const list = series.get(row.metricType as MetricType) ?? [];
    list.push({ value: Number(row.value), asOf: row.asOf, currency: row.currency });
    series.set(row.metricType as MetricType, list);
  }
  const latest = (t: MetricType): MetricPoint | undefined => series.get(t)?.[0];

  return {
    companyId: company.id,
    asOfToday,
    stage: (company.stage as CompanyStage | null) ?? null,
    industry: company.industry,
    businessModel: (company.businessModel as BusinessModel | null) ?? null,
    foundedYear: company.foundedYear,
    metrics: {
      arr: series.get("arr"),
      revenueAnnual: series.get("revenue_annual"),
      mrr: series.get("mrr"),
      growthYoY: latest("revenue_growth_yoy"),
      grossMargin: latest("gross_margin"),
      netProfitAnnual: latest("net_profit_annual"),
      burnMonthly: latest("burn_monthly"),
      runwayMonths: latest("runway_months"),
      customers: latest("customers"),
      employees: latest("employees"),
      capitalRaisedTotal: latest("capital_raised_total"),
      topCustomerRevenuePct: latest("top_customer_revenue_pct"),
    },
    verifiedCategories: [...new Set(verifiedCategories)],
  };
}

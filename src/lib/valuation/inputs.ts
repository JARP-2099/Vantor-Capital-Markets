import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyMetrics, verificationRequests } from "@/db/schema";
import type { BusinessModel, CompanyStage, MetricType } from "@/lib/constants";
import type { MetricPoint, ValuationInputs } from "./types";

/**
 * Assembles the engine's input snapshot from the database. This is the only
 * I/O on the valuation path — everything downstream is pure. The snapshot is
 * persisted with each run so results stay reproducible and auditable.
 */
export async function assembleValuationInputs(
  companyId: string,
  asOfToday: string,
): Promise<ValuationInputs | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) return null;

  const rows = await db
    .select()
    .from(companyMetrics)
    .where(eq(companyMetrics.companyId, companyId))
    .orderBy(desc(companyMetrics.asOf), desc(companyMetrics.createdAt));

  const series = new Map<MetricType, MetricPoint[]>();
  for (const row of rows) {
    const list = series.get(row.metricType as MetricType) ?? [];
    list.push({ value: Number(row.value), asOf: row.asOf, currency: row.currency });
    series.set(row.metricType as MetricType, list);
  }
  const latest = (t: MetricType): MetricPoint | undefined => series.get(t)?.[0];

  const verified = await db
    .select({ category: verificationRequests.category })
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.companyId, companyId),
        inArray(verificationRequests.status, ["verified"]),
      ),
    );

  return {
    companyId,
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
    verifiedCategories: [...new Set(verified.map((v) => v.category))],
  };
}

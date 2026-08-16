import type { CompanyStage, BusinessModel } from "@/lib/constants";

/**
 * Valuation engine types. The engine is a pure, deterministic function of
 * `ValuationInputs` — no I/O, no randomness, no clock reads (freshness is
 * computed against `asOfToday` supplied by the caller) — so identical inputs
 * always produce identical results and every run is reproducible from its
 * stored input snapshot.
 */

export type MetricPoint = {
  value: number;
  /** ISO date the value describes. */
  asOf: string;
  currency?: string | null;
};

export type ValuationInputs = {
  companyId: string;
  /** Evaluation date (ISO); injected for determinism. */
  asOfToday: string;
  stage: CompanyStage | null;
  industry: string | null;
  businessModel: BusinessModel | null;
  foundedYear: number | null;
  /** Latest-first history where available. */
  metrics: {
    arr?: MetricPoint[];
    revenueAnnual?: MetricPoint[];
    mrr?: MetricPoint[];
    growthYoY?: MetricPoint;
    grossMargin?: MetricPoint;
    netProfitAnnual?: MetricPoint;
    burnMonthly?: MetricPoint;
    runwayMonths?: MetricPoint;
    customers?: MetricPoint;
    employees?: MetricPoint;
    capitalRaisedTotal?: MetricPoint;
    topCustomerRevenuePct?: MetricPoint;
  };
  /** Verification categories currently in `verified` status. */
  verifiedCategories: string[];
};

export type ComponentKey =
  | "revenue_multiple"
  | "profitability"
  | "stage_baseline"
  | "comparables";

export type ComponentStatus = "applied" | "not_applicable" | "insufficient_data";

export type ComponentResult = {
  key: ComponentKey;
  status: ComponentStatus;
  /** Present iff status === "applied". */
  low?: number;
  high?: number;
  mid?: number;
  /** Blend weight actually used (0 unless applied). */
  weight: number;
  /** Explainability payload: inputs used, multiples, adjustments, notes. */
  detail: Record<string, unknown>;
};

export type RiskFlag = {
  key: string;
  label: string;
  /** Negative percentage applied to the blended estimate, e.g. -15. */
  impactPct: number;
};

export type DataSufficiency = "strong" | "moderate" | "limited" | "insufficient";

export type ValuationResult =
  | {
      status: "completed";
      currency: string;
      low: number;
      high: number;
      mid: number;
      /** 0–100. Confidence in the estimate, never investment quality. */
      confidence: number;
      dataSufficiency: Exclude<DataSufficiency, "insufficient">;
      components: ComponentResult[];
      riskFlags: RiskFlag[];
      /** Founder-facing hints: what data would improve the estimate. */
      improvementHints: string[];
      engineVersion: string;
      assumptionsVersion: string;
    }
  | {
      status: "insufficient_data";
      dataSufficiency: "insufficient";
      reasons: string[];
      improvementHints: string[];
      components: ComponentResult[];
      engineVersion: string;
      assumptionsVersion: string;
    };

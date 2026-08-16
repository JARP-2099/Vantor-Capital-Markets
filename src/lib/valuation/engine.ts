import {
  ASSUMPTIONS_VERSION,
  BASE_REVENUE_MULTIPLES,
  COMPONENT_SPREAD,
  COMPONENT_WEIGHTS,
  CONFIDENCE_RULES,
  DEFAULT_INDUSTRY_MODIFIER,
  EARNINGS_MULTIPLE,
  GROWTH_ADJUSTMENT,
  INDUSTRY_MODIFIERS,
  MARGIN_ADJUSTMENT,
  MINIMAL_REVENUE_THRESHOLD,
  RISK_RULES,
  STAGE_BASELINES,
  STAGE_BASELINE_ADJUSTMENTS,
} from "./assumptions";
import type {
  ComponentResult,
  DataSufficiency,
  RiskFlag,
  ValuationInputs,
  ValuationResult,
} from "./types";

/*
 * v1.1: bug-fix release, same methodology.
 *  - months are computed in UTC, so results no longer vary by server timezone
 *  - a reported revenue point below the minimal threshold (e.g. ARR 0) falls
 *    through to the next revenue source instead of masking real revenue
 */
export const ENGINE_VERSION = "vantor-valuation-v1.1";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Round to 3 significant figures — ranges must not imply false precision. */
export function round3sig(v: number): number {
  if (v === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(v)));
  const factor = 10 ** (magnitude - 2);
  return Math.round(v / factor) * factor;
}

function monthsBetween(fromIso: string, toIso: string): number {
  // UTC accessors: ISO date-only strings parse as UTC midnight, and local
  // accessors would shift them a month in western timezones, making results
  // depend on the server's timezone.
  const from = new Date(fromIso);
  const to = new Date(toIso);
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
}

/**
 * Primary annual-revenue figure: ARR, else annual revenue, else MRR×12.
 * A source whose latest value is below the minimal-revenue threshold yields
 * to a later source that clears it (e.g. a truthful ARR of 0 must not mask
 * real annual revenue); when no source clears the bar, the first reported
 * one is returned so pre-revenue detection still sees the actual figure.
 */
function primaryRevenue(inputs: ValuationInputs): {
  value: number;
  currency: string;
  source: "arr" | "revenue_annual" | "mrr_annualized";
  asOf: string;
} | null {
  const { arr, revenueAnnual, mrr } = inputs.metrics;
  const candidates: Array<{
    value: number;
    currency: string;
    source: "arr" | "revenue_annual" | "mrr_annualized";
    asOf: string;
  }> = [];
  if (arr?.[0]) {
    candidates.push({ value: arr[0].value, currency: arr[0].currency ?? "USD", source: "arr", asOf: arr[0].asOf });
  }
  if (revenueAnnual?.[0]) {
    candidates.push({
      value: revenueAnnual[0].value,
      currency: revenueAnnual[0].currency ?? "USD",
      source: "revenue_annual",
      asOf: revenueAnnual[0].asOf,
    });
  }
  if (mrr?.[0]) {
    candidates.push({
      value: mrr[0].value * 12,
      currency: mrr[0].currency ?? "USD",
      source: "mrr_annualized",
      asOf: mrr[0].asOf,
    });
  }
  if (candidates.length === 0) return null;
  return candidates.find((c) => c.value >= MINIMAL_REVENUE_THRESHOLD) ?? candidates[0];
}

/** Growth %: reported growth metric, else derived from revenue history. */
function effectiveGrowth(inputs: ValuationInputs): { pct: number; source: string } | null {
  if (inputs.metrics.growthYoY) {
    return { pct: inputs.metrics.growthYoY.value, source: "reported" };
  }
  const series = inputs.metrics.arr?.length ? inputs.metrics.arr : inputs.metrics.revenueAnnual;
  if (series && series.length >= 2) {
    const [latest, prior] = series;
    const months = monthsBetween(prior.asOf, latest.asOf);
    if (prior.value > 0 && months >= 6) {
      const yoy = ((latest.value - prior.value) / prior.value) * (12 / months) * 100;
      return { pct: yoy, source: "derived_from_history" };
    }
  }
  return null;
}

function industryModifier(industry: string | null): number {
  return industry ? (INDUSTRY_MODIFIERS[industry] ?? DEFAULT_INDUSTRY_MODIFIER) : DEFAULT_INDUSTRY_MODIFIER;
}

/* -------------------------------------------------------------------------- */
/* Data completeness & sufficiency                                            */
/* -------------------------------------------------------------------------- */

type Completeness = {
  score: number; // 0..1
  present: string[];
  missing: string[];
  preRevenue: boolean;
};

export function assessCompleteness(inputs: ValuationInputs): Completeness {
  const rev = primaryRevenue(inputs);
  const preRevenue = !rev || rev.value < MINIMAL_REVENUE_THRESHOLD;
  const m = inputs.metrics;

  const checklist: Array<[string, boolean]> = preRevenue
    ? [
        ["stage", inputs.stage !== null],
        ["employees", Boolean(m.employees)],
        ["capital_raised_total", Boolean(m.capitalRaisedTotal)],
        ["burn_monthly", Boolean(m.burnMonthly)],
        ["runway_months", Boolean(m.runwayMonths)],
        ["customers", Boolean(m.customers)],
      ]
    : [
        ["revenue", Boolean(rev)],
        ["growth", effectiveGrowth(inputs) !== null],
        ["gross_margin", Boolean(m.grossMargin)],
        ["burn_monthly", Boolean(m.burnMonthly)],
        ["runway_months", Boolean(m.runwayMonths)],
        ["customers", Boolean(m.customers)],
        ["employees", Boolean(m.employees)],
        ["capital_raised_total", Boolean(m.capitalRaisedTotal)],
      ];

  const present = checklist.filter(([, ok]) => ok).map(([k]) => k);
  const missing = checklist.filter(([, ok]) => !ok).map(([k]) => k);
  return { score: present.length / checklist.length, present, missing, preRevenue };
}

const IMPROVEMENT_HINTS: Record<string, string> = {
  revenue: "Add trailing 12-month revenue or ARR",
  growth: "Add year-over-year growth, or a second historical revenue point",
  gross_margin: "Add gross margin",
  burn_monthly: "Add monthly burn",
  runway_months: "Add current runway",
  customers: "Add customer count",
  employees: "Add team size",
  capital_raised_total: "Add total capital raised",
  stage: "Set your company stage",
};

function hintsFor(missing: string[], extra: string[] = []): string[] {
  return [...missing.map((k) => IMPROVEMENT_HINTS[k]).filter(Boolean), ...extra];
}

/* -------------------------------------------------------------------------- */
/* Component models                                                           */
/* -------------------------------------------------------------------------- */

function spreadFor(completeness: number): number {
  if (completeness >= 0.75) return COMPONENT_SPREAD.strongData;
  if (completeness >= 0.5) return COMPONENT_SPREAD.moderateData;
  return COMPONENT_SPREAD.limitedData;
}

function revenueMultipleComponent(inputs: ValuationInputs, completeness: Completeness): ComponentResult {
  const rev = primaryRevenue(inputs);
  if (!rev || rev.value < MINIMAL_REVENUE_THRESHOLD) {
    return {
      key: "revenue_multiple",
      status: "not_applicable",
      weight: 0,
      detail: { reason: "No meaningful recurring/annual revenue reported" },
    };
  }
  const base = inputs.businessModel
    ? BASE_REVENUE_MULTIPLES[inputs.businessModel]
    : BASE_REVENUE_MULTIPLES.other;

  const growth = effectiveGrowth(inputs);
  const growthFactor = growth
    ? clamp(
        1 + (growth.pct - GROWTH_ADJUSTMENT.neutralGrowthPct) * GROWTH_ADJUSTMENT.slopePerPoint,
        GROWTH_ADJUSTMENT.min,
        GROWTH_ADJUSTMENT.max,
      )
    : 1.0;

  const margin = inputs.metrics.grossMargin?.value;
  const marginFactor =
    margin !== undefined
      ? clamp(
          1 + (margin - MARGIN_ADJUSTMENT.neutralMarginPct) * MARGIN_ADJUSTMENT.slopePerPoint,
          MARGIN_ADJUSTMENT.min,
          MARGIN_ADJUSTMENT.max,
        )
      : 1.0;

  const indFactor = industryModifier(inputs.industry);
  const effectiveMultiple = base * growthFactor * marginFactor * indFactor;
  const mid = rev.value * effectiveMultiple;
  const spread = spreadFor(completeness.score);

  return {
    key: "revenue_multiple",
    status: "applied",
    low: mid * (1 - spread),
    high: mid * (1 + spread),
    mid,
    weight: 1,
    detail: {
      revenue: rev.value,
      revenueSource: rev.source,
      currency: rev.currency,
      baseMultiple: base,
      growthPct: growth?.pct ?? null,
      growthSource: growth?.source ?? "unavailable",
      growthFactor: Number(growthFactor.toFixed(3)),
      marginFactor: Number(marginFactor.toFixed(3)),
      industryModifier: indFactor,
      effectiveMultiple: Number(effectiveMultiple.toFixed(2)),
      note: "Baseline multiples are Vantor model assumptions, not market data",
    },
  };
}

function profitabilityComponent(inputs: ValuationInputs, completeness: Completeness): ComponentResult {
  const profit = inputs.metrics.netProfitAnnual?.value;
  if (profit === undefined) {
    return {
      key: "profitability",
      status: "insufficient_data",
      weight: 0,
      detail: { reason: "No annual net profit reported" },
    };
  }
  if (profit <= 0) {
    return {
      key: "profitability",
      status: "not_applicable",
      weight: 0,
      detail: { reason: "Company is not currently profitable; earnings model not meaningful" },
    };
  }
  const growth = effectiveGrowth(inputs);
  const growthFactor = clamp(
    1 + (growth?.pct ?? 0) * EARNINGS_MULTIPLE.growthSlopePerPoint,
    EARNINGS_MULTIPLE.min,
    EARNINGS_MULTIPLE.max,
  );
  const multiple = EARNINGS_MULTIPLE.base * growthFactor;
  const mid = profit * multiple;
  const spread = spreadFor(completeness.score);
  return {
    key: "profitability",
    status: "applied",
    low: mid * (1 - spread),
    high: mid * (1 + spread),
    mid,
    weight: 1,
    detail: {
      netProfitAnnual: profit,
      baseEarningsMultiple: EARNINGS_MULTIPLE.base,
      growthFactor: Number(growthFactor.toFixed(3)),
      effectiveMultiple: Number(multiple.toFixed(2)),
      note: "Earnings multiple is a Vantor model assumption, not market data",
    },
  };
}

function stageBaselineComponent(inputs: ValuationInputs, completeness: Completeness): ComponentResult {
  const rev = primaryRevenue(inputs);
  if (rev && rev.value >= MINIMAL_REVENUE_THRESHOLD) {
    return {
      key: "stage_baseline",
      status: "not_applicable",
      weight: 0,
      detail: { reason: "Company has meaningful revenue; revenue methodologies apply instead" },
    };
  }
  if (!inputs.stage) {
    return {
      key: "stage_baseline",
      status: "insufficient_data",
      weight: 0,
      detail: { reason: "Company stage not set" },
    };
  }

  const baseline = STAGE_BASELINES[inputs.stage];
  const adj = STAGE_BASELINE_ADJUSTMENTS;
  const indFactor = industryModifier(inputs.industry);

  const employees = inputs.metrics.employees?.value ?? 0;
  const teamFactor = 1 + clamp(employees * adj.perEmployeePct, 0, adj.teamBonusCapPct);
  const tractionFactor = (inputs.metrics.customers?.value ?? 0) > 0 ? 1 + adj.tractionBonusPct : 1;

  let low = baseline.low * indFactor * teamFactor * tractionFactor;
  let high = baseline.high * indFactor * teamFactor * tractionFactor;

  // Capital-raised floor: an estimate far below what credible investors
  // already paid in is usually wrong; note it, don't hide it.
  const raised = inputs.metrics.capitalRaisedTotal?.value;
  let capitalFloorApplied = false;
  if (raised && raised > 0) {
    const floor = raised * adj.capitalRaisedFloorShare;
    if (low < floor) {
      low = floor;
      high = Math.max(high, floor * 1.5);
      capitalFloorApplied = true;
    }
  }

  const mid = (low + high) / 2;
  return {
    key: "stage_baseline",
    status: "applied",
    low,
    high,
    mid,
    weight: 1,
    detail: {
      stage: inputs.stage,
      baselineLow: baseline.low,
      baselineHigh: baseline.high,
      industryModifier: indFactor,
      teamFactor: Number(teamFactor.toFixed(3)),
      tractionFactor,
      capitalRaised: raised ?? null,
      capitalFloorApplied,
      completeness: Number(completeness.score.toFixed(2)),
      note: "Stage baselines are Vantor model assumptions; pre-revenue estimates are inherently uncertain",
    },
  };
}

function comparablesComponent(): ComponentResult {
  // Vantor holds no proprietary private-transaction dataset yet. This
  // component exists so the interface, storage, and UI are ready — it must
  // report honestly rather than fabricate comparable data.
  return {
    key: "comparables",
    status: "insufficient_data",
    weight: 0,
    detail: {
      reason: "Insufficient comparable transaction data",
      note: "Vantor does not fabricate comparable-company data; this model activates when a legitimate comparables dataset exists",
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Risk adjustments                                                           */
/* -------------------------------------------------------------------------- */

export function assessRisk(inputs: ValuationInputs): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const m = inputs.metrics;
  const rev = primaryRevenue(inputs);
  const growth = effectiveGrowth(inputs);

  const runway = m.runwayMonths?.value;
  if (runway !== undefined && runway < RISK_RULES.lowRunway.thresholdMonths) {
    flags.push({ key: "low_runway", label: RISK_RULES.lowRunway.label, impactPct: RISK_RULES.lowRunway.impactPct });
  }

  if (m.burnMonthly && rev && rev.value >= MINIMAL_REVENUE_THRESHOLD) {
    const burnMultiple = (m.burnMonthly.value * 12) / rev.value;
    if (burnMultiple > RISK_RULES.highBurn.burnMultipleThreshold) {
      flags.push({ key: "high_burn", label: RISK_RULES.highBurn.label, impactPct: RISK_RULES.highBurn.impactPct });
    }
  }

  if (growth && growth.pct < RISK_RULES.decliningRevenue.thresholdGrowthPct) {
    flags.push({
      key: "declining_revenue",
      label: RISK_RULES.decliningRevenue.label,
      impactPct: RISK_RULES.decliningRevenue.impactPct,
    });
  }

  const concentration = m.topCustomerRevenuePct?.value;
  if (concentration !== undefined && concentration >= RISK_RULES.customerConcentration.thresholdPct) {
    flags.push({
      key: "customer_concentration",
      label: RISK_RULES.customerConcentration.label,
      impactPct: RISK_RULES.customerConcentration.impactPct,
    });
  }

  const margin = m.grossMargin?.value;
  if (
    margin !== undefined &&
    margin < RISK_RULES.weakMargins.thresholdPct &&
    inputs.businessModel &&
    RISK_RULES.weakMargins.appliesTo.includes(inputs.businessModel)
  ) {
    flags.push({ key: "weak_margins", label: RISK_RULES.weakMargins.label, impactPct: RISK_RULES.weakMargins.impactPct });
  }

  return flags;
}

function riskFactor(flags: RiskFlag[]): number {
  const combined = flags.reduce((f, flag) => f * (1 + flag.impactPct / 100), 1);
  return Math.max(combined, RISK_RULES.totalFloorFactor);
}

/* -------------------------------------------------------------------------- */
/* Confidence                                                                 */
/* -------------------------------------------------------------------------- */

function confidenceScore(args: {
  completeness: Completeness;
  applied: ComponentResult[];
  inputs: ValuationInputs;
  fresh: boolean;
}): number {
  const R = CONFIDENCE_RULES;
  const { completeness, applied, inputs, fresh } = args;
  let score = R.base + completeness.score * R.completenessWeight;

  score += applied.length >= 2 ? R.multiModelBonus : R.singleModelBonus;

  if (applied.length >= 2) {
    const mids = applied.map((c) => c.mid ?? 0).filter((v) => v > 0);
    const ratio = Math.max(...mids) / Math.min(...mids);
    if (ratio <= R.agreementRatios.tight) score += R.agreement.tight;
    else if (ratio <= R.agreementRatios.moderate) score += R.agreement.moderate;
    else if (ratio <= R.agreementRatios.loose) score += R.agreement.loose;
    else score += R.agreement.disagreement;
  }

  const revenueSeries = inputs.metrics.arr ?? inputs.metrics.revenueAnnual;
  if (revenueSeries && revenueSeries.length >= 2) score += R.revenueHistoryBonus;

  score += fresh ? R.freshBonus : R.stalePenalty;

  const verifiedRelevant = inputs.verifiedCategories.filter((c) =>
    R.verificationCategories.includes(c),
  );
  score += Math.min(
    verifiedRelevant.length * R.verificationBonusPerCategory,
    R.verificationBonusCap,
  );

  if (completeness.preRevenue) score = Math.min(score, R.preRevenueCap);
  return Math.round(clamp(score, R.clampMin, R.clampMax));
}

/* -------------------------------------------------------------------------- */
/* Engine                                                                     */
/* -------------------------------------------------------------------------- */

export function runValuationEngine(inputs: ValuationInputs): ValuationResult {
  const completeness = assessCompleteness(inputs);

  const components: ComponentResult[] = [
    revenueMultipleComponent(inputs, completeness),
    profitabilityComponent(inputs, completeness),
    stageBaselineComponent(inputs, completeness),
    comparablesComponent(),
  ];
  const applied = components.filter((c) => c.status === "applied");

  /* ------------------------- Insufficient data path ------------------------ */
  if (applied.length === 0) {
    const reasons: string[] = [];
    if (!inputs.stage) reasons.push("Company stage is not set");
    if (!primaryRevenue(inputs)) reasons.push("No revenue metrics reported");
    if (completeness.score === 0) reasons.push("No usable metrics reported");
    if (reasons.length === 0) reasons.push("Reported data is not sufficient for a responsible estimate");
    return {
      status: "insufficient_data",
      dataSufficiency: "insufficient",
      reasons,
      improvementHints: hintsFor(completeness.missing),
      components,
      engineVersion: ENGINE_VERSION,
      assumptionsVersion: ASSUMPTIONS_VERSION,
    };
  }

  /* ------------------------------- Blending -------------------------------- */
  // Weights: revenue+profitability blend per assumptions; otherwise the
  // single applied model carries full weight. (Comparables never applies
  // in V1; stage baseline and revenue models are mutually exclusive.)
  const revenueC = applied.find((c) => c.key === "revenue_multiple");
  const profitC = applied.find((c) => c.key === "profitability");
  if (revenueC && profitC) {
    revenueC.weight = COMPONENT_WEIGHTS.revenueWithProfit.revenue_multiple;
    profitC.weight = COMPONENT_WEIGHTS.revenueWithProfit.profitability;
  } else {
    for (const c of applied) c.weight = 1 / applied.length;
  }

  // Outlier handling: if applied models disagree wildly (>3x between
  // midpoints), do not average blindly — widen the final range to span both
  // models and let the confidence agreement penalty reflect the dispersion.
  const totalWeight = applied.reduce((s, c) => s + c.weight, 0);
  let low = applied.reduce((s, c) => s + (c.low ?? 0) * c.weight, 0) / totalWeight;
  let high = applied.reduce((s, c) => s + (c.high ?? 0) * c.weight, 0) / totalWeight;
  let mid = applied.reduce((s, c) => s + (c.mid ?? 0) * c.weight, 0) / totalWeight;

  let outlierWidening = false;
  if (applied.length >= 2) {
    const mids = applied.map((c) => c.mid ?? 0);
    const ratio = Math.max(...mids) / Math.min(...mids);
    if (ratio > CONFIDENCE_RULES.agreementRatios.loose) {
      low = Math.min(...applied.map((c) => c.low ?? Infinity));
      high = Math.max(...applied.map((c) => c.high ?? 0));
      mid = clamp(mid, low, high);
      outlierWidening = true;
    }
  }

  /* ---------------------------- Risk adjustment ---------------------------- */
  const riskFlags = assessRisk(inputs);
  const factor = riskFactor(riskFlags);
  low *= factor;
  high *= factor;
  mid *= factor;

  /* ------------------------------ Freshness -------------------------------- */
  const anchor =
    primaryRevenue(inputs)?.asOf ??
    inputs.metrics.employees?.asOf ??
    inputs.metrics.capitalRaisedTotal?.asOf;
  const fresh = anchor
    ? monthsBetween(anchor, inputs.asOfToday) <= CONFIDENCE_RULES.staleAfterMonths
    : false;

  /* ------------------------------ Confidence ------------------------------- */
  const confidence = confidenceScore({ completeness, applied, inputs, fresh });

  const sufficiency: Exclude<DataSufficiency, "insufficient"> = completeness.preRevenue
    ? "limited"
    : completeness.score >= 0.75 &&
        (inputs.metrics.arr?.length ?? inputs.metrics.revenueAnnual?.length ?? 0) >= 2
      ? "strong"
      : completeness.score >= 0.5
        ? "moderate"
        : "limited";

  const currency = primaryRevenue(inputs)?.currency ?? "USD";

  const extraHints: string[] = [];
  if (!fresh) extraHints.push("Update your metrics. The newest reported values are over a year old");
  if (outlierWidening) extraHints.push("Model outputs disagree; more complete financials would narrow the range");

  return {
    status: "completed",
    currency,
    low: round3sig(low),
    high: round3sig(high),
    mid: round3sig(clamp(mid, low, high)),
    confidence,
    dataSufficiency: sufficiency,
    components,
    riskFlags,
    improvementHints: hintsFor(completeness.missing, extraHints),
    engineVersion: ENGINE_VERSION,
    assumptionsVersion: ASSUMPTIONS_VERSION,
  };
}

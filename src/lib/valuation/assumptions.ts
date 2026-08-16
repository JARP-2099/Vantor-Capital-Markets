import type { BusinessModel, CompanyStage } from "@/lib/constants";

/**
 * VANTOR VALUATION ASSUMPTIONS — vantor-assumptions-v1
 *
 * Every baseline number the engine uses lives HERE and nowhere else.
 *
 * STATUS OF THESE NUMBERS: these are internal model assumptions chosen by
 * Vantor to produce conservative, internally consistent estimates. They are
 * NOT market data, NOT derived from a transaction dataset (none exists yet —
 * see the comparables component, which reports insufficient data rather than
 * inventing comps), and they carry no external authority. They are versioned
 * so that when they change, historical valuation runs remain interpretable,
 * and they are structured so a future admin surface can manage them.
 */

export const ASSUMPTIONS_VERSION = "vantor-assumptions-v1";

/** Base ARR/revenue multiples by business model (unitless). */
export const BASE_REVENUE_MULTIPLES: Record<BusinessModel, number> = {
  subscription: 5.0,
  transactional: 3.0,
  marketplace: 4.0,
  ecommerce: 1.5,
  hardware: 2.0,
  services: 1.5,
  advertising: 2.5,
  licensing: 3.0,
  other: 2.0,
};

/** Multiplicative industry modifiers applied to revenue/stage estimates. */
export const INDUSTRY_MODIFIERS: Record<string, number> = {
  "Artificial Intelligence": 1.3,
  Cybersecurity: 1.2,
  "Aerospace & Defense": 1.15,
  "Developer Tools": 1.15,
  Healthcare: 1.1,
  "Financial Services": 1.1,
  Biotechnology: 1.1,
  "Climate & Energy": 1.05,
  Robotics: 1.05,
};
export const DEFAULT_INDUSTRY_MODIFIER = 1.0;

/**
 * Growth adjustment for revenue multiples. Anchored at 20% YoY = neutral;
 * each point above/below shifts the multiple by 0.8%/point, clamped so
 * hypergrowth cannot produce unbounded multiples and decline cannot take
 * the multiple below half its base.
 */
export const GROWTH_ADJUSTMENT = {
  neutralGrowthPct: 20,
  slopePerPoint: 0.008,
  min: 0.5,
  max: 2.5,
};

/** Gross-margin adjustment: 50% margin = neutral, ±0.4%/point, clamped. */
export const MARGIN_ADJUSTMENT = {
  neutralMarginPct: 50,
  slopePerPoint: 0.004,
  min: 0.8,
  max: 1.15,
};

/** Earnings multiple for the profitability model (applied to net profit). */
export const EARNINGS_MULTIPLE = {
  base: 12,
  growthSlopePerPoint: 0.005, // growth above 0% raises it slightly
  min: 0.8, // as a multiplier of base
  max: 2.0,
};

/**
 * Pre-revenue stage baseline ranges (USD). Deliberately wide and
 * conservative; adjusted by capital raised, team, traction, industry.
 */
export const STAGE_BASELINES: Record<CompanyStage, { low: number; high: number }> = {
  idea: { low: 100_000, high: 600_000 },
  pre_seed: { low: 400_000, high: 1_500_000 },
  seed: { low: 1_000_000, high: 4_000_000 },
  series_a: { low: 3_000_000, high: 10_000_000 },
  series_b: { low: 8_000_000, high: 25_000_000 },
  growth: { low: 15_000_000, high: 50_000_000 },
  established: { low: 10_000_000, high: 40_000_000 },
};

export const STAGE_BASELINE_ADJUSTMENTS = {
  /** Floor: estimate low should not sit below this share of capital raised. */
  capitalRaisedFloorShare: 0.6,
  /** Per employee bonus, capped. */
  perEmployeePct: 0.02,
  teamBonusCapPct: 0.2,
  /** Bonus when the company already has customers/users. */
  tractionBonusPct: 0.1,
};

/** Revenue level (USD-equivalent ARR) below which the stage model applies. */
export const MINIMAL_REVENUE_THRESHOLD = 50_000;

/** Blend weights when multiple components apply. */
export const COMPONENT_WEIGHTS = {
  revenueWithProfit: { revenue_multiple: 0.6, profitability: 0.4 },
};

/** Risk adjustments (all negative percentages, applied multiplicatively). */
export const RISK_RULES = {
  lowRunway: { thresholdMonths: 6, impactPct: -15, label: "Runway under 6 months" },
  highBurn: {
    /** Annualized burn / ARR ratio above which the flag applies. */
    burnMultipleThreshold: 2,
    impactPct: -10,
    label: "Burn is high relative to revenue",
  },
  decliningRevenue: { thresholdGrowthPct: -5, impactPct: -20, label: "Declining revenue" },
  customerConcentration: {
    thresholdPct: 40,
    impactPct: -10,
    label: "Revenue concentrated in a top customer",
  },
  weakMargins: {
    thresholdPct: 20,
    impactPct: -5,
    label: "Low gross margin for the business model",
    appliesTo: ["subscription"] as BusinessModel[],
  },
  /** Combined risk impact never reduces the estimate below 60% of pre-risk. */
  totalFloorFactor: 0.6,
};

/** Spread applied around a component's central estimate to form its range. */
export const COMPONENT_SPREAD = {
  strongData: 0.12,
  moderateData: 0.2,
  limitedData: 0.35,
};

/** Confidence scoring — see docs/VALUATION_METHODOLOGY.md. */
export const CONFIDENCE_RULES = {
  base: 20,
  completenessWeight: 40, // completeness (0..1) × this
  singleModelBonus: 5,
  multiModelBonus: 12,
  agreement: { tight: 10, moderate: 5, loose: 0, disagreement: -15 },
  agreementRatios: { tight: 1.3, moderate: 2.0, loose: 3.0 },
  revenueHistoryBonus: 8,
  freshBonus: 5,
  stalePenalty: -10,
  staleAfterMonths: 12,
  verificationBonusPerCategory: 6,
  verificationBonusCap: 10,
  verificationCategories: ["revenue", "financial_statements"],
  preRevenueCap: 55,
  clampMin: 5,
  clampMax: 95,
};

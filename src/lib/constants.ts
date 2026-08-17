/**
 * Controlled vocabularies and display labels shared by forms, filters, and
 * profile rendering. Enum values must stay in sync with src/db/schema.
 */

export const INDUSTRIES = [
  "Aerospace & Defense",
  "Agriculture",
  "Artificial Intelligence",
  "Biotechnology",
  "Climate & Energy",
  "Construction",
  "Consumer",
  "Cybersecurity",
  "Developer Tools",
  "Education",
  "Financial Services",
  "Food & Beverage",
  "Government & Public Sector",
  "Hardware",
  "Healthcare",
  "Industrial",
  "Insurance",
  "Legal",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Media & Entertainment",
  "Real Estate",
  "Retail",
  "Robotics",
  "Software",
  "Transportation",
  "Travel & Hospitality",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const COMPANY_STAGES = [
  "idea",
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "growth",
  "established",
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number];

export const STAGE_LABELS: Record<CompanyStage, string> = {
  idea: "Idea",
  pre_seed: "Pre-Seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  growth: "Growth",
  established: "Established",
};

export const BUSINESS_MODELS = [
  "subscription",
  "transactional",
  "marketplace",
  "ecommerce",
  "hardware",
  "services",
  "advertising",
  "licensing",
  "other",
] as const;
export type BusinessModel = (typeof BUSINESS_MODELS)[number];

export const BUSINESS_MODEL_LABELS: Record<BusinessModel, string> = {
  subscription: "Subscription / SaaS",
  transactional: "Transactional",
  marketplace: "Marketplace",
  ecommerce: "E-commerce",
  hardware: "Hardware",
  services: "Services",
  advertising: "Advertising",
  licensing: "Licensing",
  other: "Other",
};

export const COMPANY_INTENTS = [
  "not_raising",
  "seeking_investment",
  "open_to_strategic_investment",
  "open_to_minority_investment",
  "open_to_majority_acquisition",
  "open_to_full_acquisition",
  "open_to_acquisition_offers",
] as const;
export type CompanyIntent = (typeof COMPANY_INTENTS)[number];

/**
 * Careful, non-promissory wording: these describe a company's openness to
 * conversations, never an active regulated offering.
 */
export const INTENT_LABELS: Record<CompanyIntent, string> = {
  not_raising: "Not currently raising",
  seeking_investment: "Seeking investment",
  open_to_strategic_investment: "Open to strategic investment",
  open_to_minority_investment: "Open to minority investment",
  open_to_majority_acquisition: "Open to majority acquisition",
  open_to_full_acquisition: "Open to full acquisition",
  open_to_acquisition_offers: "Open to acquisition offers",
};

/** Short status label shown on cards; only a subset is surfaced publicly. */
export const PUBLIC_INTENT_BADGES: Partial<Record<CompanyIntent, string>> = {
  seeking_investment: "Seeking Capital",
  open_to_strategic_investment: "Open to Strategic Investment",
  open_to_acquisition_offers: "Open to Offers",
  not_raising: "Not Raising",
};

export const METRIC_TYPES = [
  "revenue_annual",
  "arr",
  "mrr",
  "revenue_growth_yoy",
  "customers",
  "employees",
  "burn_monthly",
  "runway_months",
  "net_profit_annual",
  "gross_margin",
  "capital_raised_total",
  "top_customer_revenue_pct",
] as const;
export type MetricType = (typeof METRIC_TYPES)[number];

export const METRIC_LABELS: Record<MetricType, string> = {
  revenue_annual: "Annual Revenue",
  arr: "ARR",
  mrr: "MRR",
  revenue_growth_yoy: "Revenue Growth (YoY)",
  customers: "Customers",
  employees: "Employees",
  burn_monthly: "Monthly Burn",
  runway_months: "Runway",
  net_profit_annual: "Net Profit (Annual)",
  gross_margin: "Gross Margin",
  capital_raised_total: "Capital Raised",
  top_customer_revenue_pct: "Top Customer % of Revenue",
};

/**
 * One-line founder-facing explanations of each metric, shown as form hints.
 * Plain language, no finance-textbook depth: enough that a founder who has
 * never heard "ARR" enters the right number in the right unit.
 */
export const METRIC_HELP: Record<MetricType, string> = {
  revenue_annual: "Total revenue for your last 12 months or last fiscal year.",
  arr: "Annual Recurring Revenue: current subscription revenue, annualized. For subscription businesses.",
  mrr: "Monthly Recurring Revenue: subscription revenue for a single month.",
  revenue_growth_yoy: "Revenue change versus a year earlier, as a percent. Enter 25 for 25% growth.",
  customers: "Number of paying customers as of the date entered.",
  employees: "Current headcount, founders included.",
  burn_monthly: "Net cash spent per month (expenses minus revenue). Enter a positive amount.",
  runway_months: "Months of cash remaining at your current burn rate.",
  net_profit_annual: "Profit after all expenses for the year. Negative if you operate at a loss.",
  gross_margin: "Percent of revenue kept after direct costs of delivery. Enter 70 for 70%.",
  capital_raised_total: "Total outside funding raised to date, across all rounds.",
  top_customer_revenue_pct: "Share of revenue from your single largest customer. Enter 30 for 30%.",
};

export const MONETARY_METRICS: ReadonlySet<MetricType> = new Set([
  "revenue_annual",
  "arr",
  "mrr",
  "burn_monthly",
  "net_profit_annual",
  "capital_raised_total",
]);

export const PERCENT_METRICS: ReadonlySet<MetricType> = new Set([
  "revenue_growth_yoy",
  "gross_margin",
  "top_customer_revenue_pct",
]);

export const COMPANY_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "published",
  "archived",
] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const STATUS_LABELS: Record<CompanyStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  published: "Published",
  archived: "Archived",
};

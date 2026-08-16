import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

/** Company listing lifecycle. Transitions are enforced in application code. */
export const companyStatusEnum = pgEnum("company_status", [
  "draft",
  "submitted",
  "under_review",
  "published",
  "archived",
]);

export const companyStageEnum = pgEnum("company_stage", [
  "idea",
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "growth",
  "established",
]);

export const businessModelEnum = pgEnum("business_model", [
  "subscription",
  "transactional",
  "marketplace",
  "ecommerce",
  "hardware",
  "services",
  "advertising",
  "licensing",
  "other",
]);

/**
 * High-level company intent. A company can hold several simultaneously
 * (e.g. seeking_investment + open_to_acquisition_offers), so intents live
 * in a join table rather than a single column.
 */
export const companyIntentEnum = pgEnum("company_intent", [
  "not_raising",
  "seeking_investment",
  "open_to_strategic_investment",
  "open_to_minority_investment",
  "open_to_majority_acquisition",
  "open_to_full_acquisition",
  "open_to_acquisition_offers",
]);

/**
 * Metric catalog. Metrics are historical rows, not columns on the company,
 * so values can carry period/provenance and later verification state without
 * schema rewrites.
 */
export const metricTypeEnum = pgEnum("metric_type", [
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
]);

export const companyMemberRoleEnum = pgEnum("company_member_role", ["founder", "team"]);

/* -------------------------------------------------------------------------- */
/* Companies                                                                  */
/* -------------------------------------------------------------------------- */

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /* Identity */
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    website: text("website"),
    shortDescription: text("short_description"),
    fullDescription: text("full_description"),
    foundedYear: integer("founded_year"),
    hqCity: text("hq_city"),
    hqCountry: text("hq_country"),
    industry: text("industry"),
    subindustry: text("subindustry"),
    businessModel: businessModelEnum("business_model"),
    stage: companyStageEnum("stage"),

    /* Story (structured narrative sections) */
    problem: text("problem"),
    solution: text("solution"),
    market: text("market"),
    competitivePosition: text("competitive_position"),
    businessModelDescription: text("business_model_description"),
    traction: text("traction"),
    roadmap: text("roadmap"),

    /* Lifecycle */
    status: companyStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at"),
    publishedAt: timestamp("published_at"),
    archivedAt: timestamp("archived_at"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    /** Feedback from admin review, shown to the founder on rejection. */
    reviewNotes: text("review_notes"),

    /** Marks seeded demo content so it can never mix silently with real data. */
    isDemo: boolean("is_demo").notNull().default(false),

    /** Founder-controlled: render the Vantor estimate on the public profile. */
    showPublicValuation: boolean("show_public_valuation").notNull().default(true),

    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("companies_slug_idx").on(t.slug),
    index("companies_status_idx").on(t.status),
    index("companies_industry_idx").on(t.industry),
    index("companies_stage_idx").on(t.stage),
    index("companies_created_by_idx").on(t.createdBy),
    check("companies_name_not_empty", sql`length(trim(${t.name})) > 0`),
    check("companies_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check(
      "companies_founded_year_sane",
      sql`${t.foundedYear} IS NULL OR (${t.foundedYear} >= 1800 AND ${t.foundedYear} <= 2100)`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Company intents (many per company)                                         */
/* -------------------------------------------------------------------------- */

export const companyIntents = pgTable(
  "company_intents",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    intent: companyIntentEnum("intent").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.intent] })],
);

/* -------------------------------------------------------------------------- */
/* Company members (founders + team, with or without platform accounts)      */
/* -------------------------------------------------------------------------- */

export const companyMembers = pgTable(
  "company_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    /** Null for team members listed on the profile who have no account. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    role: companyMemberRoleEnum("role").notNull().default("team"),
    title: text("title"),
    bio: text("bio"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("company_members_company_idx").on(t.companyId),
    index("company_members_user_idx").on(t.userId),
    // One membership row per user per company (profile-only rows may repeat names).
    uniqueIndex("company_members_company_user_idx")
      .on(t.companyId, t.userId)
      .where(sql`${t.userId} IS NOT NULL`),
    check("company_members_display_order_nonnegative", sql`${t.displayOrder} >= 0`),
    check("company_members_name_not_empty", sql`length(trim(${t.name})) > 0`),
  ],
);

/* -------------------------------------------------------------------------- */
/* Company metrics (historical, provenance-ready)                             */
/* -------------------------------------------------------------------------- */

export const companyMetrics = pgTable(
  "company_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    metricType: metricTypeEnum("metric_type").notNull(),
    /** Numeric value; interpretation depends on metricType + currency/unit. */
    value: numeric("value", { precision: 20, scale: 4 }).notNull(),
    /** ISO 4217 code for monetary metrics; null for counts/percentages. */
    currency: text("currency"),
    /** Date the value describes (end of period or measurement date). */
    asOf: date("as_of").notNull(),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    /** Founder-declared source; the Phase 3 verification engine attaches here. */
    source: text("source"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("company_metrics_lookup_idx").on(t.companyId, t.metricType, t.asOf),
    uniqueIndex("company_metrics_unique_point").on(t.companyId, t.metricType, t.asOf),
    check(
      "company_metrics_counts_nonnegative",
      sql`${t.metricType} NOT IN ('customers', 'employees', 'runway_months', 'capital_raised_total') OR ${t.value} >= 0`,
    ),
    check("company_metrics_currency_format", sql`${t.currency} IS NULL OR ${t.currency} ~ '^[A-Z]{3}$'`),
    check(
      "company_metrics_period_order",
      sql`${t.periodStart} IS NULL OR ${t.periodEnd} IS NULL OR ${t.periodStart} <= ${t.periodEnd}`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Funding rounds — Phase 9+ skeleton                                         */
/* -------------------------------------------------------------------------- */

/**
 * Structural placeholder so future regulated offerings have a home without a
 * disruptive migration. No application code writes to this table today and
 * nothing here is ever exposed publicly while regulatedOfferingsEnabled=false.
 */
export const fundingRounds = pgTable(
  "funding_rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    roundType: text("round_type"),
    status: text("status").notNull().default("draft"),
    targetAmount: numeric("target_amount", { precision: 20, scale: 2 }),
    amountCommitted: numeric("amount_committed", { precision: 20, scale: 2 }),
    currency: text("currency"),
    securityType: text("security_type"),
    minimumInvestment: numeric("minimum_investment", { precision: 20, scale: 2 }),
    opensAt: timestamp("opens_at"),
    closesAt: timestamp("closes_at"),
    valuationBasis: text("valuation_basis"),
    regulatoryExemption: text("regulatory_exemption"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("funding_rounds_company_idx").on(t.companyId)],
);

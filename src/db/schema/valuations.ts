import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { companies } from "./companies";

/**
 * Valuation engine persistence. Every run is an immutable historical record:
 * new runs never overwrite old ones, and each run pins the engine version,
 * assumptions version, and the exact input snapshot it was computed from,
 * so history stays interpretable when the methodology evolves.
 */

export const valuationDataSufficiencyEnum = pgEnum("valuation_data_sufficiency", [
  "strong",
  "moderate",
  "limited",
  "insufficient",
]);

export const valuationRunStatusEnum = pgEnum("valuation_run_status", [
  "completed",
  "insufficient_data",
  "failed",
]);

export const valuationComponentStatusEnum = pgEnum("valuation_component_status", [
  "applied",
  "not_applicable",
  "insufficient_data",
]);

export const valuationRuns = pgTable(
  "valuation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    /** e.g. "vantor-valuation-v1" — mandatory for historical interpretability. */
    engineVersion: text("engine_version").notNull(),
    /** e.g. "vantor-assumptions-v1" — which baseline assumption set was used. */
    assumptionsVersion: text("assumptions_version").notNull(),
    status: valuationRunStatusEnum("status").notNull(),
    dataSufficiency: valuationDataSufficiencyEnum("data_sufficiency").notNull(),
    currency: text("currency").notNull().default("USD"),
    /** Null when status != completed. Rounded to 3 significant figures. */
    valuationLow: numeric("valuation_low", { precision: 20, scale: 2 }),
    valuationHigh: numeric("valuation_high", { precision: 20, scale: 2 }),
    valuationMid: numeric("valuation_mid", { precision: 20, scale: 2 }),
    /** 0–100; confidence in the ESTIMATE, never investment quality. */
    confidence: integer("confidence"),
    /** Exact engine inputs used (metrics, company facts) — auditability. */
    inputSnapshot: jsonb("input_snapshot").notNull(),
    /** Applied risk adjustments: [{key,label,impactPct}]. */
    riskFlags: jsonb("risk_flags"),
    /** Reasons when insufficient; founder-facing improvement hints. */
    insufficiencyReasons: jsonb("insufficiency_reasons"),
    /** Null for system-triggered runs. */
    requestedBy: text("requested_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("valuation_runs_company_idx").on(t.companyId, t.createdAt),
    check("valuation_runs_confidence_range", sql`${t.confidence} IS NULL OR (${t.confidence} >= 0 AND ${t.confidence} <= 100)`),
    check(
      "valuation_runs_range_order",
      sql`${t.valuationLow} IS NULL OR ${t.valuationHigh} IS NULL OR (${t.valuationLow} <= ${t.valuationHigh})`,
    ),
    check(
      "valuation_runs_mid_in_range",
      sql`${t.valuationMid} IS NULL OR ((${t.valuationLow} IS NULL OR ${t.valuationMid} >= ${t.valuationLow}) AND (${t.valuationHigh} IS NULL OR ${t.valuationMid} <= ${t.valuationHigh}))`,
    ),
    check("valuation_runs_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    check(
      "valuation_runs_values_finite",
      sql`(${t.valuationLow} IS NULL OR ${t.valuationLow} <> 'NaN'::numeric) AND (${t.valuationHigh} IS NULL OR ${t.valuationHigh} <> 'NaN'::numeric) AND (${t.valuationMid} IS NULL OR ${t.valuationMid} <> 'NaN'::numeric)`,
    ),
    // A completed run must carry its range; renderers Number() these columns
    // and NULL would otherwise display as $0.
    check(
      "valuation_runs_completed_has_range",
      sql`${t.status} <> 'completed' OR (${t.valuationLow} IS NOT NULL AND ${t.valuationHigh} IS NOT NULL AND ${t.valuationMid} IS NOT NULL AND ${t.confidence} IS NOT NULL)`,
    ),
  ],
);

export const valuationComponents = pgTable(
  "valuation_components",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => valuationRuns.id, { onDelete: "cascade" }),
    /** Stable key: revenue_multiple | profitability | stage_baseline | comparables. */
    componentKey: text("component_key").notNull(),
    status: valuationComponentStatusEnum("status").notNull(),
    valuationLow: numeric("valuation_low", { precision: 20, scale: 2 }),
    valuationHigh: numeric("valuation_high", { precision: 20, scale: 2 }),
    valuationMid: numeric("valuation_mid", { precision: 20, scale: 2 }),
    /** Blend weight actually used (0 when not applied). */
    weight: numeric("weight", { precision: 6, scale: 4 }),
    /** Human-readable explanation payload (inputs, multiple used, notes). */
    detail: jsonb("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("valuation_components_run_key_idx").on(t.runId, t.componentKey)],
);

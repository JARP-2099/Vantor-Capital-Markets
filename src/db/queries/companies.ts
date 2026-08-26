import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  companyIntents,
  companyMembers,
  companyMetrics,
  valuationRuns,
} from "@/db/schema";
import type { CompanyIntent, CompanyStage, MetricType } from "@/lib/constants";

/**
 * Shared company read layer. All marketplace/profile/founder reads go through
 * here so visibility rules live in exactly one place:
 *   - Public surfaces may only ever see status='published' rows.
 *   - Founder surfaces must scope by ownership (see authz.ts).
 */

export type CompanyRow = typeof companies.$inferSelect;
export type CompanyMetricRow = typeof companyMetrics.$inferSelect;
export type CompanyMemberRow = typeof companyMembers.$inferSelect;

/** Latest value per metric type for a set of companies (no N+1). */
export async function getLatestMetrics(
  companyIds: string[],
): Promise<Map<string, Map<MetricType, CompanyMetricRow>>> {
  const result = new Map<string, Map<MetricType, CompanyMetricRow>>();
  if (companyIds.length === 0) return result;

  const rows = await db
    .select()
    .from(companyMetrics)
    .where(inArray(companyMetrics.companyId, companyIds))
    .orderBy(
      companyMetrics.companyId,
      companyMetrics.metricType,
      desc(companyMetrics.asOf),
      desc(companyMetrics.createdAt),
    );

  for (const row of rows) {
    let byType = result.get(row.companyId);
    if (!byType) {
      byType = new Map();
      result.set(row.companyId, byType);
    }
    // Rows arrive newest-first per type; keep only the first (latest).
    if (!byType.has(row.metricType as MetricType)) {
      byType.set(row.metricType as MetricType, row);
    }
  }
  return result;
}

export async function getCompanyIntents(companyIds: string[]): Promise<Map<string, CompanyIntent[]>> {
  const result = new Map<string, CompanyIntent[]>();
  if (companyIds.length === 0) return result;
  const rows = await db
    .select()
    .from(companyIntents)
    .where(inArray(companyIntents.companyId, companyIds));
  for (const row of rows) {
    const list = result.get(row.companyId) ?? [];
    list.push(row.intent as CompanyIntent);
    result.set(row.companyId, list);
  }
  return result;
}

/** Full metric history for one company, newest first within each type. */
export async function getCompanyMetricHistory(companyId: string): Promise<CompanyMetricRow[]> {
  return db
    .select()
    .from(companyMetrics)
    .where(eq(companyMetrics.companyId, companyId))
    .orderBy(
      companyMetrics.metricType,
      desc(companyMetrics.asOf),
      desc(companyMetrics.createdAt),
    );
}

export async function getCompanyMembers(companyId: string): Promise<CompanyMemberRow[]> {
  return db
    .select()
    .from(companyMembers)
    .where(eq(companyMembers.companyId, companyId))
    .orderBy(asc(companyMembers.displayOrder), asc(companyMembers.createdAt));
}

/* -------------------------------------------------------------------------- */
/* Public marketplace                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Whether fictional demo companies are hidden from public surfaces.
 * Hidden on any production deployment (real investors must never mistake
 * seeded fiction for a real business); visible in development and on Vercel
 * Preview so the product can be demonstrated and tested. Vercel Preview
 * builds run with NODE_ENV=production, so VERCEL_ENV — when present — is
 * the more precise signal and wins; NODE_ENV is the fail-safe for
 * non-Vercel production hosting, where no VERCEL_ENV exists.
 * HIDE_DEMO_COMPANIES=true forces hiding anywhere and
 * HIDE_DEMO_COMPANIES=false forces showing anywhere (explicit operational
 * overrides; tests use the former).
 */
export function demoCompaniesHidden(): boolean {
  const override = process.env.HIDE_DEMO_COMPANIES;
  if (override === "true") return true;
  if (override === "false") return false;
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === "production";
  return process.env.NODE_ENV === "production";
}

/** WHERE conditions every public company read must satisfy. */
function publicVisibilityConditions(): SQL[] {
  const conditions: SQL[] = [eq(companies.status, "published")];
  if (demoCompaniesHidden()) conditions.push(eq(companies.isDemo, false));
  return conditions;
}

/**
 * Marketplace sort options. Every option orders by data that legitimately
 * exists; companies missing the sorted value go last (NULLS LAST), never
 * ranked by a fabricated zero. This whitelist is the server-side boundary
 * for the user-controlled sort parameter — anything else falls back to the
 * default in the page layer.
 */
export const MARKETPLACE_SORTS = ["newest", "updated", "revenue", "growth", "valuation"] as const;
export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number];

export const MARKETPLACE_SORT_LABELS: Record<MarketplaceSort, string> = {
  newest: "Newly added",
  updated: "Recently updated",
  revenue: "Revenue",
  growth: "Revenue growth",
  valuation: "Est. valuation",
};

export const DEFAULT_MARKETPLACE_SORT: MarketplaceSort = "newest";

export type MarketplaceFilters = {
  q?: string;
  industry?: string;
  stage?: CompanyStage;
  country?: string;
  intent?: CompanyIntent;
  sort?: MarketplaceSort;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

/**
 * Latest revenue figure per company, annualized for comparability: ARR is
 * preferred over annual revenue over MRR (mirroring pickRevenueMetric), and
 * MRR is multiplied by 12 so a company reporting monthly revenue is not
 * ranked an order of magnitude below its peers. Currencies are compared
 * numerically without FX conversion — a documented platform limitation.
 */
const latestRevenueSql = sql`(
  SELECT cm.value * (CASE WHEN cm.metric_type = 'mrr' THEN 12 ELSE 1 END)
  FROM ${companyMetrics} cm
  WHERE cm.company_id = ${companies.id}
    AND cm.metric_type IN ('arr', 'revenue_annual', 'mrr')
  ORDER BY CASE cm.metric_type WHEN 'arr' THEN 0 WHEN 'revenue_annual' THEN 1 ELSE 2 END,
    cm.as_of DESC, cm.created_at DESC
  LIMIT 1)`;

const latestGrowthSql = sql`(
  SELECT cm.value
  FROM ${companyMetrics} cm
  WHERE cm.company_id = ${companies.id} AND cm.metric_type = 'revenue_growth_yoy'
  ORDER BY cm.as_of DESC, cm.created_at DESC
  LIMIT 1)`;

/**
 * Latest completed valuation midpoint — but only when the founder shows the
 * valuation publicly. A hidden valuation must not influence public ordering,
 * or the ordering itself would leak the hidden number's magnitude.
 */
const latestPublicValuationSql = sql`(
  CASE WHEN ${companies.showPublicValuation} THEN (
    SELECT vr.valuation_mid
    FROM ${valuationRuns} vr
    WHERE vr.company_id = ${companies.id} AND vr.status = 'completed'
    ORDER BY vr.created_at DESC
    LIMIT 1)
  END)`;

/** ORDER BY terms per sort; all end in a unique id tiebreak so pagination is stable. */
function orderTermsFor(sort: MarketplaceSort): SQL[] {
  const recencyTiebreak = [desc(companies.publishedAt), desc(companies.id)];
  switch (sort) {
    case "newest":
      return recencyTiebreak;
    case "updated":
      return [desc(companies.updatedAt), desc(companies.id)];
    case "revenue":
      return [sql`${latestRevenueSql} DESC NULLS LAST`, ...recencyTiebreak];
    case "growth":
      return [sql`${latestGrowthSql} DESC NULLS LAST`, ...recencyTiebreak];
    case "valuation":
      return [sql`${latestPublicValuationSql} DESC NULLS LAST`, ...recencyTiebreak];
  }
}

/**
 * Paginated, filtered list of PUBLISHED companies only. Filtering happens in
 * SQL (indexed columns), never by loading all rows.
 */
export async function getPublishedCompanies(filters: MarketplaceFilters = {}): Promise<{
  companies: CompanyRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));

  const conditions: SQL[] = publicVisibilityConditions();

  if (filters.industry) conditions.push(eq(companies.industry, filters.industry));
  if (filters.stage) conditions.push(eq(companies.stage, filters.stage));
  if (filters.country) conditions.push(eq(companies.hqCountry, filters.country));

  if (filters.q) {
    const term = `%${filters.q.replace(/[%_\\]/g, "\\$&")}%`;
    const search = or(
      ilike(companies.name, term),
      ilike(companies.shortDescription, term),
      ilike(companies.industry, term),
      ilike(companies.subindustry, term),
    );
    if (search) conditions.push(search);
  }

  if (filters.intent) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${companyIntents} WHERE ${companyIntents.companyId} = ${companies.id} AND ${companyIntents.intent} = ${filters.intent})`,
    );
  }

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(companies)
      .where(where)
      .orderBy(...orderTermsFor(filters.sort ?? DEFAULT_MARKETPLACE_SORT))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(companies).where(where),
  ]);

  return { companies: rows, total, page, pageSize };
}

/** Published company by slug, or null. The only public single-company read. */
export async function getPublishedCompanyBySlug(slug: string): Promise<CompanyRow | null> {
  const [row] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.slug, slug), ...publicVisibilityConditions()))
    .limit(1);
  return row ?? null;
}

/** Distinct filter options actually present among published companies. */
export async function getMarketplaceFilterOptions(): Promise<{
  industries: string[];
  countries: string[];
}> {
  const visible = and(...publicVisibilityConditions());
  const [industries, countries] = await Promise.all([
    db.selectDistinct({ v: companies.industry }).from(companies).where(visible),
    db.selectDistinct({ v: companies.hqCountry }).from(companies).where(visible),
  ]);
  return {
    industries: industries.map((r) => r.v).filter((v): v is string => Boolean(v)).sort(),
    countries: countries.map((r) => r.v).filter((v): v is string => Boolean(v)).sort(),
  };
}

/* -------------------------------------------------------------------------- */
/* Founder                                                                    */
/* -------------------------------------------------------------------------- */

/** Companies the user created or is a founder-member of. */
export async function getCompaniesManagedBy(userId: string): Promise<CompanyRow[]> {
  return db
    .select({ companies })
    .from(companies)
    .leftJoin(
      companyMembers,
      and(eq(companyMembers.companyId, companies.id), eq(companyMembers.userId, userId)),
    )
    .where(
      or(
        eq(companies.createdBy, userId),
        and(eq(companyMembers.role, "founder"), eq(companyMembers.userId, userId)),
      ),
    )
    .groupBy(companies.id)
    .orderBy(desc(companies.updatedAt))
    .then((rows) => rows.map((r) => r.companies));
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

/** Companies awaiting review (submitted or under_review), oldest first. */
export async function getCompaniesAwaitingReview(): Promise<CompanyRow[]> {
  return db
    .select()
    .from(companies)
    .where(inArray(companies.status, ["submitted", "under_review"]))
    .orderBy(asc(companies.submittedAt));
}

/**
 * Published companies whose content changed meaningfully after publication,
 * newest edit first (admin oversight for live edits — published profiles are
 * founder-editable without re-review, so this is the review surface).
 * The 1-hour gap mirrors the "Recently updated" discovery signal: the
 * publish itself and same-moment touches don't count as edits.
 */
export async function getRecentlyUpdatedPublishedCompanies(limit = 15): Promise<CompanyRow[]> {
  return db
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.status, "published"),
        sql`${companies.updatedAt} > ${companies.publishedAt} + interval '1 hour'`,
      ),
    )
    .orderBy(desc(companies.updatedAt))
    .limit(limit);
}

export async function getCompanyByIdUnscoped(id: string): Promise<CompanyRow | null> {
  const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return row ?? null;
}

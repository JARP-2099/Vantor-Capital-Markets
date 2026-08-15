import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyIntents, companyMembers, companyMetrics } from "@/db/schema";
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

export type MarketplaceFilters = {
  q?: string;
  industry?: string;
  stage?: CompanyStage;
  country?: string;
  intent?: CompanyIntent;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;

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

  const conditions: SQL[] = [eq(companies.status, "published")];

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
      .orderBy(desc(companies.publishedAt))
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
    .where(and(eq(companies.slug, slug), eq(companies.status, "published")))
    .limit(1);
  return row ?? null;
}

/** Distinct filter options actually present among published companies. */
export async function getMarketplaceFilterOptions(): Promise<{
  industries: string[];
  countries: string[];
}> {
  const [industries, countries] = await Promise.all([
    db
      .selectDistinct({ v: companies.industry })
      .from(companies)
      .where(eq(companies.status, "published")),
    db
      .selectDistinct({ v: companies.hqCountry })
      .from(companies)
      .where(eq(companies.status, "published")),
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

export async function getCompanyByIdUnscoped(id: string): Promise<CompanyRow | null> {
  const [row] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return row ?? null;
}

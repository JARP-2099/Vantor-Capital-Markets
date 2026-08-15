import "server-only";
import { count, eq, inArray, asc, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { companyMembers, companyMetrics } from "@/db/schema";
import type { CompanyMetricRow, CompanyRow } from "@/db/queries/companies";
import {
  UnauthorizedError,
  getSessionUser,
  requireCompanyManager,
  type AuthedUser,
} from "@/lib/authz";

/**
 * Page-side data helpers for the founder surface. Authorization errors map to
 * navigation outcomes: signed-out → /login, not-yours/missing → 404 (the same
 * response for both, so company ids cannot be enumerated).
 */

export async function requireUserPage(): Promise<AuthedUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireManagerPage(
  companyId: string,
): Promise<{ user: AuthedUser; company: CompanyRow }> {
  try {
    return await requireCompanyManager(companyId);
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    notFound();
  }
}

/** Wizard steps are only reachable while the company is still a draft. */
export async function requireDraftPage(
  companyId: string,
): Promise<{ user: AuthedUser; company: CompanyRow }> {
  const ctx = await requireManagerPage(companyId);
  if (ctx.company.status !== "draft") redirect(`/founder/companies/${companyId}`);
  return ctx;
}

/** All metric rows for one company, newest first within each type. */
export async function getMetricRows(companyId: string): Promise<CompanyMetricRow[]> {
  return db
    .select()
    .from(companyMetrics)
    .where(eq(companyMetrics.companyId, companyId))
    .orderBy(asc(companyMetrics.metricType), desc(companyMetrics.asOf));
}

export type CompanyCounts = { metrics: number; members: number };

/** Metric + member counts per company without N+1 queries. */
export async function getCompanyCounts(
  companyIds: string[],
): Promise<Map<string, CompanyCounts>> {
  const result = new Map<string, CompanyCounts>();
  if (companyIds.length === 0) return result;
  for (const id of companyIds) result.set(id, { metrics: 0, members: 0 });

  const [metricRows, memberRows] = await Promise.all([
    db
      .select({ companyId: companyMetrics.companyId, n: count() })
      .from(companyMetrics)
      .where(inArray(companyMetrics.companyId, companyIds))
      .groupBy(companyMetrics.companyId),
    db
      .select({ companyId: companyMembers.companyId, n: count() })
      .from(companyMembers)
      .where(inArray(companyMembers.companyId, companyIds))
      .groupBy(companyMembers.companyId),
  ]);

  for (const r of metricRows) {
    const entry = result.get(r.companyId);
    if (entry) entry.metrics = r.n;
  }
  for (const r of memberRows) {
    const entry = result.get(r.companyId);
    if (entry) entry.members = r.n;
  }
  return result;
}

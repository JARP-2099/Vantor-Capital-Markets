import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { valuationComponents, valuationRuns } from "@/db/schema";

/**
 * Valuation read layer. Public display is gated at the call site (the public
 * profile page queries valuations only when the company is published AND
 * showPublicValuation is enabled); founder/admin surfaces gate via authz.
 */

export type ValuationRunRow = typeof valuationRuns.$inferSelect;
export type ValuationComponentRow = typeof valuationComponents.$inferSelect;

export async function getLatestValuationRun(companyId: string): Promise<ValuationRunRow | null> {
  const [run] = await db
    .select()
    .from(valuationRuns)
    .where(eq(valuationRuns.companyId, companyId))
    .orderBy(desc(valuationRuns.createdAt))
    .limit(1);
  return run ?? null;
}

export async function getLatestCompletedValuationRun(
  companyId: string,
): Promise<ValuationRunRow | null> {
  const [run] = await db
    .select()
    .from(valuationRuns)
    .where(and(eq(valuationRuns.companyId, companyId), eq(valuationRuns.status, "completed")))
    .orderBy(desc(valuationRuns.createdAt))
    .limit(1);
  return run ?? null;
}

/**
 * Latest completed run per company, batched for marketplace lists. Same
 * visibility contract as getLatestCompletedValuationRun: callers must pass
 * only ids whose companies are published with showPublicValuation enabled.
 */
export async function getLatestCompletedValuationRuns(
  companyIds: string[],
): Promise<Map<string, ValuationRunRow>> {
  if (companyIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(valuationRuns)
    .where(
      and(inArray(valuationRuns.companyId, companyIds), eq(valuationRuns.status, "completed")),
    )
    .orderBy(desc(valuationRuns.createdAt));
  const latest = new Map<string, ValuationRunRow>();
  for (const row of rows) {
    if (!latest.has(row.companyId)) latest.set(row.companyId, row);
  }
  return latest;
}

export async function getValuationComponents(runId: string): Promise<ValuationComponentRow[]> {
  return db
    .select()
    .from(valuationComponents)
    .where(eq(valuationComponents.runId, runId))
    .orderBy(asc(valuationComponents.componentKey));
}

/** Completed runs, oldest first — for the history timeline. */
export async function getValuationHistory(companyId: string): Promise<ValuationRunRow[]> {
  return db
    .select()
    .from(valuationRuns)
    .where(and(eq(valuationRuns.companyId, companyId), eq(valuationRuns.status, "completed")))
    .orderBy(asc(valuationRuns.createdAt));
}

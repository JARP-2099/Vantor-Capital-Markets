import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
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

import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyMetrics } from "@/db/schema";
import { getLatestRequestsByCategory } from "@/db/queries/verifications";
import { buildValuationInputs } from "./assemble";
import type { ValuationInputs } from "./types";

/**
 * Assembles the engine's input snapshot from the database. This is the only
 * I/O on the valuation path — everything downstream is pure. The snapshot is
 * persisted with each run so results stay reproducible and auditable.
 */
export async function assembleValuationInputs(
  companyId: string,
  asOfToday: string,
): Promise<ValuationInputs | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) return null;

  const rows = await db
    .select()
    .from(companyMetrics)
    .where(eq(companyMetrics.companyId, companyId))
    .orderBy(desc(companyMetrics.asOf), desc(companyMetrics.createdAt));

  // A category counts as verified only when its LATEST request is verified —
  // the same latest-per-category rule as every display surface. Matching on
  // any historical "verified" row would keep paying the confidence bonus
  // after a later resubmission was rejected.
  const latestByCategory = await getLatestRequestsByCategory(companyId);
  const verifiedCategories = [...latestByCategory.entries()]
    .filter(([, row]) => row.status === "verified")
    .map(([category]) => category);

  return buildValuationInputs(company, rows, verifiedCategories, asOfToday);
}

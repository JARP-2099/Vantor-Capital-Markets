import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyMetrics, verificationRequests } from "@/db/schema";
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

  const verified = await db
    .select({ category: verificationRequests.category })
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.companyId, companyId),
        inArray(verificationRequests.status, ["verified"]),
      ),
    );

  return buildValuationInputs(
    company,
    rows,
    verified.map((v) => v.category),
    asOfToday,
  );
}

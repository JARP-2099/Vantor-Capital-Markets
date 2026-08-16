import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { valuationComponents, valuationRuns } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { ENGINE_VERSION, runValuationEngine } from "./engine";
import { assembleValuationInputs } from "./inputs";

/**
 * Valuation run orchestration. Callers are responsible for AUTHORIZATION
 * (requireCompanyManager / requireAdmin) before invoking this service; the
 * service is responsible for cooldown, computation, persistence, and audit.
 * Runs are append-only: history is never overwritten.
 */

/** Minimum time between runs per company (abuse prevention). */
export const RUN_COOLDOWN_MS = 10 * 60 * 1000;

export class ValuationCooldownError extends Error {
  constructor(public retryAfterMs: number) {
    super("A valuation was generated very recently. Please try again shortly.");
    this.name = "ValuationCooldownError";
  }
}

export async function getLatestRun(companyId: string) {
  const [run] = await db
    .select()
    .from(valuationRuns)
    .where(eq(valuationRuns.companyId, companyId))
    .orderBy(desc(valuationRuns.createdAt))
    .limit(1);
  return run ?? null;
}

export async function executeValuationRun(options: {
  companyId: string;
  requestedBy: string | null;
  /** Admins bypass the cooldown. */
  bypassCooldown?: boolean;
  /** Injectable clock for tests. */
  now?: Date;
}) {
  const now = options.now ?? new Date();

  if (!options.bypassCooldown) {
    const latest = await getLatestRun(options.companyId);
    if (latest) {
      const elapsed = now.getTime() - latest.createdAt.getTime();
      if (elapsed < RUN_COOLDOWN_MS) {
        throw new ValuationCooldownError(RUN_COOLDOWN_MS - elapsed);
      }
    }
  }

  const inputs = await assembleValuationInputs(options.companyId, now.toISOString().slice(0, 10));
  if (!inputs) throw new Error("Company not found");

  const result = runValuationEngine(inputs);

  // Final finiteness guard: pathological stored metrics (e.g. a NaN that
  // reached the DB outside the validated write path) must produce a failed
  // run, never a "completed" row carrying NaN/Infinity.
  const numbersSane =
    result.status !== "completed" ||
    [result.low, result.high, result.mid].every((v) => Number.isFinite(v));

  // Run + components commit atomically: a partial write would render an
  // empty breakdown and, because the cooldown keys off the run row, lock the
  // founder out of retrying for the full window.
  const run = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(valuationRuns)
      .values({
      companyId: options.companyId,
      engineVersion: result.engineVersion,
      assumptionsVersion: result.assumptionsVersion,
      status: !numbersSane
        ? "failed"
        : result.status === "completed"
          ? "completed"
          : "insufficient_data",
      dataSufficiency: result.dataSufficiency,
      currency: result.status === "completed" ? result.currency : "USD",
      valuationLow: numbersSane && result.status === "completed" ? String(result.low) : null,
      valuationHigh: numbersSane && result.status === "completed" ? String(result.high) : null,
      valuationMid: numbersSane && result.status === "completed" ? String(result.mid) : null,
      confidence: numbersSane && result.status === "completed" ? result.confidence : null,
      inputSnapshot: inputs,
      riskFlags: result.status === "completed" ? result.riskFlags : null,
      insufficiencyReasons:
        result.status === "insufficient_data"
          ? { reasons: result.reasons, hints: result.improvementHints }
          : { hints: result.improvementHints },
        requestedBy: options.requestedBy,
        createdAt: now,
      })
      .returning();

    const finiteOrNull = (v: number | undefined) =>
      v !== undefined && Number.isFinite(v) ? String(Math.round(v)) : null;

    await tx.insert(valuationComponents).values(
      result.components.map((c) => ({
        runId: inserted.id,
        componentKey: c.key,
        status: c.status,
        valuationLow: finiteOrNull(c.low),
        valuationHigh: finiteOrNull(c.high),
        valuationMid: finiteOrNull(c.mid),
        weight: String(c.weight),
        detail: c.detail,
      })),
    );

    return inserted;
  });

  await recordAudit({
    actorUserId: options.requestedBy,
    action: "valuation.run",
    entityType: "company",
    entityId: options.companyId,
    metadata: {
      runId: run.id,
      engineVersion: ENGINE_VERSION,
      status: run.status,
      dataSufficiency: run.dataSufficiency,
    },
  });

  return { run, result };
}

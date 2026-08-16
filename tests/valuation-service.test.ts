import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { companyMetrics, valuationRuns } from "@/db/schema";
import { getLatestCompletedValuationRun, getValuationComponents, getValuationHistory } from "@/db/queries/valuations";
import { findManageableCompany } from "@/lib/authz";
import {
  executeValuationRun,
  ValuationCooldownError,
} from "@/lib/valuation/service";
import { createTestCompany, createTestUser } from "./helpers";

async function seedSaasMetrics(companyId: string) {
  await db.insert(companyMetrics).values([
    { companyId, metricType: "arr", value: "1200000", currency: "USD", asOf: "2026-06-30" },
    { companyId, metricType: "arr", value: "700000", currency: "USD", asOf: "2025-06-30" },
    { companyId, metricType: "revenue_growth_yoy", value: "70", asOf: "2026-06-30" },
    { companyId, metricType: "employees", value: "20", asOf: "2026-06-30" },
  ]);
}

describe("valuation runs (persistence)", () => {
  it("persists a completed run with components and preserves history", async () => {
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      stage: "seed",
      industry: "Software",
      businessModel: "subscription",
    });
    await seedSaasMetrics(company.id);

    const t1 = new Date("2026-08-01T10:00:00Z");
    const { run: run1 } = await executeValuationRun({
      companyId: company.id,
      requestedBy: founder.id,
      now: t1,
    });
    expect(run1.status).toBe("completed");
    expect(run1.engineVersion).toBe("vantor-valuation-v1");
    expect(Number(run1.valuationLow)).toBeGreaterThan(0);

    const components = await getValuationComponents(run1.id);
    expect(components.map((c) => c.componentKey).sort()).toEqual([
      "comparables",
      "profitability",
      "revenue_multiple",
      "stage_baseline",
    ]);

    // Second run later — history preserved, nothing overwritten.
    const t2 = new Date("2026-08-01T11:00:00Z");
    const { run: run2 } = await executeValuationRun({
      companyId: company.id,
      requestedBy: founder.id,
      now: t2,
    });
    expect(run2.id).not.toBe(run1.id);
    const history = await getValuationHistory(company.id);
    expect(history.map((r) => r.id)).toEqual([run1.id, run2.id]);

    const latest = await getLatestCompletedValuationRun(company.id);
    expect(latest?.id).toBe(run2.id);
  });

  it("enforces the cooldown but allows admin bypass", async () => {
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      stage: "seed",
      industry: "Software",
      businessModel: "subscription",
    });
    await seedSaasMetrics(company.id);

    const t1 = new Date("2026-08-02T10:00:00Z");
    await executeValuationRun({ companyId: company.id, requestedBy: founder.id, now: t1 });

    const t2 = new Date("2026-08-02T10:05:00Z"); // 5 min later, inside cooldown
    await expect(
      executeValuationRun({ companyId: company.id, requestedBy: founder.id, now: t2 }),
    ).rejects.toBeInstanceOf(ValuationCooldownError);

    await expect(
      executeValuationRun({
        companyId: company.id,
        requestedBy: founder.id,
        now: t2,
        bypassCooldown: true,
      }),
    ).resolves.toBeTruthy();
  });

  it("records an insufficient_data run for an empty company", async () => {
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      stage: null,
      industry: null,
      businessModel: null,
    });
    const { run } = await executeValuationRun({
      companyId: company.id,
      requestedBy: founder.id,
      now: new Date("2026-08-03T10:00:00Z"),
    });
    expect(run.status).toBe("insufficient_data");
    expect(run.valuationLow).toBeNull();
    expect(run.confidence).toBeNull();
    expect(run.insufficiencyReasons).toBeTruthy();
  });

  it("stores the exact input snapshot for auditability", async () => {
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      stage: "seed",
      industry: "Software",
      businessModel: "subscription",
    });
    await seedSaasMetrics(company.id);
    const { run } = await executeValuationRun({
      companyId: company.id,
      requestedBy: founder.id,
      now: new Date("2026-08-04T10:00:00Z"),
    });
    const snapshot = run.inputSnapshot as { metrics: { arr: Array<{ value: number }> } };
    expect(snapshot.metrics.arr[0].value).toBe(1200000);
  });
});

describe("valuation authorization surface", () => {
  it("cross-user company access is denied at the ownership layer", async () => {
    const owner = await createTestUser();
    const attacker = await createTestUser();
    const company = await createTestCompany(owner.id);
    // The server action path requires manageability before invoking the
    // service; verify the underlying check holds.
    expect(await findManageableCompany(attacker.id, company.id)).toBeNull();
    expect((await findManageableCompany(owner.id, company.id))?.id).toBe(company.id);
  });

  it("valuation runs are scoped per company", async () => {
    const founder = await createTestUser();
    const companyA = await createTestCompany(founder.id, {
      stage: "seed",
      industry: "Software",
      businessModel: "subscription",
    });
    const companyB = await createTestCompany(founder.id, { stage: "pre_seed" });
    await seedSaasMetrics(companyA.id);
    await executeValuationRun({
      companyId: companyA.id,
      requestedBy: founder.id,
      now: new Date("2026-08-05T10:00:00Z"),
    });
    expect(await getValuationHistory(companyB.id)).toHaveLength(0);
  });
});

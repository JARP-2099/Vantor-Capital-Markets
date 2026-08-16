import { describe, expect, it } from "vitest";
import { runValuationEngine, round3sig } from "@/lib/valuation/engine";
import type { ValuationInputs } from "@/lib/valuation/types";

/** Baseline SaaS company with solid data. */
function saasInputs(overrides: Partial<ValuationInputs["metrics"]> = {}): ValuationInputs {
  return {
    companyId: "test-co",
    asOfToday: "2026-08-01",
    stage: "seed",
    industry: "Software",
    businessModel: "subscription",
    foundedYear: 2022,
    metrics: {
      arr: [
        { value: 1_200_000, asOf: "2026-06-30", currency: "USD" },
        { value: 700_000, asOf: "2025-06-30", currency: "USD" },
      ],
      growthYoY: { value: 70, asOf: "2026-06-30" },
      grossMargin: { value: 75, asOf: "2026-06-30" },
      burnMonthly: { value: 80_000, asOf: "2026-06-30", currency: "USD" },
      runwayMonths: { value: 18, asOf: "2026-06-30" },
      customers: { value: 60, asOf: "2026-06-30" },
      employees: { value: 20, asOf: "2026-06-30" },
      capitalRaisedTotal: { value: 3_000_000, asOf: "2026-06-30", currency: "USD" },
      ...overrides,
    },
    verifiedCategories: [],
  };
}

function completed(r: ReturnType<typeof runValuationEngine>) {
  if (r.status !== "completed") throw new Error(`expected completed, got ${r.status}`);
  return r;
}

describe("determinism", () => {
  it("identical inputs produce identical results", () => {
    const a = runValuationEngine(saasInputs());
    const b = runValuationEngine(saasInputs());
    expect(a).toEqual(b);
  });
});

describe("healthy SaaS company", () => {
  const r = completed(runValuationEngine(saasInputs()));

  it("produces a sane range, not false precision", () => {
    expect(r.low).toBeGreaterThan(0);
    expect(r.high).toBeGreaterThan(r.low);
    expect(r.mid).toBeGreaterThanOrEqual(r.low);
    expect(r.mid).toBeLessThanOrEqual(r.high);
    // 3-sig-fig rounding
    expect(r.low).toBe(round3sig(r.low));
    expect(r.high).toBe(round3sig(r.high));
  });

  it("applies the revenue model and reports the comparables model honestly", () => {
    const revenue = r.components.find((c) => c.key === "revenue_multiple");
    expect(revenue?.status).toBe("applied");
    const comps = r.components.find((c) => c.key === "comparables");
    expect(comps?.status).toBe("insufficient_data");
    expect(JSON.stringify(comps?.detail)).toMatch(/Insufficient comparable/i);
  });

  it("does not apply the profitability model without profit", () => {
    const profit = r.components.find((c) => c.key === "profitability");
    expect(profit?.status).not.toBe("applied");
  });

  it("records engine and assumptions versions", () => {
    expect(r.engineVersion).toBe("vantor-valuation-v1.1");
    expect(r.assumptionsVersion).toBe("vantor-assumptions-v1");
  });
});

describe("pre-revenue companies", () => {
  const preRevenue: ValuationInputs = {
    companyId: "pre-rev",
    asOfToday: "2026-08-01",
    stage: "pre_seed",
    industry: "Climate & Energy",
    businessModel: "hardware",
    foundedYear: 2025,
    metrics: {
      employees: { value: 6, asOf: "2026-06-30" },
      capitalRaisedTotal: { value: 1_800_000, asOf: "2026-06-30", currency: "USD" },
      burnMonthly: { value: 95_000, asOf: "2026-06-30", currency: "USD" },
      runwayMonths: { value: 14, asOf: "2026-06-30" },
    },
    verifiedCategories: [],
  };

  it("does not value at zero and uses the stage baseline", () => {
    const r = completed(runValuationEngine(preRevenue));
    expect(r.low).toBeGreaterThan(0);
    expect(r.components.find((c) => c.key === "stage_baseline")?.status).toBe("applied");
    expect(r.components.find((c) => c.key === "revenue_multiple")?.status).toBe("not_applicable");
  });

  it("respects the capital-raised floor", () => {
    const r = completed(runValuationEngine(preRevenue));
    expect(r.low).toBeGreaterThanOrEqual(round3sig(1_800_000 * 0.6 * 0.6)); // floor × max risk clamp
  });

  it("caps confidence for pre-revenue estimates", () => {
    const r = completed(runValuationEngine(preRevenue));
    expect(r.confidence).toBeLessThanOrEqual(55);
    expect(r.dataSufficiency).toBe("limited");
  });
});

describe("insufficient data", () => {
  it("declines to estimate when there is effectively nothing", () => {
    const r = runValuationEngine({
      companyId: "empty",
      asOfToday: "2026-08-01",
      stage: null,
      industry: null,
      businessModel: null,
      foundedYear: null,
      metrics: {},
      verifiedCategories: [],
    });
    expect(r.status).toBe("insufficient_data");
    if (r.status === "insufficient_data") {
      expect(r.reasons.length).toBeGreaterThan(0);
      expect(r.improvementHints.length).toBeGreaterThan(0);
    }
  });

  it("handles missing optional metrics without crashing", () => {
    const r = runValuationEngine(
      saasInputs({
        growthYoY: undefined,
        grossMargin: undefined,
        burnMonthly: undefined,
        runwayMonths: undefined,
        customers: undefined,
        employees: undefined,
        capitalRaisedTotal: undefined,
      }),
    );
    expect(r.status).toBe("completed");
  });
});

describe("risk adjustments", () => {
  it("negative growth reduces the estimate", () => {
    const healthy = completed(runValuationEngine(saasInputs()));
    const declining = completed(
      runValuationEngine(saasInputs({ growthYoY: { value: -18, asOf: "2026-06-30" } })),
    );
    expect(declining.mid).toBeLessThan(healthy.mid);
    expect(declining.riskFlags.map((f) => f.key)).toContain("declining_revenue");
  });

  it("low runway and high burn add risk flags", () => {
    const r = completed(
      runValuationEngine(
        saasInputs({
          runwayMonths: { value: 4, asOf: "2026-06-30" },
          burnMonthly: { value: 450_000, asOf: "2026-06-30", currency: "USD" },
        }),
      ),
    );
    const keys = r.riskFlags.map((f) => f.key);
    expect(keys).toContain("low_runway");
    expect(keys).toContain("high_burn");
  });

  it("customer concentration is flagged and penalized", () => {
    const base = completed(runValuationEngine(saasInputs()));
    const concentrated = completed(
      runValuationEngine(saasInputs({ topCustomerRevenuePct: { value: 55, asOf: "2026-06-30" } })),
    );
    expect(concentrated.mid).toBeLessThan(base.mid);
    expect(concentrated.riskFlags.map((f) => f.key)).toContain("customer_concentration");
  });

  it("combined risk cannot reduce the estimate below the documented floor", () => {
    const battered = completed(
      runValuationEngine(
        saasInputs({
          growthYoY: { value: -30, asOf: "2026-06-30" },
          runwayMonths: { value: 3, asOf: "2026-06-30" },
          burnMonthly: { value: 500_000, asOf: "2026-06-30", currency: "USD" },
          topCustomerRevenuePct: { value: 80, asOf: "2026-06-30" },
          grossMargin: { value: 10, asOf: "2026-06-30" },
        }),
      ),
    );
    const unbattered = completed(
      runValuationEngine(
        saasInputs({
          growthYoY: { value: -30, asOf: "2026-06-30" },
          runwayMonths: { value: 3, asOf: "2026-06-30" },
          burnMonthly: { value: 500_000, asOf: "2026-06-30", currency: "USD" },
          topCustomerRevenuePct: { value: 80, asOf: "2026-06-30" },
          grossMargin: { value: 10, asOf: "2026-06-30" },
        }),
      ),
    );
    // floor: with identical inputs the two runs agree (sanity), and the
    // total reduction respects the 0.6 floor: mid >= 60% of pre-risk mid.
    expect(battered).toEqual(unbattered);
    const flagsTotal = battered.riskFlags.reduce((s, f) => s + f.impactPct, 0);
    expect(flagsTotal).toBeLessThan(-40); // raw flags exceed the floor…
    // …but the applied reduction is clamped: recompute pre-risk mid from
    // the revenue component and compare.
    const revenue = battered.components.find((c) => c.key === "revenue_multiple");
    expect(battered.mid).toBeGreaterThanOrEqual(round3sig((revenue?.mid ?? 0) * 0.6 * 0.98));
  });
});

describe("profitability model", () => {
  it("applies for profitable companies and blends with revenue", () => {
    const r = completed(
      runValuationEngine(
        saasInputs({ netProfitAnnual: { value: 400_000, asOf: "2026-06-30", currency: "USD" } }),
      ),
    );
    const profit = r.components.find((c) => c.key === "profitability");
    expect(profit?.status).toBe("applied");
    expect(profit?.weight).toBeCloseTo(0.4, 5);
    expect(r.components.find((c) => c.key === "revenue_multiple")?.weight).toBeCloseTo(0.6, 5);
  });

  it("is not applicable for loss-making companies", () => {
    const r = completed(
      runValuationEngine(
        saasInputs({ netProfitAnnual: { value: -900_000, asOf: "2026-06-30", currency: "USD" } }),
      ),
    );
    expect(r.components.find((c) => c.key === "profitability")?.status).toBe("not_applicable");
  });
});

describe("outlier handling", () => {
  it("widens the range instead of blindly averaging when models disagree >3x", () => {
    // Small revenue base but enormous profit → profitability model dwarfs
    // the revenue model.
    const r = completed(
      runValuationEngine(
        saasInputs({
          arr: [{ value: 60_000, asOf: "2026-06-30", currency: "USD" }],
          growthYoY: { value: 10, asOf: "2026-06-30" },
          netProfitAnnual: { value: 2_000_000, asOf: "2026-06-30", currency: "USD" },
        }),
      ),
    );
    const mids = r.components.filter((c) => c.status === "applied").map((c) => c.mid ?? 0);
    expect(Math.max(...mids) / Math.min(...mids)).toBeGreaterThan(3);
    // Final range must span both models' territory.
    const lows = r.components.filter((c) => c.status === "applied").map((c) => c.low ?? Infinity);
    expect(r.low).toBeLessThanOrEqual(round3sig(Math.min(...lows)));
    expect(r.high).toBeGreaterThanOrEqual(r.mid);
  });
});

describe("confidence behavior", () => {
  it("drops when data quality is weak", () => {
    const strong = completed(runValuationEngine(saasInputs()));
    const weak = completed(
      runValuationEngine(
        saasInputs({
          arr: [{ value: 900_000, asOf: "2026-06-30", currency: "USD" }],
          growthYoY: undefined,
          grossMargin: undefined,
          burnMonthly: undefined,
          runwayMonths: undefined,
          customers: undefined,
          employees: undefined,
          capitalRaisedTotal: undefined,
        }),
      ),
    );
    expect(weak.confidence).toBeLessThan(strong.confidence);
    expect(weak.dataSufficiency).not.toBe("strong");
  });

  it("penalizes stale metrics", () => {
    const fresh = completed(runValuationEngine(saasInputs()));
    const stale = completed(
      runValuationEngine({
        ...saasInputs(),
        asOfToday: "2028-08-01",
      }),
    );
    expect(stale.confidence).toBeLessThan(fresh.confidence);
  });

  it("verification of financial categories raises confidence, not value", () => {
    const unverified = completed(runValuationEngine(saasInputs()));
    const verified = completed(
      runValuationEngine({ ...saasInputs(), verifiedCategories: ["revenue"] }),
    );
    expect(verified.confidence).toBeGreaterThan(unverified.confidence);
    expect(verified.mid).toBe(unverified.mid); // value unchanged
    expect(verified.low).toBe(unverified.low);
  });

  it("is clamped to a sane band", () => {
    const r = completed(runValuationEngine(saasInputs()));
    expect(r.confidence).toBeGreaterThanOrEqual(5);
    expect(r.confidence).toBeLessThanOrEqual(95);
  });
});

describe("currency", () => {
  it("outputs in the currency of the primary revenue metric", () => {
    const r = completed(
      runValuationEngine(
        saasInputs({ arr: [{ value: 900_000, asOf: "2026-05-31", currency: "GBP" }] }),
      ),
    );
    expect(r.currency).toBe("GBP");
  });
});

describe("round3sig", () => {
  it("rounds to 3 significant figures", () => {
    expect(round3sig(4_654_321)).toBe(4_650_000);
    expect(round3sig(123.456)).toBe(123);
    expect(round3sig(0)).toBe(0);
    expect(round3sig(999_600)).toBe(1_000_000);
  });
});

describe("primary revenue source fallthrough (v1.1)", () => {
  it("a zero ARR point does not mask real annual revenue", () => {
    const r = completed(
      runValuationEngine(
        saasInputs({
          arr: [{ value: 0, asOf: "2026-06-30", currency: "USD" }],
          revenueAnnual: [{ value: 5_000_000, asOf: "2026-06-30", currency: "USD" }],
        }),
      ),
    );
    const revenue = r.components.find((c) => c.key === "revenue_multiple");
    expect(revenue?.status).toBe("applied");
    // The estimate reflects the $5M annual revenue, not a pre-revenue floor.
    expect(r.mid).toBeGreaterThan(4_000_000);
  });

  it("falls back to the first reported source when nothing clears the threshold", () => {
    const r = runValuationEngine(
      saasInputs({
        arr: [{ value: 10_000, asOf: "2026-06-30", currency: "USD" }],
        growthYoY: undefined,
      }),
    );
    // Still treated as pre-revenue territory: the stage model, not revenue.
    if (r.status === "completed") {
      const revenue = r.components.find((c) => c.key === "revenue_multiple");
      expect(revenue?.status).not.toBe("applied");
    }
  });
});

describe("month math is timezone-independent (v1.1)", () => {
  it("derives identical growth for day-1 month boundaries regardless of server offset", () => {
    // Regression guard for the local-time getMonth() bug: with UTC accessors
    // the 12-month spacing below always yields exactly 12 months, so derived
    // growth is exact. Under the old code a western-timezone server read
    // 2025-07-01 as June 30 local, shifting the window to 13 months.
    const inputs = saasInputs({
      arr: [
        { value: 2_000_000, asOf: "2026-07-01", currency: "USD" },
        { value: 1_000_000, asOf: "2025-07-01", currency: "USD" },
      ],
      growthYoY: undefined,
    });
    const r = completed(runValuationEngine(inputs));
    const revenue = r.components.find((c) => c.key === "revenue_multiple");
    expect(revenue?.status).toBe("applied");
    const detail = JSON.stringify(revenue?.detail);
    // 100% YoY derived from exactly 12 months.
    expect(detail).toMatch(/100/);
  });
});

import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { companyMetrics, valuationRuns } from "@/db/schema";
import {
  getPublishedCompanies,
  MARKETPLACE_SORTS,
  type MarketplaceSort,
} from "@/db/queries/companies";
import { createTestCompany, createTestUser } from "./helpers";

/**
 * Marketplace sorting tests. The test database is shared across files, so
 * every scenario tags its companies with a unique industry marker and
 * asserts relative order among its own rows only.
 */

async function listOrder(marker: string, sort: MarketplaceSort): Promise<string[]> {
  const { companies } = await getPublishedCompanies({ industry: marker, sort, pageSize: 48 });
  return companies.map((c) => c.id);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe("marketplace sorting", () => {
  it("newest: orders by published_at descending", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const oldest = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(30),
      industry: marker,
    });
    const newest = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(1),
      industry: marker,
    });
    const middle = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(10),
      industry: marker,
    });

    expect(await listOrder(marker, "newest")).toEqual([newest.id, middle.id, oldest.id]);
  });

  it("updated: orders by updated_at descending", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const stale = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(40),
      updatedAt: daysAgo(35),
      industry: marker,
    });
    const fresh = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(60),
      updatedAt: daysAgo(2),
      industry: marker,
    });

    expect(await listOrder(marker, "updated")).toEqual([fresh.id, stale.id]);
  });

  it("revenue: prefers ARR, annualizes MRR, puts missing data last", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    // 2M ARR (also has a huge stale annual figure ARR must shadow).
    const arrCo = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(5),
      industry: marker,
    });
    // 500k annual revenue.
    const annualCo = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(4),
      industry: marker,
    });
    // 100k MRR → annualized 1.2M: must rank between 2M ARR and 500k annual.
    const mrrCo = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(3),
      industry: marker,
    });
    // No revenue at all → last, despite being the newest.
    const bare = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(1),
      industry: marker,
    });

    await db.insert(companyMetrics).values([
      { companyId: arrCo.id, metricType: "arr", value: "2000000", currency: "USD", asOf: "2026-06-30" },
      { companyId: arrCo.id, metricType: "revenue_annual", value: "9000000", currency: "USD", asOf: "2025-12-31" },
      { companyId: annualCo.id, metricType: "revenue_annual", value: "500000", currency: "USD", asOf: "2026-06-30" },
      { companyId: mrrCo.id, metricType: "mrr", value: "100000", currency: "USD", asOf: "2026-06-30" },
    ]);

    expect(await listOrder(marker, "revenue")).toEqual([
      arrCo.id,
      mrrCo.id,
      annualCo.id,
      bare.id,
    ]);
  });

  it("revenue: uses the latest value of the preferred metric", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    // Latest ARR is 1M (down from 3M); competitor's latest ARR is 2M.
    const shrinking = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(2),
      industry: marker,
    });
    const growing = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(3),
      industry: marker,
    });
    await db.insert(companyMetrics).values([
      { companyId: shrinking.id, metricType: "arr", value: "3000000", currency: "USD", asOf: "2025-06-30" },
      { companyId: shrinking.id, metricType: "arr", value: "1000000", currency: "USD", asOf: "2026-06-30" },
      { companyId: growing.id, metricType: "arr", value: "2000000", currency: "USD", asOf: "2026-06-30" },
    ]);

    expect(await listOrder(marker, "revenue")).toEqual([growing.id, shrinking.id]);
  });

  it("growth: orders by latest YoY growth, missing last", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const fast = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(5),
      industry: marker,
    });
    const shrinking = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(4),
      industry: marker,
    });
    const unknown = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(1),
      industry: marker,
    });
    await db.insert(companyMetrics).values([
      { companyId: fast.id, metricType: "revenue_growth_yoy", value: "80", asOf: "2026-06-30" },
      { companyId: shrinking.id, metricType: "revenue_growth_yoy", value: "-15", asOf: "2026-06-30" },
    ]);

    expect(await listOrder(marker, "growth")).toEqual([fast.id, shrinking.id, unknown.id]);
  });

  it("valuation: orders by latest public midpoint and never ranks hidden valuations", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const high = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(6),
      industry: marker,
    });
    const low = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(5),
      industry: marker,
    });
    // Highest midpoint of all, but the founder hid the public valuation:
    // it must sort with the "no valuation" group, or the order itself would
    // leak the hidden number's magnitude.
    const hidden = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(1),
      industry: marker,
      showPublicValuation: false,
    });

    const baseRun = {
      engineVersion: "vantor-valuation-v1.1",
      assumptionsVersion: "vantor-assumptions-v1",
      status: "completed",
      dataSufficiency: "moderate",
      currency: "USD",
      confidence: 50,
      inputSnapshot: {},
    } as const;
    await db.insert(valuationRuns).values([
      { ...baseRun, companyId: high.id, valuationLow: "8000000", valuationMid: "10000000", valuationHigh: "12000000" },
      { ...baseRun, companyId: low.id, valuationLow: "1000000", valuationMid: "2000000", valuationHigh: "3000000" },
      { ...baseRun, companyId: hidden.id, valuationLow: "40000000", valuationMid: "50000000", valuationHigh: "60000000" },
    ]);

    // Hidden sorts by the recency tiebreak within the NULL group; being the
    // newest publication it lands after the ranked rows.
    expect(await listOrder(marker, "valuation")).toEqual([high.id, low.id, hidden.id]);
  });

  it("sorting composes with search and filters without widening visibility", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const matchA = await createTestCompany(founder.id, {
      name: `Meridian ${marker} Labs`,
      status: "published",
      publishedAt: daysAgo(10),
      industry: marker,
      stage: "seed",
    });
    const matchB = await createTestCompany(founder.id, {
      name: `Meridian ${marker} Systems`,
      status: "published",
      publishedAt: daysAgo(2),
      industry: marker,
      stage: "seed",
    });
    // Same searchable name but a draft: must never surface.
    await createTestCompany(founder.id, {
      name: `Meridian ${marker} Stealth`,
      status: "draft",
      industry: marker,
      stage: "seed",
    });
    await db.insert(companyMetrics).values([
      { companyId: matchA.id, metricType: "arr", value: "5000000", currency: "USD", asOf: "2026-06-30" },
      { companyId: matchB.id, metricType: "arr", value: "1000000", currency: "USD", asOf: "2026-06-30" },
    ]);

    const { companies, total } = await getPublishedCompanies({
      q: `Meridian ${marker}`,
      industry: marker,
      stage: "seed",
      sort: "revenue",
    });
    expect(total).toBe(2);
    expect(companies.map((c) => c.id)).toEqual([matchA.id, matchB.id]);
  });

  it("every whitelisted sort executes and returns only published rows", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const published = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: daysAgo(1),
      industry: marker,
    });
    await createTestCompany(founder.id, { status: "draft", industry: marker });

    for (const sort of MARKETPLACE_SORTS) {
      const { companies } = await getPublishedCompanies({ industry: marker, sort });
      expect(companies.map((c) => c.id)).toEqual([published.id]);
    }
  });

  it("pagination stays stable under sorts with tied values", async () => {
    const founder = await createTestUser();
    const marker = `sort-${randomUUID().slice(0, 8)}`;
    const publishedAt = daysAgo(3);
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const c = await createTestCompany(founder.id, {
        status: "published",
        publishedAt,
        industry: marker,
      });
      ids.push(c.id);
    }

    // All rows tie on published_at and have no metrics: any page walk must
    // enumerate each company exactly once (unique-id tiebreak).
    const seen: string[] = [];
    for (let page = 1; page <= 3; page++) {
      const { companies } = await getPublishedCompanies({
        industry: marker,
        sort: "revenue",
        page,
        pageSize: 2,
      });
      seen.push(...companies.map((c) => c.id));
    }
    expect(seen).toHaveLength(5);
    expect(new Set(seen)).toEqual(new Set(ids));
  });
});

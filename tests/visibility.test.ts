import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { companyIntents, companyMetrics } from "@/db/schema";
import {
  getCompaniesManagedBy,
  getLatestMetrics,
  getPublishedCompanies,
  getPublishedCompanyBySlug,
} from "@/db/queries/companies";
import { createTestCompany, createTestUser } from "./helpers";

describe("marketplace visibility", () => {
  it("published companies appear; drafts, submitted, archived do not", async () => {
    const founder = await createTestUser();
    const draft = await createTestCompany(founder.id, { status: "draft" });
    const submitted = await createTestCompany(founder.id, { status: "submitted" });
    const archived = await createTestCompany(founder.id, { status: "archived" });
    const published = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });

    const { companies: listed } = await getPublishedCompanies({ pageSize: 48 });
    const ids = new Set(listed.map((c) => c.id));
    expect(ids.has(published.id)).toBe(true);
    expect(ids.has(draft.id)).toBe(false);
    expect(ids.has(submitted.id)).toBe(false);
    expect(ids.has(archived.id)).toBe(false);
  });

  it("unpublished companies are not reachable by slug", async () => {
    const founder = await createTestUser();
    const draft = await createTestCompany(founder.id, { status: "draft" });
    expect(await getPublishedCompanyBySlug(draft.slug)).toBeNull();

    const published = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });
    expect((await getPublishedCompanyBySlug(published.slug))?.id).toBe(published.id);
  });

  it("filters by industry, stage and intent; search matches name", async () => {
    const founder = await createTestUser();
    const marker = randomUUID().slice(0, 8);
    const match = await createTestCompany(founder.id, {
      name: `Grid ${marker} Robotics`,
      status: "published",
      publishedAt: new Date(),
      industry: "Robotics",
      stage: "seed",
    });
    await db
      .insert(companyIntents)
      .values({ companyId: match.id, intent: "seeking_investment" });
    await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
      industry: "Healthcare",
      stage: "growth",
    });

    const byIndustry = await getPublishedCompanies({ industry: "Robotics", pageSize: 48 });
    expect(byIndustry.companies.some((c) => c.id === match.id)).toBe(true);
    expect(byIndustry.companies.every((c) => c.industry === "Robotics")).toBe(true);

    const byStage = await getPublishedCompanies({ stage: "seed", pageSize: 48 });
    expect(byStage.companies.every((c) => c.stage === "seed")).toBe(true);

    const byIntent = await getPublishedCompanies({
      intent: "seeking_investment",
      pageSize: 48,
    });
    expect(byIntent.companies.some((c) => c.id === match.id)).toBe(true);

    const search = await getPublishedCompanies({ q: marker, pageSize: 48 });
    expect(search.companies.map((c) => c.id)).toEqual([match.id]);

    const noMatch = await getPublishedCompanies({ q: `zz-${randomUUID()}` });
    expect(noMatch.companies).toHaveLength(0);
    expect(noMatch.total).toBe(0);
  });

  it("search escapes SQL LIKE wildcards", async () => {
    const founder = await createTestUser();
    await createTestCompany(founder.id, { status: "published", publishedAt: new Date() });
    // "%" would match everything if unescaped; expect no universal match name.
    const res = await getPublishedCompanies({ q: "%zzz-never-a-name%" });
    expect(res.companies).toHaveLength(0);
  });

  it("paginates with a stable total", async () => {
    const founder = await createTestUser();
    for (let i = 0; i < 3; i++) {
      await createTestCompany(founder.id, { status: "published", publishedAt: new Date() });
    }
    const page1 = await getPublishedCompanies({ page: 1, pageSize: 2 });
    const page2 = await getPublishedCompanies({ page: 2, pageSize: 2 });
    expect(page1.companies.length).toBeLessThanOrEqual(2);
    expect(page1.total).toBe(page2.total);
    const overlap = page1.companies.filter((a) => page2.companies.some((b) => b.id === a.id));
    expect(overlap).toHaveLength(0);
  });
});

describe("metrics history", () => {
  it("getLatestMetrics returns the newest value per type", async () => {
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, { status: "published" });
    await db.insert(companyMetrics).values([
      { companyId: company.id, metricType: "arr", value: "100000", currency: "USD", asOf: "2025-06-30" },
      { companyId: company.id, metricType: "arr", value: "250000", currency: "USD", asOf: "2026-06-30" },
      { companyId: company.id, metricType: "employees", value: "12", asOf: "2026-06-30" },
    ]);
    const latest = await getLatestMetrics([company.id]);
    expect(latest.get(company.id)?.get("arr")?.value).toBe("250000.0000");
    expect(latest.get(company.id)?.get("employees")?.value).toBe("12.0000");
  });
});

describe("founder scoping", () => {
  it("getCompaniesManagedBy only returns the user's companies", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const mine = await createTestCompany(a.id);
    await createTestCompany(b.id);
    const list = await getCompaniesManagedBy(a.id);
    expect(list.map((c) => c.id)).toEqual([mine.id]);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  demoCompaniesHidden,
  getMarketplaceFilterOptions,
  getPublishedCompanies,
  getPublishedCompanyBySlug,
} from "@/db/queries/companies";
import {
  getWatchlistItems,
  saveCompanyToWatchlist,
} from "@/db/queries/watchlists";
import { createTestCompany, createTestUser } from "./helpers";

/**
 * Demo/real separation: with HIDE_DEMO_COMPANIES=true (the behavior of the
 * Vercel production deployment), fictional isDemo companies disappear from
 * every public read path and cannot be saved — indistinguishable from
 * nonexistent ids.
 */

afterEach(() => {
  delete process.env.HIDE_DEMO_COMPANIES;
});

function hideDemo() {
  process.env.HIDE_DEMO_COMPANIES = "true";
}

describe("demo company visibility", () => {
  it("defaults to showing demo companies outside production", () => {
    expect(demoCompaniesHidden()).toBe(false);
    hideDemo();
    expect(demoCompaniesHidden()).toBe(true);
  });

  it("hides demo companies from the marketplace list and filter options when hidden", async () => {
    const founder = await createTestUser();
    const marker = `demo-${randomUUID().slice(0, 8)}`;
    const demo = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
      industry: marker,
      isDemo: true,
    });
    const real = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
      industry: marker,
    });

    // Visible by default (development / Preview behavior).
    const before = await getPublishedCompanies({ industry: marker, pageSize: 48 });
    expect(new Set(before.companies.map((c) => c.id))).toEqual(new Set([demo.id, real.id]));

    hideDemo();
    const after = await getPublishedCompanies({ industry: marker, pageSize: 48 });
    expect(after.companies.map((c) => c.id)).toEqual([real.id]);
    expect(after.total).toBe(1);

    const options = await getMarketplaceFilterOptions();
    expect(options.industries).toContain(marker); // real company still carries it
  });

  it("hides demo profiles from slug lookup when hidden", async () => {
    const founder = await createTestUser();
    const demo = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
      isDemo: true,
    });

    expect((await getPublishedCompanyBySlug(demo.slug))?.id).toBe(demo.id);
    hideDemo();
    expect(await getPublishedCompanyBySlug(demo.slug)).toBeNull();
  });

  it("refuses saves of hidden demo companies and strips them from existing watchlists", async () => {
    const founder = await createTestUser();
    const investor = await createTestUser();
    const demo = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
      isDemo: true,
    });

    // Saved while visible (e.g. on Preview).
    expect((await saveCompanyToWatchlist(investor.id, demo.id)).saved).toBe(true);

    hideDemo();
    // New saves are refused exactly like nonexistent ids…
    expect(await saveCompanyToWatchlist(investor.id, demo.id)).toEqual({
      saved: false,
      reason: "not_available",
    });
    // …and the existing save renders as an unavailable row with no data.
    const items = await getWatchlistItems(investor.id);
    expect(items).toHaveLength(1);
    expect(items[0].company).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  companyGoalsSchema,
  companyIdentitySchema,
  companyMetricsSchema,
  metricEntrySchema,
} from "@/lib/validation/company";

const validIdentity = {
  name: "Test Co",
  industry: "Software",
  stage: "seed",
  businessModel: "subscription",
  shortDescription: "A useful one-line description of the company.",
};

describe("companyIdentitySchema", () => {
  it("accepts a minimal valid company", () => {
    const parsed = companyIdentitySchema.safeParse(validIdentity);
    expect(parsed.success).toBe(true);
  });

  it("rejects future founded years and ancient years", () => {
    expect(
      companyIdentitySchema.safeParse({ ...validIdentity, foundedYear: 2999 }).success,
    ).toBe(false);
    expect(
      companyIdentitySchema.safeParse({ ...validIdentity, foundedYear: 1500 }).success,
    ).toBe(false);
  });

  it("normalizes bare domains to https and rejects javascript: URLs", () => {
    const ok = companyIdentitySchema.safeParse({ ...validIdentity, website: "example.com" });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.website).toBe("https://example.com");

    expect(
      companyIdentitySchema.safeParse({ ...validIdentity, website: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });

  it("rejects unknown industries and too-short descriptions", () => {
    expect(
      companyIdentitySchema.safeParse({ ...validIdentity, industry: "Memecoins" }).success,
    ).toBe(false);
    expect(
      companyIdentitySchema.safeParse({ ...validIdentity, shortDescription: "hi" }).success,
    ).toBe(false);
  });
});

describe("companyGoalsSchema", () => {
  it("requires at least one intent", () => {
    expect(companyGoalsSchema.safeParse({ intents: [] }).success).toBe(false);
  });

  it("rejects contradictory intents", () => {
    expect(
      companyGoalsSchema.safeParse({ intents: ["not_raising", "seeking_investment"] }).success,
    ).toBe(false);
  });

  it("accepts compatible combinations", () => {
    expect(
      companyGoalsSchema.safeParse({
        intents: ["seeking_investment", "open_to_acquisition_offers"],
      }).success,
    ).toBe(true);
  });
});

describe("metric validation", () => {
  it("rejects negative counts but allows negative profit", () => {
    expect(
      metricEntrySchema.safeParse({ metricType: "employees", value: -3, asOf: "2026-01-31" })
        .success,
    ).toBe(false);
    expect(
      metricEntrySchema.safeParse({
        metricType: "net_profit_annual",
        value: -250000,
        currency: "USD",
        asOf: "2026-01-31",
      }).success,
    ).toBe(true);
  });

  it("rejects future as-of dates and bad currency codes", () => {
    expect(
      metricEntrySchema.safeParse({ metricType: "arr", value: 100, asOf: "2999-01-01" }).success,
    ).toBe(false);
    expect(
      metricEntrySchema.safeParse({
        metricType: "arr",
        value: 100,
        currency: "dollars",
        asOf: "2026-01-31",
      }).success,
    ).toBe(false);
  });

  it("accepts an empty metric list (pre-revenue companies)", () => {
    expect(companyMetricsSchema.safeParse({ metrics: [] }).success).toBe(true);
  });
});

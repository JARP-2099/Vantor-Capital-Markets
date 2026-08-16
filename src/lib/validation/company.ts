import { z } from "zod";
import {
  BUSINESS_MODELS,
  COMPANY_INTENTS,
  COMPANY_STAGES,
  INDUSTRIES,
  METRIC_TYPES,
} from "@/lib/constants";

/**
 * Shared company validation. These schemas are the single source of truth:
 * the onboarding UI validates with them client-side for fast feedback, and
 * every server action re-validates with them server-side. Server-side
 * validation is the security boundary.
 */

const currentYear = new Date().getFullYear();

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

/** Absolute http(s) URL; rejects javascript: and protocol-relative input. */
export const websiteSchema = z
  .string()
  .trim()
  .max(200)
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .refine(
    (v) => {
      if (v === undefined) return true;
      try {
        const url = new URL(v.includes("://") ? v : `https://${v}`);
        // Require a dotted hostname so scheme-smuggled input such as
        // "javascript:alert(1)" (hostname "javascript") is rejected rather
        // than normalized into an inert but confusing https URL.
        return (
          (url.protocol === "https:" || url.protocol === "http:") &&
          url.hostname.includes(".")
        );
      } catch {
        return false;
      }
    },
    { message: "Enter a valid website URL" },
  )
  .transform((v) => {
    if (v === undefined) return undefined;
    return v.includes("://") ? v : `https://${v}`;
  });

/** Step 1 — Company identity */
export const companyIdentitySchema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(80),
  website: websiteSchema,
  hqCity: optionalTrimmed(80),
  hqCountry: optionalTrimmed(80),
  industry: z.enum(INDUSTRIES, { error: "Select an industry" }),
  subindustry: optionalTrimmed(80),
  foundedYear: z.coerce
    .number()
    .int()
    .min(1800, "Enter a valid year")
    .max(currentYear + 1, "Founded year cannot be in the future")
    .optional(),
  stage: z.enum(COMPANY_STAGES, { error: "Select a stage" }),
  businessModel: z.enum(BUSINESS_MODELS, { error: "Select a business model" }),
  shortDescription: z
    .string()
    .trim()
    .min(10, "Add a one-line description (at least 10 characters)")
    .max(200, "Keep the short description under 200 characters"),
});
export type CompanyIdentityInput = z.infer<typeof companyIdentitySchema>;

/** Step 2 — Goals / intent */
export const companyGoalsSchema = z
  .object({
    intents: z
      .array(z.enum(COMPANY_INTENTS))
      .min(1, "Select at least one option")
      .max(COMPANY_INTENTS.length),
  })
  .refine(
    (v) => !(v.intents.includes("not_raising") && v.intents.includes("seeking_investment")),
    { message: "A company cannot be both not raising and seeking investment", path: ["intents"] },
  );
export type CompanyGoalsInput = z.infer<typeof companyGoalsSchema>;

/** A single metric entry */
export const metricEntrySchema = z
  .object({
    metricType: z.enum(METRIC_TYPES),
    value: z.coerce.number().finite(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code")
      .optional(),
    asOf: z.iso.date({ error: "Enter the date this value describes" }),
  })
  .refine(
    (m) =>
      !["customers", "employees", "runway_months", "capital_raised_total"].includes(m.metricType) ||
      m.value >= 0,
    { message: "This metric cannot be negative", path: ["value"] },
  )
  .refine((m) => new Date(m.asOf) <= new Date(), {
    message: "Metric date cannot be in the future",
    path: ["asOf"],
  });
export type MetricEntryInput = z.infer<typeof metricEntrySchema>;

/** Step 3 — Metrics (all optional; pre-revenue companies submit none) */
export const companyMetricsSchema = z.object({
  metrics: z.array(metricEntrySchema).max(50),
});
export type CompanyMetricsInput = z.infer<typeof companyMetricsSchema>;

/** Step 4 — Story */
export const companyStorySchema = z.object({
  problem: optionalTrimmed(4000),
  solution: optionalTrimmed(4000),
  market: optionalTrimmed(4000),
  competitivePosition: optionalTrimmed(4000),
  businessModelDescription: optionalTrimmed(4000),
  traction: optionalTrimmed(4000),
  roadmap: optionalTrimmed(4000),
  fullDescription: optionalTrimmed(6000),
});
export type CompanyStoryInput = z.infer<typeof companyStorySchema>;

/** Step 5 — Team */
export const teamMemberSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  role: z.enum(["founder", "team"]),
  title: optionalTrimmed(100),
  bio: optionalTrimmed(2000),
});
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export const companyTeamSchema = z.object({
  members: z.array(teamMemberSchema).max(50),
});
export type CompanyTeamInput = z.infer<typeof companyTeamSchema>;

/**
 * Submission gate: what a draft must contain before it can enter review.
 * Story/metrics/team stay optional; identity and at least one intent are not.
 */
export const submissionRequirementsSchema = z.object({
  identity: companyIdentitySchema,
  intents: companyGoalsSchema.shape.intents,
});

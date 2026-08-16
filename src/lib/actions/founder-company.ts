"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { db } from "@/db";
import { companies, companyIntents, companyMembers, companyMetrics, user } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import {
  ForbiddenError,
  UnauthorizedError,
  grantRole,
  requireCompanyManager,
  requireUser,
  type AuthedUser,
} from "@/lib/authz";
import { MONETARY_METRICS, type CompanyStatus, type MetricType } from "@/lib/constants";
import { slugify, withSlugSuffix } from "@/lib/slug";
import {
  companyGoalsSchema,
  companyIdentitySchema,
  companyMetricsSchema,
  companyStorySchema,
  companyTeamSchema,
  submissionRequirementsSchema,
  teamMemberSchema,
  type CompanyIdentityInput,
} from "@/lib/validation/company";

/**
 * Founder-facing server actions. Every mutation:
 *   1. authorizes via requireUser / requireCompanyManager (never trusts a
 *      client-provided companyId),
 *   2. re-validates input with the shared zod schemas,
 *   3. records an audit entry.
 * Client-side validation with the same schemas is UX only.
 */

/* -------------------------------------------------------------------------- */
/* Shared action state                                                        */
/* -------------------------------------------------------------------------- */

export type FounderFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Keyed by dotted zod path, e.g. "name", "metrics.0.value". */
  fieldErrors?: Record<string, string>;
};

/** Where a form lives: the wizard advances to the next step, manage stays put. */
export type FormMode = "onboarding" | "manage";

function err(message: string, fieldErrors?: Record<string, string>): FounderFormState {
  return { status: "error", message, fieldErrors };
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

const VALIDATION_MESSAGE = "Please fix the highlighted fields and try again.";
const CONCURRENT_SAVE_MESSAGE =
  "Another save for this company finished at the same time. Review the current values and try again.";

/* -------------------------------------------------------------------------- */
/* Authorization + status guards                                              */
/* -------------------------------------------------------------------------- */

type ManagerCtx = { user: AuthedUser; company: typeof companies.$inferSelect };

/**
 * Resolves the manager context for a company, or null when the caller may not
 * manage it. Unauthenticated callers are redirected to login.
 */
async function getManagerOrNull(companyId: string): Promise<ManagerCtx | null> {
  try {
    return await requireCompanyManager(companyId);
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    if (e instanceof ForbiddenError) return null;
    throw e;
  }
}

const ACCESS_DENIED = "You do not have access to this company.";

/**
 * Profiles are editable while draft (onboarding) and while published (live
 * edits). They are locked during review and after archival.
 */
function lockedMessage(status: CompanyStatus): string | null {
  if (status === "draft" || status === "published") return null;
  if (status === "archived") return "This company is archived and can no longer be edited.";
  return "This profile is locked while it is under review.";
}

/* -------------------------------------------------------------------------- */
/* FormData helpers                                                           */
/* -------------------------------------------------------------------------- */

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

/** Trimmed value, or undefined when empty — keeps zod coercions honest. */
function opt(fd: FormData, key: string): string | undefined {
  const v = str(fd, key).trim();
  return v === "" ? undefined : v;
}

function readIdentity(fd: FormData) {
  return {
    name: str(fd, "name"),
    website: str(fd, "website"),
    hqCity: str(fd, "hqCity"),
    hqCountry: str(fd, "hqCountry"),
    industry: str(fd, "industry"),
    subindustry: str(fd, "subindustry"),
    foundedYear: opt(fd, "foundedYear"),
    stage: str(fd, "stage"),
    businessModel: str(fd, "businessModel"),
    shortDescription: str(fd, "shortDescription"),
  };
}

function identityColumns(d: CompanyIdentityInput) {
  return {
    name: d.name,
    website: d.website ?? null,
    hqCity: d.hqCity ?? null,
    hqCountry: d.hqCountry ?? null,
    industry: d.industry,
    subindustry: d.subindustry ?? null,
    foundedYear: d.foundedYear ?? null,
    stage: d.stage,
    businessModel: d.businessModel,
    shortDescription: d.shortDescription,
  };
}

/** Indices of dynamic rows submitted as `${prefix}_${i}_...` fields. */
function rowIndices(fd: FormData, prefix: string, marker: string): number[] {
  const pattern = new RegExp(`^${prefix}_(\\d+)_${marker}$`);
  const indices = new Set<number>();
  for (const key of fd.keys()) {
    const m = pattern.exec(key);
    if (m) indices.add(Number(m[1]));
  }
  return [...indices].sort((a, b) => a - b);
}

function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  if ("code" in e && (e as { code?: unknown }).code === "23505") return true;
  if ("cause" in e) return isUniqueViolation((e as { cause?: unknown }).cause);
  return false;
}

/* -------------------------------------------------------------------------- */
/* Step 1 — create draft                                                      */
/* -------------------------------------------------------------------------- */

export async function createCompanyDraft(
  _prev: FounderFormState,
  formData: FormData,
): Promise<FounderFormState> {
  let user: AuthedUser;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const parsed = companyIdentitySchema.safeParse(readIdentity(formData));
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));

  const base = slugify(parsed.data.name) || "company";
  let companyId: string | null = null;

  // Retry with a random suffix on slug collision (max 3 attempts).
  for (let attempt = 0; attempt < 3 && companyId === null; attempt++) {
    const slug = attempt === 0 ? base : withSlugSuffix(base);
    try {
      companyId = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(companies)
          .values({
            ...identityColumns(parsed.data),
            slug,
            status: "draft",
            createdBy: user.id,
          })
          .returning({ id: companies.id });
        await tx.insert(companyMembers).values({
          companyId: row.id,
          userId: user.id,
          name: user.name,
          role: "founder",
          displayOrder: 0,
        });
        return row.id;
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }

  if (companyId === null) {
    return err("We could not reserve a web address for this company name. Please try again.");
  }

  await grantRole(user.id, "founder");
  await recordAudit({
    actorUserId: user.id,
    action: "company.created",
    entityType: "company",
    entityId: companyId,
    metadata: { name: parsed.data.name },
  });

  redirect(`/founder/onboarding/${companyId}/goals`);
}

/* -------------------------------------------------------------------------- */
/* Step 1 (edit) / manage — identity                                          */
/* -------------------------------------------------------------------------- */

export async function saveIdentity(
  companyId: string,
  mode: FormMode,
  _prev: FounderFormState,
  formData: FormData,
): Promise<FounderFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);
  const locked = lockedMessage(ctx.company.status);
  if (locked) return err(locked);

  const parsed = companyIdentitySchema.safeParse(readIdentity(formData));
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));

  await db
    .update(companies)
    .set({ ...identityColumns(parsed.data), updatedAt: new Date() })
    .where(eq(companies.id, companyId));

  await recordAudit({
    actorUserId: ctx.user.id,
    action: "company.updated",
    entityType: "company",
    entityId: companyId,
    metadata: { section: "identity" },
  });

  if (mode === "onboarding") redirect(`/founder/onboarding/${companyId}/goals`);
  return { status: "success", message: "Company details saved." };
}

/* -------------------------------------------------------------------------- */
/* Step 2 — goals / intents                                                   */
/* -------------------------------------------------------------------------- */

export async function saveGoals(
  companyId: string,
  mode: FormMode,
  _prev: FounderFormState,
  formData: FormData,
): Promise<FounderFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);
  const locked = lockedMessage(ctx.company.status);
  if (locked) return err(locked);

  const parsed = companyGoalsSchema.safeParse({
    intents: formData.getAll("intents").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));

  try {
    await db.transaction(async (tx) => {
      await tx.delete(companyIntents).where(eq(companyIntents.companyId, companyId));
      await tx
        .insert(companyIntents)
        .values(parsed.data.intents.map((intent) => ({ companyId, intent })));
      await tx.update(companies).set({ updatedAt: new Date() }).where(eq(companies.id, companyId));
    });
  } catch (e) {
    // Two concurrent saves can interleave delete+insert; the PK turns the
    // race into a unique violation rather than corrupt data. Ask to retry.
    if (isUniqueViolation(e)) return err(CONCURRENT_SAVE_MESSAGE);
    throw e;
  }

  await recordAudit({
    actorUserId: ctx.user.id,
    action: "company.updated",
    entityType: "company",
    entityId: companyId,
    metadata: { section: "goals", intents: parsed.data.intents },
  });

  if (mode === "onboarding") redirect(`/founder/onboarding/${companyId}/metrics`);
  return { status: "success", message: "Goals saved." };
}

/* -------------------------------------------------------------------------- */
/* Step 3 — metrics                                                           */
/* -------------------------------------------------------------------------- */

export async function saveMetrics(
  companyId: string,
  mode: FormMode,
  _prev: FounderFormState,
  formData: FormData,
): Promise<FounderFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);
  const locked = lockedMessage(ctx.company.status);
  if (locked) return err(locked);

  const rows = rowIndices(formData, "metric", "type").map((i) => ({
    metricType: str(formData, `metric_${i}_type`),
    value: opt(formData, `metric_${i}_value`),
    currency: opt(formData, `metric_${i}_currency`),
    asOf: str(formData, `metric_${i}_asOf`),
  }));

  const parsed = companyMetricsSchema.safeParse({ metrics: rows });
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));

  // The DB enforces one value per (metric, as-of date); catch it up front.
  const seen = new Set<string>();
  for (let i = 0; i < parsed.data.metrics.length; i++) {
    const m = parsed.data.metrics[i];
    const key = `${m.metricType}|${m.asOf}`;
    if (seen.has(key)) {
      return err("Two entries share the same metric and date. Keep one value per metric per date.", {
        [`metrics.${i}.asOf`]: "Duplicate of another entry with the same metric and date",
      });
    }
    seen.add(key);
  }

  try {
    await db.transaction(async (tx) => {
      await tx.delete(companyMetrics).where(eq(companyMetrics.companyId, companyId));
      if (parsed.data.metrics.length > 0) {
        await tx.insert(companyMetrics).values(
          parsed.data.metrics.map((m) => ({
            companyId,
            metricType: m.metricType,
            value: String(m.value),
            currency: MONETARY_METRICS.has(m.metricType as MetricType)
              ? (m.currency ?? "USD")
              : null,
            asOf: m.asOf,
          })),
        );
      }
      await tx.update(companies).set({ updatedAt: new Date() }).where(eq(companies.id, companyId));
    });
  } catch (e) {
    // Concurrent saves (double-click, second tab) interleave delete+insert;
    // the unique point constraint turns that into a 23505 instead of dupes.
    if (isUniqueViolation(e)) return err(CONCURRENT_SAVE_MESSAGE);
    throw e;
  }

  await recordAudit({
    actorUserId: ctx.user.id,
    action: "company.metrics_updated",
    entityType: "company",
    entityId: companyId,
    metadata: { count: parsed.data.metrics.length },
  });

  if (mode === "onboarding") redirect(`/founder/onboarding/${companyId}/story`);
  return { status: "success", message: "Metrics saved." };
}

/* -------------------------------------------------------------------------- */
/* Step 4 — story                                                             */
/* -------------------------------------------------------------------------- */

export async function saveStory(
  companyId: string,
  mode: FormMode,
  _prev: FounderFormState,
  formData: FormData,
): Promise<FounderFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);
  const locked = lockedMessage(ctx.company.status);
  if (locked) return err(locked);

  const parsed = companyStorySchema.safeParse({
    problem: str(formData, "problem"),
    solution: str(formData, "solution"),
    market: str(formData, "market"),
    competitivePosition: str(formData, "competitivePosition"),
    businessModelDescription: str(formData, "businessModelDescription"),
    traction: str(formData, "traction"),
    roadmap: str(formData, "roadmap"),
    fullDescription: str(formData, "fullDescription"),
  });
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));

  const d = parsed.data;
  await db
    .update(companies)
    .set({
      problem: d.problem ?? null,
      solution: d.solution ?? null,
      market: d.market ?? null,
      competitivePosition: d.competitivePosition ?? null,
      businessModelDescription: d.businessModelDescription ?? null,
      traction: d.traction ?? null,
      roadmap: d.roadmap ?? null,
      fullDescription: d.fullDescription ?? null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  await recordAudit({
    actorUserId: ctx.user.id,
    action: "company.updated",
    entityType: "company",
    entityId: companyId,
    metadata: { section: "story" },
  });

  if (mode === "onboarding") redirect(`/founder/onboarding/${companyId}/team`);
  return { status: "success", message: "Story saved." };
}

/* -------------------------------------------------------------------------- */
/* Step 5 — team                                                              */
/* -------------------------------------------------------------------------- */

export async function saveTeam(
  companyId: string,
  mode: FormMode,
  _prev: FounderFormState,
  formData: FormData,
): Promise<FounderFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);
  const locked = lockedMessage(ctx.company.status);
  if (locked) return err(locked);

  const rows = rowIndices(formData, "member", "name").map((i) => ({
    name: str(formData, `member_${i}_name`),
    role: str(formData, `member_${i}_role`),
    title: str(formData, `member_${i}_title`),
    bio: str(formData, `member_${i}_bio`),
  }));
  const parsed = companyTeamSchema.safeParse({ members: rows });
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));

  // The creator's founder row is protected: title/bio are editable through
  // dedicated fields, the row itself can never be removed.
  const creatorId = ctx.company.createdBy;
  const [creatorRow] = await db
    .select()
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.userId, creatorId)))
    .limit(1);

  const creatorParsed = teamMemberSchema.safeParse({
    name: creatorRow?.name ?? "Founder",
    role: "founder",
    title: str(formData, "creatorTitle"),
    bio: str(formData, "creatorBio"),
  });
  if (!creatorParsed.success) {
    const zoderrs = fieldErrorsOf(creatorParsed.error);
    return err(VALIDATION_MESSAGE, {
      ...(zoderrs.title ? { creatorTitle: zoderrs.title } : {}),
      ...(zoderrs.bio ? { creatorBio: zoderrs.bio } : {}),
    });
  }

  try {
    await db.transaction(async (tx) => {
      if (creatorRow) {
      // Remove everything except the protected creator row, then refresh it.
      await tx
        .delete(companyMembers)
        .where(and(eq(companyMembers.companyId, companyId), ne(companyMembers.id, creatorRow.id)));
      await tx
        .update(companyMembers)
        .set({
          title: creatorParsed.data.title ?? null,
          bio: creatorParsed.data.bio ?? null,
          displayOrder: 0,
          updatedAt: new Date(),
        })
        .where(eq(companyMembers.id, creatorRow.id));
    } else {
      // Defensive: recreate the creator's row if it is somehow missing.
      await tx.delete(companyMembers).where(eq(companyMembers.companyId, companyId));
      const [creatorUser] = await tx
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, creatorId))
        .limit(1);
      await tx.insert(companyMembers).values({
        companyId,
        userId: creatorId,
        name: creatorUser?.name ?? "Founder",
        role: "founder",
        title: creatorParsed.data.title ?? null,
        bio: creatorParsed.data.bio ?? null,
        displayOrder: 0,
      });
    }

    if (parsed.data.members.length > 0) {
      await tx.insert(companyMembers).values(
        parsed.data.members.map((m, i) => ({
          companyId,
          userId: null,
          name: m.name,
          role: m.role,
          title: m.title ?? null,
          bio: m.bio ?? null,
          displayOrder: i + 1,
        })),
      );
    }
    await tx.update(companies).set({ updatedAt: new Date() }).where(eq(companies.id, companyId));
    });
  } catch (e) {
    // Interleaved concurrent saves trip the one-linked-user-per-company
    // partial unique index; surface a retry message instead of a 500.
    if (isUniqueViolation(e)) return err(CONCURRENT_SAVE_MESSAGE);
    throw e;
  }

  await recordAudit({
    actorUserId: ctx.user.id,
    action: "company.team_updated",
    entityType: "company",
    entityId: companyId,
    metadata: { count: parsed.data.members.length + 1 },
  });

  if (mode === "onboarding") redirect(`/founder/onboarding/${companyId}/review`);
  return { status: "success", message: "Team saved." };
}

/* -------------------------------------------------------------------------- */
/* Step 7 — submit for review                                                 */
/* -------------------------------------------------------------------------- */

export async function submitCompany(
  companyId: string,
  _prev: FounderFormState,
  _formData: FormData,
): Promise<FounderFormState> {
  // Signature matches useActionState; the submit form carries no fields.
  void _prev;
  void _formData;
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);
  const { company } = ctx;

  if (company.status !== "draft") {
    return err(
      company.status === "submitted" || company.status === "under_review"
        ? "This company has already been submitted and is awaiting review."
        : "Only draft companies can be submitted for review.",
    );
  }

  const intentRows = await db
    .select({ intent: companyIntents.intent })
    .from(companyIntents)
    .where(eq(companyIntents.companyId, companyId));

  const parsed = submissionRequirementsSchema.safeParse({
    identity: {
      name: company.name,
      website: company.website ?? "",
      hqCity: company.hqCity ?? "",
      hqCountry: company.hqCountry ?? "",
      industry: company.industry ?? "",
      subindustry: company.subindustry ?? "",
      foundedYear: company.foundedYear ?? undefined,
      stage: company.stage ?? "",
      businessModel: company.businessModel ?? "",
      shortDescription: company.shortDescription ?? "",
    },
    intents: intentRows.map((r) => r.intent),
  });

  if (!parsed.success) {
    return err(
      "Your profile is missing required information. Complete the items below, then submit again.",
      fieldErrorsOf(parsed.error),
    );
  }

  // Guarded transition: if a concurrent action already moved the company out
  // of draft, report it instead of recording a submission that never happened.
  const transitioned = await db
    .update(companies)
    .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(companies.id, companyId), eq(companies.status, "draft")))
    .returning({ id: companies.id });
  if (transitioned.length === 0) {
    return err("This company is no longer a draft and cannot be submitted again.");
  }

  await recordAudit({
    actorUserId: ctx.user.id,
    action: "company.submitted",
    entityType: "company",
    entityId: companyId,
  });

  redirect(`/founder/companies/${companyId}?submitted=1`);
}

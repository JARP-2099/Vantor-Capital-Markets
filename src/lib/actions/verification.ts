"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { getCompanyByIdUnscoped } from "@/db/queries/companies";
import {
  getLatestRequestsByCategory,
  getVerificationRequestById,
} from "@/db/queries/verifications";
import { verificationEvidence, verificationRequests } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import {
  type AuthedUser,
  ForbiddenError,
  requireAdmin,
  requireCompanyManager,
  UnauthorizedError,
} from "@/lib/authz";
import {
  type EvidenceKind,
  VERIFICATION_CATEGORIES,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_TRANSITIONS,
  type VerificationStatus,
} from "@/lib/verification/constants";

/**
 * Verification server actions. Every mutation:
 *   1. re-derives access server-side (requireCompanyManager for founder
 *      actions with a server-bound companyId, requireAdmin for decisions),
 *   2. re-validates all input with zod — client validation is UX only,
 *   3. enforces status guards against the row's CURRENT state (the WHERE
 *      clause re-checks status so concurrent reviewers apply at most once),
 *   4. records an audit entry and revalidates affected surfaces.
 * internalNotes are admin-only: founder actions never read, return, or log
 * them, and audit metadata never carries note content.
 */

/* -------------------------------------------------------------------------- */
/* Shared action state                                                        */
/* -------------------------------------------------------------------------- */

export type VerificationFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Keyed by dotted zod path, e.g. "claimSummary", "evidence.description". */
  fieldErrors?: Record<string, string>;
};

export type VerificationDecisionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: { founderNote?: string; internalNotes?: string };
} | null;

function err(message: string, fieldErrors?: Record<string, string>): VerificationFormState {
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
const GENERIC_ERROR = "Something went wrong. Please try again.";
const ACCESS_DENIED = "You do not have access to this company.";

/* -------------------------------------------------------------------------- */
/* Authorization helpers                                                      */
/* -------------------------------------------------------------------------- */

type ManagerCtx = { user: AuthedUser; company: { id: string; slug: string } };

/** Manager context or null; unauthenticated callers go to login. */
async function getManagerOrNull(companyId: string): Promise<ManagerCtx | null> {
  try {
    const { user, company } = await requireCompanyManager(companyId);
    return { user, company: { id: company.id, slug: company.slug } };
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/login");
    if (e instanceof ForbiddenError) return null;
    throw e;
  }
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/** Kinds founders may attach directly; provider integrations plug in later. */
const FOUNDER_EVIDENCE_KINDS = [
  "document_reference",
  "external_url",
  "attestation",
] as const satisfies readonly Exclude<EvidenceKind, "provider_integration">[];

const claimSummarySchema = z
  .string()
  .trim()
  .min(10, "State the claim in at least 10 characters.")
  .max(2000, "Keep the claim summary under 2,000 characters.");

const evidenceFieldsSchema = z.object({
  kind: z.enum(FOUNDER_EVIDENCE_KINDS, { error: "Select an evidence type." }),
  description: z
    .string()
    .trim()
    .min(5, "Describe the evidence in at least 5 characters.")
    .max(1000, "Keep the evidence description under 1,000 characters."),
  reference: z
    .string()
    .trim()
    .max(500, "Keep the reference under 500 characters.")
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

const submitSchema = z.object({
  category: z.enum(VERIFICATION_CATEGORIES, { error: "Select a category." }),
  claimSummary: claimSummarySchema,
  evidence: evidenceFieldsSchema.optional(),
});

const addEvidenceSchema = evidenceFieldsSchema.extend({
  requestId: z.uuid({ error: "Invalid request reference." }),
});

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

/* -------------------------------------------------------------------------- */
/* Founder — submit a verification request                                    */
/* -------------------------------------------------------------------------- */

export async function submitVerificationRequest(
  companyId: string,
  _prev: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);

  // The initial-evidence block is optional as a whole: validate it only when
  // the founder filled in any of its fields.
  const wantsEvidence = ["evidenceKind", "evidenceDescription", "evidenceReference"].some(
    (key) => str(formData, key).trim() !== "",
  );

  const parsed = submitSchema.safeParse({
    category: str(formData, "category"),
    claimSummary: str(formData, "claimSummary"),
    ...(wantsEvidence
      ? {
          evidence: {
            kind: str(formData, "evidenceKind"),
            description: str(formData, "evidenceDescription"),
            reference: str(formData, "evidenceReference"),
          },
        }
      : {}),
  });
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));
  const { category, claimSummary, evidence } = parsed.data;

  try {
    // One open request per category: the latest request governs the category,
    // so a new submission is rejected while one is still awaiting review.
    const latest = (await getLatestRequestsByCategory(companyId)).get(category);
    if (latest && (latest.status === "pending" || latest.status === "under_review")) {
      return err("A request for this category is already awaiting review.", {
        category: "Already awaiting review",
      });
    }

    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(verificationRequests)
        .values({ companyId, category, claimSummary, submittedBy: ctx.user.id })
        .returning({ id: verificationRequests.id });
      if (evidence) {
        await tx.insert(verificationEvidence).values({
          requestId: row.id,
          kind: evidence.kind,
          description: evidence.description,
          reference: evidence.reference ?? null,
          addedBy: ctx.user.id,
        });
      }
    });

    await recordAudit({
      actorUserId: ctx.user.id,
      action: "verification.submitted",
      entityType: "company",
      entityId: companyId,
      metadata: { category },
    });

    revalidatePath(`/founder/companies/${companyId}/verification`);
    revalidatePath("/admin/verifications");
    revalidatePath(`/companies/${ctx.company.slug}`);

    return {
      status: "success",
      message: "Verification request submitted. The Vantor review team will take it from here.",
    };
  } catch (e) {
    console.error("[verification] submit failed", e);
    return err(GENERIC_ERROR);
  }
}

/* -------------------------------------------------------------------------- */
/* Founder — add evidence to an existing request                              */
/* -------------------------------------------------------------------------- */

export async function addVerificationEvidence(
  companyId: string,
  _prev: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const ctx = await getManagerOrNull(companyId);
  if (!ctx) return err(ACCESS_DENIED);

  const parsed = addEvidenceSchema.safeParse({
    requestId: str(formData, "requestId"),
    kind: str(formData, "evidenceKind"),
    description: str(formData, "evidenceDescription"),
    reference: str(formData, "evidenceReference"),
  });
  if (!parsed.success) return err(VALIDATION_MESSAGE, fieldErrorsOf(parsed.error));
  const { requestId, kind, description, reference } = parsed.data;

  try {
    // The request must belong to THIS company (the server-bound one) and
    // still be open to evidence. Same error for missing and not-yours.
    const request = await getVerificationRequestById(requestId);
    if (!request || request.companyId !== companyId) {
      return err("Verification request not found.");
    }
    const open: string[] = ["pending", "under_review", "needs_update"];
    if (!open.includes(request.status)) {
      return err("This request has been decided — evidence can no longer be added to it.");
    }

    await db.insert(verificationEvidence).values({
      requestId,
      kind,
      description,
      reference: reference ?? null,
      addedBy: ctx.user.id,
    });

    await recordAudit({
      actorUserId: ctx.user.id,
      action: "verification.evidence_added",
      entityType: "company",
      entityId: companyId,
      metadata: { category: request.category, requestId, kind },
    });

    revalidatePath(`/founder/companies/${companyId}/verification`);
    revalidatePath("/admin/verifications");
    revalidatePath(`/admin/verifications/${requestId}`);

    return { status: "success", message: "Evidence added to the request." };
  } catch (e) {
    console.error("[verification] add evidence failed", e);
    return err(GENERIC_ERROR);
  }
}

/* -------------------------------------------------------------------------- */
/* Admin — decide a verification request                                      */
/* -------------------------------------------------------------------------- */

const DECISIONS = [
  "start_review",
  "verify",
  "partially_verify",
  "reject",
  "needs_update",
  "expire",
] as const;
type Decision = (typeof DECISIONS)[number];

const DECISION_TARGET: Record<Decision, VerificationStatus> = {
  start_review: "under_review",
  verify: "verified",
  partially_verify: "partially_verified",
  reject: "rejected",
  needs_update: "needs_update",
  expire: "expired",
};

const DECISION_SUCCESS: Record<Decision, string> = {
  start_review: "Review started.",
  verify: "Marked verified.",
  partially_verify: "Marked partially verified.",
  reject: "Request rejected with a note to the founder.",
  needs_update: "Updates requested from the founder.",
  expire: "Marked expired.",
};

const optionalNote = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max.toLocaleString("en-US")} characters.`)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const decisionSchema = z.object({
  requestId: z.uuid({ error: "Invalid request reference." }),
  decision: z.enum(DECISIONS, { error: "Unknown decision." }),
  internalNotes: optionalNote(2000, "internal notes"),
  founderNote: optionalNote(1000, "the founder note"),
});

export async function adminDecideVerification(
  _prev: VerificationDecisionState,
  formData: FormData,
): Promise<VerificationDecisionState> {
  // 1. Authorization — the action is the security boundary, not the page.
  let admin: AuthedUser;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return { ok: false, error: "Your session has expired. Please sign in again." };
    }
    if (e instanceof ForbiddenError) {
      return { ok: false, error: "Admin access is required for this action." };
    }
    console.error("[verification] auth check failed", e);
    return { ok: false, error: GENERIC_ERROR };
  }

  const parsed = decisionSchema.safeParse({
    requestId: str(formData, "requestId"),
    decision: str(formData, "decision"),
    internalNotes: str(formData, "internalNotes"),
    founderNote: str(formData, "founderNote"),
  });
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error);
    if (fieldErrors.founderNote || fieldErrors.internalNotes) {
      return {
        ok: false,
        fieldErrors: {
          founderNote: fieldErrors.founderNote,
          internalNotes: fieldErrors.internalNotes,
        },
      };
    }
    return { ok: false, error: fieldErrors.requestId ?? fieldErrors.decision ?? GENERIC_ERROR };
  }
  const { requestId, decision, internalNotes, founderNote } = parsed.data;

  // Rejections and update requests must tell the founder why.
  if ((decision === "reject" || decision === "needs_update") && !founderNote) {
    return {
      ok: false,
      fieldErrors: {
        founderNote:
          "A note to the founder is required when rejecting or requesting updates.",
      },
    };
  }

  try {
    const request = await getVerificationRequestById(requestId);
    if (!request) return { ok: false, error: "Verification request not found." };

    // 2. Enforce the transition against the CURRENT status — server-side,
    //    independent of which buttons the UI happened to render.
    const from = request.status as VerificationStatus;
    const to = DECISION_TARGET[decision];
    if (!VERIFICATION_TRANSITIONS[from].includes(to)) {
      return {
        ok: false,
        error: `This decision is not available while the request is ${VERIFICATION_STATUS_LABELS[from]}. Refresh the page to see its current state.`,
      };
    }

    // 3. Guarded update: WHERE re-checks status so a concurrent reviewer
    //    (or a double-click) applies the transition at most once.
    const updated = await db
      .update(verificationRequests)
      .set({
        status: to,
        reviewedBy: admin.id,
        // Starting a review is not a decision; decidedAt marks outcomes.
        ...(decision === "start_review" ? {} : { decidedAt: new Date() }),
        ...(internalNotes !== undefined ? { internalNotes } : {}),
        ...(founderNote !== undefined ? { founderNote } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(verificationRequests.id, requestId), eq(verificationRequests.status, from)))
      .returning({ id: verificationRequests.id });

    if (updated.length === 0) {
      return {
        ok: false,
        error: "This request changed state while you were reviewing. Refresh and try again.",
      };
    }

    // 4. Audit trail — small, non-sensitive context only; never note content.
    await recordAudit({
      actorUserId: admin.id,
      action: "verification.decided",
      entityType: "company",
      entityId: request.companyId,
      metadata: { category: request.category, from, to, requestId },
    });

    revalidatePath("/admin/verifications");
    revalidatePath(`/admin/verifications/${requestId}`);
    revalidatePath(`/founder/companies/${request.companyId}/verification`);
    const company = await getCompanyByIdUnscoped(request.companyId);
    if (company) revalidatePath(`/companies/${company.slug}`);

    return { ok: true, message: DECISION_SUCCESS[decision] };
  } catch (e) {
    console.error("[verification] decision failed", e);
    return { ok: false, error: GENERIC_ERROR };
  }
}

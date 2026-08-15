"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { getCompanyByIdUnscoped } from "@/db/queries/companies";
import { companies } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import {
  type AuthedUser,
  ForbiddenError,
  requireAdmin,
  UnauthorizedError,
} from "@/lib/authz";
import { STATUS_LABELS, type CompanyStatus } from "@/lib/constants";

/**
 * Admin review mutations. Every action:
 *   1. requireAdmin() — authorization is checked here, never in the UI.
 *   2. loads the company and verifies the requested transition is legal.
 *   3. applies the update with the allowed source statuses re-checked in the
 *      UPDATE's WHERE clause, so double submits / concurrent reviewers can
 *      never apply a transition twice.
 *   4. records an audit entry and revalidates affected surfaces.
 * Failures return typed state for the form — never a raw stack trace.
 */

export type ReviewActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: { notes?: string };
} | null;

const GENERIC_ERROR = "Something went wrong. Please try again.";

const companyIdSchema = z.uuid();

const notesSchema = z
  .string()
  .trim()
  .min(10, "Write at least 10 characters of feedback for the founder.")
  .max(2000, "Keep review notes under 2,000 characters.");

type TransitionSpec = {
  /** Human label used in error messages, e.g. "Approve & publish". */
  label: string;
  /** Statuses this transition may start from. */
  from: CompanyStatus[];
  /** Status the transition moves to (recorded in audit metadata). */
  to: CompanyStatus;
  /** Dot-separated audit action name. */
  auditAction: string;
  /** When true, a validated `notes` field is required and stored. */
  requiresNotes?: boolean;
  /** Include the notes in audit metadata (rejection/unpublish feedback). */
  notesInMetadata?: boolean;
  /** Column updates to apply (status transition + side effects). */
  set: (ctx: { admin: AuthedUser; notes?: string }) => Partial<typeof companies.$inferInsert>;
  successMessage: string;
};

async function runTransition(
  formData: FormData,
  spec: TransitionSpec,
): Promise<ReviewActionState> {
  // 1. Authorization — the action is the security boundary, not the page.
  let admin: AuthedUser;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: "Your session has expired. Please sign in again." };
    }
    if (err instanceof ForbiddenError) {
      return { ok: false, error: "Admin access is required for this action." };
    }
    console.error("[admin-review] auth check failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }

  const parsedId = companyIdSchema.safeParse(formData.get("companyId"));
  if (!parsedId.success) return { ok: false, error: "Invalid company reference." };
  const companyId = parsedId.data;

  let notes: string | undefined;
  if (spec.requiresNotes) {
    const parsedNotes = notesSchema.safeParse(String(formData.get("notes") ?? ""));
    if (!parsedNotes.success) {
      return {
        ok: false,
        fieldErrors: {
          notes: parsedNotes.error.issues[0]?.message ?? "Review notes are required.",
        },
      };
    }
    notes = parsedNotes.data;
  }

  try {
    // 2. Verify the transition is legal for the company's CURRENT status —
    //    server-side, independent of which buttons the UI happened to render.
    const company = await getCompanyByIdUnscoped(companyId);
    if (!company) return { ok: false, error: "Company not found." };
    if (!spec.from.includes(company.status)) {
      return {
        ok: false,
        error: `"${spec.label}" is not available while this company is ${STATUS_LABELS[company.status]}. Refresh the page to see its current state.`,
      };
    }

    // 3. Guarded update: the WHERE clause re-checks status so a concurrent
    //    transition (double-click, second reviewer) applies at most once.
    const updated = await db
      .update(companies)
      .set({ ...spec.set({ admin, notes }), updatedAt: new Date() })
      .where(and(eq(companies.id, companyId), inArray(companies.status, spec.from)))
      .returning({ id: companies.id });

    if (updated.length === 0) {
      return {
        ok: false,
        error: "This company changed state while you were reviewing. Refresh and try again.",
      };
    }

    // 4. Audit trail. Metadata holds small, non-sensitive context only.
    await recordAudit({
      actorUserId: admin.id,
      action: spec.auditAction,
      entityType: "company",
      entityId: companyId,
      metadata: {
        from: company.status,
        to: spec.to,
        ...(spec.notesInMetadata && notes ? { notes } : {}),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/companies");
    revalidatePath(`/admin/companies/${companyId}`);
    revalidatePath("/companies");
    revalidatePath(`/companies/${company.slug}`);
    revalidatePath("/founder");

    return { ok: true, message: spec.successMessage };
  } catch (err) {
    console.error(`[admin-review] ${spec.auditAction} failed`, err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** submitted → under_review */
export async function startReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  return runTransition(formData, {
    label: "Start review",
    from: ["submitted"],
    to: "under_review",
    auditAction: "company.review_started",
    set: () => ({ status: "under_review" }),
    successMessage: "Review started.",
  });
}

/** submitted | under_review → published */
export async function approveCompanyAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  return runTransition(formData, {
    label: "Approve & publish",
    from: ["submitted", "under_review"],
    to: "published",
    auditAction: "company.approved",
    set: ({ admin }) => ({
      status: "published",
      publishedAt: new Date(),
      reviewedBy: admin.id,
      reviewNotes: null,
    }),
    successMessage: "Company approved and published.",
  });
}

/** submitted | under_review → draft, with required feedback for the founder. */
export async function sendBackToFounderAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  return runTransition(formData, {
    label: "Send back to founder",
    from: ["submitted", "under_review"],
    to: "draft",
    auditAction: "company.rejected",
    requiresNotes: true,
    notesInMetadata: true,
    set: ({ admin, notes }) => ({
      status: "draft",
      reviewNotes: notes,
      reviewedBy: admin.id,
    }),
    successMessage: "Sent back to the founder with your notes.",
  });
}

/** published → draft, with required notes so the founder knows why. */
export async function unpublishCompanyAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  return runTransition(formData, {
    label: "Unpublish",
    from: ["published"],
    to: "draft",
    auditAction: "company.unpublished",
    requiresNotes: true,
    notesInMetadata: true,
    set: ({ admin, notes }) => ({
      status: "draft",
      publishedAt: null,
      reviewNotes: notes,
      reviewedBy: admin.id,
    }),
    successMessage: "Company unpublished and returned to draft.",
  });
}

/** draft | published → archived */
export async function archiveCompanyAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  return runTransition(formData, {
    label: "Archive",
    from: ["draft", "published"],
    to: "archived",
    auditAction: "company.archived",
    set: () => ({ status: "archived", archivedAt: new Date() }),
    successMessage: "Company archived.",
  });
}

/** archived → draft */
export async function restoreCompanyAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  return runTransition(formData, {
    label: "Restore to draft",
    from: ["archived"],
    to: "draft",
    auditAction: "company.restored",
    set: () => ({ status: "draft", archivedAt: null }),
    successMessage: "Company restored to draft.",
  });
}

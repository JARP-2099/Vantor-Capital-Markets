import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { verificationEvidence, verificationRequests } from "@/db/schema";
import type { VerificationCategory, VerificationStatus } from "@/lib/verification/constants";

/**
 * Verification read layer.
 *
 * Visibility rules:
 *  - PUBLIC surfaces may see only the per-category STATUS summary — never
 *    claim summaries, evidence, internal notes, or reviewer identity.
 *  - FOUNDER surfaces (callers must hold requireCompanyManager) may see
 *    their requests, evidence, and founderNote — never internalNotes.
 *  - ADMIN surfaces (requireAdmin) see everything.
 */

export type VerificationRequestRow = typeof verificationRequests.$inferSelect;
export type VerificationEvidenceRow = typeof verificationEvidence.$inferSelect;

/** Latest request per category (governs the category's displayed status). */
export async function getLatestRequestsByCategory(
  companyId: string,
): Promise<Map<VerificationCategory, VerificationRequestRow>> {
  const rows = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.companyId, companyId))
    .orderBy(desc(verificationRequests.createdAt));
  const byCategory = new Map<VerificationCategory, VerificationRequestRow>();
  for (const row of rows) {
    const cat = row.category as VerificationCategory;
    if (!byCategory.has(cat)) byCategory.set(cat, row);
  }
  return byCategory;
}

export type PublicVerificationSummary = {
  /** Latest status per category — status only, safe for public display. */
  categories: Array<{ category: VerificationCategory; status: VerificationStatus }>;
  verifiedCount: number;
  /** Categories with at least one submission (the denominator). */
  submittedCount: number;
  /** Percent of submitted categories fully verified; null if none submitted. */
  verifiedPct: number | null;
};

/**
 * Public-safe verification summary. Partial verification counts as half a
 * category. "Not submitted" categories are excluded from the percentage so
 * the number always means: "of the information submitted for review, this
 * share has been verified" — never a claim about unsubmitted data.
 */
export async function getPublicVerificationSummary(
  companyId: string,
): Promise<PublicVerificationSummary> {
  const byCategory = await getLatestRequestsByCategory(companyId);
  const categories = [...byCategory.entries()].map(([category, row]) => ({
    category,
    status: row.status as VerificationStatus,
  }));
  const submitted = categories.length;
  const verifiedWeight = categories.reduce((s, c) => {
    if (c.status === "verified") return s + 1;
    if (c.status === "partially_verified") return s + 0.5;
    return s;
  }, 0);
  return {
    categories,
    verifiedCount: categories.filter((c) => c.status === "verified").length,
    submittedCount: submitted,
    verifiedPct: submitted === 0 ? null : Math.round((verifiedWeight / submitted) * 100),
  };
}

/** Founder view: full requests for a company (no internalNotes — strip!). */
export async function getCompanyVerificationRequests(
  companyId: string,
): Promise<Array<Omit<VerificationRequestRow, "internalNotes">>> {
  const rows = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.companyId, companyId))
    .orderBy(desc(verificationRequests.createdAt));
  return rows.map(({ internalNotes: _internal, ...safe }) => safe);
}

export async function getEvidenceForRequest(
  requestId: string,
): Promise<VerificationEvidenceRow[]> {
  return db
    .select()
    .from(verificationEvidence)
    .where(eq(verificationEvidence.requestId, requestId))
    .orderBy(asc(verificationEvidence.createdAt));
}

/* ------------------------------- Admin reads ------------------------------ */

export async function getPendingVerificationRequests(): Promise<VerificationRequestRow[]> {
  return db
    .select()
    .from(verificationRequests)
    .where(inArray(verificationRequests.status, ["pending", "under_review"]))
    .orderBy(asc(verificationRequests.createdAt));
}

export async function getVerificationRequestById(
  id: string,
): Promise<VerificationRequestRow | null> {
  const [row] = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.id, id))
    .limit(1);
  return row ?? null;
}

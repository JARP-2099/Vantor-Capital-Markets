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

/**
 * Latest request per category (governs the category's displayed status).
 * internalNotes is stripped STRUCTURALLY here: this query serves founder and
 * public paths, and the admin-only field must never depend on render-site
 * discipline to stay private.
 */
export async function getLatestRequestsByCategory(
  companyId: string,
): Promise<Map<VerificationCategory, Omit<VerificationRequestRow, "internalNotes">>> {
  const rows = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.companyId, companyId))
    .orderBy(desc(verificationRequests.createdAt));
  const byCategory = new Map<VerificationCategory, Omit<VerificationRequestRow, "internalNotes">>();
  for (const row of rows) {
    const cat = row.category as VerificationCategory;
    if (!byCategory.has(cat)) {
      const { internalNotes: _internalNotes, ...safe } = row;
      byCategory.set(cat, safe);
    }
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

/** Statuses shown publicly per category. Negative outcomes (rejected,
 * needs_update, expired) stay between the founder and Vantor — a public
 * scarlet letter would deter verification attempts — but they STILL count
 * in the percentage denominator, so hiding them can never inflate the
 * headline number. */
const PUBLICLY_LISTED_STATUSES: ReadonlySet<VerificationStatus> = new Set([
  "verified",
  "partially_verified",
  "pending",
  "under_review",
]);

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
  const all = [...byCategory.entries()].map(([category, row]) => ({
    category,
    status: row.status as VerificationStatus,
  }));
  const submitted = all.length;
  const verifiedWeight = all.reduce((s, c) => {
    if (c.status === "verified") return s + 1;
    if (c.status === "partially_verified") return s + 0.5;
    return s;
  }, 0);
  return {
    categories: all.filter((c) => PUBLICLY_LISTED_STATUSES.has(c.status)),
    verifiedCount: all.filter((c) => c.status === "verified").length,
    submittedCount: submitted,
    verifiedPct: submitted === 0 ? null : Math.round((verifiedWeight / submitted) * 100),
  };
}

export type PublicVerificationStats = {
  /** Percent of submitted categories verified (partial counts as half). */
  verifiedPct: number;
  /** Categories with at least one submission — the percentage denominator. */
  submittedCount: number;
};

/**
 * Batch verification stats for marketplace listings (no N+1). Same math as
 * getPublicVerificationSummary — latest request per category, partial
 * verification counts as half — but returns only the public-safe headline
 * numbers per company. Companies with no submissions are absent from the map.
 */
export async function getPublicVerificationStats(
  companyIds: string[],
): Promise<Map<string, PublicVerificationStats>> {
  const result = new Map<string, PublicVerificationStats>();
  if (companyIds.length === 0) return result;
  const rows = await db
    .select()
    .from(verificationRequests)
    .where(inArray(verificationRequests.companyId, companyIds))
    .orderBy(desc(verificationRequests.createdAt));

  // Latest request per (company, category); rows arrive newest-first.
  const latest = new Map<string, Map<VerificationCategory, VerificationStatus>>();
  for (const row of rows) {
    let byCategory = latest.get(row.companyId);
    if (!byCategory) {
      byCategory = new Map();
      latest.set(row.companyId, byCategory);
    }
    const cat = row.category as VerificationCategory;
    if (!byCategory.has(cat)) byCategory.set(cat, row.status as VerificationStatus);
  }

  for (const [companyId, byCategory] of latest) {
    const statuses = [...byCategory.values()];
    const verifiedWeight = statuses.reduce((s, status) => {
      if (status === "verified") return s + 1;
      if (status === "partially_verified") return s + 0.5;
      return s;
    }, 0);
    result.set(companyId, {
      verifiedPct: Math.round((verifiedWeight / statuses.length) * 100),
      submittedCount: statuses.length,
    });
  }
  return result;
}

/** Headline percent only — thin wrapper over getPublicVerificationStats. */
export async function getPublicVerificationPcts(
  companyIds: string[],
): Promise<Map<string, number>> {
  const stats = await getPublicVerificationStats(companyIds);
  return new Map([...stats].map(([companyId, s]) => [companyId, s.verifiedPct]));
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

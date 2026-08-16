import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { verificationEvidence, verificationRequests } from "@/db/schema";
import {
  getCompanyVerificationRequests,
  getEvidenceForRequest,
  getLatestRequestsByCategory,
  getPublicVerificationSummary,
} from "@/db/queries/verifications";
import { VERIFICATION_TRANSITIONS } from "@/lib/verification/constants";
import { createTestCompany, createTestUser } from "./helpers";

async function addRequest(
  companyId: string,
  submittedBy: string,
  category:
    | "founder_identity"
    | "revenue"
    | "financial_statements"
    | "company_formation",
  status:
    | "pending"
    | "under_review"
    | "verified"
    | "partially_verified"
    | "rejected" = "pending",
  internalNotes?: string,
) {
  const [row] = await db
    .insert(verificationRequests)
    .values({
      companyId,
      category,
      status,
      claimSummary: `Claim for ${category}`,
      submittedBy,
      internalNotes: internalNotes ?? null,
    })
    .returning();
  return row;
}

describe("verification summary math", () => {
  it("returns null percent when nothing submitted", async () => {
    const u = await createTestUser();
    const c = await createTestCompany(u.id);
    const summary = await getPublicVerificationSummary(c.id);
    expect(summary.verifiedPct).toBeNull();
    expect(summary.categories).toHaveLength(0);
  });

  it("computes percent over submitted categories only, partial = half", async () => {
    const u = await createTestUser();
    const c = await createTestCompany(u.id);
    await addRequest(c.id, u.id, "founder_identity", "verified");
    await addRequest(c.id, u.id, "revenue", "partially_verified");
    await addRequest(c.id, u.id, "financial_statements", "pending");
    // (1 + 0.5 + 0) / 3 = 50%
    const summary = await getPublicVerificationSummary(c.id);
    expect(summary.submittedCount).toBe(3);
    expect(summary.verifiedCount).toBe(1);
    expect(summary.verifiedPct).toBe(50);
  });

  it("uses the LATEST request per category for status", async () => {
    const u = await createTestUser();
    const c = await createTestCompany(u.id);
    const first = await addRequest(c.id, u.id, "revenue", "rejected");
    // resubmission after rejection
    await db
      .insert(verificationRequests)
      .values({
        companyId: c.id,
        category: "revenue",
        status: "pending",
        claimSummary: "Resubmitted revenue claim",
        submittedBy: u.id,
        createdAt: new Date(first.createdAt.getTime() + 60_000),
      });
    const byCat = await getLatestRequestsByCategory(c.id);
    expect(byCat.get("revenue")?.status).toBe("pending");
    // history retains both rows
    const all = await getCompanyVerificationRequests(c.id);
    expect(all.filter((r) => r.category === "revenue")).toHaveLength(2);
  });
});

describe("verification privacy", () => {
  it("founder-facing query never exposes internalNotes", async () => {
    const u = await createTestUser();
    const c = await createTestCompany(u.id);
    await addRequest(c.id, u.id, "revenue", "rejected", "internal: docs look photoshopped");
    const rows = await getCompanyVerificationRequests(c.id);
    expect(rows).toHaveLength(1);
    expect("internalNotes" in rows[0]).toBe(false);
    expect(JSON.stringify(rows)).not.toContain("photoshopped");
  });

  it("public summary exposes only category + status", async () => {
    const u = await createTestUser();
    const c = await createTestCompany(u.id);
    await addRequest(c.id, u.id, "revenue", "verified", "secret note");
    const summary = await getPublicVerificationSummary(c.id);
    const json = JSON.stringify(summary);
    expect(json).not.toContain("secret note");
    expect(json).not.toContain("Claim for");
    expect(json).not.toContain(u.id);
  });

  it("evidence is scoped to its request", async () => {
    const u = await createTestUser();
    const c = await createTestCompany(u.id);
    const req = await addRequest(c.id, u.id, "revenue");
    await db.insert(verificationEvidence).values({
      requestId: req.id,
      kind: "external_url",
      description: "Stripe dashboard export",
      reference: "https://example.com/evidence",
      addedBy: u.id,
    });
    expect(await getEvidenceForRequest(req.id)).toHaveLength(1);
    const other = await addRequest(c.id, u.id, "founder_identity");
    expect(await getEvidenceForRequest(other.id)).toHaveLength(0);
  });
});

describe("verification transition map", () => {
  it("terminal states have no exits; founders can never mark verified directly", () => {
    expect(VERIFICATION_TRANSITIONS.rejected).toHaveLength(0);
    expect(VERIFICATION_TRANSITIONS.expired).toHaveLength(0);
    // Sanity: 'verified' is only reachable from review-side states.
    const sources = Object.entries(VERIFICATION_TRANSITIONS)
      .filter(([, targets]) => targets.includes("verified"))
      .map(([from]) => from);
    expect(sources.sort()).toEqual(["partially_verified", "pending", "under_review"]);
  });
});

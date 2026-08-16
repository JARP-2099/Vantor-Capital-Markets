/**
 * Verification vocabulary shared by founder, admin, and public surfaces.
 * Enum values must stay in sync with src/db/schema/verifications.ts.
 */

export const VERIFICATION_CATEGORIES = [
  "founder_identity",
  "company_formation",
  "revenue",
  "financial_statements",
  "ownership",
  "customer_metrics",
  "intellectual_property",
  "operating_metrics",
] as const;
export type VerificationCategory = (typeof VERIFICATION_CATEGORIES)[number];

export const VERIFICATION_CATEGORY_LABELS: Record<VerificationCategory, string> = {
  founder_identity: "Founder Identity",
  company_formation: "Company Formation",
  revenue: "Revenue",
  financial_statements: "Financial Statements",
  ownership: "Ownership",
  customer_metrics: "Customer Metrics",
  intellectual_property: "Intellectual Property",
  operating_metrics: "Operating Metrics",
};

export const VERIFICATION_STATUSES = [
  "pending",
  "under_review",
  "verified",
  "partially_verified",
  "rejected",
  "needs_update",
  "expired",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  verified: "Verified",
  partially_verified: "Partially Verified",
  rejected: "Rejected",
  needs_update: "Needs Update",
  expired: "Expired",
};

export const EVIDENCE_KINDS = [
  "document_reference",
  "external_url",
  "attestation",
  "provider_integration",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  document_reference: "Document (reference)",
  external_url: "External link",
  attestation: "Founder attestation",
  provider_integration: "Provider integration",
};

/**
 * Legal admin status transitions. Founders can only create requests
 * (pending) — every other transition is admin-driven and server-enforced.
 */
export const VERIFICATION_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  pending: ["under_review", "verified", "partially_verified", "rejected"],
  under_review: ["verified", "partially_verified", "rejected", "needs_update"],
  verified: ["expired", "needs_update"],
  partially_verified: ["under_review", "verified", "rejected", "needs_update", "expired"],
  rejected: [],
  needs_update: ["under_review"],
  expired: [],
};

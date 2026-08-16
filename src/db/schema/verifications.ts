import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { companies } from "./companies";

/**
 * Verification foundation. A request asserts that a category of company data
 * is accurate; admins review evidence and decide. Founder-submitted data and
 * independently verified data remain distinct concepts throughout: nothing
 * here ever mutates company metrics — it only records review outcomes.
 *
 * "Not submitted" is represented by the absence of any request for a
 * category, not by a status value. Re-submission after rejection creates a
 * new request; the latest request per category governs display, and older
 * rows remain as auditable history alongside audit_log entries.
 */

export const verificationCategoryEnum = pgEnum("verification_category", [
  "founder_identity",
  "company_formation",
  "revenue",
  "financial_statements",
  "ownership",
  "customer_metrics",
  "intellectual_property",
  "operating_metrics",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "under_review",
  "verified",
  "partially_verified",
  "rejected",
  "needs_update",
  "expired",
]);

/** Evidence kinds. Raw documents are never stored in the database — the
 * future secure document-storage system will hold files; evidence rows keep
 * only descriptions/references. External provider kinds (accounting,
 * payments, banking) plug in later as new kinds without schema redesign. */
export const verificationEvidenceKindEnum = pgEnum("verification_evidence_kind", [
  "document_reference",
  "external_url",
  "attestation",
  "provider_integration",
]);

export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    category: verificationCategoryEnum("category").notNull(),
    status: verificationStatusEnum("status").notNull().default("pending"),
    /** Founder's statement of what they are asking Vantor to verify. */
    claimSummary: text("claim_summary").notNull(),
    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    /** Internal admin notes — never rendered on any public/founder surface. */
    internalNotes: text("internal_notes"),
    /** Optional reviewer note shown to the founder (e.g. why rejected). */
    founderNote: text("founder_note"),
    decidedAt: timestamp("decided_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("verification_requests_company_idx").on(t.companyId, t.category, t.createdAt),
    index("verification_requests_status_idx").on(t.status),
    check("verification_requests_claim_not_empty", sql`length(trim(${t.claimSummary})) > 0`),
    // DB backstop for the action-level "one open request per category" rule:
    // concurrent submissions cannot both land in an open state.
    uniqueIndex("verification_requests_one_open_per_category")
      .on(t.companyId, t.category)
      .where(sql`${t.status} IN ('pending', 'under_review')`),
  ],
);

export const verificationEvidence = pgTable(
  "verification_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => verificationRequests.id, { onDelete: "cascade" }),
    kind: verificationEvidenceKindEnum("kind").notNull(),
    /** What this evidence is (e.g. "FY2025 P&L prepared by our accountant"). */
    description: text("description").notNull(),
    /** Storage key / URL / provider reference — never file contents. */
    reference: text("reference"),
    addedBy: text("added_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("verification_evidence_request_idx").on(t.requestId),
    check("verification_evidence_description_not_empty", sql`length(trim(${t.description})) > 0`),
  ],
);

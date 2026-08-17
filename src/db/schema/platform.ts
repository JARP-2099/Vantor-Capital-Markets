import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { companies } from "./companies";

/* -------------------------------------------------------------------------- */
/* Platform roles (capabilities, not account types)                           */
/* -------------------------------------------------------------------------- */

/**
 * One human, many capabilities: the same account can be founder + investor +
 * buyer. Admin is granted only via this table or the ADMIN_EMAILS bootstrap.
 */
export const platformRoleEnum = pgEnum("platform_role", [
  "founder",
  "investor",
  "buyer",
  "admin",
]);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: platformRoleEnum("role").notNull(),
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
    grantedBy: text("granted_by").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

/* -------------------------------------------------------------------------- */
/* Watchlist — schema ready, UI ships in Phase 4                              */
/* -------------------------------------------------------------------------- */

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.companyId] }),
    index("watchlist_company_idx").on(t.companyId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Beta feedback (Phase 3.5)                                                  */
/* -------------------------------------------------------------------------- */

export const feedbackRoleEnum = pgEnum("feedback_role", ["founder", "investor", "other"]);

/**
 * Lightweight structured beta feedback. Deliberately small: who (optional,
 * from the session), how they use Vantor, where they were, and what they
 * want to say. Not a support-ticket system.
 */
export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null when the account is later deleted; captured from the session. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    role: feedbackRoleEnum("role").notNull(),
    /** Where the feedback is about, e.g. "/companies" (optional, free text). */
    pagePath: text("page_path"),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("feedback_created_idx").on(t.createdAt),
    index("feedback_user_idx").on(t.userId),
    check("feedback_message_not_empty", sql`length(trim(${t.message})) > 0`),
    check("feedback_message_bounded", sql`length(${t.message}) <= 2000`),
    check("feedback_page_path_bounded", sql`${t.pagePath} IS NULL OR length(${t.pagePath}) <= 200`),
  ],
);

/* -------------------------------------------------------------------------- */
/* Product usage events (Phase 3.5)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Minimal product-usage signal for the private beta, kept separate from
 * audit_log (which records governance actions and must stay quiet).
 * Append-only, fire-and-forget, no request/device fingerprinting — just
 * enough to answer "are beta users actually using Vantor?".
 */
export const productEvents = pgTable(
  "product_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for signed-out visitors. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    /** Dot-separated event name, e.g. "company.viewed", "discover.queried". */
    event: text("event").notNull(),
    /** Optional subject (e.g. the viewed company id). */
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("product_events_event_created_idx").on(t.event, t.createdAt),
    index("product_events_created_idx").on(t.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Audit log                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Append-only record of meaningful platform actions. Never store secrets,
 * passwords, or session tokens in `metadata`.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null when the action was performed by the system (e.g. seeding). */
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    /** Dot-separated action name, e.g. "company.submitted", "role.granted". */
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_actor_idx").on(t.actorUserId),
    index("audit_log_created_idx").on(t.createdAt),
  ],
);

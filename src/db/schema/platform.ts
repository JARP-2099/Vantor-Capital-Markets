import {
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

import "server-only";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { companies, companyMembers, userRoles } from "@/db/schema";
import { adminEmails } from "@/env";
import { auth } from "@/lib/auth";

/**
 * Server-side authorization primitives. Every mutation and every protected
 * read MUST go through these helpers — UI visibility is never a security
 * boundary. Helpers throw typed errors so callers (server actions, pages)
 * can map them to redirects or not-found responses without leaking detail.
 */

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this resource") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
};

/** Cached per-request session lookup. Returns null when not signed in. */
export const getSessionUser = cache(async (): Promise<AuthedUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
});

/** Requires a signed-in user; throws UnauthorizedError otherwise. */
export async function requireUser(): Promise<AuthedUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export type PlatformRole = "founder" | "investor" | "buyer" | "admin";

/**
 * Roles for a user: rows from user_roles, plus admin bootstrapped from
 * ADMIN_EMAILS (server env only) so the first admin needs no manual SQL.
 */
export const getUserRoles = cache(async (user: AuthedUser): Promise<Set<PlatformRole>> => {
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));
  const roles = new Set<PlatformRole>(rows.map((r) => r.role));
  if (adminEmails.has(user.email.toLowerCase())) roles.add("admin");
  return roles;
});

export async function isAdmin(user: AuthedUser): Promise<boolean> {
  const roles = await getUserRoles(user);
  return roles.has("admin");
}

/** Requires a signed-in platform admin; throws ForbiddenError otherwise. */
export async function requireAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (!(await isAdmin(user))) throw new ForbiddenError("Admin access required");
  return user;
}

/**
 * Core ownership check, independent of the request context so it can be
 * tested directly: a user may manage a company iff they created it or hold
 * a founder-role membership linked to their user id.
 */
export async function findManageableCompany(
  userId: string,
  companyId: string,
): Promise<typeof companies.$inferSelect | null> {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return null;

  if (company.createdBy === userId) return company;

  const [membership] = await db
    .select({ id: companyMembers.id })
    .from(companyMembers)
    .where(
      and(
        eq(companyMembers.companyId, companyId),
        eq(companyMembers.userId, userId),
        eq(companyMembers.role, "founder"),
      ),
    )
    .limit(1);

  return membership ? company : null;
}

/**
 * Requires that the signed-in user may manage the given company: either its
 * creator or a member row with role=founder linked to their user id.
 * Admins do NOT implicitly pass — admin actions use requireAdmin explicitly
 * so audit logs distinguish founder edits from admin interventions.
 */
export async function requireCompanyManager(companyId: string): Promise<{
  user: AuthedUser;
  company: typeof companies.$inferSelect;
}> {
  const user = await requireUser();
  const company = await findManageableCompany(user.id, companyId);
  // Same error for "missing" and "not yours": prevents company-id enumeration.
  if (!company) throw new ForbiddenError();
  return { user, company };
}

/** Grants a role if not already present (idempotent). */
export async function grantRole(userId: string, role: PlatformRole, grantedBy?: string) {
  await db
    .insert(userRoles)
    .values({ userId, role, grantedBy: grantedBy ?? null })
    .onConflictDoNothing();
}

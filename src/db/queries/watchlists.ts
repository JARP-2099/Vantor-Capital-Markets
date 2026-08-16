import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { companies, watchlistItems } from "@/db/schema";
import type { CompanyRow } from "./companies";

/**
 * Watchlist persistence layer. Every function takes an explicit userId that
 * callers MUST derive server-side (requireUser/getSessionUser) — never from
 * client input. All reads and mutations are scoped to that userId, so one
 * user can never see or modify another user's saves.
 */

export type WatchlistItem = {
  companyId: string;
  savedAt: Date;
  /**
   * Full company row when the company is still published; null when it no
   * longer is (archived/unpublished). The UI shows an "unavailable" row with
   * a remove action instead — non-public data never leaves this layer.
   */
  company: CompanyRow | null;
};

export type SaveResult =
  | { saved: true; slug: string }
  | { saved: false; reason: "not_available" };

/**
 * Save a published company to the user's watchlist. Duplicate saves are
 * idempotent (the unique primary key absorbs them). Only published companies
 * can be saved: drafts and archived listings are indistinguishable from
 * nonexistent ids, so the watchlist cannot be used to probe private records.
 */
export async function saveCompanyToWatchlist(
  userId: string,
  companyId: string,
): Promise<SaveResult> {
  const [company] = await db
    .select({ id: companies.id, slug: companies.slug })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.status, "published")))
    .limit(1);
  if (!company) return { saved: false, reason: "not_available" };

  await db
    .insert(watchlistItems)
    .values({ userId, companyId: company.id })
    .onConflictDoNothing();
  return { saved: true, slug: company.slug };
}

/**
 * Remove a company from the user's own watchlist. Returns whether a row was
 * actually deleted. The userId scope in the WHERE clause is the authorization:
 * an arbitrary companyId can only ever delete the caller's own save.
 */
export async function removeCompanyFromWatchlist(
  userId: string,
  companyId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.companyId, companyId)))
    .returning({ companyId: watchlistItems.companyId });
  return deleted.length > 0;
}

/** Which of the given companies the user has saved — one query, no N+1. */
export async function getWatchedCompanyIds(
  userId: string,
  companyIds: string[],
): Promise<Set<string>> {
  if (companyIds.length === 0) return new Set();
  const rows = await db
    .select({ companyId: watchlistItems.companyId })
    .from(watchlistItems)
    .where(
      and(eq(watchlistItems.userId, userId), inArray(watchlistItems.companyId, companyIds)),
    );
  return new Set(rows.map((r) => r.companyId));
}

/** Whether the user has saved this company. */
export async function isCompanyWatched(userId: string, companyId: string): Promise<boolean> {
  const [row] = await db
    .select({ companyId: watchlistItems.companyId })
    .from(watchlistItems)
    .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.companyId, companyId)))
    .limit(1);
  return Boolean(row);
}

/**
 * The user's watchlist, newest save first. Companies that are no longer
 * published come back with company=null (structurally stripped here, not at
 * the render site) so the page can offer removal without leaking anything.
 */
export async function getWatchlistItems(userId: string): Promise<WatchlistItem[]> {
  const rows = await db
    .select({
      companyId: watchlistItems.companyId,
      savedAt: watchlistItems.createdAt,
      company: companies,
    })
    .from(watchlistItems)
    .innerJoin(companies, eq(companies.id, watchlistItems.companyId))
    .where(eq(watchlistItems.userId, userId))
    .orderBy(desc(watchlistItems.createdAt), desc(watchlistItems.companyId));
  return rows.map((row) => ({
    companyId: row.companyId,
    savedAt: row.savedAt,
    company: row.company.status === "published" ? row.company : null,
  }));
}

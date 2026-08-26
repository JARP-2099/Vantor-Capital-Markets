import "server-only";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { productEvents } from "@/db/schema";

/**
 * Minimal beta usage measurement, separate from the audit log (governance
 * record) on purpose. Fire-and-forget: a failed event write must never
 * break the page that triggered it. No request fingerprinting, no
 * third-party vendor — just enough rows to answer whether beta users
 * actually use Discover, profiles, and search.
 */

export type ProductEventName = "company.viewed" | "discover.queried" | "watchlist.viewed";

export async function recordProductEvent(entry: {
  event: ProductEventName;
  userId?: string | null;
  entityId?: string | null;
  /** Small, non-sensitive context only (booleans/counts — never form input). */
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(productEvents).values({
      event: entry.event,
      userId: entry.userId ?? null,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (err) {
    console.error("[product-events] failed to record", entry.event, err);
  }
}

export type UsageSummary = {
  sinceDays: number;
  profileViews: number;
  discoverQueries: number;
};

/** Admin dashboard summary: activity in the trailing window. */
export async function getUsageSummary(sinceDays = 7): Promise<UsageSummary> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const countFor = async (event: ProductEventName) => {
    const [{ value }] = await db
      .select({ value: count() })
      .from(productEvents)
      .where(and(eq(productEvents.event, event), gt(productEvents.createdAt, since)));
    return value;
  };
  const [profileViews, discoverQueries] = await Promise.all([
    countFor("company.viewed"),
    countFor("discover.queried"),
  ]);
  return { sinceDays, profileViews, discoverQueries };
}

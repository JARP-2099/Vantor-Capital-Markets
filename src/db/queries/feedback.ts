import "server-only";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { feedback, user } from "@/db/schema";

/**
 * Beta feedback persistence. Writes take a server-derived userId; reads are
 * admin-only at the call sites (requireAdmin) — feedback is never public.
 */

export type FeedbackRow = typeof feedback.$inferSelect;
export type FeedbackRole = FeedbackRow["role"];

/** Per-user cap so a stuck client or abuse can't flood the table. */
export const FEEDBACK_DAILY_LIMIT = 10;

export type CreateFeedbackResult = "created" | "limit_reached";

export async function createFeedback(
  userId: string,
  input: { role: FeedbackRole; pagePath: string | null; message: string },
): Promise<CreateFeedbackResult> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(feedback)
    .where(and(eq(feedback.userId, userId), gt(feedback.createdAt, dayAgo)));
  if (recent >= FEEDBACK_DAILY_LIMIT) return "limit_reached";

  await db.insert(feedback).values({
    userId,
    role: input.role,
    pagePath: input.pagePath,
    message: input.message,
  });
  return "created";
}

export type FeedbackWithAuthor = FeedbackRow & {
  authorName: string | null;
  authorEmail: string | null;
};

/** Admin: newest feedback first, with author identity where it still exists. */
export async function getRecentFeedback(limit = 100): Promise<FeedbackWithAuthor[]> {
  const rows = await db
    .select({ entry: feedback, authorName: user.name, authorEmail: user.email })
    .from(feedback)
    .leftJoin(user, eq(user.id, feedback.userId))
    .orderBy(desc(feedback.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r.entry,
    authorName: r.authorName ?? null,
    authorEmail: r.authorEmail ?? null,
  }));
}

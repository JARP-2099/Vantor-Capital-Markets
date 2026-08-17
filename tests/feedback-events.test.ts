import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import {
  createFeedback,
  FEEDBACK_DAILY_LIMIT,
  getRecentFeedback,
} from "@/db/queries/feedback";
import { getUsageSummary, recordProductEvent } from "@/lib/product-events";
import { createTestUser } from "./helpers";

describe("beta feedback", () => {
  it("stores feedback and reads it back with author identity", async () => {
    const user = await createTestUser({ name: "Beta Tester" });
    const result = await createFeedback(user.id, {
      role: "investor",
      pagePath: "/companies",
      message: "The sort control was easy to miss on mobile.",
    });
    expect(result).toBe("created");

    const rows = await getRecentFeedback(10);
    const mine = rows.find((r) => r.userId === user.id);
    expect(mine?.message).toContain("sort control");
    expect(mine?.role).toBe("investor");
    expect(mine?.authorName).toBe("Beta Tester");
    expect(mine?.pagePath).toBe("/companies");
  });

  it("enforces the per-user daily cap", async () => {
    const user = await createTestUser();
    for (let i = 0; i < FEEDBACK_DAILY_LIMIT; i++) {
      expect(
        await createFeedback(user.id, {
          role: "other",
          pagePath: null,
          message: `Feedback number ${i} with enough length.`,
        }),
      ).toBe("created");
    }
    expect(
      await createFeedback(user.id, {
        role: "other",
        pagePath: null,
        message: "One more over the cap.",
      }),
    ).toBe("limit_reached");

    const rows = await db.select().from(feedback).where(eq(feedback.userId, user.id));
    expect(rows).toHaveLength(FEEDBACK_DAILY_LIMIT);
  });

  it("the database refuses empty or oversized messages outright", async () => {
    const user = await createTestUser();
    await expect(
      db.insert(feedback).values({ userId: user.id, role: "other", message: "   " }),
    ).rejects.toThrow();
    await expect(
      db.insert(feedback).values({ userId: user.id, role: "other", message: "x".repeat(2001) }),
    ).rejects.toThrow();
  });
});

describe("product usage events", () => {
  it("records events and summarizes the trailing window", async () => {
    const user = await createTestUser();
    const before = await getUsageSummary(7);

    await recordProductEvent({ event: "company.viewed", userId: user.id, entityId: "c-1" });
    await recordProductEvent({ event: "company.viewed", userId: null, entityId: "c-2" });
    await recordProductEvent({
      event: "discover.queried",
      userId: user.id,
      metadata: { hasSearch: true, filterCount: 1, sort: "revenue", results: 3 },
    });

    const after = await getUsageSummary(7);
    expect(after.profileViews).toBe(before.profileViews + 2);
    expect(after.discoverQueries).toBe(before.discoverQueries + 1);
  });

  it("never throws from a failed write", async () => {
    // Nonexistent user id violates the FK; the helper must swallow it.
    await expect(
      recordProductEvent({ event: "company.viewed", userId: "no-such-user", entityId: "c" }),
    ).resolves.toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { watchlistItems } from "@/db/schema";
import {
  getWatchedCompanyIds,
  getWatchlistItems,
  isCompanyWatched,
  removeCompanyFromWatchlist,
  saveCompanyToWatchlist,
} from "@/db/queries/watchlists";
import { createTestCompany, createTestUser } from "./helpers";

describe("watchlist persistence", () => {
  it("saves a published company and reads it back", async () => {
    const user = await createTestUser();
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });

    const result = await saveCompanyToWatchlist(user.id, company.id);
    expect(result).toEqual({ saved: true, slug: company.slug });
    expect(await isCompanyWatched(user.id, company.id)).toBe(true);

    const items = await getWatchlistItems(user.id);
    expect(items).toHaveLength(1);
    expect(items[0].companyId).toBe(company.id);
    expect(items[0].company?.name).toBe(company.name);
    expect(items[0].savedAt).toBeInstanceOf(Date);
  });

  it("duplicate saves are idempotent — one row, no error", async () => {
    const user = await createTestUser();
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });

    expect((await saveCompanyToWatchlist(user.id, company.id)).saved).toBe(true);
    expect((await saveCompanyToWatchlist(user.id, company.id)).saved).toBe(true);

    const rows = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, user.id));
    expect(rows).toHaveLength(1);
  });

  it("refuses to save drafts, archived companies, and unknown ids alike", async () => {
    const user = await createTestUser();
    const founder = await createTestUser();
    const draft = await createTestCompany(founder.id, { status: "draft" });
    const archived = await createTestCompany(founder.id, { status: "archived" });

    // Draft, archived, and nonexistent must be indistinguishable so the
    // watchlist cannot be used to probe which private company ids exist.
    expect(await saveCompanyToWatchlist(user.id, draft.id)).toEqual({
      saved: false,
      reason: "not_available",
    });
    expect(await saveCompanyToWatchlist(user.id, archived.id)).toEqual({
      saved: false,
      reason: "not_available",
    });
    expect(await saveCompanyToWatchlist(user.id, randomUUID())).toEqual({
      saved: false,
      reason: "not_available",
    });
    expect(await getWatchlistItems(user.id)).toHaveLength(0);
  });

  it("removes only the caller's own save", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await saveCompanyToWatchlist(alice.id, company.id);

    // Bob "removing" Alice's save (the IDOR attempt) deletes nothing.
    expect(await removeCompanyFromWatchlist(bob.id, company.id)).toBe(false);
    expect(await isCompanyWatched(alice.id, company.id)).toBe(true);

    expect(await removeCompanyFromWatchlist(alice.id, company.id)).toBe(true);
    expect(await isCompanyWatched(alice.id, company.id)).toBe(false);
    // Removing again reports nothing deleted.
    expect(await removeCompanyFromWatchlist(alice.id, company.id)).toBe(false);
  });

  it("keeps watchlists private between users", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    const founder = await createTestUser();
    const companyA = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });
    const companyB = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });

    await saveCompanyToWatchlist(alice.id, companyA.id);
    await saveCompanyToWatchlist(bob.id, companyB.id);

    const aliceItems = await getWatchlistItems(alice.id);
    expect(aliceItems.map((i) => i.companyId)).toEqual([companyA.id]);
    const bobItems = await getWatchlistItems(bob.id);
    expect(bobItems.map((i) => i.companyId)).toEqual([companyB.id]);

    const watched = await getWatchedCompanyIds(alice.id, [companyA.id, companyB.id]);
    expect(watched).toEqual(new Set([companyA.id]));
    expect(await isCompanyWatched(bob.id, companyA.id)).toBe(false);
  });

  it("structurally strips companies that are no longer published", async () => {
    const user = await createTestUser();
    const founder = await createTestUser();
    const company = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });
    await saveCompanyToWatchlist(user.id, company.id);

    // Founder archives the company after the save.
    const { companies } = await import("@/db/schema");
    await db
      .update(companies)
      .set({ status: "archived", archivedAt: new Date() })
      .where(eq(companies.id, company.id));

    const items = await getWatchlistItems(user.id);
    expect(items).toHaveLength(1);
    expect(items[0].companyId).toBe(company.id);
    // No company data leaks through the watchlist once unpublished.
    expect(items[0].company).toBeNull();

    // The stale save can still be removed.
    expect(await removeCompanyFromWatchlist(user.id, company.id)).toBe(true);
    expect(await getWatchlistItems(user.id)).toHaveLength(0);
  });

  it("orders the watchlist newest save first", async () => {
    const user = await createTestUser();
    const founder = await createTestUser();
    const older = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });
    const newer = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });

    // Insert with explicit timestamps so ordering does not depend on clock
    // resolution within the test run.
    await db.insert(watchlistItems).values([
      { userId: user.id, companyId: older.id, createdAt: new Date("2026-01-01T00:00:00Z") },
      { userId: user.id, companyId: newer.id, createdAt: new Date("2026-02-01T00:00:00Z") },
    ]);

    const items = await getWatchlistItems(user.id);
    expect(items.map((i) => i.companyId)).toEqual([newer.id, older.id]);
  });

  it("getWatchedCompanyIds returns only ids from the requested set", async () => {
    const user = await createTestUser();
    const founder = await createTestUser();
    const inSet = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });
    const outOfSet = await createTestCompany(founder.id, {
      status: "published",
      publishedAt: new Date(),
    });
    await saveCompanyToWatchlist(user.id, inSet.id);
    await saveCompanyToWatchlist(user.id, outOfSet.id);

    expect(await getWatchedCompanyIds(user.id, [inSet.id])).toEqual(new Set([inSet.id]));
    expect(await getWatchedCompanyIds(user.id, [])).toEqual(new Set());
  });
});

import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { companies, companyMembers, user } from "@/db/schema";

/** Creates a user row directly (auth flows are exercised at runtime, not here). */
export async function createTestUser(overrides: { email?: string; name?: string } = {}) {
  const id = randomUUID();
  const [row] = await db
    .insert(user)
    .values({
      id,
      name: overrides.name ?? `Test User ${id.slice(0, 8)}`,
      email: overrides.email ?? `user-${id.slice(0, 8)}@vantor.test`,
      emailVerified: true,
    })
    .returning();
  return row;
}

export async function createTestCompany(
  createdBy: string,
  overrides: Partial<typeof companies.$inferInsert> = {},
) {
  const suffix = randomUUID().slice(0, 8);
  const [row] = await db
    .insert(companies)
    .values({
      name: overrides.name ?? `Test Co ${suffix}`,
      slug: overrides.slug ?? `test-co-${suffix}`,
      createdBy,
      status: "draft",
      ...overrides,
    })
    .returning();
  return row;
}

export async function addFounderMember(companyId: string, userId: string, name = "Cofounder") {
  const [row] = await db
    .insert(companyMembers)
    .values({ companyId, userId, name, role: "founder" })
    .returning();
  return row;
}

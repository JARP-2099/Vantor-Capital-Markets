import { describe, expect, it } from "vitest";
import { findManageableCompany, getUserRoles, grantRole } from "@/lib/authz";
import { addFounderMember, createTestCompany, createTestUser } from "./helpers";

describe("findManageableCompany (resource ownership)", () => {
  it("allows the creator to manage their company", async () => {
    const owner = await createTestUser();
    const company = await createTestCompany(owner.id);
    const found = await findManageableCompany(owner.id, company.id);
    expect(found?.id).toBe(company.id);
  });

  it("denies an unrelated user (cross-user edit / IDOR)", async () => {
    const owner = await createTestUser();
    const attacker = await createTestUser();
    const company = await createTestCompany(owner.id);
    expect(await findManageableCompany(attacker.id, company.id)).toBeNull();
  });

  it("allows a founder-role member who did not create the company", async () => {
    const owner = await createTestUser();
    const cofounder = await createTestUser();
    const company = await createTestCompany(owner.id);
    await addFounderMember(company.id, cofounder.id);
    const found = await findManageableCompany(cofounder.id, company.id);
    expect(found?.id).toBe(company.id);
  });

  it("denies a team-role (non-founder) member", async () => {
    const owner = await createTestUser();
    const employee = await createTestUser();
    const company = await createTestCompany(owner.id);
    const { db } = await import("@/db");
    const { companyMembers } = await import("@/db/schema");
    await db
      .insert(companyMembers)
      .values({ companyId: company.id, userId: employee.id, name: "Employee", role: "team" });
    expect(await findManageableCompany(employee.id, company.id)).toBeNull();
  });

  it("returns null for a nonexistent company id", async () => {
    const someone = await createTestUser();
    expect(
      await findManageableCompany(someone.id, "00000000-0000-0000-0000-000000000000"),
    ).toBeNull();
  });
});

describe("roles", () => {
  it("grants and reads roles; plain users are not admins", async () => {
    const u = await createTestUser();
    await grantRole(u.id, "founder");
    await grantRole(u.id, "founder"); // idempotent — must not throw

    const roles = await getUserRoles({ id: u.id, name: u.name, email: u.email });
    expect(roles.has("founder")).toBe(true);
    expect(roles.has("admin")).toBe(false);
  });

  it("bootstraps admin from ADMIN_EMAILS regardless of case", async () => {
    const u = await createTestUser({ email: "Bootstrap-Admin@vantor.test" });
    const roles = await getUserRoles({ id: u.id, name: u.name, email: u.email });
    expect(roles.has("admin")).toBe(true);
  });

  it("does not admin-bootstrap other emails", async () => {
    const u = await createTestUser({ email: "regular@vantor.test" });
    const roles = await getUserRoles({ id: u.id, name: u.name, email: u.email });
    expect(roles.has("admin")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { checkSeedAllowed, type SeedEnvironment } from "@/db/seed-guard";

const DEV_OK: SeedEnvironment = {
  allowSeed: "true",
  nodeEnv: "development",
  vercelEnv: undefined,
  databaseUrl: "postgres://vantor:pw@localhost:5432/vantor_dev",
};

describe("seed guard", () => {
  it("allows seeding in a normal development environment", () => {
    const decision = checkSeedAllowed(DEV_OK);
    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.targetDescription).toBe("vantor_dev on localhost");
    }
  });

  it("refuses without explicit ALLOW_SEED=true", () => {
    for (const allowSeed of [undefined, "", "false", "TRUE", "1", "yes"]) {
      expect(checkSeedAllowed({ ...DEV_OK, allowSeed }).allowed).toBe(false);
    }
  });

  it("refuses when NODE_ENV is production even with ALLOW_SEED=true", () => {
    expect(checkSeedAllowed({ ...DEV_OK, nodeEnv: "production" }).allowed).toBe(false);
  });

  it("refuses inside any Vercel deployment, preview included", () => {
    for (const vercelEnv of ["production", "preview", "development"]) {
      const decision = checkSeedAllowed({ ...DEV_OK, vercelEnv });
      expect(decision.allowed).toBe(false);
      if (!decision.allowed) expect(decision.reason).toContain("Vercel");
    }
  });

  it("refuses with a missing or malformed DATABASE_URL", () => {
    expect(checkSeedAllowed({ ...DEV_OK, databaseUrl: undefined }).allowed).toBe(false);
    expect(checkSeedAllowed({ ...DEV_OK, databaseUrl: "not a url" }).allowed).toBe(false);
  });

  it("refuses a remote host unless it is explicitly confirmed by name", () => {
    const remote = {
      ...DEV_OK,
      databaseUrl: "postgres://u:p@db.example.railway.app:5432/railway",
    };
    const denied = checkSeedAllowed(remote);
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.reason).toContain("db.example.railway.app");
      expect(denied.reason).toContain("ALLOW_SEED_REMOTE_HOST");
    }
    // Confirming a *different* host is not enough.
    expect(
      checkSeedAllowed({ ...remote, allowSeedRemoteHost: "other-host.example.com" }).allowed,
    ).toBe(false);
    // Naming the exact host unlocks it and the target is described.
    const confirmed = checkSeedAllowed({
      ...remote,
      allowSeedRemoteHost: "db.example.railway.app",
    });
    expect(confirmed.allowed).toBe(true);
    if (confirmed.allowed) {
      expect(confirmed.targetDescription).toBe("railway on db.example.railway.app");
    }
  });

  it("still allows local hosts without any remote-host confirmation", () => {
    for (const host of ["localhost", "127.0.0.1"]) {
      const decision = checkSeedAllowed({
        ...DEV_OK,
        databaseUrl: `postgres://u:p@${host}:5432/vantor_dev`,
      });
      expect(decision.allowed).toBe(true);
    }
  });
});

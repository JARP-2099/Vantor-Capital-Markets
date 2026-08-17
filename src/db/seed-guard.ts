/**
 * Seed safety guard, extracted as a pure function so the refusal rules are
 * unit-testable. The seed plants fictional companies and a demo admin
 * account with a password committed to a public repository — it must be
 * impossible to run against production by accident. Every rule here is
 * independent: one leaked or misconfigured variable is never enough.
 */

export type SeedEnvironment = {
  allowSeed: string | undefined;
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
  databaseUrl: string | undefined;
};

export type SeedDecision =
  | { allowed: true; targetDescription: string }
  | { allowed: false; reason: string };

export function checkSeedAllowed(env: SeedEnvironment): SeedDecision {
  if (env.allowSeed !== "true") {
    return { allowed: false, reason: "Set ALLOW_SEED=true in the environment first." };
  }
  if (env.nodeEnv === "production") {
    return { allowed: false, reason: "NODE_ENV is production." };
  }
  // Never seed from any Vercel runtime (production OR preview): seeding is a
  // dev-machine operation against an explicitly chosen database, not
  // something an application deployment should ever perform.
  if (env.vercelEnv) {
    return { allowed: false, reason: `Running inside a Vercel deployment (${env.vercelEnv}).` };
  }
  if (!env.databaseUrl) {
    return { allowed: false, reason: "DATABASE_URL is not set." };
  }

  let host = "unknown-host";
  let dbName = "unknown-database";
  try {
    const url = new URL(env.databaseUrl);
    host = url.hostname;
    dbName = url.pathname.replace(/^\//, "") || dbName;
  } catch {
    return { allowed: false, reason: "DATABASE_URL is not a valid connection URL." };
  }

  return { allowed: true, targetDescription: `${dbName} on ${host}` };
}

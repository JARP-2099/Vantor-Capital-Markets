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
  /** Exact hostname the operator confirms as the intended remote target. */
  allowSeedRemoteHost?: string | undefined;
};

/** Hosts that never need the explicit remote-host confirmation. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

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

  // The rules above only inspect the operator's machine; this one inspects
  // the target. A dev laptop that keeps the production DATABASE_URL in .env
  // (the documented migration/grant-admin workflow) plus a leftover
  // ALLOW_SEED=true must not be enough to plant demo companies and the
  // known-password demo admin into a remote database. Seeding a non-local
  // host requires naming that exact host in ALLOW_SEED_REMOTE_HOST.
  if (!LOCAL_HOSTS.has(host) && env.allowSeedRemoteHost !== host) {
    return {
      allowed: false,
      reason:
        `DATABASE_URL points at remote host "${host}". Seeding plants fictional companies ` +
        `and a demo admin account with a publicly known password. If this is intentional, ` +
        `set ALLOW_SEED_REMOTE_HOST=${host} and run again.`,
    };
  }

  return { allowed: true, targetDescription: `${dbName} on ${host}` };
}

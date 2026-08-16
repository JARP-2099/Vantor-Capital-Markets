import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, rateLimit, session, user, verification } from "@/db/schema";
import { betterAuthUrl, env } from "@/env";
import { buildTrustedOrigins } from "@/lib/auth-origins";

/**
 * Server-side auth instance. Email/password with secure, httpOnly session
 * cookies and built-in rate limiting on auth endpoints.
 */
export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: env.BETTER_AUTH_SECRET,
  // Canonical URL stays BETTER_AUTH_URL (with the deployment's own URL as
  // the Vercel fallback — see src/env.ts); the current Vercel deployment,
  // branch, and production hosts are additionally trusted so direct
  // deployment/preview URLs authenticate. Origin validation stays enabled;
  // no broad wildcards (see src/lib/auth-origins.ts).
  trustedOrigins: buildTrustedOrigins({
    betterAuthUrl,
    vercelUrl: env.VERCEL_URL,
    vercelBranchUrl: env.VERCEL_BRANCH_URL,
    vercelProjectProductionUrl: env.VERCEL_PROJECT_PRODUCTION_URL,
  }),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification, rateLimit },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // Email delivery is not configured in Phase 1, so verification emails
    // cannot be sent; accounts work without verification until Phase 4+.
    requireEmailVerification: false,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    // In-memory counters are per-serverless-instance (effectively unenforced
    // across Vercel instances); shared counters live in the rate_limit table.
    storage: "database",
    modelName: "rateLimit",
    // Tighter ceilings on the credential endpoints specifically.
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 10 },
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  // Ensures Set-Cookie works from Next.js server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { env } from "@/env";

/**
 * Server-side auth instance. Email/password with secure, httpOnly session
 * cookies and built-in rate limiting on auth endpoints.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
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
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  // Ensures Set-Cookie works from Next.js server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

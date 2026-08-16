import "server-only";
import { z } from "zod";

/**
 * Server-side environment access. Import this module only from server code —
 * the `server-only` import makes accidental client bundling a build error.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  /** Per-instance connection pool size. Keep small on serverless (Vercel). */
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be a strong secret"),
  BETTER_AUTH_URL: z.url().optional(),
  ADMIN_EMAILS: z.string().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /**
   * Vercel system variables (bare hosts, auto-populated per deployment when
   * "Automatically expose System Environment Variables" is on). Used only to
   * extend Better Auth trusted origins with this deployment's own URLs.
   */
  VERCEL_URL: z.string().optional(),
  VERCEL_BRANCH_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;

/**
 * Canonical auth base URL. When BETTER_AUTH_URL is unset on Vercel, fall back
 * to the deployment's own URL rather than localhost — a localhost base URL in
 * a deployed environment would silently mis-issue auth callbacks/origins.
 */
export const betterAuthUrl: string =
  env.BETTER_AUTH_URL ??
  (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000");

/**
 * Emails granted platform-admin capability via environment. DEV/TEST BOOTSTRAP
 * ONLY: signup is open and email ownership is never verified (no email
 * delivery), so in production a listed-but-unregistered address could be
 * claimed by anyone. Production admin capability comes exclusively from
 * user_roles rows (see scripts/grant-admin.ts).
 */
export const adminEmails: ReadonlySet<string> =
  env.NODE_ENV === "production"
    ? new Set()
    : new Set(
        env.ADMIN_EMAILS.split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      );

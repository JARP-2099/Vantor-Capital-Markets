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
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
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

/** Emails granted platform-admin capability via environment (bootstrap path). */
export const adminEmails: ReadonlySet<string> = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

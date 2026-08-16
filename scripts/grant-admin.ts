import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/db/schema";

config();

/**
 * Grants the platform-admin role to an already-registered account.
 *
 *   pnpm admin:grant you@example.com
 *
 * Run against the target database via DATABASE_URL (locally, or from a dev
 * machine pointed at production — the same workflow as migrations). This is
 * the ONLY way to obtain admin capability in production: the ADMIN_EMAILS
 * bootstrap is disabled there because open signup with unverified emails
 * would let anyone claim a listed-but-unregistered address.
 *
 * The account must exist first (sign up through the app), which proves the
 * operator is granting to a live, password-protected account they can see.
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Usage: pnpm admin:grant <email-of-registered-account>");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  try {
    const [account] = await db
      .select({ id: schema.user.id, email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);
    if (!account) {
      console.error(`No registered account found for ${email}. Sign up first, then re-run.`);
      process.exit(1);
    }
    await db
      .insert(schema.userRoles)
      .values({ userId: account.id, role: "admin", grantedBy: null })
      .onConflictDoNothing();
    console.log(`Granted admin to ${account.email} (${account.id}).`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

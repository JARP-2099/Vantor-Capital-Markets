/**
 * Test bootstrap. Runs before any test file imports application modules:
 * points DATABASE_URL at the dedicated test database and applies migrations.
 * Refuses to run against a database whose name lacks "test" so a mistyped
 * env var can never wipe development data.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error("TEST_DATABASE_URL must be set to run the test suite");
}
if (!/test/i.test(new URL(testUrl).pathname)) {
  throw new Error(
    `Refusing to run tests against "${new URL(testUrl).pathname}" — database name must contain "test"`,
  );
}

process.env.DATABASE_URL = testUrl;
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.ADMIN_EMAILS = "bootstrap-admin@vantor.test";

const client = postgres(testUrl, { max: 1, onnotice: () => {} });
await migrate(drizzle(client), { migrationsFolder: "./src/db/migrations" });
await client.end();

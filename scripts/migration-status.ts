import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config();

/**
 * Read-only migration state check.
 *
 *   pnpm db:status
 *
 * Connects to DATABASE_URL, compares the local migration journal
 * (src/db/migrations/meta/_journal.json) against what drizzle-kit has
 * recorded in the target database (drizzle.__drizzle_migrations), and
 * prints exactly which migrations are applied and which are pending —
 * so you can see production's real state BEFORE running `pnpm db:migrate`.
 *
 * Runs no writes of any kind. Safe against any environment, production
 * included; point DATABASE_URL at the database you want to inspect.
 *
 * Also runs one preflight: migration 0003 adds a CHECK constraint on
 * valuation_runs (completed runs must carry a full range). If any existing
 * row violates it, `db:migrate` would fail mid-way — this reports that
 * before you find out the hard way.
 */

type JournalEntry = { idx: number; when: number; tag: string };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const journal = JSON.parse(
    readFileSync(join(__dirname, "../src/db/migrations/meta/_journal.json"), "utf8"),
  ) as { entries: JournalEntry[] };

  let host = "unknown-host";
  let dbName = "unknown-database";
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    dbName = parsed.pathname.replace(/^\//, "") || dbName;
  } catch {
    // Non-URL connection strings still work for postgres-js; describe as unknown.
  }
  console.log(`Inspecting ${dbName} on ${host} (read-only)\n`);

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
      ) AS exists`;

    // drizzle-kit records each applied migration with created_at = the
    // journal entry's `when`; it applies entries newer than the max applied.
    const applied = exists
      ? await sql<{ created_at: string }[]>`
          SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`
      : [];
    const appliedWhens = new Set(applied.map((r) => Number(r.created_at)));
    const maxApplied = applied.length > 0 ? Number(applied[applied.length - 1].created_at) : 0;

    if (!exists) {
      console.log("No drizzle migration journal found in this database — nothing has been");
      console.log("applied via drizzle-kit. `pnpm db:migrate` would apply ALL migrations:\n");
    }

    let pending = 0;
    for (const entry of journal.entries) {
      // Exact match is the normal case; the > maxApplied fallback mirrors
      // how drizzle-kit itself decides what still needs to run.
      const isApplied = appliedWhens.has(entry.when) || entry.when <= maxApplied;
      const marker = isApplied ? "applied" : "PENDING";
      if (!isApplied) pending += 1;
      console.log(
        `  ${String(entry.idx).padStart(4, "0")}  ${entry.tag.padEnd(36)} ${marker}`,
      );
    }
    if (applied.length > journal.entries.length) {
      console.log(
        `\nWarning: database records ${applied.length} applied migrations but the local`,
      );
      console.log(
        "journal has only " +
          journal.entries.length +
          " — this checkout is older than the database. Do not migrate from here.",
      );
    }
    console.log(
      pending === 0
        ? "\nUp to date: nothing for `pnpm db:migrate` to apply."
        : `\n${pending} pending. Review the SQL in src/db/migrations/, back up, then run \`pnpm db:migrate\`.`,
    );

    // Preflight for 0003's CHECK constraint, only while 0003 is pending and
    // the valuation_runs table already exists.
    const [{ exists: hasRuns }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'valuation_runs'
      ) AS exists`;
    const entry0003 = journal.entries.find((e) => e.idx === 3);
    const pending0003 =
      entry0003 && !(appliedWhens.has(entry0003.when) || entry0003.when <= maxApplied);
    if (hasRuns && pending0003) {
      const [{ count: violations }] = await sql<{ count: string }[]>`
        SELECT count(*) AS count FROM valuation_runs
        WHERE status = 'completed'
          AND (valuation_low IS NULL OR valuation_high IS NULL
               OR valuation_mid IS NULL OR confidence IS NULL)`;
      if (Number(violations) > 0) {
        console.log(
          `\nPreflight FAILED: ${violations} completed valuation_runs row(s) lack a full ` +
            "range/confidence. Migration 0003's CHECK constraint would fail. Inspect those " +
            "rows before migrating.",
        );
        process.exit(2);
      }
      console.log("\nPreflight OK: no valuation_runs rows would violate 0003's CHECK constraint.");
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

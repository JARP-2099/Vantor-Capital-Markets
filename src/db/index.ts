import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Single shared Drizzle client. postgres-js pools internally; `max` is kept
 * modest because Next.js dev/hot-reload can create multiple module instances.
 */
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: 10,
    onnotice: () => {},
  });

if (env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;
export { schema };

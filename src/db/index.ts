import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

/**
 * Single shared Drizzle client.
 *
 * Serverless (Vercel) notes: each warm function instance holds one small
 * pool; DB_POOL_MAX defaults low so many concurrent instances don't exhaust
 * Railway's connection limit. The globalThis cache prevents dev hot-reload
 * from leaking connections. TLS is controlled by the connection string
 * (`?sslmode=require` on Railway public URLs) — postgres-js honors it; no
 * code change is needed per environment.
 */
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: env.DB_POOL_MAX,
    // Serverless instances come and go; don't hold idle sockets for long.
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });

if (env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;
export { schema };

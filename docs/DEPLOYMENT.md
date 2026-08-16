# Deployment — Railway PostgreSQL + Vercel

The app is a standard Next.js 16 deployment: one Node runtime, PostgreSQL
as the only backing service, all configuration via environment variables.
No custom domain is assumed anywhere — the standard Vercel URL works, and a
custom domain later only requires updating `BETTER_AUTH_URL`.

## Environment variables (all environments)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string. Railway: use the public URL with `?sslmode=require`. |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` — unique per environment. |
| `BETTER_AUTH_URL` | yes | Canonical origin, e.g. `https://<app>.vercel.app` (no trailing slash). |
| `DB_POOL_MAX` | no | Connections per server instance. Default 5; keep ≤5 on Vercel. |
| `ADMIN_EMAILS` | no | Comma-separated bootstrap admin emails. |
| `ALLOW_SEED` | never in prod | Guards `pnpm db:seed`. |
| `TEST_DATABASE_URL` | dev/CI only | For `pnpm test`; DB name must contain "test". |

## Railway (human steps — dashboard access required)

1. Create a Railway project and add a **PostgreSQL** service.
2. Copy the public connection string (Variables tab of the Postgres
   service; the `DATABASE_URL` / connection URL value). Append
   `?sslmode=require` if it lacks an ssl parameter.
3. Run migrations against it from your machine (one-time per schema change):
   ```bash
   DATABASE_URL="<railway-url>?sslmode=require" pnpm db:migrate
   ```
4. Verify: `DATABASE_URL="<railway-url>?sslmode=require" pnpm exec tsx -e "import postgres from 'postgres'; const sql = postgres(process.env.DATABASE_URL); console.log(await sql\`SELECT count(*) FROM companies\`); await sql.end();"`

Migrations are executed from a developer machine or CI — never
automatically at serverless boot. For schema changes: generate + review the
SQL locally, apply to a dev database, run tests, then apply to Railway with
the command above before deploying code that needs it.

## Vercel (human steps)

1. Import the GitHub repository into Vercel (framework auto-detected:
   Next.js; build command `next build`, no overrides needed — the repo uses
   pnpm, which Vercel detects from the lockfile).
2. In Project → Settings → Environment Variables, add for **Production**
   (and Preview if previews should hit a separate database — recommended:
   a second Railway Postgres or Neon/dev database, never production):
   - `DATABASE_URL` = the Railway URL with `?sslmode=require`
   - `BETTER_AUTH_SECRET` = fresh `openssl rand -base64 32`
   - `BETTER_AUTH_URL` = `https://<your-project>.vercel.app`
   - `DB_POOL_MAX` = `3`
   - `ADMIN_EMAILS` = your admin email
3. Deploy. After the first deploy, set `BETTER_AUTH_URL` to the exact
   assigned production URL if it differs, and redeploy.

## Serverless connection behavior

`src/db/index.ts` opens one small pool per warm instance
(`DB_POOL_MAX`, default 5; idle sockets close after 20s). With Railway's
default connection limit (~100 on Postgres 16) this comfortably supports
dozens of concurrent warm instances. If the app later scales past that,
put PgBouncer (Railway template) or a pooled provider URL in front and
lower `DB_POOL_MAX` to 1–2 — no code changes required.

## Production checklist

- [ ] `pnpm build` passes locally
- [ ] Migrations applied to Railway (`pnpm db:migrate`)
- [ ] `ALLOW_SEED` absent in Vercel env
- [ ] `BETTER_AUTH_SECRET` unique to production
- [ ] Admin sign-in verified via `ADMIN_EMAILS`

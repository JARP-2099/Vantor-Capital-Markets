# Deployment — Railway PostgreSQL + Vercel

The app is a standard Next.js 16 deployment: one Node runtime, PostgreSQL
as the only backing service, all configuration via environment variables.
No custom domain is assumed anywhere — the standard Vercel URL works, and a
custom domain later only requires updating `BETTER_AUTH_URL`.

## Environment variables (all environments)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string. Railway: use the public URL with `?sslmode=require`. Scope per environment in Vercel (see below). |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` — unique per environment (Preview must differ from Production). |
| `BETTER_AUTH_URL` | prod | Canonical origin, e.g. `https://<app>.vercel.app` (no trailing slash). If unset on Vercel, the app falls back to the deployment's own URL (`https://$VERCEL_URL`) — fine for Previews, but set it explicitly for Production. |
| `DB_POOL_MAX` | no | Connections per server instance. Default 5; keep ≤5 on Vercel (3 recommended). |
| `ADMIN_EMAILS` | dev/test only | Comma-separated admin emails. **Ignored in production builds** — see "Admin access" below. |
| `ALLOW_SEED` | never in prod | Guards `pnpm db:seed` (which additionally refuses when `NODE_ENV=production`). |
| `TEST_DATABASE_URL` | dev/CI only | For `pnpm test`; DB name must contain "test". |

## Admin access

`ADMIN_EMAILS` is a development/test convenience only. In production it is
deliberately ignored: signup is open and email ownership is never verified
(no email delivery exists yet), so an attacker who guessed a listed but
not-yet-registered address could claim admin by simply signing up with it.

To grant admin in production:

1. Sign up normally through the app with the account that should be admin.
2. From a dev machine (same workflow as migrations):
   ```bash
   DATABASE_URL="<railway-url>?sslmode=require" pnpm admin:grant you@example.com
   ```
   This writes a `user_roles` row; the grant takes effect on next page load.

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

## Preview vs Production databases (required separation)

Vercel Preview deployments run real code against whatever `DATABASE_URL`
they receive. If the variable is scoped to "All Environments", **every
preview branch reads and writes production data** — preview signups land in
the production user table, and un-applied migrations on a branch can drift
against the production schema. Do not run in that state.

Target state:

- Production Vercel → Production Railway Postgres
- Preview Vercel → a separate staging Railway Postgres

Steps (~15 minutes, dashboard access required):

1. **Railway**: add a second PostgreSQL service (e.g. `vantor-staging`),
   copy its URL, and apply migrations to it:
   `DATABASE_URL="<staging-url>?sslmode=require" pnpm db:migrate`
   (optionally seed demo data into staging only:
   `ALLOW_SEED=true DATABASE_URL="<staging-url>?sslmode=require" pnpm db:seed`).
2. **Vercel → Settings → Environment Variables**:
   - `DATABASE_URL`: scope the existing production value to **Production
     only**; add a second entry scoped to **Preview** with the staging URL.
   - `BETTER_AUTH_SECRET`: scope the current value to Production only; add a
     **different** secret for Preview so sessions cannot cross environments.
   - Confirm `ALLOW_SEED` is absent in every Vercel environment.
3. Redeploy production and one preview; sign in on both; confirm no
   "Invalid origin" errors in the runtime logs.

## Vercel (human steps)

1. Import the GitHub repository into Vercel (framework auto-detected:
   Next.js; build command `next build`, no overrides needed — the repo uses
   pnpm, which Vercel detects from the lockfile).
2. In Project → Settings → Environment Variables, add for **Production**
   (and the Preview-scoped variants per the section above):
   - `DATABASE_URL` = the Railway URL with `?sslmode=require`
   - `BETTER_AUTH_SECRET` = fresh `openssl rand -base64 32`
   - `BETTER_AUTH_URL` = `https://<your-project>.vercel.app`
   - `DB_POOL_MAX` = `3`
3. Deploy. After the first deploy, set `BETTER_AUTH_URL` to the exact
   assigned production URL if it differs, and redeploy.
4. Ensure Project → Settings → Environment Variables has **"Automatically
   expose System Environment Variables"** enabled (Vercel's default). Auth
   trusts the current deployment/branch/production hosts via `VERCEL_URL`,
   `VERCEL_BRANCH_URL`, and `VERCEL_PROJECT_PRODUCTION_URL`
   (see `src/lib/auth-origins.ts`) so direct deployment URLs can sign in
   without trusting all of `*.vercel.app`.
5. Grant yourself admin via `pnpm admin:grant` (see "Admin access").

## Serverless connection behavior

`src/db/index.ts` opens one small pool per warm instance
(`DB_POOL_MAX`, default 5; idle sockets close after 20s). With Railway's
default connection limit (~100 on Postgres 16) this comfortably supports
dozens of concurrent warm instances. If the app later scales past that,
put PgBouncer (Railway template) or a pooled provider URL in front and
lower `DB_POOL_MAX` to 1–2 — no code changes required.

Auth rate-limit counters are stored in the `rate_limit` table (shared
across serverless instances); no extra infrastructure is needed.

## Production checklist

- [ ] `pnpm build` passes locally
- [ ] Migrations applied to Railway (`pnpm db:migrate`)
- [ ] Preview and Production `DATABASE_URL` are different databases
- [ ] `ALLOW_SEED` absent in Vercel env
- [ ] `BETTER_AUTH_SECRET` unique per environment
- [ ] Admin granted via `pnpm admin:grant` and sign-in verified

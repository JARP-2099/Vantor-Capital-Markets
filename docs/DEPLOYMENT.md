# Vantor — Production Deployment Runbook

The app is a standard Next.js 16 deployment: one Node runtime, PostgreSQL as
the only backing service, all configuration via environment variables. This
runbook takes the audited beta-ready code (branch `main`) to a verified
production deployment. Follow it top to bottom; every step is either a
command you run or an exact dashboard setting.

Related docs: `docs/SMOKE_TEST.md` (post-deploy verification),
`docs/DIAGNOSTICS.md` (where to look when something fails).

## 0. Verified live state (checked via Vercel/GitHub APIs, 2026-08-26)

- Vercel project: `vantor-capital-markets` (`prj_V9C9S5jKpjb8uP4HEi2ZxElDfrh9`),
  team JARP Holdings LLC (`team_Jgk5YrdxlbqbSJK7l7vhRVFC`), git-linked to
  this repo. Node 24, framework nextjs.
- Production deployment serves commit `32b2f9c` (pre-Phase-3) from
  `claude/vantor-platform-foundation-uw0r8u` — the branch switch below is
  what fixes this.
- `main` (`d6904ec`) already **builds green on Vercel** as a preview:
  alias `vantor-capital-markets-git-main-jarpholdingsllc.vercel.app`,
  state READY, zero runtime errors project-wide in the trailing 7 days.
- The remote database is reachable from BOTH production and preview
  deployments and currently contains **no published companies at all** —
  `/companies` renders the designed empty state on both. No demo
  companies were ever seeded remotely; there is nothing to clean.
- Deployment protection: Vercel Authentication (SSO), Standard Protection
  — i.e. everything **except custom domains**. Consequence: attaching the
  custom domain launches the site publicly on that domain while previews
  and `*.vercel.app` URLs stay protected. No protection change is needed
  for launch.
- `vantorcapital.org` is registered but currently points at GoDaddy
  parking (A 15.197.148.33 / 3.33.130.190); `www` has no record; the
  domain is not attached to the Vercel project yet. See §2a.

---

## 1. GitHub

**Canonical branch: `main`.** It was created from the audited commit
`bc7acb8` (Phase 3 investor experience + Phase 3.5 beta readiness + all
audit fixes) and already exists on origin.

One-time manual steps (repository admin):

1. **Set the default branch**: GitHub → repository → **Settings → General →
   Default branch** → switch from `claude/vantor-platform-foundation-uw0r8u`
   to **`main`** → confirm.
2. (Recommended) **Settings → Branches → Add branch protection rule** for
   `main`: require a pull request before merging. Keeps future work on
   branches, deployed as Previews, merged deliberately.

Merge procedure for future work:

- Branch from `main`, push, open a PR into `main`.
- Vercel builds every non-production branch as a **Preview** automatically.
- Merging the PR to `main` triggers the Production deployment.
- Never point Vercel Production at a feature branch again.

Historical branches (`claude/vantor-*`) can stay for history; none should
be deployed. Note: `claude/vantor-ui-ux-overhaul-e3p7lz` is a **rejected**
design exploration and `claude/governance-pack-setup-k84wwe` contains stale
doc versions — do not merge either into `main` as-is.

---

## 2. Vercel

Project → **Settings → Git**:

- **Production Branch**: set to **`main`**. (This is the single setting that
  was previously wrong — production tracked
  `claude/vantor-platform-foundation-uw0r8u`, which predates Phase 3.)
- Every other branch automatically becomes a Preview deployment; no setting
  needed.

Project → **Settings → Environment Variables** — see the matrix in §5.
Confirm **"Automatically expose System Environment Variables"** is ON
(Vercel default). Auth trusts each deployment's own URL via `VERCEL_URL` /
`VERCEL_BRANCH_URL` / `VERCEL_PROJECT_PRODUCTION_URL` (see
`src/lib/auth-origins.ts`), and demo-company hiding reads `VERCEL_ENV`.

Project → **Settings → Deployment Protection**: leave as is. The current
mode (Vercel Authentication, Standard Protection) already excludes custom
domains, so launch happens by attaching the domain (§2a) — invitees use
`https://vantorcapital.org`, previews stay SSO-protected. Only if you
launch on the bare `.vercel.app` URL instead would you need to set
"Vercel Authentication" to Disabled.

Deploy procedure: push/merge to `main` → Vercel builds and promotes
automatically. First production deploy after switching the branch: trigger
via **Deployments → … → Redeploy** on the latest `main` commit if no new
push happens.

## 2a. Custom domain — vantorcapital.org

1. Vercel → project → **Settings → Domains → Add** → `vantorcapital.org`;
   also add `www.vantorcapital.org` and choose "Redirect to
   vantorcapital.org". Vercel then displays the exact DNS values it wants.
2. GoDaddy → vantorcapital.org → DNS management (currently parked A
   records — replace them):
   - Delete the existing parking `A @` records.
   - Add `A` record: name `@`, value `76.76.21.21` (or the value the
     Vercel Domains screen shows, if different).
   - Add `CNAME` record: name `www`, value `cname.vercel-dns.com`.
3. Wait for Vercel's Domains screen to show both as Valid (minutes to an
   hour, TTL-dependent).
4. Set the Production env var `BETTER_AUTH_URL=https://vantorcapital.org`
   and redeploy — auth origins must match the domain users visit.

---

## 3. Production database (Railway PostgreSQL)

### Verify which database you are targeting

Every db command below runs from your machine against whatever
`DATABASE_URL` is in your shell/`.env`. Before ANY production operation:

```bash
pnpm db:status
```

The first line prints the database name and host it is inspecting —
**read it**. It must match your Railway production Postgres host. The
command is strictly read-only, so it is always safe to run.

To see what Vercel production actually uses: Vercel → Settings →
Environment Variables → `DATABASE_URL` (Production scope) → compare the
host with Railway → your Postgres service → Variables.

### Check migration state

```bash
DATABASE_URL="<railway-production-url>?sslmode=require" pnpm db:status
```

Output lists every migration `applied` / `PENDING`. Expected for the
current production DB: `0000`–`0002` applied, `0003`–`0005` pending. The
command also preflights migration 0003's CHECK constraint against existing
valuation data and fails loudly if any row would block it.

### What the pending migrations do (all additive, forward-only)

| Migration | Contents | Risk |
|---|---|---|
| `0003_rare_marten_broadcloak` | `rate_limit` table (DB-backed auth rate limiting); index `companies(status, published_at)`; CHECK on `valuation_runs` (completed runs carry a full range) | CHECK scans existing rows — preflighted by `db:status`; brief lock on `companies` for the index |
| `0004_luxuriant_monster_badoon` | Index `companies(status, updated_at)` (backs the Recently-updated sort) | Brief lock; trivial at beta scale |
| `0005_dusty_landau` | `feedback` + `product_events` tables, `feedback_role` enum, their FKs and indexes | New objects only; touches nothing existing |

No migration drops, alters, or rewrites existing data. There is no data-loss
path. Migrations are tracked by drizzle-kit in `drizzle.__drizzle_migrations`;
`pnpm db:migrate` applies only what is pending, so re-running it is safe.
The raw SQL files are **not** idempotent (no `IF NOT EXISTS`) — always apply
through `pnpm db:migrate`, never by pasting SQL.

### Backup, then migrate

Even for additive migrations, snapshot first — it makes every mistake
recoverable:

- Railway → your Postgres service → **Backups** → create a manual backup
  (or `pg_dump "$DATABASE_URL" > vantor-prod-$(date +%F).sql` locally).

Then:

```bash
DATABASE_URL="<railway-production-url>?sslmode=require" pnpm db:migrate
DATABASE_URL="<railway-production-url>?sslmode=require" pnpm db:status   # expect: Up to date
```

Recovery: restore the Railway backup (or `psql < dump.sql` into a fresh
database and repoint `DATABASE_URL`). There are no down-migrations by
design; recovery is restore-from-backup.

---

## 4. Preview database (required separation)

Preview deployments run real code against whatever `DATABASE_URL` they
receive. If that variable is scoped to "All Environments", **every preview
branch reads and writes production data**. Do not run in that state.

1. Railway: add a second PostgreSQL service (e.g. `vantor-staging`), copy
   its URL.
2. Apply migrations:
   `DATABASE_URL="<staging-url>?sslmode=require" pnpm db:migrate`
3. Optionally seed demo data into staging only:
   `ALLOW_SEED=true ALLOW_SEED_REMOTE_HOST=<staging-host> DATABASE_URL="<staging-url>?sslmode=require" pnpm db:seed`
   (the seed refuses remote hosts unless the exact host is named — see §6).
4. Vercel → Settings → Environment Variables:
   - `DATABASE_URL`: edit the existing entry → scope to **Production**
     only. Add a second `DATABASE_URL` scoped to **Preview** with the
     staging URL.
   - `BETTER_AUTH_SECRET`: same split — one value scoped Production, a
     **different** value scoped Preview (sessions must not cross).
5. Verify the split: open a preview deployment, sign up a throwaway user,
   and confirm the row lands in staging, not production
   (`pnpm db:status` shows which DB you're inspecting; then
   `psql "<prod-url>" -c "SELECT count(*) FROM \"user\" WHERE email='throwaway@...'"`
   should return 0).

Expected Vercel variable scopes are listed in §5.

---

## 5. Environment variables

Classification (see `.env.example` for descriptions and formats):

| Variable | Development | Preview | Production | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | local Postgres | staging Railway URL | production Railway URL | **Never share one value across scopes** |
| `BETTER_AUTH_SECRET` | any strong value | unique value | unique value | `openssl rand -base64 32`; app refuses to boot without it |
| `BETTER_AUTH_URL` | `http://localhost:3000` | unset (falls back to deployment URL) | `https://<prod-domain>` | No trailing slash |
| `DB_POOL_MAX` | 5 (default) | 3 | 3 | Per-instance pool size |
| `ADMIN_EMAILS` | optional | — | — | **Ignored in production builds by design**; do not set on Vercel |
| `ALLOW_SEED` | `false` (set `true` only while seeding) | never | never | Seed guard #1 |
| `ALLOW_SEED_REMOTE_HOST` | unset | never | never | Seed guard #2 — only ever set transiently in a local shell to seed a named staging host; **never set it in Vercel, never in Production** |
| `HIDE_DEMO_COMPANIES` | unset (demos visible) | unset (demos visible) | unset (demos hidden automatically) | Override only for debugging; see §7 |
| `TEST_DATABASE_URL` | local test DB (name must contain "test") | — | — | `pnpm test` only |
| `VERCEL_*` (system) | — | auto | auto | Provided by Vercel; keep "Automatically expose System Environment Variables" ON |

Fail-safe review (verified in code + tests):

- Missing `BETTER_AUTH_SECRET` or `DATABASE_URL` → boot failure, not an
  insecure fallback (`src/env.ts`).
- `ADMIN_EMAILS` in production → empty set, ignored (`src/env.ts`).
- Demo companies in production → hidden with **no** configuration:
  `VERCEL_ENV=production` hides them, and on non-Vercel hosts
  `NODE_ENV=production` hides them (`demoCompaniesHidden()` in
  `src/db/queries/companies.ts`).
- Seeding: refuses without `ALLOW_SEED=true`; refuses under
  `NODE_ENV=production`; refuses inside any Vercel runtime; refuses
  non-localhost hosts unless the exact host is named in
  `ALLOW_SEED_REMOTE_HOST` (`src/db/seed-guard.ts`, unit-tested).
- No secret reaches the client: server env access goes through
  `src/env.ts`, which imports `server-only` (client bundling is a build
  error), and no `NEXT_PUBLIC_*` variables exist.

---

## 6. Seed and data-mutation safety

Scripts that can write to a database, and their guards:

| Command | What it writes | Guards |
|---|---|---|
| `pnpm db:seed` | 9 fictional demo companies + demo users incl. a **known-password demo admin** | `ALLOW_SEED=true` required; refuses `NODE_ENV=production`; refuses any Vercel runtime; refuses non-localhost hosts unless `ALLOW_SEED_REMOTE_HOST=<exact host>`; prints the target before writing |
| `pnpm db:migrate` | Schema changes | Journal-tracked; apply deliberately per §3 |
| `pnpm admin:grant <email>` | One `user_roles` row | Account must already exist (you grant only to a live, password-protected account) |
| `pnpm test` | **TRUNCATEs all tables** in `TEST_DATABASE_URL` | Refuses any database whose name does not contain "test" (`tests/setup.ts`) |
| `pnpm db:status` | Nothing | Read-only |

There are no reset/truncate/cleanup/rollback/fixture scripts beyond these.

**Warnings:**

- Never set `ALLOW_SEED_REMOTE_HOST` in a `.env` file, in Vercel, or in any
  persistent environment. Its only legitimate use is a one-off prefix in a
  local shell when deliberately seeding a *staging* host. Naming the
  production host in it defeats the guard by definition.
- Name real databases so they can never pass the test-suite guard: don't
  put "test" in a production or staging database name.
- If demo data is ever found in production (`is_demo = true` rows), it can
  be removed safely — every demo row cascades from its company:
  `DELETE FROM companies WHERE is_demo = true;` plus the two seed demo
  users (`email LIKE '%@vantor.dev'`). Take a backup first.

---

## 7. Demo/test data in production

How production prevents demo listings from appearing:

- `demoCompaniesHidden()` excludes `is_demo` companies from **every** public
  read path (marketplace list, filter options, slug lookup, watchlist saves
  and rendering) whenever `VERCEL_ENV=production`, or `NODE_ENV=production`
  on non-Vercel hosts. No env var needs to be set; it cannot be forgotten.
- The seed guard (§6) makes it hard for demo rows to reach the production
  database at all.

How to verify production has no demo listings:

1. Open `https://<prod-domain>/companies` in a private window — the
   marketplace must show only real companies (an empty marketplace with the
   designed "No companies published yet" state is correct before real
   listings exist).
2. Definitive check against the production DB:
   `psql "<prod-url>" -c "SELECT count(*) FROM companies WHERE is_demo = true;"`
   Any non-zero count means seeded rows exist in the database — they are
   hidden from users, but remove them per §6 for cleanliness.

---

## 8. Admin access

`ADMIN_EMAILS` works in development/test only; production ignores it (open
signup + unverified emails would let anyone claim a listed address). To
grant your production account admin:

1. Sign up normally through the production app with your email.
2. From your machine:
   ```bash
   DATABASE_URL="<railway-production-url>?sslmode=require" pnpm admin:grant you@example.com
   ```
3. Reload the app — `/admin` now renders for you. Verify a second,
   non-admin account gets a 404 on `/admin`.

The command errors if the account does not exist yet — sign up first.

---

## 9. Serverless connection behavior

`src/db/index.ts` opens one small pool per warm instance (`DB_POOL_MAX`,
default 5; idle sockets close after 20s). With Railway's default connection
limit (~100 on Postgres 16) this supports dozens of concurrent warm
instances. If the app later scales past that, put PgBouncer in front and
lower `DB_POOL_MAX` to 1–2 — no code changes required.

Auth rate-limit counters live in the `rate_limit` table (created by
migration 0003), shared across serverless instances.

---

## 10. Launch-day order of operations

1. GitHub default branch → `main` (§1).
2. Vercel Production Branch → `main` (§2).
3. Split Preview/Production databases and secrets (§4, §5).
4. Back up production DB, then `pnpm db:status` → `pnpm db:migrate` →
   `pnpm db:status` shows "Up to date" (§3).
5. Redeploy production from `main`; confirm the build succeeds.
6. Sign up + `pnpm admin:grant` your admin account (§8).
7. Verify zero demo companies (§7) — already verified true as of
   2026-08-26 (§0); re-check only takes a minute.
8. Attach `vantorcapital.org` (§2a) — this is what makes the site
   publicly reachable; deployment protection stays untouched.
9. Run the full smoke test — `docs/SMOKE_TEST.md` — against
   `https://vantorcapital.org`.
10. Publish 1–2 real companies before investor invitations so Discover is
    not empty.

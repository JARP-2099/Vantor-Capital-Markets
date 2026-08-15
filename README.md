# VANTOR

**Vantor Capital Markets** — a private startup marketplace where founders
build standardized company profiles and investors discover private
companies.

> Vantor is not a registered broker-dealer, funding portal, securities
> exchange, ATS, investment adviser, or custodian. This codebase deliberately
> contains **no** securities transactions, money movement, or trading
> functionality. All regulated capabilities are feature-flagged off in
> `src/config/features.ts`.

## Current scope (Phase 1)

- Public landing page and startup discovery marketplace (`/companies`) with
  search, filters, and standardized company cards
- Standardized public company profiles (`/companies/[slug]`)
- Email/password authentication with secure sessions
- Founder onboarding wizard (7 steps, draft-saving) and founder dashboard
- Admin review workflow (approve / send back / unpublish / archive)
- Audit logging, role/capability system, historical metrics model

Deferred by design: valuation engine (Phase 2), verification engine
(Phase 3), watchlists UI, data rooms, acquisitions, anything regulated.
See `docs/ARCHITECTURE.md` and `VANTOR_HANDOFF.md`.

## Stack

Next.js 16 (App Router) · TypeScript strict · PostgreSQL 16 · Drizzle ORM ·
better-auth · Tailwind CSS v4 · Zod · Vitest

## Getting started

Prerequisites: Node 22+, pnpm, PostgreSQL 16.

```bash
pnpm install

# 1. Create databases (adjust user/password to taste)
sudo -u postgres psql \
  -c "CREATE ROLE vantor LOGIN PASSWORD 'vantor_dev_password';" \
  -c "CREATE DATABASE vantor_dev OWNER vantor;" \
  -c "CREATE DATABASE vantor_test OWNER vantor;"

# 2. Configure environment
cp .env.example .env        # then edit values; every variable is documented there

# 3. Apply migrations
pnpm db:migrate

# 4. (Optional) seed demo accounts + clearly fictional demo companies
#    Requires ALLOW_SEED=true in .env. Demo rows are flagged isDemo=true.
pnpm db:seed

# 5. Run
pnpm dev                    # http://localhost:3000
```

Seeded logins (development only): `admin@vantor.dev` / `vantor-admin-dev-1`
and `founder@vantor.dev` / `vantor-founder-dev-1`.

## Commands

| Command            | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Development server                         |
| `pnpm build`       | Production build                           |
| `pnpm start`       | Serve production build                     |
| `pnpm lint`        | ESLint                                     |
| `pnpm typecheck`   | TypeScript, no emit                        |
| `pnpm test`        | Vitest (needs `TEST_DATABASE_URL`)         |
| `pnpm db:generate` | Generate migration from schema changes     |
| `pnpm db:migrate`  | Apply migrations                           |
| `pnpm db:seed`     | Seed demo data (gated by `ALLOW_SEED`)     |

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the system shape,
domain model, authorization design, company lifecycle, security posture, and
the extension points reserved for later phases. Session-to-session
continuity lives in [`VANTOR_HANDOFF.md`](VANTOR_HANDOFF.md).

## Deployment notes

- Set `BETTER_AUTH_SECRET` (strong, unique), `BETTER_AUTH_URL` (canonical
  https origin), and `DATABASE_URL` in the hosting environment; never commit
  secrets.
- Leave `ALLOW_SEED` unset in production; demo data must never reach it.
- The app is a standard Next.js deployment (any Node host); PostgreSQL is
  the only backing service.

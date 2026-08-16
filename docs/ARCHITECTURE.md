# Vantor — Architecture

This document describes the technical architecture established in Phase 1
(platform foundation, marketplace, founder onboarding, company profiles,
admin review). Read `VANTOR_HANDOFF.md` for session-level status and next
steps.

## System shape

A single Next.js 16 (App Router) application backed by PostgreSQL. There are
deliberately no microservices, queues, or exotic infrastructure — the goal is
an architecture a small team can operate that grows by adding modules, not by
rewriting.

```
Browser ──► Next.js (App Router, server components + server actions)
                 │
                 ├── better-auth  (email/password, sessions, rate limiting)
                 └── Drizzle ORM ──► PostgreSQL 16
```

| Concern     | Choice                            | Why                                                            |
| ----------- | --------------------------------- | -------------------------------------------------------------- |
| Framework   | Next.js 16, App Router, `src/`    | SSR for public SEO pages + server actions for authorized writes |
| Language    | TypeScript strict                 | Financial data deserves types                                   |
| Database    | PostgreSQL 16                     | Relational integrity, constraints, obvious growth path          |
| ORM         | Drizzle (+ drizzle-kit migrations)| SQL-first, typed, no codegen runtime                            |
| Auth        | better-auth                       | Email/password, secure httpOnly cookies, built-in rate limiting |
| Styling     | Tailwind v4 + custom tokens       | One design system, no component-library lock-in                 |
| Validation  | Zod (shared client/server)        | One schema per onboarding step, revalidated server-side         |
| Tests       | Vitest (+ real Postgres test DB)  | Authorization and visibility are integration-tested             |

## Design system (visual overhaul phase)

Design direction is documented in `docs/VANTOR_UI_UX_REFERENCE_BRIEF.md`
(permanent). Implementation:

- **Tokens** live only in `src/app/globals.css` `@theme`: warm ivory
  neutrals (`canvas`/`paper`/`mist`/`line`), navy-black ink scale, a single
  cobalt accent scale, reserved semantic colors, radii, shadows, and motion
  tokens/keyframes. Feature code never hardcodes colors.
- **Typography**: Instrument Sans (UI + marketing, tabular numerals via the
  `tabular-nums` utility) and Instrument Serif (marketing display only),
  loaded with `next/font` in `src/app/layout.tsx` and exposed as
  `font-sans` / `font-serif`.
- **Primitives** in `src/components/ui/`: Button (primary/secondary/ghost/
  danger/ink/inverse), Badge (filled + `dot` status style), Card, Field,
  Input/Textarea/Select, Alert, MetricStat, EmptyState, SectionHeading,
  shared data-table primitives (`table.tsx`), Spinner, and `Reveal` — a
  reduced-motion-safe scroll-reveal used only on marketing surfaces.
- **Brand**: V mark (two converging wedges) + wordmark in
  `src/components/layout/logo.tsx`; favicon/app icons in `src/app/`
  (`icon.svg`, `apple-icon.png`, `favicon.ico`).
- **Motion policy**: marketing may use entrance reveals and CSS keyframes;
  the authenticated product is limited to 150–220ms state transitions.
  Everything collapses under `prefers-reduced-motion`.
- `cn()` (`src/lib/cn.ts`) merges Tailwind classes via `tailwind-merge`,
  so later classes deterministically override earlier ones.

## Repository layout

```
src/
  app/
    (public)/            # landing + marketplace (indexable)
      companies/         # discovery list + [slug] profiles
    (auth)/              # login, signup (noindex)
    founder/             # founder dashboard + onboarding wizard (noindex, auth)
    admin/               # admin review area (noindex, admin-only)
    api/auth/[...all]/   # better-auth handler
  components/
    ui/                  # design-system primitives (Button, Field, Card, Table,
                         #   Badge, MetricStat, SectionHeading, Reveal, …)
    layout/              # header, footer, container, logo (V mark + wordmark)
    landing/             # marketing-only compositions (hero/valuation demos)
    founder/ marketplace/ admin/   # feature components
  db/
    schema/              # drizzle schema (auth, companies, platform)
    queries/             # shared read layer (visibility rules live here)
    migrations/          # generated SQL migrations
    seed.ts              # demo data (ALLOW_SEED=true gated, isDemo-flagged)
  lib/
    auth.ts auth-client.ts authz.ts audit.ts   # auth + authorization + audit
    validation/          # zod schemas (single source of truth)
    constants.ts format.ts slug.ts cn.ts       # shared vocabulary + helpers
  config/features.ts     # regulated-capability flags, all false
tests/                   # vitest suites (run against vantor_test DB)
```

## Domain model

Core tables (see `src/db/schema/`):

- **companies** — identity, story sections, lifecycle status
  (`draft → submitted → under_review → published → archived`), review fields
  (`reviewedBy`, `reviewNotes`), `isDemo` flag, `createdBy`.
- **company_intents** — join table; a company can hold several intents
  (seeking investment, open to acquisition offers, …) simultaneously.
- **company_members** — founders and team; `userId` nullable so profile-only
  members don't need accounts; founder-role rows confer edit rights.
- **company_metrics** — historical rows (`metricType`, `value`, `currency`,
  `asOf`, `periodStart/End`, `source`), never columns on the company row.
  “Latest value per type” is a query concern (`getLatestMetrics`). This is
  the attachment point for Phase 2 valuations and Phase 3 verification.
- **user_roles** — capability model (founder/investor/buyer/admin); one human
  can hold many roles on one account. Admin also bootstraps from
  `ADMIN_EMAILS` (server env).
- **watchlist_items** — schema ready; UI is Phase 4.
- **funding_rounds** — structural skeleton for Phase 9+; nothing writes to it
  and nothing exposes it.
- **audit_log** — append-only record of meaningful actions
  (`company.created/submitted/approved/rejected/unpublished/…`).

Database constraints back up application validation: unique slug (+ format
check), founded-year sanity, non-negative counts, ISO currency format, period
ordering, unique (company, metric, asOf) points, partial-unique member rows.

## Authentication & authorization

- better-auth issues httpOnly session cookies (secure in production); the
  handler lives at `/api/auth/[...all]`; auth endpoints are rate-limited.
- `src/lib/authz.ts` is the only authorization surface:
  - `requireUser()` — session or `UnauthorizedError`.
  - `requireAdmin()` — role check (DB roles ∪ `ADMIN_EMAILS`) or `ForbiddenError`.
  - `requireCompanyManager(companyId)` — creator or founder-role member;
    missing and forbidden are indistinguishable (anti-enumeration).
- Every server action re-checks authorization and re-validates input with the
  shared Zod schemas. UI state (hidden buttons, layouts) is never a security
  boundary. Admin actions never piggyback on founder checks, so the audit log
  distinguishes who acted in which capacity.

## Visibility rules

All public reads flow through `src/db/queries/companies.ts`:
`getPublishedCompanies` / `getPublishedCompanyBySlug` only ever return
`status='published'` rows — drafts, submissions, and archived companies are
structurally unreachable from public surfaces. Founder reads scope by
ownership; admin reads require `requireAdmin()` first.

## Company lifecycle

```
draft ──founder submit──► submitted ──admin──► under_review
  ▲                           │                    │
  │◄────── admin reject (notes) ◄──────────────────┤
  │                           └──admin approve──► published
  │◄──────────── admin unpublish (notes) ─────────┘
  └──────► archived (admin) ──restore──► draft
```

Founder edits: free while `draft`; locked during `submitted/under_review`;
live-effect while `published` (documented v1 trade-off — re-review on edit is
future work); read-only when `archived`. Transitions are enforced in server
actions, not by button visibility.

## Regulated-capability boundary

`src/config/features.ts` declares flags (`investmentsEnabled`,
`regulatedOfferingsEnabled`, `secondaryMarketEnabled`,
`acquisitionTransactionsEnabled`, `valuationsEnabled`,
`verificationEnabled`, `watchlistsEnabled`) — all `false`. No code path
implements transactions, money movement, order books, or valuation display.
Wording across the product describes *openness to conversations*, never
offerings. The footer carries an explicit not-a-broker-dealer disclosure.

## Valuation engine (Phase 2 — live)

`src/lib/valuation/` implements `vantor-valuation-v1`: a pure, deterministic
engine (no I/O, injected clock) fed by a persisted input snapshot assembled
from company facts + historical metrics. Components: revenue multiple,
profitability, stage baseline (pre-revenue), and an honest comparables stub
that always reports insufficient data (no fabricated comps). Versioned
assumptions live only in `assumptions.ts` (`vantor-assumptions-v1`). Runs
persist append-only to `valuation_runs` + `valuation_components` with
engine/assumptions versions, risk flags, confidence, and explainability
payloads. Access: company managers/admins trigger runs (10-min cooldown,
admin bypass); public display requires company published +
`showPublicValuation`. Full methodology: `docs/VALUATION_METHODOLOGY.md`.

## Verification foundation (Phase 3 — live)

`verification_requests` (8 categories, 7 statuses, legal transitions in
`src/lib/verification/constants.ts`, admin-only `internalNotes` vs
founder-visible `founderNote`) + `verification_evidence` (references only —
raw documents are deferred to the future secure document store). Founders
submit claims per category; admins decide via guarded transitions; every
action is audited. Public surfaces get status-only summaries
(`getPublicVerificationSummary`): "% verified" always means "share of
submitted information verified", never an endorsement. Verified financial
categories raise valuation *confidence* only — never the estimated value.

## Production data layer

Local dev uses the documented Postgres 16 workflow (README). Production
targets Railway PostgreSQL + Vercel: per-instance pool sized by
`DB_POOL_MAX` (default 5, idle timeout 20s), TLS via `?sslmode=require` on
the connection string, migrations applied from a developer machine/CI —
never at serverless boot. See `docs/DEPLOYMENT.md`.

## Extension points (do not rebuild — attach)

- **Comparables dataset** — `valuation_components` and the engine's
  comparables interface are ready; activating the model requires only a
  legitimate transaction dataset, no schema change.
- **Verification providers** — evidence `kind = provider_integration` is
  the seam for accounting/payments/banking integrations; no vendor coupling
  exists in the domain model.
- **Watchlists (Phase 4)** — table exists; add UI + investor dashboard.
- **Data rooms (Phase 5)** — new document tables + per-company access grants;
  never store documents in the public profile model.
- **Acquisitions (Phase 6)** — intents already modeled; add opportunity/offer
  tables when the marketplace phase starts.
- **Regulated rails (Phase 9+)** — funding_rounds skeleton + feature flags
  mark the integration seam for a broker-dealer/funding-portal partner.

## Security posture

- Global security headers (CSP, frame-ancestors 'none', nosniff,
  referrer-policy, permissions-policy) in `next.config.ts`.
- Secrets only via validated `src/env.ts` (`server-only`); `.env` gitignored;
  `.env.example` documents every variable.
- Parameterized queries throughout (Drizzle); LIKE wildcards escaped in
  search; URL validation rejects `javascript:`.
- `/founder`, `/admin`, auth pages are `noindex` + robots-disallowed.
- Audit log never stores secrets or passwords.
- Seeding refuses to run without `ALLOW_SEED=true` and marks rows `isDemo`.

## Testing

`pnpm test` runs Vitest against `TEST_DATABASE_URL` (name must contain
"test"; migrations auto-applied). Suites cover resource ownership (IDOR),
role bootstrap, marketplace visibility (drafts never public), filter/search
correctness (including LIKE-escape), pagination, metric history, slug rules,
and the Zod step schemas. Runtime auth flows (cookies, rate limiting) are
exercised manually / via QA because they need the full Next request cycle.

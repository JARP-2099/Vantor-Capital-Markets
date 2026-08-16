# VANTOR — Handoff (through Phase 2)

Written for the next session (or engineer) with zero prior context. Read
this, then `docs/ARCHITECTURE.md`, `docs/VALUATION_METHODOLOGY.md`,
`docs/DEPLOYMENT.md`, and `docs/DEVELOPMENT_PLAYBOOK.md`.

## What Vantor is

A private startup marketplace: founders build standardized company profiles,
investors discover private companies. Vantor is NOT a broker-dealer/funding
portal/exchange — no securities transactions, payments, trading, custody, or
tokens exist anywhere, and those capabilities stay behind `false` flags in
`src/config/features.ts`. `valuationsEnabled` and `verificationEnabled` are
now `true` (deliberately — those systems shipped in Phase 2).

## Session history

- **Phase 1** (Master Prompt #1): from an empty repo → full foundation:
  Next.js 16 + TS strict + Drizzle/Postgres 16 + better-auth + Tailwind v4;
  marketplace, standardized profiles, 7-step founder onboarding with drafts,
  founder dashboard, admin review workflow, audit log, roles/capabilities,
  historical metrics model, seeds, 33 tests, security pass.
- **Phase 2** (Master Prompt #2, this session): production data-layer
  hardening (Railway/Vercel-ready), Valuation Engine V1, Verification
  Foundation, expanded seeds, 69 tests total.

Branch: `claude/vantor-platform-foundation-uw0r8u`, pushed to origin.

## Infrastructure

- **ORM/migrations**: Drizzle + drizzle-kit. Migrations in
  `src/db/migrations/` (0000 = Phase 1 schema, 0001 = valuations,
  verification, `top_customer_revenue_pct` metric, `show_public_valuation`).
  Workflow: edit schema → `pnpm db:generate` → review SQL → `pnpm db:migrate`.
- **Client**: postgres-js, one small pool per instance (`DB_POOL_MAX`,
  default 5; idle_timeout 20s; globalThis reuse in dev) —
  serverless-appropriate for Vercel; TLS via `?sslmode=require` in the URL.
  No mock/in-memory persistence exists anywhere; all flows hit Postgres.
- **Environments**: local dev (documented in README), Railway production,
  Vercel hosting. `docs/DEPLOYMENT.md` has the exact human steps + env
  matrix. Migrations run from a dev machine/CI, never at serverless boot.
- **Env vars**: DATABASE_URL, TEST_DATABASE_URL, DB_POOL_MAX,
  BETTER_AUTH_SECRET, BETTER_AUTH_URL, ADMIN_EMAILS, ALLOW_SEED — all
  documented in `.env.example` (now actually tracked; the scaffold's
  `.env*` gitignore had silently excluded it in Phase 1).

## Valuation Engine V1

- **Versions**: `vantor-valuation-v1` (engine) + `vantor-assumptions-v1`
  (assumptions) — both stamped on every run; history is append-only and
  never overwritten. Methodology fully documented in
  `docs/VALUATION_METHODOLOGY.md`.
- **Code**: `src/lib/valuation/` — `engine.ts` (pure, deterministic,
  injected clock), `assumptions.ts` (ALL baseline numbers, clearly labeled
  model assumptions — no scraped/fabricated market data), `inputs.ts` (the
  only I/O: assembles + snapshots inputs), `service.ts` (cooldown 10 min,
  persist, audit), `types.ts`.
- **Components**: revenue multiple (ARR → revenue → MRR×12; growth/margin/
  industry factors), profitability (net profit × ~12×, only when
  profitable), stage baseline (pre-revenue; capital-raised floor, never $0),
  comparables (always "Insufficient Comparable Data" — interface ready, no
  dataset exists). Risk flags (runway/burn/decline/concentration/margins,
  floor −40%), outlier widening (>3× disagreement → range spans models),
  confidence 5–95 (documented formula; verification of financial categories
  adds confidence, never value; pre-revenue capped at 55), sufficiency
  strong/moderate/limited/insufficient, 3-sig-fig rounding.
- **Persistence**: `valuation_runs` (+ range/mid/confidence DB checks,
  input snapshot jsonb) and `valuation_components` (per-model status,
  range, weight, explainability detail).
- **Access**: `requestValuation`/`setValuationVisibility` (founder;
  requireCompanyManager; companyId server-bound), `adminRequestValuation`
  (admin, bypasses cooldown). Public display only when company published
  AND `showPublicValuation` (founder toggle).
- **UI**: founder tab `/founder/companies/[id]/valuation` (generate/
  refresh, breakdown, risk factors, methodology, history, improve-estimate
  hints, visibility toggle, disclaimers); public profile section
  (headline range/midpoint/confidence/quality, breakdown, SVG midpoint
  sparkline + table labeled "Vantor Estimated Private Market Valuation" —
  deliberately not ticker-styled).
- **Tests**: `tests/valuation-engine.test.ts` (determinism, pre-revenue,
  risk, outliers, confidence, currency, rounding),
  `tests/valuation-service.test.ts` (persistence, history preservation,
  cooldown + admin bypass, snapshot audit, authz scoping).

## Verification Foundation

- **Domain**: `verification_requests` — 8 categories (founder_identity,
  company_formation, revenue, financial_statements, ownership,
  customer_metrics, intellectual_property, operating_metrics), statuses
  pending/under_review/verified/partially_verified/rejected/needs_update/
  expired ("not submitted" = absence of a request). Legal transitions live
  in `src/lib/verification/constants.ts` (`VERIFICATION_TRANSITIONS`) and
  are enforced server-side from current DB status with guarded UPDATEs.
  `internalNotes` (admin-only) vs `founderNote` (shown to founder) are
  separate columns; the founder query strips internalNotes structurally.
- **Evidence**: `verification_evidence` — kind (document_reference /
  external_url / attestation / provider_integration), description,
  reference. References only; raw documents deferred to the future secure
  document store. Provider integrations (accounting/payments/banking) plug
  in as evidence kinds + future services — no vendor coupling.
- **Flows**: founder submits claims per category (+evidence, blocked while
  a request is already in review; re-submission after rejection creates a
  new row, history retained); admin queue `/admin/verifications` + detail
  with transition-driven decision panel (founderNote REQUIRED on
  reject/needs_update); everything audited without note content.
- **Public display**: status-only summary — "N% Verified" = share of
  SUBMITTED categories verified (partial = 0.5), never a claim about
  unsubmitted data; per-category badges; explicit non-endorsement
  disclaimer. Founder-typed values never show a green check.
- **Valuation linkage**: verified revenue/financial_statements categories
  feed ONLY the confidence score (+6 each, cap +10) — never the estimate.
- **Tests**: `tests/verification.test.ts` — summary math,
  latest-per-category, internalNotes stripping, evidence scoping,
  transition-map invariants (founders can never reach verified).

## Commands executed this session (all passing at HEAD)

`pnpm lint` (0 problems) · `pnpm typecheck` · `pnpm test` (69/69, 7 files)
· `pnpm build` · `pnpm db:generate` / `db:migrate` (0001 applied) ·
`pnpm db:seed` (9 demo companies incl. pre-revenue, high-burn/low-runway,
declining + concentrated archetypes).

## Human setup still required (see docs/DEPLOYMENT.md for exact steps)

1. **Railway**: create project → add PostgreSQL → copy connection URL →
   `DATABASE_URL="<url>?sslmode=require" pnpm db:migrate` from your machine.
2. **Vercel**: import the GitHub repo; set env vars DATABASE_URL,
   BETTER_AUTH_SECRET (fresh), BETTER_AUTH_URL (the Vercel URL),
   DB_POOL_MAX=3, ADMIN_EMAILS; never set ALLOW_SEED. Deploy.
3. No custom domain work — everything is environment-driven; adding one
   later only changes `BETTER_AUTH_URL`.

## Known issues / limitations

1. Evidence upload = references/descriptions only (no file storage yet —
   Phase 5 data rooms).
2. No email delivery (verification emails, password reset) — unchanged.
3. Rate limiting per-instance memory; valuation cooldown is per-company DB
   check (10 min) — fine at current scale.
4. Published-company edits still take effect without re-review (Phase 1
   trade-off, unchanged).
5. Comparables model inactive by design until a legitimate dataset exists.
6. Assumptions are code-versioned constants; the admin editing surface for
   them is future work.
7. Currency: valuation outputs use the primary revenue metric's currency;
   mixed-currency metric sets are not converted (no FX data) — capital
   floors compare numerically. Documented, acceptable at seed scale.
8. Founder-area 404s can stream as 200 with not-found UI (Phase 1 note);
   public marketplace emits real 404s.
9. Valuation UI duplicates small helpers (component labels, num parser)
   between founder page and public section — candidates for a shared
   module next touch.

## Recommended next phase

**Investor Experience + Watchlists + Discovery Intelligence** (per Master
Prompt #2 §52): investor onboarding/profiles, watchlist UI on the existing
`watchlist_items` table, discovery improvements (saved filters, followed
companies), possibly valuation/verification display refinements from real
usage. Do not start regulated functionality.

## Files to inspect first next session

1. This file, then `docs/ARCHITECTURE.md`
2. `src/db/schema/` (all five schema files)
3. `src/lib/valuation/engine.ts` + `assumptions.ts`
4. `src/lib/verification/constants.ts` + `src/db/queries/verifications.ts`
5. `src/lib/authz.ts`, `src/lib/actions/*.ts`
6. `docs/DEPLOYMENT.md` (if doing infra work)

# VANTOR — Phase 1 Handoff

Written for the next Claude session (or engineer) with zero prior context.
Read this first, then `docs/ARCHITECTURE.md`, then the files listed at the
bottom.

## What Vantor is

A private startup marketplace: founders build standardized company profiles,
investors discover private companies. Vantor is NOT a broker-dealer/funding
portal/exchange — no securities transactions, money movement, valuations, or
trading exist anywhere in this codebase, and every regulated capability is
feature-flagged **off** in `src/config/features.ts`. Keep it that way until
the Phase 9 regulatory decision.

## Repository state (end of Phase 1)

- Branch: `claude/vantor-platform-foundation-uw0r8u` (pushed to origin).
- Started from a completely empty repository this session.
- Stack: Next.js 16.3 (App Router, `src/`), React 19.2, TypeScript strict,
  PostgreSQL 16, Drizzle ORM 0.45 (+ drizzle-kit migrations), better-auth
  1.6 (email/password), Tailwind v4, Zod 4, Vitest 4.
- One migration: `src/db/migrations/0000_chief_nekra.sql` (12 tables).

## What was built

| Area | Status | Where |
|---|---|---|
| Design system (tokens + primitives) | Done | `src/app/globals.css`, `src/components/ui/*` |
| Landing page | Done | `src/app/(public)/page.tsx` |
| Auth (email/password, sessions, rate limit) | Done | `src/lib/auth.ts`, `/api/auth/[...all]`, `(auth)/login`, `(auth)/signup` |
| Authorization layer | Done | `src/lib/authz.ts` (requireUser / requireAdmin / requireCompanyManager / findManageableCompany) |
| Domain schema + constraints | Done | `src/db/schema/{auth,companies,platform}.ts` |
| Shared read layer (visibility rules) | Done | `src/db/queries/companies.ts` |
| Marketplace `/companies` (search, filters, pagination, cards) | Done | `src/app/(public)/companies/`, `src/components/marketplace/` |
| Public profile `/companies/[slug]` (header, metric tiles, story, metric history table, team) | Done | same |
| Founder onboarding (7 steps, draft saving, resume) | Done | `src/app/founder/onboarding/`, `src/components/founder/`, `src/lib/actions/founder-company.ts` |
| Founder dashboard + company management | Done | `src/app/founder/`, `/founder/companies/[id]/{,profile,metrics,team}` |
| Admin review (queue, detail, approve/send-back/unpublish/archive/restore, users, audit view) | Done | `src/app/admin/`, `src/lib/actions/admin-review.ts`, `src/components/admin/` |
| Audit logging | Done | `src/lib/audit.ts`, `audit_log` table |
| Seed (demo accounts + 6 fictional companies, `isDemo`-flagged, `ALLOW_SEED` gated) | Done | `src/db/seed.ts` |
| Tests (32) | Done | `tests/*.test.ts` (vitest vs. `vantor_test` DB) |
| Docs | Done | `README.md`, `docs/ARCHITECTURE.md`, this file |

## Architecture decisions (and why)

1. **Single Next.js app + Postgres** — smallest thing that can grow; no
   microservices/queues/GraphQL by design.
2. **Metrics are historical rows** (`company_metrics`), never columns on
   `companies` — this is the attachment point for Phase 2 valuations and
   Phase 3 verification (a `source` column is already reserved).
3. **Intents are a join table** (`company_intents`) because companies hold
   several at once; public wording maps through `PUBLIC_INTENT_BADGES` and
   deliberately avoids offering-like language.
4. **Roles are capabilities** (`user_roles`: founder/investor/buyer/admin on
   one account), plus `ADMIN_EMAILS` env bootstrap for the first admin.
5. **All authorization is server-side** in `src/lib/authz.ts`; UI never
   gates anything security-relevant. Missing vs. forbidden company → the
   same error/404 (anti-enumeration).
6. **Visibility lives in the query layer**: public reads can only return
   `status='published'` (`getPublishedCompanies`/`getPublishedCompanyBySlug`).
7. **Zod schemas in `src/lib/validation/company.ts` are the single source of
   truth** — used by wizard UI and re-validated in every server action.
8. **Feature flags, all false**, fence off every regulated capability;
   `funding_rounds` exists as an unexposed skeleton so Phase 9 needs no
   disruptive migration.

## Company lifecycle (enforced in server actions, guarded UPDATEs)

`draft → submitted → under_review → published`, with admin
send-back/unpublish returning to `draft` (notes required, shown to founder),
`archive ↔ restore`. Founder edits: draft = free; submitted/under_review =
locked; published = live-effect (documented trade-off — no re-review on
edit yet); archived = read-only.

## Commands & verification (all executed this session, all passing)

```
pnpm lint            # clean
pnpm typecheck       # clean
pnpm test            # 32/32 pass (needs TEST_DATABASE_URL, DB name must contain "test")
pnpm build           # production build succeeds; routes listed in output
pnpm db:migrate      # applied to vantor_dev
pnpm db:seed         # demo data seeded (ALLOW_SEED=true)
```

Dev login (seeded, dev only): `admin@vantor.dev` / `vantor-admin-dev-1`,
`founder@vantor.dev` / `vantor-founder-dev-1`.

## Environment variables (see `.env.example` for full docs)

`DATABASE_URL` (req), `TEST_DATABASE_URL` (tests), `BETTER_AUTH_SECRET`
(req, strong), `BETTER_AUTH_URL` (req, canonical origin), `ADMIN_EMAILS`
(optional bootstrap), `ALLOW_SEED` (never in prod).

## Security controls in place

Server-side authz on every page loader AND action; guarded status
transitions; zod re-validation server-side; LIKE-wildcard escaping;
`javascript:` URL rejection; CSP + X-Frame-Options DENY + nosniff +
referrer/permissions policies (`next.config.ts`); httpOnly (secure in prod)
session cookies; auth rate limiting (30/60s); `/founder` `/admin` noindex +
robots-disallowed; admin area 404s for non-admins; secrets confined to
validated server-only env; audit log with no sensitive payloads; seed gated
+ `isDemo` flag.

## QA / security review results (adversarial pass, this session)

A dedicated QA agent probed a running build (dev + production) with real
sessions. **Passed:** admin boundaries (non-admin gets data-free 404),
draft/submitted privacy (absent from list, slug 404, no data in any
response), IDOR (cross-founder page and action attempts denied; actions
re-derive access server-side), state-machine guards (illegal transitions
rejected; guarded UPDATEs make concurrent reviews apply once), XSS (React
escaping intact, no `dangerouslySetInnerHTML`), SQL injection (parameterized
+ LIKE-escape), security headers, no secrets in client bundles, rate
limiting (429 after ~30 rapid failed sign-ins), SEO metadata + noindex.

**Fixed after review:** (1) marketplace profile 404s previously streamed as
HTTP 200 because `loading.tsx` Suspense boundaries committed the status
before `notFound()` — the existence check now lives in
`companies/[slug]/layout.tsx` (pre-stream → real 404), the segment's
loading files were removed, and `/founder` gained a layout-level auth gate
(real 307); (2) `scope="col"` added to admin/review metric tables;
(3) website validation now requires a dotted hostname, killing
`javascript:`-style scheme smuggling (regression-tested).

**Testing gotcha for future sessions:** kill dev/prod servers with
`pkill -f next-server` (the process is named `next-server`, not
"next start") — a stale server will silently serve an old build and
invalidate status-code measurements.

## Known issues / deliberate limitations

1. **Published-company edits take effect immediately** without re-review.
   Acceptable for v1; revisit when trust matters more (add a re-review or
   changed-fields diff flow).
2. **No email delivery** — email verification and password reset are OFF
   (`requireEmailVerification: false`; no reset UI). Needs an email provider
   (Phase 4-ish).
3. **Logo upload not implemented** (`logoUrl` column exists; no upload
   pipeline/storage yet). Profiles render fine without logos.
4. **CSP allows `'unsafe-inline'` scripts** (Next.js runtime requirement
   without a nonce pipeline); tighten later.
5. **Rate limiting is per-instance memory** (better-auth default) — fine for
   one node; use a shared store when scaling horizontally.
6. **`getMarketplaceFilterOptions`** offers options from all published
   companies (not faceted counts), so some filter combinations return zero
   results.
7. **Vitest covers the data/authz layer**; full request-cycle auth flows are
   exercised manually/via QA, not in CI. No CI workflow is configured yet.
8. **Metric editing replaces rows from the form** (delete-then-insert in a
   transaction) — simple, safe, but means concurrent edits last-write-wins.
9. Tabs/manage nav are links (URL-driven), not ARIA tab widgets — simpler
   and accessible, just not fancy.
10. Inside the authenticated founder area, a wrong-company id renders the
    not-found UI but may stream with HTTP 200 (the `founder/loading.tsx`
    boundary commits status early). No data is exposed and the area is
    noindex; accepted for v1. The public marketplace emits real 404s.
11. Anonymous requests to `/admin` redirect to `/login` (route existence is
    disclosed); signed-in non-admins get a 404. Deliberate UX choice.
12. `/companies` list has no skeleton `loading.tsx` (removed while fixing
    status-code streaming). Server-rendering is fast; revisit only with
    care — a parent-segment loading boundary can silently break child 404
    statuses.

## Deferred (do NOT accidentally build ahead of sequence)

Valuation engine (Phase 2), verification engine (Phase 3), investor
profiles/watchlist UI (Phase 4 — schema exists), data rooms (5),
acquisition marketplace (6), monetization (7), portfolio (8), regulated
rails (9+). `documents`, `updates` profile sections intentionally absent.

## Recommended next phase

**Vantor Valuation Engine + Data Verification Architecture** (Phases 2–3),
per the product plan:
- New tables keyed by `companyId` (+ optionally `company_metrics.id`):
  valuations (range/midpoint/confidence/methodology/version) and
  verifications (type/state/source/evidence/reviewer/timestamps).
- Render behind `valuationsEnabled` / `verificationEnabled` flags; profile
  page already omits those sections cleanly.
- Historical metrics + audit log are the designed inputs.

## Files to inspect first next session

1. `VANTOR_HANDOFF.md` (this file)
2. `docs/ARCHITECTURE.md`
3. `src/db/schema/companies.ts` — domain model
4. `src/lib/authz.ts` — authorization contract
5. `src/db/queries/companies.ts` — visibility rules
6. `src/config/features.ts` — regulated-capability boundary
7. `src/lib/validation/company.ts` — shared validation
8. `src/lib/actions/founder-company.ts` + `src/lib/actions/admin-review.ts`
9. `src/app/(public)/companies/[slug]/page.tsx` — profile rendering

# VANTOR — Handoff (through Phase 3.5: Private Beta Readiness)

## Latest session: Phase 3.5 — Private Beta Readiness

Branch: `claude/vantor-phase-3-investor-2mpd9m` (continues the Phase 3
session). At session end: lint 0 problems, typecheck clean, **122/122
tests** (107 baseline + 15 new), production build passing.

### What shipped

- **Demo vs real separation.** `demoCompaniesHidden()` in
  `src/db/queries/companies.ts`: fictional `isDemo` companies are excluded
  from every public read path (marketplace list, filter options, slug
  lookup, watchlist saves and rendering) on the Vercel PRODUCTION
  deployment (`VERCEL_ENV=production`; `HIDE_DEMO_COMPANIES=true` forces it
  anywhere, used by tests). Where demo companies DO render (dev/Preview), a
  visible amber "Demo" chip marks them on Discover rows, mobile cards, and
  the profile header ("Demo company"), each with a plain-language
  explanation. Admin surfaces already labeled demo rows.
- **Seed safety.** Guard extracted to `src/db/seed-guard.ts` (pure,
  unit-tested): requires ALLOW_SEED=true, refuses NODE_ENV=production,
  refuses inside ANY Vercel runtime (preview included — seeding is a
  dev-machine operation), validates DATABASE_URL, and prints the target
  database/host before writing.
- **Admin beta operations.** New "Recently edited published companies"
  section on the admin dashboard (`getRecentlyUpdatedPublishedCompanies`:
  published rows whose updated_at is >1h after published_at, newest first)
  — the oversight surface for live founder edits, which go live without
  re-review by design. Approve/send-back/unpublish/archive/restore already
  existed with guarded transitions and required founder-facing notes.
- **Founder clarity.** `METRIC_HELP` (src/lib/constants.ts): one-line
  plain-language explanation for every metric type, shown live under the
  metric selector; metrics form states the no-FX/one-currency rule.
  Profile-completion checklist and submission gates already existed.
- **Beta feedback.** `feedback` table (migration 0005) + `/feedback` page
  (signed-in, role/page/message, 10/day per-user cap, DB CHECK bounds) +
  `/admin/feedback` listing + footer "Beta Feedback" link.
- **Usage signals.** `product_events` table (migration 0005, separate from
  audit_log by design) + `recordProductEvent` (fire-and-forget, written via
  `after()` so pages never block): `company.viewed` on profile views,
  `discover.queried` on non-default Discover queries (booleans/counts only,
  never query text). Admin dashboard shows 7-day profile-view and
  discover-query counts. Signup/created/submitted/published/save funnel is
  already answerable from audit_log.
- **QA fixes.** Admin company detail page no longer overflows at 390px
  (grid items got min-w-0; unbreakable ids/URLs wrap via
  overflow-wrap:anywhere); admin verifications table sr-only header
  contained (same fix as Phase 3's marketplace table); signed-in header
  fits at 768px (account name hidden below lg).

### Beta access decision (documented, not built)

Signup remains open. The real gate is publication review: nothing a
stranger creates becomes public without admin approval, and the beta URL
is unannounced. An invite/allowlist system was deliberately not built for
a 5–15 company beta. Revisit if signup abuse appears.

### Known limitations flagged for beta

- No email delivery (no password reset, no submission/review
  notifications). Beta founders should be told review happens manually;
  password resets require operator intervention. Smallest fix later: a
  transactional email provider on 3 events (submission received, approved,
  sent back).
- Verification evidence remains references/descriptions only — founders
  should NOT be pointed at uploading sensitive documents; the secure
  document store is a later phase.
- Monetary values are not FX-converted anywhere (sorting compares
  numerically across currencies); forms now say so. Fine while beta
  companies mostly share a currency.
- Watchlist/feedback mutations rely on per-user caps and auth, not IP rate
  limiting (auth endpoints ARE rate limited).

---

## Previous session: Phase 3 — Investor Experience, Watchlists, Discovery Intelligence

Branch: `claude/vantor-phase-3-investor-2mpd9m` (based on the stabilization
branch tip `4a94263`, which was never merged to the default branch — this
branch carries it). At session end: lint 0 problems, typecheck clean,
**107/107 tests** (85 baseline + 22 new), production build passing.

### What shipped

- **Watchlist (persisted, private).** The Phase-1 `watchlist_items` table is
  now live (`watchlistsEnabled: true` in `src/config/features.ts`).
  - Query layer `src/db/queries/watchlists.ts`: every function takes a
    server-derived userId and scopes all reads/mutations to it. Only
    published companies are saveable; drafts/archived/nonexistent ids are
    indistinguishable (`not_available`) so saves can't probe private rows.
    `getWatchlistItems` structurally nulls the company for saves whose
    listing later unpublished — the Watchlist page shows an "Unlisted
    company" row with a Remove action, leaking nothing.
  - Server action `src/lib/actions/watchlist.ts` (`setWatchlistState`):
    zod-validated companyId/op, `requireUser`, duplicate saves absorbed by
    the composite PK, audit events `watchlist.saved` / `watchlist.removed`.
  - UI: star toggles on Discover rows (aria-pressed, pending-disabled,
    settles on the server answer — no optimistic lies), a labeled
    Save/Saved button on company profiles, `/watchlist` page reusing the
    marketplace table plus a saved-date column and empty state. Signed-out
    users see a sign-in link in the same footprint; `/login?next=` (new,
    validated server-side to same-site paths) returns them to where they
    were. "Watchlist" appears in the header nav for signed-in users.
- **Discover sorting** (`sort` URL param, whitelisted in
  `src/db/queries/companies.ts` `MARKETPLACE_SORTS`): Newly added
  (default), Recently updated, Revenue, Revenue growth, Est. valuation.
  Metric sorts use correlated subqueries (latest value; ARR preferred over
  annual over MRR with MRR annualized ×12), `NULLS LAST`, and a unique-id
  tiebreak so pagination never duplicates rows. The valuation sort ranks
  only public valuations — hidden ones sort with the "no valuation" group
  so ordering can't leak their magnitude. New index
  `companies_status_updated_at_idx` (migration
  `0004_luxuriant_monster_badoon.sql`) backs the Recently-updated sort.
- **Discovery signals** (`src/lib/discovery/signals.ts`, pure + injected
  clock): "New to Vantor" (published ≤30 days), "Recently updated"
  (meaningful post-publish edit ≤14 days; publish-time touches excluded by
  a 1-hour gap rule; suppressed while "New"), "Highly verified" (≥80%
  verified of ≥3 submitted categories). Rendered as quiet chips with
  plain-English explanations (title + sr-only). Factual only — no scores,
  no recommendations.
- **Verification stats batch query** now returns `{verifiedPct,
  submittedCount}` (`getPublicVerificationStats`); the old pct-only
  function remains as a wrapper.
- **Seeds**: demo companies get varied publish/update recency and seeded
  verification requests (verified/partial/pending/rejected mixes) so
  signals, sorts, and verification surfaces are honestly demonstrable.

### Security review (Phase 3 surface)

- Watchlist IDOR: userId scoping is the WHERE clause, tested (cross-user
  read/delete attempts, forged ids).
- Draft probing via save: rejected identically to nonexistent ids (tested).
- Sort parameter: whitelist + typed switch; user input never reaches SQL.
- Hidden-valuation ordering leak: excluded and tested.
- `next` redirect: same-site absolute paths only (no `//`, no `\`).
- Watchlist mutations are not rate-limited (bounded: max one row per
  published company per user; duplicates impossible) — accepted at current
  scale, revisit with public beta.

### Migration status

`0004_luxuriant_monster_badoon.sql` (one index) applied locally only.
**Manual step: run `pnpm db:migrate` against BOTH the Preview and
Production Railway databases** (see docs/DEPLOYMENT.md). Safe/additive.

### QA performed

Full investor loop on dev + production builds via scripted browser
(signup → browse → search → filter+sort → save ×2 → profile → watchlist →
remove → refresh → sign out/in → persistence verified), responsive sweep
at 1920/1440/1024/768/390 with zero horizontal overflow, empty states
(no results, empty watchlist), invalid param fuzzing (`sort`, `stage`,
`intent`, `page`, SQLi strings) all 200 + safe fallback, production-build
console clean. Keyboard: global `:focus-visible` covers the new controls;
stars carry aria-pressed + per-company labels.

### Deferred from Phase 3 (documented decisions)

- Filters were NOT expanded (revenue/valuation-range filters would imply
  precision the sparse data doesn't support yet); existing
  industry/stage/country/status filters + search retained.
- Verification-level sort omitted (SQL for latest-per-category weighted
  percent is heavy; signal + column cover the need).
- No investor role added — any authenticated user can save (matches the
  capability model; founders can be investors).
- Analytics beyond audit events (`watchlist.saved/removed`): a proper
  product-events pipeline is future work; search/filter events not
  recorded (audit log is the wrong home for high-volume telemetry).
- Sub-day "Recently updated" precision (updated_at is bumped by any
  founder content edit and by admin review; visibility toggles also bump
  it — accepted coarseness, documented in signals.ts).

---

## Previous session: Pre-Phase-3 stabilization & QA pass

Branch: `claude/vantor-stabilization-qa-m4kne0`. Full audit (code review by
subsystem + hands-on browser QA of all four personas + infra review), then
targeted fixes. Baseline at session start matched the Phase 2 handoff
(lint/typecheck/tests 76/76/build all passing); at session end: lint 0
problems, typecheck clean, **85/85 tests**, production build passing.

### Fixed this session

- **P1 security — production admin bootstrap removed.** `ADMIN_EMAILS` now
  grants admin in development/test only (`src/env.ts` empties the set in
  production): signup is open and emails are unverified, so a listed but
  unregistered address could previously be claimed by an attacker.
  Production admins are granted a `user_roles` row via the new
  `pnpm admin:grant <email>` (`scripts/grant-admin.ts`). **Manual step for
  production: run the grant once, or admin access is absent after deploy**
  (see docs/DEPLOYMENT.md "Admin access").
- **P2 security — auth rate limiting is now DB-backed** (`rate_limit`
  table, migration 0004/`0003_rare_marten_broadcloak.sql`): in-memory
  counters were per-serverless-instance, i.e. effectively unenforced on
  Vercel. Sign-in/sign-up capped at 10/min per IP, other auth routes 30/min.
- **P2 valuation — engine v1.1** (`vantor-valuation-v1.1`, methodology
  unchanged): months computed with UTC accessors (results no longer vary by
  server timezone — a determinism bug); a revenue point below the $50k
  threshold (e.g. truthful ARR 0) falls through to the next revenue source
  instead of masking real annual revenue.
- **P2 valuation — verified-category confidence bonus** now derives from
  the latest-per-category request (same rule as every display surface);
  previously any historical `verified` row kept paying the bonus after a
  later resubmission was rejected.
- **P2 valuation — run + component inserts are transactional**; a partial
  write previously left an empty breakdown and locked the founder out for
  the cooldown window.
- **P2 data-safety — seed script refuses `NODE_ENV=production`** (second
  guard besides `ALLOW_SEED`); `.env.example` ships `ALLOW_SEED=false`.
- **Concurrency**: metrics/goals/team saves and verification submissions
  now map unique-violation races (double-click, two tabs) to friendly
  retry messages instead of 500s; `submitCompany` checks the guarded
  UPDATE's row count so a lost race can't record a false audit entry.
- **Privacy hardening**: `getLatestRequestsByCategory` strips
  `internalNotes` structurally (it feeds founder/public paths).
- **Validation**: revenue-style metrics (ARR/MRR/annual revenue/burn)
  reject negatives; values beyond `numeric(20,4)` capacity get a field
  error instead of a generic DB failure.
- **Auth UX**: `/login`/`/signup` redirect signed-in users to `/founder`;
  `BETTER_AUTH_URL` falls back to the deployment's own URL on Vercel
  (never localhost).
- **Smaller fixes**: published founder overview links to the public
  profile; founders can add evidence to pending/under-review requests (the
  server always allowed it; the form only rendered for needs_update);
  auth pages have a real `h1`; copy fix ("we'll" → "We'll"); marketplace
  `(status, published_at)` index; DB CHECK that completed valuation runs
  carry a full range.

### Infrastructure status (action required)

Vercel project `vantor-capital-markets` exists (JARP Holdings team),
production tracking `claude/vantor-platform-foundation-uw0r8u`. **Preview
deployments almost certainly share the production Railway database** —
`DATABASE_URL` appears scoped to all environments. Manual separation steps
(~15 min) are in docs/DEPLOYMENT.md "Preview vs Production databases";
also scope `BETTER_AUTH_SECRET` per environment, and note the site is
currently behind Vercel SSO (no custom domain), which must change at
launch. Consider creating `main` from the production commit — production
currently tracks a feature branch.

### Known caveat

`pnpm typecheck` on a fresh clone fails until a first `next build`/`dev`
generates `next-env.d.ts` (image-module declarations). Run build first.

---

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

## Phase 2 QA / security review results

An adversarial QA agent probed a running build with real sessions and
forged server-action replays. **No critical/high findings.** Passed:
cross-founder valuation manipulation (denied; engine inputs are DB-only),
cooldown enforcement, valuation privacy (draft 404, `showPublicValuation`
respected, no query when off), verification privacy (internalNotes/claims/
evidence never on public or founder surfaces; admin-only), self-verification
impossible (no founder path to `verified`; zod strips unknown keys; guarded
transition UPDATEs), malformed-input handling, admin gating, language audit
(no "worth"/endorsement/advice framing anywhere).

**Fixed from findings** (commit `f568ed9`): founder-segment soft-404s
(loading boundary removed → real 404s), NaN persistence guard + DB CHECKs,
percent/growth/date bounds on metrics, partial unique index for one open
verification request per category, 20-evidence cap, archived-company guards,
and public verification display no longer lists rejected/needs_update/
expired categories (they still count in the percent denominator, so hiding
them can never inflate the number).

**Accepted as-is**: valuation cooldown remains check-then-insert (worst
case: one extra run inside the window; harmless); founder verification page
doesn't yet list previously attached evidence; small presentation-helper
duplication between founder/public valuation surfaces and the triplicated
verification status-badge tone map — cleanup candidates for next touch.

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

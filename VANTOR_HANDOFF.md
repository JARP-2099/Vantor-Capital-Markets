# VANTOR — Handoff (through the Visual Overhaul phase)

Written for the next session (or engineer) with zero prior context. Read
this, then `docs/ARCHITECTURE.md`, `docs/VANTOR_UI_UX_REFERENCE_BRIEF.md`,
`docs/VALUATION_METHODOLOGY.md`, `docs/DEPLOYMENT.md`, and
`docs/DEVELOPMENT_PLAYBOOK.md`.

## Visual Overhaul phase (this session, branch `claude/vantor-ui-ux-overhaul-e3p7lz`)

A frontend/UX/brand overhaul on top of the Phase 2 codebase. Backend,
schema, auth, valuation/verification logic, and configs are untouched
except where explicitly noted below.

### Design system (the law: `docs/VANTOR_UI_UX_REFERENCE_BRIEF.md` + `docs/ARCHITECTURE.md` §Design system)

- **Color**: warm ivory neutrals (canvas `#f7f6f2`, mist, warm lines)
  replacing the cold starter-slate; navy-black ink scale (`#0a0e1a` family)
  for text and dark marketing surfaces; ONE accent — Vantor Cobalt
  (`accent-600 #1441c8` primary actions, `accent-700` links, `accent-300`
  on dark). Semantic green/red/amber reserved for meaning, never brand.
  All tokens in `src/app/globals.css` `@theme` (names kept from Phase 1
  where possible, values re-tuned; added `line-strong`, `accent-300/100`,
  motion tokens, reveal hooks).
- **Typography**: Instrument Sans (variable, `next/font`, latin subset has
  `tnum` — activated by the `tabular-nums` utility on all data) +
  Instrument Serif (400/italic) for large marketing statements only.
  Product UI never uses the serif.
- **Logo**: new V mark — two geometric wedges converging to a point (two
  sides of a market meeting), right wedge cobalt. `VMark`/`Logo` (light/
  dark variants, markOnly) in `src/components/layout/logo.tsx`;
  `src/app/icon.svg` + `apple-icon.png` + rebuilt `favicon.ico`.
- **Motion**: `Reveal` (`src/components/ui/reveal.tsx`) — IO-based scroll
  reveal exposing `data-reveal-state` so `.reveal-child` / `.reveal-bar`
  descendants stagger/grow (CSS in globals). Marketing only; product
  motion limited to 150–220ms transitions; ALL motion collapses under
  `prefers-reduced-motion` and renders visible with JS off.
- **New dependency**: `tailwind-merge` (only new package). `cn()` now
  resolves conflicting Tailwind classes — this fixed a real bug (hero CTA
  rendering white-on-white from class collision).

### Surfaces redesigned (all functionality preserved)

- **Landing** (`src/app/(public)/page.tsx` + `src/components/landing/`):
  9-section narrative — hero ("PRIVATE CAPITAL. REBUILT." / serif
  "Discover. Value. Own what's next."), opacity problem, marketplace
  preview, valuation demo, verification demo, founder workflow, ownership
  vision, final CTA — around a fictional AeroForge composition built from
  real Vantor UI elements, all figures labeled illustrative.
- **Auth**: dark brand panel (serif statement, grid, watermark) + calm
  form column; logic untouched.
- **Marketplace**: card grid → dense discovery list (column header, row
  links, aligned tabular revenue/growth with per-row metric sub-labels,
  dot-badge status, result count + filter summary, slim no-JS filter
  toolbar, matching skeletons).
- **Company profile**: research-page header (one stage badge + meta line,
  no pill stacks), cardless key-metric band, financials on shared table
  primitives, valuation range bar + midpoint marker + component weights +
  restyled sparkline, verification completeness bar + dot badges, team
  list. Disclaimers verbatim.
- **Founder**: actionable dashboard (status dots, derived next-step lines,
  resume-draft actions), header band + non-clipping tab strip, settings-
  style profile forms with scoped saves, metrics editor with trimmed
  defaults + display-format preview, valuation tab as financial research
  (range bar, breakdown, risk factors, improve checklist), verification
  as one category status list with per-category submit (query-param
  preselect — presentation only), onboarding progress that can't clip on
  mobile ("Step n of 7" + segmented bar).
- **Admin**: dark ink operator chrome with always-visible scrollable tab
  nav (mobile admin nav existed nowhere before), stat band, dense shared
  tables everywhere, quiet truncated mono ids (no raw-UUID prose), danger-
  styled destructive disclosures, verification decision panel labeling
  internal notes as never-founder-visible. Gate logic untouched.
- **Shell**: header (My Companies label, cobalt CTA), richer footer with
  readable disclosure (faint→muted), mobile nav gains Sign out.

### Small shared fixes

- `formatCompactCurrency`: killed forced trailing zero ("$580.0K"→"$580K")
  — currency style was imposing minimumFractionDigits=1.
- Root metadata/title updated to "Private Capital Markets" positioning.

### Verification results (at HEAD of this phase)

`pnpm lint` 0 problems · `pnpm typecheck` clean · `pnpm test` 76/76 (8
files) · `pnpm build` succeeds (all routes; next/font downloads fonts at
build). A final QA agent drove the real UI end-to-end (signup → onboarding
draft → valuation refresh + visibility toggle → verification submission →
admin queue/detail → marketplace search/filter/profile): 7/7 flows pass,
zero 5xx, zero horizontal overflow at 390px, reduced-motion renders
everything immediately. The dev-only "1 Issue" overlay badge (React dev
eval vs CSP) is fixed by allowing `unsafe-eval` in DEVELOPMENT only in
`next.config.ts`; the production CSP string is byte-identical to Phase 2.

### Known visual issues / follow-ups

1. Public profile section nav has no scroll-spy active state (kept no-JS).
2. Founder dashboard cards show completion/status only — surfacing ARR/
   valuation there needs new fetches (deliberately not added this phase).
3. Admin dense-table per-row buttons are 28px tall (dense trade-off).
4. Admin verification detail validated by code only until seed data
   includes verification requests.
5. Semantic positive green (`#0e6b43`) reads slightly dark on ink-800
   surfaces (hero demo uses a brightness filter — acceptable, marketing
   only).

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
- **Phase 2** (Master Prompt #2): production data-layer hardening
  (Railway/Vercel-ready), Valuation Engine V1, Verification Foundation,
  expanded seeds, 69 tests total
  (branch `claude/vantor-platform-foundation-uw0r8u`).
- **Visual Overhaul** (this session): full frontend/UX/brand redesign —
  see the section above
  (branch `claude/vantor-ui-ux-overhaul-e3p7lz`, pushed to origin).

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

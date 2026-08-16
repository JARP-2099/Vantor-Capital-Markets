# Session Handoff — Pre-Phase 3 Stabilization (start here in a new session)

This file is the briefing for a fresh Claude Code session picking up the
Vantor Capital Markets project after the Pre-Phase 3 stabilization/QA pass.
Read this first, then `VANTOR_HANDOFF.md` (full audit report) and
`docs/DEPLOYMENT.md` (operational runbook) as needed.

## Project in one paragraph

Vantor Capital Markets is a private-markets platform: founders onboard
companies, enter metrics, request verification, and receive deterministic
valuations; investors browse published companies; admins review submissions
and verification evidence. Stack: Next.js 16.3.1 App Router (breaking
changes vs. training data — read `node_modules/next/dist/docs/` before
writing Next code, per `AGENTS.md`), React 19, TypeScript strict,
Tailwind v4, Drizzle ORM + postgres-js on PostgreSQL 16, better-auth
^1.6.29. Deployed on Vercel (app) + Railway (Postgres only). Migrations
run from a dev machine, never at serverless boot.

## Current state

- **Branch:** `claude/vantor-stabilization-qa-m4kne0` — all work goes here.
  Never push to other branches; never merge to `main`; never deploy over
  Production.
- **Head commit:** `0ac20be` "Stabilization pass: security, valuation
  determinism, race handling, QA fixes" — pushed; working tree clean.
- **Validation at head:** lint clean, typecheck clean (after a build — see
  caveat below), 85/85 tests passing, production build passing.
- **Vercel Preview:** auto-deployed from the branch, READY at
  `https://vantor-capital-markets-git-claude-vantor-2ad306-jarpholdingsllc.vercel.app`
  (behind Vercel SSO). Auth on the preview will error until migration 0003
  is applied to the production DB, because Preview currently shares it.
- **Verdict from the audit:** READY FOR PHASE 3, contingent on the three
  manual provider-side steps below.

## Outstanding manual steps (Jack's, dashboard/DB access required)

1. **Apply migration 0003 to the Railway production DB.** From a local
   clone of this branch:
   ```bash
   read -s DBURL     # paste Railway DATABASE_PUBLIC_URL (no echo)
   DATABASE_URL="${DBURL}?sslmode=require" pnpm db:migrate
   unset DBURL
   ```
   Only `0003_rare_marten_broadcloak.sql` will apply (0000–0002 are already
   recorded). It is non-destructive: creates `rate_limit`, adds one index
   on `companies`, adds one CHECK on `valuation_runs`. If the URL already
   has a query string, use `&sslmode=require` instead of `?sslmode=require`.
2. **Grant production admin** (after signing up through the app):
   `DATABASE_URL="${DBURL}?sslmode=require" pnpm admin:grant <email>` —
   this is the only production admin path; `ADMIN_EMAILS` is ignored in
   production by design.
3. **Separate Preview and Production databases** — HIGH-priority infra
   risk. Exact ~15-minute steps are in `docs/DEPLOYMENT.md` under
   "Preview vs Production databases (required separation)".

## What the stabilization pass changed (summary)

Full detail in `VANTOR_HANDOFF.md`. Highlights:

- **Security:** `ADMIN_EMAILS` bootstrap disabled in production
  (`src/env.ts`); DB-backed `user_roles` + `scripts/grant-admin.ts`
  (`pnpm admin:grant`) is the production admin path. DB-backed auth rate
  limiting (`rate_limit` table, migration 0003), verified live.
  `internalNotes` stripped from founder-facing verification queries.
- **Valuation engine:** bumped to `vantor-valuation-v1.1`
  (`src/lib/valuation/engine.ts`) — UTC month math, revenue-precedence
  threshold fallback, latest-per-category verified snapshot, transactional
  run+components insert. Deterministic and versioned: any methodology
  change requires an ENGINE_VERSION bump, never an in-place edit.
- **Race handling:** unique-violation (23505) mapped to friendly retry
  messages in founder-company and verification actions; guarded UPDATE
  with `.returning()` on company submission.
- **Validation:** metric bounds (non-negative where required, |value| ≤
  1e15) in `src/lib/validation/company.ts`.
- **UX/a11y fixes:** auth pages redirect signed-in users, CardTitle `as`
  prop for proper h1s, verification evidence form matches server "open"
  statuses, published-company link on founder page.
- **Docs:** `docs/DEPLOYMENT.md` rewritten (admin access, DB separation,
  checklist); `.env.example` updated.

## Deferred work (offered, not started — wait for Jack to choose)

- Migrate timestamp columns to `timestamptz`.
- Admin view for "recently edited published companies".
- Technical-debt items are catalogued in `VANTOR_HANDOFF.md` §
  technical debt — document, don't rebuild.

## Standing constraints (do not relax)

- Visual identity is LOCKED — defect fixes only, no redesigns.
- Do not rebuild or "improve" the valuation methodology without a version
  bump; never replace it with an AI-generated valuation.
- Do not regress the better-auth trusted-origin handling for Vercel
  Preview URLs (`src/lib/auth-origins.ts` — exact origins, no wildcards).
- No Phase 3+ features (watchlists, portfolios, trading, messaging, etc.);
  regulatory boundary: Vantor is not a broker-dealer.
- Never print or commit secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
  etc.). Never destroy or migrate infrastructure automatically — give Jack
  minimal manual steps instead.
- Seeding refuses in production (`ALLOW_SEED` + NODE_ENV guard) — keep it
  that way.

## Known caveats

- **Fresh-clone typecheck fails** before a build: `logo.tsx` PNG imports
  need `next-env.d.ts`, which is gitignored and generated by `next build`.
  Run `pnpm build` (or `next dev` once) before `pnpm typecheck`.
- The `AGENTS.md` block about Next.js docs is re-added by `next dev`;
  committing it keeps the tree clean.
- Test suite needs `TEST_DATABASE_URL` pointing at a DB whose name
  contains "test" (see `.env.example`).

## Command reference

```bash
pnpm install
pnpm dev             # local dev
pnpm lint && pnpm typecheck
pnpm test            # 85 tests; needs TEST_DATABASE_URL
pnpm build           # production build (also generates next-env.d.ts)
pnpm db:generate     # new migration from schema changes
pnpm db:migrate      # apply migrations (DATABASE_URL)
pnpm admin:grant <email>
```

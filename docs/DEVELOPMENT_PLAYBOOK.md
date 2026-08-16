# Vantor Development Playbook

Working rules for anyone (human or agent) developing this repository.

## Ground rules

1. **The repository is the source of truth.** Read `VANTOR_HANDOFF.md`,
   `docs/ARCHITECTURE.md`, and the schema before changing anything.
   Prompts and plans describe intent; the code describes reality.
2. **Preserve working systems.** Do not replace the ORM, auth library,
   styling system, or folder conventions without a documented critical
   reason. Architectural swaps are lead-level decisions.
3. **Regulated-capability discipline.** Everything in
   `src/config/features.ts` that is `false` stays unbuilt: no payments,
   investing, trading, custody, tokens, or transaction execution. Flipping
   a flag is a product/legal decision, not a refactor.
4. **No fabricated data.** No fake market data, comparables, regulatory
   approvals, or real-company impersonation. Demo content is fictional and
   `isDemo`-flagged; components that lack legitimate data report
   "insufficient data" honestly.

## Security invariants (violating any of these fails review)

- Every server action and protected page loader re-derives authorization
  via `src/lib/authz.ts` (`requireUser` / `requireCompanyManager` /
  `requireAdmin`). UI visibility is never a boundary.
- Public reads go through the published-only query layers
  (`src/db/queries/*`). Never query drafts/private rows on public paths.
- All inputs are re-validated server-side with the shared Zod schemas.
- `internalNotes`, evidence, secrets, and private financials never reach
  founder/public surfaces or audit-log metadata.
- Status transitions are checked from current DB state inside guarded
  UPDATEs (`WHERE status IN (...)`), not from which buttons rendered.

## Database rules

- Schema changes ONLY via drizzle-kit migrations (`pnpm db:generate` →
  review the SQL → `pnpm db:migrate`). Never hand-edit a live schema; never
  edit an applied migration file.
- Monetary values are `numeric` columns (strings in TS) — never floats.
  Distinguish 0 from unknown (absent row) from not-applicable everywhere.
- Historical facts (metrics, valuation runs, verification requests) are
  append-only. New rows, never destructive updates.
- Valuation methodology changes require bumping `ENGINE_VERSION` and/or
  `ASSUMPTIONS_VERSION`; old runs must stay interpretable.

## Workflow

- Branch: work happens on the designated `claude/...` branch; push with
  `git push -u origin <branch>`.
- Before any commit: `pnpm lint && pnpm typecheck && pnpm test` and, for
  substantive changes, `pnpm build`. Do not claim success without running
  them. Kill test servers with `pkill -f next-server`.
- Tests run against `TEST_DATABASE_URL` (database name must contain
  "test"); the setup truncates it per run.
- Subagents get tightly bounded file scopes; shared files (schema, authz,
  query layers, the public profile page) belong to the supervisor.
- Update `VANTOR_HANDOFF.md` at the end of every working session.

## Language rules

Say "estimated valuation", "private companies", "company profile",
"raise". Avoid "stock price", "trading", "exchange", "guaranteed",
"recommended", "SEC approved", or anything implying Vantor is a regulated
marketplace or that an estimate is investment advice.

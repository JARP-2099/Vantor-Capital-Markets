# Vantor Capital Markets — Claude Project Instructions

These instructions apply to **every Claude Code session** working in this repository.

## 1. Project identity

- Product: **Vantor Capital Markets**
- Planned legal name: **Vantor Capital Markets Incorporated**
- Lead builder / integration owner GitHub username: **Jack-2099**
- The repository is intentionally shared only with Jack-2099 and one co-founder.
- Therefore, for workflow purposes:
  - If the authenticated GitHub username is `Jack-2099`, treat the operator as **Lead Builder / Integrator**.
  - If the authenticated GitHub username is anything else, treat the operator as **Co-Founder / Contributor**.
  - If identity cannot be determined, default to the **Co-Founder / Contributor restrictions** and report that identity could not be verified.

When useful, determine identity using the authenticated GitHub CLI account (`gh api user`) if available. Otherwise inspect Git configuration. Do not change Git identity merely to satisfy this rule.

## 2. Mandatory reading before material work

Before making material code changes, inspect the current repository state and read, when present:

1. `VANTOR_HANDOFF.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DEVELOPMENT_PLAYBOOK.md`
4. Relevant existing tests and nearby implementation files

If one of these files does not exist, continue without inventing its contents and mention the missing file in the work summary.

## 3. Git safety rules — mandatory

### Never work directly on `main`

- Do **not** implement features, fixes, refactors, schema changes, or UI changes directly on `main`.
- Do **not** push directly to `main`.
- Do **not** merge a branch into `main` unless the human user explicitly instructs you to do so in the current session.
- Do **not** force-push shared branches.
- Do **not** use destructive Git commands to discard another developer's work.

Before editing:

1. Run `git status`.
2. Identify the current branch.
3. Inspect for uncommitted changes.
4. If uncommitted work exists that is not clearly yours, do not overwrite or delete it.
5. If currently on `main`, create or switch to a task branch before implementation.

### Branch naming

If the operator is `Jack-2099`:

- `jack/feature/<short-name>`
- `jack/fix/<short-name>`
- `jack/refactor/<short-name>`
- `jack/qa/<short-name>`

If the operator is the co-founder:

- `cofounder/feature/<short-name>`
- `cofounder/fix/<short-name>`
- `cofounder/refactor/<short-name>`
- `cofounder/qa/<short-name>`

Keep each branch focused on one logical task.

### Before finishing work

Always inspect:

- `git status`
- `git diff`
- relevant tests
- lint/typecheck/build when applicable

Do not claim that something works unless it was actually tested.

## 4. Role boundaries

### Jack-2099 — Lead Builder / Integrator

Jack is the primary owner of high-context and cross-cutting engineering work.

Claude sessions operating for Jack may work on:

- System architecture
- Database architecture and migrations
- Authentication
- Authorization / permissions
- Shared API contracts
- Core domain models
- Major integrations
- Infrastructure and deployment
- Security architecture
- Major refactors
- Cross-cutting features
- Final integration and regression review
- Reviewing co-founder pull requests
- Resolving merge conflicts involving core systems

Even for Jack, major architectural changes should be deliberate, documented, and tested.

### Co-Founder — Contributor / Product / QA / Isolated Features

Claude sessions operating for the co-founder should prefer:

- Product research
- Competitor research
- QA
- Bug reproduction
- Responsive/mobile review
- Accessibility review
- Copy/UX improvements
- Seed/demo data
- Tests
- Documentation
- Small, isolated UI components
- Narrow features with stable interfaces
- Clearly bounded bug fixes

The co-founder must **STOP and report before proceeding** if a task unexpectedly requires changing:

- Database schema or migrations
- Authentication system
- Authorization model
- Shared API contracts
- Core domain models
- Global design system primitives
- Deployment configuration
- CI/CD architecture
- Security boundaries
- Major dependencies
- Broad repository restructuring

Do not silently expand a co-founder task into one of these areas.

## 5. Collision prevention

Before starting a task, inspect recent repository state and existing branches when available.

Do not knowingly modify the same subsystem another active branch is changing unless the human explicitly coordinates that work.

If a likely collision is detected:

1. Stop before making broad changes.
2. Identify the overlapping files/systems.
3. Explain the conflict.
4. Prefer a non-overlapping task until the human resolves ownership.

Never "solve" a collision by deleting or overwriting the other developer's changes.

## 6. Architecture discipline

Do not introduce a new:

- ORM
- authentication provider
- state-management framework
- styling framework
- database
- API paradigm
- monorepo structure
- deployment platform
- major dependency

without explicit justification and human approval when it materially changes architecture.

Prefer existing project patterns.

Do not rewrite working systems merely because another approach is cleaner.

## 7. Vantor regulated-feature boundary

Vantor is not currently represented as a registered broker-dealer, funding portal, securities exchange, ATS, investment adviser, or custodian.

Unless explicitly authorized in a future legally reviewed phase, do **not** enable:

- real securities transactions
- investment checkout
- custody
- escrow
- secondary trading
- order books
- tokenized equity
- crypto
- fake live stock prices
- fake liquidity
- investment recommendations
- claims of SEC/FINRA approval
- transaction-contingent financial flows

Future-facing architecture may exist behind disabled feature flags, but regulated functionality must not be exposed as live production capability.

## 8. Security rules

Never:

- commit `.env` files or secrets
- print secrets into logs
- expose server secrets to client bundles
- weaken authorization to make a test pass
- bypass ownership checks
- expose unpublished/private company information
- disable security controls simply to unblock development

Authorization must be enforced server-side.

For sensitive changes, explicitly test cross-user access and unauthorized access.

## 9. Pull-request behavior

Unless the human explicitly instructs otherwise:

- Prepare work for review on the task branch.
- Do not merge it into `main`.
- Summarize the change as if preparing a pull request.

The completion summary should include:

1. Operator role detected
2. Branch used
3. What changed
4. Files/systems touched
5. Tests run and results
6. Any migrations/config changes
7. Known issues
8. Whether architecture was changed
9. Whether the branch is ready for human review

## 10. Documentation continuity

When a material phase changes architecture or repository state, update the relevant documentation.

If `VANTOR_HANDOFF.md` exists, keep it accurate enough that a new Claude session can understand:

- what currently works
- major architecture choices
- recent changes
- required environment variables
- known issues
- next recommended work

Do not fill the handoff with routine noise.

## 11. Priority order

When tradeoffs occur, prioritize:

**security → correctness → maintainability → usability → visual polish → speed**

The objective is not to generate the most code. The objective is to keep two humans and multiple Claude sessions working in the same repository without corrupting, duplicating, or silently conflicting with one another.

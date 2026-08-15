# Vantor Capital Markets — Two-Founder Development Playbook

This document defines how the two founders should divide work while sharing one repository and using separate Claude plans.

## Core operating model

### Jack-2099
**Role:** Lead Builder / Integration Owner  
**Claude capacity:** Primary high-context build capacity

Jack should use his higher Claude capacity for work that benefits from large repository context, architecture reasoning, multi-agent coordination, and cross-cutting changes.

Primary responsibilities:

- [ ] Own overall technical architecture
- [ ] Own database/schema decisions
- [ ] Own authentication and authorization
- [ ] Own shared API contracts and core domain models
- [ ] Own security architecture
- [ ] Own infrastructure/deployment changes
- [ ] Run major feature master prompts
- [ ] Run large refactors
- [ ] Integrate major systems
- [ ] Review co-founder PRs that touch shared systems
- [ ] Resolve cross-branch integration problems
- [ ] Perform final regression review before important releases
- [ ] Keep architecture and handoff documentation current

### Co-Founder
**Role:** Product / QA / Contributor  
**Claude capacity:** Best used for narrow, isolated, low-context work

Primary responsibilities:

- [ ] Product research
- [ ] Competitor research
- [ ] User-flow review
- [ ] QA and bug reproduction
- [ ] Mobile/responsive testing
- [ ] Accessibility review
- [ ] Copy and UX improvements
- [ ] Demo/seed company data
- [ ] Documentation
- [ ] Test coverage
- [ ] Isolated UI components
- [ ] Small features with stable APIs
- [ ] Narrow bug fixes
- [ ] Clearly scoped research for upcoming major features

The co-founder should not independently redesign core architecture.

---

# Mandatory Git workflow

## Before every task

- [ ] Pull/fetch current repository state
- [ ] Run `git status`
- [ ] Confirm there is no unrelated uncommitted work
- [ ] Confirm the current branch
- [ ] Read `CLAUDE.md`
- [ ] Read relevant handoff/architecture docs
- [ ] Create a dedicated task branch

## Branch convention

Jack:

- `jack/feature/<name>`
- `jack/fix/<name>`
- `jack/refactor/<name>`
- `jack/qa/<name>`

Co-founder:

- `cofounder/feature/<name>`
- `cofounder/fix/<name>`
- `cofounder/refactor/<name>`
- `cofounder/qa/<name>`

## Never

- [ ] Never perform feature work directly on `main`
- [ ] Never push directly to `main`
- [ ] Never force-push a shared branch
- [ ] Never delete another person's uncommitted changes
- [ ] Never merge your own work into `main` unless the human workflow explicitly calls for it
- [ ] Never start a broad refactor simply because Claude recommends one
- [ ] Never quietly expand a narrow task into shared architecture

---

# High-risk systems

The following systems default to Jack ownership unless explicitly assigned otherwise:

- [ ] Database schema and migrations
- [ ] Authentication
- [ ] Authorization
- [ ] Core domain models
- [ ] Shared API contracts
- [ ] Global security controls
- [ ] Deployment configuration
- [ ] CI/CD architecture
- [ ] Repository-wide dependency changes
- [ ] Global design-system primitives
- [ ] Major routing changes
- [ ] Regulated financial functionality
- [ ] Production environment configuration

If the co-founder discovers that a task requires one of these, stop and create a clear handoff rather than modifying it unexpectedly.

---

# Best use of Claude capacity

## Jack's higher-capacity sessions

Use for:

- [ ] Repository-wide audits
- [ ] Architecture
- [ ] Major feature implementation
- [ ] Multi-agent builds
- [ ] Valuation engine
- [ ] Verification architecture
- [ ] Investor/ownership systems
- [ ] Acquisition architecture
- [ ] Security reviews
- [ ] Complex debugging
- [ ] Cross-cutting performance work
- [ ] Integration
- [ ] Final code review

## Co-founder's Pro sessions

Use for:

- [ ] One component at a time
- [ ] One page at a time
- [ ] One bug at a time
- [ ] QA reports
- [ ] Tests
- [ ] Copy
- [ ] Responsive fixes
- [ ] Accessibility
- [ ] Documentation
- [ ] Demo content
- [ ] Narrow research

Avoid wasting the co-founder's context window on "audit the entire repository and build X."

---

# Task handoff template

Every asynchronous task should answer:

## Task
What exactly needs to be done?

## Owner
Jack or Co-Founder

## Allowed scope
Which files/systems may be changed?

## Do not touch
Which systems are explicitly out of scope?

## Acceptance criteria
What must be true for the task to be complete?

## Testing
What commands/manual checks must be performed?

## Branch
What branch should contain the work?

## Handoff
What should the other founder know after completion?

---

# Pull request checklist

Before a branch is considered review-ready:

- [ ] Scope stayed within the assigned task
- [ ] `git diff` was reviewed
- [ ] No secrets were added
- [ ] No unrelated formatting churn
- [ ] No unexplained major dependency added
- [ ] Lint run when applicable
- [ ] Typecheck run when applicable
- [ ] Relevant tests run
- [ ] Production build run for material application changes
- [ ] Mobile checked for UI work
- [ ] Error/loading/empty states checked when relevant
- [ ] Authorization checked for protected resources
- [ ] Known limitations documented
- [ ] Architecture changes clearly called out
- [ ] Human review requested instead of silently merging

---

# Collision protocol

If both people appear to be changing the same subsystem:

1. Stop broad edits.
2. Identify the overlapping files and branches.
3. Do not overwrite either implementation.
4. One person becomes the owner of that subsystem for the current task.
5. The other person switches to a non-overlapping task.
6. Merge/integrate the first branch.
7. Rebase/update the second task before continuing if needed.

When communication is delayed, preserving work is more important than finishing immediately.

---

# Current division during major master-prompt builds

When Jack is running a major Claude build such as a master prompt:

## Jack
- [ ] Let the major build own its assigned architecture/systems
- [ ] Review agent output
- [ ] Run integration tests
- [ ] Resolve architecture decisions
- [ ] Produce/update handoff documentation

## Co-Founder
During that period, prefer non-conflicting work:

- [ ] Competitor analysis
- [ ] QA planning
- [ ] Demo startup data
- [ ] UX notes
- [ ] Product requirements
- [ ] Copy
- [ ] Test-case design
- [ ] Research for the next phase

Do not build against unstable core interfaces while a master build is actively changing them unless the task is specifically coordinated.

---

# Definition of done

A task is not done because Claude says "implemented."

It is done when:

- the requested behavior exists
- the branch is clean enough to review
- applicable tests pass
- architecture boundaries were respected
- no unrelated work was overwritten
- the other founder can understand what changed
- the work can safely move through a pull request

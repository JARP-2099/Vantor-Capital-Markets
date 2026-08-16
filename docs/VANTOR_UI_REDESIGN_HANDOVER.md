# VANTOR — UI Redesign Handover (for the next Claude session)

**Date:** 2026-08-16 · **Branch:** `claude/vantor-ui-ux-overhaul-e3p7lz` (pushed, tree clean)
**Read this first.** You are inheriting a UI redesign effort in which **three consecutive
art directions have been rejected by the operator**. Your job is the next redesign. This
file tells you what the product is, what is locked, what was rejected and why, where
everything lives, and how to work in this environment without rediscovering it all.

---

## 1. The single most important fact

The operator has rejected every visual direction so far — the last one "extremely."
**Do not start building a full redesign from your own taste.** Before writing code,
get explicit art direction from the operator (references, screenshots, sites they like),
and strongly consider showing a small sample (one hero, one marketplace row treatment)
for approval before propagating anything. Screenshot-driven iteration is cheap here
(tooling in §8); rejected full rebuilds are not.

### Rejected direction history (do not revive any of these)

| Version | Direction | What it looked like | Why rejected |
|---|---|---|---|
| **V1** | Editorial / premium print | Warm ivory backgrounds, Instrument Serif display type, italic accents, narrow editorial columns, generous whitespace | "Looks like an AI-generated fintech template"; serif/editorial felt wrong for the product |
| **V2** | Dark venture-fintech | Near-black `#020617` marketing chrome, glowing cobalt radial hero + engineering grid bg, huge extrabold Plus Jakarta headlines ("Private markets, finally legible."), pill eyebrow labels, floating financial demo cards, dark sidebar app shell | "Dark OLED / crypto-like", chunky headlines, repetitive 50/50 sections, template-y |
| **V3** (current code) | Light Republic × AngelList | White/neutral surfaces, Inter + IBM Plex Mono micro-labels, hairline tables, rationed cobalt `#1E4FE0`, dark navy reserved for footer + valuation modules, opportunity-row marketplace, research-profile company page | Operator: "i hate this design extremely" — no specific critique given; treat every V3 aesthetic choice as unendorsed |

Aggregate "never again" list from the three briefs: warm ivory, serif/italic display,
editorial layouts, dark/OLED page chrome, glowing grid backgrounds, crypto aesthetic,
pill eyebrows, bright blue square monograms, giant floating cards, repetitive 50/50
text/card sections, oversized rounded boxes (16–24px radii everywhere), fake stock
pricing/candlesticks, decorative charts, Robinhood-green branding, shadcn-default look.

---

## 2. What Vantor is (product truth — this never changes)

A private-company marketplace: founders publish **standardized profiles** (story,
dated financial metrics, team), an explainable engine produces an **Estimated Private
Market Valuation** (range + confidence + per-model breakdown + history), and reviewers
run **evidence-based Data Verification** by category. Investors browse/filter companies
(`/companies`), read research-style profiles (`/companies/[slug]`). There is a founder
dashboard + 7-step onboarding wizard, and a dense admin (review queues, registry,
verifications). **Vantor does not execute regulated transactions** — no investing flows
exist and none may be fabricated.

### Non-negotiable rails (survived all three redesigns; enforce in any new one)
- Language: "Estimated Private Market Valuation", "Data Verification" — never ticker/
  trading/price/endorsement framing. Estimates are ranges, never fake-precise numbers.
- Unknown ≠ zero: missing values render as "—", never 0.
- Fictional demo data must be labeled "Illustrative" and must NOT reuse the names of
  seeded DB companies (see `src/components/landing/illustrative.ts` — names were
  deliberately de-collided in V3 after a QA catch; keep that property).
- `internalNotes` are admin-only. Founder-supplied references render as plain text,
  never hyperlinks.
- Accessibility: visible focus, 44px touch targets, contrast, `prefers-reduced-motion`
  collapses all motion to final state (already wired in `globals.css` + `Reveal`).
- Broker-dealer disclaimer stays in footer/auth (`site-footer.tsx`, auth layout).

### Backend is LOCKED (per operator, all three prompts)
Do not touch unless fixing a genuine bug: DB schema, migrations, auth architecture,
permissions/authz, valuation engine, verification engine, Railway, Vercel config,
feature flags, core domain logic. Frontend-only redesign.
One allowed pattern: **read-only additions to `src/db/queries/*`** (V3 added
`getLatestCompletedValuationRuns` for marketplace valuation columns — batched,
visibility-gated by `showPublicValuation` + `features.valuationsEnabled`).

### Functionality that must survive (regression-test after redesigning)
signup / signin · founder company creation + 7-step onboarding drafts + submission ·
admin review (approve/reject/verifications) · marketplace filters/pagination (plain GET
form, works without JS) · public profiles (unpublished slugs 404) · valuation display ·
verification display · role-based nav/permissions.

---

## 3. Current state of the code (V3 Gate 1)

V3 was **gated**: only the design system + public surfaces were rebuilt. So the repo is
currently a hybrid:

- **V3 (light, Inter):** landing (`src/app/(public)/page.tsx` + `src/components/landing/*`),
  Discover (`(public)/companies/page.tsx` + `src/components/marketplace/*`), company
  profile (`(public)/companies/[slug]/page.tsx`), public header/footer/mobile-nav, auth
  chrome partially (slim dark header), all shared primitives.
- **V2 (dark sidebar shell) still live on:** founder dashboard/onboarding
  (`src/app/founder/**`, `src/components/founder/**`), admin (`src/app/admin/**`,
  `src/components/admin/**`), app sidebar (`src/components/layout/app-sidebar.tsx`),
  auth forms. They work; they inherit V3 tokens by name but keep V2 structure.

A new redesign therefore has to either re-theme via tokens + rebuild surfaces again, or
start from these files. **Token names are stable across V1→V3** (`ink-*`, `night-*`,
`paper/canvas/mist/line`, `accent-*`, `positive/negative/warn-*`) — keeping the names
and changing values re-skins the whole app including untouched V2 surfaces; that trick
has worked three times.

### File map (the redesign surface)
- `src/app/globals.css` — ALL design tokens (Tailwind v4 `@theme`), keyframes, reveal
  hooks, reduced-motion. The operator has repeatedly authorized full token resets.
- `src/app/layout.tsx` — fonts via `next/font/google` (currently Inter `--font-inter`
  + IBM Plex Mono `--font-plex-mono`; swap here).
- `src/components/ui/` — primitives: button, badge, input, field, card, table,
  metric-stat, alert, empty-state, spinner, section-heading, **charts.tsx**
  (dependency-free SVG: `RangeBar` bullet, `ConfidenceBand`, `SegmentedBar`,
  `TrendLine`; all take `surface="light"|"dark"`), **reveal.tsx** (IntersectionObserver
  scroll reveal; CSS hooks `.reveal-child/.reveal-bar/.reveal-draw` in globals).
- `src/components/layout/` — logo (text wordmark, see §4), site-header, site-footer,
  mobile-nav, container (`wide` → max-w-screen-2xl), app-sidebar (V2, founder+admin).
- `src/components/landing/` — illustrative.ts (fictional companies), product-frame.tsx
  (hero app mockup), featured-companies.tsx.
- `src/components/marketplace/` — company-card (list rows + `ROW_GRID` shared with
  skeletons), company-mark (logo placeholder), filter-bar (GET form, no JS), pagination,
  valuation-section, verification-section, metrics.ts (metric pickers), intent-badges.
- `src/lib/format.ts` — `formatCompactCurrency` (K/M), `formatDate`, `formatDateTime`,
  `formatMetricValue`. `src/lib/cn.ts` — tailwind-merge. `src/lib/constants.ts` —
  stages, metrics, intent labels (`PUBLIC_INTENT_BADGES` = the only public statuses).
- Docs: `docs/VANTOR_UI_UX_DIRECTION_V3.md` (**now stamped REJECTED**),
  `docs/UI_REDESIGN_V2_DECISIONS.md` (superseded), `docs/VANTOR_UI_UX_REFERENCE_BRIEF.md`
  (V1, superseded), `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_PLAYBOOK.md`,
  `VANTOR_HANDOFF.md` (project-wide handoff).

### Stack
Next.js 16.3 App Router · React 19.2 · TypeScript strict · **Tailwind v4** (`@theme`
tokens in CSS, no tailwind.config) · Drizzle + Postgres 16 · better-auth · Zod v4 ·
Vitest (76 tests). Only UI dependency added across all redesigns: `tailwind-merge`.
Note the repo's AGENTS.md warning: this Next.js version has breaking changes — read
`node_modules/next/dist/docs/` before assuming training-data APIs.

---

## 4. Standing constraints from the operator (all prompts)

- **LOGO IS OUT OF SCOPE.** Text wordmark "VANTOR" (optional "CAPITAL MARKETS"
  sub-line) only — `src/components/layout/logo.tsx` is a fixed-height lockup a future
  supplied asset drops into. No V icons, no monogram logos, no logo concepts.
- Work on branch `claude/vantor-ui-ux-overhaul-e3p7lz` unless told otherwise; never
  push elsewhere; no PRs unless explicitly requested.
- No serif, no italic display type (rejected twice). Tabular numerals on all financial
  figures — verify `tnum` in the actual Google-served latin subset with fontTools
  before locking a font (IBM Plex Sans FAILS this check; Inter, Plus Jakarta Sans,
  Manrope, Geist all pass).
- Meaningful charts only, each answering a real question; no candlesticks/fake market
  styling. The chart primitives in `charts.tsx` are reusable under any skin.
- Mobile 390px must be overflow-free; test 390/768/1440/1920. 1920 must not look like
  a tiny site floating in space.
- Do not begin the Investor Experience (Prompt #3) work.
- The operator prefers **visual gates**: build a small representative slice → deploy
  preview → STOP for approval. The V3 prompt formalized this; assume it still applies.

---

## 5. Design research tooling (installed and expected to be used)

`ui-ux-pro-max` v2.13.0 skill is installed at `~/.claude/skills/ui-ux-pro-max/`:
```bash
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <product|style|color|typography|google-fonts|chart|ux|landing|gsap|icons> [-n N]
python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system [--density N --motion N --variance N]
```
Known-empty queries (recorded honestly in past sessions): "capital markets",
"private markets", "venture investing", "wealth platform". The DB's recurring
recommendation for fintech is OLED-dark — which the operator has rejected; treat DB
output as input, not authority. Past research archives live in the session scratchpads
(gone after container reclaim) but the accepted/rejected results are recorded in
`docs/UI_REDESIGN_V2_DECISIONS.md` §1 and `docs/VANTOR_UI_UX_DIRECTION_V3.md` §2.

---

## 6. Environment & operations cheat-sheet

- **Local dev:** `service postgresql start` then `pnpm dev` (port 3000). Seeded demo
  accounts: `founder@vantor.dev` / `vantor-founder-dev-1`, `admin@vantor.dev` /
  `vantor-admin-dev-1`. Seeded public companies: aeroforge, atlas-robotics,
  foundry-metrics, harbor-ledger, helios-grid, meridian-health-ai, northstar-energy,
  quarry-analytics, verdant-materials (AeroForge has valuation history; good profile
  screenshot target).
- **Gates:** `pnpm lint` · `pnpm exec tsc --noEmit` · `pnpm vitest run` (76 tests;
  needs Postgres running) · `pnpm build` (kill `next dev` first — shared `.next`;
  `pkill -f "next dev"` exits 144, that's fine).
- **Vercel:** project `prj_V9C9S5jKpjb8uP4HEi2ZxElDfrh9`, team
  `team_Jgk5YrdxlbqbSJK7l7vhRVFC`. Pushing the branch auto-builds a Preview
  (~30–60s). The container's proxy 403s direct requests to `*.vercel.app` — use the
  Vercel MCP tools (`get_deployment`, `web_fetch_vercel_url`,
  `get_access_to_vercel_url` for share links; previews sit behind Vercel
  Authentication). Env vars for Preview are already configured; deployments reach
  READY. **The operator requires a READY Preview + rendered inspection before
  reporting completion — `pnpm build` alone is not done.**
- **Screenshots (Playwright, pre-installed in scratchpad pattern):** launch Chromium at
  `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` with
  `--no-sandbox`. Two hard-won tricks: (1) create contexts with
  `reducedMotion: 'reduce'` so IntersectionObserver reveals render final-state in
  full-page captures (synthetic scrolling is flaky); (2) remove the dev overlay badge
  before capture: `page.evaluate(() => document.querySelector('nextjs-portal')?.remove())`.
  Check overflow via `scrollWidth - clientWidth` per page.
- **Visual QA pattern that worked:** a dedicated subagent reads the PNGs and scores
  1–10 on axes (marketplace UX, sophistication, financial credibility, clarity,
  density, originality, mobile, template-avoidance) with a concrete fix list; iterate
  until the bar is met. It caught real bugs (fictional/seeded data name collisions,
  truncations, empty-space problems).
- A stop-hook nags to commit+push uncommitted work — commit only green states.

---

## 7. Suggested opening moves for the next session

1. Ask the operator for concrete visual references BEFORE building (specific sites,
   screenshots, or an attached brief). Three tasteful-by-generic-standards designs
   have failed; the missing input is the operator's actual taste, not more research.
   (Also: a `VANTOR_UI_UX_DIRECTION_HANDOFF_20260816.md` was referenced in the V3
   prompt but never delivered — ask if a design handoff attachment exists.)
2. Propose 2–3 sharply different art directions as cheap static mock screenshots of
   ONE surface (the Discover page or landing hero) and get a pick before propagating.
3. Reuse the machinery: token rename-stable reset in `globals.css`, font swap in
   `layout.tsx`, chart primitives, screenshot + QA-agent loop, Vercel share links.
4. When a direction is approved, write the new direction doc, stamp this one and the
   V3 doc as historical, and keep the gate discipline.

Good luck. Everything above was true and verified as of the handover commit.

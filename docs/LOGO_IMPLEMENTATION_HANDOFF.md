# VANTOR — Logo Implementation Handoff

Written for the next session, which will implement the final Vantor logo and
brand marks. Read this first, then `VANTOR_HANDOFF.md` (platform context) and
`src/app/globals.css` (the token system you will be editing).

## Where the design system stands (do not restart it)

The approved direction is the V5 dark private-markets system plus a
refinement pass, both on branch `claude/vantor-dark-ui-direction-svp4k2`:

- `4c0940a` — Gate 1: dark token system, navigation, landing page,
  Discover marketplace table, company profile research screen.
- `7be6e8f` — Refinement: champagne metal accent (~90% neutral interface),
  Familjen Grotesk, no section eyebrows, sentence-case labels, full copy
  audit (zero user-facing em dashes, no AI marketing language).

Preview (Ready, reviewed):
`https://vantor-capital-markets-git-claude-vantor-4f1b5b-jarpholdingsllc.vercel.app`

The owner approved the dark direction and asked for logo work as a separate,
following task. Everything below exists so the logo drops in without a
redesign.

## The contract the system was built around

1. **Brand color is centralized.** Components never hardcode the accent;
   they consume semantic tokens in `src/app/globals.css`:
   - `--color-brand: #b7a174` (champagne metal)
   - `--color-brand-soft: #d6c39a`
   - `--color-brand-deep: #746a54`
   - `--color-brand-tint: #1b1811` (dark tinted surface)
   - Legacy aliases `--color-accent-700/600/500/50` map onto the same
     values and drive older `accent-*` utility usage. Change these together.
   If the final identity brings a different brand color, editing those
   values is the entire recolor. Nothing else should need touching.
2. **Accent discipline.** The metal appears ONLY on valuation ranges, the
   gilded range bars (`.gilded-range` in globals.css), the valuation history
   line, and small selection details (focus rings, selected list border,
   checked options). Do not let a new brand color leak back into links,
   chips, buttons, or chrome. Primary CTAs stay off-white with dark text.
3. **Typeface** is Familjen Grotesk, self-hosted via `next/font/google` in
   `src/app/layout.tsx` (CSS var `--font-vantor`). Chosen for uniform digit
   widths with a normal-width decimal (measured; Satoshi/General Sans were
   unavailable because Fontshare is blocked by the environment network
   policy, and Schibsted Grotesk renders broken-looking tabular decimals).
   The wordmark currently just uses this face.

## Every place the temporary identity lives today

Replace or extend these when the real marks arrive:

| Surface | File | Current state |
| --- | --- | --- |
| Wordmark component | `src/components/layout/logo.tsx` | Text "VANTOR" (bold, tracking 0.22em) + optional "Capital Markets" label (`withLabel`) |
| Public header | `src/components/layout/site-header.tsx` | `<Logo withLabel />` in a 64px-tall header; space reserved for a real mark |
| Footer | `src/components/layout/site-footer.tsx` | Inline wordmark markup (not the Logo component) + "CAPITAL MARKETS" |
| Admin header | `src/app/admin/layout.tsx` | `<Logo href="/admin" />` + "Admin" tag |
| Auth screens | `src/app/(auth)/layout.tsx` | `<Logo />` centered above the form |
| Hero product mock | `src/components/marketing/hero-preview.tsx` | "VANTOR" text in the window chrome strip |
| Favicon | `src/app/favicon.ico` | Scaffold default. Replace; consider adding `icon.svg` / `apple-icon.png` per Next.js metadata file conventions (`node_modules/next/dist/docs/`, app router metadata section) |
| Metadata titles | `src/app/layout.tsx` | "Vantor Capital Markets" / template "%s · VANTOR" |

There are no other logo/icon instances: no OG images exist yet, no colored
initial avatars anywhere (deliberate; do not add any), and demo companies
render with no fake logos.

## Owner's standing constraints for the logo (from their briefs)

- Deliverables they described earlier: primary VANTOR wordmark, a simple
  standalone V mark, favicon/app icon, light and dark variants.
- Concept space they suggested: converging market sides, capital moving
  toward opportunity, equity blocks, two geometric planes forming a V.
- Explicitly banned: dollar signs, candlesticks, up-only arrows, coins,
  shields, rockets, brains, sparkles, globes, chain links, crypto marks,
  a letter in a circle. It should still make sense if Vantor becomes a
  large financial institution.
- The interface must stay ~90% neutral; the logo must not force color
  into the chrome. Champagne metal values above are the current brand and
  may change with the final identity.
- Copy rules remain in force everywhere the logo work touches text: no em
  dashes in user-facing copy (ranges use "to"), no AI marketing phrases
  ("unlock", "seamless", "reimagined", "not X but Y", etc.), sentence-case
  labels, no uppercase-tracked eyebrows. An automated check ran clean at
  `7be6e8f`; keep it clean.

## Environment cheat sheet (fresh container each session)

- `pnpm install`, then Postgres: `service postgresql start` (cluster 16 is
  installed but down on boot). First time: create role/dbs
  (`vantor`/`vantor_dev_password`, dbs `vantor_dev` + `vantor_test`), write
  `.env` from `.env.example` (dev values are fine; set `ALLOW_SEED=true`),
  then `pnpm db:migrate && pnpm db:seed`. Postgres can stop mid-session; if
  every test file suddenly fails at setup, start it again.
- Checks: `pnpm lint` · `pnpm typecheck` · `pnpm test` (76 passing at
  handoff) · `pnpm build`.
- Visual QA: Chromium is at `/opt/pw-browsers/chromium`; install
  `playwright-core` in the scratchpad (repo has no Playwright dep) and
  screenshot `/`, `/companies`, `/companies/harbor-ledger`, `/login` at
  1920/1440/390 against `pnpm start`. Also assert
  `document.documentElement.scrollWidth <= clientWidth`.
- Network: outbound goes through a proxy. Google Fonts works; Fontshare
  (api/cdn.fontshare.com) is blocked. Fetching remote logo assets may fail
  the same way; prefer files committed to the repo or inline SVG.
- Deploys: pushing the branch auto-builds a Vercel preview (project
  `vantor-capital-markets`, team JARP Holdings LLC). Confirm READY via the
  Vercel MCP tools before reporting done.
- GitHub access is via MCP tools only (no `gh` CLI). Do not create a PR
  unless asked.

## Definition of done for the logo task (suggested)

1. Marks implemented as inline SVG or committed assets (light + dark
   variants), wired through `Logo` so every surface updates together.
2. Favicon + app icons replaced; browser tab checked on dark UI.
3. If the brand color changes: the four `--color-brand-*` values and four
   `--color-accent-*` aliases updated in one place, then verify accent
   discipline (valuation surfaces + selection details only) at
   1920/1440/390.
4. lint / typecheck / tests / build green, preview READY, screenshots for
   the owner, then stop for review.

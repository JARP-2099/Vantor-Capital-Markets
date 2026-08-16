# VANTOR — Pre-Phase-3 Stabilization & Product QA Handoff

Written for a session with zero prior context whose job is **debugging,
stabilization, and product QA** before Phase 3 begins. Read this first,
then `VANTOR_HANDOFF.md` (Phase 1–2 record; predates the UI/brand work),
then `docs/ARCHITECTURE.md`. Do NOT start Phase 3 features — this session
hardens what exists.

## Where the repo stands

Everything is merged into the default branch
`claude/vantor-platform-foundation-uw0r8u` (production). Merge commit
`32b2f9c` (PR #1) contains, in order:

1. **Phase 1–2 platform** — marketplace, standardized profiles, 7-step
   founder onboarding, founder dashboard, admin review, Valuation Engine
   V1, Verification Foundation, 76 tests. See `VANTOR_HANDOFF.md`.
2. **Dark UI direction** (approved) — near-black surface ladder, champagne
   metal accent used ONLY on valuation surfaces + selection details,
   Familjen Grotesk everywhere. Tokens and usage rules are documented at
   the top of `src/app/globals.css`. Legacy token names (paper/canvas/
   mist/line/ink/accent) alias onto the dark palette.
3. **Brand integration** (this session) — the real Vantor logo assets,
   integrated and live in production. Details below, because QA will
   touch them.

Production on Vercel (project `vantor-capital-markets`, team JARP
Holdings LLC) deploys from the default branch; deployment `READY` was
confirmed for `32b2f9c`. Vercel access is via the Vercel MCP tools
(list_teams → list_projects → list_deployments). GitHub access is via
the GitHub MCP tools only — there is no `gh` CLI. Do not create a PR
unless the owner asks.

## Brand implementation (know this before touching chrome)

- **Source of truth**: `public/brand/vantor-mark.png` (1254×1254) and
  `public/brand/vantor-banner.png` (2172×724), supplied by the owner,
  used byte-for-byte. They are white artwork on **opaque pure-black**
  rasters. Never redraw, trace, or substitute them; resize
  proportionally only.
- `src/components/layout/logo.tsx` renders them with two techniques:
  `mix-blend-mode: screen` (composites the black ground onto the dark
  surfaces — this is why there is no black rectangle behind the logo)
  and measured content-bounds cropping (constants in the file map layout
  sizes to the *visible* artwork, not the file margins). If the bounds
  constants look magic, they were measured pixel-exact from the files.
- **Consequence of screen blending**: the logo effectively cannot sit on
  a light background (white-on-light disappears). Every current surface
  is dark, so this is fine — but flag it if any light surface is ever
  introduced.
- Surfaces: header/mobile/footer/auth = mark + banner lockup; admin bar =
  mark only; hero product mock uses plain text "VANTOR" deliberately
  (it is an illustration, not a brand surface).
- Icons: `src/app/favicon.ico` (16/32/48), `icon.png` (512),
  `apple-icon.png` (180) are proportional downscales of the mark;
  `opengraph-image.png` is the banner centered on a 1200×630 black
  canvas. All generated from the originals — regenerate the same way if
  assets ever change (sharp: plain `.resize()`, no cropping).

## Environment cheat sheet (this exact setup worked)

```
pnpm install
service postgresql start          # WARNING: postgres dies mid-session
                                  # sometimes; ECONNREFUSED 5432 in tests
                                  # means restart it, not a code bug
sudo -u postgres psql -c "CREATE ROLE vantor LOGIN PASSWORD 'vantor_dev_password'"
sudo -u postgres createdb -O vantor vantor_dev
sudo -u postgres createdb -O vantor vantor_test
cp .env.example .env              # then: set BETTER_AUTH_SECRET (openssl
                                  # rand -base64 32), append ALLOW_SEED=true
pnpm db:migrate && pnpm db:seed
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm start                        # prod server on :3000 for QA
```

- **Seed logins**: `admin@vantor.dev` / `vantor-admin-dev-1` (admin) and
  `founder@vantor.dev` / `vantor-founder-dev-1` (founder, owns the seed
  companies). 9 demo companies incl. pre-revenue, high-burn, declining,
  concentrated archetypes.
- **Browser QA**: Chromium at `/opt/pw-browsers/chromium` via
  `playwright-core` (install it in the scratchpad, NOT the repo). Do not
  run `playwright install`.
- **Network quirks**: outbound goes through a proxy. `*.vercel.app` is
  BLOCKED from the container (verify deployments via Vercel MCP, QA
  against local `pnpm start`). Google Fonts mostly works but Next's
  bundled font-URL data can be stale (Playfair Display 404'd at build —
  that font is gone now; Familjen Grotesk builds fine). Fontshare is
  blocked.
- `next dev` re-adds a block to `AGENTS.md`; committing it is fine.

## Known issues & debt to work through (triage list)

Carried from Phase 2 (details in `VANTOR_HANDOFF.md` §Known issues):

1. Founder-area 404s can stream as 200 with not-found UI; public
   marketplace emits real 404s. Worth fixing for correctness.
2. Valuation cooldown is check-then-insert (benign race, one extra run
   worst case). Founder verification page doesn't list previously
   attached evidence.
3. Presentation-helper duplication: founder vs public valuation surfaces
   (labels, num parser), and a triplicated verification status-badge
   tone map. Explicit cleanup candidates.
4. Rate limiting is per-instance memory; email delivery (verification,
   password reset) does not exist; published-company edits skip
   re-review; mixed-currency metrics are not converted.
5. Comparables model intentionally inactive ("Insufficient Comparable
   Data" always). Not a bug.

New/possible items from the UI + brand passes (not yet audited):

6. The brand PNGs are ~450 KB each. They are served through `next/image`
   with tight `sizes` hints so the wire cost should be small — verify
   optimized variants are actually served (check response content-type/
   size on `/_next/image` requests) and that nothing requests the raw
   files except OG/icons.
7. Favicon at 16px is a downscale of a soft raster — acceptable today;
   crisper if the owner ever supplies vector originals. Do not "fix"
   this by redrawing the mark; that is explicitly forbidden.
8. The dark refinement + brand passes were visually QA'd mainly on
   home / companies / login / footer / mobile menu at 1920/1440/390.
   **Founder onboarding (all 7 steps), founder dashboard tabs
   (valuation, verification, metrics), admin queue/detail pages, and
   signup were not re-screenshotted after the brand merge** — highest-
   value QA territory.

## Suggested QA sweep (what "product QA" should cover)

- Full click-through as founder: signup → onboarding (all steps, incl.
  draft resume) → dashboard → metrics → request valuation → visibility
  toggle → verification submission. Then as admin: queue → approve →
  verification decisions (reject requires founderNote) → audit trail.
- Public: discovery filters (no-JS GET form), company profile incl.
  valuation section + verification badges, 404s for drafts.
- Auth: wrong password, duplicate signup, signed-out access to /founder
  and /admin (redirect vs 404 behavior is intentional — see
  `src/app/admin/layout.tsx` comment).
- Viewports 1920/1440/390 on every surface; assert
  `document.documentElement.scrollWidth <= clientWidth`.
- Favicon in tab, OG image via a metadata scraper, apple-icon route.
- Regression guard: `pnpm test` is DB-backed (needs `TEST_DATABASE_URL`
  + running postgres); tests wipe/reseed between files.

## Rules that bind this session

- No securities/transaction/payment features; capability flags in
  `src/config/features.ts` stay false. No endorsement/advice language.
- Accent discipline: champagne metal only on valuation surfaces and
  selection details. Do not spread it.
- Server actions re-check authorization themselves; layouts are not a
  security boundary. Keep it that way when fixing bugs.
- Fix-forward on the designated branch, small commits, run the full
  gate (lint / typecheck / test / build) before any push.
- Phase 3 (Investor Experience + Watchlists + Discovery Intelligence,
  per `VANTOR_HANDOFF.md` §Recommended next phase) starts only after
  this stabilization pass is reviewed by the owner.

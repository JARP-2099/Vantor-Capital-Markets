# VANTOR UI/UX DIRECTION — V3 (Republic × AngelList)

**Status: CURRENT visual source of truth.**
Supersedes `docs/VANTOR_UI_UX_REFERENCE_BRIEF.md` (V1, editorial/ivory — rejected) and
`docs/UI_REDESIGN_V2_DECISIONS.md` (V2, dark/OLED cobalt — rejected) for all art direction.
Product, security, and regulatory guidance in older docs remains valid where it does not
conflict with this document.

> **Provenance note.** The V3 redesign prompt referenced an attached
> `VANTOR_UI_UX_DIRECTION_HANDOFF_20260816.md`. That file was not present in the session
> environment, the repository, or any remote branch at implementation time. This document
> was therefore authored from (1) the V3 prompt itself — the #1 authority — and (2) fresh
> `ui-ux-pro-max` v2.13.0 research. If the original handoff surfaces later and differs,
> reconcile at the next design gate.

---

## 1. North star

**Republic marketplace UX × AngelList visual sophistication × Robinhood-level ease,
tuned up-market to deserve the name "Vantor Capital Markets."**

Feel: modern, premium, analytical, trustworthy, calm; dense where information matters.
Never: crowdfunding, crypto, shadcn demo, fake Bloomberg, OLED terminal, editorial
magazine, AI-generated SaaS template.

Reference hierarchy for decisions:
1. V3 prompt (2026-08-16)
2. V3 handoff (missing — see provenance note)
3. `ui-ux-pro-max` research (verified DB matches only)
4. Existing Vantor product/functionality/regulatory requirements
5. Older briefs, non-conflicting historical context only

## 2. Skill research record (ui-ux-pro-max v2.13.0)

All mandated §8 topics were queried; raw outputs archived in the session scratchpad
(`v3-research/`). Summary of what the database returned and what we did with it:

| Query (domain) | Key result | Disposition |
|---|---|---|
| private market investment marketplace premium (`--design-system`, density 7, motion 3) | Marketplace/Directory pattern: search-primary hero, categories, featured listings, trust section; Flat Design; anti-patterns "no trust cues, text-heavy pages, hidden filters"; motion subtle 300–400ms | **Adopted** (pattern, motion tier, anti-patterns). Palette (blue-tinted bg `#EFF6FF`) rejected — neutral surfaces instead |
| investment/deal/startup/private-market/crowdfunding marketplace, opportunity discovery (product) | Marketplace (P2P): trust colors + success green, filter-heavy results; Financial Dashboard: "dark bg + red/green + trust blue, Data-Dense Dashboard" | Marketplace structure **adopted**; OLED dark foundation **rejected** (light-first mandate) |
| capital markets, private markets, venture investing, wealth platform (product) | **0 results** (no DB match — recorded honestly) | Fallback to prompt + adjacent matches |
| institutional fintech, investment platform, financial research platform (product) | Fintech/Crypto → Glassmorphism + OLED (**rejected**: crypto aesthetic); Financial Dashboard profile as above | Data-density + trust-blue **adopted**; styling rejected |
| financial dashboard, investor portal, portfolio/fundraising dashboard (product) | Data-Dense Dashboard style, Minimalism/Swiss secondary, Accessible & Ethical | **Adopted** as product-surface philosophy |
| institutional fintech typography / premium B2B font pairing (typography) | "Bold Typography (Inter Poster)": **Inter 600–800** for UI + display, tight tracking, mono for labels/stats; "Financial Trust": IBM Plex Sans; "Premium Sans": DM Sans | **Adopted Inter** + mono-label idea (IBM Plex Mono). Playfair/serif and Calistoga pairings **rejected** (no-serif rule). IBM Plex Sans rejected again — its Google latin subset lacks `tnum` (verified with fontTools; Inter's has it) |
| fundraising progress, valuation range, KPI, verification progress (chart) | Bullet chart (KPI vs range), line + confidence band (model estimates/uncertainty), waffle/fraction (share-of-whole), line (time series); candlestick "trading context only" | **Adopted** all four mappings; **candlestick rejected** (no fake market pricing) |
| data tables, filter, chips (ux) | Tables: `overflow-x-auto` or card transform on mobile; filter chips must wrap or use +n disclosure, never clip | **Adopted** |
| trust professional finance blue (color) | Trust blue `#1E40AF`/`#2563EB` family + profit green + neutral surfaces | **Adopted** directionally; exact values below |

## 3. Typography

- **One family: Inter** (Google, variable 400–800, `next/font`, `--font-inter`).
  Institutional, ubiquitous in serious financial software, excellent hinting, and its
  served latin subset carries true tabular numerals (`tnum` — verified).
- **Micro-label accent: IBM Plex Mono 400/500** (`--font-plex-mono`). Used ONLY for tiny
  uppercase data labels (`ESTIMATED VALUATION`, table headers, section kickers ≤11px).
  Gives research-terminal credibility without becoming one. Never for body or headings.
- No serif. No italic display. No condensed/thin faces.
- Scale: hero 44–60px w700 `tracking -0.025em` (confident, not cartoon); section H2
  24–32px w700; H3 16–18px w650; body 15–16px/1.6; captions 12–13px; labels 11px mono
  uppercase `tracking 0.08–0.12em`.
- No forced line breaks in headlines; natural wrap within a measured max-width.
- All financial figures `tabular-nums`, weight 600–700.

## 4. Color

Light-first. Pages are white; structure comes from hairlines and type, not surfaces.

| Token | Value | Role |
|---|---|---|
| `paper` | `#FFFFFF` | Default page + surface |
| `canvas` | `#F8F9FB` | Alternate section band, page background behind tables |
| `mist` | `#EEF1F5` | Hover fills, quiet chips |
| `line` / `line-strong` | `#E6E9EF` / `#D3D9E2` | Hairlines everywhere |
| `ink-950` / `ink-900` | `#070C15` / `#0E1626` | Headings / primary text (deep charcoal-navy) |
| `slate-650` | `#404B60` | Secondary text |
| `muted` / `faint` | `#5E6A7E` / `#97A0B1` | Tertiary text / unknown values |
| `night-950…700` | `#0A0F1E…#232E49` | **Selective** dark: footer, high-value financial modules, (legacy app chrome until propagation) |
| `accent-700/600/500…50` | `#1740C7 / #1E4FE0 / #3D68EE … #EEF3FE` | Vantor Cobalt — selected nav, primary actions, links, focus, key data. **Rationed**: roughly one cobalt element per view region |
| `positive-*` | `#0E7A46` family | Verified / positive growth |
| `negative-*` | `#C23636` family | Negative / failure |
| `warn-*` | `#B45D0E` family | Pending / under review |

Never coat sections in cobalt; never glow-gradients or grid backgrounds; dark surfaces
are a deliberate exception (footer + at most one financial module per page), not a theme.

## 5. Radius, borders, elevation

- Controls 6px (`md`), standard surfaces 8px (`lg`), large product frames 10px (`xl`),
  chips 4–6px. Nothing at 16–24px. Full-round reserved for status dots only.
- Hairline borders are the primary separator; shadows near-invisible
  (`shadow-card` = 1px lift; `shadow-frame` for hero product frames only).

## 6. Layout & density

- Marketing container `max-w-7xl`; product data surfaces `max-w-screen-2xl` so 1440–1920px
  screens are actually used.
- **Rows, tables, hairline-divided columns are the default layout primitive. A card
  requires justification** (a genuinely separate surface, e.g. a form panel or a dark
  financial module). The marketplace is a structured result list, not a card grid.
- Landing sections vary composition deliberately: full-width product frame, hairline
  3-column, asymmetric 4/8 split, dark module, centered CTA — never repeated 50/50
  text/card alternation.
- Density: marketing calm (48–96px section padding); data surfaces dense (8–32px rhythm,
  compact rows, more columns on wide screens).

## 7. Component system (Gate 1)

- **Buttons**: 6px radius; primary = cobalt filled; secondary = white + hairline;
  ghost = text; heights 32/40/44.
- **Company identity**: temporary wordmark `VANTOR` (Inter 700, wide tracking) — logo
  design is OUT OF SCOPE; header lockup keeps a fixed height so the real asset drops in.
  Company logos: subtle placeholder — 6px-radius `mist` square, hairline border, muted
  1–2 letter initials at w600. **Never** bright cobalt squares as default identity.
- **Opportunity row** (marketplace standard): placeholder mark · name · one-line thesis ·
  `Industry · Stage · HQ` meta line · right-aligned tabular columns (Revenue, Growth,
  Est. Valuation, Status) · whole row links to the company. Unknown = "—", never zero.
- **Tags/chips**: quiet — `mist` fill or hairline outline, 4–6px radius, 11–12px text.
  Status uses dot+text, not filled pills.
- **Tables**: white surface, mono uppercase 11px headers, hairline rows, right-aligned
  tabular numerals, `overflow-x-auto`, mobile transforms to stacked rows.
- **Metric strips**: hairline-divided horizontal `dl` bands (label over value), not
  floating stat cards.

## 8. Charts (every chart answers a question)

| Question | Chart | Source |
|---|---|---|
| Where in its range does the estimate sit? | Bullet-style range bar (`RangeBar`) | chart DB: bullet |
| How has the estimate (and its uncertainty) moved? | Line + confidence band (`ConfidenceBand`) | chart DB: confidence band |
| What share of submitted data is verified? | Segmented fraction bar (`SegmentedBar`) | chart DB: waffle/fraction |
| How has a reported metric trended? | Simple line (`TrendLine`) | chart DB: line |

Dependency-free SVG; direct labels + exact-value tables alongside; no decorative charts,
no candlesticks, no gain/loss price styling on model estimates.

## 9. Motion

Subtle tier only: 150–200ms color/opacity hovers; 300–400ms fade/6–12px rise on scroll
reveal (existing `Reveal` + CSS hooks); charts may draw once. `prefers-reduced-motion`
collapses everything to final state. No parallax, no pinning, no hero choreography.

## 10. Responsive rules

Test at 390 / 768 / 1280 / 1440 / 1920. No horizontal overflow at any width; 1920 must
not read as a small site floating in space (wide containers + density do the work).
Mobile: filter disclosure, stacked opportunity rows with inline metrics, ≥44px targets,
tables → stacked structures where needed.

## 11. Rejected styles (do not revive)

V1: warm ivory, serif/editorial, Instrument Serif, narrow compositions, whitespace-as-luxury.
V2: OLED/near-black marketing chrome, glowing cobalt grid heroes, chunky one-word-per-line
headlines, pill eyebrows, cobalt square monograms, giant floating financial cards,
repetitive 50/50 sections, oversized rounded boxes, "Private markets, finally legible."
Also standing: glassmorphism, crypto/Matrix/gold palettes, candlesticks, radar charts,
fake tickers, Robinhood-green branding, GSAP as a dependency, emoji as icons.

## 12. Regulatory & product rails (unchanged, always win)

"Estimated Private Market Valuation" (never price/ticker), "Data Verification" (never
endorsement), unknown ≠ zero (render "—"), fictional demo data labeled "Illustrative",
no fabricated investing functionality (architect so future regulated flows can plug in),
`internalNotes` admin-only, valuation/verification engines and auth untouched.

## 13. Gate status

- **Gate 1 (this change)**: design system + landing (hero + featured marketplace section,
  with remaining landing sections re-skinned to V3 so no rejected styling ships) +
  Discover + company profile. Founder, onboarding, auth, admin remain functionally intact
  on the previous shell pending explicit human approval.
- **Gate 2+**: propagate to founder/onboarding/auth/admin/remaining states only after
  approval of Gate 1.

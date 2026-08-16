# Vantor UI Redesign V2 — Design Decisions

> **SUPERSEDED FOR VISUAL DIRECTION. The V2 art direction below (dark/OLED
> marketing chrome, cobalt grid heroes, heavy display type) was rejected.
> The current Vantor art-direction source of truth is
> `docs/VANTOR_UI_UX_DIRECTION_V3.md`.** This file is kept for research
> history and for product/regulatory rails that remain valid.

This document records the design research performed with the
`ui-ux-pro-max` v2.13.0 skill (local searchable design database) and the
decisions locked for the V2 redesign. It supersedes the art direction in
`docs/VANTOR_UI_UX_REFERENCE_BRIEF.md` (kept only for product/historical
context). Product truth (functionality, terminology, regulatory language,
security) still lives in the repository and
`docs/DEVELOPMENT_PLAYBOOK.md`.

## 1. Research performed (queries → what came back)

### Design-system generation
- `"private markets investment research platform fintech" --design-system
  --density 7 --motion 4` → Pattern **Enterprise Gateway** (trust-forward,
  conservative accents), Style **Dark Mode**, palette slate-navy scale
  (#020617 / #0F172A / #1E293B, border #334155, muted-fg #94A3B8),
  typography **IBM Plex Sans** ("financial, trustworthy, banking"),
  anti-patterns: slow rendering.
- `"B2B financial analytics dashboard data-dense professional"
  --design-system --density 8 --motion 3` → Style **Data-Dense Dashboard**
  ("minimal padding, grid layout, maximum data visibility; financial
  analytics"), motion: subtle scroll-reveal 300–400ms `power1.out`.

### Product domain
- `fintech dashboard` → **Financial Dashboard**: "Dark Mode + Data-Dense
  Dashboard; dark bg + red/green alerts + trust blue". Secondary:
  Minimalism/Swiss, Accessible & Ethical.
- `B2B financial software` → **B2B Service**: "professional blue + neutral
  grey"; SaaS: "trust blue + accent contrast".
- `startup marketplace` → Marketplace (P2P): "trust colors + success
  green; verified seller badge" (verification badging validated).
- `investment platform`, `private markets`, `capital markets`,
  `financial analytics` → **no database match** (0 results; noted
  honestly — closest verified matches are the Financial Dashboard and B2B
  Service profiles above).
- `Fintech/Crypto` profile (glassmorphism + OLED + web3) → **rejected**
  (crypto aesthetic is out of bounds for Vantor).

### Typography domain
- `financial dashboard typography` → **IBM Plex Sans** (financial,
  trustworthy, banking) and Fira Code/Fira Sans (technical).
- `modern B2B typography` → **Plus Jakarta Sans** ("enterprise, saas, b2b,
  professional, modern, approachable, legible — B2B SaaS apps, government
  and finance mobile apps, admin dashboards").
- `fintech font pairing` → Calistoga+Inter tri-stack (editorial warmth —
  rejected, editorial is out) and **Plus Jakarta Sans single-family**
  ("pairs beautifully… modern premium feel; Heading Bold 700,
  letterSpacing -0.5").
- `data-heavy product typography` → Exo/Roboto Mono (sci-fi — rejected),
  Inter+Playfair (editorial — rejected).
- `--domain google-fonts "grotesk sans variable professional"` →
  Familjen/Space/Host/Schibsted Grotesk (Space Grotesk rejected: too
  techy-display for financial body copy).
- **Local font-feature verification** (fontTools on the served latin
  subsets): Plus Jakarta Sans `tnum ✓` (weights 200–800), Manrope
  `tnum ✓`, Geist `tnum ✓`, IBM Plex Sans latin subset `tnum ✗`.

### Color domain
- `financial SaaS palette` → "**Dark bg (#020617) + green positive
  indicators**, primary #0F172A" (matches design-system run 1).
- `trust professional finance blue` → "**Trust blue #1E40AF + profit
  green #059669 on dark #0F172A**".
- `fintech palette` → gold+purple (rejected — off-brand), Matrix
  green/red terminal (rejected — trading-terminal aesthetic).
- `capital markets palette` → no database match.

### Chart domain
- `valuation range visualization` → **Bullet Chart** ("KPI vs range,
  space-constrained; D3/Custom SVG") and **Line with Confidence Band**
  ("historical data + model predictions; communicating uncertainty to
  non-technical stakeholders").
- `financial history chart` / `financial dashboard charts` →
  Candlestick (**rejected**: OHLC trading context only — Vantor must not
  imply traded prices) + Bullet Chart again.
- `financial comparison chart` → Radar (**rejected**: wrong fit for
  ranges) — comparison handled with aligned horizontal range bars.
- `progress completeness visualization` → **Waffle chart** ("fraction of
  a whole; accessible progress") — adapted to a segmented linear bar.

### UX guidelines domain (recurring, applied)
- Tables: "Don't: wide tables breaking layout — Do: horizontal scroll or
  card layout"; multi-select/bulk where relevant.
- Navigation: sidebar "for sites with 3+ levels of depth; don't use for
  flat single-level sites"; sequential heading levels; nav must not
  overlap content; account for fixed-element stacking.
- Forms: `inputmode` on numeric fields, loading→success/error feedback,
  no placeholder-only labels; onboarding: Skip/Back, no forced linear
  tours.
- Mobile-first breakpoints; chips/badges must wrap or use "+n" overflow
  disclosure, never clip.
- GSAP presets consulted (stagger 0.06–0.08, 300–450ms, `power1/2.out`;
  reduced-motion: render final state immediately; "don't use back.out
  overshoot on dense data tables").

## 2. Decisions

### Typography — LOCKED
**Plus Jakarta Sans, single family** (variable 200–800; loaded 400–800),
via `next/font`. Chosen because it is the database's strongest *modern*
B2B-finance match (twice recommended), passes the tabular-numeral
requirement, carries true 700–800 weights for the required hero scale,
and doesn't read as an AI-template default (Inter/Geist) or as
conservative legacy (IBM Plex, which also lacks tnum in its served latin
subset). No serif anywhere. No italic display type.
- Hero: 64–84px, weight 800, tracking -0.02em
- Section headings: 40–56px, weight 700–800
- Product page titles: 24–32px, weight 700
- Body: 15–16px (product), 17–18px (marketing), weight 400–500
- Financial values: weight 600–700 + `tabular-nums`, mono only never
- Labels/eyebrows: 11–12px, weight 600, uppercase, +0.08em

### Color — LOCKED (cool slate-navy + Vantor Cobalt)
Replaces the rejected warm-ivory system. Synthesis of the DB's
"dark bg + trust blue + red/green semantics" profiles:

- Dark foundation (marketing, sidebar, admin chrome):
  `night-950 #020617`, `night-900 #0B1222`, `night-800 #101A30`,
  elevated `night-700 #1A2742`; hairlines `white/8–12%`;
  dark text `#F1F5F9` / `#94A3B8`.
- Light product surfaces: app bg `#F4F6FA`, surface `#FFFFFF`,
  subtle fill `#EDF1F7`, borders `#E2E7F0` / strong `#CBD4E1`;
  text `#0B1222` primary, `#3F4C63` secondary, `#64748B` muted.
- **Vantor Cobalt** (single accent): `cobalt-700 #1740C7`,
  `cobalt-600 #1E4FE0` (primary actions), `cobalt-500 #3D68EE`,
  `cobalt-400 #6B96F7` (accents on dark), `cobalt-100 #DCE6FC`,
  `cobalt-50 #EEF3FE`. Used for primary actions, active nav, selected
  states, interactive data visuals — not for decoration.
- Semantic (reserved): positive `#0E7A46`/dark-surface `#34C979`;
  negative `#C23636`; caution `#B45D0E`; tints for each.
- Data-viz: cobalt primary series; slate `#94A3B8` secondary; band fills
  cobalt at 12–16% alpha.

### Layout & space
- Marketing container ~1280px (max-w-7xl) with full-bleed dark sections;
  hero uses most of the viewport height with a split composition (copy
  left, LARGE product visualization right).
- Product pages widen to ~1400–1536px; data surfaces may use the full
  width with 24–32px gutters. Density per the Data-Dense Dashboard
  profile: 8/16/24 spacing rhythm in product, larger only in marketing.
- Card-reduction rule: surfaces only where separation carries meaning;
  otherwise sections + dividers + tables (per §29 of the brief and the
  Swiss/minimal secondary recommendation).

### Navigation
- Public (marketing + marketplace + profiles): compact top nav on dark,
  wordmark left (future logo slot), Discover / Sign in / CTA.
- Authenticated founder + admin: **left sidebar** app shell (DB: sidebar
  for 3+ levels — founder has dashboard → company → 6 tabs; admin has 4
  queues). Collapses to a top bar + slide-over on mobile. Wordmark-only
  brand block sized to accept a future logo asset.

### Charts (each mapped to a DB recommendation)
1. Valuation range → **bullet-style range bar** (custom SVG): full-range
   track, low–high band, midpoint marker. Why: DB "Bullet Chart — KPI vs
   range, space-constrained"; honest range framing, no ticker styling.
2. Valuation history → **line with confidence band**: midpoint line
   inside a low–high band. Why: DB "communicating uncertainty range to
   non-technical stakeholders" — exactly what an estimate range is.
3. Model contribution → **aligned horizontal range bars** per model with
   weight labels. Why: comparison across one attribute; radar rejected.
4. Verification completeness → **segmented linear bar** (one segment per
   submitted category) + per-category status list. Why: DB waffle
   "fraction of whole", linearized for small-space accessibility.
5. Revenue/metric history → **compact single-series line/area** with
   labeled endpoints, units, and period. No decorative charts.
All charts: custom inline SVG, no chart library (bundle discipline; DB
lists Custom SVG as a first-class implementation for these types),
tooltips/labels/units required, color never the sole meaning carrier.

### Motion
Subtle tier (motion dial 3–4): scroll reveals 300–450ms `power2.out`
equivalents, stagger 60–80ms, number count-up on hero stats, range-bar
grow, band draw-in. Implemented with the existing IntersectionObserver
Reveal + CSS (GSAP presets used as the *specification*, library not
added — no new runtime dependency for patterns CSS already covers).
Full `prefers-reduced-motion` support: final state rendered immediately.
No overshoot easing on data tables.

### Rejected recommendations (and why)
- Dark Mode OLED as the *product* surface style — marketing/admin chrome
  only; daily financial reading is better on light surfaces (DB itself
  flags dark-mode "light not-recommended" only for its OLED profile, and
  the Financial Dashboard profile pairs dark with data-dense dashboards
  for *monitoring* contexts, not form-heavy founder workflows).
- Glassmorphism (SaaS profile) — banned aesthetic for Vantor.
- Crypto/web3 profile, Matrix-green terminal palette, gold+purple
  fintech palette — off-brand, speculative feel.
- Candlestick charts — imply traded OHLC prices; regulatory language
  forbids ticker framing.
- Radar charts — poor fit for range comparison.
- Calistoga/serif/editorial pairings — editorial direction is rejected.
- Enterprise Gateway's "Contact Sales" CTA structure — Vantor is
  self-serve; CTAs remain Explore Companies / List Your Company.
- GSAP as a dependency — patterns adopted, library not needed.

## 3. The V2 direction in one paragraph

Vantor V2 is a modern private-market financial platform: near-black
navy marketing surfaces with an electric cobalt accent and large,
heavy Plus Jakarta Sans typography; light, cool, data-dense product
surfaces where tables, aligned tabular numerals, and purposeful SVG
financial visualizations (range bars, confidence bands, segmented
completeness) carry the hierarchy; a sidebar app shell for the
authenticated product; semantic green/red/amber reserved strictly for
meaning; no serif, no ivory, no glassmorphism, no ticker cosplay.

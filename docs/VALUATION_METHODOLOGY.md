# Vantor Valuation Methodology — `vantor-valuation-v1`

This documents exactly how the V1 engine produces an **Estimated Private
Market Valuation**. The engine is a pure, deterministic function
(`src/lib/valuation/engine.ts`) of a persisted input snapshot: identical
inputs always produce identical outputs, every run stores its engine and
assumptions versions, and history is append-only.

**What the output is:** an estimate range with a midpoint and a confidence
score. **What it is not:** a market price, an offer, an appraisal, or
investment advice. Confidence expresses confidence in the *estimate* (input
coverage and model agreement) — never investment quality.

## Assumptions — `vantor-assumptions-v1`

Every baseline number lives in `src/lib/valuation/assumptions.ts` and
nowhere else. These are **internal model assumptions**, not market data:
Vantor holds no proprietary comparable-transaction dataset yet, and the
comparables component therefore always reports *Insufficient Comparable
Data* rather than inventing values. Assumption changes require a version
bump so historical runs stay interpretable.

## Component models

| Component | Applies when | Core calculation |
|---|---|---|
| **Revenue Multiple** | ARR (or annual revenue, or MRR×12) ≥ $50k | revenue × base multiple (by business model) × growth factor × margin factor × industry modifier |
| **Profitability** | Reported annual net profit > 0 | net profit × earnings multiple (base 12×, mildly growth-adjusted) |
| **Stage Baseline** | Revenue < $50k (pre-revenue path) | stage baseline range × industry modifier × team factor × traction factor, floored at 60% of capital raised |
| **Comparables** | Never in V1 | Always `insufficient_data` — interface and storage exist for a future legitimate dataset |

Growth factor: anchored at 20% YoY = neutral, ±0.8%/point, clamped to
[0.5, 2.5] so hypergrowth cannot produce unbounded multiples and decline
cannot halve the base more than once. Margin factor: 50% = neutral,
±0.4%/point, clamped [0.8, 1.15]. Growth is taken from the reported YoY
metric, or derived from two revenue history points ≥6 months apart.

Each applied component emits a range (central estimate ± spread, where the
spread widens as data completeness falls: 12% / 20% / 35%), a weight, and an
explainability payload (inputs, multiples, factors) persisted per run in
`valuation_components`.

## Blending and outliers

Revenue + Profitability blend 60/40; a single applicable model carries full
weight. If applied models disagree by more than 3× between midpoints, the
engine does **not** average blindly: the final range widens to span both
models and the confidence agreement penalty applies.

## Risk adjustments

Applied multiplicatively to the blended range, each recorded as a flag with
its impact: runway < 6 months (−15%), annualized burn > 2× revenue (−10%),
revenue declining beyond −5% (−20%), top customer ≥ 40% of revenue (−10%),
gross margin < 20% on a subscription model (−5%). Combined reduction is
floored at −40% (factor 0.6) so stacked flags cannot zero out an estimate.

## Data sufficiency

Evaluated before estimating, from a per-path checklist (revenue path: 8
inputs; pre-revenue path: 6): **strong** (≥75% complete + ≥2 revenue history
points) / **moderate** (≥50%) / **limited** (below, and always for
pre-revenue) / **insufficient** (no applicable model — the engine returns
reasons and improvement hints instead of a number; it never emits $0 for
lack of data).

## Confidence score (0–100, clamped 5–95)

Deterministic sum, documented in `CONFIDENCE_RULES`:

- Base 20
- Plus data completeness × 40
- Plus 5 (one applicable model) or 12 (two or more)
- Model agreement: midpoint ratio ≤1.3 → +10; ≤2 → +5; ≤3 → 0; >3 → −15
- Plus 8 when ≥2 historical revenue points exist
- Freshness: newest core metric ≤12 months old → +5; older → −10
- Verification: +6 per verified financial category (revenue, financial
  statements), capped at +10 — verification raises **confidence only**,
  never the estimated value
- Pre-revenue estimates are capped at 55

## Rounding and presentation

Outputs round to 3 significant figures; ranges are always shown as ranges
("$4.2M – $5.1M, midpoint $4.65M") — never a single falsely precise number.
Runs are triggered by company managers or admins, with a 10-minute per-
company cooldown (admins bypass) to prevent abusive recalculation.

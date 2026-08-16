import Link from "next/link";
import { Container } from "@/components/layout/container";
import { FeaturedCompanies } from "@/components/landing/featured-companies";
import { ProductFrame } from "@/components/landing/product-frame";
import { ButtonLink } from "@/components/ui/button";
import { ConfidenceBand, RangeBar, SegmentedBar } from "@/components/ui/charts";
import { Reveal } from "@/components/ui/reveal";

/*
 * Public landing — V3 (docs/VANTOR_UI_UX_DIRECTION_V3.md): light-first,
 * product-forward. The hero explains the product in one sentence and shows
 * the actual marketplace; sections vary composition deliberately (full
 * frame, hairline columns, one dark financial module, diligence rows) and
 * never repeat 50/50 text/card alternation. All demo data is fictional and
 * captioned; regulated-language rails preserved throughout.
 */

const MONO_LABEL = "font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted";

const pillars = [
  {
    kicker: "Profiles",
    title: "Standardized company information",
    body: "Every company reports the same structure — story, financial metrics, team — so a private company can be understood in minutes, not a data room.",
  },
  {
    kicker: "Valuation",
    title: "Explainable model-based estimates",
    body: "A versioned engine turns reported data into an estimated valuation range, with confidence, data sufficiency, and each model's weight disclosed.",
  },
  {
    kicker: "Verification",
    title: "Evidence-based diligence",
    body: "Founders submit evidence category by category, and reviewers verify it. What's verified is marked. What isn't, isn't.",
  },
];

const verificationDemo = [
  { label: "Founder identity", status: "Verified", tone: "positive" as const },
  { label: "Company formation", status: "Verified", tone: "positive" as const },
  { label: "Revenue", status: "Verified", tone: "positive" as const },
  { label: "Financial statements", status: "Under review", tone: "warn" as const },
  { label: "Customer metrics", status: "Pending", tone: "neutral" as const },
];

const modelBars = [
  { label: "Revenue Multiple Model", start: 0.05, end: 0.98, range: "$4.1M – $5.3M", weight: "55%" },
  { label: "Stage Baseline Model", start: 0.0, end: 0.62, range: "$3.8M – $4.6M", weight: "30%" },
  { label: "Profitability Model", start: 0, end: 0, range: "Not applied — pre-profit", weight: null },
  { label: "Comparable Transactions", start: 0, end: 0, range: "Insufficient comparable data", weight: null },
];

const historyPoints = [
  { x: 0, low: 2.6, mid: 3.0, high: 3.4 },
  { x: 0.28, low: 3.0, mid: 3.45, high: 3.9 },
  { x: 0.55, low: 3.3, mid: 3.9, high: 4.5 },
  { x: 0.8, low: 3.9, mid: 4.35, high: 4.8 },
  { x: 1, low: 4.2, mid: 4.65, high: 5.1 },
];

const founderSteps = [
  {
    title: "Create your standardized profile",
    body: "Structured story, metrics, and team — about ten minutes to a complete draft.",
  },
  {
    title: "Report dated financial metrics",
    body: "Revenue, growth, customers — on your terms, always dated, never fabricated.",
  },
  {
    title: "Generate your valuation estimate",
    body: "An explainable range from the Vantor engine, with confidence stated plainly.",
  },
  {
    title: "Submit evidence for verification",
    body: "Independent review, category by category. Verified data compounds trust.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ================================ Hero ================================ */}
      <section className="border-b border-line bg-paper">
        <Container className="pb-14 pt-14 sm:pt-20 lg:pb-20">
          <div className="max-w-3xl">
            <h1 className="animate-fade-up text-4xl font-bold leading-[1.06] tracking-[-0.025em] text-ink-900 sm:text-5xl lg:text-[3.5rem]">
              The marketplace for private companies.
            </h1>
            <p
              className="animate-fade-up mt-5 max-w-2xl text-lg leading-relaxed text-slate-650"
              style={{ animationDelay: "90ms" }}
            >
              Vantor standardizes how private companies present themselves — profiles,
              financials, model-based valuations, and verified data — so investors can
              discover and evaluate them in minutes.
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "180ms" }}
            >
              <ButtonLink href="/companies" size="lg">
                Explore Companies
              </ButtonLink>
              <ButtonLink href="/signup" size="lg" variant="secondary">
                List Your Company
              </ButtonLink>
            </div>
          </div>
          <div className="animate-fade-up mt-12 lg:mt-16" style={{ animationDelay: "260ms" }}>
            <ProductFrame />
          </div>
        </Container>
      </section>

      {/* ========================= Featured companies ========================= */}
      <section className="border-b border-line bg-canvas">
        <Container className="py-16 sm:py-20">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Explore companies
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-650">
                  Search and compare private companies by industry, stage, revenue, growth,
                  valuation, and verification.
                </p>
              </div>
              <Link
                href="/companies"
                className="text-sm font-semibold text-accent-700 underline-offset-4 hover:underline"
              >
                Browse all companies →
              </Link>
            </div>
          </Reveal>
          <div className="mt-7">
            <FeaturedCompanies />
          </div>
          <p className="mt-3 text-xs text-faint">
            Illustrative — fictional companies shown while the marketplace grows.
          </p>
        </Container>
      </section>

      {/* ============================ Why Vantor ============================ */}
      <section className="border-b border-line bg-paper">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              Private markets run on information asymmetry.
              <span className="text-muted"> Vantor removes it.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-y-10 md:grid-cols-3 md:gap-x-0 md:divide-x md:divide-line">
            {pillars.map((p, i) => (
              <Reveal key={p.kicker} delay={i * 100} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <p className={MONO_LABEL}>{p.kicker}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink-900">
                  {p.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-650">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ==================== Valuation — dark financial module ==================== */}
      <section className="border-b border-line bg-paper">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <Reveal>
              <p className={MONO_LABEL}>Valuation</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                An estimate you can interrogate.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-650">
                Every valuation is a range with a stated confidence — produced by weighted,
                versioned models over reported data. Never a black box, never a fake precise
                number, never a traded price.
              </p>
              <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm text-slate-650">
                <li>Range, midpoint, confidence, and data sufficiency up front</li>
                <li>Each model&rsquo;s contribution and weight disclosed</li>
                <li>&ldquo;Insufficient data&rdquo; stated plainly when true</li>
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-xl bg-night-950 p-6 text-white sm:p-8" aria-hidden="true">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/50">
                    Estimated Private Market Valuation
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                    Arclight Aerospace · Illustrative
                  </p>
                </div>
                <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <div>
                    <p className="mt-2.5 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
                      $4.2M – $5.1M
                    </p>
                    <RangeBar
                      className="mt-4"
                      surface="dark"
                      bandStart={0.08}
                      bandEnd={0.92}
                      mid={0.5}
                      lowLabel="$4.2M"
                      midLabel="Mid $4.65M"
                      highLabel="$5.1M"
                      reveal
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-4 self-end lg:border-l lg:border-white/10 lg:pl-8">
                    {[
                      { label: "Confidence", value: "68%" },
                      { label: "Data sufficiency", value: "Strong" },
                      { label: "Estimates", value: "5" },
                      { label: "Updated", value: "Jun 2026" },
                    ].map((s) => (
                      <div key={s.label}>
                        <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white/50">
                          {s.label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-semibold tabular-nums">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="mt-7 grid gap-8 border-t border-white/10 pt-6 md:grid-cols-2">
                  <div className="space-y-4">
                    {modelBars.map((m, i) => (
                      <div key={m.label} className="reveal-child" style={{ transitionDelay: `${250 + i * 90}ms` }}>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-[13px] font-semibold text-white/90">{m.label}</p>
                          <p className="text-xs text-white/50 tabular-nums">
                            {m.weight ?? ""}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-white/60 tabular-nums">{m.range}</p>
                        {m.weight ? (
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="reveal-bar h-full rounded-full bg-accent-400/80"
                              style={{
                                marginLeft: `${m.start * 100}%`,
                                width: `${(m.end - m.start) * 100}%`,
                                transitionDelay: `${300 + i * 90}ms`,
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/50">
                      Estimate history
                    </p>
                    <ConfidenceBand
                      className="mt-3"
                      surface="dark"
                      points={historyPoints}
                      label="Estimated valuation range across five runs, midpoint rising from $3M to $4.65M"
                      height={120}
                      reveal
                    />
                    <div className="mt-1.5 flex justify-between text-[10px] text-white/40 tabular-nums">
                      <span>Q2 2025</span>
                      <span>Q2 2026</span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-[11px] leading-relaxed text-white/40">
                  Model estimate from company-reported data. Not a traded price, an offer, or
                  investment advice.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============================ Verification ============================ */}
      <section className="border-b border-line bg-canvas">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            <Reveal className="order-2 lg:order-1">
              <div className="rounded-lg border border-line bg-paper px-6 py-5 shadow-card sm:px-7" aria-hidden="true">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-bold tracking-tight text-ink-900 tabular-nums">82%</p>
                    <p className="text-sm text-muted">of submitted information verified</p>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                    Arclight Aerospace · Illustrative
                  </p>
                </div>
                <SegmentedBar
                  className="mt-4"
                  segments={[
                    { tone: "positive" },
                    { tone: "positive" },
                    { tone: "positive" },
                    { tone: "warn" },
                    { tone: "neutral" },
                  ]}
                />
                <ul className="mt-2 divide-y divide-line">
                  {verificationDemo.map((row, i) => (
                    <li
                      key={row.label}
                      className="reveal-child flex items-center justify-between py-3"
                      style={{ transitionDelay: `${200 + i * 80}ms` }}
                    >
                      <span className="text-sm font-medium text-ink-900">{row.label}</span>
                      <span
                        className={
                          row.tone === "positive"
                            ? "inline-flex items-center gap-1.5 text-xs font-semibold text-positive-700"
                            : row.tone === "warn"
                              ? "inline-flex items-center gap-1.5 text-xs font-semibold text-warn-700"
                              : "inline-flex items-center gap-1.5 text-xs font-semibold text-muted"
                        }
                      >
                        <span
                          className={
                            row.tone === "positive"
                              ? "size-1.5 rounded-full bg-positive-700"
                              : row.tone === "warn"
                                ? "size-1.5 rounded-full bg-warn-700"
                                : "size-1.5 rounded-full bg-faint"
                          }
                        />
                        {row.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Verification reflects review of submitted evidence — not an endorsement or
                investment assessment.
              </p>
            </Reveal>
            <Reveal className="order-1 lg:order-2">
              <p className={MONO_LABEL}>Verification</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                Diligence, not badges.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-650">
                Founders submit evidence — formation documents, revenue records, financial
                statements — and each category is reviewed on its own. No checkmarks for
                self-reported claims. No scores from thin air.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ========================= Founder workflow ========================= */}
      <section className="border-b border-line bg-paper">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <Reveal>
              <p className={MONO_LABEL}>For founders</p>
              <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                Raise on the strength of your numbers.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-650">
                Present your company the way serious investors evaluate it — standardized,
                valued, and verified. You control what becomes public.
              </p>
              <ButtonLink href="/signup" className="mt-7">
                List Your Company
              </ButtonLink>
            </Reveal>
            <Reveal delay={120}>
              <ol className="divide-y divide-line border-y border-line" aria-label="Founder steps">
                {founderSteps.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[3rem_1fr] items-baseline gap-x-4 py-5">
                    <span className="font-mono text-sm font-medium text-accent-700 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-ink-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-650">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============================= Final CTA ============================= */}
      <section className="bg-canvas">
        <Container className="py-16 text-center sm:py-24">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              The next great companies are already private.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-slate-650">
              Find them first — or make sure they can find you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/companies" size="lg">
                Explore Companies
              </ButtonLink>
              <ButtonLink href="/signup" size="lg" variant="secondary">
                List Your Company
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

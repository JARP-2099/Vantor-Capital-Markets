import { Container } from "@/components/layout/container";
import { DiscoveryPreview } from "@/components/landing/discovery-preview";
import { HeroDemo } from "@/components/landing/hero-demo";
import { ButtonLink } from "@/components/ui/button";
import { ConfidenceBand, RangeBar, SegmentedBar } from "@/components/ui/charts";
import { Reveal } from "@/components/ui/reveal";

/**
 * Public landing — V2 (docs/UI_REDESIGN_V2_DECISIONS.md): dark night
 * foundation, heavy Plus Jakarta display type, one cobalt accent, large
 * realistic product visualization. Motion is subtle-tier scroll reveals;
 * all demo data belongs to labeled fictional companies; regulated-language
 * rails preserved (estimates, not prices; verification of submitted data,
 * not endorsements).
 */

const steps = [
  {
    n: "01",
    title: "Standardized profiles",
    body: "Every company reports the same structure — story, metrics, team — so private companies can be understood in minutes, not data rooms.",
  },
  {
    n: "02",
    title: "Model-based valuation",
    body: "A versioned, explainable engine estimates a private market range from reported data — with confidence and data sufficiency stated plainly.",
  },
  {
    n: "03",
    title: "Evidence-based verification",
    body: "Founders submit evidence, category by category, and reviewers verify it. What's verified is marked. What isn't, isn't.",
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

export default function LandingPage() {
  return (
    <>
      {/* ================================ Hero ================================ */}
      <section className="bg-hero-night bg-grid-dark text-white">
        <Container className="grid items-center gap-12 py-16 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:py-20">
          <div>
            <p
              className="animate-fade-up inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/80"
              style={{ animationDelay: "0ms" }}
            >
              <span className="size-1.5 rounded-full bg-accent-400" />
              Private-market intelligence platform
            </p>
            <h1
              className="animate-fade-up mt-6 text-5xl font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-6xl xl:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              Private markets,
              <br />
              finally <span className="text-accent-400">legible.</span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/65"
              style={{ animationDelay: "240ms" }}
            >
              Vantor is where private companies publish standardized profiles, model-based
              valuations, and verified data — and where investors discover the companies
              building what&rsquo;s next.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-wrap gap-3"
              style={{ animationDelay: "360ms" }}
            >
              <ButtonLink href="/companies" size="lg">
                Explore Companies
              </ButtonLink>
              <ButtonLink
                href="/signup"
                size="lg"
                variant="ghost"
                className="border border-white/20 text-white hover:border-white/45 hover:bg-white/10 active:bg-white/15"
              >
                List Your Company
              </ButtonLink>
            </div>
            <ul
              className="animate-fade-up mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/50"
              style={{ animationDelay: "480ms" }}
            >
              <li>Standardized company data</li>
              <li>Explainable valuations</li>
              <li>Evidence-based verification</li>
            </ul>
          </div>
          <HeroDemo />
        </Container>
      </section>

      {/* ========================= Discovery preview ========================= */}
      <section className="border-t border-white/5 bg-night-950 text-white">
        <Container className="py-16 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                A marketplace built for discovery.
              </h2>
              <p className="mt-3 max-w-xl text-base text-white/60">
                Search, filter, and compare private companies by industry, stage, revenue,
                growth, valuation, and verification.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <ButtonLink
                href="/companies"
                variant="ghost"
                className="border border-white/20 text-white hover:border-white/45 hover:bg-white/10"
              >
                Browse all companies
              </ButtonLink>
            </Reveal>
          </div>
          <DiscoveryPreview />
        </Container>
      </section>

      {/* =========================== How it works =========================== */}
      <section className="bg-canvas">
        <Container className="py-16 sm:py-24">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
              How Vantor works
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Structure, models, and evidence — not rumor.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 110} className="bg-paper p-7">
                <p className="text-sm font-bold text-accent-600 tabular-nums">{s.n}</p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-ink-900">{s.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-650">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ======================= Valuation demonstration ======================= */}
      <section className="border-t border-line bg-paper">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
                Valuation
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                An estimate you can interrogate.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-650">
                Every valuation is a range with a stated confidence — produced by weighted,
                versioned models over reported data, never a black box and never a fake
                precise number.
              </p>
              <ul className="mt-6 space-y-2.5 text-[15px] text-slate-650">
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent-600" />
                  Range, midpoint, confidence, and data sufficiency up front
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent-600" />
                  Each model&rsquo;s contribution and weight disclosed
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent-600" />
                  &ldquo;Insufficient data&rdquo; stated plainly when true
                </li>
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-xl border border-line bg-canvas p-6 shadow-card sm:p-8" aria-hidden="true">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    Estimated Private Market Valuation
                  </p>
                  <p className="text-[11px] text-faint">AeroForge · illustrative</p>
                </div>
                <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink-900 tabular-nums">
                  $4.2M – $5.1M
                </p>
                <RangeBar
                  className="mt-4"
                  bandStart={0.08}
                  bandEnd={0.92}
                  mid={0.5}
                  lowLabel="$4.2M"
                  midLabel="Mid $4.65M"
                  highLabel="$5.1M"
                  reveal
                />
                <div className="mt-6 space-y-3 border-t border-line pt-5">
                  {modelBars.map((m, i) => (
                    <div key={m.label} className="reveal-child" style={{ transitionDelay: `${250 + i * 100}ms` }}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-ink-900">{m.label}</p>
                        <p className="text-xs text-muted tabular-nums">
                          {m.range}
                          {m.weight ? <span className="ml-2 font-semibold text-ink-900">{m.weight}</span> : null}
                        </p>
                      </div>
                      {m.weight ? (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist">
                          <div
                            className="reveal-bar h-full rounded-full bg-accent-600/70"
                            style={{
                              marginLeft: `${m.start * 100}%`,
                              width: `${(m.end - m.start) * 100}%`,
                              transitionDelay: `${300 + i * 100}ms`,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    Estimate history
                  </p>
                  <ConfidenceBand
                    className="mt-2"
                    points={historyPoints}
                    label="Estimated valuation range across five runs, midpoint rising from $3M to $4.65M"
                    height={96}
                    reveal
                  />
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  Model estimate from company-reported data. Not a traded price, an offer, or
                  investment advice.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ====================== Verification demonstration ====================== */}
      <section className="border-t border-line bg-canvas">
        <Container className="py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
            <Reveal className="order-2 lg:order-1">
              <div className="rounded-xl border border-line bg-paper p-6 shadow-card sm:p-8" aria-hidden="true">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    Data Verification
                  </p>
                  <p className="text-[11px] text-faint">AeroForge · illustrative</p>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <p className="text-4xl font-extrabold tracking-tight text-ink-900 tabular-nums">82%</p>
                  <p className="text-sm text-muted">of submitted information verified</p>
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
                <ul className="mt-5 divide-y divide-line border-t border-line">
                  {verificationDemo.map((row, i) => (
                    <li
                      key={row.label}
                      className="reveal-child flex items-center justify-between py-3"
                      style={{ transitionDelay: `${250 + i * 100}ms` }}
                    >
                      <span className="text-sm font-semibold text-ink-900">{row.label}</span>
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
                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  Verification reflects review of submitted evidence — not an endorsement or
                  investment assessment.
                </p>
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
                Verification
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                Diligence-grade, category by category.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-650">
                Founders submit evidence — formation documents, revenue records, financial
                statements — and each category is reviewed on its own. No checkmarks for
                self-reported claims. No scores from thin air.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ========================= Founder section ========================= */}
      <section className="border-t border-line bg-paper">
        <Container className="py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-700">
                For founders
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                Your company, presented like it matters.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-650">
                Build a standardized profile in about ten minutes, report metrics on your
                terms, generate an explainable valuation, and let verified data compound
                trust with every update. You control what becomes public.
              </p>
              <ButtonLink href="/signup" size="lg" className="mt-8">
                List Your Company
              </ButtonLink>
            </Reveal>
            <Reveal delay={130}>
              <ol className="space-y-4" aria-label="Founder steps">
                {["Create your standardized profile", "Report dated financial metrics", "Generate your valuation estimate", "Submit evidence for verification"].map(
                  (step, i) => (
                    <li key={step} className="flex items-center gap-4 rounded-lg border border-line bg-canvas px-5 py-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-600 text-sm font-bold text-white tabular-nums">
                        {i + 1}
                      </span>
                      <span className="text-[15px] font-semibold text-ink-900">{step}</span>
                    </li>
                  ),
                )}
              </ol>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============================= Final CTA ============================= */}
      <section className="bg-hero-night bg-grid-dark text-white">
        <Container className="py-20 text-center sm:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              The next great companies are already private.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
              Find them first — or make sure they can find you.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/companies" size="lg">
                Explore Companies
              </ButtonLink>
              <ButtonLink
                href="/signup"
                size="lg"
                variant="ghost"
                className="border border-white/20 text-white hover:border-white/45 hover:bg-white/10 active:bg-white/15"
              >
                List Your Company
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

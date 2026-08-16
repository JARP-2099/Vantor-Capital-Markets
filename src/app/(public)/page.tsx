import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HeroDemo } from "@/components/landing/hero-demo";
import { ValuationDemo } from "@/components/landing/valuation-demo";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

/**
 * Public landing page — the expressive face of Vantor. Marketing motion only
 * (Reveal + CSS keyframes, reduced-motion safe); every demo figure belongs to
 * clearly labeled fictional companies. Language stays inside the platform's
 * regulatory rails: discovery, estimates, verification of submitted data —
 * never offerings, trading, or advice.
 */

const opacityPillars = [
  {
    n: "01",
    title: "Standardized profiles",
    body: "Every company presents the same structure — story, metrics, team — so a private company can be understood in minutes, not data rooms.",
  },
  {
    n: "02",
    title: "Reported metrics, with history",
    body: "Founders report revenue, growth, and operating metrics as dated records, not marketing claims. Zero and unknown are never confused.",
  },
  {
    n: "03",
    title: "Evidence-based verification",
    body: "Companies submit evidence for review, category by category. Verification reflects exactly what was checked — nothing more.",
  },
];

const marketRows = [
  {
    name: "AeroForge",
    sector: "Defense Technology",
    stage: "Seed",
    revenue: "$580K",
    growth: "+74%",
    status: "Raising",
  },
  {
    name: "Loomweave Systems",
    sector: "Industrial Software",
    stage: "Series A",
    revenue: "$2.4M",
    growth: "+41%",
    status: "Not raising",
  },
  {
    name: "Caldera Biothermal",
    sector: "Climate Energy",
    stage: "Seed",
    revenue: "$310K",
    growth: "+112%",
    status: "Raising",
  },
  {
    name: "Northbeam Robotics",
    sector: "Logistics Automation",
    stage: "Series B",
    revenue: "$8.1M",
    growth: "+38%",
    status: "Open to acquisition",
  },
];

const verificationDemo = [
  { label: "Founder identity", status: "Verified", tone: "positive" as const },
  { label: "Company formation", status: "Verified", tone: "positive" as const },
  { label: "Revenue", status: "Verified", tone: "positive" as const },
  { label: "Financial statements", status: "Under review", tone: "warn" as const },
  { label: "Customer metrics", status: "Pending", tone: "neutral" as const },
];

const founderSteps = [
  {
    n: "01",
    title: "Build your profile",
    body: "A guided, standardized profile — identity, story, metrics, team. Save drafts as you go; you decide what becomes public.",
  },
  {
    n: "02",
    title: "Report your metrics",
    body: "Dated, structured financial and operating metrics. History builds credibility that a pitch deck can't.",
  },
  {
    n: "03",
    title: "Generate your valuation",
    body: "A model-based, explainable estimate of your private market value — with confidence and data sufficiency stated plainly.",
  },
  {
    n: "04",
    title: "Verify your data",
    body: "Submit evidence and let verification badges do the talking. Verified data compounds trust with every update.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ================================ Hero ================================ */}
      <section className="relative overflow-hidden bg-ink-950 bg-grid-dark text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/60 to-transparent"
        />
        <Container className="relative grid gap-14 py-20 lg:grid-cols-[7fr_5fr] lg:items-center lg:gap-10 lg:py-28">
          <div>
            <p
              className="animate-fade-up text-xs font-semibold uppercase tracking-[0.28em] text-accent-300"
              style={{ animationDelay: "0ms" }}
            >
              Private Capital. Rebuilt.
            </p>
            <h1
              className="animate-fade-up mt-5 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              Discover. Value.
              <br />
              Own <em className="text-accent-300">what&rsquo;s next.</em>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/70"
              style={{ animationDelay: "240ms" }}
            >
              Vantor brings private-company discovery, standardized startup intelligence,
              valuation, and verification into one platform.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-wrap gap-3"
              style={{ animationDelay: "360ms" }}
            >
              <ButtonLink href="/companies" size="lg" variant="inverse">
                Explore Companies
              </ButtonLink>
              <ButtonLink
                href="/signup"
                size="lg"
                variant="ghost"
                className="border border-white/25 text-white hover:border-white/50 hover:bg-white/10 active:bg-white/15"
              >
                List Your Company
              </ButtonLink>
            </div>
          </div>
          <HeroDemo />
        </Container>
      </section>

      {/* ======================= Opacity statement ======================= */}
      <section className="border-b border-line bg-canvas">
        <Container className="py-20 sm:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-700">
              The problem
            </p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-tight text-ink-900 sm:text-5xl">
              Private companies shouldn&rsquo;t be <em>opaque.</em>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-650">
              Public markets run on standardized information. Private markets run on rumor,
              pitch decks, and whoever you happen to know. Vantor gives private companies the
              same legibility — structure, history, and evidence.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-10 border-t border-line pt-10 sm:grid-cols-3">
            {opacityPillars.map((p, i) => (
              <Reveal key={p.n} delay={i * 120}>
                <p className="text-sm font-medium text-accent-700 tabular-nums">{p.n}</p>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-ink-900">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ======================= Marketplace preview ======================= */}
      <section className="bg-paper">
        <Container className="py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:items-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-700">
                Discovery
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-ink-900">
                A discovery terminal for private companies.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-650">
                Search and filter by industry, stage, location, and intent. Compare revenue,
                growth, and verification at a glance — without ten empty metrics of noise.
              </p>
              <ButtonLink href="/companies" className="mt-7">
                Explore Companies
              </ButtonLink>
            </Reveal>
            <Reveal delay={150}>
              <div className="overflow-hidden rounded-lg border border-line shadow-raised">
                <div className="flex items-center justify-between border-b border-line bg-canvas px-4 py-2.5">
                  <p className="text-xs font-medium text-muted">
                    4 companies · Filtered: Raising, Seed–Series B
                  </p>
                  <p className="text-[11px] text-faint">Illustrative — fictional companies</p>
                </div>
                <ul aria-hidden="true" className="divide-y divide-line bg-paper">
                  {marketRows.map((row, i) => (
                    <li
                      key={row.name}
                      className="reveal-child grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1.3fr_1fr_4rem_4.5rem_3.5rem_auto]"
                      style={{ transitionDelay: `${250 + i * 100}ms` }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{row.name}</p>
                        <p className="text-xs text-muted sm:hidden">{row.sector}</p>
                      </div>
                      <p className="hidden text-xs text-muted sm:block">{row.sector}</p>
                      <p className="hidden text-xs text-muted sm:block">{row.stage}</p>
                      <p className="hidden text-right text-sm font-medium text-ink-900 tabular-nums sm:block">
                        {row.revenue}
                      </p>
                      <p className="text-right text-sm font-medium text-positive-700 tabular-nums">
                        {row.growth}
                      </p>
                      <span className="hidden items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-650 md:inline-flex">
                        <span
                          className={
                            row.status === "Not raising"
                              ? "size-1.5 rounded-full bg-faint"
                              : "size-1.5 rounded-full bg-accent-600"
                          }
                        />
                        {row.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ======================= Valuation demonstration ======================= */}
      <section className="bg-ink-950 bg-grid-dark text-white">
        <Container className="py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:items-center">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-300">
                Valuation
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight">
                Valuation, modeled — not proclaimed.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/65">
                Vantor&rsquo;s valuation engine estimates a private market range from reported
                data: revenue multiples, profitability, stage baselines. Every run is
                versioned, explainable, and honest about what it doesn&rsquo;t know.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-white/75">
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent-300" />
                  A range and confidence score — never a fake precise number
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent-300" />
                  Component models weighted and disclosed
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent-300" />
                  &ldquo;Insufficient data&rdquo; stated plainly when true
                </li>
              </ul>
            </Reveal>
            <ValuationDemo />
          </div>
        </Container>
      </section>

      {/* ====================== Verification demonstration ====================== */}
      <section className="border-b border-line bg-canvas">
        <Container className="py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-[3fr_2fr] lg:items-center">
            <Reveal className="order-2 lg:order-1">
              <div className="rounded-lg border border-line bg-paper p-6 shadow-card sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                    Data Verification
                  </p>
                  <p className="text-[11px] text-faint">AeroForge · illustrative</p>
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 tabular-nums">
                  82% Verified
                </p>
                <p className="mt-1 text-xs text-muted">
                  Share of submitted information verified by review
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist">
                  <div
                    className="reveal-bar h-full w-[82%] rounded-full bg-positive-700"
                    style={{ transitionDelay: "250ms" }}
                  />
                </div>
                <ul className="mt-5 divide-y divide-line border-t border-line">
                  {verificationDemo.map((row, i) => (
                    <li
                      key={row.label}
                      className="reveal-child flex items-center justify-between py-2.5"
                      style={{ transitionDelay: `${350 + i * 120}ms` }}
                    >
                      <span className="text-sm font-medium text-ink-900">{row.label}</span>
                      <span
                        className={
                          row.tone === "positive"
                            ? "inline-flex items-center gap-1.5 text-xs font-medium text-positive-700"
                            : row.tone === "warn"
                              ? "inline-flex items-center gap-1.5 text-xs font-medium text-warn-700"
                              : "inline-flex items-center gap-1.5 text-xs font-medium text-muted"
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
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-700">
                Verification
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-ink-900">
                Trust, built on evidence.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-650">
                Founders submit evidence — formation documents, revenue records, financial
                statements — and Vantor reviews it category by category. What&rsquo;s verified
                is marked. What isn&rsquo;t, isn&rsquo;t.
              </p>
              <p className="mt-3 text-base leading-relaxed text-slate-650">
                No scores from thin air. No checkmarks for self-reported claims.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ========================= Founder workflow ========================= */}
      <section className="bg-paper">
        <Container className="py-20 sm:py-28">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-700">
              For founders
            </p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight text-ink-900">
              Put your company on the map — on your terms.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {founderSteps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="border-t-2 border-ink-900 pt-4">
                  <p className="text-sm font-medium text-accent-700 tabular-nums">{s.n}</p>
                  <h3 className="mt-1.5 text-base font-semibold tracking-tight text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <ButtonLink href="/signup" className="mt-12">
              List Your Company
            </ButtonLink>
          </Reveal>
        </Container>
      </section>

      {/* ========================== Ownership vision ========================== */}
      <section className="border-y border-line bg-canvas">
        <Container className="py-20 sm:py-24">
          <Reveal className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent-700">
              Where this goes
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-ink-900 sm:text-5xl">
              The long-term goal: private ownership, <em>made legible.</em>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-650">
              Discovery, valuation, and verification are the foundation. As the platform
              matures, Vantor is being built toward a future where understanding — and one day
              holding — private ownership is as clear as the public markets. Deliberately, in
              stages, with the regulatory rails that future requires.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ============================= Final CTA ============================= */}
      <section className="relative overflow-hidden bg-ink-950 bg-grid-dark text-white">
        <Container className="relative py-20 text-center sm:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              The next great companies are already private. <em>Find them first.</em>
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/companies" size="lg" variant="inverse">
                Explore Companies
              </ButtonLink>
              <ButtonLink
                href="/signup"
                size="lg"
                variant="ghost"
                className="border border-white/25 text-white hover:border-white/50 hover:bg-white/10 active:bg-white/15"
              >
                List Your Company
              </ButtonLink>
            </div>
            <p className="mt-8 text-xs text-white/40">
              Free for founders ·{" "}
              <Link href="/companies" className="underline-offset-2 hover:underline">
                Browse without an account
              </Link>
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

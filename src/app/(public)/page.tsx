import { Container } from "@/components/layout/container";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { DEMO_COMPANIES, DEMO_SELECTED } from "@/components/marketing/demo-data";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Marketing landing page. One coherent dark environment: the page canvas
 * stays near-black throughout and sections separate with hairline dividers
 * and surface depth. The champagne metal appears only in the valuation
 * compositions. All product imagery is built from real product UI patterns
 * with clearly captioned example data.
 */

function SectionHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-bold tracking-[-0.02em] text-ink-900 sm:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-relaxed text-slate-650">{body}</p> : null}
    </div>
  );
}

function StatLabel({ children }: { children: React.ReactNode }) {
  return <dt className="text-[11px] font-medium text-faint">{children}</dt>;
}

function DemoVerificationRow({ label, status }: { label: string; status: string }) {
  const tone =
    status === "Verified"
      ? "text-positive-700"
      : status === "Under review"
        ? "text-warn-700"
        : "text-muted";
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-ink-800">{label}</span>
      <span className={cn("text-sm font-medium", tone)}>{status}</span>
    </li>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* -------------------------------- Hero -------------------------------- */}
      <section className="border-b border-line">
        <Container className="py-16 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div>
              <h1 className="text-4xl font-bold leading-[1.04] tracking-[-0.035em] text-ink-900 sm:text-5xl xl:text-[64px]">
                Research private companies in one place.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-650">
                Compare company data, review Vantor valuation estimates, and see which
                information has been verified.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/companies" size="lg">
                  Explore Companies
                </ButtonLink>
                <ButtonLink href="/signup" size="lg" variant="secondary">
                  List Your Company
                </ButtonLink>
              </div>
            </div>
            <div>
              <HeroPreview />
              <p className="mt-3 text-right text-[11px] text-faint">
                Product interface with example data.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------ Discover Private Companies ------------------------ */}
      <section className="border-b border-line">
        <Container className="py-24">
          <SectionHeading
            title="Discover private companies"
            body="Browse a marketplace of private companies with standardized data. Filter by industry, stage, and country; sort by revenue, growth, and estimated valuation."
          />
          <div className="mt-10 overflow-hidden rounded-xl border border-line bg-deep">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-medium text-faint">
                    <th scope="col" className="px-5 py-3 font-medium">Company</th>
                    <th scope="col" className="px-5 py-3 font-medium">Industry / Stage</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Revenue</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Growth</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Est. Valuation</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Verification</th>
                    <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {DEMO_COMPANIES.map((c) => (
                    <tr key={c.name} className="transition-colors hover:bg-mist">
                      <td className="px-5 py-3.5 font-semibold text-ink-900">{c.name}</td>
                      <td className="px-5 py-3.5 text-slate-650">
                        {c.industry} · {c.stage}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                        {c.revenue}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-positive-700 tabular-nums">
                        {c.growth}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                        {c.valuation}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                        {c.verification}
                      </td>
                      <td className="px-5 py-3.5 text-slate-650">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
              <p className="text-[11px] text-faint">Example data.</p>
              <ButtonLink href="/companies" variant="secondary" size="sm">
                Explore Companies
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------- Company Intelligence --------------------------- */}
      <section className="border-b border-line">
        <Container className="py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
            <SectionHeading
              title="Every company, presented the same way"
              body="Each profile covers the same ground: what the company does, its financial metrics with history, its team, and its current status. You can compare two companies directly."
            />
            <div className="rounded-xl border border-line bg-deep p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-4">
                <div>
                  <p className="text-lg font-bold tracking-tight text-ink-900">{DEMO_SELECTED.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {DEMO_SELECTED.industry} · {DEMO_SELECTED.stage} · Denver, US
                  </p>
                </div>
                <span className="rounded-full border border-line-strong bg-mist px-2 py-0.5 text-[11px] font-medium text-slate-650">
                  {DEMO_SELECTED.status}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 pt-5 sm:grid-cols-5">
                <div>
                  <StatLabel>Est. valuation</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">
                    {DEMO_SELECTED.valuation}
                  </dd>
                </div>
                <div>
                  <StatLabel>Revenue</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">
                    {DEMO_SELECTED.revenue}
                  </dd>
                </div>
                <div>
                  <StatLabel>Growth</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-positive-700 tabular-nums">
                    {DEMO_SELECTED.growth}
                  </dd>
                </div>
                <div>
                  <StatLabel>Raised</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">$2.5M</dd>
                </div>
                <div>
                  <StatLabel>Verification</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">
                    {DEMO_SELECTED.verification}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-faint">
                {["Overview", "Financials", "Valuation", "Verification", "Team"].map((tab, i) => (
                  <span key={tab} className={cn("font-medium", i === 0 ? "text-ink-900" : undefined)}>
                    {tab}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* -------------------------------- Valuation -------------------------------- */}
      <section className="border-b border-line">
        <Container className="py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
            <div className="order-2 rounded-xl border border-line bg-deep p-5 sm:p-6 lg:order-1">
              <p className="text-[11px] font-medium text-faint">
                Estimated private market valuation
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-brand-soft tabular-nums">
                {DEMO_SELECTED.valuation}
              </p>
              <div aria-hidden="true" className="mt-4">
                <div className="relative h-1.5 w-full rounded-full bg-raised">
                  <div className="gilded-range absolute inset-y-0 left-[30%] right-[15%] rounded-full" />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
                  <span>$3.0M</span>
                  <span>$6.0M</span>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
                <div>
                  <StatLabel>Midpoint</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">$4.6M</dd>
                </div>
                <div>
                  <StatLabel>Confidence</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">71%</dd>
                </div>
                <div>
                  <StatLabel>Data sufficiency</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900">Strong</dd>
                </div>
                <div>
                  <StatLabel>Updated</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">Aug 2026</dd>
                </div>
              </dl>
              <ul className="mt-5 divide-y divide-line border-t border-line text-sm">
                {[
                  ["Revenue model", "$4.1M to $5.0M"],
                  ["Stage model", "$3.8M to $4.9M"],
                  ["Profitability model", "Not applied"],
                  ["Comparable data", "Insufficient data"],
                  ["Risk adjustments", "-8%"],
                ].map(([label, value]) => (
                  <li key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-ink-800">{label}</span>
                    <span className="font-medium text-slate-650 tabular-nums">{value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] text-faint">Example data.</p>
            </div>
            <div className="order-1 lg:order-2">
              <SectionHeading
                title="See how Vantor calculated the estimate"
                body="Vantor estimates a valuation range for each company from its reported financials, stage, and risk profile. Every estimate shows its models, weights, confidence, and data sufficiency."
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------- Verification ------------------------------- */}
      <section className="border-b border-line">
        <Container className="py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
            <SectionHeading
              title="See which information has been verified"
              body="Companies submit evidence for identity, formation, revenue, and other categories. Vantor reviews the evidence and shows the status of each category, so you know which information has been reviewed and which is self-reported."
            />
            <div className="rounded-xl border border-line bg-deep p-5 sm:p-6">
              <div className="flex items-baseline gap-3 border-b border-line pb-4">
                <p className="text-3xl font-bold text-ink-900 tabular-nums">82%</p>
                <p className="text-sm text-muted">of submitted information verified</p>
              </div>
              <ul className="divide-y divide-line">
                <DemoVerificationRow label="Founder identity" status="Verified" />
                <DemoVerificationRow label="Company formation" status="Verified" />
                <DemoVerificationRow label="Revenue" status="Verified" />
                <DemoVerificationRow label="Financial statements" status="Under review" />
                <DemoVerificationRow label="Customer metrics" status="Pending" />
              </ul>
              <p className="mt-2 text-[11px] text-faint">Example data.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ----------------------------- Founder Experience ---------------------------- */}
      <section className="border-b border-line">
        <Container className="py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
            <SectionHeading
              title="Give investors the information they need"
              body="Founders control the profile: report metrics with history, request verification, generate a valuation estimate, and decide what becomes public. A task list shows what to complete next."
            />
            <div className="rounded-xl border border-line bg-deep p-5 sm:p-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                <div>
                  <StatLabel>Status</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900">Published</dd>
                </div>
                <div>
                  <StatLabel>Valuation midpoint</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">$4.6M</dd>
                </div>
                <div>
                  <StatLabel>Profile completeness</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">92%</dd>
                </div>
                <div>
                  <StatLabel>Verification</StatLabel>
                  <dd className="mt-1 text-sm font-semibold text-ink-900 tabular-nums">82%</dd>
                </div>
              </dl>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink-900">Next actions</p>
                <ul className="mt-2 space-y-2 text-sm text-ink-800">
                  {[
                    "Add current revenue data",
                    "Submit formation documents",
                    "Review public profile",
                  ].map((action) => (
                    <li key={action} className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-faint" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-[11px] text-faint">Example data.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------------- Final CTA --------------------------------- */}
      <section>
        <Container className="py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-ink-900 sm:text-4xl">
              Explore private companies on Vantor.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-650">
              Browse standardized company profiles, or list your own company and control how it
              is presented.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/companies" size="lg">
                Explore Companies
              </ButtonLink>
              <ButtonLink href="/signup" size="lg" variant="secondary">
                List Your Company
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

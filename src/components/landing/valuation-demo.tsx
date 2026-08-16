import { Reveal } from "@/components/ui/reveal";

/**
 * Valuation demonstration panel (dark section). The range bar and component
 * rows join the scroll reveal via the `.reveal-child` / `.reveal-bar` hooks.
 * Fictional company; all figures illustrative.
 */

const components = [
  { label: "Revenue Multiple Model", range: "$4.1M – $5.3M", weight: "55%" },
  { label: "Stage Baseline Model", range: "$3.8M – $4.6M", weight: "30%" },
  { label: "Profitability Model", range: "Not applied — pre-profit", weight: null },
  { label: "Comparable Transactions", range: "Insufficient comparable data", weight: null },
] as const;

export function ValuationDemo() {
  return (
    <Reveal className="rounded-lg border border-white/10 bg-ink-800/80 p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
          Estimated Private Market Valuation
        </p>
        <p className="text-[11px] text-white/40">AeroForge · illustrative</p>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl">
        $4.2M – $5.1M
      </p>

      <div className="mt-5">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="reveal-bar absolute inset-y-0 left-[8%] w-[84%] rounded-full bg-accent-500"
            style={{ transitionDelay: "250ms" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/50 tabular-nums">
          <span>$4.2M</span>
          <span className="font-medium text-white">Midpoint $4.65M</span>
          <span>$5.1M</span>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
        {components.map((c, i) => (
          <li
            key={c.label}
            className="reveal-child flex items-center justify-between gap-4 py-3"
            style={{ transitionDelay: `${350 + i * 120}ms` }}
          >
            <span className="text-sm text-white/80">{c.label}</span>
            {c.weight ? (
              <span className="text-sm font-medium text-white tabular-nums">
                {c.range}
                <span className="ml-2 font-normal text-white/45">{c.weight}</span>
              </span>
            ) : (
              <span className="text-xs text-white/40">{c.range}</span>
            )}
          </li>
        ))}
      </ul>

      <div
        className="reveal-child mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-4"
        style={{ transitionDelay: "800ms" }}
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
            Confidence
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">61 / 100</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
            Data sufficiency
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">Moderate</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">
            Methodology
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">Versioned · explainable</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-white/40">
        Model estimate generated from company-reported data. Not a traded price, an offer, or
        investment advice.
      </p>
    </Reveal>
  );
}

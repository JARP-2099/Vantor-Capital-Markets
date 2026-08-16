import { ConfidenceBand, RangeBar, SegmentedBar } from "@/components/ui/charts";

/**
 * Hero product visualization — a LARGE, realistic Vantor research panel for
 * the fictional AeroForge: identity, valuation range (bullet), estimate
 * history (confidence band), metrics, verification completeness. Pure CSS
 * entrance animations; server-rendered; reduced-motion collapses all of it.
 */

const historyPoints = [
  { x: 0, low: 2.6, mid: 3.0, high: 3.4 },
  { x: 0.28, low: 3.0, mid: 3.45, high: 3.9 },
  { x: 0.55, low: 3.3, mid: 3.9, high: 4.5 },
  { x: 0.8, low: 3.9, mid: 4.35, high: 4.8 },
  { x: 1, low: 4.2, mid: 4.65, high: 5.1 },
];

export function HeroDemo() {
  return (
    <div aria-hidden="true" className="relative select-none">
      <div
        className="animate-fade-up rounded-xl border border-white/10 bg-night-900/80 shadow-raised backdrop-blur-sm"
        style={{ animationDelay: "200ms" }}
      >
        {/* Panel header — company identity */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-600 text-base font-extrabold text-white">
              A
            </div>
            <div>
              <p className="text-base font-bold text-white">AeroForge</p>
              <p className="text-xs text-white/50">Defense Technology · Seed · Colorado Springs</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white">
            <span className="size-1.5 rounded-full bg-positive-400" />
            82% Verified
          </span>
        </div>

        {/* Valuation */}
        <div className="px-6 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Estimated Private Market Valuation
            </p>
            <p className="text-[11px] text-white/40">Confidence 61/100</p>
          </div>
          <p
            className="animate-fade-up mt-2 text-4xl font-extrabold tracking-tight text-white tabular-nums"
            style={{ animationDelay: "450ms" }}
          >
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
            surface="dark"
          />
        </div>

        {/* Estimate history */}
        <div className="px-6 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
            Estimate history
          </p>
          <div className="animate-fade-in mt-2" style={{ animationDelay: "700ms" }}>
            <ConfidenceBand
              points={historyPoints}
              label="Estimated valuation range over five runs, rising from about $3M to $4.65M midpoint"
              height={110}
              surface="dark"
            />
          </div>
        </div>

        {/* Metrics row */}
        <dl className="mx-6 mt-5 grid grid-cols-3 gap-4 border-t border-white/10 py-4">
          {[
            { label: "ARR", value: "$580K" },
            { label: "Growth (YoY)", value: "+74%", positive: true },
            { label: "Raised", value: "$1.2M" },
          ].map((m, i) => (
            <div key={m.label} className="animate-fade-up" style={{ animationDelay: `${800 + i * 100}ms` }}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {m.label}
              </dt>
              <dd
                className={
                  m.positive
                    ? "mt-1 text-lg font-bold text-positive-400 tabular-nums"
                    : "mt-1 text-lg font-bold text-white tabular-nums"
                }
              >
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Verification strip */}
        <div className="border-t border-white/10 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Data Verification
            </p>
            <p className="text-[11px] text-white/40">5 of 6 submitted categories verified</p>
          </div>
          <SegmentedBar
            className="mt-2.5"
            surface="dark"
            segments={[
              { tone: "positive" },
              { tone: "positive" },
              { tone: "positive" },
              { tone: "positive" },
              { tone: "positive" },
              { tone: "warn" },
            ]}
          />
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-white/35">
        Illustrative example — fictional company
      </p>
    </div>
  );
}

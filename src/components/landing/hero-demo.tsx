/**
 * Hero product composition: a fictional company (AeroForge) rendered in real
 * Vantor UI language — company card, valuation range, verification states —
 * layered with depth and staggered CSS entrance animations. Server-rendered;
 * all motion is pure CSS (`animate-fade-up`, `animate-grow-bar`,
 * `animate-fade-in`) and collapses under prefers-reduced-motion.
 */

const verificationRows = [
  { label: "Founder identity", status: "Verified", tone: "positive" },
  { label: "Revenue", status: "Verified", tone: "positive" },
  { label: "Financial statements", status: "Under review", tone: "warn" },
] as const;

export function HeroDemo() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none lg:max-w-none">
      {/* Company card */}
      <div
        className="animate-fade-up relative z-10 rounded-lg border border-white/10 bg-ink-800/90 p-5 shadow-raised"
        style={{ animationDelay: "150ms" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">AeroForge</p>
            <p className="mt-0.5 text-xs text-white/55">Defense Technology · Seed · Denver, CO</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80">
            <span className="size-1.5 rounded-full bg-positive-700" />
            82% Verified
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-white/45">
              Revenue
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-white tabular-nums">$580K</dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-white/45">
              Growth
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-positive-700 tabular-nums brightness-150">
              +74%
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-white/45">
              Raised
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-white tabular-nums">$1.2M</dd>
          </div>
        </dl>
      </div>

      {/* Valuation panel */}
      <div
        className="animate-fade-up relative z-20 mx-3 -mt-1 rounded-lg border border-line bg-paper p-5 shadow-raised sm:mx-6"
        style={{ animationDelay: "450ms" }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Estimated Private Market Valuation
        </p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900 tabular-nums">
          $4.2M – $5.1M
        </p>
        <div className="mt-3">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-mist">
            <div
              className="animate-grow-bar absolute inset-y-0 left-[8%] w-[84%] origin-left rounded-full bg-accent-600"
              style={{ animationDelay: "800ms" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted tabular-nums">
            <span>Low $4.2M</span>
            <span className="font-medium text-ink-900">Mid $4.65M</span>
            <span>High $5.1M</span>
          </div>
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[10px] leading-relaxed text-muted">
          Model estimate from reported data · Confidence 61 · Not a traded price
        </p>
      </div>

      {/* Verification panel */}
      <div
        className="animate-fade-up relative z-30 mx-8 -mt-1 rounded-lg border border-line bg-paper p-4 shadow-raised sm:mx-14"
        style={{ animationDelay: "700ms" }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
          Data Verification
        </p>
        <ul className="mt-2 divide-y divide-line">
          {verificationRows.map((row, i) => (
            <li
              key={row.label}
              className="animate-fade-in flex items-center justify-between py-1.5"
              style={{ animationDelay: `${1000 + i * 220}ms` }}
            >
              <span className="text-xs font-medium text-ink-900">{row.label}</span>
              <span
                className={
                  row.tone === "positive"
                    ? "inline-flex items-center gap-1.5 text-[11px] font-medium text-positive-700"
                    : "inline-flex items-center gap-1.5 text-[11px] font-medium text-warn-700"
                }
              >
                <span
                  className={
                    row.tone === "positive"
                      ? "size-1.5 rounded-full bg-positive-700"
                      : "size-1.5 rounded-full bg-warn-700"
                  }
                />
                {row.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-center text-[11px] text-white/40">
        Illustrative example — fictional company
      </p>
    </div>
  );
}

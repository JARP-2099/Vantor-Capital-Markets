import { CompanyMark } from "@/components/marketplace/company-mark";
import { RangeBar, SegmentedBar } from "@/components/ui/charts";
import { cn } from "@/lib/cn";
import { ILLUSTRATIVE_COMPANIES } from "./illustrative";

/**
 * Hero product composition — a faithful, static rendering of the Vantor
 * marketplace: result list on the left, the selected company's research
 * panel on the right (V3 §26). Decorative (aria-hidden) with a text
 * caption; every figure belongs to labeled fictional companies.
 */

const MONO_LABEL = "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted";

const rows = ILLUSTRATIVE_COMPANIES.slice(0, 5);
const selected = rows[0];

const statusTone: Record<string, string> = {
  "Seeking Capital": "bg-accent-600",
  "Open to Offers": "bg-accent-600",
  "Not Raising": "bg-faint",
};

export function ProductFrame({ className }: { className?: string }) {
  return (
    <figure className={cn("min-w-0", className)}>
      <div
        aria-hidden="true"
        className="shadow-frame overflow-hidden rounded-xl border border-line bg-paper"
      >
        {/* ------------------------------ App bar ------------------------------ */}
        <div className="flex h-11 items-center justify-between gap-4 border-b border-line px-4">
          <div className="flex items-center gap-5">
            <span className="text-[11px] font-bold tracking-[0.18em] text-ink-900">VANTOR</span>
            <span className="hidden border-b-2 border-accent-600 pb-0.5 text-xs font-semibold text-ink-900 sm:inline-block">
              Discover
            </span>
          </div>
          <div className="flex h-7 w-40 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 sm:w-56">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="shrink-0 text-faint">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="truncate text-[11px] text-faint">Search companies</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
          {/* ---------------------------- Result list ---------------------------- */}
          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-center gap-x-3 border-b border-line bg-canvas px-4 py-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_3.5rem_6.5rem]">
              <span className={MONO_LABEL}>Company</span>
              <span className={cn(MONO_LABEL, "text-right")}>Revenue</span>
              <span className={cn(MONO_LABEL, "text-right")}>Growth</span>
              <span className={cn(MONO_LABEL, "hidden sm:block")}>Status</span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((c, i) => (
                <li
                  key={c.name}
                  className={cn(
                    "relative grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem] items-center gap-x-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_4.5rem_3.5rem_6.5rem]",
                    i === 0 && "bg-accent-50/60",
                  )}
                >
                  {i === 0 ? (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-accent-600" />
                  ) : null}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CompanyMark name={c.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink-900">{c.name}</p>
                      <p className="truncate text-[11px] text-muted">
                        {c.industry} · {c.stage}
                      </p>
                    </div>
                  </div>
                  <p className="text-right text-xs font-semibold text-ink-900 tabular-nums">
                    {c.revenue}
                  </p>
                  <p className="text-right text-xs font-semibold text-positive-700 tabular-nums">
                    {c.growth}
                  </p>
                  <p className="hidden items-center gap-1.5 text-[11px] font-medium text-slate-650 sm:flex">
                    <span className={cn("size-1.5 shrink-0 rounded-full", statusTone[c.status])} />
                    <span className="truncate">{c.status}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* --------------------------- Company panel --------------------------- */}
          <div className="hidden min-w-0 border-l border-line lg:block">
            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <CompanyMark name={selected.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-ink-900">{selected.name}</p>
                  <p className="truncate text-xs text-muted">
                    {selected.stage} · {selected.industry} · {selected.hq}
                  </p>
                </div>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-650">{selected.oneLiner}</p>
            </div>
            <div className="px-5 py-4">
              <p className={MONO_LABEL}>Estimated Private Market Valuation</p>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-ink-900 tabular-nums">
                {selected.valuation}
              </p>
              <RangeBar className="mt-2.5" bandStart={0.1} bandEnd={0.9} mid={0.48} />
              <dl className="mt-4 grid grid-cols-3 divide-x divide-line border-y border-line">
                {[
                  { label: "Revenue", value: selected.revenue },
                  { label: "Growth (YoY)", value: selected.growth },
                  { label: "Raised", value: "$2.5M" },
                ].map((m, i) => (
                  <div key={m.label} className={cn("py-2.5", i > 0 && "pl-4")}>
                    <dt className={MONO_LABEL}>{m.label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink-900 tabular-nums">
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={MONO_LABEL}>Data Verification</p>
                  <p className="text-xs font-semibold text-ink-900 tabular-nums">
                    {selected.verifiedPct}% verified
                  </p>
                </div>
                <SegmentedBar
                  className="mt-2"
                  segments={[
                    { tone: "positive" },
                    { tone: "positive" },
                    { tone: "positive" },
                    { tone: "warn" },
                    { tone: "neutral" },
                  ]}
                />
              </div>
              <span className="mt-5 inline-flex h-8 items-center rounded-md bg-accent-600 px-3.5 text-xs font-semibold text-white">
                View company
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-faint">
        Illustrative — fictional companies shown.
      </figcaption>
    </figure>
  );
}

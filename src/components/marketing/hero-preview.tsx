import { cn } from "@/lib/cn";
import { DEMO_COMPANIES, DEMO_SELECTED } from "./demo-data";

/**
 * Large marketplace composition for the landing hero: search and company
 * list on the left, the selected company profile on the right. Static and
 * presentational; captioned as illustrative where it is used.
 */

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line-strong bg-mist px-2 py-0.5 text-[11px] font-medium text-slate-650">
      {label}
    </span>
  );
}

function GildedRangeBar() {
  return (
    <div aria-hidden="true" className="mt-3">
      <div className="relative h-1.5 w-full rounded-full bg-raised">
        <div className="gilded-range absolute inset-y-0 left-[32%] right-[18%] rounded-full" />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint tabular-nums">
        <span>$3.0M</span>
        <span>$6.0M</span>
      </div>
    </div>
  );
}

export function HeroPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-deep shadow-raised">
      {/* Window chrome strip */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="text-[11px] font-semibold tracking-[0.22em] text-faint">VANTOR</span>
        <span className="text-[11px] text-faint">Discover</span>
      </div>

      <div className="flex">
        {/* Left pane: search + companies */}
        <div className="hidden w-[240px] shrink-0 border-r border-line sm:block">
          <div className="border-b border-line p-3">
            <div className="flex h-8 items-center gap-2 rounded-md border border-line-strong bg-mist px-2.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-faint">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-faint">Search companies</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <StatusChip label="Industry" />
              <StatusChip label="Stage" />
              <StatusChip label="Valuation" />
            </div>
          </div>
          <ul className="divide-y divide-line">
            {DEMO_COMPANIES.slice(0, 6).map((c) => {
              const selected = c.name === DEMO_SELECTED.name;
              return (
                <li
                  key={c.name}
                  className={cn(
                    "px-3 py-2.5",
                    selected && "border-l-2 border-l-brand bg-mist",
                    !selected && "border-l-2 border-l-transparent",
                  )}
                >
                  <p className={cn("truncate text-xs font-semibold", selected ? "text-ink-900" : "text-slate-650")}>
                    {c.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-faint">
                    {c.industry} · {c.stage}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right pane: selected company profile */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold tracking-tight text-ink-900">
                {DEMO_SELECTED.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {DEMO_SELECTED.industry} · {DEMO_SELECTED.stage}
              </p>
            </div>
            <StatusChip label={DEMO_SELECTED.status} />
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4">
            <div>
              <dt className="text-[10px] font-medium text-faint">Revenue</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900 tabular-nums">
                {DEMO_SELECTED.revenue}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-faint">Growth</dt>
              <dd className="mt-0.5 text-sm font-semibold text-positive-700 tabular-nums">
                {DEMO_SELECTED.growth}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium text-faint">Verification</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink-900 tabular-nums">
                {DEMO_SELECTED.verification}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-lg border border-line bg-paper p-3.5">
            <p className="text-[10px] font-medium text-faint">Estimated valuation</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-brand-soft tabular-nums">
              {DEMO_SELECTED.valuation}
            </p>
            <GildedRangeBar />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-md border border-line bg-paper px-2.5 py-2">
              <p className="text-faint">Founder identity</p>
              <p className="mt-0.5 font-medium text-positive-700">Verified</p>
            </div>
            <div className="rounded-md border border-line bg-paper px-2.5 py-2">
              <p className="text-faint">Revenue</p>
              <p className="mt-0.5 font-medium text-positive-700">Verified</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <span className="inline-flex h-8 items-center rounded-md bg-ink-900 px-3 text-xs font-medium text-canvas">
              View Company
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

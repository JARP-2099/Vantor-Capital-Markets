import Link from "next/link";
import { CompanyMark } from "@/components/marketplace/company-mark";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";
import { ILLUSTRATIVE_COMPANIES } from "./illustrative";

/**
 * First marketplace section — the landing's proof that Vantor is a real
 * discovery product. Standardized opportunity rows (V3 §7), not cards:
 * identity + thesis on the left, aligned financial columns on the right.
 * All companies fictional, captioned as such; rows link into the live
 * marketplace.
 */

const MONO_LABEL = "font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted";

const statusDot: Record<string, string> = {
  "Seeking Capital": "bg-accent-600",
  "Open to Offers": "bg-accent-600",
  "Not Raising": "bg-faint",
};

const COLS =
  "lg:grid lg:grid-cols-[minmax(0,10fr)_minmax(0,6fr)_5.5rem_4.5rem_8rem_8.5rem] lg:items-center lg:gap-x-6";

export function FeaturedCompanies() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper shadow-card">
      <div aria-hidden="true" className={cn("hidden border-b border-line bg-canvas px-5 py-2.5", COLS)}>
        <span className={MONO_LABEL}>Company</span>
        <span className={MONO_LABEL}>Industry · Stage</span>
        <span className={cn(MONO_LABEL, "text-right")}>Revenue</span>
        <span className={cn(MONO_LABEL, "text-right")}>Growth</span>
        <span className={cn(MONO_LABEL, "text-right")}>Est. Valuation</span>
        <span className={MONO_LABEL}>Status</span>
      </div>
      <Reveal as="ul" className="divide-y divide-line">
        {ILLUSTRATIVE_COMPANIES.map((c, i) => (
          <li key={c.name} className="reveal-child" style={{ transitionDelay: `${i * 70}ms` }}>
            <Link
              href="/companies"
              className={cn("group block px-4 py-4 transition-colors hover:bg-canvas sm:px-5", COLS)}
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <CompanyMark name={c.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-ink-900 group-hover:text-accent-700">
                    {c.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-650">{c.oneLiner}</p>
                </div>
              </div>
              <div className="mt-1.5 min-w-0 pl-[3.375rem] lg:mt-0 lg:pl-0">
                <p className="truncate text-sm text-slate-650">
                  {c.industry} · {c.stage}
                </p>
                <p className="mt-0.5 hidden truncate text-xs text-muted lg:block">
                  {c.hq} · {c.verifiedPct}% verified
                </p>
              </div>
              {/* Desktop financial columns */}
              <p className="hidden text-right text-sm font-semibold text-ink-900 tabular-nums lg:block">
                {c.revenue}
              </p>
              <p className="hidden text-right text-sm font-semibold text-positive-700 tabular-nums lg:block">
                {c.growth}
              </p>
              <p className="hidden text-right text-sm font-semibold text-ink-900 tabular-nums lg:block">
                {c.valuation}
              </p>
              <p className="hidden items-center gap-1.5 text-xs font-medium text-slate-650 lg:flex">
                <span className={cn("size-1.5 shrink-0 rounded-full", statusDot[c.status])} />
                <span className="truncate">{c.status}</span>
              </p>
              {/* Mobile metric line */}
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 pl-[3.375rem] lg:hidden">
                <span className="text-sm tabular-nums">
                  <span className={MONO_LABEL}>Rev</span>{" "}
                  <span className="font-semibold text-ink-900">{c.revenue}</span>
                </span>
                <span className="text-sm tabular-nums">
                  <span className={MONO_LABEL}>Growth</span>{" "}
                  <span className="font-semibold text-positive-700">{c.growth}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-650">
                  <span className={cn("size-1.5 rounded-full", statusDot[c.status])} />
                  {c.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </Reveal>
    </div>
  );
}

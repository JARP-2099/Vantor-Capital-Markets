import Link from "next/link";
import type { CompanyMetricRow, CompanyRow } from "@/db/queries/companies";
import type { ValuationRunRow } from "@/db/queries/valuations";
import { cn } from "@/lib/cn";
import { STAGE_LABELS, type CompanyIntent, type MetricType } from "@/lib/constants";
import { formatCompactCurrency } from "@/lib/format";
import { pickGrowthMetric, pickPublicIntent, pickRevenueMetric } from "./metrics";

/**
 * Dark table/list hybrid for the Discover marketplace: a dense financial
 * table on desktop, structured result blocks on mobile. No avatars, no
 * cards — company names stand on their own. Unknown values render as an
 * en dash, never a fabricated zero.
 */

export type CompanyListItem = {
  company: CompanyRow;
  metrics: Map<MetricType, CompanyMetricRow> | undefined;
  intents: readonly CompanyIntent[];
  valuation: ValuationRunRow | null;
  verificationPct: number | null;
};

function valuationRange(run: ValuationRunRow | null): string | null {
  if (!run) return null;
  const low = Number(run.valuationLow);
  const high = Number(run.valuationHigh);
  if (Number.isFinite(low) && Number.isFinite(high)) {
    return `${formatCompactCurrency(low, run.currency)} to ${formatCompactCurrency(high, run.currency)}`;
  }
  const mid = Number(run.valuationMid);
  return Number.isFinite(mid) ? formatCompactCurrency(mid, run.currency) : null;
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-line-strong bg-mist px-2 py-0.5 text-[11px] font-medium text-slate-650">
      {label}
    </span>
  );
}

const growthClass = (tone: "default" | "positive" | "negative") =>
  tone === "positive"
    ? "text-positive-700"
    : tone === "negative"
      ? "text-negative-700"
      : "text-ink-900";

export function CompanyTable({ items }: { items: CompanyListItem[] }) {
  const rows = items.map(({ company, metrics, intents, valuation, verificationPct }) => {
    const stageLabel = company.stage ? STAGE_LABELS[company.stage] : null;
    return {
      company,
      stageLabel,
      industryStage: [company.industry, stageLabel].filter(Boolean).join(" · "),
      revenue: pickRevenueMetric(metrics),
      growth: pickGrowthMetric(metrics),
      valuation: valuationRange(valuation),
      verificationPct,
      status: pickPublicIntent(intents),
    };
  });

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-paper">
      {/* Desktop: dense financial table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
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
            {rows.map((row) => (
              <tr key={row.company.id} className="group transition-colors hover:bg-mist">
                <td className="max-w-64 px-5 py-3.5">
                  <Link
                    href={`/companies/${row.company.slug}`}
                    className="font-semibold text-ink-900 group-hover:text-ink-950"
                  >
                    {row.company.name}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-slate-650">{row.industryStage || "–"}</td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                  {row.revenue?.value ?? <span className="font-normal text-faint">–</span>}
                </td>
                <td
                  className={cn(
                    "px-5 py-3.5 text-right font-medium tabular-nums",
                    row.growth ? growthClass(row.growth.tone) : undefined,
                  )}
                >
                  {row.growth?.value ?? <span className="font-normal text-faint">–</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                  {row.valuation ?? <span className="font-normal text-faint">–</span>}
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                  {row.verificationPct !== null ? (
                    `${row.verificationPct}%`
                  ) : (
                    <span className="font-normal text-faint">–</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {row.status ? <StatusChip label={row.status.label} /> : <span className="text-faint">–</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: structured result blocks (no horizontal scroll) */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.company.id}>
            <Link
              href={`/companies/${row.company.slug}`}
              className="block px-4 py-4 transition-colors hover:bg-mist"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{row.company.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{row.industryStage}</p>
                </div>
                {row.status ? <StatusChip label={row.status.label} /> : null}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-[10px] font-medium text-faint">Est. valuation</dt>
                  <dd className="mt-0.5 font-medium text-ink-900 tabular-nums">
                    {row.valuation ?? <span className="font-normal text-faint">–</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-faint">
                    Revenue
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink-900 tabular-nums">
                    {row.revenue?.value ?? <span className="font-normal text-faint">–</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-faint">
                    Growth
                  </dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-medium tabular-nums",
                      row.growth ? growthClass(row.growth.tone) : "font-normal text-faint",
                    )}
                  >
                    {row.growth?.value ?? "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-faint">
                    Verification
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink-900 tabular-nums">
                    {row.verificationPct !== null ? (
                      `${row.verificationPct}%`
                    ) : (
                      <span className="font-normal text-faint">–</span>
                    )}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

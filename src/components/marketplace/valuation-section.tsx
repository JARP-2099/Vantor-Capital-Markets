import { Card } from "@/components/ui/card";
import { MetricStat } from "@/components/ui/metric-stat";
import type { ValuationComponentRow, ValuationRunRow } from "@/db/queries/valuations";
import { formatCompactCurrency, formatDate } from "@/lib/format";

/**
 * Public profile valuation section. Server-safe presentation only — callers
 * pass a completed run (visibility already enforced upstream). Deliberately
 * unlike stock-price UI: neutral ink, no gain/loss coloring, no change
 * badges — this is a model estimate, not a traded price.
 */

const COMPONENT_ORDER: string[] = [
  "revenue_multiple",
  "profitability",
  "stage_baseline",
  "comparables",
];

const COMPONENT_LABELS: Record<string, string> = {
  revenue_multiple: "Revenue Multiple Model",
  profitability: "Profitability Model",
  stage_baseline: "Stage Baseline Model",
  comparables: "Comparable Transactions",
};

const SUFFICIENCY_LABELS: Record<string, string> = {
  strong: "Strong",
  moderate: "Moderate",
  limited: "Limited",
  insufficient: "Insufficient",
};

/** Defensive numeric-string parse; unparseable values are omitted, never NaN. */
function num(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function detailReason(row: ValuationComponentRow): string | null {
  const detail = row.detail as { reason?: unknown } | null;
  return typeof detail?.reason === "string" ? detail.reason : null;
}

type HistoryPoint = { date: Date; mid: number; currency: string };

/**
 * Inline midpoint sparkline. Pure SVG, neutral ink, no axes or gain/loss
 * styling; the adjacent table is the accessible/data view, and the aria-label
 * narrates first and latest values.
 */
function MidpointSparkline({ points }: { points: HistoryPoint[] }) {
  const width = 480;
  const height = 60;
  const pad = 6;
  const first = points[0];
  const last = points[points.length - 1];
  const mids = points.map((p) => p.mid);
  const min = Math.min(...mids);
  const max = Math.max(...mids);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - 2 * pad)) / (points.length - 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.mid).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Vantor estimated midpoint moved from ${formatCompactCurrency(first.mid, first.currency)} on ${formatDate(first.date)} to ${formatCompactCurrency(last.mid, last.currency)} on ${formatDate(last.date)}, across ${points.length} estimates.`}
      className="h-[60px] w-full text-ink-900"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function ValuationSection({
  run,
  components,
  history,
}: {
  run: ValuationRunRow;
  components: ValuationComponentRow[];
  history: ValuationRunRow[];
}) {
  const currency = run.currency;
  const low = num(run.valuationLow);
  const high = num(run.valuationHigh);
  const mid = num(run.valuationMid);
  const range =
    low !== null && high !== null
      ? `${formatCompactCurrency(low, currency)} – ${formatCompactCurrency(high, currency)}`
      : mid !== null
        ? formatCompactCurrency(mid, currency)
        : null;

  const ordered = [...components].sort(
    (a, b) => COMPONENT_ORDER.indexOf(a.componentKey) - COMPONENT_ORDER.indexOf(b.componentKey),
  );

  // Oldest first from the query layer; keep only chart-safe points.
  const points: HistoryPoint[] = history.flatMap((r) => {
    const m = num(r.valuationMid);
    return m !== null ? [{ date: r.createdAt, mid: m, currency: r.currency }] : [];
  });
  const showHistory = points.length >= 2;

  return (
    <div className="mt-5 space-y-5">
      {/* ---------------------------- Headline band ---------------------------- */}
      <Card className="p-5">
        {range ? (
          <p className="text-2xl font-bold tracking-tight text-ink-900 tabular-nums sm:text-3xl">
            {range}
          </p>
        ) : null}
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <MetricStat
            className="tabular-nums"
            label="Midpoint"
            value={mid !== null ? formatCompactCurrency(mid, currency) : null}
          />
          <MetricStat
            className="tabular-nums"
            label="Confidence"
            value={run.confidence !== null ? `${run.confidence}%` : null}
          />
          <MetricStat
            label="Data Quality"
            value={SUFFICIENCY_LABELS[run.dataSufficiency] ?? null}
          />
          <MetricStat
            className="tabular-nums"
            label="Last updated"
            value={formatDate(run.createdAt)}
          />
        </dl>
      </Card>

      {/* -------------------------- Estimate Breakdown ------------------------- */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Estimate Breakdown
        </h3>
        <div className="mt-1 divide-y divide-line">
          {ordered.map((row) => {
            const label = COMPONENT_LABELS[row.componentKey] ?? row.componentKey;
            const reason = detailReason(row);
            if (row.status === "applied") {
              const cLow = num(row.valuationLow);
              const cHigh = num(row.valuationHigh);
              const weight = num(row.weight);
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <p className="text-sm font-medium text-ink-900">{label}</p>
                  <p className="text-sm font-semibold text-ink-900 tabular-nums">
                    {cLow !== null && cHigh !== null
                      ? `${formatCompactCurrency(cLow, currency)} – ${formatCompactCurrency(cHigh, currency)}`
                      : null}
                    {weight !== null ? (
                      <span className="ml-2 font-normal text-muted">
                        {Math.round(weight * 100)}% weight
                      </span>
                    ) : null}
                  </p>
                </div>
              );
            }
            return (
              <div key={row.id} className="py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="text-xs text-faint">
                    {row.status === "not_applicable" ? "Not applicable" : "Insufficient data"}
                    {reason ? ` — ${reason}` : null}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ---------------------------- History ---------------------------- */}
      {showHistory ? (
        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Vantor Estimated Private Market Valuation
          </h3>
          <p className="mt-1 text-xs text-faint">
            Model-estimated midpoints over time — not a traded price.
          </p>
          <div className="mt-4">
            <MidpointSparkline points={points} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-64 text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Date
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Estimated midpoint
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...points].reverse().map((point) => (
                  <tr key={point.date.toISOString()}>
                    <td className="py-2 pr-4 text-muted tabular-nums">
                      {formatDate(point.date)}
                    </td>
                    <td className="py-2 text-right font-medium text-ink-900 tabular-nums">
                      {formatCompactCurrency(point.mid, point.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <p className="text-xs leading-relaxed text-faint">
        Estimate generated by the Vantor valuation model ({run.engineVersion}) from
        company-reported data. Not investment advice.
      </p>
    </div>
  );
}

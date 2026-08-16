import { MetricStat } from "@/components/ui/metric-stat";
import type { ValuationComponentRow, ValuationRunRow } from "@/db/queries/valuations";
import { formatCompactCurrency, formatDate } from "@/lib/format";

/**
 * Public profile valuation section. Server-safe presentation only — callers
 * pass a completed run (visibility already enforced upstream). This is the
 * one surface that uses the gilded copper accent: a model estimate range,
 * deliberately not styled like a traded price (no gain/loss coloring, no
 * change badges).
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

/**
 * Gilded range bar: the estimate range drawn on a padded axis from
 * 0.8×low to 1.2×high, with a midpoint tick. Pure presentation of real
 * model output — no invented axis data beyond the padding.
 */
function GildedRangeBar({
  low,
  high,
  mid,
  currency,
}: {
  low: number;
  high: number;
  mid: number | null;
  currency: string;
}) {
  const axisMin = low * 0.8;
  const axisMax = high * 1.2;
  const span = axisMax - axisMin || 1;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - axisMin) / span) * 100));
  return (
    <div aria-hidden="true" className="mt-4 max-w-xl">
      <div className="relative h-2 w-full rounded-full bg-raised">
        <div
          className="gilded-range absolute inset-y-0 rounded-full"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        {mid !== null ? (
          <span
            className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-ink-950"
            style={{ left: `${pct(mid)}%` }}
          />
        ) : null}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-faint tabular-nums">
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(low)}%` }}>
          {formatCompactCurrency(low, currency)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(high)}%` }}>
          {formatCompactCurrency(high, currency)}
        </span>
      </div>
    </div>
  );
}

type HistoryPoint = { date: Date; mid: number; currency: string };

/**
 * Midpoint history line: restrained copper on a dark panel with thin grid
 * lines. The adjacent table is the accessible/data view; the aria-label
 * narrates first and latest values. Renders only when real history exists.
 */
function MidpointSparkline({ points }: { points: HistoryPoint[] }) {
  const width = 480;
  const height = 96;
  const pad = 8;
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
  const gridYs = [0.25, 0.5, 0.75].map((t) => pad + t * (height - 2 * pad));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Vantor estimated midpoint moved from ${formatCompactCurrency(first.mid, first.currency)} on ${formatDate(first.date)} to ${formatCompactCurrency(last.mid, last.currency)} on ${formatDate(last.date)}, across ${points.length} estimates.`}
      className="h-24 w-full"
    >
      {gridYs.map((gy) => (
        <line
          key={gy}
          x1={pad}
          x2={width - pad}
          y1={gy}
          y2={gy}
          stroke="var(--color-line)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path
        d={d}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth={1.5}
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
      ? `${formatCompactCurrency(low, currency)} to ${formatCompactCurrency(high, currency)}`
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
    <div className="mt-5 space-y-6">
      {/* ---------------------------- Headline band ---------------------------- */}
      <div className="rounded-lg border border-line bg-deep p-5 sm:p-6">
        {range ? (
          <p className="text-3xl font-bold tracking-tight text-brand-soft tabular-nums sm:text-4xl">
            {range}
          </p>
        ) : null}
        {low !== null && high !== null ? (
          <GildedRangeBar low={low} high={high} mid={mid} currency={currency} />
        ) : null}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-4">
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
            label="Data Sufficiency"
            value={SUFFICIENCY_LABELS[run.dataSufficiency] ?? null}
          />
          <MetricStat
            className="tabular-nums"
            label="Updated"
            value={formatDate(run.createdAt)}
          />
        </dl>
      </div>

      {/* -------------------------- Estimate Breakdown ------------------------- */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Estimate Breakdown
        </h3>
        <div className="mt-2 divide-y divide-line border-y border-line">
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
                      ? `${formatCompactCurrency(cLow, currency)} to ${formatCompactCurrency(cHigh, currency)}`
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
                    {reason ? `: ${reason}` : null}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------- History ---------------------------- */}
      {showHistory ? (
        <div className="rounded-lg border border-line bg-deep p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Valuation History
          </h3>
          <p className="mt-1 text-xs text-faint">
            Model-estimated midpoints over time. Not a traded price.
          </p>
          <div className="mt-4">
            <MidpointSparkline points={points} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-64 text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-faint">
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
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-faint">
        Estimate generated by the Vantor valuation model ({run.engineVersion}) from
        company-reported data. Not investment advice.
      </p>
    </div>
  );
}

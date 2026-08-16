import { Card } from "@/components/ui/card";
import { MetricStat } from "@/components/ui/metric-stat";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
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

/** Inset (as a % of track width) the low→high segment sits from either edge. */
const RANGE_INSET_PCT = 4;

/**
 * Horizontal low–high range bar with a midpoint marker. Pure CSS, neutral
 * ink on a mist track with a single cobalt marker — a model range, not a
 * price chart. Decorative: the surrounding text carries every value.
 */
function RangeBar({ low, high, mid }: { low: number; high: number; mid: number | null }) {
  const span = high - low;
  const midFrac = mid !== null && span > 0 ? Math.min(1, Math.max(0, (mid - low) / span)) : null;
  return (
    <div aria-hidden="true" className="relative h-1.5 rounded-full bg-mist">
      <div
        className="absolute inset-y-0 rounded-full bg-ink-900"
        style={{ left: `${RANGE_INSET_PCT}%`, right: `${RANGE_INSET_PCT}%` }}
      />
      {midFrac !== null ? (
        <span
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-accent-600"
          style={{ left: `${RANGE_INSET_PCT + midFrac * (100 - 2 * RANGE_INSET_PCT)}%` }}
        />
      ) : null}
    </div>
  );
}

type HistoryPoint = { date: Date; mid: number; currency: string };

/**
 * Inline midpoint history line. Pure SVG, axis-free, neutral ink with a
 * single accent dot on the latest estimate; the adjacent table is the
 * accessible/data view, and the aria-label narrates first and latest values.
 */
function MidpointSparkline({ points }: { points: HistoryPoint[] }) {
  const width = 480;
  const height = 64;
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
  const lastLeftPct = (x(points.length - 1) / width) * 100;
  const lastTopPct = (y(last.mid) / height) * 100;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Vantor estimated midpoint moved from ${formatCompactCurrency(first.mid, first.currency)} on ${formatDate(first.date)} to ${formatCompactCurrency(last.mid, last.currency)} on ${formatDate(last.date)}, across ${points.length} estimates.`}
        className="h-16 w-full text-ink-900"
      >
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Latest-estimate marker, positioned over the scaled SVG. */}
      <span
        aria-hidden="true"
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-accent-600"
        style={{ left: `${lastLeftPct}%`, top: `${lastTopPct}%` }}
      />
    </div>
  );
}

function QuietStat({
  label,
  value,
  marker = false,
}: {
  label: string;
  value: string | null;
  marker?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-900 tabular-nums">
        {marker && value !== null ? (
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block size-1.5 rounded-full bg-accent-600 align-middle"
          />
        ) : null}
        {value ?? "—"}
      </dd>
    </div>
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
  const hasRange = low !== null && high !== null;

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
      <Card className="p-5 sm:p-6">
        {hasRange ? (
          <>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Low estimate
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 tabular-nums sm:text-3xl">
                  {formatCompactCurrency(low, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  High estimate
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 tabular-nums sm:text-3xl">
                  {formatCompactCurrency(high, currency)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <RangeBar low={low} high={high} mid={mid} />
            </div>
          </>
        ) : mid !== null ? (
          <MetricStat
            label="Estimated midpoint"
            value={formatCompactCurrency(mid, currency)}
            size="lg"
            className="tabular-nums"
          />
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-4">
          <QuietStat
            label="Midpoint"
            value={mid !== null ? formatCompactCurrency(mid, currency) : null}
            marker={hasRange}
          />
          <QuietStat
            label="Confidence"
            value={run.confidence !== null ? `${run.confidence}%` : null}
          />
          <QuietStat
            label="Data Quality"
            value={SUFFICIENCY_LABELS[run.dataSufficiency] ?? null}
          />
          <QuietStat label="Last updated" value={formatDate(run.createdAt)} />
        </dl>
      </Card>

      {/* -------------------------- Estimate Breakdown ------------------------- */}
      <Card className="p-5 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
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
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <p className="text-sm font-medium text-ink-900">{label}</p>
                  <p className="flex items-baseline gap-3 text-sm font-semibold text-ink-900 tabular-nums sm:justify-end">
                    {cLow !== null && cHigh !== null
                      ? `${formatCompactCurrency(cLow, currency)} – ${formatCompactCurrency(cHigh, currency)}`
                      : null}
                    {weight !== null ? (
                      <span className="font-normal text-muted">
                        {Math.round(weight * 100)}% weight
                      </span>
                    ) : null}
                  </p>
                </div>
              );
            }
            return (
              <div key={row.id} className="py-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm text-muted">{label}</p>
                  <p className="text-xs text-muted">
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
        <Card className="overflow-hidden">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Estimate History
            </h3>
            <p className="mt-1 text-xs text-muted">
              Model-estimated midpoints over time — not a traded price.
            </p>
            <div className="mt-4">
              <MidpointSparkline points={points} />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table className="min-w-64">
              <THead>
                <tr>
                  <TH className="pl-5 sm:pl-6">Date</TH>
                  <TH numeric className="pr-5 sm:pr-6">
                    Estimated midpoint
                  </TH>
                </tr>
              </THead>
              <TBody>
                {[...points].reverse().map((point) => (
                  <tr key={point.date.toISOString()}>
                    <TD className="whitespace-nowrap pl-5 text-muted tabular-nums sm:pl-6">
                      {formatDate(point.date)}
                    </TD>
                    <TD numeric className="pr-5 font-medium text-ink-900 sm:pr-6">
                      {formatCompactCurrency(point.mid, point.currency)}
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <p className="text-xs leading-relaxed text-muted">
        Estimate generated by the Vantor valuation model ({run.engineVersion}) from
        company-reported data. Not investment advice.
      </p>
    </div>
  );
}

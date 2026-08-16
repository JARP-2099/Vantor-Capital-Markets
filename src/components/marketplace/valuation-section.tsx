import { ConfidenceBand, RangeBar, type BandPoint } from "@/components/ui/charts";
import { MetricStat } from "@/components/ui/metric-stat";
import { Table, TBody, TD, TH, THead, TableWrap } from "@/components/ui/table";
import type { ValuationComponentRow, ValuationRunRow } from "@/db/queries/valuations";
import { formatCompactCurrency, formatDate, formatDateTime } from "@/lib/format";

/**
 * Public profile valuation section — V2, built on the shared chart
 * primitives (bullet-style RangeBar, line-with-ConfidenceBand). Server-safe
 * presentation only — callers pass a completed run (visibility already
 * enforced upstream). Deliberately unlike stock-price UI: no gain/loss
 * coloring, no change badges — this is a model estimate, not a traded price.
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
 * Padded display domain around a low–high band so the band never touches
 * the track edges. Returns 0–1 positions for low/high/mid on that domain.
 */
function bandPositions(low: number, high: number, mid: number | null) {
  const span = high - low;
  const pad = span > 0 ? span * 0.18 : Math.max(Math.abs(high) * 0.1, 1);
  const domainLow = low - pad;
  const domainSpan = high + pad - domainLow;
  const pos = (v: number) => (v - domainLow) / domainSpan;
  return {
    bandStart: pos(low),
    bandEnd: pos(high),
    mid: mid !== null ? pos(mid) : undefined,
  };
}

type HistoryEntry = {
  date: Date;
  low: number | null;
  mid: number;
  high: number | null;
  currency: string;
};

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

  // Widest applied-model range — the shared domain every mini bar is drawn
  // against, so per-model bands are visually comparable.
  const appliedRanges = ordered.flatMap((row) => {
    if (row.status !== "applied") return [];
    const cLow = num(row.valuationLow);
    const cHigh = num(row.valuationHigh);
    return cLow !== null && cHigh !== null ? [{ low: cLow, high: cHigh }] : [];
  });
  const modelDomain =
    appliedRanges.length > 0
      ? {
          low: Math.min(...appliedRanges.map((r) => r.low)),
          high: Math.max(...appliedRanges.map((r) => r.high)),
        }
      : null;
  const modelSpan = modelDomain ? modelDomain.high - modelDomain.low || 1 : 1;

  // Oldest first from the query layer; keep only points with a midpoint.
  const entries: HistoryEntry[] = history.flatMap((r) => {
    const m = num(r.valuationMid);
    return m !== null
      ? [
          {
            date: r.createdAt,
            low: num(r.valuationLow),
            mid: m,
            high: num(r.valuationHigh),
            currency: r.currency,
          },
        ]
      : [];
  });
  const showHistory = entries.length >= 2;
  const bandPoints: BandPoint[] = entries.map((e, i) => ({
    x: entries.length > 1 ? i / (entries.length - 1) : 0,
    low: e.low ?? e.mid,
    mid: e.mid,
    high: e.high ?? e.mid,
  }));
  const firstEntry = entries[0];
  const lastEntry = entries[entries.length - 1];

  return (
    <div className="mt-6 space-y-10">
      {/* ---------------------------- Headline band ---------------------------- */}
      <div className="rounded-lg border border-line bg-paper p-5 shadow-card sm:p-7">
        {hasRange ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Estimated range
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 tabular-nums sm:text-4xl">
              {formatCompactCurrency(low, currency)}
              <span className="mx-2 font-semibold text-faint">–</span>
              {formatCompactCurrency(high, currency)}
            </p>
            <RangeBar
              {...bandPositions(low, high, mid)}
              lowLabel={formatCompactCurrency(low, currency)}
              midLabel={mid !== null ? formatCompactCurrency(mid, currency) : undefined}
              highLabel={formatCompactCurrency(high, currency)}
              className="mt-6 max-w-2xl"
            />
          </>
        ) : mid !== null ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Estimated midpoint
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 tabular-nums sm:text-4xl">
              {formatCompactCurrency(mid, currency)}
            </p>
          </>
        ) : null}

        <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-4">
          <MetricStat
            label="Midpoint"
            value={mid !== null ? formatCompactCurrency(mid, currency) : null}
            className="tabular-nums"
          />
          <MetricStat
            label="Confidence"
            value={run.confidence !== null ? `${run.confidence}%` : null}
            className="tabular-nums"
          />
          <MetricStat
            label="Data Quality"
            value={SUFFICIENCY_LABELS[run.dataSufficiency] ?? null}
          />
          <MetricStat label="Last updated" value={formatDate(run.createdAt)} className="tabular-nums" />
        </dl>
      </div>

      {/* -------------------------- Estimate Breakdown ------------------------- */}
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Estimate Breakdown
        </h3>
        <div className="mt-2 divide-y divide-line border-t border-line">
          {ordered.map((row) => {
            const label = COMPONENT_LABELS[row.componentKey] ?? row.componentKey;
            const reason = detailReason(row);
            if (row.status === "applied") {
              const cLow = num(row.valuationLow);
              const cHigh = num(row.valuationHigh);
              const cMid = num(row.valuationMid);
              const weight = num(row.weight);
              const hasBar = modelDomain !== null && cLow !== null && cHigh !== null;
              return (
                <div
                  key={row.id}
                  className="grid gap-x-8 gap-y-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{label}</p>
                    {weight !== null ? (
                      <p className="mt-0.5 text-xs text-muted tabular-nums">
                        {Math.round(weight * 100)}% weight
                      </p>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 tabular-nums sm:text-right">
                      {cLow !== null && cHigh !== null
                        ? `${formatCompactCurrency(cLow, currency)} – ${formatCompactCurrency(cHigh, currency)}`
                        : "—"}
                    </p>
                    {hasBar ? (
                      <RangeBar
                        bandStart={(cLow - modelDomain.low) / modelSpan}
                        bandEnd={(cHigh - modelDomain.low) / modelSpan}
                        mid={cMid !== null ? (cMid - modelDomain.low) / modelSpan : undefined}
                        className="mt-2"
                      />
                    ) : null}
                  </div>
                </div>
              );
            }
            return (
              <div key={row.id} className="py-3.5">
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
      </div>

      {/* ------------------------------- History ------------------------------- */}
      {showHistory ? (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Estimate History
          </h3>
          <p className="mt-1 text-xs text-muted">
            Model-estimated midpoints over time — not a traded price.
          </p>
          <ConfidenceBand
            points={bandPoints}
            label={`Vantor estimated midpoint moved from ${formatCompactCurrency(firstEntry.mid, firstEntry.currency)} on ${formatDate(firstEntry.date)} to ${formatCompactCurrency(lastEntry.mid, lastEntry.currency)} on ${formatDate(lastEntry.date)}, across ${entries.length} estimates. The shaded band spans each estimate's low to high value.`}
            height={140}
            className="mt-4"
          />
          <TableWrap className="mt-5">
            <Table className="min-w-[26rem]">
              <THead>
                <tr>
                  <TH>Date</TH>
                  <TH numeric>Low estimate</TH>
                  <TH numeric>Midpoint</TH>
                  <TH numeric>High estimate</TH>
                </tr>
              </THead>
              <TBody>
                {[...entries].reverse().map((entry) => (
                  <tr key={entry.date.toISOString()}>
                    <TD className="whitespace-nowrap text-muted tabular-nums">
                      {formatDateTime(entry.date)}
                    </TD>
                    <TD numeric className="text-slate-650">
                      {entry.low !== null ? formatCompactCurrency(entry.low, entry.currency) : "—"}
                    </TD>
                    <TD numeric className="font-semibold text-ink-900">
                      {formatCompactCurrency(entry.mid, entry.currency)}
                    </TD>
                    <TD numeric className="text-slate-650">
                      {entry.high !== null
                        ? formatCompactCurrency(entry.high, entry.currency)
                        : "—"}
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-muted">
        Estimate generated by the Vantor valuation model ({run.engineVersion}) from
        company-reported data. Not investment advice.
      </p>
    </div>
  );
}

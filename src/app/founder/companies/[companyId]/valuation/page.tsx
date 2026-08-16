import { requireManagerPage } from "@/components/founder/data";
import {
  RefreshEstimateForm,
  VisibilityToggleForm,
} from "@/components/founder/valuation/valuation-actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBand, RangeBar, type BandPoint } from "@/components/ui/charts";
import { MetricStat } from "@/components/ui/metric-stat";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import {
  getLatestValuationRun,
  getValuationComponents,
  getValuationHistory,
  type ValuationComponentRow,
  type ValuationRunRow,
} from "@/db/queries/valuations";
import { requestValuation, setValuationVisibility } from "@/lib/actions/valuation";
import { formatCompactCurrency, formatDateTime } from "@/lib/format";
import { RUN_COOLDOWN_MS } from "@/lib/valuation/service";

/**
 * Founder valuation surface: generate/refresh the Vantor estimate, inspect
 * the full model breakdown, and control public visibility. All numbers come
 * from stored runs — nothing is computed (or invented) at render time.
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

/** Defensive numeric-string parse; unparseable values render as omitted, never NaN. */
function num(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rangeDisplay(
  low: number | null,
  high: number | null,
  mid: number | null,
  currency: string,
): string | null {
  if (low !== null && high !== null) {
    return `${formatCompactCurrency(low, currency)} – ${formatCompactCurrency(high, currency)}`;
  }
  if (mid !== null) return formatCompactCurrency(mid, currency);
  return null;
}

type RiskFlagJson = { key?: string; label: string; impactPct: number };

function riskFlagsOf(run: ValuationRunRow): RiskFlagJson[] {
  if (!Array.isArray(run.riskFlags)) return [];
  return (run.riskFlags as unknown[]).filter(
    (f): f is RiskFlagJson =>
      typeof f === "object" &&
      f !== null &&
      typeof (f as RiskFlagJson).label === "string" &&
      typeof (f as RiskFlagJson).impactPct === "number",
  );
}

function insufficiencyOf(run: ValuationRunRow): { reasons: string[]; hints: string[] } {
  const raw = run.insufficiencyReasons as { reasons?: unknown; hints?: unknown } | null;
  const strings = (v: unknown) =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  return { reasons: strings(raw?.reasons), hints: strings(raw?.hints) };
}

function orderedComponents(rows: ValuationComponentRow[]): ValuationComponentRow[] {
  return [...rows].sort(
    (a, b) => COMPONENT_ORDER.indexOf(a.componentKey) - COMPONENT_ORDER.indexOf(b.componentKey),
  );
}

function detailReason(row: ValuationComponentRow): string | null {
  const detail = row.detail as { reason?: unknown } | null;
  return typeof detail?.reason === "string" ? detail.reason : null;
}

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/**
 * Normalized 0–1 positions for the headline range bar: the domain pads the
 * low–high band by ~22% each side so the band reads as a slice of a wider
 * scale, never wall-to-wall.
 */
function headlineRangePositions(
  low: number,
  high: number,
  mid: number | null,
): { bandStart: number; bandEnd: number; mid?: number } {
  const span = high - low;
  const pad = span > 0 ? span * 0.22 : Math.abs(high) * 0.2 || 1;
  const domainLow = Math.max(0, low - pad);
  const domainHigh = high + pad;
  const pos = (v: number) =>
    Math.min(1, Math.max(0, (v - domainLow) / (domainHigh - domainLow)));
  return {
    bandStart: pos(low),
    bandEnd: pos(high),
    mid: mid !== null ? pos(mid) : undefined,
  };
}

/** Shared 0–1 domain across applied model ranges (widest range = full width). */
type ModelDomain = { min: number; max: number };

function modelDomain(rows: ValuationComponentRow[]): ModelDomain | null {
  const lows: number[] = [];
  const highs: number[] = [];
  for (const row of rows) {
    if (row.status !== "applied") continue;
    const low = num(row.valuationLow);
    const high = num(row.valuationHigh);
    if (low === null || high === null) continue;
    lows.push(low);
    highs.push(high);
  }
  if (lows.length === 0) return null;
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  return max > min ? { min, max } : null;
}

function BreakdownRow({
  row,
  currency,
  domain,
}: {
  row: ValuationComponentRow;
  currency: string;
  domain: ModelDomain | null;
}) {
  const label = COMPONENT_LABELS[row.componentKey] ?? row.componentKey;
  const reason = detailReason(row);

  if (row.status === "applied") {
    const low = num(row.valuationLow);
    const high = num(row.valuationHigh);
    const weight = num(row.weight);
    const pos =
      domain && low !== null && high !== null
        ? (v: number) => Math.min(1, Math.max(0, (v - domain.min) / (domain.max - domain.min)))
        : null;
    return (
      <div className="py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-ink-900">{label}</p>
            <Badge tone="accent" dot>
              Applied
            </Badge>
          </div>
          <p className="text-sm font-semibold text-ink-900 tabular-nums">
            {low !== null && high !== null
              ? `${formatCompactCurrency(low, currency)} – ${formatCompactCurrency(high, currency)}`
              : null}
            {weight !== null ? (
              <span className="ml-2 font-normal text-muted">{Math.round(weight * 100)}% weight</span>
            ) : null}
          </p>
        </div>
        {pos && low !== null && high !== null ? (
          <RangeBar
            className="mt-2.5 max-w-2xl"
            bandStart={pos(low)}
            bandEnd={pos(high)}
          />
        ) : null}
        {reason ? <p className="mt-2 text-xs leading-relaxed text-muted">{reason}</p> : null}
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Badge dot>{row.status === "not_applicable" ? "Not applicable" : "Insufficient data"}</Badge>
      </div>
      {reason ? <p className="mt-1 text-xs text-faint">{reason}</p> : null}
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="text-xs leading-relaxed text-muted">
      Vantor estimates are produced by a deterministic model from company-reported data. They are
      estimates only — not an offer, valuation opinion, or investment advice. Actual transaction
      prices may differ materially.
    </p>
  );
}

export default async function ManageValuationPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireManagerPage(companyId);

  const latest = await getLatestValuationRun(company.id);
  const [components, history] = latest
    ? await Promise.all([getValuationComponents(latest.id), getValuationHistory(company.id)])
    : [[], []];

  const refreshAction = requestValuation.bind(null, company.id);
  const visibilityAction = setValuationVisibility.bind(null, company.id);
  const cooldownMinutes = Math.round(RUN_COOLDOWN_MS / 60_000);

  /* ------------------------------ First run ------------------------------- */
  if (!latest) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate your first Vantor estimate</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="max-w-2xl text-sm leading-relaxed text-slate-650">
              Vantor&rsquo;s deterministic valuation model produces an estimated private market
              value range from the metrics and profile data you have already reported. Every run is
              reproducible and fully explained, and nothing appears publicly unless you enable it.
            </p>
            <ul className="max-w-2xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-650">
              <li>An indicative value range and midpoint, built from up to four methodologies</li>
              <li>A transparent breakdown of which models applied to your data — and why</li>
              <li>Risk adjustments and concrete hints for improving the estimate</li>
            </ul>
            <RefreshEstimateForm action={refreshAction} label="Generate estimate" />
          </CardBody>
        </Card>
        <Disclaimer />
      </div>
    );
  }

  const { reasons, hints } = insufficiencyOf(latest);
  const historyNewestFirst = [...history].reverse();

  const manageCard = (
    <Card>
      <CardHeader>
        <CardTitle>Manage estimate</CardTitle>
      </CardHeader>
      <CardBody className="space-y-5">
        <RefreshEstimateForm
          action={refreshAction}
          label="Refresh estimate"
          note={`Estimates can be refreshed once every ${cooldownMinutes} minutes.`}
        />
        <div className="border-t border-line pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-medium text-ink-900">Public visibility</h3>
            <Badge tone={company.showPublicValuation ? "positive" : "neutral"} dot>
              {company.showPublicValuation ? "Shown on public profile" : "Hidden from public profile"}
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
            When enabled and your company is published, the estimate appears on your public
            profile.
          </p>
          <div className="mt-3">
            <VisibilityToggleForm
              action={visibilityAction}
              visible={company.showPublicValuation}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const improveCard =
    hints.length > 0 ? (
      <Card>
        <CardHeader>
          <CardTitle>Improve your estimate</CardTitle>
          <p className="mt-1 text-sm text-muted">
            More reported data lets more models apply — and raises confidence.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          <ul className="max-w-2xl divide-y divide-line">
            {hints.map((hint) => (
              <li key={hint} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full border border-line-strong bg-paper"
                />
                <span className="text-sm leading-relaxed text-slate-650">{hint}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href={`/founder/companies/${company.id}/metrics`}
              variant="secondary"
              size="sm"
            >
              Update metrics
            </ButtonLink>
            <ButtonLink
              href={`/founder/companies/${company.id}/profile`}
              variant="secondary"
              size="sm"
            >
              Complete profile
            </ButtonLink>
          </div>
        </CardBody>
      </Card>
    ) : null;

  /* -------------------------- Insufficient data --------------------------- */
  if (latest.status !== "completed") {
    return (
      <div className="space-y-6">
        <Alert tone="warn" title="A responsible estimate could not be produced">
          <p>
            The Vantor model declines to estimate rather than guess when reported data is too
            thin.
          </p>
          {reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </Alert>

        {improveCard}

        {historyNewestFirst.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Valuation History</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="mb-3 text-xs text-muted">
                Your most recent run could not produce an estimate; earlier completed estimates are
                shown below.
              </p>
              <HistoryTable runs={historyNewestFirst} />
            </CardBody>
          </Card>
        ) : null}

        {manageCard}
        <Disclaimer />
      </div>
    );
  }

  /* ----------------------------- Completed run ----------------------------- */
  const currency = latest.currency;
  const low = num(latest.valuationLow);
  const high = num(latest.valuationHigh);
  const mid = num(latest.valuationMid);
  const range = rangeDisplay(low, high, mid, currency);
  const ordered = orderedComponents(components);
  const domain = modelDomain(ordered);

  // History band: completed runs with a full low/mid/high, oldest → newest,
  // x spaced by run index (runs are not evenly spaced in time).
  const bandRuns = history.filter(
    (run) =>
      num(run.valuationLow) !== null &&
      num(run.valuationMid) !== null &&
      num(run.valuationHigh) !== null,
  );
  const bandPoints: BandPoint[] = bandRuns.map((run, i) => ({
    x: bandRuns.length > 1 ? i / (bandRuns.length - 1) : 0,
    low: num(run.valuationLow) as number,
    mid: num(run.valuationMid) as number,
    high: num(run.valuationHigh) as number,
  }));

  const appliedLabels = ordered
    .filter((c) => c.status === "applied")
    .map((c) => COMPONENT_LABELS[c.componentKey] ?? c.componentKey);
  const flags = riskFlagsOf(latest);

  return (
    <div className="space-y-6">
      {/* ------------------------------ Headline ------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle>Estimated Private Market Valuation</CardTitle>
        </CardHeader>
        <CardBody>
          {range ? (
            <p
              data-metric-value
              className="text-3xl font-extrabold tracking-tight text-ink-900 tabular-nums sm:text-4xl"
            >
              {range}
            </p>
          ) : null}
          {low !== null && high !== null ? (
            <RangeBar
              className="mt-6 max-w-2xl"
              {...headlineRangePositions(low, high, mid)}
              lowLabel={formatCompactCurrency(low, currency)}
              midLabel={mid !== null ? formatCompactCurrency(mid, currency) : undefined}
              highLabel={formatCompactCurrency(high, currency)}
            />
          ) : null}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-4">
            <MetricStat
              label="Midpoint"
              value={mid !== null ? formatCompactCurrency(mid, currency) : null}
            />
            <MetricStat
              label="Confidence"
              value={latest.confidence !== null ? `${latest.confidence}%` : null}
              hint="In the estimate, not your company"
            />
            <MetricStat
              label="Data sufficiency"
              value={SUFFICIENCY_LABELS[latest.dataSufficiency] ?? null}
              hint="Completeness of reported data"
            />
            <MetricStat
              label="Last updated"
              value={formatDateTime(latest.createdAt)}
              hint={`Engine ${latest.engineVersion}`}
              className="col-span-2 sm:col-span-1"
            />
          </dl>
        </CardBody>
      </Card>

      {/* ------------------------- Estimate Breakdown ------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Estimate Breakdown</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Which methodologies applied to your data — and why the others were excluded.
          </p>
        </CardHeader>
        <CardBody>
          <div className="divide-y divide-line">
            {ordered.map((row) => (
              <BreakdownRow key={row.id} row={row} currency={currency} domain={domain} />
            ))}
          </div>
          {domain ? (
            <p className="mt-1 text-xs text-muted">
              Model bands share one scale — {formatCompactCurrency(domain.min, currency)} to{" "}
              {formatCompactCurrency(domain.max, currency)} — so ranges compare directly.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {/* ---------------------------- Risk Factors ---------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Factors</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Adjustments the model applied to the estimate — not judgments of your company.
          </p>
        </CardHeader>
        <CardBody>
          {flags.length === 0 ? (
            <p className="text-sm text-faint">No risk adjustments applied.</p>
          ) : (
            <ul className="divide-y divide-line">
              {flags.map((flag) => (
                <li
                  key={flag.key ?? flag.label}
                  className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="flex items-center gap-2.5 text-sm text-slate-650">
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warn-700" />
                    {flag.label}
                  </span>
                  <span className="text-sm font-medium text-warn-700 tabular-nums">
                    &minus;{Math.abs(flag.impactPct)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---------------------------- Methodology ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Methodology</CardTitle>
        </CardHeader>
        <CardBody className="max-w-2xl space-y-3 text-sm leading-relaxed text-slate-650">
          <p>
            {appliedLabels.length === 1
              ? `This estimate was produced by the ${appliedLabels[0]}.`
              : `This estimate blends the ${joinLabels(appliedLabels)}.`}{" "}
            Models that were not applicable to your data, or lacked sufficient data, were excluded
            rather than approximated.
          </p>
          <p>
            Baseline multiples and stage ranges are Vantor model assumptions chosen to be
            conservative and internally consistent — they are not market data. The comparable
            transactions model activates only when a legitimate comparables dataset exists.
          </p>
          <p>
            Confidence measures confidence in the estimate itself — data completeness, model
            agreement, and freshness — never the quality of your company as an investment.
          </p>
        </CardBody>
      </Card>

      {/* ------------------------------ History ------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Valuation History</CardTitle>
        </CardHeader>
        <CardBody>
          {historyNewestFirst.length <= 1 ? (
            <p className="text-sm text-faint">
              History builds as you refresh your estimate — each run is kept so you can see how the
              range moves as your data changes.
            </p>
          ) : (
            <>
              {bandPoints.length >= 2 ? (
                <div className="mb-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Estimate range by run
                    </p>
                    <p className="text-xs text-muted">
                      {bandRuns.length} runs, oldest to newest · {currency} · band = low–high, line
                      = midpoint
                    </p>
                  </div>
                  <ConfidenceBand
                    className="mt-3"
                    points={bandPoints}
                    label={`Estimated valuation range across ${bandRuns.length} runs, oldest to newest. Latest run: ${formatCompactCurrency(bandPoints[bandPoints.length - 1].low, currency)} to ${formatCompactCurrency(bandPoints[bandPoints.length - 1].high, currency)}, midpoint ${formatCompactCurrency(bandPoints[bandPoints.length - 1].mid, currency)}. Exact values in the table below.`}
                  />
                </div>
              ) : null}
              <HistoryTable runs={historyNewestFirst} />
            </>
          )}
        </CardBody>
      </Card>

      {improveCard}
      {manageCard}
      <Disclaimer />
    </div>
  );
}

/** Completed runs, newest first. */
function HistoryTable({ runs }: { runs: ValuationRunRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <Table className="min-w-[30rem]">
        <THead>
          <tr>
            <TH>Date</TH>
            <TH numeric>Range</TH>
            <TH numeric>Midpoint</TH>
            <TH numeric>Confidence</TH>
          </tr>
        </THead>
        <TBody>
          {runs.map((run) => {
            const low = num(run.valuationLow);
            const high = num(run.valuationHigh);
            const mid = num(run.valuationMid);
            return (
              <tr key={run.id}>
                <TD className="whitespace-nowrap text-muted tabular-nums">
                  {formatDateTime(run.createdAt)}
                </TD>
                <TD numeric className="font-medium text-ink-900">
                  {low !== null && high !== null
                    ? `${formatCompactCurrency(low, run.currency)} – ${formatCompactCurrency(high, run.currency)}`
                    : "—"}
                </TD>
                <TD numeric className="font-medium text-ink-900">
                  {mid !== null ? formatCompactCurrency(mid, run.currency) : "—"}
                </TD>
                <TD numeric className="text-muted">
                  {run.confidence !== null ? `${run.confidence}%` : "—"}
                </TD>
              </tr>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}

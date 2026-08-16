import { requireManagerPage } from "@/components/founder/data";
import {
  RefreshEstimateForm,
  VisibilityToggleForm,
} from "@/components/founder/valuation/valuation-actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCompactCurrency, formatDate } from "@/lib/format";
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
 * Horizontal range visual for the headline estimate: quiet track, cobalt
 * low–high band, ink midpoint marker. Purely decorative — every number it
 * encodes is also rendered as text.
 */
function RangeBar({
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
  const span = high - low;
  const pad = span > 0 ? span * 0.22 : Math.abs(high) * 0.2 || 1;
  const domainLow = Math.max(0, low - pad);
  const domainHigh = high + pad;
  const pct = (v: number) =>
    Math.min(100, Math.max(0, ((v - domainLow) / (domainHigh - domainLow)) * 100));
  const lowPct = pct(low);
  const highPct = pct(high);

  return (
    <div aria-hidden="true" className="mt-5 max-w-2xl select-none">
      <div className="relative h-3">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-mist" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent-600"
          style={{ left: `${lowPct}%`, width: `${Math.max(highPct - lowPct, 1)}%` }}
        />
        {mid !== null ? (
          <div
            className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-900"
            style={{ left: `${pct(mid)}%` }}
          />
        ) : null}
      </div>
      <div className="relative mt-1.5 h-4 text-xs text-muted tabular-nums">
        <span className="absolute -translate-x-1/2" style={{ left: `${lowPct}%` }}>
          {formatCompactCurrency(low, currency)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${highPct}%` }}>
          {formatCompactCurrency(high, currency)}
        </span>
      </div>
    </div>
  );
}

function BreakdownRow({ row, currency }: { row: ValuationComponentRow; currency: string }) {
  const label = COMPONENT_LABELS[row.componentKey] ?? row.componentKey;
  const reason = detailReason(row);

  if (row.status === "applied") {
    const low = num(row.valuationLow);
    const high = num(row.valuationHigh);
    const weight = num(row.weight);
    return (
      <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-ink-900">{label}</p>
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
    );
  }

  return (
    <div className="py-3">
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
            <p className="text-3xl font-semibold tracking-tight text-ink-900 tabular-nums sm:text-4xl">
              {range}
            </p>
          ) : null}
          {low !== null && high !== null ? (
            <RangeBar low={low} high={high} mid={mid} currency={currency} />
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
              label="Data Quality"
              value={SUFFICIENCY_LABELS[latest.dataSufficiency] ?? null}
              hint="Completeness of reported data"
            />
            <MetricStat
              label="Last updated"
              value={formatDate(latest.createdAt)}
              hint={`Engine ${latest.engineVersion}`}
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
              <BreakdownRow key={row.id} row={row} currency={currency} />
            ))}
          </div>
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
            <HistoryTable runs={historyNewestFirst} />
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
                <TD className="text-muted tabular-nums">{formatDate(run.createdAt)}</TD>
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

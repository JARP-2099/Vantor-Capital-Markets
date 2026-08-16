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

function BreakdownRow({ row, currency }: { row: ValuationComponentRow; currency: string }) {
  const label = COMPONENT_LABELS[row.componentKey] ?? row.componentKey;
  const reason = detailReason(row);

  if (row.status === "applied") {
    const low = num(row.valuationLow);
    const high = num(row.valuationHigh);
    const weight = num(row.weight);
    return (
      <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink-900">{label}</p>
          <Badge tone="accent">Applied</Badge>
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
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Badge>{row.status === "not_applicable" ? "Not applicable" : "Insufficient data"}</Badge>
      </div>
      {reason ? <p className="mt-1 text-xs text-faint">{reason}</p> : null}
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="text-xs leading-relaxed text-faint">
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
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-ink-900">Public visibility</h3>
            <Badge tone={company.showPublicValuation ? "accent" : "neutral"}>
              {company.showPublicValuation ? "Enabled" : "Disabled"}
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
        </CardHeader>
        <CardBody className="space-y-4">
          <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-650">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
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
            <p className="text-3xl font-bold tracking-tight text-ink-900 tabular-nums sm:text-4xl">
              {range}
            </p>
          ) : null}
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <MetricStat
              className="tabular-nums"
              label="Midpoint"
              value={mid !== null ? formatCompactCurrency(mid, currency) : null}
            />
            <MetricStat
              className="tabular-nums"
              label="Confidence"
              value={latest.confidence !== null ? `${latest.confidence}%` : null}
            />
            <MetricStat
              label="Data Quality"
              value={SUFFICIENCY_LABELS[latest.dataSufficiency] ?? null}
            />
            <MetricStat
              className="tabular-nums"
              label="Last updated"
              value={formatDate(latest.createdAt)}
            />
          </dl>
          <p className="mt-4 text-xs text-faint">Engine {latest.engineVersion}</p>
        </CardBody>
      </Card>

      {/* ------------------------- Estimate Breakdown ------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Estimate Breakdown</CardTitle>
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
                  <span className="text-sm text-slate-650">{flag.label}</span>
                  <span className="text-sm font-medium text-ink-900 tabular-nums">
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
            <p className="text-sm text-faint">History builds as you refresh your estimate.</p>
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="py-2 pr-4 font-medium">
              Date
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Range
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Midpoint
            </th>
            <th scope="col" className="py-2 font-medium">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {runs.map((run) => {
            const low = num(run.valuationLow);
            const high = num(run.valuationHigh);
            const mid = num(run.valuationMid);
            return (
              <tr key={run.id}>
                <td className="py-2.5 pr-4 text-muted tabular-nums">
                  {formatDate(run.createdAt)}
                </td>
                <td className="py-2.5 pr-4 font-medium text-ink-900 tabular-nums">
                  {low !== null && high !== null
                    ? `${formatCompactCurrency(low, run.currency)} – ${formatCompactCurrency(high, run.currency)}`
                    : "—"}
                </td>
                <td className="py-2.5 pr-4 font-medium text-ink-900 tabular-nums">
                  {mid !== null ? formatCompactCurrency(mid, run.currency) : "—"}
                </td>
                <td className="py-2.5 text-muted tabular-nums">
                  {run.confidence !== null ? `${run.confidence}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

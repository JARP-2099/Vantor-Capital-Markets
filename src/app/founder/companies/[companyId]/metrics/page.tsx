import { EditStatusAlert, isEditable } from "@/components/founder/edit-status-alert";
import { getMetricRows, requireManagerPage } from "@/components/founder/data";
import { MetricsForm, type MetricInitialRow } from "@/components/founder/metrics-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendLine } from "@/components/ui/charts";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { saveMetrics } from "@/lib/actions/founder-company";
import {
  METRIC_LABELS,
  MONETARY_METRICS,
  type CompanyStatus,
  type MetricType,
} from "@/lib/constants";
import { formatDate, formatMetricValue } from "@/lib/format";

/** Preferred metric for the history sparkline, most meaningful first. */
const TREND_PRIORITY: MetricType[] = [
  "arr",
  "revenue_annual",
  "mrr",
  "net_profit_annual",
  "burn_monthly",
  "capital_raised_total",
];

type MetricRow = Awaited<ReturnType<typeof getMetricRows>>[number];

/**
 * First monetary metric (by priority) with ≥2 already-fetched points in a
 * single currency — the only case where a trend line is honest. Points are
 * returned oldest → newest.
 */
function trendSeries(rows: MetricRow[]): { type: MetricType; points: MetricRow[] } | null {
  const byType = new Map<MetricType, MetricRow[]>();
  for (const row of rows) {
    const t = row.metricType as MetricType;
    if (!MONETARY_METRICS.has(t)) continue;
    const list = byType.get(t) ?? [];
    list.push(row);
    byType.set(t, list);
  }
  for (const type of TREND_PRIORITY) {
    const list = byType.get(type);
    if (!list || list.length < 2) continue;
    const currency = list[0].currency;
    if (!list.every((r) => r.currency === currency)) continue;
    if (!list.every((r) => Number.isFinite(Number(r.value)))) continue;
    // Rows arrive asOf desc within a type — chart wants oldest → newest.
    return { type, points: [...list].reverse() };
  }
  return null;
}

export default async function ManageMetricsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireManagerPage(companyId);
  const status = company.status as CompanyStatus;
  const disabled = !isEditable(status);
  const rows = await getMetricRows(companyId);

  const initial: MetricInitialRow[] = rows.map((r) => ({
    metricType: r.metricType as MetricType,
    value: r.value,
    currency: r.currency,
    asOf: r.asOf,
  }));

  const trend = trendSeries(rows);

  return (
    <div className="space-y-6">
      <EditStatusAlert status={status} />

      <Card>
        <CardHeader>
          <CardTitle>Reported metrics</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Real numbers, reported by you, with the date they describe.
          </p>
        </CardHeader>
        <CardBody>
          <MetricsForm
            action={saveMetrics.bind(null, companyId, "manage")}
            initial={initial}
            submitLabel="Save metrics"
            disabled={disabled}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metric history</CardTitle>
        </CardHeader>
        <CardBody>
          {rows.length === 0 ? (
            <p className="text-sm text-faint">No metrics reported yet.</p>
          ) : (
            <>
              {trend ? (
                <div className="mb-5 rounded-lg border border-line bg-canvas/60 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {METRIC_LABELS[trend.type]} over time
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                      {formatDate(trend.points[0].asOf)} –{" "}
                      {formatDate(trend.points[trend.points.length - 1].asOf)}
                      {trend.points[0].currency ? ` · ${trend.points[0].currency}` : ""}
                    </p>
                  </div>
                  <TrendLine
                    className="mt-3"
                    values={trend.points.map((p) => Number(p.value))}
                    label={`${METRIC_LABELS[trend.type]} history, ${trend.points.length} reported values from ${formatDate(trend.points[0].asOf)} to ${formatDate(trend.points[trend.points.length - 1].asOf)}, latest ${formatMetricValue(trend.type, Number(trend.points[trend.points.length - 1].value), trend.points[trend.points.length - 1].currency)}`}
                  />
                  <div className="mt-1.5 flex items-baseline justify-between text-xs tabular-nums text-muted">
                    <span>
                      {formatMetricValue(
                        trend.type,
                        Number(trend.points[0].value),
                        trend.points[0].currency,
                      )}
                    </span>
                    <span className="font-semibold text-ink-900">
                      {formatMetricValue(
                        trend.type,
                        Number(trend.points[trend.points.length - 1].value),
                        trend.points[trend.points.length - 1].currency,
                      )}
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-md border border-line">
                <Table>
                  <THead>
                    <tr>
                      <TH>Metric</TH>
                      <TH numeric>Value</TH>
                      <TH className="text-right">As of</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {rows.map((m) => (
                      <tr key={m.id}>
                        <TD className="font-medium text-ink-900">
                          {METRIC_LABELS[m.metricType as MetricType]}
                        </TD>
                        <TD numeric className="font-semibold text-ink-900">
                          {formatMetricValue(
                            m.metricType as MetricType,
                            Number(m.value),
                            m.currency,
                          )}
                        </TD>
                        <TD className="text-right text-muted tabular-nums">{formatDate(m.asOf)}</TD>
                      </tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

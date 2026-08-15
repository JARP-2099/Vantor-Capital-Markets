import { EditStatusAlert, isEditable } from "@/components/founder/edit-status-alert";
import { getMetricRows, requireManagerPage } from "@/components/founder/data";
import { MetricsForm, type MetricInitialRow } from "@/components/founder/metrics-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { saveMetrics } from "@/lib/actions/founder-company";
import { METRIC_LABELS, type CompanyStatus, type MetricType } from "@/lib/constants";
import { formatDate, formatMetricValue } from "@/lib/format";

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

  // History grouped by metric type; rows arrive sorted type asc, asOf desc.
  const grouped = new Map<MetricType, typeof rows>();
  for (const row of rows) {
    const t = row.metricType as MetricType;
    const list = grouped.get(t) ?? [];
    list.push(row);
    grouped.set(t, list);
  }

  return (
    <div className="space-y-6">
      <EditStatusAlert status={status} />

      <Card>
        <CardHeader>
          <CardTitle>Reported metrics</CardTitle>
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
            <div className="space-y-6">
              {[...grouped.entries()].map(([type, entries]) => (
                <div key={type}>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted">
                    {METRIC_LABELS[type]}
                  </h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-72 text-left text-sm">
                      <thead className="sr-only">
                        <tr>
                          <th>Value</th>
                          <th>As of</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {entries.map((m) => (
                          <tr key={m.id}>
                            <td className="py-1.5 pr-4 font-medium text-ink-900">
                              {formatMetricValue(type, Number(m.value), m.currency)}
                            </td>
                            <td className="py-1.5 text-muted">{formatDate(m.asOf)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

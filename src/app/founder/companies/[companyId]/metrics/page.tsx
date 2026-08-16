import { EditStatusAlert, isEditable } from "@/components/founder/edit-status-alert";
import { getMetricRows, requireManagerPage } from "@/components/founder/data";
import { MetricsForm, type MetricInitialRow } from "@/components/founder/metrics-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
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
                      <TD numeric className="font-medium text-ink-900">
                        {formatMetricValue(m.metricType as MetricType, Number(m.value), m.currency)}
                      </TD>
                      <TD className="text-right text-muted tabular-nums">{formatDate(m.asOf)}</TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

import { MetricsForm, type MetricInitialRow } from "@/components/founder/metrics-form";
import { WizardShell } from "@/components/founder/wizard-shell";
import { getMetricRows, requireDraftPage } from "@/components/founder/data";
import { saveMetrics } from "@/lib/actions/founder-company";
import type { MetricType } from "@/lib/constants";

export default async function OnboardingMetricsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  await requireDraftPage(companyId);
  const rows = await getMetricRows(companyId);
  const initial: MetricInitialRow[] = rows.map((r) => ({
    metricType: r.metricType as MetricType,
    value: r.value,
    currency: r.currency,
    asOf: r.asOf,
  }));
  const action = saveMetrics.bind(null, companyId, "onboarding");

  return (
    <WizardShell
      companyId={companyId}
      step={3}
      title="Share your metrics"
      description="Real numbers, reported by you, with the date they describe. Add as many or as few as you like. You can skip this entirely if you're pre-revenue."
    >
      <MetricsForm action={action} initial={initial} submitLabel="Save & continue" />
    </WizardShell>
  );
}

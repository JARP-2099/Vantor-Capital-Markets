import { GoalsForm } from "@/components/founder/goals-form";
import { WizardShell } from "@/components/founder/wizard-shell";
import { requireDraftPage } from "@/components/founder/data";
import { getCompanyIntents } from "@/db/queries/companies";
import { saveGoals } from "@/lib/actions/founder-company";

export default async function OnboardingGoalsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  await requireDraftPage(companyId);
  const intents = (await getCompanyIntents([companyId])).get(companyId) ?? [];
  const action = saveGoals.bind(null, companyId, "onboarding");

  return (
    <WizardShell
      companyId={companyId}
      step={2}
      title="What are your goals?"
      description="Signal how open your company is to investment or acquisition conversations. You can change these at any time."
    >
      <GoalsForm action={action} initial={intents} submitLabel="Save & continue" />
    </WizardShell>
  );
}

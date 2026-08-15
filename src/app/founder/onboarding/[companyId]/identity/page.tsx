import { IdentityForm } from "@/components/founder/identity-form";
import { WizardShell } from "@/components/founder/wizard-shell";
import { requireDraftPage } from "@/components/founder/data";
import { saveIdentity } from "@/lib/actions/founder-company";

export default async function OnboardingIdentityPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireDraftPage(companyId);
  const action = saveIdentity.bind(null, companyId, "onboarding");

  return (
    <WizardShell
      companyId={companyId}
      step={1}
      title="Company identity"
      description="The basics investors see first. Your changes are saved when you continue."
    >
      <IdentityForm
        action={action}
        initial={company}
        submitLabel="Save & continue"
      />
    </WizardShell>
  );
}

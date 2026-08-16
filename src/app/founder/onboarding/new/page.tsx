import { IdentityForm } from "@/components/founder/identity-form";
import { WizardShell } from "@/components/founder/wizard-shell";
import { requireUserPage } from "@/components/founder/data";
import { createCompanyDraft } from "@/lib/actions/founder-company";

export default async function OnboardingNewPage() {
  await requireUserPage();
  return (
    <WizardShell
      companyId={null}
      step={1}
      title="Tell us about your company"
      description="The basics investors see first. Everything you enter is saved as a private draft. Nothing is public until your profile is reviewed and published."
    >
      <IdentityForm action={createCompanyDraft} submitLabel="Create draft & continue" />
    </WizardShell>
  );
}

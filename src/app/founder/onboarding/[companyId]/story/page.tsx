import { StoryForm } from "@/components/founder/story-form";
import { WizardShell } from "@/components/founder/wizard-shell";
import { requireDraftPage } from "@/components/founder/data";
import { saveStory } from "@/lib/actions/founder-company";

export default async function OnboardingStoryPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireDraftPage(companyId);
  const action = saveStory.bind(null, companyId, "onboarding");

  return (
    <WizardShell
      companyId={companyId}
      step={4}
      title="Tell your story"
      description="Structured sections that make your company legible to investors. All optional — write what matters, skip what doesn't."
    >
      <StoryForm action={action} initial={company} submitLabel="Save & continue" />
    </WizardShell>
  );
}

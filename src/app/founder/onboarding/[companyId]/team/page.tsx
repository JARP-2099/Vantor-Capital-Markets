import { TeamForm, type TeamInitial } from "@/components/founder/team-form";
import { WizardShell } from "@/components/founder/wizard-shell";
import { requireDraftPage } from "@/components/founder/data";
import { getCompanyMembers } from "@/db/queries/companies";
import { saveTeam } from "@/lib/actions/founder-company";

export default async function OnboardingTeamPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireDraftPage(companyId);
  const members = await getCompanyMembers(companyId);

  const creatorRow = members.find((m) => m.userId === company.createdBy) ?? null;
  const initial: TeamInitial = {
    creator: creatorRow
      ? { name: creatorRow.name, title: creatorRow.title, bio: creatorRow.bio }
      : null,
    members: members
      .filter((m) => m.id !== creatorRow?.id)
      .map((m) => ({ name: m.name, role: m.role, title: m.title, bio: m.bio })),
  };
  const action = saveTeam.bind(null, companyId, "onboarding");

  return (
    <WizardShell
      companyId={companyId}
      step={5}
      title="Who's on the team?"
      description="List the people behind the company. Team members listed here appear on your public profile. They don't need Vantor accounts."
    >
      <TeamForm action={action} initial={initial} submitLabel="Save & continue" />
    </WizardShell>
  );
}

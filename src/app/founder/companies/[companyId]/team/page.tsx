import { EditStatusAlert, isEditable } from "@/components/founder/edit-status-alert";
import { requireManagerPage } from "@/components/founder/data";
import { TeamForm, type TeamInitial } from "@/components/founder/team-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyMembers } from "@/db/queries/companies";
import { saveTeam } from "@/lib/actions/founder-company";
import type { CompanyStatus } from "@/lib/constants";

export default async function ManageTeamPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireManagerPage(companyId);
  const status = company.status as CompanyStatus;
  const disabled = !isEditable(status);
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

  return (
    <div className="space-y-6">
      <EditStatusAlert status={status} />
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardBody>
          <TeamForm
            action={saveTeam.bind(null, companyId, "manage")}
            initial={initial}
            submitLabel="Save team"
            disabled={disabled}
          />
        </CardBody>
      </Card>
    </div>
  );
}

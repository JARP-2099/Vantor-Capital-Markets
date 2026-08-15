import { EditStatusAlert, isEditable } from "@/components/founder/edit-status-alert";
import { requireManagerPage } from "@/components/founder/data";
import { IdentityForm } from "@/components/founder/identity-form";
import { StoryForm } from "@/components/founder/story-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { saveIdentity, saveStory } from "@/lib/actions/founder-company";
import type { CompanyStatus } from "@/lib/constants";

export default async function ManageProfilePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { company } = await requireManagerPage(companyId);
  const status = company.status as CompanyStatus;
  const disabled = !isEditable(status);

  return (
    <div className="space-y-6">
      <EditStatusAlert status={status} />

      <Card>
        <CardHeader>
          <CardTitle>Company identity</CardTitle>
        </CardHeader>
        <CardBody>
          <IdentityForm
            action={saveIdentity.bind(null, companyId, "manage")}
            initial={company}
            submitLabel="Save identity"
            disabled={disabled}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Story</CardTitle>
        </CardHeader>
        <CardBody>
          <StoryForm
            action={saveStory.bind(null, companyId, "manage")}
            initial={company}
            submitLabel="Save story"
            disabled={disabled}
          />
        </CardBody>
      </Card>
    </div>
  );
}

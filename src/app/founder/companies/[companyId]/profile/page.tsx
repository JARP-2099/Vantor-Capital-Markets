import type { ReactNode } from "react";
import { EditStatusAlert, isEditable } from "@/components/founder/edit-status-alert";
import { requireManagerPage } from "@/components/founder/data";
import { IdentityForm } from "@/components/founder/identity-form";
import { StoryForm } from "@/components/founder/story-form";
import { Card, CardBody } from "@/components/ui/card";
import { saveIdentity, saveStory } from "@/lib/actions/founder-company";
import type { CompanyStatus } from "@/lib/constants";

/**
 * Settings-style section: a sticky descriptive rail on the left, the form on
 * the right. Identity and Story are separate forms with separate save
 * buttons — the rail says exactly what each save covers.
 */
function FormSection({
  title,
  description,
  saveNote,
  children,
}: {
  title: string;
  description: string;
  saveNote: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        <p className="mt-3 text-xs leading-relaxed text-faint">{saveNote}</p>
      </div>
      <Card>
        <CardBody className="pt-5">{children}</CardBody>
      </Card>
    </section>
  );
}

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
    <div className="space-y-8">
      <EditStatusAlert status={status} />

      <FormSection
        title="Company identity"
        description="The facts investors see first — name, location, industry, stage, and your one-line description."
        saveNote="Saved separately with “Save identity”."
      >
        <IdentityForm
          action={saveIdentity.bind(null, companyId, "manage")}
          initial={company}
          submitLabel="Save identity"
          disabled={disabled}
        />
      </FormSection>

      <div aria-hidden="true" className="border-t border-line" />

      <FormSection
        title="Story"
        description="Eight structured sections that make your company legible — problem, solution, market, and how you execute."
        saveNote="Saved separately with “Save story”."
      >
        <StoryForm
          action={saveStory.bind(null, companyId, "manage")}
          initial={company}
          submitLabel="Save story"
          disabled={disabled}
        />
      </FormSection>
    </div>
  );
}

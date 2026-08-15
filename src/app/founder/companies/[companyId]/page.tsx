import { getMetricRows, requireManagerPage } from "@/components/founder/data";
import { computeCompletion } from "@/components/founder/profile-completion";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanyIntents, getCompanyMembers } from "@/db/queries/companies";
import { INTENT_LABELS, type CompanyStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const STEP_BY_CHECKLIST_KEY = {
  identity: "identity",
  goals: "goals",
  metrics: "metrics",
  story: "story",
  team: "team",
} as const;

function StatusExplanation({ status }: { status: CompanyStatus }) {
  if (status === "submitted" || status === "under_review") {
    return (
      <Alert tone="warn" title="Awaiting review">
        Your profile is with the Vantor review team. It is read-only until the review is complete —
        we&apos;ll notify you as soon as there&apos;s a decision.
      </Alert>
    );
  }
  if (status === "published") {
    return (
      <Alert tone="success" title="Your company is live">
        Investors can see your profile on the marketplace. Edits made in the Profile, Metrics, and
        Team tabs appear publicly as soon as you save.
      </Alert>
    );
  }
  if (status === "archived") {
    return (
      <Alert tone="warn" title="Archived">
        This profile is no longer public and can&apos;t be edited. Contact the Vantor team if you
        believe this is a mistake.
      </Alert>
    );
  }
  return null;
}

export default async function CompanyOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const [{ companyId }, { submitted }] = await Promise.all([params, searchParams]);
  const { company } = await requireManagerPage(companyId);
  const [intents, metrics, members] = await Promise.all([
    getCompanyIntents([companyId]).then((m) => m.get(companyId) ?? []),
    getMetricRows(companyId),
    getCompanyMembers(companyId),
  ]);

  const status = company.status as CompanyStatus;
  const completion = computeCompletion({
    company,
    intentsCount: intents.length,
    metricsCount: metrics.length,
    teamCount: members.length,
  });
  const requirementsMet = completion.identityComplete && intents.length > 0;

  return (
    <div className="space-y-6">
      {submitted === "1" && (status === "submitted" || status === "under_review") ? (
        <Alert tone="success" title="Submitted for review">
          Thanks — your profile is now with the Vantor review team. We&apos;ll let you know when
          it&apos;s approved{company.submittedAt ? ` (submitted ${formatDate(company.submittedAt)})` : ""}.
        </Alert>
      ) : null}

      {company.reviewNotes ? (
        <Alert tone="warn" title="Feedback from the review team">
          <p className="whitespace-pre-wrap">{company.reviewNotes}</p>
          {status === "draft" ? (
            <p className="mt-2">
              Address the notes above, then submit your profile for review again.
            </p>
          ) : null}
        </Alert>
      ) : null}

      <StatusExplanation status={status} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile checklist</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Overall completion</span>
              <span className="font-semibold text-ink-900">{completion.percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={completion.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
              className="mt-2 h-2 overflow-hidden rounded-full bg-mist"
            >
              <div
                className="h-full rounded-full bg-accent-500"
                style={{ width: `${completion.percent}%` }}
              />
            </div>
            <ul className="mt-5 divide-y divide-line">
              {completion.items.map((item) => (
                <li key={item.key} className="flex items-start gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      item.done ? "bg-positive-50 text-positive-700" : "bg-mist text-faint",
                    )}
                  >
                    {item.done ? "✓" : "·"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">
                      {item.label}
                      <span className="sr-only">{item.done ? " — complete" : " — incomplete"}</span>
                    </p>
                    <p className="text-xs text-muted">{item.detail}</p>
                  </div>
                  {status === "draft" ? (
                    <ButtonLink
                      href={`/founder/onboarding/${companyId}/${STEP_BY_CHECKLIST_KEY[item.key]}`}
                      variant="ghost"
                      size="sm"
                      className="ml-auto shrink-0 text-accent-600"
                    >
                      Edit
                    </ButtonLink>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current goals</CardTitle>
            </CardHeader>
            <CardBody>
              {intents.length === 0 ? (
                <p className="text-sm text-faint">Not provided</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intents.map((i) => (
                    <Badge key={i} tone="accent">
                      {INTENT_LABELS[i]}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {status === "draft" ? (
            <Card>
              <CardHeader>
                <CardTitle>Next step</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {requirementsMet ? (
                  <>
                    <p className="text-sm leading-relaxed text-muted">
                      Your profile meets the submission requirements. Review it one last time, then
                      send it in.
                    </p>
                    <ButtonLink href={`/founder/onboarding/${companyId}/review`} className="w-full">
                      Submit for review
                    </ButtonLink>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-muted">
                      Finish the required sections — identity and at least one goal — to submit your
                      profile for review.
                    </p>
                    <ButtonLink
                      href={`/founder/onboarding/${companyId}/${completion.identityComplete ? "goals" : "identity"}`}
                      className="w-full"
                    >
                      Continue onboarding
                    </ButtonLink>
                  </>
                )}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

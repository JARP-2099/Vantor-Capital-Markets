import { StatusBadge } from "@/components/founder/status-badge";
import type { ProfileCompletion } from "@/components/founder/profile-completion";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { CompanyRow } from "@/db/queries/companies";
import type { CompanyStatus } from "@/lib/constants";
import { cn } from "@/lib/cn";

type CompanyCardProps = {
  company: CompanyRow;
  completion: ProfileCompletion;
  /** Single-company layout: spread the card horizontally so the page doesn't look empty. */
  wide?: boolean;
};

/** Wizard step that resumes onboarding for a draft. */
function draftResumeSegment(completion: ProfileCompletion): string {
  if (!completion.identityComplete) return "identity";
  const goals = completion.items.find((i) => i.key === "goals");
  if (goals && !goals.done) return "goals";
  return "review";
}

/** One line describing what deserves the founder's attention next. */
function nextAttention(status: CompanyStatus, completion: ProfileCompletion): string {
  if (status === "submitted" || status === "under_review") {
    return "With the Vantor review team — read-only until a decision.";
  }
  if (status === "archived") {
    return "Archived — no longer public.";
  }
  const firstIncomplete = completion.items.find((i) => !i.done);
  if (status === "draft") {
    return firstIncomplete
      ? `Next: ${firstIncomplete.label.toLowerCase()} — ${firstIncomplete.detail.toLowerCase()}`
      : "Ready to submit for review.";
  }
  // published
  return firstIncomplete
    ? `Next: ${firstIncomplete.label.toLowerCase()} — ${firstIncomplete.detail.toLowerCase()}`
    : "Profile complete — keep your metrics current.";
}

export function CompanyCard({ company, completion, wide = false }: CompanyCardProps) {
  const status = company.status as CompanyStatus;
  const percent = completion.percent;
  const attention = nextAttention(status, completion);

  const completionBlock = (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted">Profile completion</span>
        <span className="font-semibold text-ink-900 tabular-nums">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Profile completion for ${company.name}`}
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist"
      >
        <div className="h-full rounded-full bg-accent-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );

  const actions = (
    <div className="flex flex-wrap gap-2">
      {status === "draft" ? (
        <>
          <ButtonLink
            href={`/founder/onboarding/${company.id}/${draftResumeSegment(completion)}`}
            size="sm"
          >
            Continue onboarding
          </ButtonLink>
          <ButtonLink href={`/founder/companies/${company.id}`} size="sm" variant="secondary">
            Manage
          </ButtonLink>
        </>
      ) : (
        <ButtonLink href={`/founder/companies/${company.id}`} size="sm">
          Manage
        </ButtonLink>
      )}
    </div>
  );

  return (
    <Card>
      <CardBody
        className={cn("pt-5", wide && "sm:grid sm:grid-cols-[minmax(0,1fr)_15rem] sm:gap-8")}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="text-base font-semibold tracking-tight text-ink-900">{company.name}</h3>
            <StatusBadge status={status} dot />
          </div>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed text-muted",
              !wide && "line-clamp-2 min-h-10",
            )}
          >
            {company.shortDescription ?? "No description yet."}
          </p>
          <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-slate-650">
            {attention}
          </p>
          {!wide ? (
            <>
              <div className="mt-4">{completionBlock}</div>
              <div className="mt-5">{actions}</div>
            </>
          ) : null}
        </div>
        {wide ? (
          <div className="mt-5 flex flex-col justify-between gap-5 border-t border-line pt-4 sm:mt-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
            {completionBlock}
            {actions}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

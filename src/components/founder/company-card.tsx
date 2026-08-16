import { StatusBadge } from "@/components/founder/status-badge";
import type { ProfileCompletion } from "@/components/founder/profile-completion";
import { ButtonLink } from "@/components/ui/button";
import type { CompanyRow } from "@/db/queries/companies";
import type { CompanyStatus } from "@/lib/constants";

type CompanyCardProps = {
  company: CompanyRow;
  completion: ProfileCompletion;
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

/**
 * Wide row-panel for the founder dashboard: identity + status on the left,
 * completion and primary actions in a fixed right rail. One panel per
 * company, always full width — the dashboard is a worklist, not a gallery.
 */
export function CompanyCard({ company, completion }: CompanyCardProps) {
  const status = company.status as CompanyStatus;
  const percent = completion.percent;
  const attention = nextAttention(status, completion);

  return (
    <article className="rounded-lg border border-line bg-paper shadow-card">
      <div className="p-5 sm:grid sm:grid-cols-[minmax(0,1fr)_16rem] sm:gap-8 sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-lg font-bold tracking-tight text-ink-900">{company.name}</h3>
            <StatusBadge status={status} dot />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {company.shortDescription ?? "No description yet."}
          </p>
          <p className="mt-4 flex items-start gap-2 border-t border-line pt-3.5 text-sm leading-relaxed text-slate-650">
            <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-600" />
            {attention}
          </p>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-5 border-t border-line pt-4 sm:mt-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Completion
              </span>
              <span
                data-metric-value
                className="text-lg font-bold tracking-tight text-ink-900 tabular-nums"
              >
                {percent}%
              </span>
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
        </div>
      </div>
    </article>
  );
}

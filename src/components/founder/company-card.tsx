import { StatusBadge } from "@/components/founder/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { CompanyRow } from "@/db/queries/companies";
import type { CompanyStatus } from "@/lib/constants";

type CompanyCardProps = {
  company: CompanyRow;
  completionPercent: number;
};

export function CompanyCard({ company, completionPercent }: CompanyCardProps) {
  const status = company.status as CompanyStatus;
  return (
    <Card>
      <CardBody className="pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-ink-900">{company.name}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted">
          {company.shortDescription ?? "No description yet."}
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted">Profile completion</span>
            <span className="font-semibold text-ink-900">{completionPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Profile completion for ${company.name}`}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist"
          >
            <div
              className="h-full rounded-full bg-accent-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {status === "draft" ? (
            <ButtonLink href={`/founder/onboarding/${company.id}/identity`} size="sm">
              Continue onboarding
            </ButtonLink>
          ) : null}
          <ButtonLink
            href={`/founder/companies/${company.id}`}
            size="sm"
            variant={status === "draft" ? "secondary" : "primary"}
          >
            Manage
          </ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}

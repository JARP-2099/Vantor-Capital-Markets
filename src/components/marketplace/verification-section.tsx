import type { PublicVerificationSummary } from "@/db/queries/verifications";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  VERIFICATION_CATEGORY_LABELS,
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus,
} from "@/lib/verification/constants";

const STATUS_TONES: Record<VerificationStatus, "neutral" | "warn" | "positive" | "negative" | "accent"> = {
  pending: "warn",
  under_review: "warn",
  verified: "positive",
  partially_verified: "accent",
  rejected: "negative",
  needs_update: "negative",
  expired: "neutral",
};

/**
 * Public profile verification section. Pure presentation of the status-only
 * summary — never evidence, notes, reviewer identity, or dates. Returns null
 * when nothing has been submitted.
 */
export function VerificationSection({ summary }: { summary: PublicVerificationSummary }) {
  if (summary.categories.length === 0) return null;

  return (
    <div className="mt-5 space-y-5">
      {summary.verifiedPct !== null ? (
        <div>
          <p className="text-3xl font-bold text-ink-900">{summary.verifiedPct}% Verified</p>
          <p className="mt-1 text-sm text-muted">
            Share of information submitted for review that Vantor has verified
          </p>
        </div>
      ) : null}

      <Card>
        <ul className="divide-y divide-line">
          {summary.categories.map(({ category, status }) => (
            <li
              key={category}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
            >
              <span className="text-sm font-medium text-ink-900">
                {VERIFICATION_CATEGORY_LABELS[category]}
              </span>
              <Badge tone={STATUS_TONES[status]}>{VERIFICATION_STATUS_LABELS[status]}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-xs leading-relaxed text-faint">
        Verification reflects Vantor&apos;s review of submitted evidence. It is not an endorsement
        or investment assessment.
      </p>
    </div>
  );
}

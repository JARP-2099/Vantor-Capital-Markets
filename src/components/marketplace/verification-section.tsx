import type { PublicVerificationSummary } from "@/db/queries/verifications";
import { cn } from "@/lib/cn";
import {
  VERIFICATION_CATEGORY_LABELS,
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus,
} from "@/lib/verification/constants";

/*
 * Dark diligence language: sage green for verified, amber for in-flight,
 * neutral gray otherwise. Status is text, not a wall of badges.
 */
const STATUS_CLASSES: Record<VerificationStatus, string> = {
  pending: "text-warn-700",
  under_review: "text-warn-700",
  verified: "text-positive-700",
  partially_verified: "text-positive-700",
  rejected: "text-negative-700",
  needs_update: "text-negative-700",
  expired: "text-muted",
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
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold text-ink-900 tabular-nums">{summary.verifiedPct}%</p>
          <p className="text-sm text-muted">of submitted information verified</p>
        </div>
      ) : null}

      <ul className="max-w-2xl divide-y divide-line border-y border-line">
        {summary.categories.map(({ category, status }) => (
          <li
            key={category}
            className="flex flex-wrap items-center justify-between gap-2 py-3"
          >
            <span className="text-sm font-medium text-ink-900">
              {VERIFICATION_CATEGORY_LABELS[category]}
            </span>
            <span className={cn("text-sm font-medium", STATUS_CLASSES[status])}>
              {VERIFICATION_STATUS_LABELS[status]}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-faint">
        Verification reflects Vantor&apos;s review of submitted evidence. It is not an endorsement
        or investment assessment.
      </p>
    </div>
  );
}

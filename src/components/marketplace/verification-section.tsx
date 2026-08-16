import type { PublicVerificationSummary } from "@/db/queries/verifications";
import { Badge } from "@/components/ui/badge";
import { SegmentedBar } from "@/components/ui/charts";
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

/** Segment tone per publicly listed status: verified fills green, in-flight amber, pending neutral. */
const SEGMENT_TONES: Record<VerificationStatus, "positive" | "warn" | "negative" | "neutral" | "accent"> = {
  verified: "positive",
  partially_verified: "warn",
  under_review: "warn",
  pending: "neutral",
  rejected: "negative",
  needs_update: "negative",
  expired: "neutral",
};

/**
 * Public profile verification section — V2. Pure presentation of the
 * status-only summary — never evidence, notes, reviewer identity, or dates.
 * Returns null when nothing has been submitted.
 */
export function VerificationSection({ summary }: { summary: PublicVerificationSummary }) {
  if (summary.categories.length === 0) return null;

  return (
    <div className="mt-6 space-y-8">
      {summary.verifiedPct !== null ? (
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-ink-900 tabular-nums">
            {summary.verifiedPct}% Verified
          </p>
          <p className="mt-1 text-sm text-muted">
            Share of information submitted for review that Vantor has verified
          </p>
          {/* One segment per submitted category — the figure above carries the value. */}
          <SegmentedBar
            segments={summary.categories.map(({ status }) => ({ tone: SEGMENT_TONES[status] }))}
            className="mt-4 max-w-xl"
          />
        </div>
      ) : null}

      <ul className="divide-y divide-line border-t border-line">
        {summary.categories.map(({ category, status }) => (
          <li
            key={category}
            className="flex flex-wrap items-center justify-between gap-2 py-3.5"
          >
            <span className="text-sm font-medium text-ink-900">
              {VERIFICATION_CATEGORY_LABELS[category]}
            </span>
            <Badge dot tone={STATUS_TONES[status]}>
              {VERIFICATION_STATUS_LABELS[status]}
            </Badge>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted">
        Verification reflects Vantor&apos;s review of submitted evidence. It is not an endorsement
        or investment assessment.
      </p>
    </div>
  );
}

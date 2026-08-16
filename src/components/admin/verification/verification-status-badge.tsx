import { Badge } from "@/components/ui/badge";
import {
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus,
} from "@/lib/verification/constants";

const STATUS_TONES: Record<
  VerificationStatus,
  "neutral" | "warn" | "positive" | "negative" | "accent"
> = {
  pending: "warn",
  under_review: "accent",
  verified: "positive",
  partially_verified: "positive",
  rejected: "negative",
  needs_update: "warn",
  expired: "neutral",
};

/** Quiet dot-badge rendering of a verification request's status. */
export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot>
      {VERIFICATION_STATUS_LABELS[status]}
    </Badge>
  );
}

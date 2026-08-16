import { Badge } from "@/components/ui/badge";
import {
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

export function VerificationStatusBadge({
  status,
  dot = false,
}: {
  status: VerificationStatus;
  dot?: boolean;
}) {
  return (
    <Badge tone={STATUS_TONES[status]} dot={dot}>
      {VERIFICATION_STATUS_LABELS[status]}
    </Badge>
  );
}

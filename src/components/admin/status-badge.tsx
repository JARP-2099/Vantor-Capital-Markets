import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type CompanyStatus } from "@/lib/constants";

const STATUS_TONES: Record<
  CompanyStatus,
  "neutral" | "accent" | "positive" | "negative" | "warn" | "ink"
> = {
  draft: "neutral",
  submitted: "warn",
  under_review: "accent",
  published: "positive",
  archived: "ink",
};

/**
 * Consistent lifecycle status across all admin tables and detail pages.
 * Rendered as a quiet dot badge — status columns stay scannable without
 * filling the screen with colored pills.
 */
export function StatusBadge({ status }: { status: CompanyStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

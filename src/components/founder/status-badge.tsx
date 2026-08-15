import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type CompanyStatus } from "@/lib/constants";

const STATUS_TONES: Record<CompanyStatus, "neutral" | "warn" | "positive"> = {
  draft: "neutral",
  submitted: "warn",
  under_review: "warn",
  published: "positive",
  archived: "neutral",
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

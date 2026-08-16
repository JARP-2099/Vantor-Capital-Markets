import type { PublicVerificationSummary } from "@/db/queries/verifications";

/**
 * Public profile verification section. Placeholder — implemented by the
 * verification workstream. Renders status-only data (never evidence or
 * notes); returns null when nothing has been submitted.
 */
export function VerificationSection(_props: { summary: PublicVerificationSummary }) {
  return null;
}

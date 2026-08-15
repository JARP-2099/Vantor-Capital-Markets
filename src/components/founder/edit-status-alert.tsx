import { Alert } from "@/components/ui/alert";
import type { CompanyStatus } from "@/lib/constants";

/** True when a profile can currently be edited by its founders. */
export function isEditable(status: CompanyStatus): boolean {
  return status === "draft" || status === "published";
}

/** Status-dependent banner shown above every manage-tab form. */
export function EditStatusAlert({ status }: { status: CompanyStatus }) {
  if (status === "submitted" || status === "under_review") {
    return (
      <Alert tone="warn" title="Locked during review">
        Your profile has been submitted and is read-only while the Vantor team reviews it.
        You&apos;ll be able to edit again once the review is complete.
      </Alert>
    );
  }
  if (status === "published") {
    return (
      <Alert tone="info">
        Your company is live. Changes appear publicly as soon as you save.
      </Alert>
    );
  }
  if (status === "archived") {
    return (
      <Alert tone="warn" title="Archived">
        This company is archived and read-only. Contact the Vantor team if you believe this is a
        mistake.
      </Alert>
    );
  }
  return null;
}

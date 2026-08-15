"use client";

import { useActionState } from "react";
import { IDLE_STATE, SubmitButton } from "@/components/founder/form-support";
import { Alert } from "@/components/ui/alert";
import type { FounderFormState } from "@/lib/actions/founder-company";

/** Human labels for submission-requirement error paths. */
const REQUIREMENT_LABELS: Record<string, string> = {
  "identity.name": "Company name",
  "identity.website": "Website",
  "identity.industry": "Industry",
  "identity.stage": "Stage",
  "identity.businessModel": "Business model",
  "identity.shortDescription": "Short description",
  "identity.foundedYear": "Founded year",
  "identity.hqCity": "HQ city",
  "identity.hqCountry": "HQ country",
  "identity.subindustry": "Subindustry",
  intents: "Goals",
};

type SubmitPanelProps = {
  action: (prev: FounderFormState, formData: FormData) => Promise<FounderFormState>;
};

export function SubmitPanel({ action }: SubmitPanelProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const fieldErrors = Object.entries(state.fieldErrors ?? {});

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" ? (
        <Alert tone="error" title={state.message}>
          {fieldErrors.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-5">
              {fieldErrors.map(([path, message]) => (
                <li key={path}>
                  <span className="font-medium">{REQUIREMENT_LABELS[path] ?? path}:</span>{" "}
                  {message}
                </li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted">
          Submitting sends your profile to the Vantor team for review. You will not be able to edit
          it while the review is in progress.
        </p>
        <SubmitButton pending={pending} className="shrink-0">
          Submit for review
        </SubmitButton>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { FormStateAlert, IDLE_STATE, SubmitButton } from "@/components/founder/form-support";
import { EvidenceFields } from "@/components/founder/verification/evidence-fields";
import type { VerificationFormState } from "@/lib/actions/verification";

type AddEvidenceFormProps = {
  /** addVerificationEvidence with companyId server-bound via .bind. */
  action: (prev: VerificationFormState, formData: FormData) => Promise<VerificationFormState>;
  requestId: string;
};

/** Attach further evidence to an existing open request (e.g. needs_update). */
export function AddEvidenceForm({ action, requestId }: AddEvidenceFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.fieldErrors ?? {};
  const idPrefix = `evidence-${requestId.slice(0, 8)}`;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <FormStateAlert state={state} />
      <input type="hidden" name="requestId" value={requestId} />
      <EvidenceFields
        idPrefix={idPrefix}
        kindError={errors.kind}
        descriptionError={errors.description}
        referenceError={errors.reference}
      />
      <SubmitButton pending={pending}>Add evidence</SubmitButton>
    </form>
  );
}

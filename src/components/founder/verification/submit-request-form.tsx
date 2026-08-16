"use client";

import { useActionState } from "react";
import { FormStateAlert, IDLE_STATE, invalidProps, SubmitButton } from "@/components/founder/form-support";
import { EvidenceFields } from "@/components/founder/verification/evidence-fields";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";
import type { VerificationFormState } from "@/lib/actions/verification";
import {
  VERIFICATION_CATEGORIES,
  VERIFICATION_CATEGORY_LABELS,
  type VerificationCategory,
} from "@/lib/verification/constants";

type SubmitRequestFormProps = {
  /** submitVerificationRequest with companyId server-bound via .bind. */
  action: (prev: VerificationFormState, formData: FormData) => Promise<VerificationFormState>;
  /** Categories whose latest request is pending or under review. */
  blockedCategories: VerificationCategory[];
  /** Preselected category (from a "Request verification" row link). */
  defaultCategory?: VerificationCategory;
};

export function SubmitRequestForm({
  action,
  blockedCategories,
  defaultCategory,
}: SubmitRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.fieldErrors ?? {};
  const blocked = new Set(blockedCategories);
  const preselected =
    defaultCategory && !blocked.has(defaultCategory) ? defaultCategory : "";

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormStateAlert state={state} />

      <Field label="Category" htmlFor="verification-category" required error={errors.category}>
        <Select
          id="verification-category"
          name="category"
          key={preselected}
          defaultValue={preselected}
          {...invalidProps("verification-category", errors.category)}
        >
          <option value="" disabled>
            Select a category
          </option>
          {VERIFICATION_CATEGORIES.map((category) => (
            <option key={category} value={category} disabled={blocked.has(category)}>
              {VERIFICATION_CATEGORY_LABELS[category]}
              {blocked.has(category) ? " — awaiting review" : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Claim to verify"
        htmlFor="verification-claim"
        required
        hint="State the specific claim, e.g. 'Our ARR as of June 2026 is $1.2M'"
        error={errors.claimSummary}
      >
        <Textarea
          id="verification-claim"
          name="claimSummary"
          rows={4}
          maxLength={2000}
          {...invalidProps("verification-claim", errors.claimSummary)}
        />
      </Field>

      <fieldset className="rounded-lg border border-line bg-canvas p-4">
        <legend className="float-left mb-3 w-full text-sm font-medium text-ink-900">
          Initial evidence <span className="font-normal text-muted">(optional)</span>
        </legend>
        <div className="clear-both space-y-4">
          <EvidenceFields
            idPrefix="verification-evidence"
            optional
            kindError={errors["evidence.kind"]}
            descriptionError={errors["evidence.description"]}
            referenceError={errors["evidence.reference"]}
          />
        </div>
      </fieldset>

      <div className="border-t border-line pt-4">
        <SubmitButton pending={pending}>Submit for verification</SubmitButton>
      </div>
    </form>
  );
}

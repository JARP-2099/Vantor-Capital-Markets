"use client";

import { useActionState } from "react";
import { FormStateAlert, IDLE_STATE, SubmitButton } from "@/components/founder/form-support";
import type { FounderFormState } from "@/lib/actions/founder-company";
import { COMPANY_INTENTS, INTENT_LABELS, type CompanyIntent } from "@/lib/constants";

const INTENT_HELP: Record<CompanyIntent, string> = {
  not_raising: "You are not looking for capital right now.",
  seeking_investment: "You are actively speaking with prospective investors.",
  open_to_strategic_investment: "You would consider investment from a strategic partner.",
  open_to_minority_investment: "You would consider selling a minority stake.",
  open_to_majority_acquisition: "You would consider selling a majority stake.",
  open_to_full_acquisition: "You would consider selling the company outright.",
  open_to_acquisition_offers: "You are open to hearing acquisition offers.",
};

type GoalsFormProps = {
  action: (prev: FounderFormState, formData: FormData) => Promise<FounderFormState>;
  initial: CompanyIntent[];
  submitLabel: string;
  disabled?: boolean;
};

export function GoalsForm({ action, initial, submitLabel, disabled }: GoalsFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const error = state.fieldErrors?.intents;

  return (
    <form action={formAction} noValidate>
      <fieldset disabled={disabled} className="space-y-5">
        <FormStateAlert state={state} />

        <fieldset
          aria-describedby={error ? "intents-error" : "intents-help"}
          aria-invalid={error ? true : undefined}
          className="space-y-2"
        >
          <legend className="text-sm font-medium text-ink-900">
            How would you describe your company&apos;s current posture?
          </legend>
          <p id="intents-help" className="text-xs leading-relaxed text-muted">
            This describes your company&apos;s openness to conversations. It is not an offering of
            securities. Select every option that applies.
          </p>
          <div className="space-y-2 pt-1">
            {COMPANY_INTENTS.map((intent) => (
              <label
                key={intent}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper px-4 py-3 transition-colors hover:border-faint has-[:checked]:border-accent-500 has-[:checked]:bg-accent-50"
              >
                <input
                  type="checkbox"
                  name="intents"
                  value={intent}
                  defaultChecked={initial.includes(intent)}
                  className="mt-0.5 size-4 accent-accent-600"
                />
                <span>
                  <span className="block text-sm font-medium text-ink-900">
                    {INTENT_LABELS[intent]}
                  </span>
                  <span className="block text-xs text-muted">{INTENT_HELP[intent]}</span>
                </span>
              </label>
            ))}
          </div>
          {error ? (
            <p id="intents-error" role="alert" className="text-xs font-medium text-negative-700">
              {error}
            </p>
          ) : null}
        </fieldset>

        {!disabled ? (
          <div className="border-t border-line pt-4">
            <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

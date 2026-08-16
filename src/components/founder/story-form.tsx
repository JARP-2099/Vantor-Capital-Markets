"use client";

import { useActionState } from "react";
import {
  FormStateAlert,
  IDLE_STATE,
  invalidProps,
  SubmitButton,
} from "@/components/founder/form-support";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import type { FounderFormState } from "@/lib/actions/founder-company";

const SECTIONS = [
  {
    name: "problem",
    label: "Problem",
    hint: "What painful, expensive, or unavoidable problem do your customers face today? Describe who has it and how they cope without you.",
  },
  {
    name: "solution",
    label: "Solution",
    hint: "How does your product solve that problem? Focus on what changes for the customer, not on feature lists.",
  },
  {
    name: "market",
    label: "Market",
    hint: "Who buys this and how many of them are there? Share how you think about the size and shape of your market.",
  },
  {
    name: "competitivePosition",
    label: "Competitive position",
    hint: "Who else solves this problem, and why do customers choose you? Honest comparisons read better than claiming no competition.",
  },
  {
    name: "businessModelDescription",
    label: "Business model",
    hint: "How do you make money? Explain pricing, who pays, and what drives revenue growth.",
  },
  {
    name: "traction",
    label: "Traction",
    hint: "What proof do you have that this is working? Customers, revenue, partnerships, retention — concrete beats abstract.",
  },
  {
    name: "roadmap",
    label: "Roadmap",
    hint: "Where is the company going over the next 12–24 months? Milestones you plan to hit and what unlocks them.",
  },
  {
    name: "fullDescription",
    label: "Full description",
    hint: "A longer overview of the company in your own words. This can tie all the sections above into one narrative.",
  },
] as const;

/** Presentation grouping only — every field still lives in the one story form. */
const GROUPS = [
  { title: "The opportunity", sections: SECTIONS.slice(0, 4) },
  { title: "How you execute", sections: SECTIONS.slice(4, 7) },
  { title: "In your own words", sections: SECTIONS.slice(7) },
] as const;

export type StoryInitial = Partial<Record<(typeof SECTIONS)[number]["name"], string | null>>;

type StoryFormProps = {
  action: (prev: FounderFormState, formData: FormData) => Promise<FounderFormState>;
  initial: StoryInitial;
  submitLabel: string;
  disabled?: boolean;
};

export function StoryForm({ action, initial, submitLabel, disabled }: StoryFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <fieldset disabled={disabled} className="space-y-5">
        <FormStateAlert state={state} />
        <p className="text-xs leading-relaxed text-muted">
          Every section is optional — write the ones that matter for your company. You can come
          back and refine them at any time.
        </p>
        {GROUPS.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? "border-t border-line pt-5" : undefined}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              {group.title}
            </p>
            <div className="mt-3 space-y-5">
              {group.sections.map((s) => (
                <Field
                  key={s.name}
                  label={s.label}
                  htmlFor={s.name}
                  hint={s.hint}
                  error={errors[s.name]}
                >
                  <Textarea
                    id={s.name}
                    name={s.name}
                    defaultValue={initial[s.name] ?? ""}
                    rows={s.name === "fullDescription" ? 6 : 4}
                    className={s.name === "fullDescription" ? undefined : "min-h-24"}
                    {...invalidProps(s.name, errors[s.name])}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
        {!disabled ? (
          <div className="border-t border-line pt-4">
            <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

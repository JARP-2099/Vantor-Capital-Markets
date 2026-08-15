"use client";

import { useActionState } from "react";
import {
  FormStateAlert,
  IDLE_STATE,
  invalidProps,
  SubmitButton,
} from "@/components/founder/form-support";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import type { FounderFormState } from "@/lib/actions/founder-company";
import {
  BUSINESS_MODELS,
  BUSINESS_MODEL_LABELS,
  COMPANY_STAGES,
  INDUSTRIES,
  STAGE_LABELS,
} from "@/lib/constants";

export type IdentityInitial = {
  name?: string;
  website?: string | null;
  hqCity?: string | null;
  hqCountry?: string | null;
  industry?: string | null;
  subindustry?: string | null;
  foundedYear?: number | null;
  stage?: string | null;
  businessModel?: string | null;
  shortDescription?: string | null;
};

type IdentityFormProps = {
  action: (prev: FounderFormState, formData: FormData) => Promise<FounderFormState>;
  initial?: IdentityInitial;
  submitLabel: string;
  disabled?: boolean;
};

export function IdentityForm({ action, initial, submitLabel, disabled }: IdentityFormProps) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <fieldset disabled={disabled} className="space-y-5">
        <FormStateAlert state={state} />

        <Field label="Company name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            defaultValue={initial?.name ?? ""}
            maxLength={80}
            autoComplete="organization"
            {...invalidProps("name", errors.name)}
          />
        </Field>

        <Field
          label="Website"
          htmlFor="website"
          hint="e.g. yourcompany.com — we'll add https:// for you"
          error={errors.website}
        >
          <Input
            id="website"
            name="website"
            inputMode="url"
            defaultValue={initial?.website ?? ""}
            placeholder="yourcompany.com"
            {...invalidProps("website", errors.website)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="HQ city" htmlFor="hqCity" error={errors.hqCity}>
            <Input
              id="hqCity"
              name="hqCity"
              defaultValue={initial?.hqCity ?? ""}
              autoComplete="address-level2"
              {...invalidProps("hqCity", errors.hqCity)}
            />
          </Field>
          <Field label="HQ country" htmlFor="hqCountry" error={errors.hqCountry}>
            <Input
              id="hqCountry"
              name="hqCountry"
              defaultValue={initial?.hqCountry ?? ""}
              autoComplete="country-name"
              {...invalidProps("hqCountry", errors.hqCountry)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Industry" htmlFor="industry" required error={errors.industry}>
            <Select
              id="industry"
              name="industry"
              defaultValue={initial?.industry ?? ""}
              {...invalidProps("industry", errors.industry)}
            >
              <option value="" disabled>
                Select an industry
              </option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Subindustry"
            htmlFor="subindustry"
            hint="Optional — e.g. Fraud detection"
            error={errors.subindustry}
          >
            <Input
              id="subindustry"
              name="subindustry"
              defaultValue={initial?.subindustry ?? ""}
              {...invalidProps("subindustry", errors.subindustry)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Founded year" htmlFor="foundedYear" error={errors.foundedYear}>
            <Input
              id="foundedYear"
              name="foundedYear"
              type="number"
              inputMode="numeric"
              min={1800}
              max={new Date().getFullYear() + 1}
              defaultValue={initial?.foundedYear ?? ""}
              {...invalidProps("foundedYear", errors.foundedYear)}
            />
          </Field>
          <Field label="Stage" htmlFor="stage" required error={errors.stage}>
            <Select
              id="stage"
              name="stage"
              defaultValue={initial?.stage ?? ""}
              {...invalidProps("stage", errors.stage)}
            >
              <option value="" disabled>
                Select a stage
              </option>
              {COMPANY_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Business model"
            htmlFor="businessModel"
            required
            error={errors.businessModel}
          >
            <Select
              id="businessModel"
              name="businessModel"
              defaultValue={initial?.businessModel ?? ""}
              {...invalidProps("businessModel", errors.businessModel)}
            >
              <option value="" disabled>
                Select a model
              </option>
              {BUSINESS_MODELS.map((m) => (
                <option key={m} value={m}>
                  {BUSINESS_MODEL_LABELS[m]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Short description"
          htmlFor="shortDescription"
          required
          hint="One clear sentence about what your company does (10–200 characters)."
          error={errors.shortDescription}
        >
          <Input
            id="shortDescription"
            name="shortDescription"
            defaultValue={initial?.shortDescription ?? ""}
            maxLength={200}
            {...invalidProps("shortDescription", errors.shortDescription)}
          />
        </Field>

        {!disabled ? (
          <div className="pt-2">
            <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}

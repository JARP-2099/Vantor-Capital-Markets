"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { submitFeedback, type FeedbackFormState } from "@/lib/actions/feedback";

const IDLE: FeedbackFormState = { status: "idle" };

const textareaClass =
  "w-full rounded-md border border-line-strong bg-transparent px-3 py-2 text-sm text-ink-900 " +
  "placeholder:text-faint hover:border-faint focus:border-brand transition-colors min-h-32";

export function FeedbackForm() {
  const [state, formAction, pending] = useActionState(submitFeedback, IDLE);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <Field label="How do you use Vantor?" htmlFor="feedback-role" required error={errors.role}>
        <Select id="feedback-role" name="role" defaultValue="" required>
          <option value="" disabled>
            Select one
          </option>
          <option value="founder">Founder</option>
          <option value="investor">Investor</option>
          <option value="other">Other</option>
        </Select>
      </Field>

      <Field
        label="Page or feature"
        htmlFor="feedback-page"
        hint="Optional. For example: Discover, company profile, onboarding."
        error={errors.pagePath}
      >
        <Input id="feedback-page" name="pagePath" maxLength={200} />
      </Field>

      <Field
        label="What happened, or what should be better?"
        htmlFor="feedback-message"
        required
        error={errors.message}
      >
        <textarea
          id="feedback-message"
          name="message"
          maxLength={2000}
          required
          className={textareaClass}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "feedback-message-error" : undefined}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner className="border-white/40 border-t-white" /> : null}
        Send feedback
      </Button>
    </form>
  );
}

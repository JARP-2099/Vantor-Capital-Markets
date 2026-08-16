"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  approveCompanyAction,
  archiveCompanyAction,
  restoreCompanyAction,
  type ReviewActionState,
  sendBackToFounderAction,
  startReviewAction,
  unpublishCompanyAction,
} from "@/lib/actions/admin-review";
import type { CompanyStatus } from "@/lib/constants";

type ReviewAction = (
  prev: ReviewActionState,
  formData: FormData,
) => Promise<ReviewActionState>;

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** Spinner border colors that stay visible on each button background. */
function spinnerClass(variant: ButtonVariant): string | undefined {
  return variant === "primary" || variant === "danger"
    ? "border-white/40 border-t-white"
    : undefined;
}

function StateAlerts({ state }: { state: ReviewActionState }) {
  if (!state) return null;
  if (state.ok) return <Alert tone="success">{state.message ?? "Done."}</Alert>;
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  return null;
}

/** One-click transition (Start review, Approve, Archive confirm, Restore). */
function SimpleActionForm({
  action,
  companyId,
  label,
  variant = "secondary",
}: {
  action: ReviewAction;
  companyId: string;
  label: string;
  variant?: ButtonVariant;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-2">
      <StateAlerts state={state} />
      <input type="hidden" name="companyId" value={companyId} />
      <Button type="submit" variant={variant} disabled={pending} className="w-full">
        {pending ? <Spinner className={spinnerClass(variant)} /> : null}
        {label}
      </Button>
    </form>
  );
}

/** Transition that requires review notes for the founder (send back, unpublish). */
function NotesActionForm({
  action,
  companyId,
  idPrefix,
  buttonLabel,
  variant = "secondary",
  hint,
}: {
  action: ReviewAction;
  companyId: string;
  idPrefix: string;
  buttonLabel: string;
  variant?: ButtonVariant;
  hint: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const notesError = state && !state.ok ? state.fieldErrors?.notes : undefined;
  const notesId = `${idPrefix}-notes`;

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <StateAlerts state={state} />
      <input type="hidden" name="companyId" value={companyId} />
      <Field
        label="Notes to the founder"
        htmlFor={notesId}
        required
        hint={hint}
        error={notesError}
      >
        <Textarea
          id={notesId}
          name="notes"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          aria-invalid={Boolean(notesError)}
          aria-describedby={notesError ? `${notesId}-error` : undefined}
        />
      </Field>
      <Button type="submit" variant={variant} disabled={pending} className="w-full">
        {pending ? <Spinner className={spinnerClass(variant)} /> : null}
        {buttonLabel}
      </Button>
    </form>
  );
}

/**
 * Two-step confirmation for destructive actions: the summary looks like a
 * button; expanding it reveals the real form. Native details/summary — no
 * JS state to get out of sync.
 */
function ConfirmDisclosure({
  summary,
  description,
  children,
}: {
  summary: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-md border border-negative-700/30">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-negative-700 transition-colors hover:bg-negative-50 [&::-webkit-details-marker]:hidden">
        {summary}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-3.5 shrink-0 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </summary>
      <div className="space-y-3 border-t border-negative-700/30 p-3">
        <p className="text-xs text-muted">{description}</p>
        {children}
      </div>
    </details>
  );
}

/**
 * Status-driven review action panel. Which forms render here is convenience
 * only — every server action re-verifies the transition against the
 * company's current status.
 */
export function ReviewActions({
  companyId,
  status,
}: {
  companyId: string;
  status: CompanyStatus;
}) {
  switch (status) {
    case "submitted":
      return (
        <div className="space-y-4">
          <SimpleActionForm
            action={startReviewAction}
            companyId={companyId}
            label="Start review"
            variant="secondary"
          />
          <SimpleActionForm
            action={approveCompanyAction}
            companyId={companyId}
            label="Approve & publish"
            variant="primary"
          />
          <div className="border-t border-line pt-4">
            <NotesActionForm
              action={sendBackToFounderAction}
              companyId={companyId}
              idPrefix="send-back"
              buttonLabel="Send back to founder"
              variant="secondary"
              hint="Required — the founder sees these notes on their draft (10–2,000 characters)."
            />
          </div>
        </div>
      );

    case "under_review":
      return (
        <div className="space-y-4">
          <SimpleActionForm
            action={approveCompanyAction}
            companyId={companyId}
            label="Approve & publish"
            variant="primary"
          />
          <div className="border-t border-line pt-4">
            <NotesActionForm
              action={sendBackToFounderAction}
              companyId={companyId}
              idPrefix="send-back"
              buttonLabel="Send back to founder"
              variant="secondary"
              hint="Required — the founder sees these notes on their draft (10–2,000 characters)."
            />
          </div>
        </div>
      );

    case "published":
      return (
        <div className="space-y-3">
          <ConfirmDisclosure
            summary="Unpublish…"
            description="Removes the profile from the public marketplace and returns it to draft. Notes are required so the founder knows why."
          >
            <NotesActionForm
              action={unpublishCompanyAction}
              companyId={companyId}
              idPrefix="unpublish"
              buttonLabel="Confirm unpublish"
              variant="danger"
              hint="Required — explain why the listing was taken down (10–2,000 characters)."
            />
          </ConfirmDisclosure>
          <ConfirmDisclosure
            summary="Archive…"
            description="Removes the company from all active surfaces. It can be restored to draft later."
          >
            <SimpleActionForm
              action={archiveCompanyAction}
              companyId={companyId}
              label="Confirm archive"
              variant="danger"
            />
          </ConfirmDisclosure>
        </div>
      );

    case "draft":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            This company is in draft — waiting on the founder to submit it for review.
          </p>
          <ConfirmDisclosure
            summary="Archive…"
            description="Removes the company from all active surfaces. It can be restored to draft later."
          >
            <SimpleActionForm
              action={archiveCompanyAction}
              companyId={companyId}
              label="Confirm archive"
              variant="danger"
            />
          </ConfirmDisclosure>
        </div>
      );

    case "archived":
      return (
        <SimpleActionForm
          action={restoreCompanyAction}
          companyId={companyId}
          label="Restore to draft"
          variant="secondary"
        />
      );
  }
}

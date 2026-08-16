"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { adminDecideVerification } from "@/lib/actions/verification";
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_TRANSITIONS,
  type VerificationStatus,
} from "@/lib/verification/constants";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** Maps each legal target status to the decision value the action expects. */
const DECISION_BY_TARGET: Partial<
  Record<
    VerificationStatus,
    { decision: string; label: string; variant: ButtonVariant; className?: string }
  >
> = {
  under_review: { decision: "start_review", label: "Start review", variant: "secondary" },
  verified: { decision: "verify", label: "Mark verified", variant: "primary" },
  partially_verified: {
    decision: "partially_verify",
    label: "Mark partially verified",
    variant: "secondary",
  },
  rejected: { decision: "reject", label: "Reject", variant: "danger" },
  needs_update: {
    decision: "needs_update",
    label: "Request updates",
    variant: "secondary",
    // Caution styling: corrective, not destructive — amber, not red.
    className: "border-warn-700/40 text-warn-700 hover:border-warn-700/60 hover:bg-warn-50",
  },
  expired: { decision: "expire", label: "Mark expired", variant: "secondary" },
};

function spinnerClass(variant: ButtonVariant): string | undefined {
  return variant === "primary" || variant === "danger"
    ? "border-white/40 border-t-white"
    : undefined;
}

/**
 * Decision panel driven by VERIFICATION_TRANSITIONS from the request's
 * current status. Which buttons render here is convenience only — the server
 * action re-verifies every transition against the row's current status.
 */
export function DecisionPanel({
  requestId,
  status,
}: {
  requestId: string;
  status: VerificationStatus;
}) {
  const [state, formAction, pending] = useActionState(adminDecideVerification, null);
  const targets = VERIFICATION_TRANSITIONS[status];

  if (targets.length === 0) {
    return (
      <div className="space-y-3">
        {state?.ok ? <Alert tone="success">{state.message ?? "Done."}</Alert> : null}
        <p className="text-sm text-muted">
          This request is {VERIFICATION_STATUS_LABELS[status]} — no further transitions are
          available. The founder can submit a new request for the category.
        </p>
      </div>
    );
  }

  const founderNoteError = state && !state.ok ? state.fieldErrors?.founderNote : undefined;
  const internalNotesError = state && !state.ok ? state.fieldErrors?.internalNotes : undefined;
  const needsFounderNote = targets.includes("rejected") || targets.includes("needs_update");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.ok ? <Alert tone="success">{state.message ?? "Done."}</Alert> : null}
      {state && !state.ok && state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <input type="hidden" name="requestId" value={requestId} />

      <div className="rounded-md border border-line bg-mist/40 p-3">
        <Field
          label="Internal notes"
          htmlFor="decision-internal-notes"
          hint="Internal — never shown to founders or the public."
          error={internalNotesError}
        >
          <Textarea
            id="decision-internal-notes"
            name="internalNotes"
            rows={3}
            maxLength={2000}
            className="min-h-20"
            aria-invalid={Boolean(internalNotesError)}
            aria-describedby={internalNotesError ? "decision-internal-notes-error" : undefined}
          />
        </Field>
      </div>

      <Field
        label="Note to the founder"
        htmlFor="decision-founder-note"
        hint={
          needsFounderNote
            ? "Shown to the founder. Required for Reject and Request updates."
            : "Shown to the founder. Optional."
        }
        error={founderNoteError}
      >
        <Textarea
          id="decision-founder-note"
          name="founderNote"
          rows={3}
          maxLength={1000}
          className="min-h-20"
          aria-invalid={Boolean(founderNoteError)}
          aria-describedby={founderNoteError ? "decision-founder-note-error" : undefined}
        />
      </Field>

      <div className="space-y-2 border-t border-line pt-4">
        {targets.map((target) => {
          const spec = DECISION_BY_TARGET[target];
          if (!spec) return null;
          return (
            <Button
              key={target}
              type="submit"
              name="decision"
              value={spec.decision}
              variant={spec.variant}
              disabled={pending}
              className={spec.className ? `w-full ${spec.className}` : "w-full"}
            >
              {pending ? <Spinner className={spinnerClass(spec.variant)} /> : null}
              {spec.label}
            </Button>
          );
        })}
      </div>
    </form>
  );
}

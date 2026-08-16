"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ValuationActionState } from "@/lib/actions/valuation";

/**
 * Client forms for the founder valuation page. The server actions arrive
 * pre-bound to the company id (bound in the server component), so no
 * company id crosses the client boundary as mutable form state.
 */

const IDLE: ValuationActionState = {};

type BoundValuationAction = (
  prev: ValuationActionState,
  formData: FormData,
) => Promise<ValuationActionState>;

export function RefreshEstimateForm({
  action,
  label,
  note,
}: {
  action: BoundValuationAction;
  label: string;
  note?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? <Spinner className="border-white/40 border-t-white" /> : null}
          {label}
        </Button>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
    </form>
  );
}

export function VisibilityToggleForm({
  action,
  visible,
}: {
  action: BoundValuationAction;
  /** Current value of company.showPublicValuation. */
  visible: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="show" value={visible ? "false" : "true"} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Button type="submit" variant="secondary" disabled={pending} className="shrink-0">
        {pending ? <Spinner /> : null}
        {visible ? "Hide from public profile" : "Show on public profile"}
      </Button>
    </form>
  );
}

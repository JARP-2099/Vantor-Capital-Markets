"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { setWatchlistState, type WatchActionState } from "@/lib/actions/watchlist";

/**
 * Save/remove controls for the watchlist. Two visual forms share one server
 * action: a compact star for result rows and a labeled button for company
 * profiles and the Watchlist page. The rendered state settles on the server
 * action's answer (never an optimistic lie), and the control is disabled
 * while a mutation is in flight so it cannot double-submit.
 */

const IDLE: WatchActionState = {};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path
        d="M8 1.8l1.86 3.77 4.16.6-3.01 2.94.71 4.14L8 11.3l-3.72 1.95.71-4.14-3.01-2.94 4.16-.6L8 1.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type WatchButtonProps = {
  companyId: string;
  companyName: string;
  /** Current persisted state, from the server render. */
  saved: boolean;
  /** "star": compact icon control; "labeled": full button with text. */
  variant?: "star" | "labeled";
  /** Labeled variant only: text for the saved state (e.g. "Remove"). */
  savedLabel?: string;
};

export function WatchButton({
  companyId,
  companyName,
  saved: savedProp,
  variant = "star",
  savedLabel = "Saved",
}: WatchButtonProps) {
  const [state, formAction, pending] = useActionState(setWatchlistState, IDLE);
  // The last server answer wins; until one exists, trust the server render.
  const saved = state.saved ?? savedProp;
  const actionLabel = saved
    ? `Remove ${companyName} from your watchlist`
    : `Save ${companyName} to your watchlist`;

  return (
    <form action={formAction} className={variant === "star" ? "inline-flex" : "inline-block"}>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="op" value={saved ? "remove" : "save"} />
      {variant === "star" ? (
        <button
          type="submit"
          disabled={pending}
          aria-pressed={saved}
          aria-label={actionLabel}
          title={saved ? "Remove from watchlist" : "Save to watchlist"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            "disabled:pointer-events-none disabled:opacity-50",
            saved
              ? "text-brand-soft hover:bg-mist hover:text-ink-900"
              : "text-faint hover:bg-mist hover:text-ink-900",
          )}
        >
          {pending ? <Spinner /> : <StarIcon filled={saved} />}
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          aria-pressed={saved}
          aria-label={actionLabel}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3.5 text-sm font-medium",
            "transition-colors disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap",
            saved
              ? "border-line-strong bg-mist text-ink-900 hover:border-faint"
              : "border-line-strong bg-transparent text-ink-900 hover:border-faint hover:bg-mist",
          )}
        >
          {pending ? <Spinner /> : <StarIcon filled={saved} />}
          {saved ? savedLabel : "Save"}
        </button>
      )}
      {state.error ? (
        <p
          role="alert"
          className={variant === "star" ? "sr-only" : "mt-1.5 text-xs text-negative-700"}
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/**
 * Signed-out counterpart: same footprint, links to sign-in and returns the
 * user to where they were. Rendered server-side so no session state is
 * needed on the client.
 */
export function SignInToSaveLink({
  next,
  variant = "star",
}: {
  next: string;
  variant?: "star" | "labeled";
}) {
  const href = `/login?next=${encodeURIComponent(next)}`;
  if (variant === "star") {
    return (
      <Link
        href={href}
        aria-label="Sign in to save companies to a watchlist"
        title="Sign in to save"
        className="flex h-8 w-8 items-center justify-center rounded-md text-faint transition-colors hover:bg-mist hover:text-ink-900"
      >
        <StarIcon filled={false} />
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line-strong px-3.5 text-sm font-medium text-ink-900 transition-colors hover:border-faint hover:bg-mist whitespace-nowrap"
    >
      <StarIcon filled={false} />
      Sign in to save
    </Link>
  );
}

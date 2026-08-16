import Link from "next/link";
import { cn } from "@/lib/cn";

export const WIZARD_STEPS = [
  { step: 1, label: "Identity", segment: "identity" },
  { step: 2, label: "Goals", segment: "goals" },
  { step: 3, label: "Metrics", segment: "metrics" },
  { step: 4, label: "Story", segment: "story" },
  { step: 5, label: "Team", segment: "team" },
  { step: 6, label: "Review", segment: "review" },
  { step: 7, label: "Submit", segment: "review" },
] as const;

type WizardProgressProps = {
  /** Null while the draft has not been created yet (step 1, new). */
  companyId: string | null;
  current: number;
};

/**
 * Seven-step progress indicator. Steps before the current one show a check
 * and link back to their page (once a draft exists); later steps are inert.
 */
export function WizardProgress({ companyId, current }: WizardProgressProps) {
  return (
    <nav aria-label="Onboarding progress" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1 sm:gap-2">
        {WIZARD_STEPS.map((s, i) => {
          const done = s.step < current;
          const active = s.step === current;
          const href =
            companyId && done && s.step < 7
              ? `/founder/onboarding/${companyId}/${s.segment}`
              : null;

          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                active && "bg-ink-900 text-canvas",
                done && "bg-positive-50 text-positive-700",
                !active && !done && "bg-mist text-muted",
              )}
            >
              {done ? "✓" : s.step}
            </span>
          );

          const content = (
            <>
              {circle}
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  active ? "text-ink-900" : done ? "text-slate-650" : "text-faint",
                )}
              >
                {s.label}
              </span>
            </>
          );

          return (
            <li key={s.step} className="flex items-center gap-1 sm:gap-2">
              {i > 0 ? <span aria-hidden="true" className="h-px w-3 bg-line sm:w-5" /> : null}
              {href ? (
                <Link
                  href={href}
                  className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-mist"
                  title={`Back to ${s.label}`}
                >
                  {content}
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1.5 px-1 py-1"
                  aria-current={active ? "step" : undefined}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

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
 * Seven-step progress indicator. On mobile it collapses to "Step n of 7" +
 * a segmented bar so every step is always represented — nothing clips.
 * On sm+ it shows the numbered steps; completed ones link back to their page
 * (once a draft exists); later steps are inert.
 */
export function WizardProgress({ companyId, current }: WizardProgressProps) {
  const active = WIZARD_STEPS.find((s) => s.step === current);

  return (
    <nav aria-label="Onboarding progress">
      {/* Mobile: compact, nothing can clip. */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Step {current} of {WIZARD_STEPS.length}
          </p>
          <p className="text-sm font-semibold text-ink-900">{active?.label}</p>
        </div>
        <ol className="mt-2 flex gap-1">
          {WIZARD_STEPS.map((s) => (
            <li
              key={s.step}
              aria-current={s.step === current ? "step" : undefined}
              className={cn(
                "h-1 flex-1 rounded-full",
                s.step <= current ? "bg-accent-600" : "bg-mist",
              )}
            >
              <span className="sr-only">
                {s.label}
                {s.step < current ? " — complete" : s.step === current ? " — current step" : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Desktop: numbered steps with connectors. */}
      <ol className="hidden items-center gap-2 lg:flex">
        {WIZARD_STEPS.map((s, i) => {
          const done = s.step < current;
          const isActive = s.step === current;
          const href =
            companyId && done && s.step < 7
              ? `/founder/onboarding/${companyId}/${s.segment}`
              : null;

          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isActive && "bg-accent-600 text-white",
                done && "bg-accent-50 text-accent-700",
                !isActive && !done && "border border-line-strong bg-paper text-muted",
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
                  "text-sm font-medium",
                  // Circles-only between sm and md so the row never clips.
                  isActive ? "text-ink-900" : "hidden md:inline",
                  !isActive && (done ? "text-slate-650" : "text-faint"),
                )}
              >
                {s.label}
              </span>
            </>
          );

          return (
            <li key={s.step} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden="true" className="h-px w-4 bg-line-strong" /> : null}
              {href ? (
                <Link
                  href={href}
                  className="flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-mist"
                  title={`Back to ${s.label}`}
                >
                  {content}
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1.5 px-1 py-1"
                  aria-current={isActive ? "step" : undefined}
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

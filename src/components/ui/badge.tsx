import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "negative" | "warn" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-mist text-slate-650",
  accent: "bg-accent-50 text-accent-700",
  positive: "bg-positive-50 text-positive-700",
  negative: "bg-negative-50 text-negative-700",
  warn: "bg-warn-50 text-warn-700",
  ink: "bg-ink-900 text-white",
};

const dotTones: Record<Tone, string> = {
  neutral: "bg-faint",
  accent: "bg-accent-600",
  positive: "bg-positive-700",
  negative: "bg-negative-700",
  warn: "bg-warn-700",
  ink: "bg-ink-900",
};

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: Tone;
  /**
   * Status-dot style: transparent background with a small colored dot —
   * quieter than a filled badge. Preferred for status columns and rows so
   * screens don't fill up with colored pills.
   */
  dot?: boolean;
};

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  if (dot) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-slate-650",
          className,
        )}
        {...props}
      >
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotTones[tone])} />
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

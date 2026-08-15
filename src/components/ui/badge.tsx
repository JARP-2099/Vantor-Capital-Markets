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

type BadgeProps = ComponentPropsWithoutRef<"span"> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

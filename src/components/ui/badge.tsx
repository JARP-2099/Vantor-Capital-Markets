import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "negative" | "warn" | "ink";

/*
 * Dark chips: tinted surface + colored text, hairline border, no glow.
 * "accent" is the brand (copper) tone — use sparingly.
 */
const tones: Record<Tone, string> = {
  neutral: "border-line-strong bg-mist text-slate-650",
  accent: "border-brand-deep/50 bg-brand-tint text-brand-soft",
  positive: "border-positive-700/30 bg-positive-50 text-positive-700",
  negative: "border-negative-700/30 bg-negative-50 text-negative-700",
  warn: "border-warn-700/30 bg-warn-50 text-warn-700",
  ink: "border-line-strong bg-raised text-ink-900",
};

type BadgeProps = ComponentPropsWithoutRef<"span"> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

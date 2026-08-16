import { cn } from "@/lib/cn";

/**
 * Quiet, truncated rendering for raw identifiers (user/entity UUIDs). Ids are
 * never primary content — they render small, mono, and de-emphasized, with
 * the full value available on hover/focus via the title attribute.
 */
export function MonoId({
  value,
  chars = 8,
  className,
}: {
  value: string;
  chars?: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono text-xs text-muted", className)} title={value}>
      {value.slice(0, chars)}…
    </span>
  );
}
